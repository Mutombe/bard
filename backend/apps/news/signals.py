"""
News app Django signals.

Handles:
- Breaking news auto-notifications
- Featured article email notifications to subscribers
- Article status change events
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.template.loader import render_to_string

from .models import NewsArticle

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=NewsArticle)
def track_article_flag_changes(sender, instance, **kwargs):
    """
    Track if is_breaking or is_featured flags are being changed.

    Store the previous state to detect transitions.
    """
    if instance.pk:
        try:
            old_instance = NewsArticle.objects.get(pk=instance.pk)
            instance._was_breaking = old_instance.is_breaking
            instance._was_featured = old_instance.is_featured
        except NewsArticle.DoesNotExist:
            instance._was_breaking = False
            instance._was_featured = False
    else:
        instance._was_breaking = False
        instance._was_featured = False


@receiver(post_save, sender=NewsArticle)
def trigger_breaking_news_alert(sender, instance, created, **kwargs):
    """
    Trigger breaking news alert when an article is newly marked as breaking.

    Only triggers when:
    - Article is marked as breaking (is_breaking=True)
    - Article is published (status='published')
    - Article was not previously breaking (to avoid duplicate alerts)
    """
    from django_q.tasks import async_task

    # Check if article just became breaking news
    was_breaking = getattr(instance, "_was_breaking", False)
    is_now_breaking = instance.is_breaking
    is_published = instance.status == NewsArticle.Status.PUBLISHED

    # Trigger alert if:
    # 1. Article is now breaking and published
    # 2. Article wasn't breaking before (or is newly created with breaking=True)
    if is_now_breaking and is_published and not was_breaking:
        # Send breaking news alert via django-q2
        async_task(
            "apps.engagement.tasks.send_breaking_news_alert",
            str(instance.id),
            task_name=f"breaking-news-{instance.slug}",
        )


@receiver(post_save, sender=NewsArticle)
def notify_subscribers_featured_article(sender, instance, created, **kwargs):
    """
    Email breaking-news subscribers when an article is newly marked as featured.

    Sends in a background thread to avoid blocking the save.
    """
    was_featured = getattr(instance, "_was_featured", False)
    is_now_featured = instance.is_featured
    is_published = instance.status == NewsArticle.Status.PUBLISHED

    if is_now_featured and is_published and not was_featured:
        # Send featured article emails via django-q2 worker
        async_task(
            "apps.news.signals._send_featured_article_emails",
            str(instance.id),
            task_name=f"featured-article-{instance.slug}",
        )


def _send_featured_article_emails(article_id: str):
    """Send featured article notification emails to breaking-news subscribers."""
    from apps.engagement.models import NewsletterSubscription, Notification

    try:
        article = NewsArticle.objects.get(id=article_id, is_featured=True)
    except NewsArticle.DoesNotExist:
        return

    subscriptions = NewsletterSubscription.objects.filter(
        newsletter_type=NewsletterSubscription.NewsletterType.BREAKING_NEWS,
        is_active=True,
        is_verified=True,
    )

    if not subscriptions.exists():
        logger.info("No breaking-news subscribers to notify for featured article %s", article_id)
        return

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "BGFI <publish@bgfi.global>")
    frontend_url = getattr(settings, "FRONTEND_URL", "https://bgfi.global")
    article_url = f"{frontend_url}/news/{article.slug}"

    # Get the article's image URL for the email
    image_url = ""
    if article.featured_image:
        image_url = article.featured_image.url
    elif article.featured_image_url:
        image_url = article.featured_image_url

    sent_count = 0
    for subscription in subscriptions:
        unsubscribe_url = (
            f"{frontend_url}/newsletter/unsubscribe?token={subscription.unsubscribe_token}"
        )

        context = {
            "article": article,
            "article_url": article_url,
            "image_url": image_url,
            "unsubscribe_url": unsubscribe_url,
        }

        try:
            html_content = render_to_string("emails/featured_article.html", context)
            text_content = render_to_string("emails/featured_article.txt", context)

            send_mail(
                subject=f"Featured: {article.title}",
                message=text_content,
                html_message=html_content,
                from_email=from_email,
                recipient_list=[subscription.email],
                fail_silently=True,
            )
            sent_count += 1
        except Exception as e:
            logger.error("Failed to send featured article email to %s: %s", subscription.email, e)

    # Also create in-app notifications for users watching related companies
    related_company_ids = article.related_companies.values_list("id", flat=True)
    if related_company_ids:
        from apps.users.models import UserProfile

        profiles_watching = UserProfile.objects.filter(
            watchlist__id__in=related_company_ids
        ).select_related("user").distinct()

        notifications = []
        for profile in profiles_watching:
            breaking_news_enabled = profile.get_preference(
                "notifications", "breaking_news", default=True
            )
            if not breaking_news_enabled:
                continue

            notifications.append(
                Notification(
                    user=profile.user,
                    notification_type=Notification.NotificationType.BREAKING_NEWS,
                    title=f"Featured: {article.title[:50]}",
                    message=article.excerpt[:200] if article.excerpt else "",
                    data={
                        "article_id": str(article.id),
                        "article_slug": article.slug,
                    },
                )
            )

        if notifications:
            Notification.objects.bulk_create(notifications)

    logger.info(
        "Featured article %s: sent %d emails, %d in-app notifications",
        article.slug, sent_count, len(notifications) if related_company_ids else 0,
    )
