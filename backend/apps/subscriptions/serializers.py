"""
Serializers for Subscription and Payment models.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    SubscriptionPlan,
    PlanFeature,
    Subscription,
    Payment,
    Invoice,
    InvoiceItem,
    Coupon,
    PaymentMethod,
)


class PlanFeatureSerializer(serializers.ModelSerializer):
    """Serializer for plan features."""

    class Meta:
        model = PlanFeature
        fields = [
            "id",
            "name",
            "description",
            "is_included",
            "display_order",
        ]


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""

    plan_features = PlanFeatureSerializer(many=True, read_only=True)
    price_display = serializers.SerializerMethodField()
    monthly_price = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "plan_type",
            "description",
            "price_usd",
            "price_zar",
            "price_ngn",
            "billing_cycle",
            "price_display",
            "monthly_price",
            "article_limit",
            "api_calls_limit",
            "portfolio_limit",
            "watchlist_limit",
            "alert_limit",
            "features",
            "plan_features",
            "is_featured",
            "trial_days",
            "has_unlimited_articles",
            "has_api_access",
        ]

    def get_price_display(self, obj):
        currency = self.context.get("currency", "usd")
        return obj.get_price_display(currency)

    def get_monthly_price(self, obj):
        """Calculate equivalent monthly price for comparison."""
        cycle_months = {
            "monthly": 1,
            "quarterly": 3,
            "annual": 12,
        }
        months = cycle_months.get(obj.billing_cycle, 1)
        return round(obj.price_usd / months)


class SubscriptionPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for plan listings."""

    features_count = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "plan_type",
            "price_usd",
            "billing_cycle",
            "is_featured",
            "features_count",
        ]

    def get_features_count(self, obj):
        return obj.plan_features.filter(is_included=True).count()


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user subscriptions."""

    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.UUIDField(write_only=True)
    days_remaining = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    is_trialing = serializers.ReadOnlyField()
    usage = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "plan_id",
            "status",
            "start_date",
            "end_date",
            "trial_end_date",
            "canceled_at",
            "current_period_start",
            "current_period_end",
            "currency",
            "auto_renew",
            "days_remaining",
            "is_active",
            "is_trialing",
            "usage",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "start_date",
            "trial_end_date",
            "canceled_at",
            "current_period_start",
            "current_period_end",
            "created_at",
        ]

    def get_usage(self, obj):
        return {
            "articles_read": obj.articles_read_this_period,
            "articles_limit": obj.plan.article_limit,
            "articles_remaining": max(
                0, obj.plan.article_limit - obj.articles_read_this_period
            ) if obj.plan.article_limit > 0 else None,
            "api_calls": obj.api_calls_this_period,
            "api_calls_limit": obj.plan.api_calls_limit,
            "api_calls_remaining": max(
                0, obj.plan.api_calls_limit - obj.api_calls_this_period
            ) if obj.plan.api_calls_limit > 0 else None,
        }


class SubscriptionCreateSerializer(serializers.Serializer):
    """Serializer for creating a new subscription."""

    plan_id = serializers.UUIDField()
    payment_method_id = serializers.CharField(required=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    currency = serializers.ChoiceField(
        choices=["USD", "ZAR", "NGN"],
        default="USD"
    )

    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive plan.")
        return value

    def validate_coupon_code(self, value):
        if not value:
            return value
        try:
            coupon = Coupon.objects.get(code=value.upper())
            if not coupon.is_valid:
                raise serializers.ValidationError("Coupon is no longer valid.")
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code.")
        return value.upper()


class SubscriptionCancelSerializer(serializers.Serializer):
    """Serializer for canceling a subscription."""

    reason = serializers.CharField(required=False, allow_blank=True)
    cancel_immediately = serializers.BooleanField(default=False)
    feedback = serializers.ChoiceField(
        choices=[
            ("too_expensive", "Too expensive"),
            ("missing_features", "Missing features"),
            ("not_using", "Not using enough"),
            ("found_alternative", "Found an alternative"),
            ("other", "Other"),
        ],
        required=False
    )


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""

    amount_display = serializers.ReadOnlyField(source="get_amount_display")
    is_successful = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "amount_display",
            "currency",
            "status",
            "provider",
            "card_last_four",
            "card_brand",
            "paid_at",
            "receipt_url",
            "description",
            "is_successful",
            "created_at",
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating a payment."""

    amount = serializers.IntegerField(min_value=100)
    currency = serializers.ChoiceField(
        choices=["USD", "ZAR", "NGN"],
        default="USD"
    )
    payment_method_id = serializers.CharField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice items."""

    class Meta:
        model = InvoiceItem
        fields = [
            "id",
            "description",
            "quantity",
            "unit_amount",
            "total",
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices."""

    items = InvoiceItemSerializer(many=True, read_only=True)
    total_display = serializers.ReadOnlyField(source="get_total_display")

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "status",
            "subtotal",
            "tax",
            "discount",
            "total",
            "total_display",
            "currency",
            "issue_date",
            "due_date",
            "paid_date",
            "period_start",
            "period_end",
            "hosted_invoice_url",
            "pdf_url",
            "items",
            "created_at",
        ]


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for coupons."""

    discount_display = serializers.ReadOnlyField(source="get_discount_display")
    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = Coupon
        fields = [
            "code",
            "name",
            "description",
            "discount_type",
            "discount_value",
            "discount_display",
            "valid_from",
            "valid_until",
            "minimum_amount",
            "first_time_only",
            "is_valid",
        ]


class CouponValidateSerializer(serializers.Serializer):
    """Serializer for validating a coupon."""

    code = serializers.CharField()
    plan_id = serializers.UUIDField(required=False)

    def validate(self, data):
        code = data.get("code", "").upper()
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid coupon code."})

        if not coupon.is_valid:
            raise serializers.ValidationError({"code": "Coupon is no longer valid."})

        # Check plan restriction
        plan_id = data.get("plan_id")
        if plan_id and coupon.applicable_plans.exists():
            if not coupon.applicable_plans.filter(id=plan_id).exists():
                raise serializers.ValidationError({
                    "code": "Coupon is not applicable to this plan."
                })

        # Check first-time user restriction
        user = self.context.get("request").user
        if coupon.first_time_only:
            if Subscription.objects.filter(user=user).exists():
                raise serializers.ValidationError({
                    "code": "Coupon is only valid for first-time subscribers."
                })

        # Check user redemption limit
        user_redemptions = coupon.redemptions.filter(user=user).count()
        if user_redemptions >= coupon.max_redemptions_per_user:
            raise serializers.ValidationError({
                "code": "You have already used this coupon."
            })

        data["coupon"] = coupon
        return data


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for payment methods."""

    display_name = serializers.SerializerMethodField()

    class Meta:
        model = PaymentMethod
        fields = [
            "id",
            "method_type",
            "card_brand",
            "card_last_four",
            "card_exp_month",
            "card_exp_year",
            "bank_name",
            "account_last_four",
            "is_default",
            "is_active",
            "display_name",
            "created_at",
        ]

    def get_display_name(self, obj):
        return str(obj)


