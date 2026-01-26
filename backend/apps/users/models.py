"""
User Models

Implements:
- Custom User model with email authentication
- UserProfile with watchlists and preferences
- Role-Based Access Control (RBAC)
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class UserRole(models.TextChoices):
    """User roles for RBAC."""

    SUPER_ADMIN = "super_admin", "Super Admin (Publisher)"
    EDITOR = "editor", "Editor (Content Creator)"
    ANALYST = "analyst", "Analyst (Research)"
    SUBSCRIBER = "subscriber", "Subscriber (Reader)"


class SubscriptionTier(models.TextChoices):
    """Subscription tiers for access control."""

    FREE = "free", "Free"
    BASIC = "basic", "Basic"
    PROFESSIONAL = "professional", "Professional"
    ENTERPRISE = "enterprise", "Enterprise"


class UserManager(BaseUserManager):
    """Custom user manager with email authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError("Email address is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Custom User model using email for authentication.

    Includes RBAC roles:
    - Super Admin: Full platform access, can manage all content
    - Editor: Can create and publish content
    - Analyst: Can create research reports
    - Subscriber: Can read content based on subscription tier
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    email = models.EmailField(
        "Email Address",
        unique=True,
        db_index=True,
    )
    first_name = models.CharField(
        "First Name",
        max_length=150,
        blank=True,
    )
    last_name = models.CharField(
        "Last Name",
        max_length=150,
        blank=True,
    )
    role = models.CharField(
        "Role",
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.SUBSCRIBER,
        db_index=True,
    )
    subscription_tier = models.CharField(
        "Subscription Tier",
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE,
        db_index=True,
    )
    is_active = models.BooleanField(
        "Active",
        default=True,
        help_text="Designates whether this user account is active.",
    )
    is_staff = models.BooleanField(
        "Staff Status",
        default=False,
        help_text="Designates whether the user can access the admin site.",
    )
    email_verified = models.BooleanField(
        "Email Verified",
        default=False,
    )
    last_login_ip = models.GenericIPAddressField(
        "Last Login IP",
        null=True,
        blank=True,
    )
    date_joined = models.DateTimeField(
        "Date Joined",
        default=timezone.now,
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
            models.Index(fields=["subscription_tier"]),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip() or self.email

    # =========================
    # Role-based permissions
    # =========================
    @property
    def is_admin(self):
        return self.role == UserRole.SUPER_ADMIN

    @property
    def is_editor(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.EDITOR]

    @property
    def is_analyst(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.ANALYST]

    @property
    def can_publish(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.EDITOR]

    @property
    def can_access_premium(self):
        return self.subscription_tier in [
            SubscriptionTier.PROFESSIONAL,
            SubscriptionTier.ENTERPRISE,
        ]


class UserProfile(TimeStampedModel):
    """
    Extended user profile with preferences and watchlists.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    avatar = models.ImageField(
        "Avatar",
        upload_to="avatars/",
        null=True,
        blank=True,
    )
    bio = models.TextField(
        "Bio",
        max_length=500,
        blank=True,
    )
    company = models.CharField(
        "Company",
        max_length=200,
        blank=True,
    )
    job_title = models.CharField(
        "Job Title",
        max_length=200,
        blank=True,
    )
    phone = models.CharField(
        "Phone Number",
        max_length=20,
        blank=True,
    )
    country = models.CharField(
        "Country",
        max_length=100,
        blank=True,
    )
    timezone = models.CharField(
        "Timezone",
        max_length=50,
        default="Africa/Johannesburg",
    )

    # =========================
    # Watchlist (M2M with Company)
    # =========================
    watchlist = models.ManyToManyField(
        "markets.Company",
        related_name="watched_by",
        blank=True,
        help_text="Companies the user is watching",
    )

    # =========================
    # Preferences
    # =========================
    preferences = models.JSONField(
        "Preferences",
        default=dict,
        blank=True,
        help_text="User preferences as JSON",
    )

    # Default preferences structure:
    # {
    #     "notifications": {
    #         "price_alerts": True,
    #         "breaking_news": True,
    #         "daily_digest": True,
    #         "weekly_report": False
    #     },
    #     "display": {
    #         "theme": "dark",
    #         "currency": "ZAR",
    #         "number_format": "en-ZA"
    #     },
    #     "default_exchange": "JSE"
    # }

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"Profile: {self.user.email}"

    def add_to_watchlist(self, company):
        """Add a company to the user's watchlist."""
        self.watchlist.add(company)

    def remove_from_watchlist(self, company):
        """Remove a company from the user's watchlist."""
        self.watchlist.remove(company)

    def is_watching(self, company):
        """Check if the user is watching a company."""
        return self.watchlist.filter(pk=company.pk).exists()

    def get_preference(self, key, default=None):
        """Get a preference value by dot-notation key."""
        keys = key.split(".")
        value = self.preferences
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
        return value if value is not None else default

    def set_preference(self, key, value):
        """Set a preference value by dot-notation key."""
        keys = key.split(".")
        prefs = self.preferences
        for k in keys[:-1]:
            prefs = prefs.setdefault(k, {})
        prefs[keys[-1]] = value
        self.save(update_fields=["preferences"])
