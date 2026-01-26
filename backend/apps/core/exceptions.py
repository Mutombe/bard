"""
Custom Exception Handling

Provides consistent error response format across the API.
"""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format.

    Response format:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {...}  # Optional additional context
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_code = getattr(exc, "default_code", "error")
        error_message = str(exc.detail) if hasattr(exc, "detail") else str(exc)

        response.data = {
            "error": {
                "code": error_code.upper().replace(" ", "_"),
                "message": error_message,
                "status_code": response.status_code,
            }
        }

        # Add field-level errors for validation errors
        if hasattr(exc, "detail") and isinstance(exc.detail, dict):
            response.data["error"]["details"] = exc.detail

    return response


class MarketDataUnavailable(APIException):
    """Raised when market data cannot be retrieved."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Market data is temporarily unavailable. Please try again later."
    default_code = "market_data_unavailable"


class ExchangeClosed(APIException):
    """Raised when trying to access real-time data while exchange is closed."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The exchange is currently closed. Historical data is available."
    default_code = "exchange_closed"


class RateLimitExceeded(APIException):
    """Raised when API rate limit is exceeded."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Rate limit exceeded. Please slow down your requests."
    default_code = "rate_limit_exceeded"


class SubscriptionRequired(APIException):
    """Raised when accessing premium features without subscription."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This feature requires a premium subscription."
    default_code = "subscription_required"


class InvalidTickerSymbol(APIException):
    """Raised when an invalid ticker symbol is provided."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid ticker symbol provided."
    default_code = "invalid_ticker"
