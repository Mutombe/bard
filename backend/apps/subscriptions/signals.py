"""
Signals for Subscription events.

Handles side effects like email notifications and
analytics tracking for subscription lifecycle events.
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from .models import Subscription, Payment, Invoice, Coupon, CouponRedemption

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Subscription)
def handle_subscription_created(sender, instance, created, **kwargs):
    """Handle new subscription creation."""
    if created:
        logger.info(f"New subscription created: {instance.user.email} - {instance.plan.name}")

        # Send welcome email
        try:
            context = {
                "user": instance.user,
                "subscription": instance,
                "plan": instance.plan,
            }
            html_message = render_to_string(
                "emails/subscription_welcome.html",
                context
            )
            send_mail(
                subject=f"Welcome to {instance.plan.name}!",
                message="",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")


@receiver(pre_save, sender=Subscription)
def handle_subscription_status_change(sender, instance, **kwargs):
    """Handle subscription status changes."""
    if not instance.pk:
        return

    try:
        old_instance = Subscription.objects.get(pk=instance.pk)
    except Subscription.DoesNotExist:
        return

    # Status changed to canceled
    if (
        old_instance.status != Subscription.Status.CANCELED
        and instance.status == Subscription.Status.CANCELED
    ):
        logger.info(f"Subscription canceled: {instance.user.email}")

        try:
            context = {
                "user": instance.user,
                "subscription": instance,
                "plan": instance.plan,
            }
            html_message = render_to_string(
                "emails/subscription_canceled.html",
                context
            )
            send_mail(
                subject="Your subscription has been canceled",
                message="",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send cancellation email: {e}")

    # Status changed to past_due
    if (
        old_instance.status != Subscription.Status.PAST_DUE
        and instance.status == Subscription.Status.PAST_DUE
    ):
        logger.warning(f"Subscription past due: {instance.user.email}")

        try:
            context = {
                "user": instance.user,
                "subscription": instance,
            }
            html_message = render_to_string(
                "emails/subscription_past_due.html",
                context
            )
            send_mail(
                subject="Action required: Payment failed",
                message="",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send past due email: {e}")


@receiver(post_save, sender=Payment)
def handle_payment_completed(sender, instance, created, **kwargs):
    """Handle successful payment."""
    if created and instance.status == Payment.Status.COMPLETED:
        logger.info(
            f"Payment completed: {instance.user.email} - "
            f"{instance.get_amount_display()}"
        )

        # Send receipt email
        try:
            context = {
                "user": instance.user,
                "payment": instance,
            }
            html_message = render_to_string(
                "emails/payment_receipt.html",
                context
            )
            send_mail(
                subject=f"Payment Receipt - {instance.get_amount_display()}",
                message="",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send receipt email: {e}")


@receiver(post_save, sender=Invoice)
def handle_invoice_created(sender, instance, created, **kwargs):
    """Handle invoice creation."""
    if created:
        logger.info(f"Invoice created: {instance.invoice_number}")


@receiver(post_save, sender=CouponRedemption)
def handle_coupon_redeemed(sender, instance, created, **kwargs):
    """Track coupon redemptions."""
    if created:
        # Increment coupon usage counter
        coupon = instance.coupon
        coupon.times_redeemed += 1
        coupon.save(update_fields=["times_redeemed"])

        logger.info(
            f"Coupon redeemed: {coupon.code} by {instance.user.email}"
        )
