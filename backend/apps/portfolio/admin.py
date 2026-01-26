"""
Portfolio Admin Configuration
"""
from django.contrib import admin

from .models import (
    Portfolio,
    Position,
    Transaction,
    Dividend,
    PortfolioSnapshot,
    PortfolioPerformance,
    WatchlistItem,
)


class PositionInline(admin.TabularInline):
    model = Position
    extra = 0
    raw_id_fields = ["company"]
    readonly_fields = [
        "first_purchase_date",
        "last_transaction_date",
        "cost_basis",
        "market_value",
    ]

    def cost_basis(self, obj):
        return obj.cost_basis
    cost_basis.short_description = "Cost Basis"

    def market_value(self, obj):
        return obj.market_value
    market_value.short_description = "Market Value"


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "user",
        "portfolio_type",
        "base_currency",
        "cash_balance",
        "total_value",
        "is_default",
    ]
    list_filter = ["portfolio_type", "base_currency", "is_default", "is_public"]
    search_fields = ["name", "user__email"]
    raw_id_fields = ["user"]
    inlines = [PositionInline]

    fieldsets = (
        (None, {"fields": ("user", "name", "description")}),
        ("Type", {"fields": ("portfolio_type", "base_currency")}),
        ("Settings", {"fields": ("is_default", "is_public", "show_values")}),
        ("Cash", {"fields": ("cash_balance",)}),
    )

    def total_value(self, obj):
        return f"{obj.base_currency} {obj.total_value:,.2f}"
    total_value.short_description = "Total Value"


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = [
        "company",
        "portfolio",
        "quantity",
        "average_cost",
        "cost_basis",
        "market_value",
        "unrealized_gain_loss_percent",
    ]
    list_filter = ["portfolio"]
    search_fields = ["company__symbol", "company__name", "portfolio__name"]
    raw_id_fields = ["portfolio", "company"]
    readonly_fields = [
        "first_purchase_date",
        "last_transaction_date",
    ]

    def cost_basis(self, obj):
        return f"{obj.cost_basis:,.2f}"
    cost_basis.short_description = "Cost Basis"

    def market_value(self, obj):
        return f"{obj.market_value:,.2f}"
    market_value.short_description = "Market Value"

    def unrealized_gain_loss_percent(self, obj):
        pct = obj.unrealized_gain_loss_percent
        return f"{pct:+.2f}%"
    unrealized_gain_loss_percent.short_description = "Gain/Loss %"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "date",
        "portfolio",
        "transaction_type",
        "company",
        "quantity",
        "price",
        "amount",
        "total_cost",
    ]
    list_filter = ["transaction_type", "date", "portfolio"]
    search_fields = ["company__symbol", "portfolio__name"]
    raw_id_fields = ["portfolio", "company"]
    date_hierarchy = "date"

    fieldsets = (
        (None, {"fields": ("portfolio", "transaction_type", "date")}),
        ("Security", {"fields": ("company", "quantity", "price")}),
        ("Amount", {"fields": ("amount", "currency")}),
        ("Fees", {"fields": ("commission", "fees")}),
        ("Notes", {"fields": ("notes", "tax_lot_id")}),
    )

    def total_cost(self, obj):
        return f"{obj.total_cost:,.2f}"
    total_cost.short_description = "Total Cost"


@admin.register(Dividend)
class DividendAdmin(admin.ModelAdmin):
    list_display = [
        "company",
        "portfolio",
        "pay_date",
        "shares_held",
        "dividend_per_share",
        "gross_amount",
        "net_amount",
    ]
    list_filter = ["dividend_type", "pay_date"]
    search_fields = ["company__symbol", "portfolio__name"]
    raw_id_fields = ["portfolio", "company", "reinvestment_transaction"]
    date_hierarchy = "pay_date"


@admin.register(PortfolioSnapshot)
class PortfolioSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        "portfolio",
        "date",
        "total_value",
        "positions_value",
        "cash_balance",
        "day_change_percent",
    ]
    list_filter = ["date", "portfolio"]
    raw_id_fields = ["portfolio"]
    date_hierarchy = "date"
    readonly_fields = ["created_at"]


@admin.register(PortfolioPerformance)
class PortfolioPerformanceAdmin(admin.ModelAdmin):
    list_display = [
        "portfolio",
        "return_1d",
        "return_1w",
        "return_1m",
        "return_ytd",
        "return_1y",
        "sharpe_ratio",
    ]
    raw_id_fields = ["portfolio"]
    readonly_fields = ["last_calculated"]

    fieldsets = (
        ("Portfolio", {"fields": ("portfolio",)}),
        ("Returns", {"fields": (
            "return_1d", "return_1w", "return_1m", "return_3m",
            "return_ytd", "return_1y", "return_all"
        )}),
        ("Risk", {"fields": ("volatility", "sharpe_ratio", "beta")}),
        ("Dividends", {"fields": ("total_dividends_received", "dividend_yield")}),
        ("Best/Worst", {"fields": (
            "best_day", "best_day_date", "worst_day", "worst_day_date"
        )}),
        ("Meta", {"fields": ("last_calculated",)}),
    )


@admin.register(WatchlistItem)
class WatchlistItemAdmin(admin.ModelAdmin):
    list_display = [
        "company",
        "portfolio",
        "target_buy_price",
        "target_sell_price",
        "alert_on_target",
        "alert_on_news",
    ]
    list_filter = ["alert_on_target", "alert_on_news"]
    search_fields = ["company__symbol", "portfolio__name"]
    raw_id_fields = ["portfolio", "company"]
