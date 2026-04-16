"""
Publish scheduled content — run from cron every 5 minutes.

Usage:
    python manage.py publish_scheduled
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Promote scheduled articles and research reports that are due"

    def handle(self, *args, **options):
        from apps.editorial.scheduler import publish_scheduled_content

        result = publish_scheduled_content()
        self.stdout.write(self.style.SUCCESS(result))
