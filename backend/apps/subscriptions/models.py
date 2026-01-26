"""
Subscription and Payment Models for Bard Santner Journal.

Supports tiered subscriptions (Free, Premium, Enterprise) with
integration for Stripe (international) and Paystack (Africa).
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from apps.core.models import BaseModel, TimeStampedModel


class SubscriptionPlan(BaseModel):
    """
    Defines available subscription tiers and their features.
    """
    class PlanType(models.TextChoices):
        FREE = "free", "Free"
        PREMIUM = "premium", "Premium"
        PROFESSIONAL = "professional", "Professional"
        ENTERPRISE = "enterprise", "Enterprise"

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        ANNUAL = "annual", "Annual"

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    plan_type = models.CharField(
        max_length=20,
        choices=PlanType.choices,
        default=PlanType.FREE
    )
    description = models.TextField(blank=True)

    # Pricing (in cents/kobo for precision)
    price_usd = models.IntegerField(
        default=0,
        help_text="Price in USD cents"
    )
    price_zar = models.IntegerField(
        default=0,
        help_text="Price in ZAR cents"
    )
    price_ngn = models.IntegerField(
        default=0,
        help_text="Price in Nigerian Kobo"
    )

    billing_cycle = models.CharField(
        max_length=20,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY
    )

    # External IDs for payment providers
    stripe_price_id = models.CharField(max_length=100, blank=True)
    paystack_plan_code = models.CharField(max_length=100, blank=True)

    # Feature limits
    article_limit = models.IntegerField(
        default=10,
        help_text="Number of premium articles per month (0 = unlimited)"
    )
    api_calls_limit = models.IntegerField(
        default=100,
        help_text="API calls per month (0 = unlimited)"
    )
    portfolio_limit = models.IntegerField(
        default=1,
        help_text="Number of portfolios allowed"
    )
    watchlist_limit = models.IntegerField(
        default=10,
        help_text="Number of watchlist items"
    )
    alert_limit = models.IntegerField(
        default=5,
        help_text="Number of price alerts"
    )

    # Feature flags
    features = models.JSONField(
        default=dict,
        help_text="Feature flags as JSON"
    )

    # Display
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    # Trial
    trial_days = models.IntegerField(default=0)

    class Meta:
        ordering = ["display_order", "price_usd"]
        verbose_name = "Subscription Plan"
        verbose_name_plural = "Subscription Plans"

    def __str__(self):
        return f"{self.name} ({self.get_billing_cycle_display()})"

    def get_price_display(self, currency="usd"):
        """Get formatted price for display."""
        prices = {
            "usd": (self.price_usd, "$"),
            "zar": (self.price_zar, "R"),
            "ngn": (self.price_ngn, "₦"),
        }
        amount, symbol = prices.get(currency, prices["usd"])
        return f"{symbol}{amount / 100:.2f}"

    @property
    def has_unlimited_articles(self):
        return self.article_limit == 0

    @property
    def has_api_access(self):
        return self.api_calls_limit > 0 or self.plan_type in [
            self.PlanType.PROFESSIONAL,
            self.PlanType.ENTERPRISE
        ]


class PlanFeature(TimeStampedModel):
    """
    Individual features that can be enabled per plan.
    """
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        related_name="plan_features"
    )
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    is_included = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["display_order"]
        unique_together = ["plan", "name"]

    def __str__(self):
        return f"{self.plan.name}: {self.name}"


class Subscription(BaseModel):
    """
    User subscription tracking.
    """
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        TRIALING = "trialing", "Trialing"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        EXPIRED = "expired", "Expired"
        PAUSED = "paused", "Paused"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions"
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TRIALING
    )

    # Dates
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField(default=timezone.now)
    current_period_end = models.DateTimeField(null=True, blank=True)

    # Payment provider references
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    paystack_subscription_code = models.CharField(max_length=100, blank=True)
    paystack_customer_code = models.CharField(max_length=100, blank=True)

    # Billing
    currency = models.CharField(max_length=3, default="USD")
    auto_renew = models.BooleanField(default=True)

    # Usage tracking
    articles_read_this_period = models.IntegerField(default=0)
    api_calls_this_period = models.IntegerField(default=0)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    cancel_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"

    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"

    @property
    def is_active(self):
        return self.status in [self.Status.ACTIVE, self.Status.TRIALING]

    @property
    def is_trialing(self):
        return self.status == self.Status.TRIALING and (
            self.trial_end_date is None or self.trial_end_date > timezone.now()
        )

    @property
    def days_remaining(self):
        if not self.current_period_end:
            return None
        delta = self.current_period_end - timezone.now()
        return max(0, delta.days)

    def can_read_premium_article(self):
        """Check if user can read another premium article this period."""
        if self.plan.has_unlimited_articles:
            return True
        return self.articles_read_this_period < self.plan.article_limit

    def can_make_api_call(self):
        """Check if user can make another API call this period."""
        if self.plan.api_calls_limit == 0:
            return self.plan.has_api_access
        return self.api_calls_this_period < self.plan.api_calls_limit

    def increment_article_read(self):
        """Increment the article read counter."""
        self.articles_read_this_period += 1
        self.save(update_fields=["articles_read_this_period"])

    def increment_api_call(self):
        """Increment the API call counter."""
        self.api_calls_this_period += 1
        self.save(update_fields=["api_calls_this_period"])

    def reset_usage_counters(self):
        """Reset usage counters for new billing period."""
        self.articles_read_this_period = 0
        self.api_calls_this_period = 0
        self.save(update_fields=[
            "articles_read_this_period",
            "api_calls_this_period"
        ])


class Payment(BaseModel):
    """
    Payment transaction records.
    """
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially Refunded"

    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYSTACK = "paystack", "Paystack"
        MANUAL = "manual", "Manual"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments"
    )

    # Amount (in smallest currency unit)
    amount = models.IntegerField(validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="USD")

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Provider info
    provider = models.CharField(
        max_length=20,
        choices=Provider.choices
    )
    provider_payment_id = models.CharField(max_length=255, blank=True)
    provider_customer_id = models.CharField(max_length=255, blank=True)

    # Card details (last 4 only for reference)
    card_last_four = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=50, blank=True)

    # Timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    # Refund tracking
    refund_amount = models.IntegerField(default=0)
    refund_reason = models.TextField(blank=True)

    # Description
    description = models.TextField(blank=True)

    # Receipt
    receipt_url = models.URLField(blank=True)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"{self.user.email} - {self.get_amount_display()} ({self.status})"

    def get_amount_display(self):
        """Get formatted amount."""
        symbols = {"USD": "$", "ZAR": "R", "NGN": "₦", "GBP": "£", "EUR": "€"}
        symbol = symbols.get(self.currency.upper(), self.currency)
        return f"{symbol}{self.amount / 100:.2f}"

    @property
    def is_successful(self):
        return self.status == self.Status.COMPLETED

    @property
    def can_refund(self):
        return self.status == self.Status.COMPLETED and self.refund_amount < self.amount


class Invoice(BaseModel):
    """
    Invoice records for subscriptions.
    """
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        PAID = "paid", "Paid"
        VOID = "void", "Void"
        UNCOLLECTIBLE = "uncollectible", "Uncollectible"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="invoices"
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices"
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    # Amounts
    subtotal = models.IntegerField(default=0)
    tax = models.IntegerField(default=0)
    discount = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    currency = models.CharField(max_length=3, default="USD")

    # Dates
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    paid_date = models.DateField(null=True, blank=True)

    # Period
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)

    # Provider reference
    stripe_invoice_id = models.CharField(max_length=100, blank=True)
    paystack_invoice_id = models.CharField(max_length=100, blank=True)

    # URLs
    hosted_invoice_url = models.URLField(blank=True)
    pdf_url = models.URLField(blank=True)

    # Billing details
    billing_name = models.CharField(max_length=255, blank=True)
    billing_email = models.EmailField(blank=True)
    billing_address = models.TextField(blank=True)
    billing_country = models.CharField(max_length=2, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-issue_date"]
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate invoice number
            prefix = timezone.now().strftime("%Y%m")
            last_invoice = Invoice.objects.filter(
                invoice_number__startswith=f"INV-{prefix}"
            ).order_by("-invoice_number").first()

            if last_invoice:
                last_num = int(last_invoice.invoice_number.split("-")[-1])
                self.invoice_number = f"INV-{prefix}-{last_num + 1:05d}"
            else:
                self.invoice_number = f"INV-{prefix}-00001"

        # Calculate total
        self.total = self.subtotal + self.tax - self.discount
        super().save(*args, **kwargs)

    def get_total_display(self):
        """Get formatted total."""
        symbols = {"USD": "$", "ZAR": "R", "NGN": "₦"}
        symbol = symbols.get(self.currency.upper(), self.currency)
        return f"{symbol}{self.total / 100:.2f}"


class InvoiceItem(TimeStampedModel):
    """
    Individual line items on an invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items"
    )
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_amount = models.IntegerField(default=0)
    total = models.IntegerField(default=0)

    # Reference to plan if applicable
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.invoice.invoice_number}: {self.description}"

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_amount
        super().save(*args, **kwargs)


