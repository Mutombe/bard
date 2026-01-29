"""
YouTube API Service with 24-hour caching
"""
import re
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.utils.text import slugify

import requests

logger = logging.getLogger(__name__)

# Cache duration: 1 hour (in seconds) - refresh videos more frequently
CACHE_DURATION = 60 * 60


class YouTubeService:
    """Service for interacting with YouTube Data API v3"""

    BASE_URL = "https://www.googleapis.com/youtube/v3"

    def __init__(self):
        self._api_key = None

    @property
    def api_key(self):
        """Lazy load API key to ensure settings are fully loaded"""
        if self._api_key is None:
            self._api_key = getattr(settings, "YOUTUBE_API_KEY", "")
            if not self._api_key:
                logger.warning("YouTube API key not configured")
        return self._api_key

    def _make_request(self, endpoint: str, params: dict) -> Optional[dict]:
        """Make a request to the YouTube API"""
        if not self.api_key:
            return None

        params["key"] = self.api_key
        url = f"{self.BASE_URL}/{endpoint}"

        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"YouTube API request failed: {e}")
            return None

    def parse_duration(self, duration: str) -> int:
        """Convert ISO 8601 duration to seconds"""
        if not duration:
            return 0

        # Pattern for ISO 8601 duration (PT1H2M3S)
        pattern = re.compile(
            r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
        )
        match = pattern.match(duration)
        if not match:
            return 0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        return hours * 3600 + minutes * 60 + seconds

    def format_duration(self, seconds: int) -> str:
        """Format seconds as HH:MM:SS or MM:SS"""
        hours, remainder = divmod(seconds, 3600)
        minutes, secs = divmod(remainder, 60)

        if hours:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        return f"{minutes}:{secs:02d}"

    def _get_cache_key(self, prefix: str, params: dict) -> str:
        """Generate a cache key from parameters"""
        param_str = str(sorted(params.items()))
        hash_str = hashlib.md5(param_str.encode()).hexdigest()
        return f"youtube_{prefix}_{hash_str}"

    def search_videos(
        self,
        query: str,
        max_results: int = 10,
        order: str = "relevance",
        published_after: Optional[datetime] = None,
        channel_id: Optional[str] = None,
        use_cache: bool = True,
    ) -> list:
        """Search for videos on YouTube with 24-hour caching"""
        params = {
            "part": "snippet",
            "type": "video",
            "q": query,
            "maxResults": max_results,
            "order": order,
        }

        if published_after:
            params["publishedAfter"] = published_after.isoformat() + "Z"

        if channel_id:
            params["channelId"] = channel_id

        # Check cache first
        cache_key = self._get_cache_key("search", params)
        if use_cache:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.info(f"YouTube search cache hit for: {query}")
                return cached_result

        data = self._make_request("search", params)
        if not data:
            return []

        video_ids = [item["id"]["videoId"] for item in data.get("items", [])]
        results = self.get_videos_details(video_ids)

        # Cache results for 1 hour
        if results and use_cache:
            cache.set(cache_key, results, CACHE_DURATION)
            logger.info(f"YouTube search cached for 1 hour: {query}")

        return results

    def get_video_details(self, video_id: str) -> Optional[dict]:
        """Get detailed information about a single video"""
        results = self.get_videos_details([video_id])
        return results[0] if results else None

    def get_videos_details(self, video_ids: list) -> list:
        """Get detailed information about multiple videos, filtering out unavailable ones"""
        if not video_ids:
            return []

        params = {
            "part": "snippet,contentDetails,statistics,status",
            "id": ",".join(video_ids),
        }

        data = self._make_request("videos", params)
        if not data:
            return []

        videos = []
        for item in data.get("items", []):
            # Filter out unavailable videos
            status = item.get("status", {})
            privacy_status = status.get("privacyStatus", "")
            upload_status = status.get("uploadStatus", "")

            # Skip if not public or not fully processed
            if privacy_status != "public":
                logger.info(f"Skipping non-public video: {item.get('id')} (privacy: {privacy_status})")
                continue
            if upload_status not in ["processed", ""]:
                logger.info(f"Skipping unprocessed video: {item.get('id')} (status: {upload_status})")
                continue

            # Check for embeddable
            if not status.get("embeddable", True):
                logger.info(f"Skipping non-embeddable video: {item.get('id')}")
                continue
            snippet = item.get("snippet", {})
            content_details = item.get("contentDetails", {})
            statistics = item.get("statistics", {})

            duration_seconds = self.parse_duration(content_details.get("duration", ""))

            # Parse published date
            published_at = None
            if snippet.get("publishedAt"):
                try:
                    published_at = datetime.fromisoformat(
                        snippet["publishedAt"].replace("Z", "+00:00")
                    )
                except ValueError:
                    pass

            videos.append({
                "video_id": item["id"],
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "channel_id": snippet.get("channelId", ""),
                "channel_title": snippet.get("channelTitle", ""),
                "published_at": published_at,
                "thumbnail_url": self._get_best_thumbnail(snippet.get("thumbnails", {})),
                "duration": content_details.get("duration", ""),
                "duration_seconds": duration_seconds,
                "duration_formatted": self.format_duration(duration_seconds),
                "view_count": int(statistics.get("viewCount", 0)),
                "like_count": int(statistics.get("likeCount", 0)),
                "comment_count": int(statistics.get("commentCount", 0)),
                "tags": snippet.get("tags", []),
                "video_url": f"https://www.youtube.com/watch?v={item['id']}",
                "embed_url": f"https://www.youtube.com/embed/{item['id']}",
            })

        return videos

    def _get_best_thumbnail(self, thumbnails: dict) -> str:
        """Get the highest quality thumbnail available"""
        for quality in ["maxres", "standard", "high", "medium", "default"]:
            if quality in thumbnails:
                return thumbnails[quality].get("url", "")
        return ""

    def get_channel_info(self, channel_id: str) -> Optional[dict]:
        """Get information about a YouTube channel"""
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": channel_id,
        }

        data = self._make_request("channels", params)
        if not data or not data.get("items"):
            return None

        item = data["items"][0]
        snippet = item.get("snippet", {})
        statistics = item.get("statistics", {})
        content_details = item.get("contentDetails", {})

        return {
            "channel_id": channel_id,
            "channel_name": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "thumbnail_url": self._get_best_thumbnail(snippet.get("thumbnails", {})),
            "channel_url": f"https://www.youtube.com/channel/{channel_id}",
            "subscriber_count": int(statistics.get("subscriberCount", 0)),
            "video_count": int(statistics.get("videoCount", 0)),
            "view_count": int(statistics.get("viewCount", 0)),
            "uploads_playlist_id": content_details.get("relatedPlaylists", {}).get("uploads", ""),
        }

    def get_channel_videos(
        self,
        channel_id: str,
        max_results: int = 20,
        published_after: Optional[datetime] = None,
    ) -> list:
        """Get recent videos from a channel"""
        # First, get the channel's uploads playlist
        channel_info = self.get_channel_info(channel_id)
        if not channel_info:
            return []

        playlist_id = channel_info.get("uploads_playlist_id")
        if not playlist_id:
            return []

        return self.get_playlist_videos(playlist_id, max_results, published_after)

    def get_playlist_videos(
        self,
        playlist_id: str,
        max_results: int = 20,
        published_after: Optional[datetime] = None,
    ) -> list:
        """Get videos from a playlist"""
        params = {
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
            "maxResults": min(max_results, 50),
        }

        data = self._make_request("playlistItems", params)
        if not data:
            return []

        video_ids = []
        for item in data.get("items", []):
            content_details = item.get("contentDetails", {})
            video_id = content_details.get("videoId")
            if video_id:
                # Filter by published date if specified
                if published_after:
                    snippet = item.get("snippet", {})
                    published_at_str = snippet.get("publishedAt")
                    if published_at_str:
                        try:
                            published_at = datetime.fromisoformat(
                                published_at_str.replace("Z", "+00:00")
                            )
                            if published_at < published_after:
                                continue
                        except ValueError:
                            pass
                video_ids.append(video_id)

        return self.get_videos_details(video_ids)

    def search_finance_videos(self, region: str = "africa", max_results: int = 10) -> list:
        """Search for financial news videos relevant to African markets"""
        queries = {
            "africa": "African stock market news OR African finance OR JSE OR NGX Nigeria OR ZSE Zimbabwe",
            "south_africa": "South Africa JSE stocks OR Johannesburg stock exchange OR SA economy news",
            "nigeria": "Nigeria NGX stocks OR Nigerian economy OR Lagos stocks market",
            "kenya": "Kenya NSE stocks OR Nairobi securities exchange OR East Africa economy",
            "egypt": "Egypt EGX stocks OR Egyptian economy OR Cairo stocks market",
            "zimbabwe": "Zimbabwe ZSE stocks OR Zimbabwe economy news OR Harare finance",
            "zambia": "Zambia LuSE stocks OR Zambia economy news OR Lusaka finance",
            "botswana": "Botswana BSE stocks OR Botswana economy news OR Gaborone finance",
            "tanzania": "Tanzania DSE stocks OR Dar es Salaam exchange OR Tanzania economy",
            "ghana": "Ghana GSE stocks OR Ghana economy news OR Accra finance",
            "southern_africa": "Southern Africa stocks OR SADC economy OR JSE ZSE BSE LuSE markets",
            "global": "global markets today OR stock market news OR financial news world economy",
        }

        query = queries.get(region, queries["africa"])
        return self.search_videos(
            query=query,
            max_results=max_results,
            order="date",
        )


# Singleton instance
youtube_service = YouTubeService()
