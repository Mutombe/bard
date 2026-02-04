"""
Podcast API URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PodcastShowViewSet, PodcastEpisodeViewSet, PodcastSubscriptionViewSet

router = DefaultRouter()
router.register(r"shows", PodcastShowViewSet, basename="podcast-show")
router.register(r"episodes", PodcastEpisodeViewSet, basename="podcast-episode")
router.register(r"subscriptions", PodcastSubscriptionViewSet, basename="podcast-subscription")

app_name = "podcasts"

urlpatterns = [
    path("", include(router.urls)),
]
