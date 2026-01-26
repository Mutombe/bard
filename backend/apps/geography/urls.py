"""
Geography URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "geography"

router = DefaultRouter()
router.register(r"countries", views.CountryViewSet, basename="countries")
router.register(r"cities", views.CityViewSet, basename="cities")
router.register(r"regions", views.RegionViewSet, basename="regions")

urlpatterns = [
    path("", include(router.urls)),
]
