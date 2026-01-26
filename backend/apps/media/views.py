"""
Media Views - Videos and Podcasts
"""
from django.utils.text import slugify
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Video, VideoCategory, PodcastShow, PodcastEpisode, YouTubeChannel
from .serializers import (
    VideoSerializer,
    VideoListSerializer,
    VideoCategorySerializer,
    PodcastShowSerializer,
    PodcastEpisodeSerializer,
    PodcastEpisodeListSerializer,
    YouTubeChannelSerializer,
    YouTubeVideoSerializer,
)
from .services import youtube_service


class VideoCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for video categories"""
    queryset = VideoCategory.objects.all()
    serializer_class = VideoCategorySerializer
    lookup_field = "slug"
    permission_classes = [IsAuthenticatedOrReadOnly]


class VideoViewSet(viewsets.ModelViewSet):
    """ViewSet for videos"""
    queryset = Video.objects.select_related("category", "author")
    serializer_class = VideoSerializer
    lookup_field = "slug"
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "platform", "status", "is_featured"]
    search_fields = ["title", "description", "channel_title", "tags"]
    ordering_fields = ["published_at", "created_at", "view_count", "like_count"]
    ordering = ["-published_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return VideoListSerializer
        return VideoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Only show published videos to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(status="published")
        return queryset

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured videos"""
        videos = self.get_queryset().filter(is_featured=True)[:10]
        serializer = VideoListSerializer(videos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def latest(self, request):
        """Get latest videos"""
        videos = self.get_queryset().order_by("-published_at")[:20]
        serializer = VideoListSerializer(videos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def youtube_search(self, request):
        """Search YouTube for videos (live API call)"""
        query = request.query_params.get("q", "African stock market")
        max_results = int(request.query_params.get("max_results", 10))
        region = request.query_params.get("region", "africa")

        if query:
            videos = youtube_service.search_videos(
                query=query,
                max_results=max_results,
            )
        else:
            videos = youtube_service.search_finance_videos(
                region=region,
                max_results=max_results,
            )

        serializer = YouTubeVideoSerializer(videos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def youtube_finance(self, request):
        """Get finance-related videos - from database first, fallback to YouTube API"""
        max_results = int(request.query_params.get("max_results", 12))

        # First, try to get videos from our database (african-finance category)
        db_videos = Video.objects.filter(
            status="published",
            platform="youtube",
        ).order_by("-published_at", "-created_at")[:max_results]

        if db_videos.exists():
            # Return database videos formatted as YouTubeVideo
            videos_data = []
            for video in db_videos:
                videos_data.append({
                    "video_id": video.video_id,
                    "title": video.title,
                    "description": video.description,
                    "channel_id": video.channel_id,
                    "channel_title": video.channel_title,
                    "published_at": video.published_at.isoformat() if video.published_at else None,
                    "thumbnail_url": video.thumbnail_url,
                    "duration": video.duration,
                    "duration_seconds": video.duration_seconds,
                    "duration_formatted": f"{video.duration_seconds // 60}:{video.duration_seconds % 60:02d}",
                    "view_count": video.view_count,
                    "like_count": video.like_count,
                    "comment_count": video.comment_count,
                    "tags": video.tags if isinstance(video.tags, list) else [],
                    "video_url": video.video_url or f"https://www.youtube.com/watch?v={video.video_id}",
                    "embed_url": video.embed_url or f"https://www.youtube.com/embed/{video.video_id}",
                })
            return Response(videos_data)

        # Fallback to YouTube API if no database videos
        region = request.query_params.get("region", "africa")
        try:
            videos = youtube_service.search_finance_videos(
                region=region,
                max_results=max_results,
            )
            serializer = YouTubeVideoSerializer(videos, many=True)
            return Response(serializer.data)
        except Exception:
            # Return empty list if everything fails
            return Response([])

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def import_youtube(self, request):
        """Import a YouTube video to the database"""
        video_id = request.data.get("video_id")
        if not video_id:
            return Response(
                {"error": "video_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already imported
        if Video.objects.filter(video_id=video_id, platform="youtube").exists():
            return Response(
                {"error": "Video already imported"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch video details
        video_data = youtube_service.get_video_details(video_id)
        if not video_data:
            return Response(
                {"error": "Could not fetch video details from YouTube"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create video
        video = Video.objects.create(
            title=video_data["title"],
            slug=slugify(video_data["title"])[:255],
            description=video_data["description"],
            platform="youtube",
            video_id=video_id,
            video_url=video_data["video_url"],
            embed_url=video_data["embed_url"],
            thumbnail_url=video_data["thumbnail_url"],
            duration=video_data["duration"],
            duration_seconds=video_data["duration_seconds"],
            channel_id=video_data["channel_id"],
            channel_title=video_data["channel_title"],
            published_at=video_data["published_at"],
            view_count=video_data["view_count"],
            like_count=video_data["like_count"],
            comment_count=video_data["comment_count"],
            tags=video_data["tags"],
            author=request.user,
            status="published",
        )

        serializer = VideoSerializer(video)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PodcastShowViewSet(viewsets.ModelViewSet):
    """ViewSet for podcast shows"""
    queryset = PodcastShow.objects.filter(is_active=True)
    serializer_class = PodcastShowSerializer
    lookup_field = "slug"
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [SearchFilter]
    search_fields = ["name", "description"]

    @action(detail=True, methods=["get"])
    def episodes(self, request, slug=None):
        """Get all episodes for a show"""
        show = self.get_object()
        episodes = show.episodes.filter(status="published").order_by("-published_at")
        serializer = PodcastEpisodeListSerializer(episodes, many=True)
        return Response(serializer.data)


class PodcastEpisodeViewSet(viewsets.ModelViewSet):
    """ViewSet for podcast episodes"""
    queryset = PodcastEpisode.objects.select_related("show")
    serializer_class = PodcastEpisodeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["show", "platform", "status", "is_featured", "season"]
    search_fields = ["title", "description", "guests"]
    ordering_fields = ["published_at", "created_at", "view_count", "episode_number"]
    ordering = ["-published_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return PodcastEpisodeListSerializer
        return PodcastEpisodeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Only show published episodes to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(status="published")
        return queryset

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured episodes"""
        episodes = self.get_queryset().filter(is_featured=True)[:10]
        serializer = PodcastEpisodeListSerializer(episodes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def latest(self, request):
        """Get latest episodes"""
        episodes = self.get_queryset().order_by("-published_at")[:20]
        serializer = PodcastEpisodeListSerializer(episodes, many=True)
        return Response(serializer.data)


class YouTubeChannelViewSet(viewsets.ModelViewSet):
    """ViewSet for managing YouTube channels to sync"""
    queryset = YouTubeChannel.objects.all()
    serializer_class = YouTubeChannelSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "channel_id"

    @action(detail=False, methods=["post"])
    def add_channel(self, request):
        """Add a YouTube channel by ID"""
        channel_id = request.data.get("channel_id")
        if not channel_id:
            return Response(
                {"error": "channel_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already exists
        if YouTubeChannel.objects.filter(channel_id=channel_id).exists():
            return Response(
                {"error": "Channel already added"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch channel info
        channel_info = youtube_service.get_channel_info(channel_id)
        if not channel_info:
            return Response(
                {"error": "Could not fetch channel info from YouTube"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create channel
        channel = YouTubeChannel.objects.create(
            channel_id=channel_id,
            channel_name=channel_info["channel_name"],
            channel_url=channel_info["channel_url"],
            thumbnail_url=channel_info["thumbnail_url"],
            description=channel_info["description"],
            subscriber_count=channel_info["subscriber_count"],
            video_count=channel_info["video_count"],
        )

        serializer = YouTubeChannelSerializer(channel)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def sync_videos(self, request, channel_id=None):
        """Sync videos from this channel"""
        channel = self.get_object()
        max_results = int(request.data.get("max_results", 20))

        videos = youtube_service.get_channel_videos(
            channel_id=channel.channel_id,
            max_results=max_results,
        )

        imported_count = 0
        for video_data in videos:
            # Skip if already imported
            if Video.objects.filter(video_id=video_data["video_id"], platform="youtube").exists():
                continue

            Video.objects.create(
                title=video_data["title"],
                slug=slugify(video_data["title"])[:255],
                description=video_data["description"],
                platform="youtube",
                video_id=video_data["video_id"],
                video_url=video_data["video_url"],
                embed_url=video_data["embed_url"],
                thumbnail_url=video_data["thumbnail_url"],
                duration=video_data["duration"],
                duration_seconds=video_data["duration_seconds"],
                channel_id=video_data["channel_id"],
                channel_title=video_data["channel_title"],
                published_at=video_data["published_at"],
                view_count=video_data["view_count"],
                like_count=video_data["like_count"],
                comment_count=video_data["comment_count"],
                tags=video_data["tags"],
                status="published",
            )
            imported_count += 1

        # Update last synced
        channel.last_synced = timezone.now()
        channel.save()

        return Response({
            "message": f"Synced {imported_count} new videos",
            "imported_count": imported_count,
            "total_fetched": len(videos),
        })

    @action(detail=True, methods=["get"])
    def videos(self, request, channel_id=None):
        """Get videos from this channel (live from YouTube)"""
        channel = self.get_object()
        max_results = int(request.query_params.get("max_results", 10))

        videos = youtube_service.get_channel_videos(
            channel_id=channel.channel_id,
            max_results=max_results,
        )

        serializer = YouTubeVideoSerializer(videos, many=True)
        return Response(serializer.data)
