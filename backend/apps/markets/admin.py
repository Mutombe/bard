"""
Market Admin Configuration
"""
from django.contrib import admin

from .models import Company, Exchange, MarketIndex, MarketTicker, Sector


@admin.register(Exchange)
class ExchangeAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "country", "currency", "is_active"]
    list_filter = ["is_active", "country"]
    search_fields = ["code", "name"]


@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "parent"]
    list_filter = ["parent"]
    search_fields = ["code", "name"]


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = [
        "symbol",
        "name",
        "exchange",
        "sector",
        "current_price",
        "volume",
        "is_active",
        "is_featured",
    ]
    list_filter = ["exchange", "sector", "is_active", "is_featured"]
    search_fields = ["symbol", "name", "isin"]
    readonly_fields = [
        "current_price",
        "previous_close",
        "volume",
        "market_cap",
        "last_updated",
    ]
    fieldsets = (
        (None, {"fields": ("symbol", "isin", "name", "short_name")}),
        ("Classification", {"fields": ("exchange", "sector")}),
        (
            "Company Info",
            {
                "fields": (
                    "description",
                    "logo",
                    "website",
                    "founded_year",
                    "employees",
                    "headquarters",
                )
            },
        ),
        (
            "Market Data",
            {
                "fields": (
                    "current_price",
                    "previous_close",
                    "day_open",
                    "day_high",
                    "day_low",
                    "volume",
                    "market_cap",
                    "pe_ratio",
                    "dividend_yield",
                    "week_52_high",
                    "week_52_low",
                    "last_updated",
                )
            },
        ),
        ("Status", {"fields": ("is_active", "is_featured")}),
    )


@admin.register(MarketTicker)
class MarketTickerAdmin(admin.ModelAdmin):
    list_display = ["company", "timestamp", "price", "volume", "interval"]
    list_filter = ["interval", "company__exchange"]
    search_fields = ["company__symbol"]
    date_hierarchy = "timestamp"


@admin.register(MarketIndex)
class MarketIndexAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "exchange", "current_value", "change_percent"]
    list_filter = ["exchange"]
    search_fields = ["code", "name"]
