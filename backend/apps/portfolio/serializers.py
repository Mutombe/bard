"""
Portfolio Serializers
"""
from rest_framework import serializers

from apps.markets.serializers import CompanyMinimalSerializer

from .models import (
    Portfolio,
    Position,
    Transaction,
    Dividend,
    PortfolioSnapshot,
    PortfolioPerformance,
    WatchlistItem,
)


class PositionSerializer(serializers.ModelSerializer):
    """Serializer for portfolio positions."""

    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True)
    cost_basis = serializers.ReadOnlyField()
    current_price = serializers.ReadOnlyField()
    market_value = serializers.ReadOnlyField()
    unrealized_gain_loss = serializers.ReadOnlyField()
    unrealized_gain_loss_percent = serializers.ReadOnlyField()
    day_gain_loss = serializers.ReadOnlyField()

    class Meta:
        model = Position
        fields = [
            "id",
            "portfolio",
            "company",
            "company_id",
            "quantity",
            "average_cost",
            "first_purchase_date",
            "last_transaction_date",
            "notes",
            "cost_basis",
            "current_price",
            "market_value",
            "unrealized_gain_loss",
            "unrealized_gain_loss_percent",
            "day_gain_loss",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "first_purchase_date",
            "last_transaction_date",
        ]


class PositionMinimalSerializer(serializers.ModelSerializer):
    """Minimal position serializer."""

    symbol = serializers.CharField(source="company.symbol", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    market_value = serializers.ReadOnlyField()
    unrealized_gain_loss_percent = serializers.ReadOnlyField()

    class Meta:
        model = Position
        fields = [
            "id",
            "symbol",
            "company_name",
            "quantity",
            "average_cost",
            "market_value",
            "unrealized_gain_loss_percent",
        ]


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions."""

    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False)
    total_cost = serializers.ReadOnlyField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "portfolio",
            "company",
            "company_id",
            "transaction_type",
            "date",
            "quantity",
            "price",
            "amount",
            "currency",
            "commission",
            "fees",
            "notes",
            "tax_lot_id",
            "total_cost",
            "created_at",
        ]


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transactions."""

    class Meta:
        model = Transaction
        fields = [
            "portfolio",
            "company",
            "transaction_type",
            "date",
            "quantity",
            "price",
            "amount",
            "currency",
            "commission",
            "fees",
            "notes",
        ]

    def validate(self, data):
        tx_type = data.get("transaction_type")

        # Stock transactions require company, quantity, price
        if tx_type in ["buy", "sell"]:
            if not data.get("company"):
                raise serializers.ValidationError(
                    {"company": "Company is required for buy/sell transactions"}
                )
            if not data.get("quantity"):
                raise serializers.ValidationError(
                    {"quantity": "Quantity is required for buy/sell transactions"}
                )
            if not data.get("price"):
                raise serializers.ValidationError(
                    {"price": "Price is required for buy/sell transactions"}
                )
            # Calculate amount if not provided
            if not data.get("amount"):
                data["amount"] = data["quantity"] * data["price"]

        # Cash transactions require amount only
        if tx_type in ["deposit", "withdrawal"]:
            if not data.get("amount"):
                raise serializers.ValidationError(
                    {"amount": "Amount is required for cash transactions"}
                )

        return data


class DividendSerializer(serializers.ModelSerializer):
    """Serializer for dividends."""

    company = CompanyMinimalSerializer(read_only=True)

    class Meta:
        model = Dividend
        fields = [
            "id",
            "portfolio",
            "company",
            "dividend_type",
            "ex_date",
            "pay_date",
            "shares_held",
            "dividend_per_share",
            "gross_amount",
            "tax_withheld",
            "net_amount",
            "currency",
            "is_reinvested",
            "created_at",
        ]


class PortfolioSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for portfolio snapshots."""

    class Meta:
        model = PortfolioSnapshot
        fields = [
            "id",
            "date",
            "total_value",
            "cash_balance",
            "positions_value",
            "day_change",
            "day_change_percent",
            "position_count",
        ]


class PortfolioPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for portfolio performance."""

    class Meta:
        model = PortfolioPerformance
        fields = [
            "return_1d",
            "return_1w",
            "return_1m",
            "return_3m",
            "return_ytd",
            "return_1y",
            "return_all",
            "volatility",
            "sharpe_ratio",
            "beta",
            "total_dividends_received",
            "dividend_yield",
            "best_day",
            "best_day_date",
            "worst_day",
            "worst_day_date",
            "last_calculated",
        ]


class WatchlistItemSerializer(serializers.ModelSerializer):
    """Serializer for watchlist items."""

    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True)
    current_price = serializers.SerializerMethodField()
    price_vs_target_buy = serializers.SerializerMethodField()
    price_vs_target_sell = serializers.SerializerMethodField()

    class Meta:
        model = WatchlistItem
        fields = [
            "id",
            "portfolio",
            "company",
            "company_id",
            "target_buy_price",
            "target_sell_price",
            "notes",
            "alert_on_target",
            "alert_on_news",
            "current_price",
            "price_vs_target_buy",
            "price_vs_target_sell",
            "created_at",
        ]

    def get_current_price(self, obj):
        ticker = obj.company.tickers.filter(is_primary=True).first()
        return float(ticker.last_price) if ticker else None

    def get_price_vs_target_buy(self, obj):
        if not obj.target_buy_price:
            return None
        current = self.get_current_price(obj)
        if current:
            return ((current - float(obj.target_buy_price)) / float(obj.target_buy_price)) * 100
        return None

    def get_price_vs_target_sell(self, obj):
        if not obj.target_sell_price:
            return None
        current = self.get_current_price(obj)
        if current:
            return ((current - float(obj.target_sell_price)) / float(obj.target_sell_price)) * 100
        return None


