"""
News URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "news"

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="categories")
router.register(r"tags", views.TagViewSet, basename="tags")
router.register(r"articles", views.NewsArticleViewSet, basename="articles")
router.register(r"comments", views.CommentViewSet, basename="comments")

urlpatterns = [
    path("", include(router.urls)),
]
