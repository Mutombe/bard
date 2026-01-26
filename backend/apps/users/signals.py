"""
User Signals

Auto-create UserProfile when a User is created.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile when a new User is created."""
    if created:
        UserProfile.objects.create(
            user=instance,
            preferences={
                "notifications": {
                    "price_alerts": True,
                    "breaking_news": True,
                    "daily_digest": True,
                    "weekly_report": False,
                },
                "display": {
                    "theme": "dark",
                    "currency": "ZAR",
                    "number_format": "en-ZA",
                },
                "default_exchange": "JSE",
            },
        )
