"""
Authentication Views

JWT authentication and password management endpoints.
"""
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
)

User = get_user_model()


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
