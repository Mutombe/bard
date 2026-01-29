"""
Engagement Celery Tasks

Handles:
- Newsletter delivery
- Price alert processing
- Notification sending
- Email verification
"""
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone


@shared_task(name="apps.engagement.tasks.send_verification_email")
def send_verification_email(subscription_id: str):
    """
    Send verification email for newsletter subscription.

    Called when a new subscription is created.
    """
    from .models import NewsletterSubscription

    try:
        subscription = NewsletterSubscription.objects.get(id=subscription_id)
    except NewsletterSubscription.DoesNotExist:
        return "Subscription not found"

    if subscription.is_verified:
        return "Already verified"

    frontend_url = getattr(settings, "FRONTEND_URL", "https://bardglobalfinance.com")
    verify_url = f"{frontend_url}/newsletter/verify?token={subscription.verification_token}"

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316;">Bard Global Finance Institute</h1>
        </div>
        <div style="background-color: #1a1a2e; color: #ffffff; padding: 30px; border-radius: 8px;">
            <h2 style="color: #f97316; margin-top: 0;">Verify Your Subscription</h2>
            <p>Thank you for subscribing to our {subscription.get_newsletter_type_display()} newsletter!</p>
            <p>Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}"
                   style="background-color: #f97316; color: #ffffff; padding: 12px 30px;
                          text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Verify Email
                </a>
            </div>
            <p style="color: #888; font-size: 12px;">
                If you didn't subscribe to this newsletter, you can safely ignore this email.
            </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>&copy; Bard Global Finance Institute</p>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Bard Global Finance Institute - Verify Your Subscription

    Thank you for subscribing to our {subscription.get_newsletter_type_display()} newsletter!

    Please click the link below to verify your email address:
    {verify_url}

    If you didn't subscribe to this newsletter, you can safely ignore this email.
    """

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bardglobalfinance.com")

    try:
        send_mail(
            subject="Verify Your Newsletter Subscription - Bard Global Finance Institute",
            message=text_content,
            html_message=html_content,
            from_email=from_email,
            recipient_list=[subscription.email],
            fail_silently=False,
        )
        return f"Verification email sent to {subscription.email}"
    except Exception as e:
        return f"Failed to send verification email: {str(e)}"


@shared_task(name="apps.engagement.tasks.send_morning_brief")
def send_morning_brief():
    """
    Send daily morning market brief newsletter.

    Runs at 7 AM on weekdays.
    """
    from apps.markets.models import Company, MarketIndex

    from .models import NewsletterSubscription

    # Get active morning brief subscribers
    subscriptions = NewsletterSubscription.objects.filter(
        newsletter_type=NewsletterSubscription.NewsletterType.MORNING_BRIEF,
        is_active=True,
        is_verified=True,
    )

    # Get market data
    indices = MarketIndex.objects.all()[:5]
    top_gainers = sorted(
        Company.objects.filter(is_active=True)[:100],
        key=lambda x: x.price_change_percent,
        reverse=True,
    )[:5]
    top_losers = sorted(
        Company.objects.filter(is_active=True)[:100],
        key=lambda x: x.price_change_percent,
    )[:5]

    context = {
        "date": timezone.now().strftime("%B %d, %Y"),
        "indices": indices,
        "top_gainers": top_gainers,
        "top_losers": top_losers,
    }

    for subscription in subscriptions:
        context["unsubscribe_token"] = subscription.unsubscribe_token

        html_content = render_to_string("emails/morning_brief.html", context)
        text_content = render_to_string("emails/morning_brief.txt", context)

        send_mail(
            subject=f"Morning Market Brief - {context['date']}",
            message=text_content,
            html_message=html_content,
            from_email="noreply@bardsantner.com",
            recipient_list=[subscription.email],
            fail_silently=True,
        )

    return f"Sent morning brief to {subscriptions.count()} subscribers"


@shared_task(name="apps.engagement.tasks.send_evening_wrap")
def send_evening_wrap():
    """
    Send daily evening market wrap newsletter.

    Runs at 6 PM on weekdays.
    """
    from apps.markets.models import Company, MarketIndex
    from apps.news.models import NewsArticle

    from .models import NewsletterSubscription

    subscriptions = NewsletterSubscription.objects.filter(
        newsletter_type=NewsletterSubscription.NewsletterType.EVENING_WRAP,
        is_active=True,
        is_verified=True,
    )

    indices = MarketIndex.objects.all()[:5]
    most_active = Company.objects.filter(is_active=True).order_by("-volume")[:5]
    top_stories = NewsArticle.objects.filter(
        status=NewsArticle.Status.PUBLISHED,
        published_at__date=timezone.now().date(),
    )[:5]

    context = {
        "date": timezone.now().strftime("%B %d, %Y"),
        "indices": indices,
        "most_active": most_active,
        "top_stories": top_stories,
    }

    for subscription in subscriptions:
        context["unsubscribe_token"] = subscription.unsubscribe_token

        html_content = render_to_string("emails/evening_wrap.html", context)
        text_content = render_to_string("emails/evening_wrap.txt", context)

        send_mail(
            subject=f"Evening Market Wrap - {context['date']}",
            message=text_content,
            html_message=html_content,
            from_email="noreply@bardsantner.com",
            recipient_list=[subscription.email],
            fail_silently=True,
        )

    return f"Sent evening wrap to {subscriptions.count()} subscribers"


@shared_task(name="apps.engagement.tasks.process_price_alerts")
def process_price_alerts():
    """
    Process active price alerts and trigger notifications.

    Runs every minute during market hours.
    """
    from .models import Notification, PriceAlert

    active_alerts = PriceAlert.objects.filter(
        status=PriceAlert.AlertStatus.ACTIVE
    ).select_related("company", "user")

    triggered_count = 0

    for alert in active_alerts:
        current_price = alert.company.current_price

        if alert.check_trigger(current_price):
            alert.status = PriceAlert.AlertStatus.TRIGGERED
            alert.triggered_at = timezone.now()
            alert.triggered_price = current_price
            alert.save(update_fields=["status", "triggered_at", "triggered_price"])

            # Create notification
            Notification.objects.create(
                user=alert.user,
                notification_type=Notification.NotificationType.PRICE_ALERT,
                title=f"Price Alert: {alert.company.symbol}",
                message=f"{alert.company.symbol} has reached {current_price} ({alert.get_alert_type_display()})",
                data={
                    "company_id": str(alert.company.id),
                    "symbol": alert.company.symbol,
                    "price": str(current_price),
                    "alert_type": alert.alert_type,
                },
            )

            triggered_count += 1

    return f"Processed {active_alerts.count()} alerts, triggered {triggered_count}"


@shared_task(name="apps.engagement.tasks.send_breaking_news_alert")
def send_breaking_news_alert(article_id: str):
    """
    Send breaking news alert to subscribers.

    Called when an article is marked as breaking news.
    """
    from apps.news.models import NewsArticle

    from .models import NewsletterSubscription, Notification

    try:
        article = NewsArticle.objects.get(id=article_id, is_breaking=True)
    except NewsArticle.DoesNotExist:
        return "Article not found or not breaking news"

    # Email subscribers
    subscriptions = NewsletterSubscription.objects.filter(
        newsletter_type=NewsletterSubscription.NewsletterType.BREAKING_NEWS,
        is_active=True,
        is_verified=True,
    )

    for subscription in subscriptions:
        send_mail(
            subject=f"BREAKING: {article.title}",
            message=article.excerpt,
            from_email="noreply@bardsantner.com",
            recipient_list=[subscription.email],
            fail_silently=True,
        )

    # Create in-app notifications for all users who watch related companies
    from apps.users.models import UserProfile

    related_company_ids = article.related_companies.values_list("id", flat=True)

    users_watching = UserProfile.objects.filter(
        watchlist__id__in=related_company_ids
    ).values_list("user_id", flat=True).distinct()

    notifications = [
        Notification(
            user_id=user_id,
            notification_type=Notification.NotificationType.BREAKING_NEWS,
            title=f"Breaking News: {article.title[:50]}",
            message=article.excerpt[:200],
            data={
                "article_id": str(article.id),
                "slug": article.slug,
            },
        )
        for user_id in users_watching
    ]

    Notification.objects.bulk_create(notifications)

    return f"Sent breaking news to {subscriptions.count()} email subscribers and {len(notifications)} app users"
