"""
Payment service integrations for Stripe and Paystack.

Handles all payment provider interactions for subscriptions,
payments, and billing management.
"""
import hashlib
import hmac
import logging
from decimal import Decimal
from typing import Optional, Dict, Any
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.db import transaction

logger = logging.getLogger(__name__)


class StripeService:
    """
    Stripe payment service integration.

    Handles subscription management, payment processing,
    and webhook handling for Stripe.
    """

    def __init__(self):
        try:
            import stripe
            self.stripe = stripe
            self.stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")
            self.webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")
        except ImportError:
            logger.warning("Stripe library not installed")
            self.stripe = None

    def _ensure_stripe(self):
        if not self.stripe:
            raise ImportError("Stripe library is not installed")

    def get_or_create_customer(self, user) -> str:
        """Get or create a Stripe customer for the user."""
        self._ensure_stripe()

        from .models import Subscription

        # Check for existing customer
        subscription = Subscription.objects.filter(
            user=user,
            stripe_customer_id__isnull=False
        ).first()

        if subscription and subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        # Create new customer
        customer = self.stripe.Customer.create(
            email=user.email,
            name=user.get_full_name() or user.email,
            metadata={
                "user_id": str(user.id),
            }
        )

        return customer.id

    def create_checkout_session(
        self,
        user,
        plan,
        success_url: str,
        cancel_url: str,
        coupon_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a Stripe Checkout session."""
        self._ensure_stripe()

        customer_id = self.get_or_create_customer(user)

        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [{
                "price": plan.stripe_price_id,
                "quantity": 1,
            }],
            "mode": "subscription",
            "success_url": success_url + "?session_id={CHECKOUT_SESSION_ID}",
            "cancel_url": cancel_url,
            "metadata": {
                "user_id": str(user.id),
                "plan_id": str(plan.id),
            },
            "subscription_data": {
                "metadata": {
                    "user_id": str(user.id),
                    "plan_id": str(plan.id),
                }
            },
        }

        # Add trial if plan has trial days
        if plan.trial_days > 0:
            session_params["subscription_data"]["trial_period_days"] = plan.trial_days

        # Add coupon if provided
        if coupon_code:
            from .models import Coupon
            try:
                coupon = Coupon.objects.get(code=coupon_code.upper())
                if coupon.stripe_coupon_id:
                    session_params["discounts"] = [{"coupon": coupon.stripe_coupon_id}]
            except Coupon.DoesNotExist:
                pass

        session = self.stripe.checkout.Session.create(**session_params)

        return {
            "session_id": session.id,
            "url": session.url,
            "provider": "stripe",
        }

    def create_billing_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> str:
        """Create a Stripe Billing Portal session."""
        self._ensure_stripe()

        session = self.stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )

        return session.url

    def create_payment_method(
        self,
        user,
        token: str,
        set_as_default: bool = False
    ):
        """Create a payment method from a token."""
        self._ensure_stripe()
        from .models import PaymentMethod

        customer_id = self.get_or_create_customer(user)

        # Attach payment method to customer
        payment_method = self.stripe.PaymentMethod.attach(
            token,
            customer=customer_id,
        )

        if set_as_default:
            self.stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method.id}
            )

        # Save to database
        pm = PaymentMethod.objects.create(
            user=user,
            method_type=PaymentMethod.MethodType.CARD,
            card_brand=payment_method.card.brand,
            card_last_four=payment_method.card.last4,
            card_exp_month=payment_method.card.exp_month,
            card_exp_year=payment_method.card.exp_year,
            stripe_payment_method_id=payment_method.id,
            is_default=set_as_default,
        )

        return pm

    def detach_payment_method(self, payment_method_id: str):
        """Detach a payment method from customer."""
        self._ensure_stripe()
        self.stripe.PaymentMethod.detach(payment_method_id)

    def cancel_subscription(
        self,
        subscription_id: str,
        cancel_immediately: bool = False
    ):
        """Cancel a Stripe subscription."""
        self._ensure_stripe()

        if cancel_immediately:
            self.stripe.Subscription.delete(subscription_id)
        else:
            self.stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )

    def resume_subscription(self, subscription_id: str):
        """Resume a canceled subscription."""
        self._ensure_stripe()

        self.stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )

    def change_plan(self, subscription_id: str, new_price_id: str):
        """Change subscription to a different plan."""
        self._ensure_stripe()

        subscription = self.stripe.Subscription.retrieve(subscription_id)

        self.stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0].id,
                "price": new_price_id,
            }],
            proration_behavior="create_prorations",
        )

    def construct_webhook_event(self, payload: bytes, sig_header: str):
        """Construct and verify a webhook event."""
        self._ensure_stripe()

        return self.stripe.Webhook.construct_event(
            payload, sig_header, self.webhook_secret
        )

    def handle_webhook_event(self, event: Dict[str, Any]):
        """Handle Stripe webhook events."""
        from .models import Subscription, Payment, Invoice
        from apps.users.models import User

        event_type = event["type"]
        data = event["data"]["object"]

        logger.info(f"Processing Stripe webhook: {event_type}")

        if event_type == "checkout.session.completed":
            self._handle_checkout_completed(data)

        elif event_type == "invoice.paid":
            self._handle_invoice_paid(data)

        elif event_type == "invoice.payment_failed":
            self._handle_invoice_payment_failed(data)

        elif event_type == "customer.subscription.updated":
            self._handle_subscription_updated(data)

        elif event_type == "customer.subscription.deleted":
            self._handle_subscription_deleted(data)

    def _handle_checkout_completed(self, session: Dict[str, Any]):
        """Handle successful checkout."""
        from .models import Subscription, SubscriptionPlan
        from apps.users.models import User

        user_id = session["metadata"].get("user_id")
        plan_id = session["metadata"].get("plan_id")

        if not user_id or not plan_id:
            logger.error("Missing metadata in checkout session")
            return

        try:
            user = User.objects.get(id=user_id)
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except (User.DoesNotExist, SubscriptionPlan.DoesNotExist):
            logger.error(f"User or Plan not found: {user_id}, {plan_id}")
            return

        # Create subscription
        subscription = Subscription.objects.create(
            user=user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            stripe_subscription_id=session.get("subscription"),
            stripe_customer_id=session["customer"],
            currency="USD",
        )

        logger.info(f"Created subscription for user {user.email}")

    def _handle_invoice_paid(self, invoice: Dict[str, Any]):
        """Handle paid invoice."""
        from .models import Subscription, Payment, Invoice as InvoiceModel

        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return

        try:
            subscription = Subscription.objects.get(
                stripe_subscription_id=subscription_id
            )
        except Subscription.DoesNotExist:
            logger.warning(f"Subscription not found: {subscription_id}")
            return

        # Update subscription period
        subscription.current_period_start = timezone.datetime.fromtimestamp(
            invoice["period_start"], tz=timezone.utc
        )
        subscription.current_period_end = timezone.datetime.fromtimestamp(
            invoice["period_end"], tz=timezone.utc
        )
        subscription.status = Subscription.Status.ACTIVE
        subscription.reset_usage_counters()
        subscription.save()

        # Create payment record
        Payment.objects.create(
            user=subscription.user,
            subscription=subscription,
            amount=invoice["amount_paid"],
            currency=invoice["currency"].upper(),
            status=Payment.Status.COMPLETED,
            provider=Payment.Provider.STRIPE,
            provider_payment_id=invoice["payment_intent"],
            paid_at=timezone.now(),
            receipt_url=invoice.get("hosted_invoice_url"),
        )

    def _handle_invoice_payment_failed(self, invoice: Dict[str, Any]):
        """Handle failed payment."""
        from .models import Subscription

        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return

        try:
            subscription = Subscription.objects.get(
                stripe_subscription_id=subscription_id
            )
            subscription.status = Subscription.Status.PAST_DUE
            subscription.save()
        except Subscription.DoesNotExist:
            pass

    def _handle_subscription_updated(self, sub: Dict[str, Any]):
        """Handle subscription updates."""
        from .models import Subscription

        try:
            subscription = Subscription.objects.get(
                stripe_subscription_id=sub["id"]
            )

            # Update status
            status_map = {
                "active": Subscription.Status.ACTIVE,
                "trialing": Subscription.Status.TRIALING,
                "past_due": Subscription.Status.PAST_DUE,
                "canceled": Subscription.Status.CANCELED,
                "unpaid": Subscription.Status.PAST_DUE,
            }
            subscription.status = status_map.get(
                sub["status"],
                Subscription.Status.ACTIVE
            )

            # Update period
            subscription.current_period_start = timezone.datetime.fromtimestamp(
                sub["current_period_start"], tz=timezone.utc
            )
            subscription.current_period_end = timezone.datetime.fromtimestamp(
                sub["current_period_end"], tz=timezone.utc
            )

            subscription.save()

        except Subscription.DoesNotExist:
            pass

    def _handle_subscription_deleted(self, sub: Dict[str, Any]):
        """Handle subscription cancellation."""
        from .models import Subscription

        try:
            subscription = Subscription.objects.get(
                stripe_subscription_id=sub["id"]
            )
            subscription.status = Subscription.Status.CANCELED
            subscription.canceled_at = timezone.now()
            subscription.save()
        except Subscription.DoesNotExist:
            pass


class PaystackService:
    """
    Paystack payment service integration.

    Handles subscription management and payment processing
    for African markets (Nigeria, South Africa, etc.).
    """

    def __init__(self):
        import requests
        self.requests = requests
        self.secret_key = getattr(settings, "PAYSTACK_SECRET_KEY", "")
        self.public_key = getattr(settings, "PAYSTACK_PUBLIC_KEY", "")
        self.base_url = "https://api.paystack.co"

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make a request to Paystack API."""
        url = f"{self.base_url}/{endpoint}"

        response = self.requests.request(
            method=method,
            url=url,
            headers=self._headers(),
            json=data,
        )

        response.raise_for_status()
        return response.json()

    def create_checkout_session(
        self,
        user,
        plan,
        currency: str,
        success_url: str,
        cancel_url: str,
        coupon_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Initialize a Paystack transaction."""

        # Get price based on currency
        if currency == "ZAR":
            amount = plan.price_zar
        elif currency == "NGN":
            amount = plan.price_ngn
        else:
            amount = plan.price_usd

        # Apply coupon if provided
        if coupon_code:
            from .models import Coupon
            try:
                coupon = Coupon.objects.get(code=coupon_code.upper())
                if coupon.is_valid:
                    discount = coupon.calculate_discount(amount)
                    amount = amount - discount
            except Coupon.DoesNotExist:
                pass

        data = {
            "email": user.email,
            "amount": amount,  # Paystack expects amount in kobo/cents
            "currency": currency,
            "callback_url": success_url,
            "metadata": {
                "user_id": str(user.id),
                "plan_id": str(plan.id),
                "cancel_url": cancel_url,
            },
        }

        # If plan has Paystack plan code, use subscription
        if plan.paystack_plan_code:
            data["plan"] = plan.paystack_plan_code

        response = self._request("POST", "transaction/initialize", data)

        return {
            "authorization_url": response["data"]["authorization_url"],
            "access_code": response["data"]["access_code"],
            "reference": response["data"]["reference"],
            "provider": "paystack",
        }

    def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """Verify a Paystack transaction."""
        response = self._request("GET", f"transaction/verify/{reference}")
        return response["data"]

    def create_subscription(
        self,
        user,
        plan,
        authorization_code: str,
    ):
        """Create a Paystack subscription."""
        data = {
            "customer": user.email,
            "plan": plan.paystack_plan_code,
            "authorization": authorization_code,
        }

        response = self._request("POST", "subscription", data)
        return response["data"]

    def cancel_subscription(self, subscription_code: str):
        """Cancel a Paystack subscription."""
        # Paystack requires the email token, so we disable the subscription
        response = self._request(
            "POST",
            "subscription/disable",
            {"code": subscription_code, "token": "user_email_token"}
        )
        return response

    def create_payment_method(
        self,
        user,
        authorization_code: str,
        email: str,
        set_as_default: bool = False,
    ):
        """Save a Paystack authorization as payment method."""
        from .models import PaymentMethod

        # Get authorization details
        response = self._request("GET", f"customer/{email}")
        customer = response["data"]

        # Find the authorization
        auth = None
        for a in customer.get("authorizations", []):
            if a["authorization_code"] == authorization_code:
                auth = a
                break

        if not auth:
            raise ValueError("Authorization not found")

        pm = PaymentMethod.objects.create(
            user=user,
            method_type=PaymentMethod.MethodType.CARD,
            card_brand=auth.get("card_type", "").title(),
            card_last_four=auth.get("last4", ""),
            card_exp_month=int(auth.get("exp_month", 0)),
            card_exp_year=int(auth.get("exp_year", 0)),
            paystack_authorization_code=authorization_code,
            is_default=set_as_default,
        )

        return pm

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """Verify Paystack webhook signature."""
        if not signature:
            return False

        computed = hmac.new(
            self.secret_key.encode(),
            payload,
            hashlib.sha512
        ).hexdigest()

        return hmac.compare_digest(computed, signature)

    def handle_webhook_event(self, event_type: str, data: Dict[str, Any]):
        """Handle Paystack webhook events."""
        logger.info(f"Processing Paystack webhook: {event_type}")

        if event_type == "charge.success":
            self._handle_charge_success(data)

        elif event_type == "subscription.create":
            self._handle_subscription_created(data)

        elif event_type == "subscription.disable":
            self._handle_subscription_disabled(data)

        elif event_type == "invoice.create":
            self._handle_invoice_created(data)

        elif event_type == "invoice.payment_failed":
            self._handle_invoice_failed(data)

    def _handle_charge_success(self, data: Dict[str, Any]):
        """Handle successful charge."""
        from .models import Subscription, Payment, SubscriptionPlan
        from apps.users.models import User

        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan_id = metadata.get("plan_id")

        if not user_id:
            return

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return

        # Create payment record
        Payment.objects.create(
            user=user,
            amount=data["amount"],
            currency=data["currency"].upper(),
            status=Payment.Status.COMPLETED,
            provider=Payment.Provider.PAYSTACK,
            provider_payment_id=data["reference"],
            provider_customer_id=data.get("customer", {}).get("customer_code"),
            card_last_four=data.get("authorization", {}).get("last4", ""),
            card_brand=data.get("authorization", {}).get("card_type", ""),
            paid_at=timezone.now(),
        )

        # Create/update subscription if plan_id present
        if plan_id:
            try:
                plan = SubscriptionPlan.objects.get(id=plan_id)
                authorization = data.get("authorization", {})

                Subscription.objects.update_or_create(
                    user=user,
                    status__in=[Subscription.Status.ACTIVE, Subscription.Status.TRIALING],
                    defaults={
                        "plan": plan,
                        "status": Subscription.Status.ACTIVE,
                        "paystack_customer_code": data.get("customer", {}).get("customer_code"),
                        "currency": data["currency"].upper(),
                        "current_period_start": timezone.now(),
                        "current_period_end": timezone.now() + timedelta(days=30),
                    }
                )
            except SubscriptionPlan.DoesNotExist:
                pass

    def _handle_subscription_created(self, data: Dict[str, Any]):
        """Handle subscription creation."""
        from .models import Subscription

        # Update subscription with Paystack code
        customer_code = data.get("customer", {}).get("customer_code")
        subscription_code = data.get("subscription_code")

        if customer_code and subscription_code:
            Subscription.objects.filter(
                paystack_customer_code=customer_code,
                status=Subscription.Status.ACTIVE
            ).update(
                paystack_subscription_code=subscription_code
            )

    def _handle_subscription_disabled(self, data: Dict[str, Any]):
        """Handle subscription cancellation."""
        from .models import Subscription

        subscription_code = data.get("subscription_code")
        if subscription_code:
            Subscription.objects.filter(
                paystack_subscription_code=subscription_code
            ).update(
                status=Subscription.Status.CANCELED,
                canceled_at=timezone.now()
            )

    def _handle_invoice_created(self, data: Dict[str, Any]):
        """Handle invoice creation."""
        pass  # Invoices are created when payment succeeds

    def _handle_invoice_failed(self, data: Dict[str, Any]):
        """Handle failed invoice payment."""
        from .models import Subscription

        subscription_code = data.get("subscription", {}).get("subscription_code")
        if subscription_code:
            Subscription.objects.filter(
                paystack_subscription_code=subscription_code
            ).update(status=Subscription.Status.PAST_DUE)