class Coupon(BaseModel):
    """
    Discount coupons for subscriptions.
    """
    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", "Percentage"
        FIXED = "fixed", "Fixed Amount"

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE
    )
    discount_value = models.IntegerField(
        help_text="Percentage (0-100) or amount in cents"
    )

    # Limits
    max_redemptions = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum total redemptions"
    )
    max_redemptions_per_user = models.IntegerField(default=1)

    # Validity
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)

    # Restrictions
    applicable_plans = models.ManyToManyField(
        SubscriptionPlan,
        blank=True,
        help_text="Leave empty to apply to all plans"
    )
    minimum_amount = models.IntegerField(
        default=0,
        help_text="Minimum purchase amount in cents"
    )
    first_time_only = models.BooleanField(default=False)

    # Usage tracking
    times_redeemed = models.IntegerField(default=0)

    # Status
    is_active = models.BooleanField(default=True)

    # Provider references
    stripe_coupon_id = models.CharField(max_length=100, blank=True)
    paystack_coupon_id = models.CharField(max_length=100, blank=True)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} - {self.get_discount_display()}"

    def get_discount_display(self):
        if self.discount_type == self.DiscountType.PERCENTAGE:
            return f"{self.discount_value}% off"
        return f"${self.discount_value / 100:.2f} off"

    @property
    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if now < self.valid_from:
            return False
        if self.max_redemptions and self.times_redeemed >= self.max_redemptions:
            return False
        return True

    def calculate_discount(self, amount):
        """Calculate discount for a given amount."""
        if self.discount_type == self.DiscountType.PERCENTAGE:
            return int(amount * self.discount_value / 100)
        return min(self.discount_value, amount)


