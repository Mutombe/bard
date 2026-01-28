"""
Media URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = "media"

router = DefaultRouter()
router.register(r"library", views.MediaFileViewSet, basename="library")
router.register(r"videos", views.VideoViewSet, basename="video")
router.register(r"categories", views.VideoCategoryViewSet, basename="category")
router.register(r"podcasts/shows", views.PodcastShowViewSet, basename="podcast-show")
router.register(r"podcasts/episodes", views.PodcastEpisodeViewSet, basename="podcast-episode")
router.register(r"youtube/channels", views.YouTubeChannelViewSet, basename="youtube-channel")
router.register(r"unsplash", views.UnsplashSearchView, basename="unsplash")

urlpatterns = [
    path("", include(router.urls)),
]
