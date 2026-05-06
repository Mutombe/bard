"""
User Serializers

Provides serialization for User and UserProfile models.
"""
from rest_framework import serializers

from apps.markets.serializers import CompanyMinimalSerializer

from .models import User, UserProfile, Writer


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user serializer for references."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "role"]


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile."""

    watchlist = CompanyMinimalSerializer(many=True, read_only=True)
    watchlist_ids = serializers.PrimaryKeyRelatedField(
        queryset="markets.Company",
        many=True,
        write_only=True,
        source="watchlist",
        required=False,
    )

    class Meta:
        model = UserProfile
        fields = [
            "avatar",
            "bio",
            "company",
            "job_title",
            "phone",
            "country",
            "timezone",
            "watchlist",
            "watchlist_ids",
            "preferences",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "subscription_tier",
            "is_active",
            "email_verified",
            "date_joined",
            "profile",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "subscription_tier",
            "is_active",
            "email_verified",
            "date_joined",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = User
        fields = ["first_name", "last_name"]


class WatchlistSerializer(serializers.Serializer):
    """Serializer for watchlist operations."""

    company_id = serializers.UUIDField()


class WriterSerializer(serializers.ModelSerializer):
    """Full writer serializer for CRUD operations."""

    avatar_display = serializers.SerializerMethodField()
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Writer
        fields = [
            "id",
            "full_name",
            "slug",
            "email",
            "email_public",
            "bio",
            "title",
            "organization",
            "avatar",
            "avatar_url",
            "avatar_display",
            "twitter",
            "linkedin",
            "is_active",
            "user",
            "article_count",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "created_at"]

    def get_avatar_display(self, obj):
        if obj.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return obj.avatar_url or None

    def get_article_count(self, obj):
        return obj.articles.count()


class WriterMinimalSerializer(serializers.ModelSerializer):
    """Minimal writer serializer for article references.

    Used in article list payloads (cards, search results) where we want
    the byline credit but not the full bio. Email is intentionally NOT
    here — for the bio + email + LinkedIn shown at the foot of the
    article detail page, use WriterBylineSerializer below.
    """

    avatar_display = serializers.SerializerMethodField()

    class Meta:
        model = Writer
        fields = ["id", "full_name", "slug", "title", "organization", "avatar_display"]

    def get_avatar_display(self, obj):
        if obj.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return obj.avatar_url or None


class WriterBylineSerializer(serializers.ModelSerializer):
    """
    Expanded writer payload for the article-foot byline component.

    Includes the bio, social handles, and (only when email_public=True)
    the contact email. This is what powers the "About the author" card
    on /news/[slug] under the article body — fostering direct
    engagement between investors and BGFI analysts (proposal 3c).
    """

    avatar_display = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Writer
        fields = [
            "id",
            "full_name",
            "slug",
            "title",
            "organization",
            "bio",
            "avatar_display",
            "linkedin",
            "twitter",
            "email",
        ]

    def get_avatar_display(self, obj):
        if obj.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return obj.avatar_url or None

    def get_email(self, obj):
        # Honor the writer's privacy preference. email_public=False (the
        # default) keeps the email out of the public API entirely.
        return obj.email if obj.email_public and obj.email else None


class UserPreferencesSerializer(serializers.Serializer):
    """Serializer for user preferences."""

    notifications = serializers.DictField(required=False)
    display = serializers.DictField(required=False)
    default_exchange = serializers.CharField(required=False)
