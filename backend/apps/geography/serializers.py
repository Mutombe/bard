"""
Geography Serializers
"""
from rest_framework import serializers

from .models import Country, City, GeographicTag, AfricanRegion


class CountrySerializer(serializers.ModelSerializer):
    """Full serializer for Country."""

    region_display = serializers.CharField(source="get_region_display", read_only=True)

    class Meta:
        model = Country
        fields = [
            "code",
            "name",
            "slug",
            "official_name",
            "region",
            "region_display",
            "capital",
            "currency_code",
            "currency_name",
            "currency_symbol",
            "gdp_usd",
            "population",
            "has_stock_exchange",
            "primary_exchange_code",
            "timezone",
            "flag_emoji",
            "flag_image",
            "is_active",
            "is_featured",
        ]


class CountryMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Country in nested contexts."""

    class Meta:
        model = Country
        fields = ["code", "name", "flag_emoji", "region"]


class CitySerializer(serializers.ModelSerializer):
    """Serializer for City."""

    country = CountryMinimalSerializer(read_only=True)

    class Meta:
        model = City
        fields = [
            "id",
            "name",
            "slug",
            "country",
            "is_capital",
            "is_financial_center",
            "population",
        ]


class GeographicTagSerializer(serializers.ModelSerializer):
    """Serializer for GeographicTag."""

    display_name = serializers.ReadOnlyField()
    country_data = CountryMinimalSerializer(source="country", read_only=True)

    class Meta:
        model = GeographicTag
        fields = [
            "id",
            "level",
            "region",
            "country",
            "country_data",
            "city",
            "display_name",
        ]


class RegionSerializer(serializers.Serializer):
    """Serializer for region summary."""

    code = serializers.CharField()
    name = serializers.CharField()
    country_count = serializers.IntegerField()
    exchange_count = serializers.IntegerField()
    countries = CountryMinimalSerializer(many=True)


class RegionSummarySerializer(serializers.Serializer):
    """Summary of all African regions."""

    region = serializers.CharField()
    region_display = serializers.CharField()
    country_count = serializers.IntegerField()
    exchange_count = serializers.IntegerField()
    featured_countries = CountryMinimalSerializer(many=True)
