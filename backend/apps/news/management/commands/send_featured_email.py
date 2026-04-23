"""
Manually send the featured-article email blast to all verified breaking-news
subscribers.

Usage:
    python manage.py send_featured_email                 # most recent featured article
    python manage.py send_featured_email --slug foo-bar
    python manage.py send_featured_email --id <uuid>
    python manage.py send_featured_email --sync          # send inline (no worker)
"""
from django.core.management.base import BaseCommand, CommandError

from apps.news.models import NewsArticle


class Command(BaseCommand):
    help = "Send a featured-article email blast to all breaking-news subscribers."

    def add_arguments(self, parser):
        parser.add_argument("--slug", help="Slug of the featured article to send.")
        parser.add_argument("--id", help="UUID of the featured article to send.")
        parser.add_argument(
            "--sync",
            action="store_true",
            help="Send synchronously in-process instead of queuing to django-q.",
        )

    def handle(self, *args, **opts):
        slug, article_id, sync = opts["slug"], opts["id"], opts["sync"]

        qs = NewsArticle.objects.filter(
            is_featured=True,
            status=NewsArticle.Status.PUBLISHED,
        )
        if slug:
            article = qs.filter(slug=slug).first()
            if not article:
                raise CommandError(f"No published featured article with slug={slug!r}")
        elif article_id:
            article = qs.filter(id=article_id).first()
            if not article:
                raise CommandError(f"No published featured article with id={article_id!r}")
        else:
            article = qs.order_by("-published_at", "-created_at").first()
            if not article:
                raise CommandError("No featured, published articles found.")

        from apps.engagement.models import NewsletterSubscription
        subscriber_count = NewsletterSubscription.objects.filter(
            newsletter_type=NewsletterSubscription.NewsletterType.BREAKING_NEWS,
            is_active=True,
            is_verified=True,
        ).count()

        if subscriber_count == 0:
            self.stdout.write(self.style.WARNING("No verified breaking-news subscribers."))
            return

        self.stdout.write(
            f"Sending '{article.title}' to {subscriber_count} subscriber(s)..."
        )

        if sync:
            from apps.news.signals import _send_featured_article_emails
            _send_featured_article_emails(str(article.id))
            self.stdout.write(self.style.SUCCESS("Done (sync)."))
        else:
            from django_q.tasks import async_task
            async_task(
                "apps.news.signals._send_featured_article_emails",
                str(article.id),
                task_name=f"featured-article-cli-{article.slug}",
            )
            self.stdout.write(self.style.SUCCESS("Queued (django-q worker will deliver)."))
