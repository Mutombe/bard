"""
Core Views - Health checks and system endpoints
"""
from django.db import connection
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    Basic health check endpoint.
    Returns 200 if the service is running.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(
            {
                "status": "healthy",
                "service": "Bard Santner Journal API",
                "version": "1.0.0",
            },
            status=status.HTTP_200_OK,
        )


class ReadinessCheckView(APIView):
    """
    Readiness check endpoint.
    Verifies database and cache connectivity.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

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
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _check_cache(self):
        try:
            cache.set("health_check", "ok", timeout=1)
            result = cache.get("health_check")
            if result == "ok":
                return {"status": "ok"}
            return {"status": "error", "message": "Cache read mismatch"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
