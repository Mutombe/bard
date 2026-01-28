"""
URL Configuration for Bard Santner Journal

API Structure:
/api/v1/markets/     - Market data endpoints
/api/v1/news/        - News & articles endpoints
/api/v1/users/       - User management endpoints
/api/v1/engagement/  - Newsletters & alerts endpoints
/api/v1/auth/        - Authentication endpoints
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


# Simple health check that bypasses DRF completely (no throttling)
@csrf_exempt
@never_cache
def simple_health_check(request):
    """Simple health check for Render - no DRF, no throttling."""
    return JsonResponse({
        "status": "healthy",
        "service": "Bardiq Journal API",
    })

# =========================
# API URL Patterns
# =========================
api_v1_patterns = [
    path("markets/", include("apps.markets.urls", namespace="markets")),
    path("news/", include("apps.news.urls", namespace="news")),
    path("users/", include("apps.users.urls", namespace="users")),
    path("engagement/", include("apps.engagement.urls", namespace="engagement")),
    path("auth/", include("apps.authentication.urls", namespace="auth")),
    path("geography/", include("apps.geography.urls", namespace="geography")),
    path("columnists/", include("apps.columnists.urls", namespace="columnists")),
    path("editorial/", include("apps.editorial.urls", namespace="editorial")),
    path("analytics/", include("apps.analytics.urls", namespace="analytics")),
    path("portfolio/", include("apps.portfolio.urls", namespace="portfolio")),
    path("seo/", include("apps.seo.urls", namespace="seo")),
    path("spider/", include("apps.spider.urls", namespace="spider")),
    path("subscriptions/", include("apps.subscriptions.urls", namespace="subscriptions")),
    path("media/", include("apps.media.urls", namespace="media")),
    # Health check endpoint
    path("health/", include("apps.core.urls", namespace="core")),
]

urlpatterns = [
    # Simple health check at root (for Render) - bypasses DRF throttling
    path("health/", simple_health_check, name="health-check"),
    # Extended health checks (DRF-based, with more details)
    path("health/ready/", include("apps.core.urls", namespace="core")),
    # Admin
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/", include((api_v1_patterns, "api"), namespace="api-v1")),
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