class PaymentMethodCreateSerializer(serializers.Serializer):
    """Serializer for adding a new payment method."""

    provider = serializers.ChoiceField(choices=["stripe", "paystack"])
    token = serializers.CharField()
    set_as_default = serializers.BooleanField(default=False)

    # For Paystack
    email = serializers.EmailField(required=False)
    authorization_code = serializers.CharField(required=False)


class CheckoutSessionSerializer(serializers.Serializer):
    """Serializer for creating a checkout session."""

    plan_id = serializers.UUIDField()
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    currency = serializers.ChoiceField(
        choices=["USD", "ZAR", "NGN"],
        default="USD"
    )

    def validate_plan_id(self, value):
        try:
            SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid plan.")
        return value


class BillingPortalSerializer(serializers.Serializer):
    """Serializer for creating a billing portal session."""

    return_url = serializers.URLField()


class UsageStatsSerializer(serializers.Serializer):
    """Serializer for subscription usage statistics."""

    articles_read = serializers.IntegerField()
    articles_limit = serializers.IntegerField()
    articles_percentage = serializers.FloatField()
    api_calls = serializers.IntegerField()
    api_calls_limit = serializers.IntegerField()
    api_calls_percentage = serializers.FloatField()
    period_start = serializers.DateTimeField()
    period_end = serializers.DateTimeField()
    days_remaining = serializers.IntegerField()


class SubscriptionSummarySerializer(serializers.Serializer):
    """Summary of user's subscription status."""

    has_active_subscription = serializers.BooleanField()
    current_plan = SubscriptionPlanSerializer(allow_null=True)
    subscription = SubscriptionSerializer(allow_null=True)
    can_upgrade = serializers.BooleanField()
    can_downgrade = serializers.BooleanField()
    available_plans = SubscriptionPlanListSerializer(many=True)
