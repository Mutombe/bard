"""
Podcast API Serializers
"""
from rest_framework import serializers

from apps.users.serializers import UserMinimalSerializer
from apps.research.serializers import TopicMinimalSerializer, IndustryMinimalSerializer

from .models import PodcastShow, PodcastEpisode, EpisodeListen, PodcastSubscription


class PodcastShowListSerializer(serializers.ModelSerializer):
    """Serializer for podcast show listings."""

    episode_count = serializers.IntegerField(read_only=True)
    hosts = UserMinimalSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PodcastShow
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "short_description",
            "cover_image",
            "cover_image_url",
            "image_url",
            "hosts",
            "status",
            "is_featured",
            "episode_count",
            "total_listens",
            "frequency",
        ]

    def get_image_url(self, obj):
        """Return the best available image URL."""
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return obj.cover_image_url or None


class PodcastShowDetailSerializer(serializers.ModelSerializer):
    """Serializer for full podcast show details."""

    episode_count = serializers.IntegerField(read_only=True)
    hosts = UserMinimalSerializer(many=True, read_only=True)
    topics = TopicMinimalSerializer(many=True, read_only=True)
    industries = IndustryMinimalSerializer(many=True, read_only=True)
    recent_episodes = serializers.SerializerMethodField()

    class Meta:
        model = PodcastShow
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "description",
            "short_description",
            "cover_image",
            "banner_image",
            "hosts",
            "spotify_url",
            "apple_podcasts_url",
            "google_podcasts_url",
            "youtube_url",
            "rss_feed_url",
            "frequency",
            "publish_day",
            "topics",
            "industries",
            "status",
            "is_featured",
            "episode_count",
            "total_listens",
            "subscriber_count",
            "recent_episodes",
            "created_at",
        ]

    def get_recent_episodes(self, obj):
        episodes = obj.episodes.filter(status="published").order_by("-published_at")[:5]
        return PodcastEpisodeListSerializer(episodes, many=True, context=self.context).data


class PodcastShowMinimalSerializer(serializers.ModelSerializer):
    """Minimal show serializer for nested use."""

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PodcastShow
        fields = ["id", "name", "slug", "cover_image", "cover_image_url", "image_url"]

    def get_image_url(self, obj):
        """Return the best available image URL."""
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return obj.cover_image_url or None


class PodcastEpisodeListSerializer(serializers.ModelSerializer):
    """Serializer for podcast episode listings."""

    show = PodcastShowMinimalSerializer(read_only=True)
    hosts = UserMinimalSerializer(many=True, read_only=True)
    duration_formatted = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PodcastEpisode
        fields = [
            "id",
            "show",
            "title",
            "slug",
            "episode_number",
            "season_number",
            "summary",
            "cover_image",
            "cover_image_url",
            "image_url",
            "hosts",
            "guests",
            "duration_seconds",
            "duration_formatted",
            "status",
            "published_at",
            "is_featured",
            "is_premium",
            "listen_count",
        ]

    def get_image_url(self, obj):
        """Return the best available image URL (episode -> show fallback)."""
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        if obj.cover_image_url:
            return obj.cover_image_url
        # Fall back to show image
        if obj.show:
            if obj.show.cover_image:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.show.cover_image.url)
                return obj.show.cover_image.url
            return obj.show.cover_image_url
        return None


class PodcastEpisodeDetailSerializer(serializers.ModelSerializer):
    """Serializer for full podcast episode details."""

    show = PodcastShowMinimalSerializer(read_only=True)
    hosts = UserMinimalSerializer(many=True, read_only=True)
    topics = TopicMinimalSerializer(many=True, read_only=True)
    industries = IndustryMinimalSerializer(many=True, read_only=True)
    duration_formatted = serializers.CharField(read_only=True)
    related_episodes = serializers.SerializerMethodField()

    class Meta:
        model = PodcastEpisode
        fields = [
            "id",
            "show",
            "title",
            "slug",
            "episode_number",
            "season_number",
            "description",
            "summary",
            "show_notes",
            "transcript",
            "key_topics",
            "audio_file",
            "audio_url",
            "video_url",
            "duration_seconds",
            "duration_formatted",
            "cover_image",
            "hosts",
            "guests",
            "topics",
            "industries",
            "spotify_episode_id",
            "apple_episode_id",
            "status",
            "published_at",
            "is_featured",
            "is_premium",
            "listen_count",
            "completion_rate",
            "meta_title",
            "meta_description",
            "related_episodes",
            "created_at",
            "updated_at",
        ]

    def get_related_episodes(self, obj):
        # Get related episodes from the same show
        related = obj.show.episodes.filter(
            status="published"
        ).exclude(pk=obj.pk).order_by("-published_at")[:4]
        return PodcastEpisodeListSerializer(related, many=True, context=self.context).data


class PodcastEpisodeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating podcast episodes."""

    class Meta:
        model = PodcastEpisode
        fields = [
            "show",
            "title",
            "episode_number",
            "season_number",
            "description",
            "summary",
            "show_notes",
            "transcript",
            "key_topics",
            "audio_file",
            "audio_url",
            "video_url",
            "duration_seconds",
            "cover_image",
            "hosts",
            "guests",
            "topics",
            "industries",
            "related_articles",
            "related_research",
            "spotify_episode_id",
            "apple_episode_id",
            "status",
            "scheduled_for",
            "is_featured",
            "is_premium",
            "meta_title",
            "meta_description",
        ]


class PodcastSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for podcast subscriptions."""

    show = PodcastShowMinimalSerializer(read_only=True)

    class Meta:
        model = PodcastSubscription
        fields = ["id", "show", "notify_new_episodes", "created_at"]
        read_only_fields = ["id", "created_at"]


class EpisodeListenSerializer(serializers.ModelSerializer):
    """Serializer for episode listen tracking."""

    class Meta:
        model = EpisodeListen
        fields = [
            "id",
            "episode",
            "listen_duration_seconds",
            "completion_percentage",
            "platform",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
