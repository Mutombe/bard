"""
Spider URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "spider"

router = DefaultRouter()
router.register(r"jobs", views.SpiderJobViewSet, basename="jobs")
router.register(r"quality", views.DataQualityCheckViewSet, basename="quality")
router.register(r"config", views.SpiderConfigViewSet, basename="config")
router.register(r"content", views.ScrapedContentViewSet, basename="content")

urlpatterns = [
    path("dashboard/", views.SpiderDashboardView.as_view(), name="dashboard"),
    path("trigger/", views.TriggerSpiderView.as_view(), name="trigger"),
    path("", include(router.urls)),
]
