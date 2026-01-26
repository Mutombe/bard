"""
SEO Serializers
"""
from rest_framework import serializers

from .models import SEOMetadata, Redirect, StructuredData


class SEOMetadataSerializer(serializers.ModelSerializer):
    """Serializer for SEO metadata."""

    meta_title_display = serializers.SerializerMethodField()
    og_title_display = serializers.SerializerMethodField()
    twitter_title_display = serializers.SerializerMethodField()
    robots_content = serializers.SerializerMethodField()

    class Meta:
        model = SEOMetadata
        fields = [
            "id",
            "meta_title",
            "meta_title_display",
            "meta_description",
            "meta_keywords",
            "canonical_url",
            "no_index",
            "no_follow",
            "og_title",
            "og_title_display",
            "og_description",
            "og_image",
            "og_type",
            "twitter_card",
            "twitter_title",
            "twitter_title_display",
            "twitter_description",
            "twitter_image",
            "sitemap_priority",
            "sitemap_changefreq",
            "robots_content",
        ]

    def get_meta_title_display(self, obj):
        return obj.get_meta_title()

    def get_og_title_display(self, obj):
        return obj.get_og_title()

    def get_twitter_title_display(self, obj):
        return obj.get_twitter_title()

    def get_robots_content(self, obj):
        parts = []
        if obj.no_index:
            parts.append("noindex")
        else:
            parts.append("index")
        if obj.no_follow:
            parts.append("nofollow")
        else:
            parts.append("follow")
        return ", ".join(parts)


class ArticleSEOSerializer(serializers.Serializer):
    """
    Complete SEO data for an article.

    Combines article data with SEO metadata for frontend rendering.
    """

    # Meta tags
    title = serializers.CharField()
    description = serializers.CharField()
    keywords = serializers.CharField(allow_blank=True)
    canonical_url = serializers.URLField()
    robots = serializers.CharField()

    # Open Graph
    og = serializers.DictField()

    # Twitter Card
    twitter = serializers.DictField()

    # Schema.org JSON-LD
    structured_data = serializers.ListField()

    # Breadcrumbs
    breadcrumbs = serializers.ListField()


class RedirectSerializer(serializers.ModelSerializer):
    """Serializer for redirects."""

    class Meta:
        model = Redirect
        fields = [
            "id",
            "from_path",
            "to_path",
            "redirect_type",
            "is_active",
            "is_regex",
            "hit_count",
            "last_hit",
            "notes",
        ]


class StructuredDataSerializer(serializers.ModelSerializer):
    """Serializer for structured data templates."""

    class Meta:
        model = StructuredData
        fields = [
            "id",
            "name",
            "schema_type",
            "template",
            "is_default",
            "description",
        ]


class SitemapEntrySerializer(serializers.Serializer):
    """Serializer for sitemap entries."""

    loc = serializers.URLField()
    lastmod = serializers.DateTimeField()
    changefreq = serializers.CharField()
    priority = serializers.DecimalField(max_digits=2, decimal_places=1)
