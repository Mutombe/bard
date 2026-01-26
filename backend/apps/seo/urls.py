"""
SEO URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "seo"

router = DefaultRouter()
router.register(r"metadata", views.SEOMetadataViewSet, basename="metadata")
router.register(r"redirects", views.RedirectViewSet, basename="redirects")
router.register(r"structured-data", views.StructuredDataViewSet, basename="structured-data")

urlpatterns = [
    path("article/<slug:slug>/", views.ArticleSEOView.as_view(), name="article-seo"),
    path("sitemap.xml", views.SitemapView.as_view(), name="sitemap"),
    path("sitemap-index.xml", views.SitemapIndexView.as_view(), name="sitemap-index"),
    path("sitemap-news.xml", views.NewsSitemapView.as_view(), name="sitemap-news"),
    path("robots.txt", views.RobotsTxtView.as_view(), name="robots"),
    path("", include(router.urls)),
]
