"""
Security and Performance Middleware

Provides:
- Security headers
- Request/response logging
- Performance monitoring
- Rate limiting helpers
"""
import logging
import time
import uuid
from typing import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses.

    Headers added:
    - X-Content-Type-Options: Prevent MIME sniffing
    - X-Frame-Options: Prevent clickjacking
    - X-XSS-Protection: Enable XSS filter
    - Referrer-Policy: Control referrer information
    - Permissions-Policy: Restrict browser features
    - Content-Security-Policy: Prevent XSS and injection attacks
    """

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        # Prevent MIME type sniffing
        response["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking - allow framing from same origin only
        response["X-Frame-Options"] = "SAMEORIGIN"

        # Enable XSS filter in older browsers
        response["X-XSS-Protection"] = "1; mode=block"

        # Control referrer information
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict browser features
        response["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )

        # Content Security Policy (relaxed for API responses)
        if not request.path.startswith("/api/"):
            response["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' https://fonts.gstatic.com; "
                "connect-src 'self' https://api.unsplash.com https://api.polygon.io; "
                "frame-ancestors 'self';"
            )

        # HSTS - only in production
        if not settings.DEBUG:
            response["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all requests with timing information.

    Useful for debugging and performance monitoring.
    """

    def process_request(self, request: HttpRequest) -> None:
        # Generate unique request ID
        request.request_id = str(uuid.uuid4())[:8]
        request.start_time = time.time()

        # Log request
        if settings.DEBUG:
            logger.info(
                f"[{request.request_id}] {request.method} {request.path} "
                f"- User: {getattr(request.user, 'email', 'anonymous')}"
            )

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        # Calculate request duration
        if hasattr(request, "start_time"):
            duration = (time.time() - request.start_time) * 1000  # ms
            response["X-Request-ID"] = getattr(request, "request_id", "unknown")
            response["X-Response-Time"] = f"{duration:.2f}ms"

            # Log slow requests
            if duration > 1000:  # > 1 second
                logger.warning(
                    f"[{request.request_id}] Slow request: {request.method} {request.path} "
                    f"took {duration:.2f}ms"
                )
            elif settings.DEBUG:
                logger.info(
                    f"[{request.request_id}] {response.status_code} - {duration:.2f}ms"
                )

        return response


class APIVersionMiddleware(MiddlewareMixin):
    """
    Handle API versioning through headers or URL prefix.

    Supports:
    - URL prefix: /api/v1/...
    - Header: Accept: application/vnd.bardiq.v1+json
    """

    def process_request(self, request: HttpRequest) -> None:
        # Default to v1
        request.api_version = "v1"

        # Check URL prefix
        if "/api/v2/" in request.path:
            request.api_version = "v2"
        elif "/api/v1/" in request.path:
            request.api_version = "v1"

        # Check Accept header for versioning
        accept_header = request.headers.get("Accept", "")
        if "vnd.bardiq.v2" in accept_header:
            request.api_version = "v2"


class MaintenanceModeMiddleware(MiddlewareMixin):
    """
    Enable maintenance mode to block all requests except from admins.

    Set MAINTENANCE_MODE=True in settings to enable.
    """

    def process_request(self, request: HttpRequest) -> HttpResponse | None:
        if not getattr(settings, "MAINTENANCE_MODE", False):
            return None

        # Allow admin access
        if request.path.startswith("/admin/"):
            return None

        # Allow health checks
        if request.path in ["/health/", "/api/health/"]:
            return None

        # Allow authenticated staff
        if hasattr(request, "user") and request.user.is_authenticated:
            if request.user.is_staff:
                return None

        return JsonResponse(
            {
                "error": "maintenance",
                "message": "The service is currently under maintenance. Please try again later.",
            },
            status=503,
        )


class CORSDebugMiddleware(MiddlewareMixin):
    """
    Debug CORS issues in development.

    Logs CORS-related headers and requests.
    """

    def process_request(self, request: HttpRequest) -> None:
        if settings.DEBUG and request.method == "OPTIONS":
            origin = request.headers.get("Origin", "unknown")
            logger.info(f"CORS Preflight from: {origin} for {request.path}")

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        if settings.DEBUG:
            origin = request.headers.get("Origin")
            if origin:
                logger.debug(
                    f"CORS Response - Origin: {origin}, "
                    f"Allow-Origin: {response.get('Access-Control-Allow-Origin', 'not set')}"
                )
        return response
