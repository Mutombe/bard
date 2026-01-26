"""
SEO Views

SEO metadata, sitemap, and structured data endpoints.
"""
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin
from apps.news.models import NewsArticle
from apps.columnists.models import Columnist, Column
from apps.geography.models import Country

from .models import SEOMetadata, Redirect, StructuredData, RobotsTxt
from .serializers import (
    SEOMetadataSerializer,
    ArticleSEOSerializer,
    RedirectSerializer,
    StructuredDataSerializer,
)


class SEOMetadataViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SEO Metadata management.
    """

    queryset = SEOMetadata.objects.all()
    serializer_class = SEOMetadataSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=["get"])
    def for_article(self, request):
        """Get SEO metadata for an article."""
        article_id = request.query_params.get("article_id")
        if not article_id:
            return Response(
                {"error": "article_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            article = NewsArticle.objects.get(id=article_id)
        except NewsArticle.DoesNotExist:
            return Response(
                {"error": "Article not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        content_type = ContentType.objects.get_for_model(NewsArticle)
        seo, _ = SEOMetadata.objects.get_or_create(
            content_type=content_type,
            object_id=article.id,
            defaults={
                "meta_title": article.headline[:70],
                "meta_description": article.excerpt[:160] if article.excerpt else "",
            }
        )

        serializer = SEOMetadataSerializer(seo)
        return Response(serializer.data)


class ArticleSEOView(APIView):
    """
    Get complete SEO data for an article.

    Returns all meta tags, Open Graph, Twitter Cards,
    and Schema.org structured data.
    """

    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            article = NewsArticle.objects.select_related(
                "author", "category"
            ).prefetch_related("tags").get(slug=slug, status="published")
        except NewsArticle.DoesNotExist:
            return Response(
                {"error": "Article not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or create SEO metadata
        content_type = ContentType.objects.get_for_model(NewsArticle)
        seo, _ = SEOMetadata.objects.get_or_create(
            content_type=content_type,
            object_id=article.id,
        )

        base_url = getattr(settings, "SITE_URL", "https://bardsantner.com")
        article_url = f"{base_url}/article/{article.slug}"

        # Build meta tags
        title = seo.get_meta_title() or article.headline
        description = seo.meta_description or article.excerpt or ""
        keywords = seo.meta_keywords or ", ".join(t.name for t in article.tags.all())
        canonical = seo.canonical_url or article_url

        robots_parts = []
        if seo.no_index:
            robots_parts.append("noindex")
        else:
            robots_parts.append("index")
        if seo.no_follow:
            robots_parts.append("nofollow")
        else:
            robots_parts.append("follow")

        # Open Graph
        og_image = None
        if seo.og_image:
            og_image = request.build_absolute_uri(seo.og_image.url)
        elif article.featured_image:
            og_image = request.build_absolute_uri(article.featured_image.url)

        og = {
            "title": seo.get_og_title() or title,
            "description": seo.og_description or description,
            "image": og_image,
            "type": seo.og_type,
            "url": canonical,
            "site_name": "Bard Santner Journal",
            "locale": "en_US",
        }

        # Twitter Card
        twitter_image = None
        if seo.twitter_image:
            twitter_image = request.build_absolute_uri(seo.twitter_image.url)
        elif og_image:
            twitter_image = og_image

        twitter = {
            "card": seo.twitter_card,
            "title": seo.get_twitter_title() or title,
            "description": seo.twitter_description or description[:200],
            "image": twitter_image,
            "site": "@bardsantner",
        }

        # Schema.org structured data
        structured_data = []

        # NewsArticle schema
        article_schema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.headline,
            "description": description,
            "image": og_image,
            "datePublished": article.published_at.isoformat() if article.published_at else None,
            "dateModified": article.updated_at.isoformat(),
            "author": {
                "@type": "Person",
                "name": article.author.full_name if article.author else "Bard Santner Journal",
                "url": f"{base_url}/columnist/{article.author.columnist_profile.slug}" if hasattr(article.author, "columnist_profile") else None,
            },
            "publisher": {
                "@type": "Organization",
                "name": "Bard Santner Journal",
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{base_url}/logo.png",
                },
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonical,
            },
            "articleSection": article.category.name if article.category else None,
            "keywords": keywords,
        }
        structured_data.append(article_schema)

        # Breadcrumb schema
        breadcrumb_schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": base_url,
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": article.category.name if article.category else "News",
                    "item": f"{base_url}/category/{article.category.slug}" if article.category else f"{base_url}/news",
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": article.headline,
                    "item": canonical,
                },
            ],
        }
        structured_data.append(breadcrumb_schema)

        # Build breadcrumbs for frontend
        breadcrumbs = [
            {"name": "Home", "url": "/"},
            {"name": article.category.name if article.category else "News", "url": f"/category/{article.category.slug}" if article.category else "/news"},
            {"name": article.headline, "url": f"/article/{article.slug}"},
        ]

        seo_data = {
            "title": title,
            "description": description,
            "keywords": keywords,
            "canonical_url": canonical,
            "robots": ", ".join(robots_parts),
            "og": og,
            "twitter": twitter,
            "structured_data": structured_data,
            "breadcrumbs": breadcrumbs,
        }

        serializer = ArticleSEOSerializer(seo_data)
        return Response(serializer.data)


class SitemapView(APIView):
    """
    Generate XML sitemap.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        base_url = getattr(settings, "SITE_URL", "https://bardsantner.com")

        # Build sitemap entries
        entries = []

        # Static pages
        static_pages = [
            {"loc": "/", "priority": "1.0", "changefreq": "hourly"},
            {"loc": "/markets", "priority": "0.9", "changefreq": "hourly"},
            {"loc": "/news", "priority": "0.9", "changefreq": "hourly"},
            {"loc": "/columnists", "priority": "0.7", "changefreq": "weekly"},
            {"loc": "/about", "priority": "0.5", "changefreq": "monthly"},
            {"loc": "/contact", "priority": "0.5", "changefreq": "monthly"},
        ]

        for page in static_pages:
            entries.append(f"""  <url>
    <loc>{base_url}{page['loc']}</loc>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>""")

        # Articles
        articles = NewsArticle.objects.filter(
            status="published"
        ).order_by("-published_at")[:1000]

        content_type = ContentType.objects.get_for_model(NewsArticle)

        for article in articles:
            # Get SEO metadata if exists
            try:
                seo = SEOMetadata.objects.get(
                    content_type=content_type,
                    object_id=article.id
                )
                priority = str(seo.sitemap_priority)
                changefreq = seo.sitemap_changefreq
            except SEOMetadata.DoesNotExist:
                priority = "0.6"
                changefreq = "weekly"

            lastmod = article.updated_at.strftime("%Y-%m-%d")
            entries.append(f"""  <url>
    <loc>{base_url}/article/{article.slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>""")

        # Columnists
        columnists = Columnist.objects.filter(is_active=True)
        for columnist in columnists:
            entries.append(f"""  <url>
    <loc>{base_url}/columnist/{columnist.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>""")

        # Categories (from news app)
        from apps.news.models import Category
        categories = Category.objects.filter(is_active=True)
        for category in categories:
            entries.append(f"""  <url>
    <loc>{base_url}/category/{category.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>""")

        # Build XML
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(entries)}
</urlset>"""

        return HttpResponse(xml, content_type="application/xml")


class SitemapIndexView(APIView):
    """
    Generate sitemap index for large sites.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        base_url = getattr(settings, "SITE_URL", "https://bardsantner.com")
        today = timezone.now().strftime("%Y-%m-%d")

        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{base_url}/sitemap.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{base_url}/sitemap-news.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
