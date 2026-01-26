"""
Engagement Models

Newsletter subscriptions and price alerts:
- NewsletterSubscription: Email newsletter subscriptions
- PriceAlert: User-defined price alerts
- Notification: In-app notifications
"""
from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel, TimeStampedModel


class NewsletterSubscription(BaseModel):
    """
    Newsletter subscription model.

    Types:
    - morning_brief: Daily morning market overview
    - evening_wrap: End of day market summary
    - weekly_digest: Weekly analysis and picks
    - breaking_news: Breaking news alerts
    """

    class NewsletterType(models.TextChoices):
        MORNING_BRIEF = "morning_brief", "Morning Brief"
        EVENING_WRAP = "evening_wrap", "Evening Wrap"
        WEEKLY_DIGEST = "weekly_digest", "Weekly Digest"
        BREAKING_NEWS = "breaking_news", "Breaking News"
        EARNINGS_ALERTS = "earnings", "Earnings Alerts"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="newsletter_subscriptions",
        null=True,
        blank=True,
        help_text="Authenticated user (if logged in)",
    )
    email = models.EmailField(
        "Email",
        db_index=True,
        help_text="Email for non-authenticated subscribers",
    )
    newsletter_type = models.CharField(
        "Newsletter Type",
        max_length=20,
        choices=NewsletterType.choices,
        default=NewsletterType.MORNING_BRIEF,
    )
    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    is_verified = models.BooleanField(
        "Email Verified",
        default=False,
    )
    verification_token = models.CharField(
        "Verification Token",
        max_length=64,
        blank=True,
    )
    unsubscribe_token = models.CharField(
        "Unsubscribe Token",
        max_length=64,
        blank=True,
    )

    # Preferences
    preferred_exchanges = models.JSONField(
        "Preferred Exchanges",
        default=list,
        blank=True,
        help_text="List of exchange codes to include",
    )

    class Meta:
        verbose_name = "Newsletter Subscription"
        verbose_name_plural = "Newsletter Subscriptions"
        unique_together = [["email", "newsletter_type"]]
        indexes = [
            models.Index(fields=["email", "is_active"]),
            models.Index(fields=["newsletter_type", "is_active"]),
        ]

    def __str__(self):
        return f"{self.email} - {self.get_newsletter_type_display()}"


class PriceAlert(BaseModel):
    """
    User-defined price alerts.

    Triggers notification when a stock hits target price.
    """

    class AlertType(models.TextChoices):
        ABOVE = "above", "Price Above"
        BELOW = "below", "Price Below"
        PERCENT_CHANGE = "percent_change", "Percent Change"

    class AlertStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        TRIGGERED = "triggered", "Triggered"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="price_alerts",
    )
    company = models.ForeignKey(
        "markets.Company",
        on_delete=models.CASCADE,
        related_name="price_alerts",
    )
    alert_type = models.CharField(
        "Alert Type",
        max_length=20,
        choices=AlertType.choices,
        default=AlertType.ABOVE,
    )
    target_price = models.DecimalField(
        "Target Price",
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
    )
    target_percent = models.DecimalField(
        "Target Percent Change",
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="For percent_change alerts",
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=AlertStatus.choices,
        default=AlertStatus.ACTIVE,
        db_index=True,
    )
    triggered_at = models.DateTimeField(
        "Triggered At",
        null=True,
        blank=True,
    )
    triggered_price = models.DecimalField(
        "Triggered Price",
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
    )
    expires_at = models.DateTimeField(
        "Expires At",
        null=True,
        blank=True,
    )
    notification_sent = models.BooleanField(
        "Notification Sent",
        default=False,
    )

    class Meta:
        verbose_name = "Price Alert"
        verbose_name_plural = "Price Alerts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["company", "status"]),
            models.Index(fields=["status", "alert_type"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.company.symbol} {self.get_alert_type_display()} {self.target_price}"

    def check_trigger(self, current_price: Decimal) -> bool:
        """Check if the alert should be triggered."""
        if self.status != self.AlertStatus.ACTIVE:
            return False

        if self.alert_type == self.AlertType.ABOVE:
            return current_price >= self.target_price

        if self.alert_type == self.AlertType.BELOW:
            return current_price <= self.target_price

        return False


class Notification(TimeStampedModel):
    """
    In-app notification model.
    """

    class NotificationType(models.TextChoices):
        PRICE_ALERT = "price_alert", "Price Alert"
        BREAKING_NEWS = "breaking_news", "Breaking News"
        EARNINGS = "earnings", "Earnings Report"
        WATCHLIST = "watchlist", "Watchlist Update"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(
        "Type",
        max_length=20,
        choices=NotificationType.choices,
    )
    title = models.CharField(
        "Title",
        max_length=200,
    )
    message = models.TextField(
        "Message",
    )
    data = models.JSONField(
        "Data",
        default=dict,
        blank=True,
        help_text="Additional data (company_id, article_id, etc.)",
    )
    is_read = models.BooleanField(
        "Read",
        default=False,
        db_index=True,
    )
    read_at = models.DateTimeField(
        "Read At",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "notification_type"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone

        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=["is_read", "read_at"])
