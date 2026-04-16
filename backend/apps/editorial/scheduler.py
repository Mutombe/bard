"""
Scheduled Content Publisher

Triggered by API list endpoints on every request (with a cache gate
so it runs at most once every 2 minutes). No separate cron job needed.

Admin flow:
1. Admin writes article/research
2. Sets status = "scheduled" + published_at = future datetime
3. Next time someone loads /news, /publications/*, /admin/articles,
   or any list endpoint, this runs and flips any due items to published
4. Cache gate ensures we never hammer the DB — runs at most every 2 min
"""
import logging
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

SCHEDULER_CACHE_KEY = "scheduler:last_run"
SCHEDULER_INTERVAL_SECONDS = 120  # Run at most once every 2 minutes


def publish_scheduled_content():
    """
    Promote scheduled NewsArticles and ResearchReports to published
    when their published_at has passed.

    Called from list-endpoint views; gated by cache to run max 1x/2min.
    """
    from apps.news.models import NewsArticle
    from apps.research.models import ResearchReport

    now = timezone.now()
    results = []

    # Promote scheduled articles
    due_articles = NewsArticle.objects.filter(
        status=NewsArticle.Status.SCHEDULED,
        published_at__lte=now,
    )
    article_count = due_articles.update(status=NewsArticle.Status.PUBLISHED)
    if article_count:
        logger.info(f"Scheduler: promoted {article_count} articles to published")
        results.append(f"Articles: {article_count} published")

    # Promote scheduled research reports
    due_reports = ResearchReport.objects.filter(
        status=ResearchReport.Status.SCHEDULED,
        published_at__lte=now,
    )
    report_count = due_reports.update(status=ResearchReport.Status.PUBLISHED)
    if report_count:
        logger.info(f"Scheduler: promoted {report_count} reports to published")
        results.append(f"Research: {report_count} published")

    if not results:
        return "Nothing due for publication"

    return " · ".join(results)


def run_scheduler_if_due():
    """
    Cache-gated version — safe to call on every request.
    Only actually runs the scheduler if 2 minutes have passed since last run.
    Silent fail — never crashes the calling view.
    """
    try:
        last_run = cache.get(SCHEDULER_CACHE_KEY)
        if last_run is not None:
            return  # Already ran recently
        # Set the gate BEFORE running to prevent races
        cache.set(SCHEDULER_CACHE_KEY, True, SCHEDULER_INTERVAL_SECONDS)
        publish_scheduled_content()
    except Exception as e:
        logger.debug(f"Scheduler check failed silently: {e}")