</sitemapindex>"""

        return HttpResponse(xml, content_type="application/xml")


class NewsSitemapView(APIView):
    """
    Google News sitemap.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        base_url = getattr(settings, "SITE_URL", "https://bardsantner.com")

        # Get articles from last 48 hours (Google News requirement)
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(hours=48)

        articles = NewsArticle.objects.filter(
            status="published",
            published_at__gte=cutoff
        ).order_by("-published_at")[:1000]

        entries = []
        for article in articles:
            pub_date = article.published_at.strftime("%Y-%m-%dT%H:%M:%S+00:00")
            keywords = ", ".join(t.name for t in article.tags.all()[:5])

            entries.append(f"""  <url>
    <loc>{base_url}/article/{article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Bard Santner Journal</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>{pub_date}</news:publication_date>
      <news:title>{article.headline}</news:title>
      <news:keywords>{keywords}</news:keywords>
    </news:news>
  </url>""")

        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
{chr(10).join(entries)}
</urlset>"""

        return HttpResponse(xml, content_type="application/xml")


class RobotsTxtView(APIView):
    """
    Serve robots.txt.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        try:
            robots = RobotsTxt.objects.get(site="default", is_active=True)
            content = robots.content
        except RobotsTxt.DoesNotExist:
            base_url = getattr(settings, "SITE_URL", "https://bardsantner.com")
            content = f"""User-agent: *
Allow: /

# Sitemaps
Sitemap: {base_url}/sitemap.xml
Sitemap: {base_url}/sitemap-news.xml

# Crawl-delay for polite bots
Crawl-delay: 1

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
"""

        return HttpResponse(content, content_type="text/plain")


class RedirectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Redirect management.
    """

    queryset = Redirect.objects.all()
    serializer_class = RedirectSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["is_active", "redirect_type"]
    search_fields = ["from_path", "to_path"]

    @action(detail=False, methods=["get"])
    def check(self, request):
        """Check if a path has a redirect."""
        path = request.query_params.get("path")
        if not path:
            return Response(
                {"error": "path parameter required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            redirect = Redirect.objects.get(from_path=path, is_active=True)
            return Response({
                "has_redirect": True,
                "to_path": redirect.to_path,
                "redirect_type": redirect.redirect_type,
            })
        except Redirect.DoesNotExist:
            return Response({"has_redirect": False})


class StructuredDataViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Structured Data templates.
    """

    queryset = StructuredData.objects.all()
    serializer_class = StructuredDataSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["schema_type", "is_default"]
