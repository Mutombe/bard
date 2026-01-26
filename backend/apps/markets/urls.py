"""
Market URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "markets"

router = DefaultRouter()
router.register(r"exchanges", views.ExchangeViewSet, basename="exchanges")
router.register(r"sectors", views.SectorViewSet, basename="sectors")
router.register(r"companies", views.CompanyViewSet, basename="companies")
router.register(r"tickers", views.MarketTickerViewSet, basename="tickers")
router.register(r"indices", views.MarketIndexViewSet, basename="indices")

urlpatterns = [
    path("", include(router.urls)),
]
