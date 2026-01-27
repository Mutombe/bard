"""
Core Views - Health checks and system endpoints
"""
import logging
from django.db import connection, OperationalError
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    Basic health check endpoint.
    Returns 200 if the service is running.
    Used by Render for health checks.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []  # No throttling on health checks

    def get(self, request):
        return Response(
            {
                "status": "healthy",
                "service": "Bardiq Journal API",
                "version": "1.0.0",
            },
            status=status.HTTP_200_OK,
        )


class ReadinessCheckView(APIView):
    """
    Readiness check endpoint.
    Verifies database and cache connectivity.
    More thorough than health check.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        checks = {
            "database": self._check_database(),
            "cache": self._check_cache(),
        }

        all_healthy = all(check["status"] == "ok" for check in checks.values())

        return Response(
            {
                "status": "ready" if all_healthy else "degraded",
                "checks": checks,
            },
            status=status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    def _check_database(self):
        """Check database connectivity with retry logic."""
        try:
            # Close stale connections first
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            return {"status": "ok"}
        except OperationalError as e:
            logger.warning(f"Database health check failed: {e}")
            # Try to reconnect
            try:
                connection.close()
                connection.ensure_connection()
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                return {"status": "ok", "note": "reconnected"}
            except Exception as retry_error:
                logger.error(f"Database reconnection failed: {retry_error}")
                return {"status": "error", "message": str(retry_error)}
        except Exception as e:
            logger.error(f"Database health check error: {e}")
            return {"status": "error", "message": str(e)}

    def _check_cache(self):
        """Check cache connectivity - graceful degradation if unavailable."""
        try:
            cache.set("health_check", "ok", timeout=5)
            result = cache.get("health_check")
            if result == "ok":
                return {"status": "ok"}
            return {"status": "degraded", "message": "Cache read mismatch"}
        except Exception as e:
            # Cache failures are non-critical - app can work without cache
            logger.warning(f"Cache health check failed: {e}")
            return {"status": "degraded", "message": "Cache unavailable (non-critical)"}


class WarmupView(APIView):
    """
    Warmup endpoint to keep the service active.
    Can be called by external cron jobs to prevent cold starts.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        # Touch the database to keep connection warm
        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as e:
            logger.warning(f"Warmup database touch failed: {e}")

        return Response(
            {"status": "warm", "message": "Service is active"},
            status=status.HTTP_200_OK,
        )
