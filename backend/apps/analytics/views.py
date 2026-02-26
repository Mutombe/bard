"""
Analytics Views

Admin dashboard and analytics endpoints.
"""
from datetime import timedelta

from django.db.models import Sum, Avg, Count, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsEditor
from apps.news.models import NewsArticle, ArticleView, Comment, CommentLike
from apps.users.models import User
from apps.engagement.models import NewsletterSubscription
from apps.subscriptions.models import Subscription, Payment

from .models import (
    ArticleAnalytics,
    DailyMetrics,
    UserActivityLog,
    ContentPerformance,
    ScrapingMetrics,
    SystemHealth,
    TopContent,
    GeographicAnalytics,
)
from .serializers import (
    ArticleAnalyticsSerializer,
    ArticleAnalyticsSummarySerializer,
    DailyMetricsSerializer,
    UserActivityLogSerializer,
    ContentPerformanceSerializer,
    ScrapingMetricsSerializer,
    SystemHealthSerializer,
    TopContentSerializer,
    GeographicAnalyticsSerializer,
    AdminDashboardSerializer,
    TrackEventSerializer,
)


class ArticleAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for article-level analytics.
    """

    queryset = ArticleAnalytics.objects.all()
    serializer_class = ArticleAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsEditor]
    filterset_fields = ["article", "date"]

    def get_queryset(self):
        qs = super().get_queryset()
        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id)

        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)

        return qs

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get summary analytics for an article."""
        article_id = request.query_params.get("article")
        if not article_id:
            return Response(
                {"error": "article parameter required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        analytics = self.get_queryset().filter(article_id=article_id)

        # Aggregate metrics
        totals = analytics.aggregate(
            total_views=Sum("page_views"),
            unique_visitors=Sum("unique_visitors"),
            avg_time=Avg("avg_time_on_page"),
            avg_scroll=Avg("scroll_depth_avg"),
            avg_bounce=Avg("bounce_rate"),
            total_shares=Sum("social_shares"),
            total_comments=Sum("comments"),
            direct=Sum("source_direct"),
            search=Sum("source_search"),
            social=Sum("source_social"),
            referral=Sum("source_referral"),
            email=Sum("source_email"),
            desktop=Sum("device_desktop"),
            mobile=Sum("device_mobile"),
            tablet=Sum("device_tablet"),
        )

        # Views by day
        views_by_day = list(
            analytics.values("date")
            .annotate(views=Sum("page_views"))
            .order_by("date")
        )

        summary = {
            "total_views": totals["total_views"] or 0,
            "unique_visitors": totals["unique_visitors"] or 0,
            "avg_time_on_page": int(totals["avg_time"] or 0),
            "avg_scroll_depth": float(totals["avg_scroll"] or 0),
            "avg_bounce_rate": float(totals["avg_bounce"] or 0),
            "total_shares": totals["total_shares"] or 0,
            "total_comments": totals["total_comments"] or 0,
            "sources": {
                "direct": totals["direct"] or 0,
                "search": totals["search"] or 0,
                "social": totals["social"] or 0,
                "referral": totals["referral"] or 0,
                "email": totals["email"] or 0,
            },
            "devices": {
                "desktop": totals["desktop"] or 0,
                "mobile": totals["mobile"] or 0,
                "tablet": totals["tablet"] or 0,
            },
            "views_by_day": views_by_day,
        }

        serializer = ArticleAnalyticsSummarySerializer(summary)
        return Response(serializer.data)


class DailyMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for daily site-wide metrics.
    """

    queryset = DailyMetrics.objects.all()
    serializer_class = DailyMetricsSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["date"]
    ordering_fields = ["date"]

    @action(detail=False, methods=["get"])
    def range(self, request):
        """Get metrics for a date range."""
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            # Default to last 30 days
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=30)

        metrics = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        )
        serializer = DailyMetricsSerializer(metrics, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Get today's metrics."""
        today = timezone.now().date()
        try:
            metrics = DailyMetrics.objects.get(date=today)
            serializer = DailyMetricsSerializer(metrics)
            return Response(serializer.data)
        except DailyMetrics.DoesNotExist:
            return Response({"error": "No data for today"}, status=status.HTTP_404_NOT_FOUND)


class ContentPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for content performance metrics.
    """

    queryset = ContentPerformance.objects.all()
    serializer_class = ContentPerformanceSerializer
    permission_classes = [IsAuthenticated, IsEditor]
    filterset_fields = ["trend_direction"]
    ordering_fields = ["total_views", "engagement_score", "views_7d", "views_30d"]

    @action(detail=False, methods=["get"])
    def top_performing(self, request):
        """Get top performing articles."""
        limit = int(request.query_params.get("limit", 10))
        metric = request.query_params.get("metric", "total_views")

        articles = self.get_queryset().order_by(f"-{metric}")[:limit]
        serializer = ContentPerformanceSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def trending(self, request):
        """Get trending articles (positive trend)."""
        limit = int(request.query_params.get("limit", 10))

        articles = self.get_queryset().filter(
            trend_direction="up"
        ).order_by("-trend_percentage")[:limit]
        serializer = ContentPerformanceSerializer(articles, many=True)
        return Response(serializer.data)


class ScrapingMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for scraping performance metrics.
    """

    queryset = ScrapingMetrics.objects.all()
    serializer_class = ScrapingMetricsSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["spider_type", "date"]
    ordering_fields = ["date", "success_rate"]

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get summary of all spiders."""
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        spiders = ["jse", "zse", "bse", "news", "forex"]
        summary = {}

        for spider in spiders:
            metrics = self.get_queryset().filter(
                spider_type=spider,
                date__gte=week_ago
            )

            totals = metrics.aggregate(
                total_runs=Sum("run_count"),
                total_success=Sum("success_count"),
                total_failures=Sum("failure_count"),
                total_items=Sum("items_scraped"),
                avg_time=Avg("avg_run_time_seconds"),
            )

            # Latest run
            latest = metrics.order_by("-date").first()

            summary[spider] = {
                "total_runs": totals["total_runs"] or 0,
                "success_rate": (
                    (totals["total_success"] / (totals["total_success"] + totals["total_failures"]) * 100)
                    if (totals["total_success"] or 0) + (totals["total_failures"] or 0) > 0
                    else 0
                ),
                "total_items": totals["total_items"] or 0,
                "avg_run_time": int(totals["avg_time"] or 0),
                "last_run": latest.date if latest else None,
                "last_status": "success" if latest and latest.failure_count == 0 else "failed",
            }

        return Response(summary)


class SystemHealthViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for system health monitoring.
    """

    queryset = SystemHealth.objects.all()
    serializer_class = SystemHealthSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    ordering_fields = ["timestamp"]

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get current system health."""
        latest = self.get_queryset().order_by("-timestamp").first()
        if latest:
            serializer = SystemHealthSerializer(latest)
            return Response(serializer.data)
        return Response({"error": "No health data"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"])
    def history(self, request):
        """Get health history for the last 24 hours."""
        since = timezone.now() - timedelta(hours=24)
        health = self.get_queryset().filter(timestamp__gte=since)
        serializer = SystemHealthSerializer(health, many=True)
        return Response(serializer.data)


class TopContentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for top content rankings.
    """

    queryset = TopContent.objects.all()
    serializer_class = TopContentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["period", "metric_type"]

    @action(detail=False, methods=["get"])
    def by_period(self, request):
        """Get top content grouped by period."""
        result = {}
        for period in ["today", "week", "month", "all_time"]:
            content = self.get_queryset().filter(
                period=period
            ).order_by("rank")[:10]
            result[period] = TopContentSerializer(content, many=True).data
        return Response(result)


class GeographicAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for geographic analytics.
    """

    queryset = GeographicAnalytics.objects.all()
    serializer_class = GeographicAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["date", "country"]
    ordering_fields = ["page_views", "unique_visitors"]

    @action(detail=False, methods=["get"])
    def top_countries(self, request):
        """Get top countries by traffic."""
        days = int(request.query_params.get("days", 7))
        limit = int(request.query_params.get("limit", 10))
        since = timezone.now().date() - timedelta(days=days)

        countries = (
            self.get_queryset()
            .filter(date__gte=since)
            .values("country", "country__name", "country__code")
            .annotate(
                total_views=Sum("page_views"),
                total_visitors=Sum("unique_visitors"),
            )
            .order_by("-total_views")[:limit]
        )

        return Response(list(countries))


class AdminDashboardView(APIView):
    """
    Admin dashboard overview endpoint.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)

        # Today's metrics
        try:
            today_metrics = DailyMetrics.objects.get(date=today)
        except DailyMetrics.DoesNotExist:
            today_metrics = None

        try:
            yesterday_metrics = DailyMetrics.objects.get(date=yesterday)
        except DailyMetrics.DoesNotExist:
            yesterday_metrics = None

        # Calculate changes
        def calc_change(today_val, yesterday_val):
            if yesterday_val and yesterday_val > 0:
                return ((today_val - yesterday_val) / yesterday_val) * 100
            return 0

        today_views = today_metrics.total_page_views if today_metrics else 0
        today_visitors = today_metrics.total_unique_visitors if today_metrics else 0
        today_articles = today_metrics.articles_published if today_metrics else 0
        today_new_users = today_metrics.new_users if today_metrics else 0

        yesterday_views = yesterday_metrics.total_page_views if yesterday_metrics else 0
        yesterday_visitors = yesterday_metrics.total_unique_visitors if yesterday_metrics else 0
        yesterday_articles = yesterday_metrics.articles_published if yesterday_metrics else 0
        yesterday_new_users = yesterday_metrics.new_users if yesterday_metrics else 0

        # System health
        latest_health = SystemHealth.objects.order_by("-timestamp").first()
        system_health = SystemHealthSerializer(latest_health).data if latest_health else {}

        # Scraping status
        scraping_today = ScrapingMetrics.objects.filter(date=today)
        scraping_status = {
            metric.spider_type: {
                "runs": metric.run_count,
                "success": metric.success_count,
                "items": metric.items_scraped,
            }
            for metric in scraping_today
        }

        # Top articles
        top_today = TopContent.objects.filter(
            period="today", metric_type="views"
        ).order_by("rank")[:5]
        top_week = TopContent.objects.filter(
            period="week", metric_type="views"
        ).order_by("rank")[:5]

        # Top countries
        top_countries = list(
            GeographicAnalytics.objects.filter(date=today)
            .values("country__name", "country__code")
            .annotate(views=Sum("page_views"))
            .order_by("-views")[:5]
        )

        # Recent activity
        recent_activity = list(
            UserActivityLog.objects.order_by("-created_at")[:10]
            .values("activity_type", "user__email", "created_at")
        )

        dashboard_data = {
            "today_views": today_views,
            "today_visitors": today_visitors,
            "today_articles": today_articles,
            "today_new_users": today_new_users,
            "views_change": calc_change(today_views, yesterday_views),
            "visitors_change": calc_change(today_visitors, yesterday_visitors),
            "articles_change": calc_change(today_articles, yesterday_articles),
            "users_change": calc_change(today_new_users, yesterday_new_users),
            "system_health": system_health,
            "scraping_status": scraping_status,
            "top_articles_today": TopContentSerializer(top_today, many=True).data,
            "top_articles_week": TopContentSerializer(top_week, many=True).data,
            "top_countries": top_countries,
            "recent_activity": recent_activity,
        }

        serializer = AdminDashboardSerializer(dashboard_data)
        return Response(serializer.data)


class TrackEventView(APIView):
    """
    Endpoint for tracking user events.

    Used by frontend to log user activities.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TrackEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Create activity log
        UserActivityLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key or "",
            activity_type=data["event_type"],
            article_id=data.get("article_id"),
            company_id=data.get("company_id"),
            url=data.get("url", ""),
            referrer=data.get("referrer", ""),
            search_query=data.get("search_query", ""),
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            metadata=data.get("metadata", {}),
        )

        return Response({"status": "tracked"}, status=status.HTTP_201_CREATED)

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR")


class ComprehensiveAnalyticsView(APIView):
    """
    Live analytics from real models — no Celery dependency.
    GET ?range=7d|30d|90d|all
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90, "all": None}

    def get(self, request):
        range_key = request.query_params.get("range", "30d")
        days = self.RANGE_DAYS.get(range_key)
        now = timezone.now()
        start = now - timedelta(days=days) if days else None

        def in_period(qs, field):
            if start is not None:
                return qs.filter(**{f"{field}__gte": start})
            return qs

        data = {
            "period": range_key,
            "generated_at": now.isoformat(),
            "users": self._users(in_period),
            "content": self._content(in_period),
            "engagement": self._engagement(in_period),
            "newsletters": self._newsletters(in_period),
            "subscriptions": self._subscriptions(in_period),
        }
        return Response(data)

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    def _users(self, in_period):
        total = User.objects.count()
        active = in_period(User.objects, "last_login").exclude(last_login=None).count()
        new = in_period(User.objects, "date_joined").count()

        role_breakdown = list(
            User.objects.values("role")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        tier_breakdown = list(
            User.objects.values("subscription_tier")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        registration_trend = list(
            in_period(User.objects, "date_joined")
            .annotate(date=TruncDate("date_joined"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return {
            "total_users": total,
            "active_in_period": active,
            "new_users_in_period": new,
            "role_breakdown": role_breakdown,
            "tier_breakdown": tier_breakdown,
            "registration_trend": registration_trend,
        }

    # ------------------------------------------------------------------
    # Content
    # ------------------------------------------------------------------
    def _content(self, in_period):
        articles_by_status = list(
            NewsArticle.all_objects.values("status")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        published = NewsArticle.objects.filter(status=NewsArticle.Status.PUBLISHED)
        total_published = published.count()
        published_in_period = in_period(published, "published_at").count()
        total_view_count = published.aggregate(total=Sum("view_count"))["total"] or 0

        top_articles = list(
            published.order_by("-view_count")
            .values(
                "id", "title", "slug", "view_count",
                "category__name", "author__first_name",
                "author__last_name", "published_at", "is_premium",
            )[:10]
        )
        publishing_trend = list(
            in_period(published, "published_at")
            .annotate(date=TruncDate("published_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return {
            "articles_by_status": articles_by_status,
            "total_published": total_published,
            "published_in_period": published_in_period,
            "total_view_count": total_view_count,
            "top_articles_by_views": top_articles,
            "publishing_trend": publishing_trend,
        }

    # ------------------------------------------------------------------
    # Engagement
    # ------------------------------------------------------------------
    def _engagement(self, in_period):
        approved = Comment.objects.filter(is_approved=True)
        total_comments = approved.count()
        new_comments = in_period(approved, "created_at").count()

        published_count = NewsArticle.objects.filter(
            status=NewsArticle.Status.PUBLISHED
        ).count()
        avg_comments = round(total_comments / published_count, 1) if published_count else 0

        top_commented = list(
            NewsArticle.objects.filter(status=NewsArticle.Status.PUBLISHED)
            .annotate(
                comment_count=Count(
                    "comments",
                    filter=Q(comments__is_approved=True),
                )
            )
            .order_by("-comment_count")
            .values("id", "title", "slug", "comment_count", "view_count")[:5]
        )
        top_commenters = list(
            approved.values("author__email", "author__first_name", "author__last_name")
            .annotate(comment_count=Count("id"))
            .order_by("-comment_count")[:5]
        )

        total_views_raw = ArticleView.objects.count()
        views_in_period = in_period(ArticleView.objects, "created_at").count()
        unique_viewers = (
            in_period(ArticleView.objects, "created_at")
            .exclude(user=None)
            .values("user")
            .distinct()
            .count()
        )
        total_likes = CommentLike.objects.count()

        return {
            "total_comments": total_comments,
            "new_comments_in_period": new_comments,
            "avg_comments_per_article": avg_comments,
            "top_commented_articles": top_commented,
            "top_commenters": top_commenters,
            "total_article_views_raw": total_views_raw,
            "article_views_in_period": views_in_period,
            "unique_viewers_in_period": unique_viewers,
            "total_comment_likes": total_likes,
        }

    # ------------------------------------------------------------------
    # Newsletters
    # ------------------------------------------------------------------
    def _newsletters(self, in_period):
        total = NewsletterSubscription.objects.count()
        active = NewsletterSubscription.objects.filter(is_active=True).count()
        new = in_period(NewsletterSubscription.objects, "created_at").count()

        by_type = list(
            NewsletterSubscription.objects.filter(is_active=True)
            .values("newsletter_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        trend = list(
            in_period(NewsletterSubscription.objects, "created_at")
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return {
            "total_subscribers": total,
            "active_subscribers": active,
            "new_in_period": new,
            "by_type": by_type,
            "trend": trend,
        }

    # ------------------------------------------------------------------
    # Subscriptions & Revenue
    # ------------------------------------------------------------------
    def _subscriptions(self, in_period):
        active_by_plan = list(
            Subscription.objects.filter(status="active")
            .values("plan__plan_type", "plan__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        status_breakdown = list(
            Subscription.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        completed = Payment.objects.filter(status=Payment.Status.COMPLETED)
        all_time_cents = completed.aggregate(total=Sum("amount"))["total"] or 0
        period_payments = in_period(completed, "paid_at")
        period_cents = period_payments.aggregate(total=Sum("amount"))["total"] or 0

        revenue_by_currency = list(
            completed.values("currency")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )
        # Convert cents → dollars for display
        for entry in revenue_by_currency:
            entry["total"] = round(entry["total"] / 100, 2)

        mrr_cents = (
            Subscription.objects.filter(status="active")
            .aggregate(total=Sum("plan__price_usd"))["total"]
            or 0
        )

        revenue_trend = list(
            in_period(completed, "paid_at")
            .annotate(date=TruncDate("paid_at"))
            .values("date", "currency")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("date")
        )
        for entry in revenue_trend:
            entry["total"] = round(entry["total"] / 100, 2)

        return {
            "active_by_plan": active_by_plan,
            "status_breakdown": status_breakdown,
            "total_revenue_all_time_usd": round(all_time_cents / 100, 2),
            "revenue_in_period_usd": round(period_cents / 100, 2),
            "revenue_by_currency": revenue_by_currency,
            "mrr_usd": round(mrr_cents / 100, 2),
            "revenue_trend": revenue_trend,
        }
