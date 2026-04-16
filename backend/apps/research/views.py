"""
Research API Views
"""
from django.db import models
from django.db.models import Count, Sum
from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Industry,
    ResearchDownload,
    ResearchLike,
    ResearchReport,
    ResearchSave,
    Topic,
)
from .serializers import (
    TopicSerializer,
    TopicMinimalSerializer,
    IndustrySerializer,
    IndustryMinimalSerializer,
    ResearchReportListSerializer,
    ResearchReportDetailSerializer,
    ResearchReportCreateSerializer,
)


class TopicViewSet(viewsets.ModelViewSet):
    """
    API endpoint for topics.

    list: Get all active topics
    retrieve: Get topic details
    featured: Get featured topics
    """

    queryset = Topic.objects.filter(is_active=True)
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None  # Topics are typically a small list
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "order"]
    ordering = ["order", "name"]

    def get_serializer_class(self):
        if self.action == "list":
            return TopicMinimalSerializer
        return TopicSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured topics."""
        featured = self.queryset.filter(is_featured=True)
        serializer = TopicMinimalSerializer(featured, many=True)
        return Response(serializer.data)


class IndustryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for industries.

    list: Get all active industries
    retrieve: Get industry details
    featured: Get featured industries
    """

    queryset = Industry.objects.filter(is_active=True)
    serializer_class = IndustrySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None  # Industries are typically a small list
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "order"]
    ordering = ["order", "name"]

    def get_serializer_class(self):
        if self.action == "list":
            return IndustryMinimalSerializer
        return IndustrySerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured industries."""
        featured = self.queryset.filter(is_featured=True)
        serializer = IndustryMinimalSerializer(featured, many=True)
        return Response(serializer.data)


class ResearchReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for research reports.

    list: Get all published research reports
    retrieve: Get research report details
    featured: Get featured research reports
    download: Track and initiate report download
    """

    queryset = ResearchReport.objects.select_related("lead_author").prefetch_related(
        "topics", "industries", "countries", "contributing_authors"
    )
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["report_type", "status", "is_featured", "is_premium"]
    search_fields = ["title", "abstract", "content"]
    ordering_fields = ["published_at", "view_count", "download_count", "created_at"]
    ordering = ["-is_featured", "-published_at"]

    def get_queryset(self):
        # Scheduled-content gate
        from apps.editorial.scheduler import run_scheduler_if_due
        run_scheduler_if_due()

        queryset = super().get_queryset()
        # Non-staff users only see published reports
        if not self.request.user.is_staff:
            queryset = queryset.filter(status="published")

        # Filter by topic
        topic = self.request.query_params.get("topic")
        if topic:
            queryset = queryset.filter(topics__slug=topic)

        # Filter by industry
        industry = self.request.query_params.get("industry")
        if industry:
            queryset = queryset.filter(industries__slug=industry)

        # Filter by country
        country = self.request.query_params.get("country")
        if country:
            queryset = queryset.filter(countries__code=country)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return ResearchReportListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return ResearchReportCreateSerializer
        return ResearchReportDetailSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Dedup views per visitor for 30 min so refresh spam doesn't inflate
        # the counter. Same (report, visitor) counted at most once per window.
        from django.core.cache import cache
        from apps.analytics.geoip import (
            get_client_ip,
            get_visitor_key,
            lookup_geo,
            detect_source,
        )

        ip = get_client_ip(request)
        visitor_id = get_visitor_key(request) or ip or "unknown"
        dedup_key = f"viewed:report:{instance.pk}:{visitor_id}"
        already_counted = cache.get(dedup_key)

        if not already_counted:
            cache.set(dedup_key, True, 60 * 30)  # 30 min TTL
            instance.increment_view_count()

            try:
                from .models import ResearchView

                geo = lookup_geo(ip)
                referrer = request.META.get("HTTP_REFERER", "")

                ResearchView.objects.create(
                    report=instance,
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

    @action(detail=True, methods=["post"], permission_classes=[])
    def like(self, request, slug=None):
        """Toggle like on a research report. Works for both registered and anonymous."""
        from apps.analytics.geoip import get_client_ip, get_visitor_key, lookup_geo

        report = self.get_object()
        ip = get_client_ip(request)
        visitor_id = get_visitor_key(request)
        geo = lookup_geo(ip)

        lookup = (
            {"user": request.user}
            if request.user.is_authenticated
            else {"user__isnull": True, "session_key": visitor_id}
        )
        existing = ResearchLike.objects.filter(report=report, **lookup).first()

        if existing:
            existing.delete()
            liked = False
        else:
            ResearchLike.objects.create(
                report=report,
                user=request.user if request.user.is_authenticated else None,
                session_key=visitor_id[:40],
                ip_address=ip or None,
                country=geo["country"],
            )
            liked = True

        report.recount_likes()
        report.refresh_from_db(fields=["likes_count"])
        return Response({"liked": liked, "likes_count": report.likes_count})

    @action(detail=True, methods=["post"], permission_classes=[], url_path="save")
    def save_report(self, request, slug=None):
        """Toggle save/bookmark on a research report. Works for both registered and anonymous."""
        from apps.analytics.geoip import get_client_ip, get_visitor_key, lookup_geo

        report = self.get_object()
        ip = get_client_ip(request)
        visitor_id = get_visitor_key(request)
        geo = lookup_geo(ip)

        lookup = (
            {"user": request.user}
            if request.user.is_authenticated
            else {"user__isnull": True, "session_key": visitor_id}
        )
        existing = ResearchSave.objects.filter(report=report, **lookup).first()

        if existing:
            existing.delete()
            saved = False
        else:
            ResearchSave.objects.create(
                report=report,
                user=request.user if request.user.is_authenticated else None,
                session_key=visitor_id[:40],
                ip_address=ip or None,
                country=geo["country"],
            )
            saved = True

        report.recount_saves()
        report.refresh_from_db(fields=["saves_count"])
        return Response({"saved": saved, "saves_count": report.saves_count})

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured research reports."""
        featured = self.get_queryset().filter(is_featured=True, status="published")[:6]
        serializer = ResearchReportListSerializer(featured, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[])
    def counts(self, request):
        """Counts per report_type + has_new flag for nav badges."""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        published = ResearchReport.objects.filter(status="published")

        type_counts = {}
        for report_type, _ in ResearchReport.ReportType.choices:
            type_counts[report_type] = published.filter(report_type=report_type).count()

        has_new = published.filter(published_at__gte=thirty_days_ago).exists()
        new_count = published.filter(published_at__gte=thirty_days_ago).count()

        return Response({
            "by_type": type_counts,
            "total": published.count(),
            "has_new": has_new,
            "new_count": new_count,
        })

    @action(detail=True, methods=["post"], permission_classes=[])
    def download(self, request, slug=None):
        """Track research report download."""
        from apps.analytics.geoip import get_client_ip, lookup_geo
        report = self.get_object()

        # Check premium access
        if report.is_premium and not (request.user.is_authenticated and getattr(request.user, "has_premium", False)):
            return Response(
                {"error": "Premium subscription required to download this report."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Track download with geo
        ip = get_client_ip(request)
        geo = lookup_geo(ip)
        ResearchDownload.objects.create(
            report=report,
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key or "",
            ip_address=ip or None,
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            country=geo["country"],
            country_name=geo["country_name"],
            city=geo["city"],
        )

        # Increment download count
        report.increment_download_count()

        return Response({
            "message": "Download tracked",
            "pdf_url": report.pdf_file.url if report.pdf_file else (report.pdf_url if hasattr(report, 'pdf_url') else None),
        })

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR")

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get research statistics for admin dashboard."""
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )

        total = ResearchReport.objects.count()
        published = ResearchReport.objects.filter(status="published").count()
        drafts = ResearchReport.objects.filter(status="draft").count()
        in_review = ResearchReport.objects.filter(status="review").count()

        # This month
        from django.utils import timezone
        from datetime import timedelta
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month = ResearchReport.objects.filter(
            status="published",
            published_at__gte=month_start
        ).count()

        # Total downloads / likes / saves / views
        agg = ResearchReport.objects.aggregate(
            total_downloads=models.Sum("download_count"),
            total_views=models.Sum("view_count"),
            total_likes=models.Sum("likes_count"),
            total_saves=models.Sum("saves_count"),
        )

        return Response({
            "total": total,
            "published": published,
            "drafts": drafts,
            "in_review": in_review,
            "this_month": this_month,
            "total_downloads": agg["total_downloads"] or 0,
            "total_views": agg["total_views"] or 0,
            "total_likes": agg["total_likes"] or 0,
            "total_saves": agg["total_saves"] or 0,
        })
