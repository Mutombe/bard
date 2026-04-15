"""
Publication Release Email Service

Sends notification emails to subscribers when a new research publication
is released. Uses the reusable publication_release.html template.
"""
import logging
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


# Map report_type to publication label + frontend section path
PUBLICATION_MAP = {
    "quarterly": {
        "label": "Finance Africa Quarterly",
        "section": "finance-africa-quarterly",
    },
    "analysis": {
        "label": "Finance Africa Insights",
        "section": "finance-africa-insights",
    },
    "outlook": {
        "label": "AfriFin Analytics",
        "section": "afrifin-analytics",
    },
    "annual": {"label": "Annual Report", "section": "finance-africa-quarterly"},
    "country": {"label": "Country Report", "section": "finance-africa-quarterly"},
    "special": {"label": "Special Report", "section": "finance-africa-quarterly"},
    "whitepaper": {"label": "Whitepaper", "section": "finance-africa-quarterly"},
}


def send_publication_release_email(report_id: str) -> dict:
    """
    Send publication release email to relevant subscribers.

    Args:
        report_id: UUID of the ResearchReport

    Returns:
        dict with keys: sent (int), failed (int), report_title (str)
    """
    from apps.research.models import ResearchReport
    from apps.engagement.models import NewsletterSubscription

    try:
        report = ResearchReport.objects.get(id=report_id, status="published")
    except ResearchReport.DoesNotExist:
        return {"sent": 0, "failed": 0, "error": "Report not found or not published"}

    pub_info = PUBLICATION_MAP.get(report.report_type, PUBLICATION_MAP["quarterly"])
    publication_label = pub_info["label"]
    section_slug = pub_info["section"]

    # Pick subscriber types to notify based on publication type
    # All publications notify all subscribers since we have one main list
    subscriptions = NewsletterSubscription.objects.filter(
        is_active=True,
        is_verified=True,
    )

    if not subscriptions.exists():
        logger.info("No subscribers to notify for publication %s", report_id)
        return {"sent": 0, "failed": 0, "report_title": report.title}

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "BGFI <publish@bgfi.global>")
    frontend_url = getattr(settings, "FRONTEND_URL", "https://bgfi.global")
    report_url = f"{frontend_url}/publications/{report.report_type}/{report.slug}"

    # Cover image
    cover_url = ""
    if report.cover_image:
        cover_url = report.cover_image.url
    elif report.cover_image_url:
        cover_url = report.cover_image_url

    # PDF URL
    pdf_url = ""
    if report.pdf_file:
        pdf_url = report.pdf_file.url

    # Is new (< 30 days old)
    is_new = (
        report.published_at and
        report.published_at >= timezone.now() - timedelta(days=30)
    )

    # Subject line varies by publication type
    subject = f"New {publication_label}: {report.title[:80]}"

    sent_count = 0
    failed_count = 0
    seen_emails = set()

    for sub in subscriptions:
        # Dedup by email (subscribers might be on multiple lists)
        if sub.email in seen_emails:
            continue
        seen_emails.add(sub.email)

        unsubscribe_url = (
            f"{frontend_url}/newsletter/unsubscribe?token={sub.unsubscribe_token}"
        )

        context = {
            "report": report,
            "publication_label": publication_label,
            "section_slug": section_slug,
            "report_url": report_url,
            "pdf_url": pdf_url,
            "cover_url": cover_url,
            "is_new": is_new,
            "subject": subject,
            "unsubscribe_url": unsubscribe_url,
        }

        try:
            html_content = render_to_string("emails/publication_release.html", context)
            text_content = render_to_string("emails/publication_release.txt", context)

            send_mail(
                subject=subject,
                message=text_content,
                html_message=html_content,
                from_email=from_email,
                recipient_list=[sub.email],
                fail_silently=False,
            )
            sent_count += 1
        except Exception as e:
            logger.error("Publication email failed for %s: %s", sub.email, e)
            failed_count += 1

    logger.info(
        "Publication release: '%s' — sent %d, failed %d",
        report.title, sent_count, failed_count,
    )

    return {
        "sent": sent_count,
        "failed": failed_count,
        "report_title": report.title,
        "publication_label": publication_label,
    }
