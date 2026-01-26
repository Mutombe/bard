"""
Admin configuration for Subscription models.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    SubscriptionPlan,
    PlanFeature,
    Subscription,
    Payment,
    Invoice,
    InvoiceItem,
    Coupon,
    CouponRedemption,
    PaymentMethod,
    WebhookEvent,
)


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 1
    fields = ["name", "description", "is_included", "display_order"]


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "plan_type",
        "billing_cycle",
        "price_display",
        "is_featured",
        "is_active",
    ]
    list_filter = ["plan_type", "billing_cycle", "is_featured", "is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [PlanFeatureInline]

    fieldsets = (
        (None, {
            "fields": ("name", "slug", "plan_type", "description")
        }),
        ("Pricing", {
            "fields": (
                "price_usd", "price_zar", "price_ngn",
                "billing_cycle", "trial_days"
            )
        }),
        ("Limits", {
            "fields": (
                "article_limit", "api_calls_limit",
                "portfolio_limit", "watchlist_limit", "alert_limit"
            )
        }),
        ("Features", {
            "fields": ("features",)
        }),
        ("Provider IDs", {
            "fields": ("stripe_price_id", "paystack_plan_code"),
            "classes": ("collapse",)
        }),
        ("Display", {
            "fields": ("is_featured", "is_active", "display_order")
        }),
    )

    def price_display(self, obj):
        return obj.get_price_display("usd")
    price_display.short_description = "Price (USD)"


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "user_email",
        "plan",
        "status_badge",
        "currency",
        "current_period_end",
        "auto_renew",
        "created_at",
    ]
    list_filter = ["status", "plan", "currency", "auto_renew"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    raw_id_fields = ["user", "plan"]
    readonly_fields = [
        "id", "stripe_subscription_id", "stripe_customer_id",
        "paystack_subscription_code", "paystack_customer_code",
        "created_at", "updated_at"
    ]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {
            "fields": ("id", "user", "plan", "status")
        }),
        ("Period", {
            "fields": (
                "start_date", "end_date", "trial_end_date",
                "current_period_start", "current_period_end"
            )
        }),
        ("Billing", {
            "fields": ("currency", "auto_renew")
        }),
        ("Usage", {
            "fields": ("articles_read_this_period", "api_calls_this_period")
        }),
        ("Cancellation", {
            "fields": ("canceled_at", "cancel_reason"),
            "classes": ("collapse",)
        }),
        ("Provider References", {
            "fields": (
                "stripe_subscription_id", "stripe_customer_id",
                "paystack_subscription_code", "paystack_customer_code"
            ),
            "classes": ("collapse",)
        }),
        ("Metadata", {
            "fields": ("metadata",),
            "classes": ("collapse",)
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"

    def status_badge(self, obj):
        colors = {
            "active": "#10B981",
            "trialing": "#3B82F6",
            "past_due": "#F59E0B",
            "canceled": "#EF4444",
            "expired": "#6B7280",
            "paused": "#8B5CF6",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user_email",
        "amount_display",
        "status_badge",
        "provider",
        "paid_at",
        "created_at",
    ]
    list_filter = ["status", "provider", "currency"]
    search_fields = ["user__email", "provider_payment_id"]
    raw_id_fields = ["user", "subscription"]
    readonly_fields = [
        "id", "provider_payment_id", "provider_customer_id",
        "created_at", "updated_at"
    ]
    date_hierarchy = "created_at"

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"

    def amount_display(self, obj):
        return obj.get_amount_display()
    amount_display.short_description = "Amount"

    def status_badge(self, obj):
        colors = {
            "pending": "#F59E0B",
            "processing": "#3B82F6",
            "completed": "#10B981",
            "failed": "#EF4444",
            "refunded": "#8B5CF6",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ["total"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number",
        "user_email",
        "total_display",
        "status_badge",
        "issue_date",
        "due_date",
    ]
    list_filter = ["status", "currency"]
    search_fields = ["invoice_number", "user__email"]
    raw_id_fields = ["user", "subscription", "payment"]
    readonly_fields = [
        "id", "invoice_number", "total",
        "stripe_invoice_id", "paystack_invoice_id",
        "created_at", "updated_at"
    ]
    inlines = [InvoiceItemInline]
    date_hierarchy = "issue_date"

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"

    def total_display(self, obj):
        return obj.get_total_display()
    total_display.short_description = "Total"

    def status_badge(self, obj):
        colors = {
            "draft": "#6B7280",
            "open": "#3B82F6",
            "paid": "#10B981",
            "void": "#EF4444",
            "uncollectible": "#F59E0B",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "name",
        "discount_display",
        "times_redeemed",
        "max_redemptions",
        "valid_until",
        "is_active",
    ]
    list_filter = ["discount_type", "is_active", "first_time_only"]
    search_fields = ["code", "name"]
    filter_horizontal = ["applicable_plans"]
    readonly_fields = ["times_redeemed"]

    fieldsets = (
        (None, {
            "fields": ("code", "name", "description")
        }),
        ("Discount", {
            "fields": ("discount_type", "discount_value")
        }),
        ("Limits", {
            "fields": (
                "max_redemptions", "max_redemptions_per_user",
                "times_redeemed"
            )
        }),
        ("Validity", {
            "fields": ("valid_from", "valid_until", "is_active")
        }),
        ("Restrictions", {
            "fields": (
                "applicable_plans", "minimum_amount", "first_time_only"
            )
        }),
        ("Provider IDs", {
            "fields": ("stripe_coupon_id", "paystack_coupon_id"),
            "classes": ("collapse",)
        }),
    )

    def discount_display(self, obj):
        return obj.get_discount_display()
    discount_display.short_description = "Discount"


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ["coupon", "user", "discount_applied", "created_at"]
    list_filter = ["coupon"]
    search_fields = ["user__email", "coupon__code"]
    raw_id_fields = ["user", "coupon", "subscription"]


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "method_type",
        "display_name",
        "is_default",
        "is_active",
        "created_at",
    ]
    list_filter = ["method_type", "is_default", "is_active"]
    search_fields = ["user__email", "card_last_four"]
    raw_id_fields = ["user"]

    def display_name(self, obj):
        return str(obj)
    display_name.short_description = "Card/Account"


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = [
        "event_id",
        "provider",
        "event_type",
        "status_badge",
        "attempts",
        "created_at",
    ]
    list_filter = ["provider", "status", "event_type"]
    search_fields = ["event_id", "event_type"]
    readonly_fields = [
        "event_id", "provider", "event_type", "payload",
        "response", "error_message", "processed_at", "attempts"
    ]
    date_hierarchy = "created_at"

    def status_badge(self, obj):
        colors = {
            "pending": "#F59E0B",
            "processed": "#10B981",
            "failed": "#EF4444",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"
