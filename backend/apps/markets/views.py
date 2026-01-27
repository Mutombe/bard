"""
Market Views

Provides API endpoints for market data.
"""
from datetime import timedelta

from django.db.models import Avg, Max, Min
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.cache import (
    CacheTTL,
    cache_market_list,
    cache_reference_data,
    cache_response,
    cache_ticker_tape,
)
from apps.core.pagination import MarketDataPagination

from .models import Company, Exchange, MarketIndex, MarketTicker, Sector
from .serializers import (
    CompanyMinimalSerializer,
    CompanySerializer,
    ExchangeSerializer,
    MarketIndexSerializer,
    MarketTickerChartSerializer,
    MarketTickerSerializer,
    SectorSerializer,
    TickerTapeSerializer,
)


class CompanyFilter(filters.FilterSet):
    """Filter for Company queryset."""

    exchange = filters.CharFilter(field_name="exchange__code")
    sector = filters.CharFilter(field_name="sector__code")
    min_price = filters.NumberFilter(field_name="current_price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="current_price", lookup_expr="lte")
    min_market_cap = filters.NumberFilter(field_name="market_cap", lookup_expr="gte")

    class Meta:
        model = Company
        fields = ["exchange", "sector", "is_active", "is_featured"]


class ExchangeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Exchange model."""

    queryset = Exchange.objects.filter(is_active=True)
    serializer_class = ExchangeSerializer
    permission_classes = [AllowAny]
    lookup_field = "code"

    @cache_reference_data
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @cache_reference_data
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class SectorViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Sector model."""

    queryset = Sector.objects.all()
    serializer_class = SectorSerializer
    permission_classes = [AllowAny]
    lookup_field = "code"

    @cache_reference_data
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Company model.

    Endpoints:
    - GET /companies/ - List companies
    - GET /companies/{symbol}/ - Get company details
    - GET /companies/{symbol}/chart/ - Get chart data
    - GET /companies/gainers/ - Top gainers
    - GET /companies/losers/ - Top losers
    - GET /companies/most-active/ - Most traded
    """

    queryset = Company.objects.filter(is_active=True).select_related("exchange", "sector")
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]
    filterset_class = CompanyFilter
    search_fields = ["symbol", "name", "short_name"]
    ordering_fields = ["symbol", "current_price", "market_cap", "volume", "price_change_percent"]
    lookup_field = "symbol"

    def get_serializer_class(self):
        if self.action == "list":
            return CompanyMinimalSerializer
        return CompanySerializer

    @action(detail=True, methods=["get"])
    def chart(self, request, symbol=None):
        """Get chart data for a company."""
        company = self.get_object()
        interval = request.query_params.get("interval", "1d")
        period = request.query_params.get("period", "1M")

        # Calculate date range based on period
        end_date = timezone.now()
        period_map = {
            "1D": timedelta(days=1),
            "1W": timedelta(weeks=1),
            "1M": timedelta(days=30),
            "3M": timedelta(days=90),
            "6M": timedelta(days=180),
            "1Y": timedelta(days=365),
            "5Y": timedelta(days=1825),
        }
        start_date = end_date - period_map.get(period, timedelta(days=30))

        tickers = MarketTicker.objects.filter(
            company=company,
            interval=interval,
            timestamp__gte=start_date,
            timestamp__lte=end_date,
        ).order_by("timestamp")

        serializer = MarketTickerChartSerializer(tickers, many=True)
        return Response(
            {
                "symbol": company.symbol,
                "interval": interval,
                "period": period,
                "data": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    @cache_response(ttl=CacheTTL.SHORT, key_prefix="market_gainers")
    def gainers(self, request):
        """Get top gaining stocks."""
        exchange = request.query_params.get("exchange")
        limit = int(request.query_params.get("limit", 10))

        queryset = self.get_queryset()
        if exchange:
            queryset = queryset.filter(exchange__code=exchange)

        # Order by price change percent (calculated in Python for accuracy)
        companies = list(queryset)
        companies.sort(key=lambda x: x.price_change_percent, reverse=True)

        serializer = CompanyMinimalSerializer(companies[:limit], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    @cache_response(ttl=CacheTTL.SHORT, key_prefix="market_losers")
    def losers(self, request):
        """Get top losing stocks."""
        exchange = request.query_params.get("exchange")
        limit = int(request.query_params.get("limit", 10))

        queryset = self.get_queryset()
        if exchange:
            queryset = queryset.filter(exchange__code=exchange)

        companies = list(queryset)
        companies.sort(key=lambda x: x.price_change_percent)

        serializer = CompanyMinimalSerializer(companies[:limit], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="most-active")
    @cache_response(ttl=CacheTTL.SHORT, key_prefix="market_active")
    def most_active(self, request):
        """Get most actively traded stocks by volume."""
        exchange = request.query_params.get("exchange")
        limit = int(request.query_params.get("limit", 10))

        queryset = self.get_queryset().order_by("-volume")
        if exchange:
            queryset = queryset.filter(exchange__code=exchange)

        serializer = CompanyMinimalSerializer(queryset[:limit], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    @cache_ticker_tape
    def ticker_tape(self, request):
        """Get data for the scrolling ticker tape."""
        companies = self.get_queryset().filter(is_featured=True).order_by("symbol")[:20]

        data = [
            {
                "symbol": c.symbol,
                "price": c.current_price,
                "change": c.price_change,
                "change_percent": c.price_change_percent,
                "is_up": c.is_up,
            }
            for c in companies
        ]

        serializer = TickerTapeSerializer(data, many=True)
        return Response(serializer.data)


class MarketTickerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for MarketTicker historical data."""

    queryset = MarketTicker.objects.all()
    serializer_class = MarketTickerSerializer
    permission_classes = [AllowAny]
    pagination_class = MarketDataPagination
    filterset_fields = ["company", "interval"]

    def get_queryset(self):
        queryset = super().get_queryset()
        company_id = self.request.query_params.get("company")
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset.select_related("company")


class MarketIndexViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for MarketIndex model."""

    queryset = MarketIndex.objects.all().select_related("exchange")
    serializer_class = MarketIndexSerializer
    permission_classes = [AllowAny]
    lookup_field = "code"

    @cache_response(ttl=CacheTTL.SHORT, key_prefix="market_indices")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    @cache_response(ttl=CacheTTL.SHORT, key_prefix="indices_summary")
    def summary(self, request):
        """Get a summary of all indices."""
        exchange = request.query_params.get("exchange")

        queryset = self.get_queryset()
        if exchange:
            queryset = queryset.filter(exchange__code=exchange)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
