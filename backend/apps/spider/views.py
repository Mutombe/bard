"""
Spider Monitoring Views
"""
from datetime import timedelta

from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin

from .models import SpiderJob, DataQualityCheck, SpiderConfig, ScrapedContent
from .serializers import (
    SpiderJobSerializer,
    SpiderJobDetailSerializer,
    DataQualityCheckSerializer,
    SpiderConfigSerializer,
    ScrapedContentSerializer,
    ScrapedContentListSerializer,
    SpiderDashboardSerializer,
    TriggerSpiderSerializer,
)


class SpiderJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Spider Job monitoring.
    """

    queryset = SpiderJob.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["spider_type", "status", "triggered_by"]
    ordering_fields = ["created_at", "duration_seconds", "items_scraped"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SpiderJobDetailSerializer
        return SpiderJobSerializer

    @action(detail=False, methods=["get"])
    def by_spider(self, request):
        """Get jobs grouped by spider type."""
        spider_type = request.query_params.get("spider_type")
        limit = int(request.query_params.get("limit", 10))

        jobs = self.get_queryset()
        if spider_type:
            jobs = jobs.filter(spider_type=spider_type)

        jobs = jobs.order_by("-created_at")[:limit]
        serializer = SpiderJobSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get aggregated job statistics."""
        days = int(request.query_params.get("days", 7))
        since = timezone.now() - timedelta(days=days)

        jobs = self.get_queryset().filter(created_at__gte=since)

        stats = jobs.aggregate(
            total=Count("id"),
            success=Count("id", filter=Q(status="success")),
            failed=Count("id", filter=Q(status="failed")),
            partial=Count("id", filter=Q(status="partial")),
            total_items=Sum("items_scraped"),
            total_saved=Sum("items_saved"),
            total_failed_items=Sum("items_failed"),
        )

        # Per-spider breakdown
        spider_breakdown = list(
            jobs.values("spider_type")
            .annotate(
                count=Count("id"),
                success=Count("id", filter=Q(status="success")),
                items=Sum("items_scraped"),
            )
            .order_by("spider_type")
        )

        return Response({
            "period_days": days,
            "total_jobs": stats["total"],
            "success_jobs": stats["success"],
            "failed_jobs": stats["failed"],
            "partial_jobs": stats["partial"],
            "success_rate": (
                (stats["success"] / stats["total"] * 100)
                if stats["total"] > 0 else 0
            ),
            "total_items_scraped": stats["total_items"] or 0,
            "total_items_saved": stats["total_saved"] or 0,
            "spider_breakdown": spider_breakdown,
        })


class DataQualityCheckViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Data Quality Checks.
    """

    queryset = DataQualityCheck.objects.all()
    serializer_class = DataQualityCheckSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["check_type", "severity", "is_resolved", "company_symbol"]
    ordering_fields = ["created_at", "severity"]

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve a quality check."""
        check = self.get_object()
        note = request.data.get("note", "")
        check.resolve(request.user, note)
        serializer = DataQualityCheckSerializer(check)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def unresolved(self, request):
        """Get all unresolved quality issues."""
        checks = self.get_queryset().filter(is_resolved=False)
        serializer = DataQualityCheckSerializer(checks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_company(self, request):
        """Get quality issues grouped by company."""
        symbol = request.query_params.get("symbol")
        if not symbol:
            return Response(
                {"error": "symbol parameter required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        checks = self.get_queryset().filter(
            company_symbol=symbol,
            is_resolved=False
        )
        serializer = DataQualityCheckSerializer(checks, many=True)
        return Response(serializer.data)


class SpiderConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Spider Configuration.
    """

    queryset = SpiderConfig.objects.all()
    serializer_class = SpiderConfigSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = "spider_type"

    @action(detail=True, methods=["post"])
    def toggle(self, request, spider_type=None):
        """Toggle spider enabled status."""
        config = self.get_object()
        config.is_enabled = not config.is_enabled
        config.save()
        serializer = SpiderConfigSerializer(config)
        return Response(serializer.data)


class ScrapedContentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Scraped Content management.
    """

    queryset = ScrapedContent.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["source", "status"]
    ordering_fields = ["created_at", "quality_score"]

    def get_serializer_class(self):
        if self.action == "list":
            return ScrapedContentListSerializer
        return ScrapedContentSerializer

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve scraped content."""
        content = self.get_object()
        content.approve(request.user)
        serializer = ScrapedContentSerializer(content)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject scraped content."""
        content = self.get_object()
        reason = request.data.get("reason", "")
        content.reject(request.user, reason)
        serializer = ScrapedContentSerializer(content)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get pending content for review."""
        content = self.get_queryset().filter(
            status="pending"
        ).order_by("-quality_score")[:50]
        serializer = ScrapedContentListSerializer(content, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish scraped content as article."""
        from apps.news.models import NewsArticle, Category

        content = self.get_object()

        if content.status != "approved":
            return Response(
                {"error": "Content must be approved before publishing"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create article from scraped content
        category = Category.objects.filter(slug="business").first()

        article = NewsArticle.objects.create(
            headline=content.raw_title,
            content=content.raw_content,
            excerpt=content.raw_excerpt or content.raw_content[:300],
            status="published",
            category=category,
            published_at=timezone.now(),
            author=request.user,
        )

        content.status = "published"
        content.article = article
        content.save()

        return Response({
            "message": "Article published",
            "article_id": article.id,
            "article_slug": article.slug,
        })


class SpiderDashboardView(APIView):
    """
    Spider monitoring dashboard.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.min.time())
        )

        # Today's jobs
        jobs_today = SpiderJob.objects.filter(created_at__gte=today_start)

        jobs_success = jobs_today.filter(status="success").count()
        jobs_failed = jobs_today.filter(status="failed").count()
        items_scraped = jobs_today.aggregate(
            total=Sum("items_scraped")
        )["total"] or 0

        # Per-spider stats
        spider_stats = {}
        for spider_type, _ in SpiderJob.SpiderType.choices:
            spider_jobs = jobs_today.filter(spider_type=spider_type)
            last_job = spider_jobs.order_by("-created_at").first()
            config = SpiderConfig.objects.filter(spider_type=spider_type).first()

            spider_stats[spider_type] = {
                "jobs_today": spider_jobs.count(),
                "success": spider_jobs.filter(status="success").count(),
                "last_run": last_job.created_at if last_job else None,
                "last_status": last_job.status if last_job else None,
                "enabled": config.is_enabled if config else True,
            }

        # Active issues
        unresolved = DataQualityCheck.objects.filter(is_resolved=False).count()
        pending = ScrapedContent.objects.filter(status="pending").count()

        # Recent jobs
        recent_jobs = SpiderJob.objects.order_by("-created_at")[:10]

        # Recent issues
        recent_issues = DataQualityCheck.objects.filter(
            is_resolved=False
        ).order_by("-created_at")[:10]

        data = {
            "jobs_today": jobs_today.count(),
            "jobs_success": jobs_success,
            "jobs_failed": jobs_failed,
            "items_scraped_today": items_scraped,
            "spider_stats": spider_stats,
            "unresolved_quality_issues": unresolved,
            "pending_content": pending,
            "recent_jobs": SpiderJobSerializer(recent_jobs, many=True).data,
            "recent_issues": DataQualityCheckSerializer(recent_issues, many=True).data,
        }

        serializer = SpiderDashboardSerializer(data)
        return Response(serializer.data)


class TriggerSpiderView(APIView):
    """
    Manually trigger a spider run.
    Runs tasks synchronously (no Celery worker required).
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = TriggerSpiderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        spider_type = serializer.validated_data["spider_type"]

        # Check if spider is enabled
        config = SpiderConfig.objects.filter(spider_type=spider_type).first()
        if config and not config.is_enabled:
            return Response(
                {"error": f"{spider_type} spider is disabled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create job record
        job = SpiderJob.objects.create(
            spider_type=spider_type,
            triggered_by="manual",
        )

        from . import tasks

        # Map spider types to their task functions
        task_map = {
            "jse": [tasks.scrape_jse_data],
            "zse": [tasks.scrape_zse_data],
            "bse": [tasks.scrape_bse_data],
            "news": [
                tasks.fetch_polygon_news,
                tasks.fetch_newsapi_headlines,
                tasks.fetch_african_news,
                tasks.scrape_african_news_websites,
                tasks.set_article_images,
                tasks.set_featured_article,
            ],
            "indices": [tasks.fetch_polygon_indices],
        }

        task_funcs = task_map.get(spider_type)
        if not task_funcs:
            return Response(
                {"error": f"No task found for {spider_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Run tasks synchronously (no Celery worker on Render)
        results = []
        job.status = "running"
        job.started_at = timezone.now()
        job.save()

        for task_func in task_funcs:
            try:
                result = task_func()
                results.append({"task": task_func.__name__, "result": str(result)})
            except Exception as e:
                results.append({"task": task_func.__name__, "error": str(e)})

        job.status = "success"
        job.completed_at = timezone.now()
        if job.started_at:
            job.duration_seconds = (job.completed_at - job.started_at).total_seconds()
        job.save()

        return Response({
            "message": f"Spider {spider_type} completed",
            "job_id": job.id,
            "results": results,
        })
