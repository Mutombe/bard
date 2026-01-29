"""
News app Django signals.

Handles:
- Breaking news auto-notifications
- Article status change events
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import NewsArticle


@receiver(pre_save, sender=NewsArticle)
def track_breaking_news_change(sender, instance, **kwargs):
    """
    Track if is_breaking flag is being changed.

    Store the previous state to detect when an article becomes breaking news.
    """
    if instance.pk:
        try:
            old_instance = NewsArticle.objects.get(pk=instance.pk)
            instance._was_breaking = old_instance.is_breaking
        except NewsArticle.DoesNotExist:
            instance._was_breaking = False
    else:
        instance._was_breaking = False


@receiver(post_save, sender=NewsArticle)
def trigger_breaking_news_alert(sender, instance, created, **kwargs):
    """
    Trigger breaking news alert when an article is newly marked as breaking.

    Only triggers when:
    - Article is marked as breaking (is_breaking=True)
    - Article is published (status='published')
    - Article was not previously breaking (to avoid duplicate alerts)
    """
    from apps.engagement.tasks import send_breaking_news_alert

    # Check if article just became breaking news
    was_breaking = getattr(instance, "_was_breaking", False)
    is_now_breaking = instance.is_breaking
    is_published = instance.status == NewsArticle.Status.PUBLISHED

    # Trigger alert if:
    # 1. Article is now breaking and published
    # 2. Article wasn't breaking before (or is newly created with breaking=True)
    if is_now_breaking and is_published and not was_breaking:
        # Send breaking news alert asynchronously
        send_breaking_news_alert.delay(str(instance.id))
