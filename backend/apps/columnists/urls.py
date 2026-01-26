"""
Columnist URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "columnists"

router = DefaultRouter()
router.register(r"expertise", views.ExpertiseAreaViewSet, basename="expertise")
router.register(r"columns", views.ColumnViewSet, basename="columns")
router.register(r"", views.ColumnistViewSet, basename="columnists")

urlpatterns = [
    path("", include(router.urls)),
]
