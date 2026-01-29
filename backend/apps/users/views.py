"""
User Views

Provides API endpoints for user management.
"""
from datetime import timedelta

from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.markets.models import Company

from .models import User, UserProfile
from .serializers import (
    UserCreateSerializer,
    UserPreferencesSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserUpdateSerializer,
    WatchlistSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.

    Endpoints:
    - GET /users/me/ - Get current user profile
    - PATCH /users/me/ - Update current user profile
    - POST /users/me/watchlist/ - Add to watchlist
    - DELETE /users/me/watchlist/{company_id}/ - Remove from watchlist
    - GET /users/me/watchlist/ - Get watchlist
    - PATCH /users/me/preferences/ - Update preferences
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        """Get or update the current user's profile."""
        user = request.user

        if request.method == "PATCH":
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        serializer = UserSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=["get", "patch"], url_path="me/profile")
    def profile(self, request):
        """Get or update the current user's extended profile."""
        profile = request.user.profile

        if request.method == "PATCH":
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=["get", "post"], url_path="me/watchlist")
    def watchlist(self, request):
        """Get or add to the user's watchlist."""
        profile = request.user.profile

        if request.method == "POST":
            serializer = WatchlistSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            company = get_object_or_404(Company, id=serializer.validated_data["company_id"])
            profile.add_to_watchlist(company)

            return Response(
                {"message": f"Added {company.symbol} to watchlist"},
                status=status.HTTP_201_CREATED,
            )

        # GET - return watchlist
        from apps.markets.serializers import CompanyMinimalSerializer

        watchlist = profile.watchlist.all()
        serializer = CompanyMinimalSerializer(watchlist, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["delete"],
        url_path=r"me/watchlist/(?P<company_id>[^/.]+)",
    )
    def remove_from_watchlist(self, request, company_id=None):
        """Remove a company from the user's watchlist."""
        profile = request.user.profile
        company = get_object_or_404(Company, id=company_id)

        if not profile.is_watching(company):
            return Response(
                {"error": "Company not in watchlist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.remove_from_watchlist(company)
        return Response(
            {"message": f"Removed {company.symbol} from watchlist"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path="me/preferences")
    def preferences(self, request):
        """Update user preferences."""
        serializer = UserPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = request.user.profile
        for key, value in serializer.validated_data.items():
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    profile.set_preference(f"{key}.{sub_key}", sub_value)
            else:
                profile.set_preference(key, value)

        return Response({"preferences": profile.preferences})

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get user statistics (admin only)."""
        user = request.user
        # Check if user is admin/editor
        if not (user.is_staff or (hasattr(user, "role") and user.role in ["super_admin", "editor"])):
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.now().date()

        total_users = User.objects.count()
        premium_users = User.objects.filter(
            subscription_tier__in=["basic", "professional", "enterprise"]
        ).count()
        admin_count = User.objects.filter(
            role__in=["super_admin", "editor", "analyst"]
        ).count()
        new_today = User.objects.filter(date_joined__date=today).count()

        return Response({
            "total_users": total_users,
            "premium_users": premium_users,
            "admin_count": admin_count,
            "new_today": new_today,
        })


class UserRegistrationView(viewsets.GenericViewSet):
    """ViewSet for user registration."""

    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"])
    def register(self, request):
        """Register a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "Registration successful. Please verify your email.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
