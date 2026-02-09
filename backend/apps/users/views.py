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

    # =========================
    # Author Following
    # =========================

    @action(detail=False, methods=["get"], url_path="me/following")
    def following(self, request):
        """Get the list of authors the user is following."""
        profile = request.user.profile
        followed_authors = profile.followed_authors.all()

        authors_data = [
            {
                "id": str(author.id),
                "full_name": author.full_name,
                "email": author.email,
                "avatar": author.profile.avatar.url if author.profile.avatar else None,
            }
            for author in followed_authors
        ]
        return Response(authors_data)

    @action(detail=False, methods=["post"], url_path=r"me/follow/(?P<author_id>[^/.]+)")
    def follow_author(self, request, author_id=None):
        """Follow an author."""
        profile = request.user.profile
        author = get_object_or_404(User, id=author_id)

        if author == request.user:
            return Response(
                {"error": "You cannot follow yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.is_following(author):
            return Response(
                {"is_following": True, "message": "Already following"},
                status=status.HTTP_200_OK,
            )

        profile.follow_author(author)
        return Response(
            {"is_following": True, "message": f"Now following {author.full_name}"},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["delete"], url_path=r"me/follow/(?P<author_id>[^/.]+)")
    def unfollow_author(self, request, author_id=None):
        """Unfollow an author."""
        profile = request.user.profile
        author = get_object_or_404(User, id=author_id)

        if not profile.is_following(author):
            return Response(
                {"is_following": False, "message": "Not following"},
                status=status.HTTP_200_OK,
            )

        profile.unfollow_author(author)
        return Response(
            {"is_following": False, "message": f"Unfollowed {author.full_name}"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path=r"me/following/(?P<author_id>[^/.]+)")
    def check_following(self, request, author_id=None):
        """Check if the user is following an author."""
        profile = request.user.profile
        author = get_object_or_404(User, id=author_id)

        return Response({
            "is_following": profile.is_following(author),
            "author_id": str(author.id),
            "author_name": author.full_name,
        })

    @action(detail=False, methods=["post"], url_path="me/avatar")
    def upload_avatar(self, request):
        """Upload a new avatar image."""
        if "avatar" not in request.FILES:
            return Response(
                {"error": "No avatar file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        avatar_file = request.FILES["avatar"]

        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if avatar_file.content_type not in allowed_types:
            return Response(
                {"error": "Invalid file type. Allowed: JPG, PNG, GIF, WebP"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024
        if avatar_file.size > max_size:
            return Response(
                {"error": "File too large. Maximum size is 5MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = request.user.profile
        profile.avatar = avatar_file
        profile.save(update_fields=["avatar"])

        # Return the URL of the uploaded avatar
        avatar_url = profile.avatar.url if profile.avatar else None
        return Response({"avatar": avatar_url})

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get user statistics (admin only)."""
        user = request.user
        # Check if user is admin/editor using the model property
        is_editor = getattr(user, "is_editor", False)
        if not (user.is_staff or is_editor):
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
