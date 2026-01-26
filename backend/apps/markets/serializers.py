"""
Market Serializers

Provides serialization for market data models.
"""
from rest_framework import serializers

from .models import Company, Exchange, MarketIndex, MarketTicker, Sector


class ExchangeSerializer(serializers.ModelSerializer):
    """Serializer for Exchange model."""

    is_open = serializers.ReadOnlyField()

    class Meta:
        model = Exchange
        fields = [
            "code",
            "name",
            "country",
            "currency",
            "timezone",
            "trading_hours_start",
            "trading_hours_end",
            "is_active",
            "is_open",
            "website",
        ]


class SectorSerializer(serializers.ModelSerializer):
    """Serializer for Sector model."""

    class Meta:
        model = Sector
        fields = ["code", "name", "description"]


class CompanyMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Company (used in lists and watchlists)."""

    exchange_code = serializers.CharField(source="exchange.code", read_only=True)
    price_change = serializers.DecimalField(
        max_digits=18, decimal_places=4, read_only=True
    )
    price_change_percent = serializers.DecimalField(
        max_digits=8, decimal_places=2, read_only=True
    )
    is_up = serializers.BooleanField(read_only=True)

    class Meta:
        model = Company
        fields = [
            "id",
            "symbol",
            "name",
            "short_name",
            "exchange_code",
            "current_price",
            "price_change",
            "price_change_percent",
            "is_up",
            "volume",
        ]


class CompanySerializer(serializers.ModelSerializer):
    """Full serializer for Company model."""

    exchange = ExchangeSerializer(read_only=True)
    sector = SectorSerializer(read_only=True)
    price_change = serializers.DecimalField(
        max_digits=18, decimal_places=4, read_only=True
    )
    price_change_percent = serializers.DecimalField(
        max_digits=8, decimal_places=2, read_only=True
    )
    is_up = serializers.BooleanField(read_only=True)
    is_down = serializers.BooleanField(read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = Company
        fields = [
            "id",
            "symbol",
            "isin",
            "name",
            "short_name",
            "display_name",
            "exchange",
            "sector",
            "description",
            "logo",
            "website",
            "founded_year",
            "employees",
            "headquarters",
            "current_price",
            "previous_close",
            "day_open",
            "day_high",
            "day_low",
            "volume",
            "market_cap",
            "shares_outstanding",
            "pe_ratio",
            "dividend_yield",
            "week_52_high",
            "week_52_low",
            "price_change",
            "price_change_percent",
            "is_up",
            "is_down",
            "is_active",
            "is_featured",
            "last_updated",
            "created_at",
        ]


class MarketTickerSerializer(serializers.ModelSerializer):
    """Serializer for MarketTicker model."""

    symbol = serializers.CharField(source="company.symbol", read_only=True)

    class Meta:
        model = MarketTicker
        fields = [
            "id",
            "symbol",
            "timestamp",
            "price",
            "open_price",
            "high",
            "low",
            "close",
            "volume",
            "trade_count",
            "interval",
        ]


class MarketTickerChartSerializer(serializers.ModelSerializer):
    """Optimized serializer for chart data (minimal fields)."""

    t = serializers.DateTimeField(source="timestamp")
    o = serializers.DecimalField(source="open_price", max_digits=18, decimal_places=4)
    h = serializers.DecimalField(source="high", max_digits=18, decimal_places=4)
    l = serializers.DecimalField(source="low", max_digits=18, decimal_places=4)
    c = serializers.DecimalField(source="close", max_digits=18, decimal_places=4)
    v = serializers.IntegerField(source="volume")

    class Meta:
        model = MarketTicker
        fields = ["t", "o", "h", "l", "c", "v"]


class MarketIndexSerializer(serializers.ModelSerializer):
    """Serializer for MarketIndex model."""

    exchange_code = serializers.CharField(source="exchange.code", read_only=True)
    change = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    change_percent = serializers.DecimalField(
        max_digits=8, decimal_places=2, read_only=True
    )

    class Meta:
        model = MarketIndex
        fields = [
            "code",
            "name",
            "exchange_code",
            "current_value",
            "previous_close",
            "day_high",
            "day_low",
            "change",
            "change_percent",
            "ytd_change",
        ]


class TickerTapeSerializer(serializers.Serializer):
    """Serializer for the scrolling ticker tape data."""

    symbol = serializers.CharField()
    price = serializers.DecimalField(max_digits=18, decimal_places=2)
    change = serializers.DecimalField(max_digits=18, decimal_places=2)
    change_percent = serializers.DecimalField(max_digits=8, decimal_places=2)
    is_up = serializers.BooleanField()
