"""
Engagement Admin Configuration
"""
from django.contrib import admin

from .models import NewsletterSubscription, Notification, PriceAlert


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["email", "newsletter_type", "is_active", "is_verified", "created_at"]
    list_filter = ["newsletter_type", "is_active", "is_verified"]
    search_fields = ["email", "user__email"]
    date_hierarchy = "created_at"


@admin.register(PriceAlert)
class PriceAlertAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "company",
        "alert_type",
        "target_price",
        "status",
        "created_at",
    ]
    list_filter = ["status", "alert_type"]
    search_fields = ["user__email", "company__symbol"]
    date_hierarchy = "created_at"


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "notification_type", "title", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read"]
    search_fields = ["user__email", "title"]
    date_hierarchy = "created_at"
