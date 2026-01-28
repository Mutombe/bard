"""
News Serializers
"""
from rest_framework import serializers

from apps.markets.models import Company
from apps.markets.serializers import CompanyMinimalSerializer
from apps.media.image_service import get_article_image
from apps.users.serializers import UserSerializer

from .models import Category, NewsArticle, Tag


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
    author_name = serializers.CharField(source="author.full_name", read_only=True)
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
            "source",
            "external_url",
            "external_source_name",
            "author_name",
            "published_at",
            "is_featured",
            "is_breaking",
            "is_premium",
            "view_count",
            "read_time_minutes",
            "related_companies",
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
        """Convert tags ManyRelatedManager to list of slugs for response."""
        data = super().to_representation(instance)
        # Convert tags M2M to list of slugs
        data["tags"] = list(instance.tags.values_list("slug", flat=True))
        # Convert related_companies M2M to list of IDs
        data["related_companies"] = list(instance.related_companies.values_list("id", flat=True))
        # Convert category to slug
        data["category"] = instance.category.slug if instance.category else None
        return data
