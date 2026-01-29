"""
Authentication Views

JWT authentication and password management endpoints.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
)

User = get_user_model()

# Google OAuth Client ID
GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that returns user info along with tokens.
    """

    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    Logout view that blacklists the refresh token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ChangePasswordView(APIView):
    """
    Change password for authenticated users.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"message": "Password changed successfully"},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """
    Request a password reset email.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        # Always return success to prevent email enumeration
        # The actual email is sent only if the user exists
        try:
            user = User.objects.get(email=email)
            # TODO: Send password reset email with token
            # send_password_reset_email.delay(user.id)
        except User.DoesNotExist:
            pass

        return Response(
            {"message": "If an account exists with this email, a reset link has been sent"},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # TODO: Verify token and reset password
        # token = serializer.validated_data["token"]
        # new_password = serializer.validated_data["new_password"]

        return Response(
            {"message": "Password has been reset successfully"},
            status=status.HTTP_200_OK,
        )


class GoogleOAuthView(APIView):
    """
    Handle Google OAuth authentication.

    Receives a Google ID token from the frontend, verifies it,
    and returns JWT tokens for the authenticated user.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        credential = request.data.get("credential")

        if not credential:
            return Response(
                {"error": "Google credential is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not GOOGLE_CLIENT_ID:
            return Response(
                {"error": "Google OAuth is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )

            # Get user info from the verified token
            email = idinfo.get("email")
            email_verified = idinfo.get("email_verified", False)
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            picture = idinfo.get("picture", "")

            if not email:
                return Response(
                    {"error": "Email not provided by Google"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not email_verified:
                return Response(
                    {"error": "Google email not verified"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_email_verified": True,
                }
            )

            # Update user info if they already exist
            if not created:
                if not user.first_name and first_name:
                    user.first_name = first_name
                if not user.last_name and last_name:
                    user.last_name = last_name
                if not user.is_email_verified:
                    user.is_email_verified = True
                user.save()

            # Update profile picture if available
            if picture and hasattr(user, 'profile'):
                profile = user.profile
                if not profile.avatar:
                    profile.avatar = picture
                    profile.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            })

        except ValueError as e:
            # Invalid token
            return Response(
                {"error": f"Invalid Google token: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Authentication failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
