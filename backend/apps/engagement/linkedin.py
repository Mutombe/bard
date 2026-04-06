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
import os
from typing import Optional

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

LINKEDIN_TOKEN_CACHE_KEY = "linkedin_access_token"
LINKEDIN_TOKEN_DURATION = 55 * 24 * 60 * 60  # 55 days (tokens last 60 days)
LINKEDIN_TOKEN_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".linkedin_token")


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
        """Get the access token — checks cache, file, env var."""
        # 1. Cache (fastest)
        token = cache.get(LINKEDIN_TOKEN_CACHE_KEY)
        if token:
            return token

        # 2. Token file (persists across process restarts)
        try:
            if os.path.exists(LINKEDIN_TOKEN_FILE):
                with open(LINKEDIN_TOKEN_FILE) as f:
                    token = f.read().strip()
                if token:
                    cache.set(LINKEDIN_TOKEN_CACHE_KEY, token, LINKEDIN_TOKEN_DURATION)
                    return token
        except Exception:
            pass

        # 3. Settings/env var
        token = getattr(settings, "LINKEDIN_ACCESS_TOKEN", "")
        if token:
            cache.set(LINKEDIN_TOKEN_CACHE_KEY, token, LINKEDIN_TOKEN_DURATION)
            return token

        return None

    def set_access_token(self, token: str):
        """Save access token to cache + file for persistence."""
        cache.set(LINKEDIN_TOKEN_CACHE_KEY, token, LINKEDIN_TOKEN_DURATION)
        # Save to file
        try:
            with open(LINKEDIN_TOKEN_FILE, "w") as f:
                f.write(token)
            logger.info(f"LinkedIn token saved to {LINKEDIN_TOKEN_FILE}")
        except Exception as e:
            logger.warning(f"Could not save token file: {e}")
        # Print for Render env var
        print(f"\nLINKEDIN_ACCESS_TOKEN={token}\n")

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
        # w_member_social only supports posting as a person, not org
        # We need to get the person URN from the /me endpoint
        if not author_urn:
            try:
                me_response = requests.get(
                    f"{self.API_BASE}/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10,
                )
                if me_response.status_code == 200:
                    person_id = me_response.json().get("id", "")
                    author_urn = f"urn:li:person:{person_id}"
                else:
                    logger.error(f"LinkedIn /me failed: {me_response.status_code}")
                    return False
            except Exception as e:
                logger.error(f"LinkedIn /me error: {e}")
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
