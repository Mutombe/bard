"""
Set images for research reports and podcasts from Unsplash or fallback URLs.
"""
from django.core.management.base import BaseCommand

from apps.research.models import ResearchReport
from apps.podcasts.models import PodcastShow, PodcastEpisode


# Curated Unsplash images for different content types
RESEARCH_IMAGES = {
    "banking": "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=450&fit=crop&auto=format",
    "fintech": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop&auto=format",
    "trade": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&h=450&fit=crop&auto=format",
    "esg": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop&auto=format",
    "mining": "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&h=450&fit=crop&auto=format",
    "markets": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format",
    "africa": "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=450&fit=crop&auto=format",
    "economy": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=450&fit=crop&auto=format",
}

PODCAST_SHOW_IMAGES = {
    "african-markets-today": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format",
    "research-briefing": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&auto=format",
    "executive-conversations": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=450&fit=crop&auto=format",
}

PODCAST_EPISODE_IMAGES = [
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=450&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=450&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=450&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&h=450&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop&auto=format",
]


class Command(BaseCommand):
    help = "Set images for research reports and podcasts"

    def handle(self, *args, **options):
        self.stdout.write("Setting images for content...")

        # Set research report images
        for report in ResearchReport.objects.all():
            image_url = None
            slug_lower = report.slug.lower()

            if "banking" in slug_lower:
                image_url = RESEARCH_IMAGES["banking"]
            elif "mobile" in slug_lower or "fintech" in slug_lower:
                image_url = RESEARCH_IMAGES["fintech"]
            elif "afcfta" in slug_lower or "trade" in slug_lower:
                image_url = RESEARCH_IMAGES["trade"]
            elif "esg" in slug_lower or "sustainable" in slug_lower:
                image_url = RESEARCH_IMAGES["esg"]
            elif "mining" in slug_lower:
                image_url = RESEARCH_IMAGES["mining"]
            else:
                image_url = RESEARCH_IMAGES["africa"]

            report.cover_image_url = image_url
            report.save(update_fields=["cover_image_url"])
            self.stdout.write(f"  Report: {report.title[:40]}... -> image set")

        # Set podcast show images
        for show in PodcastShow.objects.all():
            image_url = PODCAST_SHOW_IMAGES.get(show.slug, PODCAST_SHOW_IMAGES["african-markets-today"])
            show.cover_image_url = image_url
            show.save(update_fields=["cover_image_url"])
            self.stdout.write(f"  Show: {show.name} -> image set")

        # Set podcast episode images
        for idx, episode in enumerate(PodcastEpisode.objects.all()):
            image_url = PODCAST_EPISODE_IMAGES[idx % len(PODCAST_EPISODE_IMAGES)]
            episode.cover_image_url = image_url
            episode.save(update_fields=["cover_image_url"])
            self.stdout.write(f"  Episode: {episode.title[:40]}... -> image set")

        self.stdout.write(self.style.SUCCESS("Successfully set all content images!"))