class CouponRedemption(TimeStampedModel):
    """
    Track coupon usage by users.
    """
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name="redemptions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coupon_redemptions"
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    discount_applied = models.IntegerField(default=0)

    class Meta:
        unique_together = ["coupon", "user", "subscription"]

    def __str__(self):
        return f"{self.user.email} used {self.coupon.code}"


class PaymentMethod(BaseModel):
    """
    Saved payment methods for users.
    """
    class MethodType(models.TextChoices):
        CARD = "card", "Credit/Debit Card"
        BANK_ACCOUNT = "bank_account", "Bank Account"
        MOBILE_MONEY = "mobile_money", "Mobile Money"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_methods"
    )

    method_type = models.CharField(
        max_length=20,
        choices=MethodType.choices,
        default=MethodType.CARD
    )

    # Card details
    card_brand = models.CharField(max_length=50, blank=True)
    card_last_four = models.CharField(max_length=4, blank=True)
    card_exp_month = models.IntegerField(null=True, blank=True)
    card_exp_year = models.IntegerField(null=True, blank=True)

    # Bank details
    bank_name = models.CharField(max_length=100, blank=True)
    account_last_four = models.CharField(max_length=4, blank=True)

    # Provider references
    stripe_payment_method_id = models.CharField(max_length=100, blank=True)
    paystack_authorization_code = models.CharField(max_length=100, blank=True)

    # Status
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Billing address
    billing_name = models.CharField(max_length=255, blank=True)
    billing_country = models.CharField(max_length=2, blank=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        if self.method_type == self.MethodType.CARD:
            return f"{self.card_brand} •••• {self.card_last_four}"
        return f"{self.bank_name} •••• {self.account_last_four}"

    def save(self, *args, **kwargs):
        # Ensure only one default per user
        if self.is_default:
            PaymentMethod.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class WebhookEvent(TimeStampedModel):
    """
    Log of webhook events from payment providers.
    """
    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYSTACK = "paystack", "Paystack"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"

    event_id = models.CharField(max_length=255, unique=True)
    provider = models.CharField(max_length=20, choices=Provider.choices)
    event_type = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    payload = models.JSONField()
    response = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)

    processed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.IntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["event_id"]),
            models.Index(fields=["provider", "event_type"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.provider}: {self.event_type} ({self.event_id})"
