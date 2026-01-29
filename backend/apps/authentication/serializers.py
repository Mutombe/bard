"""
Authentication Serializers
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user info in auth responses."""

    full_name = serializers.CharField(read_only=True)

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
            "is_staff",
            "is_superuser",
            "is_active",
            "email_verified",
            "date_joined",
        ]
        read_only_fields = fields


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user info in response.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user info to response
        data["user"] = {
            "id": str(self.user.id),
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "full_name": self.user.full_name,
            "role": self.user.role,
            "subscription_tier": self.user.subscription_tier,
            "is_staff": self.user.is_staff,
            "is_superuser": self.user.is_superuser,
            "is_active": self.user.is_active,
            "email_verified": self.user.email_verified,
            "date_joined": self.user.date_joined.isoformat() if self.user.date_joined else None,
        }

        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["email"] = user.email
        token["role"] = user.role
        token["subscription_tier"] = user.subscription_tier

        return token


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=10)
    new_password_confirm = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match"}
            )
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""

    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""

    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=10)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match"}
            )
        return attrs
