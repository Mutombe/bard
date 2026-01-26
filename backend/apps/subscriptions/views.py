"""
Views for Subscription and Payment management.

Provides REST API endpoints for subscription management with
Stripe and Paystack payment processing.
"""
import logging
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.core.permissions import IsAdmin

from .models import (
    SubscriptionPlan,
    Subscription,
    Payment,
    Invoice,
    Coupon,
    PaymentMethod,
    WebhookEvent,
)
from .serializers import (
    SubscriptionPlanSerializer,
    SubscriptionPlanListSerializer,
    SubscriptionSerializer,
    SubscriptionCreateSerializer,
    SubscriptionCancelSerializer,
    PaymentSerializer,
    InvoiceSerializer,
    CouponSerializer,
    CouponValidateSerializer,
    PaymentMethodSerializer,
    PaymentMethodCreateSerializer,
    CheckoutSessionSerializer,
    BillingPortalSerializer,
    UsageStatsSerializer,
    SubscriptionSummarySerializer,
)
from .services import StripeService, PaystackService

logger = logging.getLogger(__name__)


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subscription plans.

    list: Get all active subscription plans
    retrieve: Get details of a specific plan
    compare: Compare multiple plans side by side
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "list":
            return SubscriptionPlanListSerializer
        return SubscriptionPlanSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["currency"] = self.request.query_params.get("currency", "usd")
        return context

    @action(detail=False, methods=["get"])
    def compare(self, request):
        """Compare all plans with their features."""
        plans = self.get_queryset().prefetch_related("plan_features")
        serializer = SubscriptionPlanSerializer(
            plans,
            many=True,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured plans for homepage display."""
        plans = self.get_queryset().filter(is_featured=True)
        serializer = SubscriptionPlanSerializer(
            plans,
            many=True,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user subscriptions.

    list: Get user's subscription history
    retrieve: Get current subscription details
    create: Create a new subscription
    cancel: Cancel current subscription
    resume: Resume a canceled subscription
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return SubscriptionCreateSerializer
        if self.action == "cancel":
            return SubscriptionCancelSerializer
        return SubscriptionSerializer

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get the user's current active subscription."""
        subscription = self.get_queryset().filter(
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING]
        ).first()

        if not subscription:
            return Response(
                {"detail": "No active subscription found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get subscription summary with available actions."""
        current_sub = self.get_queryset().filter(
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING]
        ).first()

        all_plans = SubscriptionPlan.objects.filter(is_active=True)
        current_plan = current_sub.plan if current_sub else None

        data = {
            "has_active_subscription": current_sub is not None,
            "current_plan": SubscriptionPlanSerializer(current_plan).data if current_plan else None,
            "subscription": SubscriptionSerializer(current_sub).data if current_sub else None,
            "can_upgrade": current_plan is not None and all_plans.filter(
                price_usd__gt=current_plan.price_usd
            ).exists(),
            "can_downgrade": current_plan is not None and all_plans.filter(
                price_usd__lt=current_plan.price_usd,
                price_usd__gt=0
            ).exists(),
            "available_plans": SubscriptionPlanListSerializer(all_plans, many=True).data,
        }

        return Response(data)

    @action(detail=False, methods=["get"])
    def usage(self, request):
        """Get current usage statistics."""
        subscription = self.get_queryset().filter(
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING]
        ).first()

        if not subscription:
            return Response(
                {"detail": "No active subscription."},
                status=status.HTTP_404_NOT_FOUND
            )

        plan = subscription.plan
        articles_limit = plan.article_limit or 0
        api_limit = plan.api_calls_limit or 0

        data = {
            "articles_read": subscription.articles_read_this_period,
            "articles_limit": articles_limit,
            "articles_percentage": (
                (subscription.articles_read_this_period / articles_limit * 100)
                if articles_limit > 0 else 0
            ),
            "api_calls": subscription.api_calls_this_period,
            "api_calls_limit": api_limit,
            "api_calls_percentage": (
                (subscription.api_calls_this_period / api_limit * 100)
                if api_limit > 0 else 0
            ),
            "period_start": subscription.current_period_start,
            "period_end": subscription.current_period_end,
            "days_remaining": subscription.days_remaining,
        }

        serializer = UsageStatsSerializer(data)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel a subscription."""
        subscription = self.get_object()

        if subscription.status == Subscription.Status.CANCELED:
            return Response(
                {"detail": "Subscription is already canceled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SubscriptionCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cancel_immediately = serializer.validated_data.get("cancel_immediately", False)
        reason = serializer.validated_data.get("reason", "")
        feedback = serializer.validated_data.get("feedback", "")

        # Cancel with payment provider
        if subscription.stripe_subscription_id:
            stripe_service = StripeService()
            stripe_service.cancel_subscription(
                subscription.stripe_subscription_id,
                cancel_immediately=cancel_immediately
            )
        elif subscription.paystack_subscription_code:
            paystack_service = PaystackService()
            paystack_service.cancel_subscription(subscription.paystack_subscription_code)

        # Update subscription
        subscription.canceled_at = timezone.now()
        subscription.cancel_reason = f"{feedback}: {reason}" if feedback else reason

        if cancel_immediately:
            subscription.status = Subscription.Status.CANCELED
            subscription.end_date = timezone.now()
        else:
            # Will be canceled at period end
            subscription.auto_renew = False

        subscription.save()

        return Response(SubscriptionSerializer(subscription).data)

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        """Resume a canceled subscription (if not yet expired)."""
        subscription = self.get_object()

        if subscription.status != Subscription.Status.CANCELED:
            return Response(
                {"detail": "Only canceled subscriptions can be resumed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if subscription.current_period_end and subscription.current_period_end < timezone.now():
            return Response(
                {"detail": "Subscription period has ended. Please create a new subscription."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Resume with payment provider
        if subscription.stripe_subscription_id:
            stripe_service = StripeService()
            stripe_service.resume_subscription(subscription.stripe_subscription_id)

        subscription.status = Subscription.Status.ACTIVE
        subscription.canceled_at = None
        subscription.cancel_reason = ""
        subscription.auto_renew = True
        subscription.save()

        return Response(SubscriptionSerializer(subscription).data)

    @action(detail=True, methods=["post"])
    def change_plan(self, request, pk=None):
        """Change subscription to a different plan (upgrade/downgrade)."""
        subscription = self.get_object()

        plan_id = request.data.get("plan_id")
        if not plan_id:
            return Response(
                {"detail": "plan_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"detail": "Invalid plan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_plan == subscription.plan:
            return Response(
                {"detail": "Already subscribed to this plan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update with payment provider
        if subscription.stripe_subscription_id:
            stripe_service = StripeService()
            stripe_service.change_plan(
                subscription.stripe_subscription_id,
                new_plan.stripe_price_id
            )

        subscription.plan = new_plan
        subscription.save()

        return Response(SubscriptionSerializer(subscription).data)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for payment history.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def refund(self, request, pk=None):
        """Request a refund for a payment (admin approval required)."""
        payment = self.get_object()

        if not payment.can_refund:
            return Response(
                {"detail": "This payment cannot be refunded."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get("reason", "")

        # Log refund request
        payment.metadata["refund_requested"] = True
        payment.metadata["refund_request_reason"] = reason
        payment.metadata["refund_requested_at"] = timezone.now().isoformat()
        payment.save()

        return Response({"detail": "Refund request submitted for review."})


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for invoices.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Get download URL for invoice PDF."""
        invoice = self.get_object()

        if not invoice.pdf_url:
            return Response(
                {"detail": "PDF not available for this invoice."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({"pdf_url": invoice.pdf_url})


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment methods.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentMethodSerializer

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        if self.action == "create":
            return PaymentMethodCreateSerializer
        return PaymentMethodSerializer

    def create(self, request, *args, **kwargs):
        """Add a new payment method."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider = serializer.validated_data["provider"]
        token = serializer.validated_data["token"]
        set_as_default = serializer.validated_data.get("set_as_default", False)

        if provider == "stripe":
            stripe_service = StripeService()
            payment_method = stripe_service.create_payment_method(
                user=request.user,
                token=token,
                set_as_default=set_as_default
            )
        else:
            paystack_service = PaystackService()
            payment_method = paystack_service.create_payment_method(
                user=request.user,
                authorization_code=serializer.validated_data.get("authorization_code"),
                email=serializer.validated_data.get("email"),
                set_as_default=set_as_default
            )

        return Response(
            PaymentMethodSerializer(payment_method).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        """Set a payment method as default."""
        payment_method = self.get_object()
        payment_method.is_default = True
        payment_method.save()

        return Response(PaymentMethodSerializer(payment_method).data)

    def destroy(self, request, *args, **kwargs):
        """Remove a payment method."""
        payment_method = self.get_object()

        if payment_method.is_default:
            # Find another method to set as default
            other_method = self.get_queryset().exclude(pk=payment_method.pk).first()
            if other_method:
                other_method.is_default = True
                other_method.save()

        # Detach from provider
        if payment_method.stripe_payment_method_id:
            stripe_service = StripeService()
            stripe_service.detach_payment_method(payment_method.stripe_payment_method_id)

        payment_method.is_active = False
        payment_method.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class CouponValidateView(views.APIView):
    """
    Validate a coupon code.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        coupon = serializer.validated_data["coupon"]
        plan_id = serializer.validated_data.get("plan_id")

        # Calculate discount preview
        discount_preview = None
        if plan_id:
            try:
                plan = SubscriptionPlan.objects.get(id=plan_id)
                discount_preview = {
                    "original_price": plan.price_usd,
                    "discount_amount": coupon.calculate_discount(plan.price_usd),
                    "final_price": plan.price_usd - coupon.calculate_discount(plan.price_usd),
                }
            except SubscriptionPlan.DoesNotExist:
                pass

        return Response({
            "valid": True,
            "coupon": CouponSerializer(coupon).data,
            "discount_preview": discount_preview,
        })


class CheckoutView(views.APIView):
    """
    Create checkout sessions for subscription payments.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = SubscriptionPlan.objects.get(id=serializer.validated_data["plan_id"])
        currency = serializer.validated_data["currency"]
        success_url = serializer.validated_data["success_url"]
        cancel_url = serializer.validated_data["cancel_url"]
        coupon_code = serializer.validated_data.get("coupon_code")

        # Determine provider based on currency
        if currency in ["ZAR", "NGN"]:
            # Use Paystack for African currencies
            paystack_service = PaystackService()
            checkout_data = paystack_service.create_checkout_session(
                user=request.user,
                plan=plan,
                currency=currency,
                success_url=success_url,
                cancel_url=cancel_url,
                coupon_code=coupon_code,
            )
        else:
            # Use Stripe for international
            stripe_service = StripeService()
            checkout_data = stripe_service.create_checkout_session(
                user=request.user,
                plan=plan,
                success_url=success_url,
                cancel_url=cancel_url,
                coupon_code=coupon_code,
            )

        return Response(checkout_data)


class BillingPortalView(views.APIView):
    """
    Create a billing portal session for managing subscriptions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BillingPortalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return_url = serializer.validated_data["return_url"]

        # Check for Stripe customer
        subscription = Subscription.objects.filter(
            user=request.user,
            stripe_customer_id__isnull=False
        ).first()

        if not subscription or not subscription.stripe_customer_id:
            return Response(
                {"detail": "No billing account found."},
                status=status.HTTP_404_NOT_FOUND
            )

        stripe_service = StripeService()
        portal_url = stripe_service.create_billing_portal_session(
            customer_id=subscription.stripe_customer_id,
            return_url=return_url
        )

        return Response({"url": portal_url})


class StripeWebhookView(views.APIView):
    """
    Handle Stripe webhook events.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        stripe_service = StripeService()

        try:
            event = stripe_service.construct_webhook_event(payload, sig_header)
        except ValueError:
            logger.error("Invalid Stripe webhook payload")
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Stripe webhook error: {e}")
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Log the event
        webhook_event, created = WebhookEvent.objects.get_or_create(
            event_id=event["id"],
            defaults={
                "provider": WebhookEvent.Provider.STRIPE,
                "event_type": event["type"],
                "payload": event,
            }
        )

        if not created:
            # Already processed
            return Response({"status": "already_processed"})

        try:
            stripe_service.handle_webhook_event(event)
            webhook_event.status = WebhookEvent.Status.PROCESSED
            webhook_event.processed_at = timezone.now()
        except Exception as e:
            logger.error(f"Failed to process Stripe webhook: {e}")
            webhook_event.status = WebhookEvent.Status.FAILED
            webhook_event.error_message = str(e)
            webhook_event.attempts += 1

        webhook_event.save()

        return Response({"status": "success"})


class PaystackWebhookView(views.APIView):
    """
    Handle Paystack webhook events.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data
        signature = request.META.get("HTTP_X_PAYSTACK_SIGNATURE")

        paystack_service = PaystackService()

        if not paystack_service.verify_webhook_signature(request.body, signature):
            logger.error("Invalid Paystack webhook signature")
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_type = payload.get("event")
        event_data = payload.get("data", {})

        # Generate unique event ID
        event_id = f"paystack_{event_data.get('reference', timezone.now().timestamp())}"

        # Log the event
        webhook_event, created = WebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={
                "provider": WebhookEvent.Provider.PAYSTACK,
                "event_type": event_type,
                "payload": payload,
            }
        )

        if not created:
            return Response({"status": "already_processed"})

        try:
            paystack_service.handle_webhook_event(event_type, event_data)
            webhook_event.status = WebhookEvent.Status.PROCESSED
            webhook_event.processed_at = timezone.now()
        except Exception as e:
            logger.error(f"Failed to process Paystack webhook: {e}")
            webhook_event.status = WebhookEvent.Status.FAILED
            webhook_event.error_message = str(e)
            webhook_event.attempts += 1

        webhook_event.save()

        return Response({"status": "success"})


class AdminSubscriptionViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all subscriptions.
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get subscription statistics."""
        total = Subscription.objects.count()
        active = Subscription.objects.filter(
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING]
        ).count()
        canceled = Subscription.objects.filter(status=Subscription.Status.CANCELED).count()

        # Revenue metrics
        total_revenue = Payment.objects.filter(
            status=Payment.Status.COMPLETED
        ).aggregate(total=models.Sum("amount"))["total"] or 0

        # MRR calculation
        active_subs = Subscription.objects.filter(
            status=Subscription.Status.ACTIVE
        ).select_related("plan")

        mrr = sum(
            sub.plan.price_usd / (12 if sub.plan.billing_cycle == "annual" else
                                   3 if sub.plan.billing_cycle == "quarterly" else 1)
            for sub in active_subs
        )

        # Plan distribution
        plan_distribution = {}
        for sub in active_subs:
            plan_name = sub.plan.name
            plan_distribution[plan_name] = plan_distribution.get(plan_name, 0) + 1

        return Response({
            "total_subscriptions": total,
            "active_subscriptions": active,
            "canceled_subscriptions": canceled,
            "total_revenue": total_revenue,
            "mrr": int(mrr),
            "plan_distribution": plan_distribution,
        })

    @action(detail=True, methods=["post"])
    def extend(self, request, pk=None):
        """Extend a subscription period (admin only)."""
        subscription = self.get_object()
        days = request.data.get("days", 30)

        if subscription.current_period_end:
            subscription.current_period_end += timezone.timedelta(days=days)
        else:
            subscription.current_period_end = timezone.now() + timezone.timedelta(days=days)

        subscription.metadata["extended_by_admin"] = True
        subscription.metadata["extension_days"] = days
        subscription.metadata["extended_at"] = timezone.now().isoformat()
        subscription.save()

        return Response(SubscriptionSerializer(subscription).data)
