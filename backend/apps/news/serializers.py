"""
News Serializers
"""
from rest_framework import serializers

from apps.markets.serializers import CompanyMinimalSerializer
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

    class Meta:
        model = NewsArticle
        fields = [
            "id",
            "title",
            "slug",
            "subtitle",
            "excerpt",
            "featured_image",
            "category",
            "content_type",
            "author_name",
            "published_at",
            "is_featured",
            "is_breaking",
            "is_premium",
            "view_count",
            "read_time_minutes",
            "related_companies",
        ]


class NewsArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for full article details."""

    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author = UserSerializer(read_only=True)
    editor = UserSerializer(read_only=True)
    related_companies = CompanyMinimalSerializer(many=True, read_only=True)

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


class NewsArticleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating articles."""

    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
    )
    related_companies = serializers.PrimaryKeyRelatedField(
        queryset="markets.Company",
        many=True,
        required=False,
    )

    class Meta:
        model = NewsArticle
        fields = [
            "title",
            "subtitle",
            "excerpt",
            "content",
            "featured_image",
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
        tags = validated_data.pop("tags", [])
        companies = validated_data.pop("related_companies", [])
        validated_data["author"] = self.context["request"].user

        article = super().create(validated_data)
        article.tags.set(tags)
        article.related_companies.set(companies)

        return article
