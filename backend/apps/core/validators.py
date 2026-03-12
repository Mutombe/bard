"""
Input Validation Utilities

Provides validators for common input types to prevent injection attacks
and ensure data integrity.
"""
import re
from typing import Any, Optional

from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator, URLValidator
from rest_framework import serializers


class SafeStringValidator:
    """
    Validate strings to prevent XSS and injection attacks.

    - Strips dangerous HTML tags
    - Limits string length
    - Validates character set
    """

    # Patterns that might indicate XSS attempts
    XSS_PATTERNS = [
        r"<script[^>]*>",
        r"javascript:",
        r"on\w+\s*=",
        r"data:\s*text/html",
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
    ]

    def __init__(
        self,
        max_length: int = 10000,
        allow_html: bool = False,
        message: str = "Invalid input detected",
    ):
        self.max_length = max_length
        self.allow_html = allow_html
        self.message = message
        self.xss_regex = re.compile("|".join(self.XSS_PATTERNS), re.IGNORECASE)

    def __call__(self, value: str) -> str:
        if not isinstance(value, str):
            raise ValidationError("Value must be a string")

        if len(value) > self.max_length:
            raise ValidationError(f"Value exceeds maximum length of {self.max_length}")

        # Check for XSS patterns
        if self.xss_regex.search(value):
            raise ValidationError(self.message)

        return value


class SlugValidator:
    """Validate URL-safe slugs."""

    SLUG_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

    def __init__(self, max_length: int = 100):
        self.max_length = max_length

    def __call__(self, value: str) -> str:
        if not isinstance(value, str):
            raise ValidationError("Slug must be a string")

        if len(value) > self.max_length:
            raise ValidationError(f"Slug exceeds maximum length of {self.max_length}")

        if not self.SLUG_REGEX.match(value):
            raise ValidationError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            )

        return value


class SymbolValidator:
    """Validate stock/market symbols."""

    SYMBOL_REGEX = re.compile(r"^[A-Z0-9]{1,10}$")

    def __call__(self, value: str) -> str:
        if not isinstance(value, str):
            raise ValidationError("Symbol must be a string")

        value = value.upper().strip()

        if not self.SYMBOL_REGEX.match(value):
            raise ValidationError(
                "Symbol must be 1-10 uppercase alphanumeric characters"
            )

        return value


class PriceValidator:
    """Validate price/monetary values."""

    def __init__(self, min_value: float = 0, max_value: float = 1e12):
        self.min_value = min_value
        self.max_value = max_value

    def __call__(self, value: Any) -> float:
        try:
            value = float(value)
        except (TypeError, ValueError):
            raise ValidationError("Price must be a number")

        if value < self.min_value:
            raise ValidationError(f"Price must be at least {self.min_value}")

        if value > self.max_value:
            raise ValidationError(f"Price must not exceed {self.max_value}")

        return value


class PaginationValidator:
    """Validate pagination parameters."""

    def __init__(
        self,
        max_page_size: int = 100,
        default_page_size: int = 20,
    ):
        self.max_page_size = max_page_size
        self.default_page_size = default_page_size

    def validate_page(self, value: Any) -> int:
        try:
            page = int(value)
        except (TypeError, ValueError):
            return 1

        return max(1, page)

    def validate_page_size(self, value: Any) -> int:
        try:
            size = int(value)
        except (TypeError, ValueError):
            return self.default_page_size

        return min(max(1, size), self.max_page_size)


# Serializer field validators
class SafeCharField(serializers.CharField):
    """CharField with XSS protection."""

    def __init__(self, **kwargs):
        self.safe_validator = SafeStringValidator(
            max_length=kwargs.get("max_length", 10000),
            allow_html=kwargs.pop("allow_html", False),
        )
        super().__init__(**kwargs)
        self.validators.append(self.safe_validator)


class SafeSlugField(serializers.SlugField):
    """SlugField with additional validation."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validators.append(SlugValidator(max_length=kwargs.get("max_length", 100)))


# Utility functions
def sanitize_html(value: str, allowed_tags: Optional[list] = None) -> str:
    """
    Sanitize HTML content by removing dangerous tags.

    Args:
        value: HTML string to sanitize
        allowed_tags: List of allowed tag names (default: basic formatting)

    Returns:
        Sanitized HTML string
    """
    import bleach

    if allowed_tags is None:
        allowed_tags = [
            "p", "br", "strong", "em", "u", "s",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li",
            "a", "blockquote", "code", "pre",
        ]

    allowed_attrs = {
        "a": ["href", "title", "target"],
        "*": ["class"],
    }

    return bleach.clean(
        value,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True,
    )


def validate_search_query(query: str, max_length: int = 200) -> str:
    """
    Validate and sanitize search queries.

    Args:
        query: Search query string
        max_length: Maximum allowed length

    Returns:
        Sanitized query string
    """
    if not query:
        return ""

    # Truncate to max length
    query = query[:max_length]

    # Remove potentially dangerous characters
    query = re.sub(r"[<>\"';\\]", "", query)

    # Collapse multiple spaces
    query = re.sub(r"\s+", " ", query).strip()

    return query
