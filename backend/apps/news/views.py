"""
News Views
"""
import logging

from django.db import IntegrityError
from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)

from apps.core.cache import (
    CacheTTL,
    CacheVersionManager,
    cache_news_list,
    cache_reference_data,
    cache_response,
)
from apps.core.pagination import InfiniteScrollPagination
from apps.users.models import UserRole

from .models import (
    ArticleLike,
    ArticleSave,
    Category,
    NewsArticle,
    Tag,
    Comment,
    CommentLike,
)
from .serializers import (
    CategorySerializer,
    NewsArticleAdminListSerializer,
    NewsArticleCreateSerializer,
    NewsArticleDetailSerializer,
    NewsArticleListSerializer,
    TagSerializer,
    CommentSerializer,
    CommentWithRepliesSerializer,
    CommentCreateSerializer,
    CommentUpdateSerializer,
)


class IsEditorOrReadOnly(BasePermission):
    """Permission class for editor-only write access."""

    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True
        return request.user.is_authenticated and request.user.is_editor


class NewsArticleFilter(filters.FilterSet):
    """Filter for NewsArticle queryset."""

    category = filters.CharFilter(field_name="category__slug")
    tag = filters.CharFilter(field_name="tags__slug")
    content_type = filters.CharFilter()
    company = filters.UUIDFilter(field_name="related_companies__id")
    author = filters.UUIDFilter(field_name="author__id")
    author_name = filters.CharFilter(method="filter_by_author_name")
    is_featured = filters.BooleanFilter()
    is_premium = filters.BooleanFilter()
    source = filters.CharFilter(method="filter_by_source")
    published_after = filters.DateTimeFilter(
        field_name="published_at", lookup_expr="gte"
    )
    published_before = filters.DateTimeFilter(
        field_name="published_at", lookup_expr="lte"
    )

    class Meta:
        model = NewsArticle
        fields = ["category", "content_type", "is_featured", "is_premium", "source"]

    def filter_by_source(self, queryset, name, value):
        """
        Filter by source. Supports:
        - source=editorial (in-house articles)
        - source=scraped (anything from automated scrapers)
        """
        if not value:
            return queryset
        if value == "editorial":
            return queryset.filter(source="editorial")
        if value == "scraped":
            # Anything NOT editorial = scraped (catches serpapi, scraped, polygon, etc.)
            return queryset.exclude(source="editorial")
        # Exact match for any other value
        return queryset.filter(source=value)

    def filter_by_author_name(self, queryset, name, value):
        """Filter articles by author's name or email (case-insensitive)."""
        from django.db.models import Q
        # Split slug format (john-doe) into words for matching
        words = value.replace("-", " ").split()
        slug_joined = value.replace("-", "")  # "adminbardiq" for email matching

        # Build the query conditions
        q_filter = Q()

        if len(words) >= 2:
            # For multi-word names, match first word to first_name AND last word to last_name
            first_word = words[0]
            last_word = words[-1]
            q_filter |= Q(author__first_name__iexact=first_word, author__last_name__iexact=last_word)
            q_filter |= Q(author__first_name__iexact=last_word, author__last_name__iexact=first_word)
            q_filter |= Q(author__first_name__icontains=first_word, author__last_name__icontains=last_word)
            q_filter |= Q(author__first_name__icontains=last_word, author__last_name__icontains=first_word)
        elif len(words) == 1:
            # Single word - search in either first_name or last_name
            word = words[0]
            q_filter |= Q(author__first_name__icontains=word)
            q_filter |= Q(author__last_name__icontains=word)

        # Email fallback - match email username (before @) with the slug
        # e.g., "admin-bardiq" matches "adminbardiq@example.com" or "admin.bardiq@..."
        q_filter |= Q(author__email__istartswith=slug_joined)
        q_filter |= Q(author__email__istartswith=value)  # "admin-bardiq@..."
        for word in words:
            q_filter |= Q(author__email__istartswith=word)  # "admin@..." or "bardiq@..."

        return queryset.filter(q_filter).distinct()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Category model."""

    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        from django.db.models import Count, Q
        return super().get_queryset().annotate(
            article_count=Count(
                'articles',
                filter=Q(articles__status=NewsArticle.Status.PUBLISHED),
            )
        )

    @cache_reference_data
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @cache_reference_data
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Tag model."""

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    @cache_reference_data
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class NewsArticleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for NewsArticle model.

    Endpoints:
    - GET /news/ - List published articles
    - GET /news/{slug}/ - Get article details
    - POST /news/ - Create article (editors only)
    - GET /news/featured/ - Featured articles
    - GET /news/breaking/ - Breaking news
    - GET /news/by-company/{company_id}/ - Articles related to a company
    """

    # Optimized queryset with select_related for ForeignKey and prefetch_related for ManyToMany
    queryset = NewsArticle.objects.select_related(
        "category",
        "author",
        "author__profile",
        "writer",
        "editor",
    ).prefetch_related(
        "tags",
        "related_companies",
    )
    serializer_class = NewsArticleListSerializer
    permission_classes = [AllowAny]
    pagination_class = InfiniteScrollPagination
    filterset_class = NewsArticleFilter
    search_fields = ["title", "excerpt", "content"]
    lookup_field = "slug"

    def get_queryset(self):
        # Scheduled-content gate: promote any articles/research whose
        # scheduled time has passed (cache-gated, runs max 1x/2min)
        from apps.editorial.scheduler import run_scheduler_if_due
        run_scheduler_if_due()

        queryset = super().get_queryset()

        is_editor_request = (
            self.request.user.is_authenticated and self.request.user.is_editor
        )

        # Non-authenticated users only see published articles
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status=NewsArticle.Status.PUBLISHED)
        elif not is_editor_request:
            # Regular users see published articles
            queryset = queryset.filter(status=NewsArticle.Status.PUBLISHED)

        # For feed listings: scraped articles need 500+ chars to filter stubs,
        # and any article shown on the reader feed needs an image.
        #
        # IMPORTANT: Editors hitting this endpoint via /admin/articles MUST
        # see drafts, half-written pieces, and articles without images — those
        # are exactly the rows they need to edit. Skip both filters for
        # editors; this also avoids the Length("content") full-table scan on
        # the admin list which was the hottest part of the query plan.
        if self.action == "list" and not is_editor_request:
            from django.db.models.functions import Length
            queryset = queryset.annotate(_content_len=Length("content"))
            queryset = queryset.filter(
                Q(source="editorial") | Q(_content_len__gte=500)
            )
            queryset = queryset.filter(
                Q(featured_image__gt="") | Q(featured_image_url__gt="")
            )

        # Drop the heavy prefetches for the admin list view — the admin
        # serializer doesn't render tags or related_companies, so hydrating
        # those M2Ms is pure waste (extra queries + payload bytes).
        if self.action == "list" and is_editor_request:
            queryset = queryset.select_related(
                "category", "author", "writer"
            )
            # Reset the inherited prefetches — Django keeps them on the
            # default manager queryset otherwise.
            queryset = queryset.prefetch_related(None)

        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return NewsArticleDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return NewsArticleCreateSerializer
        # Editors hitting the list action get a lean serializer tailored for
        # the admin table — no rich image building, no related_companies w/
        # price data, no writer profile. Cuts response payload ~3-5x.
        if (
            self.action == "list"
            and self.request.user.is_authenticated
            and self.request.user.is_editor
        ):
            return NewsArticleAdminListSerializer
        return NewsArticleListSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsEditorOrReadOnly()]
        return [AllowAny()]

    @cache_news_list
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Create article with specific error messages instead of 500 HTML."""
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            msg = str(e).lower()
            if "slug" in msg:
                return Response(
                    {"title": "An article with a similar title already exists. "
                              "Please change the title to make it unique."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            logger.exception("IntegrityError on article create")
            return Response(
                {"detail": "Database conflict. A field value collides with an "
                           "existing record.", "error": str(e)[:200]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("Unexpected error on article create")
            return Response(
                {"detail": f"{type(e).__name__}: {str(e)[:300]}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        """Update article with specific error messages instead of 500 HTML."""
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError as e:
            msg = str(e).lower()
            if "slug" in msg:
                return Response(
                    {"title": "Another article already uses this slug/title."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            logger.exception("IntegrityError on article update")
            return Response(
                {"detail": "Database conflict.", "error": str(e)[:200]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("Unexpected error on article update")
            return Response(
                {"detail": f"{type(e).__name__}: {str(e)[:300]}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def retrieve(self, request, *args, **kwargs):
        """Get article and increment view count."""
        instance = self.get_object()

        # Check premium access
        if instance.is_premium:
            if not request.user.is_authenticated:
                # Return truncated content for non-authenticated users
                serializer = self.get_serializer(instance)
                data = serializer.data
                data["content"] = data["content"][:500] + "..."
                data["requires_subscription"] = True
                return Response(data)

            if not request.user.can_access_premium:
                serializer = self.get_serializer(instance)
                data = serializer.data
                data["content"] = data["content"][:500] + "..."
                data["requires_subscription"] = True
                return Response(data)

        # Dedup views per visitor for 30 minutes so refresh spam doesn't
        # inflate the counter. Same (article, visitor) counted at most once
        # per window — both in the aggregate counter and the ArticleView log.
        from django.core.cache import cache
        from apps.analytics.geoip import (
            get_client_ip,
            get_visitor_key,
            lookup_geo,
            detect_source,
        )

        ip = get_client_ip(request)
        visitor_id = get_visitor_key(request) or ip or "unknown"
        dedup_key = f"viewed:article:{instance.pk}:{visitor_id}"
        already_counted = cache.get(dedup_key)

        if not already_counted:
            cache.set(dedup_key, True, 60 * 30)  # 30 min TTL
            instance.increment_view_count()

            # Track view with geo + user info (silent fail — analytics shouldn't break reading)
            try:
                from .models import ArticleView

                geo = lookup_geo(ip)
                referrer = request.META.get("HTTP_REFERER", "")

                ArticleView.objects.create(
                    article=instance,
                    user=request.user if request.user.is_authenticated else None,
                    session_key=visitor_id[:40],
                    ip_address=ip or None,
                    user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                    referrer=referrer[:200],
                    country=geo["country"],
                    country_name=geo["country_name"],
                    city=geo["city"],
                    region=geo["region"],
                    source=detect_source(referrer),
                )
            except Exception:
                pass

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="send-featured-email",
        permission_classes=[IsAuthenticated, IsEditorOrReadOnly],
    )
    def send_featured_email(self, request, slug=None):
        """
        Manually trigger the featured-article email blast to all verified
        breaking-news subscribers. Editors can re-send even if the automatic
        signal already fired (e.g. after fixing a typo or swapping the image).
        """
        article = self.get_object()

        if not article.is_featured:
            return Response(
                {"detail": "Article must be marked as featured before sending."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if article.status != NewsArticle.Status.PUBLISHED:
            return Response(
                {"detail": "Article must be published before sending."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.engagement.models import NewsletterSubscription
        subscriber_count = NewsletterSubscription.objects.filter(
            newsletter_type=NewsletterSubscription.NewsletterType.BREAKING_NEWS,
            is_active=True,
            is_verified=True,
        ).count()

        if subscriber_count == 0:
            return Response(
                {"detail": "No verified breaking-news subscribers to notify.",
                 "sent": 0},
                status=status.HTTP_200_OK,
            )

        # Dispatch to the existing worker so the request returns immediately.
        from django_q.tasks import async_task
        async_task(
            "apps.news.signals._send_featured_article_emails",
            str(article.id),
            task_name=f"featured-article-manual-{article.slug}",
        )

        return Response(
            {
                "detail": f"Sending featured-article email to {subscriber_count} "
                          "subscriber(s). Delivery runs in the background.",
                "sent": subscriber_count,
                "article": article.slug,
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def like(self, request, slug=None):
        """Toggle like on an article. Works for both registered and anonymous."""
        from apps.analytics.geoip import get_client_ip, get_visitor_key, lookup_geo

        article = self.get_object()
        ip = get_client_ip(request)
        visitor_id = get_visitor_key(request)
        geo = lookup_geo(ip)

        lookup = (
            {"user": request.user}
            if request.user.is_authenticated
            else {"user__isnull": True, "session_key": visitor_id}
        )
        existing = ArticleLike.objects.filter(article=article, **lookup).first()

        if existing:
            existing.delete()
            liked = False
        else:
            ArticleLike.objects.create(
                article=article,
                user=request.user if request.user.is_authenticated else None,
                session_key=visitor_id[:40],
                ip_address=ip or None,
                country=geo["country"],
            )
            liked = True

        article.recount_likes()
        article.refresh_from_db(fields=["likes_count"])
        return Response({"liked": liked, "likes_count": article.likes_count})

    @action(detail=True, methods=["post"], permission_classes=[AllowAny], url_path="save")
    def save_article(self, request, slug=None):
        """Toggle save/bookmark on an article. Works for both registered and anonymous."""
        from apps.analytics.geoip import get_client_ip, get_visitor_key, lookup_geo

        article = self.get_object()
        ip = get_client_ip(request)
        visitor_id = get_visitor_key(request)
        geo = lookup_geo(ip)

        lookup = (
            {"user": request.user}
            if request.user.is_authenticated
            else {"user__isnull": True, "session_key": visitor_id}
        )
        existing = ArticleSave.objects.filter(article=article, **lookup).first()

        if existing:
            existing.delete()
            saved = False
        else:
            ArticleSave.objects.create(
                article=article,
                user=request.user if request.user.is_authenticated else None,
                session_key=visitor_id[:40],
                ip_address=ip or None,
                country=geo["country"],
            )
            saved = True

        article.recount_saves()
        article.refresh_from_db(fields=["saves_count"])
        return Response({"saved": saved, "saves_count": article.saves_count})

    @action(detail=False, methods=["get"])
    @cache_response(ttl=CacheTTL.SHORT, key_prefix="news_featured")
    def featured(self, request):
        """Get featured articles."""
        articles = self.get_queryset().filter(
            is_featured=True, status=NewsArticle.Status.PUBLISHED
        )[:10]
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    @cache_response(ttl=CacheTTL.VERY_SHORT, key_prefix="news_breaking")
    def breaking(self, request):
        """Get breaking news."""
        articles = self.get_queryset().filter(
            is_breaking=True, status=NewsArticle.Status.PUBLISHED
        )[:5]
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path=r"by-company/(?P<company_id>[^/.]+)")
    @cache_response(ttl=CacheTTL.SHORT, key_prefix="news_by_company")
    def by_company(self, request, company_id=None):
        """Get articles related to a specific company."""
        articles = self.get_queryset().filter(
            related_companies__id=company_id, status=NewsArticle.Status.PUBLISHED
        )
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def publish(self, request, slug=None):
        """Publish an article (editors only)."""
        if not request.user.is_editor:
            return Response(
                {"error": "Only editors can publish articles"},
                status=status.HTTP_403_FORBIDDEN,
            )

        article = self.get_object()
        article.editor = request.user
        article.publish()

        serializer = NewsArticleDetailSerializer(article)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete an article (editors only)."""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error deleting article: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to delete article: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get", "delete", "patch"], url_path=r"by-id/(?P<article_id>[0-9a-f-]+)")
    def by_id(self, request, article_id=None):
        """Get, update, or delete an article by ID/UUID."""
        if request.method == "GET":
            # Get article by ID
            try:
                queryset = self.get_queryset()
                article = queryset.get(id=article_id)

                # Check premium access like in retrieve
                if article.is_premium:
                    if not request.user.is_authenticated:
                        serializer = NewsArticleDetailSerializer(article)
                        data = serializer.data
                        data["content"] = data["content"][:500] + "..."
                        data["requires_subscription"] = True
                        return Response(data)

                    if not request.user.can_access_premium:
                        serializer = NewsArticleDetailSerializer(article)
                        data = serializer.data
                        data["content"] = data["content"][:500] + "..."
                        data["requires_subscription"] = True
                        return Response(data)

                serializer = NewsArticleDetailSerializer(article)
                return Response(serializer.data)
            except NewsArticle.DoesNotExist:
                return Response(
                    {"error": f"Article with ID {article_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        elif request.method == "DELETE":
            # Delete article by ID
            if not request.user.is_editor:
                return Response(
                    {"error": "Only editors can delete articles"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            try:
                article = NewsArticle.objects.get(id=article_id)
                title = article.title
                article.delete()
                return Response(
                    {"message": f"Article '{title}' deleted successfully"},
                    status=status.HTTP_200_OK,
                )
            except NewsArticle.DoesNotExist:
                return Response(
                    {"error": f"Article with ID {article_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting article by ID: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Failed to delete article: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        elif request.method == "PATCH":
            # Update article by ID
            if not request.user.is_editor:
                return Response(
                    {"error": "Only editors can update articles"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            try:
                article = NewsArticle.objects.get(id=article_id)
                serializer = NewsArticleCreateSerializer(article, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(NewsArticleDetailSerializer(article).data)
            except NewsArticle.DoesNotExist:
                return Response(
                    {"error": f"Article with ID {article_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comment model.

    Endpoints:
    - GET /comments/?article={id} - List comments for an article
    - POST /comments/ - Create a comment
    - PATCH /comments/{id}/ - Update own comment
    - DELETE /comments/{id}/ - Delete own comment or staff
    - POST /comments/{id}/like/ - Like/unlike a comment
    """

    queryset = Comment.objects.select_related("author", "author__profile", "parent").prefetch_related("replies", "likes")
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Filter comments by article and approval status."""
        queryset = super().get_queryset()

        # Filter by article if specified
        article_id = self.request.query_params.get("article")
        if article_id:
            queryset = queryset.filter(article_id=article_id)

        # Only show approved comments for non-staff
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True)

        # Only get top-level comments (not replies) for list view
        if self.action == "list":
            queryset = queryset.filter(parent__isnull=True)

        return queryset.order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return CommentWithRepliesSerializer
        if self.action == "create":
            return CommentCreateSerializer
        if self.action in ["update", "partial_update"]:
            return CommentUpdateSerializer
        return CommentSerializer

    def get_permissions(self):
        if self.action in ["create", "like"]:
            return [IsAuthenticated()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]

    def update(self, request, *args, **kwargs):
        """Only allow users to update their own comments."""
        comment = self.get_object()
        if comment.author != request.user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Only allow users to update their own comments."""
        comment = self.get_object()
        if comment.author != request.user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Allow users to delete their own comments or staff to delete any."""
        comment = self.get_object()
        if comment.author != request.user and not request.user.is_staff:
            return Response(
                {"error": "You can only delete your own comments"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        """Like or unlike a comment."""
        comment = self.get_object()

        # Check if already liked
        existing_like = CommentLike.objects.filter(
            comment=comment, user=request.user
        ).first()

        if existing_like:
            # Unlike
            existing_like.delete()
            comment.likes_count = max(0, comment.likes_count - 1)
            comment.save(update_fields=["likes_count"])
            return Response({
                "liked": False,
                "likes_count": comment.likes_count,
            })
        else:
            # Like
            CommentLike.objects.create(comment=comment, user=request.user)
            comment.likes_count += 1
            comment.save(update_fields=["likes_count"])
            return Response({
                "liked": True,
                "likes_count": comment.likes_count,
            })

    @action(detail=False, methods=["get"], url_path=r"article/(?P<article_id>[0-9a-f-]+)")
    def by_article(self, request, article_id=None):
        """Get all comments for an article with pagination."""
        queryset = self.get_queryset().filter(
            article_id=article_id,
            parent__isnull=True
        ).order_by("-created_at")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = CommentWithRepliesSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = CommentWithRepliesSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def unsplash_image_view(request):
    """Return an HD Unsplash image URL based on a search query."""
    from apps.media.image_service import ArticleImageService

    query = request.query_params.get("q", "business finance")
    service = ArticleImageService()
    result = service.get_image_for_article(
        title=query,
        category_slug="business",
    )
    return Response({"url": result.get("url", "")})
