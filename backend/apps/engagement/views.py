"""
Engagement Views
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import NewsletterSubscription, Notification, PriceAlert
from .serializers import (
    NewsletterSubscriptionSerializer,
    NotificationSerializer,
    PriceAlertCreateSerializer,
    PriceAlertSerializer,
)


class NewsletterSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for NewsletterSubscription.

    Allows public subscription without authentication.
    """

    serializer_class = NewsletterSubscriptionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return NewsletterSubscription.objects.filter(user=self.request.user)
        return NewsletterSubscription.objects.none()

    def perform_create(self, serializer):
        import secrets

        kwargs = {
            "verification_token": secrets.token_urlsafe(32),
            "unsubscribe_token": secrets.token_urlsafe(32),
        }

        if self.request.user.is_authenticated:
            kwargs["user"] = self.request.user
            kwargs["email"] = self.request.user.email

        serializer.save(**kwargs)

        # TODO: Send verification email
        # send_verification_email.delay(subscription.id)

    @action(detail=False, methods=["post"], url_path="unsubscribe")
    def unsubscribe(self, request):
        """Unsubscribe using token."""
        token = request.data.get("token")
        if not token:
            return Response(
                {"error": "Unsubscribe token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subscription = NewsletterSubscription.objects.get(unsubscribe_token=token)
            subscription.is_active = False
            subscription.save(update_fields=["is_active"])
            return Response({"message": "Successfully unsubscribed"})
        except NewsletterSubscription.DoesNotExist:
            return Response(
                {"error": "Invalid unsubscribe token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PriceAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PriceAlert.

    Authenticated users only.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PriceAlert.objects.filter(user=self.request.user).select_related(
            "company", "company__exchange"
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PriceAlertCreateSerializer
        return PriceAlertSerializer

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel an active alert."""
        alert = self.get_object()

        if alert.status != PriceAlert.AlertStatus.ACTIVE:
            return Response(
                {"error": "Only active alerts can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        alert.status = PriceAlert.AlertStatus.CANCELLED
        alert.save(update_fields=["status"])

        return Response({"message": "Alert cancelled"})


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification.

    Authenticated users only.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def unread(self, request):
        """Get unread notifications."""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({"message": "Marked as read"})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        from django.utils import timezone

        self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"message": "All notifications marked as read"})
