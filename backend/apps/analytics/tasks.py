"""
Analytics Celery Tasks

Periodic tasks for calculating and aggregating analytics.
"""
from datetime import timedelta

from celery import shared_task
from django.db.models import Sum, Avg, Count
from django.utils import timezone


@shared_task
def calculate_daily_metrics():
    """
    Calculate and store daily metrics.

    Runs at end of each day.
    """
    from apps.news.models import NewsArticle
    from apps.users.models import User
    from apps.engagement.models import NewsletterSubscription, PriceAlert
    from .models import DailyMetrics, UserActivityLog, ArticleAnalytics

    today = timezone.now().date()
    yesterday = today - timedelta(days=1)

    # Get or create metrics for yesterday
    metrics, _ = DailyMetrics.objects.get_or_create(date=yesterday)

    # Traffic from activity logs
    activity = UserActivityLog.objects.filter(
        created_at__date=yesterday
    )

    metrics.total_page_views = activity.filter(
        activity_type="page_view"
    ).count()

    metrics.total_unique_visitors = activity.values(
        "session_id"
    ).distinct().count()

    metrics.total_sessions = activity.values(
        "session_id"
    ).distinct().count()

    # Content
    metrics.articles_published = NewsArticle.objects.filter(
        published_at__date=yesterday,
        status="published"
    ).count()

    metrics.articles_updated = NewsArticle.objects.filter(
        updated_at__date=yesterday
    ).count()

    # Users
    metrics.new_users = User.objects.filter(
        date_joined__date=yesterday
    ).count()

    metrics.active_users = activity.filter(
        user__isnull=False
    ).values("user").distinct().count()

    # Subscribers
    metrics.new_subscribers = NewsletterSubscription.objects.filter(
        created_at__date=yesterday,
        is_active=True
    ).count()

    # Engagement
    metrics.newsletter_sends = 0  # Updated by newsletter task
    metrics.price_alerts_sent = PriceAlert.objects.filter(
        last_triggered__date=yesterday
    ).count()

    metrics.save()
    return f"Calculated metrics for {yesterday}"


@shared_task
def calculate_content_performance():
    """
    Calculate content performance metrics.

    Runs every hour.
    """
    from apps.news.models import NewsArticle
    from .models import ContentPerformance, ArticleAnalytics

    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Get all published articles
    articles = NewsArticle.objects.filter(status="published")

    for article in articles:
        perf, _ = ContentPerformance.objects.get_or_create(article=article)

        # Aggregate analytics
        analytics = ArticleAnalytics.objects.filter(article=article)

        totals = analytics.aggregate(
            total_views=Sum("page_views"),
            unique_visitors=Sum("unique_visitors"),
            avg_time=Avg("avg_time_on_page"),
            avg_scroll=Avg("scroll_depth_avg"),
            total_shares=Sum("social_shares"),
            total_comments=Sum("comments"),
        )

        perf.total_views = totals["total_views"] or 0
        perf.unique_visitors = totals["unique_visitors"] or 0
        perf.avg_read_time = int(totals["avg_time"] or 0)
        perf.total_shares = totals["total_shares"] or 0
        perf.total_comments = totals["total_comments"] or 0

        # Calculate completion rate from scroll depth
        if totals["avg_scroll"]:
            perf.completion_rate = min(totals["avg_scroll"] / 100, 1) * 100

        # Period views
        perf.views_7d = analytics.filter(
            date__gte=week_ago
        ).aggregate(total=Sum("page_views"))["total"] or 0

        perf.views_30d = analytics.filter(
            date__gte=month_ago
        ).aggregate(total=Sum("page_views"))["total"] or 0

        # Calculate trend
        prev_week = analytics.filter(
            date__gte=week_ago - timedelta(days=7),
            date__lt=week_ago
        ).aggregate(total=Sum("page_views"))["total"] or 0

        if prev_week > 0:
            change = ((perf.views_7d - prev_week) / prev_week) * 100
            perf.trend_percentage = change
            if change > 5:
                perf.trend_direction = "up"
            elif change < -5:
                perf.trend_direction = "down"
            else:
                perf.trend_direction = "stable"

        # Calculate engagement score
        # Weighted formula: views (30%) + read time (25%) + shares (25%) + comments (20%)
        view_score = min(perf.total_views / 10000, 1) * 30
        time_score = min(perf.avg_read_time / 300, 1) * 25  # 5 min max
        share_score = min(perf.total_shares / 100, 1) * 25
        comment_score = min(perf.total_comments / 50, 1) * 20
        perf.engagement_score = view_score + time_score + share_score + comment_score

        perf.save()

    return f"Updated performance for {articles.count()} articles"


