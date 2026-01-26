"""
Columnist Serializers
"""
from rest_framework import serializers

from .models import Columnist, ColumnistStats, ColumnistFollow, Column, ExpertiseArea


class ExpertiseAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpertiseArea
        fields = ["id", "name", "slug", "description", "icon"]


class ColumnistStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColumnistStats
        fields = [
            "total_articles",
            "articles_this_month",
            "articles_this_year",
            "total_views",
            "views_this_month",
            "avg_views_per_article",
            "total_followers",
            "avg_read_time",
            "engagement_score",
            "last_calculated",
        ]


class ColumnistMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for article bylines."""

    class Meta:
        model = Columnist
        fields = [
            "id",
            "display_name",
            "slug",
            "title",
            "headshot",
            "short_bio",
            "verification_status",
        ]


class ColumnistSerializer(serializers.ModelSerializer):
    """Full columnist profile serializer."""

    expertise = ExpertiseAreaSerializer(many=True, read_only=True)
    stats = ColumnistStatsSerializer(read_only=True)
    article_count = serializers.ReadOnlyField()
    total_views = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Columnist
        fields = [
            "id",
            "display_name",
            "slug",
            "columnist_type",
            "title",
            "organization",
            "short_bio",
            "full_bio",
            "credentials",
            "expertise",
            "headshot",
            "headshot_credit",
            "banner_image",
            "twitter_handle",
            "linkedin_url",
            "website_url",
            "email_public",
            "primary_region",
            "verification_status",
            "is_active",
            "is_featured",
            "joined_date",
            "show_article_count",
            "allow_follow",
            "newsletter_enabled",
            "article_count",
            "total_views",
            "stats",
            "is_following",
            "created_at",
        ]

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return ColumnistFollow.objects.filter(
                user=request.user, columnist=obj
            ).exists()
        return False


class ColumnSerializer(serializers.ModelSerializer):
    """Serializer for Column/Series."""

    columnist = ColumnistMinimalSerializer(read_only=True)
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Column
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "columnist",
            "cover_image",
            "frequency",
            "publish_day",
            "is_active",
            "is_premium",
            "article_count",
        ]

    def get_article_count(self, obj):
        return obj.articles.filter(status="published").count() if hasattr(obj, "articles") else 0


class ColumnistFollowSerializer(serializers.ModelSerializer):
    columnist = ColumnistMinimalSerializer(read_only=True)

    class Meta:
        model = ColumnistFollow
        fields = ["id", "columnist", "created_at"]
