"""
Media Serializers
"""
from rest_framework import serializers

from .models import Video, VideoCategory, PodcastShow, PodcastEpisode, YouTubeChannel, MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    """Serializer for MediaFile model."""
    url = serializers.SerializerMethodField()
    size_display = serializers.CharField(read_only=True)
    dimensions = serializers.CharField(read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True)

    class Meta:
        model = MediaFile
        fields = [
            "id",
            "name",
            "file",
            "url",
            "file_type",
            "mime_type",
            "size",
            "size_display",
            "width",
            "height",
            "dimensions",
            "alt_text",
            "caption",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "url", "size", "mime_type", "width", "height", "uploaded_by", "created_at", "updated_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.url


class MediaFileUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading media files."""

    class Meta:
        model = MediaFile
        fields = ["file", "name", "alt_text", "caption", "file_type"]

    def create(self, validated_data):
        file = validated_data.get("file")
        if file:
            # Auto-detect file type from mime type
            mime_type = file.content_type
            validated_data["mime_type"] = mime_type
            validated_data["size"] = file.size

            if mime_type.startswith("image/"):
                validated_data["file_type"] = "image"
                # Get image dimensions
                try:
                    from PIL import Image
                    img = Image.open(file)
                    validated_data["width"], validated_data["height"] = img.size
                    file.seek(0)  # Reset file pointer
                except Exception:
                    pass
            elif mime_type.startswith("video/"):
                validated_data["file_type"] = "video"
            elif mime_type.startswith("audio/"):
                validated_data["file_type"] = "audio"
            elif mime_type in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
                validated_data["file_type"] = "document"

            if not validated_data.get("name"):
                validated_data["name"] = file.name

        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)


class VideoCategorySerializer(serializers.ModelSerializer):
    video_count = serializers.SerializerMethodField()

    class Meta:
        model = VideoCategory
        fields = ["id", "name", "slug", "description", "video_count"]

    def get_video_count(self, obj):
        return obj.videos.filter(status="published").count()


class VideoSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    embed_url = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "platform",
            "video_id",
            "video_url",
            "embed_url",
            "thumbnail_url",
            "duration",
            "duration_seconds",
            "duration_formatted",
            "channel_id",
            "channel_title",
            "published_at",
            "view_count",
            "like_count",
            "comment_count",
            "category",
            "category_name",
            "author",
            "author_name",
            "status",
            "is_featured",
            "tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_embed_url(self, obj):
        return obj.get_embed_url()

    def get_duration_formatted(self, obj):
        if obj.duration_seconds:
            hours, remainder = divmod(obj.duration_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return obj.duration


class VideoListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    category_name = serializers.CharField(source="category.name", read_only=True)
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "slug",
            "platform",
            "video_id",
            "thumbnail_url",
            "duration_seconds",
            "duration_formatted",
            "channel_title",
            "published_at",
            "view_count",
            "category_name",
            "is_featured",
        ]

    def get_duration_formatted(self, obj):
        if obj.duration_seconds:
            hours, remainder = divmod(obj.duration_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return ""


class PodcastShowSerializer(serializers.ModelSerializer):
    episode_count = serializers.SerializerMethodField()

    class Meta:
        model = PodcastShow
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "cover_image",
            "cover_url",
            "spotify_url",
            "apple_podcasts_url",
            "youtube_playlist_id",
            "rss_feed",
            "is_active",
            "episode_count",
            "created_at",
        ]

    def get_episode_count(self, obj):
        return obj.episodes.filter(status="published").count()


class PodcastEpisodeSerializer(serializers.ModelSerializer):
    show_name = serializers.CharField(source="show.name", read_only=True)
    show_slug = serializers.CharField(source="show.slug", read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    embed_url = serializers.SerializerMethodField()

    class Meta:
        model = PodcastEpisode
        fields = [
            "id",
            "show",
            "show_name",
            "show_slug",
            "title",
            "slug",
            "description",
            "season",
            "episode_number",
            "platform",
            "video_id",
            "audio_url",
            "thumbnail_url",
            "duration",
            "duration_seconds",
            "duration_formatted",
            "published_at",
            "view_count",
            "like_count",
            "status",
            "is_featured",
            "guests",
            "embed_url",
            "created_at",
        ]

    def get_duration_formatted(self, obj):
        if obj.duration_seconds:
            hours, remainder = divmod(obj.duration_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return ""

    def get_embed_url(self, obj):
        if obj.platform == "youtube" and obj.video_id:
            return f"https://www.youtube.com/embed/{obj.video_id}"
        return ""


class PodcastEpisodeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    show_name = serializers.CharField(source="show.name", read_only=True)
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = PodcastEpisode
        fields = [
            "id",
            "show",
            "show_name",
            "title",
            "slug",
            "thumbnail_url",
            "duration_seconds",
            "duration_formatted",
            "published_at",
            "view_count",
            "is_featured",
            "guests",
        ]

    def get_duration_formatted(self, obj):
        if obj.duration_seconds:
            hours, remainder = divmod(obj.duration_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return ""


class YouTubeChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = YouTubeChannel
        fields = [
            "id",
            "channel_id",
            "channel_name",
            "channel_url",
            "thumbnail_url",
            "description",
            "subscriber_count",
            "video_count",
            "auto_sync",
            "sync_as_video",
            "sync_as_podcast",
            "podcast_show",
            "last_synced",
        ]


class YouTubeVideoSerializer(serializers.Serializer):
    """Serializer for YouTube API response data (not stored in DB)"""
    video_id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    channel_id = serializers.CharField()
    channel_title = serializers.CharField()
    published_at = serializers.DateTimeField(allow_null=True)
    thumbnail_url = serializers.URLField(allow_blank=True)
    duration = serializers.CharField()
    duration_seconds = serializers.IntegerField()
    duration_formatted = serializers.CharField()
    view_count = serializers.IntegerField()
    like_count = serializers.IntegerField()
    comment_count = serializers.IntegerField()
    tags = serializers.ListField(child=serializers.CharField())
    video_url = serializers.URLField()
    embed_url = serializers.URLField()
