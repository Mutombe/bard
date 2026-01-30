"""
News Serializers
"""
from rest_framework import serializers

from apps.markets.models import Company
from apps.markets.serializers import CompanyMinimalSerializer
from apps.media.image_service import get_article_image
from apps.users.serializers import UserSerializer

from .models import Category, NewsArticle, Tag, Comment, CommentLike


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""

    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "color",
            "icon",
            "is_active",
            "order",
            "article_count",
        ]

    def get_article_count(self, obj):
        return obj.articles.filter(status=NewsArticle.Status.PUBLISHED).count()


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""

    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class NewsArticleListSerializer(serializers.ModelSerializer):
    """Serializer for article listings."""

    category = CategorySerializer(read_only=True)
    author = serializers.SerializerMethodField()
    related_companies = CompanyMinimalSerializer(many=True, read_only=True)
    featured_image = serializers.SerializerMethodField()
    image_attribution = serializers.SerializerMethodField()

    class Meta:
        model = NewsArticle
        fields = [
            "id",
            "title",
            "slug",
            "subtitle",
            "excerpt",
            "featured_image",
            "image_attribution",
            "category",
            "content_type",
            "status",
            "source",
            "external_url",
            "external_source_name",
            "author",
            "published_at",
            "created_at",
            "is_featured",
            "is_breaking",
            "is_premium",
            "view_count",
            "read_time_minutes",
            "related_companies",
        ]

    def get_author(self, obj):
        """Return author data with full_name."""
        if obj.author:
            return {
                "id": str(obj.author.id),
                "email": obj.author.email,
                "full_name": obj.author.full_name or obj.author.email,
            }
        return None

    def get_featured_image(self, obj):
        """
        Return image URL with intelligent fallback.

        Priority:
        1. Uploaded featured image
        2. External featured image URL
        3. Dynamic image from Unsplash based on article content
        4. Category-based fallback image
        """
        # Check for uploaded image
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url

        # Check for external image URL
        if obj.featured_image_url:
            return obj.featured_image_url

        # Generate dynamic image based on article content
        category_slug = obj.category.slug if obj.category else ""
        image_data = get_article_image(
            title=obj.title,
            excerpt=obj.excerpt or "",
            category_slug=category_slug,
        )
        return image_data.get("url")

    def get_image_attribution(self, obj):
        """Return image attribution for Unsplash images (list view)."""
        if obj.featured_image or obj.featured_image_url:
            return None

        category_slug = obj.category.slug if obj.category else ""
        image_data = get_article_image(
            title=obj.title,
            excerpt=obj.excerpt or "",
            category_slug=category_slug,
        )

        if image_data.get("source") == "unsplash":
            return {"photographer": image_data.get("photographer")}
        return None


class NewsArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for full article details."""

    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author = UserSerializer(read_only=True)
    editor = UserSerializer(read_only=True)
    related_companies = CompanyMinimalSerializer(many=True, read_only=True)
    featured_image = serializers.SerializerMethodField()
    image_attribution = serializers.SerializerMethodField()

    class Meta:
        model = NewsArticle
        fields = [
            "id",
            "title",
            "slug",
            "subtitle",
            "excerpt",
            "content",
            "featured_image",
            "featured_image_caption",
            "image_attribution",
            "category",
            "tags",
            "content_type",
            "related_companies",
            "author",
            "editor",
            "status",
            "published_at",
            "is_featured",
            "is_breaking",
            "is_premium",
            "view_count",
            "read_time_minutes",
            "meta_title",
            "meta_description",
            "created_at",
            "updated_at",
        ]

    def get_featured_image(self, obj):
        """
        Return image URL with intelligent fallback.

        Priority:
        1. Uploaded featured image
        2. External featured image URL
        3. Dynamic image from Unsplash based on article content
        4. Category-based fallback image
        """
        # Check for uploaded image
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url

        # Check for external image URL
        if obj.featured_image_url:
            return obj.featured_image_url

        # Generate dynamic image based on article content
        category_slug = obj.category.slug if obj.category else ""
        image_data = get_article_image(
            title=obj.title,
            excerpt=obj.excerpt or "",
            category_slug=category_slug,
        )
        return image_data.get("url")

    def get_image_attribution(self, obj):
        """
        Return image attribution for Unsplash images.

        Only returns attribution when a dynamic Unsplash image is used.
        """
        # No attribution needed for uploaded or external images
        if obj.featured_image or obj.featured_image_url:
            return None

        # Get dynamic image data (cached)
        category_slug = obj.category.slug if obj.category else ""
        image_data = get_article_image(
            title=obj.title,
            excerpt=obj.excerpt or "",
            category_slug=category_slug,
        )

        # Only return attribution for Unsplash images
        if image_data.get("source") == "unsplash":
            return {
                "html": image_data.get("attribution"),
                "photographer": image_data.get("photographer"),
            }
        return None


class NewsArticleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating articles."""

    # Accept category by slug for easier frontend integration
    category = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Category.objects.all(),
    )
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
    )
    related_companies = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        many=True,
        required=False,
    )
    # Allow setting external image URL
    featured_image_url = serializers.URLField(
        max_length=500,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = NewsArticle
        fields = [
            "title",
            "subtitle",
            "excerpt",
            "content",
            "featured_image",
            "featured_image_url",
            "featured_image_caption",
            "category",
            "tags",
            "content_type",
            "related_companies",
            "status",
            "is_featured",
            "is_breaking",
            "is_premium",
            "meta_title",
            "meta_description",
        ]

    def create(self, validated_data):
        tag_slugs = validated_data.pop("tags", [])
        companies = validated_data.pop("related_companies", [])
        validated_data["author"] = self.context["request"].user

        article = super().create(validated_data)

        # Get or create tags by slug
        if tag_slugs:
            tag_objects = []
            for slug in tag_slugs:
                # Create tag name from slug (capitalize words)
                name = " ".join(word.capitalize() for word in slug.replace("-", " ").split())
                tag, _ = Tag.objects.get_or_create(
                    slug=slug,
                    defaults={"name": name}
                )
                tag_objects.append(tag)
            article.tags.set(tag_objects)

        if companies:
            article.related_companies.set(companies)

        return article

    def update(self, instance, validated_data):
        tag_slugs = validated_data.pop("tags", None)
        companies = validated_data.pop("related_companies", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Get or create tags by slug
        if tag_slugs is not None:
            tag_objects = []
            for slug in tag_slugs:
                name = " ".join(word.capitalize() for word in slug.replace("-", " ").split())
                tag, _ = Tag.objects.get_or_create(
                    slug=slug,
                    defaults={"name": name}
                )
                tag_objects.append(tag)
            instance.tags.set(tag_objects)

        if companies is not None:
            instance.related_companies.set(companies)

        return instance

    def to_representation(self, instance):
        """
        Custom representation to handle ManyToMany fields properly.
        The ListField for tags works for input but not for output serialization.
        """
        # Build response manually to avoid field serializer issues
        return {
            "id": instance.id,
            "title": instance.title,
            "slug": instance.slug,
            "subtitle": instance.subtitle or "",
            "excerpt": instance.excerpt,
            "content": instance.content,
            "featured_image": instance.featured_image.url if instance.featured_image else None,
            "featured_image_url": instance.featured_image_url or "",
            "featured_image_caption": instance.featured_image_caption or "",
            "category": instance.category.slug if instance.category else None,
            "tags": list(instance.tags.values_list("slug", flat=True)),
            "content_type": instance.content_type,
            "related_companies": list(instance.related_companies.values_list("id", flat=True)),
            "status": instance.status,
            "is_featured": instance.is_featured,
            "is_breaking": instance.is_breaking,
            "is_premium": instance.is_premium,
            "meta_title": instance.meta_title or "",
            "meta_description": instance.meta_description or "",
            "created_at": instance.created_at.isoformat() if instance.created_at else None,
            "updated_at": instance.updated_at.isoformat() if instance.updated_at else None,
        }


# =========================
# Comment Serializers
# =========================

class CommentAuthorSerializer(serializers.Serializer):
    """Lightweight serializer for comment authors."""
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for displaying comments."""

    author = CommentAuthorSerializer(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "article",
            "author",
            "parent",
            "content",
            "likes_count",
            "is_liked",
            "is_approved",
            "is_edited",
            "edited_at",
            "reply_count",
            "can_edit",
            "can_delete",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "author", "likes_count", "is_approved",
            "is_edited", "edited_at", "created_at", "updated_at",
        ]

    def get_is_liked(self, obj):
        """Check if the current user has liked this comment."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_can_edit(self, obj):
        """Check if current user can edit this comment."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

    def get_can_delete(self, obj):
        """Check if current user can delete this comment."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            # Author or staff can delete
            return obj.author == request.user or request.user.is_staff
        return False


class CommentWithRepliesSerializer(CommentSerializer):
    """Serializer for comments with nested replies."""

    replies = serializers.SerializerMethodField()

    class Meta(CommentSerializer.Meta):
        fields = CommentSerializer.Meta.fields + ["replies"]

    def get_replies(self, obj):
        """Get approved replies for this comment."""
        replies = obj.replies.filter(is_approved=True).order_by("created_at")
        return CommentSerializer(replies, many=True, context=self.context).data


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""

    class Meta:
        model = Comment
        fields = ["article", "parent", "content"]

    def validate_parent(self, value):
        """Ensure parent comment belongs to the same article."""
        if value:
            article_id = self.initial_data.get("article")
            if str(value.article_id) != str(article_id):
                raise serializers.ValidationError(
                    "Parent comment must belong to the same article."
                )
            # Prevent deeply nested comments (max 2 levels)
            if value.parent is not None:
                raise serializers.ValidationError(
                    "Cannot reply to a reply. Maximum nesting depth is 2 levels."
                )
        return value

    def validate_content(self, value):
        """Validate comment content."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Comment must be at least 2 characters long."
            )
        return value.strip()

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class CommentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating comments."""

    class Meta:
        model = Comment
        fields = ["content"]

    def validate_content(self, value):
        """Validate comment content."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Comment must be at least 2 characters long."
            )
        return value.strip()

    def update(self, instance, validated_data):
        from django.utils import timezone
        instance.content = validated_data.get("content", instance.content)
        instance.is_edited = True
        instance.edited_at = timezone.now()
        instance.save()
        return instance
