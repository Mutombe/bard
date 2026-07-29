"""
Core Models - Base classes and mixins for all models

Provides:
- TimeStampedModel: Automatic created_at/updated_at fields
- UUIDModel: UUID primary key for better security
- SoftDeleteModel: Soft deletion support
"""
import uuid

from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """
    Abstract base class that provides self-updating
    'created_at' and 'updated_at' fields.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the record was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last updated",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class UUIDModel(models.Model):
    """
    Abstract base class that uses UUID as primary key.
    Better for API exposure and distributed systems.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the record",
    )

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """Manager that filters out soft-deleted records by default."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

    def with_deleted(self):
        """Include soft-deleted records in the queryset."""
        return super().get_queryset()

    def deleted_only(self):
        """Return only soft-deleted records."""
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    """
    Abstract base class that provides soft deletion.
    Records are marked as deleted but not removed from the database.
    """

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Timestamp when the record was soft-deleted",
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False, hard=False):
        """Soft delete by default, hard delete if specified."""
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    @property
    def is_deleted(self):
        """Check if the record is soft-deleted."""
        return self.deleted_at is not None


class BaseModel(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Combined base model with UUID, timestamps, and soft deletion.
    Use this as the base for most models in the application.
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]


def _generate_partner_key():
    import secrets
    return f"bgfi_live_{secrets.token_hex(20)}"


class PartnerApiKey(TimeStampedModel):
    """
    API key for external partners consuming BGFI content (e.g. the
    Bard Santner bank website embedding the latest-articles feed).
    Keys gate the read-only partner endpoints and can be revoked by
    flipping is_active — no deploy needed.
    """

    name = models.CharField(
        "Partner name",
        max_length=200,
        help_text="Who this key belongs to, e.g. 'Bard Santner website'",
    )
    key = models.CharField(
        "Key",
        max_length=64,
        unique=True,
        db_index=True,
        default=_generate_partner_key,
    )
    is_active = models.BooleanField("Active", default=True)
    allowed_origins = models.TextField(
        "Allowed origins",
        blank=True,
        help_text=(
            "Optional comma-separated list of origins for CORS, e.g. "
            "https://bardsantner.com. Leave blank to allow any origin "
            "(content is public/read-only)."
        ),
    )
    last_used_at = models.DateTimeField("Last used", null=True, blank=True)
    request_count = models.PositiveBigIntegerField("Requests served", default=0)

    class Meta:
        verbose_name = "Partner API Key"
        verbose_name_plural = "Partner API Keys"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({'active' if self.is_active else 'revoked'})"
