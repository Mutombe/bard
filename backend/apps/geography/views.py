"""
Geography Views
"""
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Country, City, GeographicTag, AfricanRegion
from .serializers import (
    CountrySerializer,
    CountryMinimalSerializer,
    CitySerializer,
    GeographicTagSerializer,
    RegionSummarySerializer,
)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Country model.

    Endpoints:
    - GET /countries/ - List all countries
    - GET /countries/{code}/ - Get country details
    - GET /countries/by-region/ - Countries grouped by region
    """

    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]
    lookup_field = "code"
    filterset_fields = ["region", "has_stock_exchange", "is_featured"]
    search_fields = ["name", "code", "official_name"]
    ordering_fields = ["name", "region", "gdp_usd", "population"]

    def get_serializer_class(self):
        if self.action == "list":
            return CountryMinimalSerializer
        return CountrySerializer

    @action(detail=False, methods=["get"], url_path="by-region")
    def by_region(self, request):
        """Get countries grouped by African region."""
        result = []

        for region_code, region_name in AfricanRegion.choices:
            countries = self.get_queryset().filter(region=region_code)
            exchange_count = countries.filter(has_stock_exchange=True).count()
            featured = countries.filter(is_featured=True)[:3]

            result.append({
                "region": region_code,
                "region_display": region_name,
                "country_count": countries.count(),
                "exchange_count": exchange_count,
                "featured_countries": CountryMinimalSerializer(featured, many=True).data,
            })

        return Response(result)

    @action(detail=False, methods=["get"], url_path="with-exchanges")
    def with_exchanges(self, request):
        """Get only countries with stock exchanges."""
        countries = self.get_queryset().filter(has_stock_exchange=True)
        serializer = self.get_serializer(countries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def cities(self, request, code=None):
        """Get cities for a specific country."""
        country = self.get_object()
        cities = country.cities.all()
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data)


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for City model."""

    queryset = City.objects.all().select_related("country")
    serializer_class = CitySerializer
    permission_classes = [AllowAny]
    filterset_fields = ["country", "is_capital", "is_financial_center"]
    search_fields = ["name"]

    @action(detail=False, methods=["get"], url_path="financial-centers")
    def financial_centers(self, request):
        """Get major financial centers."""
        cities = self.get_queryset().filter(is_financial_center=True)
        serializer = self.get_serializer(cities, many=True)
        return Response(serializer.data)


class RegionViewSet(viewsets.ViewSet):
    """
    ViewSet for African regions.

    Provides region-level aggregations and summaries.
    """

    permission_classes = [AllowAny]

    def list(self, request):
        """List all African regions with summaries."""
        result = []

        for region_code, region_name in AfricanRegion.choices:
            countries = Country.objects.filter(region=region_code, is_active=True)
            exchange_count = countries.filter(has_stock_exchange=True).count()

            # Get aggregated stats
            total_gdp = sum(c.gdp_usd or 0 for c in countries)
            total_population = sum(c.population or 0 for c in countries)

            result.append({
                "code": region_code,
                "name": region_name,
                "country_count": countries.count(),
                "exchange_count": exchange_count,
                "total_gdp_usd": total_gdp,
                "total_population": total_population,
                "countries": CountryMinimalSerializer(countries, many=True).data,
            })

        return Response(result)

    def retrieve(self, request, pk=None):
        """Get details for a specific region."""
        try:
            region_name = dict(AfricanRegion.choices)[pk]
        except KeyError:
            return Response(
                {"error": "Region not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        countries = Country.objects.filter(region=pk, is_active=True)

        return Response({
            "code": pk,
            "name": region_name,
            "country_count": countries.count(),
            "exchange_count": countries.filter(has_stock_exchange=True).count(),
            "countries": CountrySerializer(countries, many=True).data,
        })
