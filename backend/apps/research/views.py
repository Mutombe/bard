"""
Research API Views
"""
from django.db import models
from django.db.models import Count, Sum
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Topic, Industry, ResearchReport, ResearchDownload
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
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["report_type", "status", "is_featured", "is_premium"]
    search_fields = ["title", "abstract", "content"]
    ordering_fields = ["published_at", "view_count", "download_count", "created_at"]
    ordering = ["-is_featured", "-published_at"]

    def get_queryset(self):
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
        # Increment view count
        instance.increment_view_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured research reports."""
        featured = self.get_queryset().filter(is_featured=True, status="published")[:6]
        serializer = ResearchReportListSerializer(featured, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def download(self, request, slug=None):
        """Track research report download."""
        report = self.get_object()

        # Check premium access
        if report.is_premium and not (request.user.is_authenticated and hasattr(request.user, "has_premium")):
            return Response(
                {"error": "Premium subscription required to download this report."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Track download
        ResearchDownload.objects.create(
            report=report,
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key or "",
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        # Increment download count
        report.increment_download_count()

        return Response({
            "message": "Download tracked",
            "pdf_url": report.pdf_file.url if report.pdf_file else None,
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

        # Total downloads
        total_downloads = ResearchReport.objects.aggregate(
            total=models.Sum("download_count")
        )["total"] or 0

        return Response({
            "total": total,
            "published": published,
            "drafts": drafts,
            "in_review": in_review,
            "this_month": this_month,
            "total_downloads": total_downloads,
        })
