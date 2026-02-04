"""
Podcast API Views
"""
from django.db.models import Sum
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import PodcastShow, PodcastEpisode, EpisodeListen, PodcastSubscription
from .serializers import (
    PodcastShowListSerializer,
    PodcastShowDetailSerializer,
    PodcastEpisodeListSerializer,
    PodcastEpisodeDetailSerializer,
    PodcastEpisodeCreateSerializer,
    PodcastSubscriptionSerializer,
    EpisodeListenSerializer,
)


class PodcastShowViewSet(viewsets.ModelViewSet):
    """
    API endpoint for podcast shows.

    list: Get all active podcast shows
    retrieve: Get show details with recent episodes
    featured: Get featured shows
    subscribe: Subscribe to a show
    """

    queryset = PodcastShow.objects.prefetch_related("hosts", "topics", "industries")
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "is_featured"]
    search_fields = ["name", "description", "tagline"]
    ordering_fields = ["name", "total_listens", "created_at"]
    ordering = ["-is_featured", "name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Non-staff users only see active shows
        if not self.request.user.is_staff:
            queryset = queryset.filter(status="active")
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return PodcastShowListSerializer
        return PodcastShowDetailSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        if self.action in ["subscribe", "unsubscribe"]:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured podcast shows."""
        featured = self.get_queryset().filter(is_featured=True, status="active")[:6]
        serializer = PodcastShowListSerializer(featured, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def subscribe(self, request, slug=None):
        """Subscribe to a podcast show."""
        show = self.get_object()
        subscription, created = PodcastSubscription.objects.get_or_create(
            user=request.user,
            show=show,
            defaults={"notify_new_episodes": True}
        )
        if not created:
            return Response(
                {"message": "Already subscribed to this show"},
                status=status.HTTP_200_OK
            )
        # Update subscriber count
        PodcastShow.objects.filter(pk=show.pk).update(
            subscriber_count=show.subscriber_count + 1
        )
        return Response(
            {"message": "Successfully subscribed"},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"])
    def unsubscribe(self, request, slug=None):
        """Unsubscribe from a podcast show."""
        show = self.get_object()
        deleted, _ = PodcastSubscription.objects.filter(
            user=request.user,
            show=show
        ).delete()
        if deleted:
            # Update subscriber count
            PodcastShow.objects.filter(pk=show.pk).update(
                subscriber_count=max(0, show.subscriber_count - 1)
            )
            return Response({"message": "Successfully unsubscribed"})
        return Response(
            {"message": "Not subscribed to this show"},
            status=status.HTTP_400_BAD_REQUEST
        )


class PodcastEpisodeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for podcast episodes.

    list: Get all published episodes
    retrieve: Get episode details
    featured: Get featured episodes
    listen: Track episode listen
    """

    queryset = PodcastEpisode.objects.select_related("show").prefetch_related(
        "hosts", "topics", "industries"
    )
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "is_featured", "is_premium"]
    search_fields = ["title", "description", "show_notes"]
    ordering_fields = ["published_at", "listen_count", "created_at"]
    ordering = ["-published_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Non-staff users only see published episodes
        if not self.request.user.is_staff:
            queryset = queryset.filter(status="published")

        # Filter by show
        show = self.request.query_params.get("show")
        if show:
            queryset = queryset.filter(show__slug=show)

        # Filter by topic
        topic = self.request.query_params.get("topic")
        if topic:
            queryset = queryset.filter(topics__slug=topic)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return PodcastEpisodeListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return PodcastEpisodeCreateSerializer
        return PodcastEpisodeDetailSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured podcast episodes."""
        featured = self.get_queryset().filter(is_featured=True, status="published")[:6]
        serializer = PodcastEpisodeListSerializer(featured, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def latest(self, request):
        """Get latest podcast episodes across all shows."""
        latest = self.get_queryset().filter(status="published").order_by("-published_at")[:10]
        serializer = PodcastEpisodeListSerializer(latest, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def listen(self, request, slug=None):
        """Track episode listen."""
        episode = self.get_object()

        # Create listen record
        listen_data = {
            "episode": episode.id,
            "listen_duration_seconds": request.data.get("duration", 0),
            "completion_percentage": request.data.get("completion", 0),
            "platform": request.data.get("platform", "web"),
        }

        # Track the listen
        EpisodeListen.objects.create(
            episode=episode,
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key or "",
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            listen_duration_seconds=listen_data["listen_duration_seconds"],
            completion_percentage=listen_data["completion_percentage"],
            platform=listen_data["platform"],
        )

        # Increment listen count
        episode.increment_listen_count()

        return Response({"message": "Listen tracked"})

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR")

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get podcast statistics for admin dashboard."""
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )

        total_shows = PodcastShow.objects.count()
        active_shows = PodcastShow.objects.filter(status="active").count()
        total_episodes = PodcastEpisode.objects.count()
        published_episodes = PodcastEpisode.objects.filter(status="published").count()

        # This week
        from django.utils import timezone
        from datetime import timedelta
        week_ago = timezone.now() - timedelta(days=7)
        new_this_week = PodcastEpisode.objects.filter(
            status="published",
            published_at__gte=week_ago
        ).count()

        # Total listens
        total_listens = PodcastShow.objects.aggregate(
            total=Sum("total_listens")
        )["total"] or 0

        return Response({
            "total_shows": total_shows,
            "active_shows": active_shows,
            "total_episodes": total_episodes,
            "published_episodes": published_episodes,
            "new_this_week": new_this_week,
            "total_listens": total_listens,
        })


class PodcastSubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user's podcast subscriptions.
    """

    serializer_class = PodcastSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PodcastSubscription.objects.filter(
            user=self.request.user
        ).select_related("show")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
