"""
Set up django-q2 scheduled tasks.

Usage: python manage.py setup_schedules
"""
from django.core.management.base import BaseCommand
from django_q.models import Schedule


SCHEDULES = [
    {
        "name": "refresh-feed-content",
        "func": "apps.spider.tasks.refresh_feed_content",
        "schedule_type": Schedule.MINUTES,
        "minutes": 720,  # Every 12 hours
    },
]


class Command(BaseCommand):
    help = "Create or update django-q2 scheduled tasks"

    def handle(self, *args, **options):
        for spec in SCHEDULES:
            schedule, created = Schedule.objects.update_or_create(
                name=spec["name"],
                defaults={
                    "func": spec["func"],
                    "schedule_type": spec["schedule_type"],
                    "minutes": spec.get("minutes", 0),
                    "repeats": -1,  # Run forever
                },
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action}: {spec['name']} (every {spec.get('minutes', '?')} min)")

        self.stdout.write(self.style.SUCCESS(f"\nDone — {len(SCHEDULES)} schedule(s) configured."))
        self.stdout.write("Run 'python manage.py qcluster' to start the worker.")
