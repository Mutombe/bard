"""
Analytics URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "analytics"

router = DefaultRouter()
router.register(r"articles", views.ArticleAnalyticsViewSet, basename="article-analytics")
router.register(r"daily", views.DailyMetricsViewSet, basename="daily-metrics")
router.register(r"performance", views.ContentPerformanceViewSet, basename="performance")
router.register(r"scraping", views.ScrapingMetricsViewSet, basename="scraping")
router.register(r"health", views.SystemHealthViewSet, basename="health")
router.register(r"top-content", views.TopContentViewSet, basename="top-content")
router.register(r"geographic", views.GeographicAnalyticsViewSet, basename="geographic")

urlpatterns = [
    path("dashboard/", views.AdminDashboardView.as_view(), name="dashboard"),
    path("track/", views.TrackEventView.as_view(), name="track"),
    path("", include(router.urls)),
]
