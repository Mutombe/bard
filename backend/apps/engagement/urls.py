"""
Engagement URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "engagement"

router = DefaultRouter()
router.register(r"newsletters", views.NewsletterSubscriptionViewSet, basename="newsletters")
router.register(r"alerts", views.PriceAlertViewSet, basename="alerts")
router.register(r"notifications", views.NotificationViewSet, basename="notifications")

urlpatterns = [
    path("", include(router.urls)),
]
