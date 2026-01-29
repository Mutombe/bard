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
    SendNewsletterSerializer,
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

        from .tasks import send_verification_email

        kwargs = {
            "verification_token": secrets.token_urlsafe(32),
            "unsubscribe_token": secrets.token_urlsafe(32),
        }

        if self.request.user.is_authenticated:
            kwargs["user"] = self.request.user
            kwargs["email"] = self.request.user.email

        subscription = serializer.save(**kwargs)

        # Send verification email asynchronously
        send_verification_email.delay(str(subscription.id))

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

    @action(detail=False, methods=["post"], url_path="verify", permission_classes=[AllowAny])
    def verify(self, request):
        """Verify email subscription using token."""
        token = request.data.get("token")
        if not token:
            return Response(
                {"error": "Verification token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subscription = NewsletterSubscription.objects.get(verification_token=token)
            if subscription.is_verified:
                return Response({"message": "Email already verified"})

            subscription.is_verified = True
            subscription.save(update_fields=["is_verified"])
            return Response({
                "message": "Email verified successfully",
                "newsletter_type": subscription.newsletter_type,
            })
        except NewsletterSubscription.DoesNotExist:
            return Response(
                {"error": "Invalid verification token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

    @action(detail=False, methods=["post"], url_path="send", permission_classes=[IsAdminUser])
    def send(self, request):
        """Send newsletter to subscribers (admin only)."""
        from django.core.mail import send_mass_mail
        from django.template.loader import render_to_string
        from django.conf import settings

        serializer = SendNewsletterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subject = serializer.validated_data["subject"]
        content = serializer.validated_data["content"]
        subscription_types = serializer.validated_data["subscription_types"]
        scheduled_for = serializer.validated_data.get("scheduled_for")

        # Get active subscribers for the selected newsletter types
        subscribers = NewsletterSubscription.objects.filter(
            newsletter_type__in=subscription_types,
            is_active=True,
        ).values_list("email", "unsubscribe_token")

        if not subscribers:
            return Response(
                {"error": "No active subscribers found for selected newsletter types"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If scheduled for future, we'd queue the task (for now just send immediately)
        if scheduled_for:
            # TODO: Implement Celery task for scheduled sending
            pass

        # Prepare emails
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bardiqjournal.com")
        emails_sent = 0
        errors = []

        for email, unsubscribe_token in subscribers:
            try:
                # Build unsubscribe URL
                unsubscribe_url = f"{getattr(settings, 'FRONTEND_URL', 'https://bardiqjournal.com')}/unsubscribe?token={unsubscribe_token}"

                # Create email content with unsubscribe link
                html_content = f"""
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="padding: 20px;">
                        {content}
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <div style="text-align: center; color: #666; font-size: 12px;">
                        <p>You received this email because you subscribed to Bardiq Journal newsletters.</p>
                        <p><a href="{unsubscribe_url}" style="color: #666;">Unsubscribe</a></p>
                    </div>
                </body>
                </html>
                """

                text_content = f"{content}\n\n---\nUnsubscribe: {unsubscribe_url}"

                from django.core.mail import EmailMultiAlternatives
                msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
                msg.attach_alternative(html_content, "text/html")
                msg.send()
                emails_sent += 1
            except Exception as e:
                errors.append({"email": email, "error": str(e)})

        return Response({
            "status": "sent",
            "emails_sent": emails_sent,
            "total_subscribers": len(subscribers),
            "errors": errors[:10] if errors else [],  # Return first 10 errors only
        })


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
