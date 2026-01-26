"""
Core URLs - Health check and system endpoints
"""
from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.HealthCheckView.as_view(), name="health-check"),
    path("ready/", views.ReadinessCheckView.as_view(), name="readiness-check"),
]
