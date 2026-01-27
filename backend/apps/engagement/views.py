"""
Engagement Views
"""
from django.db.models import Count, Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
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
    Admins can view all subscriptions.
    """

    serializer_class = NewsletterSubscriptionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["email"]

    def get_permissions(self):
        if self.action in ["create"]:
            return [AllowAny()]
        if self.action in ["list", "stats", "retrieve", "destroy"]:
            # Admins can list all, regular users see their own
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return NewsletterSubscription.objects.none()

        # Admins and editors can see all subscriptions
        if user.is_staff or (hasattr(user, 'role') and user.role in ['super_admin', 'editor']):
            queryset = NewsletterSubscription.objects.all()
        else:
            queryset = NewsletterSubscription.objects.filter(
                Q(user=user) | Q(email=user.email)
            )

        # Filter by newsletter_type
        newsletter_type = self.request.query_params.get("newsletter_type")
        if newsletter_type:
            queryset = queryset.filter(newsletter_type=newsletter_type)

        # Filter by is_active
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.order_by("-created_at")

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

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Get newsletter subscription statistics (admin only)."""
        user = request.user
        if not (user.is_staff or (hasattr(user, 'role') and user.role in ['super_admin', 'editor'])):
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        total = NewsletterSubscription.objects.count()
        active = NewsletterSubscription.objects.filter(is_active=True).count()

        # Get counts by type
        by_type = NewsletterSubscription.objects.values("newsletter_type").annotate(
            count=Count("id")
        )

        return Response({
            "total_subscribers": total,
            "active_subscribers": active,
            "open_rate": 0,  # Placeholder - would need email tracking
            "click_rate": 0,  # Placeholder - would need email tracking
            "by_type": {item["newsletter_type"]: item["count"] for item in by_type},
        })

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