@shared_task
def update_top_content():
    """
    Update top content rankings.

    Runs every hour.
    """
    from .models import TopContent, ContentPerformance

    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Clear existing rankings
    TopContent.objects.all().delete()

    # Today's top (by views_7d as proxy for recent)
    today_top = ContentPerformance.objects.order_by("-views_7d")[:10]
    for rank, perf in enumerate(today_top, 1):
        TopContent.objects.create(
            period="today",
            rank=rank,
            article=perf.article,
            metric_value=perf.views_7d,
            metric_type="views",
        )

    # Week's top
    week_top = ContentPerformance.objects.order_by("-views_7d")[:10]
    for rank, perf in enumerate(week_top, 1):
        TopContent.objects.create(
            period="week",
            rank=rank,
            article=perf.article,
            metric_value=perf.views_7d,
            metric_type="views",
        )

    # Month's top
    month_top = ContentPerformance.objects.order_by("-views_30d")[:10]
    for rank, perf in enumerate(month_top, 1):
        TopContent.objects.create(
            period="month",
            rank=rank,
            article=perf.article,
            metric_value=perf.views_30d,
            metric_type="views",
        )

    # All time top
    all_time_top = ContentPerformance.objects.order_by("-total_views")[:10]
    for rank, perf in enumerate(all_time_top, 1):
        TopContent.objects.create(
            period="all_time",
            rank=rank,
            article=perf.article,
            metric_value=perf.total_views,
            metric_type="views",
        )

    return "Updated top content rankings"


@shared_task
def record_system_health():
    """
    Record system health metrics.

    Runs every 5 minutes.
    """
    import psutil
    from django.db import connection
    from django.core.cache import cache
    from .models import SystemHealth

    health = SystemHealth()

    # CPU and memory
    health.cpu_usage_percent = psutil.cpu_percent()
    health.memory_usage_percent = psutil.virtual_memory().percent
    health.disk_usage_percent = psutil.disk_usage("/").percent

    # Database connections
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
            health.db_connections_active = cursor.fetchone()[0]
            cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'")
            health.db_connections_idle = cursor.fetchone()[0]
    except Exception:
        pass

    # Cache hit rate (if using Redis)
    try:
        cache_stats = cache.get("_cache_stats")
        if cache_stats:
            hits = cache_stats.get("hits", 0)
            misses = cache_stats.get("misses", 0)
            if hits + misses > 0:
                health.cache_hit_rate = (hits / (hits + misses)) * 100
    except Exception:
        pass

    health.save()
    return "Recorded system health"


@shared_task
def cleanup_old_analytics():
    """
    Clean up old analytics data.

    Runs daily. Keeps detailed data for 90 days.
    """
    from .models import ArticleAnalytics, UserActivityLog, SystemHealth

    cutoff = timezone.now() - timedelta(days=90)

    # Delete old hourly analytics
    deleted_analytics = ArticleAnalytics.objects.filter(
        date__lt=cutoff.date()
    ).delete()[0]

    # Delete old activity logs
    deleted_activity = UserActivityLog.objects.filter(
        created_at__lt=cutoff
    ).delete()[0]

    # Delete old health records (keep 7 days)
    health_cutoff = timezone.now() - timedelta(days=7)
    deleted_health = SystemHealth.objects.filter(
        timestamp__lt=health_cutoff
    ).delete()[0]

    return f"Cleaned up: {deleted_analytics} analytics, {deleted_activity} activity logs, {deleted_health} health records"


@shared_task
def aggregate_geographic_analytics():
    """
    Aggregate geographic analytics from activity logs.

    Runs daily.
    """
    from .models import GeographicAnalytics, UserActivityLog
    from apps.geography.models import Country

    yesterday = timezone.now().date() - timedelta(days=1)

    # Get activities grouped by country
    activities = UserActivityLog.objects.filter(
        created_at__date=yesterday,
        country_code__isnull=False
    ).exclude(country_code="")

    # Aggregate by country code
    country_stats = activities.values("country_code").annotate(
        page_views=Count("id", filter=models.Q(activity_type="page_view")),
        sessions=Count("session_id", distinct=True),
        unique_visitors=Count("session_id", distinct=True),
        new_users=Count("user", distinct=True, filter=models.Q(
            user__date_joined__date=yesterday
        )),
    )

    for stat in country_stats:
        try:
            country = Country.objects.get(code=stat["country_code"])
            GeographicAnalytics.objects.update_or_create(
                date=yesterday,
                country=country,
                defaults={
                    "page_views": stat["page_views"],
                    "sessions": stat["sessions"],
                    "unique_visitors": stat["unique_visitors"],
                    "new_users": stat["new_users"],
                }
            )
        except Country.DoesNotExist:
            pass

    return f"Aggregated geographic analytics for {yesterday}"
