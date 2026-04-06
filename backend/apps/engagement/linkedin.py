"""
LinkedIn Auto-Posting Service

Posts featured articles to the BGFI LinkedIn company page.
Uses LinkedIn's REST API v2 for sharing posts.

Setup:
1. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in env
2. Run: python manage.py linkedin_auth — follow the URL to authorize
3. The access token is saved and auto-refreshes

Usage:
    from apps.engagement.linkedin import post_featured_to_linkedin
    post_featured_to_linkedin(article_id)
"""
import logging
from typing import Optional

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

LINKEDIN_TOKEN_CACHE_KEY = "linkedin_access_token"
LINKEDIN_TOKEN_DURATION = 55 * 24 * 60 * 60  # 55 days (tokens last 60 days)


class LinkedInService:
    """Service for posting to LinkedIn company page."""

    AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    API_BASE = "https://api.linkedin.com/v2"
    REST_BASE = "https://api.linkedin.com/rest"

    def __init__(self):
        self.client_id = getattr(settings, "LINKEDIN_CLIENT_ID", "")
        self.client_secret = getattr(settings, "LINKEDIN_CLIENT_SECRET", "")
        self.redirect_uri = getattr(settings, "LINKEDIN_REDIRECT_URI", "https://bgfi.global/api/v1/auth/linkedin/callback")
        self.org_id = getattr(settings, "LINKEDIN_ORG_ID", "")  # Company page URN

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def get_auth_url(self, state: str = "bgfi_linkedin_auth") -> str:
        """Generate the OAuth authorization URL. User visits this once."""
        scopes = "w_member_social"
        return (
            f"{self.AUTH_URL}?"
            f"response_type=code&"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"state={state}&"
            f"scope={scopes}"
        )

    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token."""
        try:
            response = requests.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                timeout=15,
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                expires_in = data.get("expires_in", 5184000)  # Default 60 days
                if token:
                    # Cache the token
                    cache.set(LINKEDIN_TOKEN_CACHE_KEY, token, min(expires_in - 86400, LINKEDIN_TOKEN_DURATION))
                    logger.info("LinkedIn access token saved successfully")
                    return token
            logger.error(f"LinkedIn token exchange failed: {response.status_code} {response.text[:200]}")
        except Exception as e:
            logger.error(f"LinkedIn token exchange error: {e}")
        return None

    def get_access_token(self) -> Optional[str]:
        """Get the access token — checks cache first, then env/settings, then DB."""
        # 1. Cache (fastest)
        token = cache.get(LINKEDIN_TOKEN_CACHE_KEY)
        if token:
            return token

        # 2. Settings/env var (persistent across restarts)
        token = getattr(settings, "LINKEDIN_ACCESS_TOKEN", "")
        if token:
            cache.set(LINKEDIN_TOKEN_CACHE_KEY, token, LINKEDIN_TOKEN_DURATION)
            return token

        # 3. Database (most persistent)
        try:
            from django.contrib.sites.models import Site
            # Use a simple key-value approach via cache table
            from django.core.cache import caches
            db_cache = caches.get("default", cache)
            token = db_cache.get(LINKEDIN_TOKEN_CACHE_KEY)
            if token:
                return token
        except Exception:
            pass

        return None

    def set_access_token(self, token: str):
        """Save access token to cache AND print it for env var setup."""
        cache.set(LINKEDIN_TOKEN_CACHE_KEY, token, LINKEDIN_TOKEN_DURATION)
        # Also print for manual env var setup
        logger.info(f"LinkedIn token obtained. Set LINKEDIN_ACCESS_TOKEN env var on Render for persistence.")
        print(f"\n{'='*60}")
        print(f"IMPORTANT: Add this to your Render env vars:")
        print(f"LINKEDIN_ACCESS_TOKEN={token}")
        print(f"{'='*60}\n")

    def get_user_profile(self, access_token: str) -> Optional[dict]:
        """Get the authenticated user's LinkedIn profile."""
        try:
            response = requests.get(
                f"{self.API_BASE}/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"LinkedIn profile fetch failed: {e}")
        return None

    def post_article(
        self,
        title: str,
        description: str,
        article_url: str,
        image_url: str = "",
        author_urn: str = "",
    ) -> bool:
        """
        Post an article share to LinkedIn.

        Args:
            title: Article headline
            description: Short description/excerpt
            article_url: Full URL to the article on BGFI
            image_url: Featured image URL
            author_urn: LinkedIn URN of the poster (person or org)
        """
        access_token = self.get_access_token()
        if not access_token:
            logger.warning("No LinkedIn access token available — skipping post")
            return False

        # Determine the author URN
        if not author_urn:
            if self.org_id:
                author_urn = f"urn:li:organization:{self.org_id}"
            else:
                # Get user profile to use as author
                profile = self.get_user_profile(access_token)
                if profile:
                    author_urn = f"urn:li:person:{profile.get('sub', '')}"
                else:
                    logger.error("Cannot determine LinkedIn author URN")
                    return False

        # Build the post payload
        post_data = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": f"{title}\n\n{description[:250]}...\n\nRead more on BGFI 👇"
                    },
                    "shareMediaCategory": "ARTICLE",
                    "media": [
                        {
                            "status": "READY",
                            "originalUrl": article_url,
                            "title": {
                                "text": title
                            },
                            "description": {
                                "text": description[:200]
                            },
                        }
                    ],
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }

        try:
            response = requests.post(
                f"{self.API_BASE}/ugcPosts",
                json=post_data,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0",
                },
                timeout=15,
            )

            if response.status_code in (200, 201):
                post_id = response.json().get("id", "")
                logger.info(f"LinkedIn post created: {post_id}")
                return True
            else:
                logger.error(f"LinkedIn post failed: {response.status_code} {response.text[:300]}")
                return False

        except Exception as e:
            logger.error(f"LinkedIn post error: {e}")
            return False


def post_featured_to_linkedin(article_id: str) -> bool:
    """
    Post a featured article to LinkedIn.
    Called from the featured article signal.
    """
    from apps.news.models import NewsArticle

    try:
        article = NewsArticle.objects.get(id=article_id, is_featured=True)
    except NewsArticle.DoesNotExist:
        return False

    service = LinkedInService()
    if not service.is_configured:
        logger.info("LinkedIn not configured — skipping post")
        return False

    frontend_url = getattr(settings, "FRONTEND_URL", "https://bgfi.global")
    article_url = f"{frontend_url}/news/{article.slug}"

    return service.post_article(
        title=article.title,
        description=article.excerpt or article.content[:300],
        article_url=article_url,
        image_url=article.featured_image_url or "",
    )
