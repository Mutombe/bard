"""
Portfolio URLs
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "portfolio"

router = DefaultRouter()
router.register(r"portfolios", views.PortfolioViewSet, basename="portfolios")
router.register(r"positions", views.PositionViewSet, basename="positions")
router.register(r"transactions", views.TransactionViewSet, basename="transactions")
router.register(r"watchlist", views.WatchlistViewSet, basename="watchlist")

urlpatterns = [
    path("", include(router.urls)),
]
