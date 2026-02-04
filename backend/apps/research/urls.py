"""
Research API URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TopicViewSet, IndustryViewSet, ResearchReportViewSet

router = DefaultRouter()
router.register(r"topics", TopicViewSet, basename="topic")
router.register(r"industries", IndustryViewSet, basename="industry")
router.register(r"reports", ResearchReportViewSet, basename="research-report")

app_name = "research"

urlpatterns = [
    path("", include(router.urls)),
]
