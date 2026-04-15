"""
Product-Market-Fit Analytics Endpoints

Aggregates ArticleView + ResearchView + ResearchDownload data into
actionable insights about WHAT readers are interested in, WHERE they
come from, and WHO they are.
"""
from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.news.models import ArticleView, NewsArticle
from apps.research.models import ResearchView, ResearchDownload, ResearchReport


@api_view(["GET"])
@permission_classes([IsAdminUser])
def content_insights(request):
    """
    Returns content engagement insights:
    - Top articles by views (last 30 days)
    - Top research reports by views/downloads (last 30 days)
    - Geographic distribution of readers
    - Traffic sources
    - Authenticated vs anonymous breakdown
    """
    days = int(request.query_params.get("days", 30))
    since = timezone.now() - timedelta(days=days)

    article_views = ArticleView.objects.filter(created_at__gte=since)
    research_views = ResearchView.objects.filter(created_at__gte=since)
    research_downloads = ResearchDownload.objects.filter(created_at__gte=since)

    # Top articles
    top_articles = (
        article_views.values("article__id", "article__title", "article__slug", "article__category__name")
        .annotate(view_count=Count("id"))
        .order_by("-view_count")[:10]
    )

    # Top research
    top_research = (
        research_views.values("report__id", "report__title", "report__slug", "report__report_type")
        .annotate(view_count=Count("id"))
        .order_by("-view_count")[:10]
    )

    # Top downloads
    top_downloads = (
        research_downloads.values("report__id", "report__title", "report__slug")
        .annotate(download_count=Count("id"))
        .order_by("-download_count")[:10]
    )

    # Geo distribution (combined article + research views)
    article_countries = list(
        article_views.exclude(country="")
        .values("country", "country_name")
        .annotate(count=Count("id"))
    )
    research_countries = list(
        research_views.exclude(country="")
        .values("country", "country_name")
        .annotate(count=Count("id"))
    )
    # Merge
    country_totals = {}
    for c in article_countries + research_countries:
        key = c["country"]
        if key not in country_totals:
            country_totals[key] = {
                "country": key,
                "country_name": c["country_name"],
                "count": 0,
            }
        country_totals[key]["count"] += c["count"]
    geo_distribution = sorted(country_totals.values(), key=lambda x: -x["count"])[:15]

    # Top cities
    cities = list(
        article_views.exclude(city="")
        .values("city", "country_name")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    # Traffic sources
    sources = list(
        article_views.exclude(source="")
        .values("source")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    # Authenticated vs anonymous
    article_auth = article_views.filter(user__isnull=False).count()
    article_anon = article_views.filter(user__isnull=True).count()
    research_auth = research_views.filter(user__isnull=False).count()
    research_anon = research_views.filter(user__isnull=True).count()

    # Top authenticated readers (engaged users)
    top_readers = (
        article_views.filter(user__isnull=False)
        .values("user__id", "user__email", "user__first_name", "user__last_name")
        .annotate(view_count=Count("id"))
        .order_by("-view_count")[:10]
    )

    # Daily trend (last 30 days)
    from django.db.models.functions import TruncDate
    daily_trend = list(
        article_views.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(views=Count("id"))
        .order_by("date")
    )

    # Category interest signal
    category_interest = list(
        article_views.exclude(article__category__isnull=True)
        .values("article__category__name", "article__category__slug")
        .annotate(views=Count("id"))
        .order_by("-views")[:10]
    )

    return Response({
        "period_days": days,
        "totals": {
            "article_views": article_views.count(),
            "research_views": research_views.count(),
            "research_downloads": research_downloads.count(),
            "unique_authenticated_readers": article_views.filter(user__isnull=False).values("user").distinct().count(),
        },
        "top_articles": list(top_articles),
        "top_research": list(top_research),
        "top_downloads": list(top_downloads),
        "geo_distribution": geo_distribution,
        "top_cities": cities,
        "traffic_sources": sources,
        "authenticated_breakdown": {
            "articles": {"authenticated": article_auth, "anonymous": article_anon},
            "research": {"authenticated": research_auth, "anonymous": research_anon},
        },
        "top_readers": list(top_readers),
        "daily_trend": daily_trend,
        "category_interest": category_interest,
    })