class PortfolioSerializer(serializers.ModelSerializer):
    """Full portfolio serializer."""

    positions = PositionMinimalSerializer(many=True, read_only=True)
    performance = PortfolioPerformanceSerializer(read_only=True)
    total_value = serializers.ReadOnlyField()
    total_cost = serializers.ReadOnlyField()
    total_gain_loss = serializers.ReadOnlyField()
    total_gain_loss_percent = serializers.ReadOnlyField()
    position_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            "id",
            "name",
            "description",
            "portfolio_type",
            "base_currency",
            "is_default",
            "is_public",
            "show_values",
            "cash_balance",
            "total_value",
            "total_cost",
            "total_gain_loss",
            "total_gain_loss_percent",
            "positions",
            "performance",
            "position_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user"]

    def get_position_count(self, obj):
        return obj.positions.count()


class PortfolioListSerializer(serializers.ModelSerializer):
    """List serializer for portfolios."""

    total_value = serializers.ReadOnlyField()
    total_gain_loss_percent = serializers.ReadOnlyField()
    position_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            "id",
            "name",
            "portfolio_type",
            "base_currency",
            "is_default",
            "total_value",
            "total_gain_loss_percent",
            "position_count",
        ]

    def get_position_count(self, obj):
        return obj.positions.count()


class PortfolioCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating portfolios."""

    class Meta:
        model = Portfolio
        fields = [
            "name",
            "description",
            "portfolio_type",
            "base_currency",
            "is_default",
            "is_public",
            "show_values",
            "cash_balance",
        ]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class PortfolioSummarySerializer(serializers.Serializer):
    """Summary of all user portfolios."""

    total_portfolios = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=18, decimal_places=2)
    total_gain_loss = serializers.DecimalField(max_digits=18, decimal_places=2)
    total_gain_loss_percent = serializers.DecimalField(max_digits=8, decimal_places=4)
    total_positions = serializers.IntegerField()
    total_cash = serializers.DecimalField(max_digits=18, decimal_places=2)
    best_performer = serializers.DictField(required=False)
    worst_performer = serializers.DictField(required=False)
