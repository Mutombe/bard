"""
Geography Admin Configuration
"""
from django.contrib import admin

from .models import Country, City, GeographicTag


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = [
        "flag_emoji",
        "name",
        "code",
        "region",
        "currency_code",
        "has_stock_exchange",
        "primary_exchange_code",
        "is_featured",
    ]
    list_filter = ["region", "has_stock_exchange", "is_active", "is_featured"]
    search_fields = ["name", "code", "official_name"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["region", "name"]

    fieldsets = (
        (None, {"fields": ("code", "name", "slug", "official_name")}),
        ("Geography", {"fields": ("region", "capital", "timezone")}),
        ("Currency", {"fields": ("currency_code", "currency_name", "currency_symbol")}),
        ("Economy", {"fields": ("gdp_usd", "population")}),
        ("Markets", {"fields": ("has_stock_exchange", "primary_exchange_code")}),
        ("Display", {"fields": ("flag_emoji", "flag_image", "is_active", "is_featured")}),
    )


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ["name", "country", "is_capital", "is_financial_center", "population"]
    list_filter = ["country__region", "is_capital", "is_financial_center"]
    search_fields = ["name", "country__name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(GeographicTag)
class GeographicTagAdmin(admin.ModelAdmin):
    list_display = ["__str__", "level", "region", "country", "city"]
    list_filter = ["level", "region"]
