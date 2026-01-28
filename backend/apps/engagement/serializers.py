"""
Engagement Serializers
"""
from rest_framework import serializers

from apps.markets.serializers import CompanyMinimalSerializer

from .models import NewsletterSubscription, Notification, PriceAlert


class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for NewsletterSubscription."""

    class Meta:
        model = NewsletterSubscription
        fields = [
            "id",
            "email",
            "newsletter_type",
            "is_active",
            "is_verified",
            "preferred_exchanges",
            "created_at",
        ]
        read_only_fields = ["id", "is_verified", "created_at"]


class PriceAlertSerializer(serializers.ModelSerializer):
    """Serializer for PriceAlert."""

    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = PriceAlert
        fields = [
            "id",
            "company",
            "company_id",
            "alert_type",
            "target_price",
            "target_percent",
            "status",
            "triggered_at",
            "triggered_price",
            "expires_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "triggered_at",
            "triggered_price",
            "created_at",
        ]


class PriceAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PriceAlert."""

    class Meta:
        model = PriceAlert
        fields = [
            "company",
            "alert_type",
            "target_price",
            "target_percent",
            "expires_at",
        ]

    def validate(self, attrs):
        alert_type = attrs.get("alert_type")

        if alert_type in [PriceAlert.AlertType.ABOVE, PriceAlert.AlertType.BELOW]:
            if not attrs.get("target_price"):
                raise serializers.ValidationError(
                    {"target_price": "Target price is required for this alert type"}
                )

        if alert_type == PriceAlert.AlertType.PERCENT_CHANGE:
            if not attrs.get("target_percent"):
                raise serializers.ValidationError(
                    {"target_percent": "Target percent is required for this alert type"}
                )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification."""

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "data",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = ["id", "notification_type", "title", "message", "data", "created_at"]


class SendNewsletterSerializer(serializers.Serializer):
    """Serializer for sending newsletters to subscribers."""

    subject = serializers.CharField(max_length=255)
    content = serializers.CharField()
    subscription_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ("morning_brief", "Morning Brief"),
            ("evening_wrap", "Evening Wrap"),
            ("weekly_digest", "Weekly Digest"),
            ("breaking_news", "Breaking News"),
            ("earnings", "Earnings Alerts"),
        ]),
        min_length=1
    )
    scheduled_for = serializers.DateTimeField(required=False, allow_null=True)
