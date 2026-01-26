"""
Celery Configuration for Bard Santner Journal

Handles:
- Market data scraping tasks
- Newsletter distribution
- Price alert processing
- Scheduled data aggregation
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("bard")

app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# =========================
# Celery Beat Schedule
# Market Data Scraping & Newsletters
# =========================
app.conf.beat_schedule = {
    # ----- Market Data Scraping -----
    "scrape-jse-every-5-minutes": {
        "task": "apps.spider.tasks.scrape_jse_data",
        "schedule": crontab(minute="*/5", hour="8-17", day_of_week="1-5"),
        "options": {"queue": "scraping"},
    },
    "scrape-zse-every-10-minutes": {
        "task": "apps.spider.tasks.scrape_zse_data",
        "schedule": crontab(minute="*/10", hour="8-16", day_of_week="1-5"),
        "options": {"queue": "scraping"},
    },
    "scrape-bse-every-10-minutes": {
        "task": "apps.spider.tasks.scrape_bse_data",
        "schedule": crontab(minute="*/10", hour="9-16", day_of_week="1-5"),
        "options": {"queue": "scraping"},
    },
    # ----- Data Aggregation -----
    "aggregate-daily-market-data": {
        "task": "apps.spider.tasks.aggregate_daily_data",
        "schedule": crontab(minute=0, hour=18, day_of_week="1-5"),
        "options": {"queue": "aggregation"},
    },
    "calculate-market-indices": {
        "task": "apps.spider.tasks.calculate_indices",
        "schedule": crontab(minute="*/15", hour="8-17", day_of_week="1-5"),
        "options": {"queue": "aggregation"},
    },
    # ----- Newsletters -----
    "send-morning-market-brief": {
        "task": "apps.engagement.tasks.send_morning_brief",
        "schedule": crontab(minute=0, hour=7, day_of_week="1-5"),
        "options": {"queue": "newsletters"},
    },
    "send-evening-market-wrap": {
        "task": "apps.engagement.tasks.send_evening_wrap",
        "schedule": crontab(minute=0, hour=18, day_of_week="1-5"),
        "options": {"queue": "newsletters"},
    },
    # ----- Price Alerts -----
    "process-price-alerts": {
        "task": "apps.engagement.tasks.process_price_alerts",
        "schedule": crontab(minute="*/1", hour="8-17", day_of_week="1-5"),
        "options": {"queue": "alerts"},
    },
    # ----- Maintenance -----
    "cleanup-old-ticker-data": {
        "task": "apps.spider.tasks.cleanup_old_data",
        "schedule": crontab(minute=0, hour=2),
        "options": {"queue": "maintenance"},
    },
}

# =========================
# Task Routing
# =========================
app.conf.task_routes = {
    "apps.spider.tasks.*": {"queue": "scraping"},
    "apps.engagement.tasks.send_*": {"queue": "newsletters"},
    "apps.engagement.tasks.process_*": {"queue": "alerts"},
}

# =========================
# Task Settings
# =========================
app.conf.task_serializer = "json"
app.conf.result_serializer = "json"
app.conf.accept_content = ["json"]
app.conf.timezone = "Africa/Johannesburg"
app.conf.enable_utc = True
app.conf.task_track_started = True
app.conf.task_time_limit = 300  # 5 minutes
app.conf.task_soft_time_limit = 240  # 4 minutes
app.conf.worker_prefetch_multiplier = 1
app.conf.worker_concurrency = 4


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f"Request: {self.request!r}")
