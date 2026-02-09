"""
News Views
"""
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.core.cache import (
    CacheTTL,
    CacheVersionManager,
    cache_news_list,
    cache_reference_data,
    cache_response,
)
from apps.core.pagination import InfiniteScrollPagination
from apps.users.models import UserRole

from .models import Category, NewsArticle, Tag, Comment, CommentLike
from .serializers import (
    CategorySerializer,
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
    published_after = filters.DateTimeFilter(
        field_name="published_at", lookup_expr="gte"
    )
    published_before = filters.DateTimeFilter(
        field_name="published_at", lookup_expr="lte"
    )

    class Meta:
        model = NewsArticle
        fields = ["category", "content_type", "is_featured", "is_premium"]

    def filter_by_author_name(self, queryset, name, value):
        """Filter articles by author's full name (case-insensitive contains)."""
        from django.db.models import Q
        # Convert slug format (john-doe) to name format for matching
        name_from_slug = value.replace("-", " ")
        return queryset.filter(
            Q(author__first_name__icontains=name_from_slug) |
            Q(author__last_name__icontains=name_from_slug) |
            Q(author__first_name__icontains=value) |
            Q(author__last_name__icontains=value)
        ).distinct()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Category model."""

    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

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
        queryset = super().get_queryset()

        # Non-authenticated users only see published articles
        if not self.request.user.is_authenticated:
            return queryset.filter(status=NewsArticle.Status.PUBLISHED)

        # Editors can see all their articles
        if self.request.user.is_editor:
            return queryset

        # Regular users see published articles
        return queryset.filter(status=NewsArticle.Status.PUBLISHED)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return NewsArticleDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return NewsArticleCreateSerializer
        return NewsArticleListSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsEditorOrReadOnly()]
        return [AllowAny()]

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

        # Increment view count
        instance.increment_view_count()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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

    queryset = Comment.objects.select_related("author", "parent").prefetch_related("replies", "likes")
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
