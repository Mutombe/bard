"""
Research API Serializers
"""
from rest_framework import serializers

from apps.users.serializers import UserMinimalSerializer
from apps.geography.serializers import CountryMinimalSerializer

from .models import Topic, Industry, ResearchReport, ResearchDownload


class TopicSerializer(serializers.ModelSerializer):
    """Full topic serializer."""

    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "color",
            "is_featured",
            "article_count",
        ]


class TopicMinimalSerializer(serializers.ModelSerializer):
    """Minimal topic serializer for nested use."""

    class Meta:
        model = Topic
        fields = ["id", "name", "slug", "icon", "color"]


class IndustrySerializer(serializers.ModelSerializer):
    """Full industry serializer."""

    class Meta:
        model = Industry
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "color",
            "is_featured",
            "cover_image",
        ]


class IndustryMinimalSerializer(serializers.ModelSerializer):
    """Minimal industry serializer for nested use."""

    class Meta:
        model = Industry
        fields = ["id", "name", "slug", "icon", "color"]


class ResearchReportListSerializer(serializers.ModelSerializer):
    """Serializer for research report listings."""

    lead_author = UserMinimalSerializer(read_only=True)
    topics = TopicMinimalSerializer(many=True, read_only=True)
    industries = IndustryMinimalSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ResearchReport
        fields = [
            "id",
            "title",
            "slug",
            "subtitle",
            "abstract",
            "report_type",
            "cover_image",
            "cover_image_url",
            "image_url",
            "lead_author",
            "topics",
            "industries",
            "status",
            "published_at",
            "is_featured",
            "is_premium",
            "view_count",
            "download_count",
            "read_time_minutes",
            "page_count",
        ]

    def get_image_url(self, obj):
        """Return the best available image URL."""
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return obj.cover_image_url or None


class ResearchReportDetailSerializer(serializers.ModelSerializer):
    """Serializer for full research report details."""

    lead_author = UserMinimalSerializer(read_only=True)
    contributing_authors = UserMinimalSerializer(many=True, read_only=True)
    topics = TopicMinimalSerializer(many=True, read_only=True)
    industries = IndustryMinimalSerializer(many=True, read_only=True)
    countries = CountryMinimalSerializer(many=True, read_only=True)
    related_reports = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ResearchReport
        fields = [
            "id",
            "title",
            "slug",
            "subtitle",
            "abstract",
            "content",
            "key_findings",
            "methodology",
            "data_sources",
            "report_type",
            "topics",
            "industries",
            "countries",
            "lead_author",
            "contributing_authors",
            "external_authors",
            "cover_image",
            "cover_image_url",
            "image_url",
            "pdf_file",
            "status",
            "published_at",
            "is_featured",
            "is_premium",
            "view_count",
            "download_count",
            "read_time_minutes",
            "page_count",
            "meta_title",
            "meta_description",
            "related_reports",
            "created_at",
            "updated_at",
        ]

    def get_image_url(self, obj):
        """Return the best available image URL."""
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return obj.cover_image_url or None

    def get_related_reports(self, obj):
        related = obj.related_from.select_related("related_report__lead_author").all()[:5]
        return ResearchReportListSerializer(
            [r.related_report for r in related],
            many=True,
            context=self.context
        ).data


class ResearchReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating research reports."""

    class Meta:
        model = ResearchReport
        fields = [
            "title",
            "subtitle",
            "abstract",
            "content",
            "key_findings",
            "methodology",
            "data_sources",
            "report_type",
            "topics",
            "industries",
            "countries",
            "related_companies",
            "lead_author",
            "contributing_authors",
            "external_authors",
            "cover_image",
            "pdf_file",
            "status",
            "is_featured",
            "is_premium",
            "page_count",
            "meta_title",
            "meta_description",
        ]


class ResearchDownloadSerializer(serializers.ModelSerializer):
    """Serializer for research downloads."""

    class Meta:
        model = ResearchDownload
        fields = ["id", "report", "created_at"]
        read_only_fields = ["id", "created_at"]
