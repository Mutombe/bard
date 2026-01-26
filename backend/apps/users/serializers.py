"""
User Serializers

Provides serialization for User and UserProfile models.
"""
from rest_framework import serializers

from apps.markets.serializers import CompanyMinimalSerializer

from .models import User, UserProfile


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


class UserPreferencesSerializer(serializers.Serializer):
    """Serializer for user preferences."""

    notifications = serializers.DictField(required=False)
    display = serializers.DictField(required=False)
    default_exchange = serializers.CharField(required=False)
