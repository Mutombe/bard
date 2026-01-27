"""
Base Django Settings for Bard Santner Journal

Common settings shared across all environments.
"""
import os
from datetime import timedelta
from pathlib import Path

import environ

# =========================
# Path Configuration
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent.parent
APPS_DIR = BASE_DIR / "apps"

# =========================
# Environment Variables
# =========================
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
)

# Read .env file
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

# =========================
# Core Settings
# =========================
SECRET_KEY = env("SECRET_KEY", default="django-insecure-change-me-in-production")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")

# =========================
# Application Definition
# =========================
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
]

THIRD_PARTY_APPS = [
    # REST Framework
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    # CORS
    "corsheaders",
    # Filtering
    "django_filters",
    # Celery
    "django_celery_beat",
    "django_celery_results",
    # Rich Text Editor
    "ckeditor",
    "ckeditor_uploader",
    # API Documentation
    "drf_spectacular",
    # Storage
    "storages",
    # WebSocket support
    "channels",
]

LOCAL_APPS = [
    "apps.core",
    "apps.users",
    "apps.authentication",
    "apps.markets",
    "apps.news",
    "apps.engagement",
    "apps.spider",
    "apps.geography",
    "apps.columnists",
    "apps.editorial",
    "apps.analytics",
    "apps.portfolio",
    "apps.seo",
    "apps.realtime",
    "apps.subscriptions",
    "apps.media",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# =========================
# Middleware
# =========================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Custom middleware
    "apps.core.middleware.SecurityHeadersMiddleware",
    "apps.core.middleware.RequestLoggingMiddleware",
    "apps.core.middleware.APIVersionMiddleware",
]

# Maintenance mode (set to True to enable)
MAINTENANCE_MODE = env.bool("MAINTENANCE_MODE", default=False)

ROOT_URLCONF = "config.urls"

# =========================
# Templates
# =========================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# =========================
# Database
# =========================
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://bard_user:bard_password@localhost:5432/bard_db",
    ),
}

# Read replica for scaling read-heavy operations
if env("DATABASE_REPLICA_URL", default=""):
    DATABASES["replica"] = env.db("DATABASE_REPLICA_URL")
    DATABASES["replica"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=60)
    # Enable database router for read/write splitting
    DATABASE_ROUTERS = ["config.db_router.ReadReplicaRouter"]

DATABASES["default"]["ATOMIC_REQUESTS"] = True
DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=60)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# =========================
# Authentication
# =========================
AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

# =========================
# Internationalization
# =========================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Johannesburg"
USE_I18N = True
USE_TZ = True

# =========================
# Static & Media Files
# =========================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# =========================
# Sites Framework
# =========================
SITE_ID = 1

# =========================
# Django REST Framework
# =========================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    # Allow anyone to read content - authentication required only for mutations
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "market_data": "300/minute",
    },
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
}

# =========================
# Simple JWT Configuration
# =========================
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
}

# =========================
# CORS Configuration
# =========================
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)
CORS_ALLOW_CREDENTIALS = True

# =========================
# Celery Configuration
# =========================
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/1")
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = "django-cache"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

# =========================
# Redis Cache
# =========================
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://localhost:6379/0"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
    }
}

# =========================
# CKEditor Configuration
# =========================
CKEDITOR_UPLOAD_PATH = "uploads/"
CKEDITOR_IMAGE_BACKEND = "pillow"
CKEDITOR_CONFIGS = {
    "default": {
        "toolbar": "full",
        "height": 400,
        "width": "100%",
        "extraPlugins": ",".join(["embed", "autoembed", "embedsemantic"]),
    },
}

# =========================
# API Documentation (drf-spectacular)
# =========================
SPECTACULAR_SETTINGS = {
    "TITLE": "Bard Santner Journal API",
    "DESCRIPTION": "Financial Intelligence Platform - The Bloomberg of Africa",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/v1",
}

# =========================
# Email Configuration
# =========================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp.sendgrid.net")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@bardsantner.com")

# =========================
# Logging Configuration
# =========================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "bard.log",
            "maxBytes": 1024 * 1024 * 5,  # 5 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# =========================
# Channels (WebSocket) Configuration
# =========================
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [env("REDIS_URL", default="redis://localhost:6379/2")],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# =========================
# Site Configuration
# =========================
SITE_URL = env("SITE_URL", default="https://bardsantner.com")

# =========================
# Payment Providers
# =========================
# Stripe (International payments)
STRIPE_PUBLISHABLE_KEY = env("STRIPE_PUBLISHABLE_KEY", default="")
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")

# Paystack (African payments - Nigeria, South Africa, Ghana, Kenya)
PAYSTACK_PUBLIC_KEY = env("PAYSTACK_PUBLIC_KEY", default="")
PAYSTACK_SECRET_KEY = env("PAYSTACK_SECRET_KEY", default="")
PAYSTACK_WEBHOOK_SECRET = env("PAYSTACK_WEBHOOK_SECRET", default="")

# =========================
# Subscription Settings
# =========================
SUBSCRIPTION_SETTINGS = {
    "GRACE_PERIOD_DAYS": 3,  # Days to allow access after payment failure
    "TRIAL_DAYS_DEFAULT": 14,  # Default trial period
    "ALLOW_MULTIPLE_SUBSCRIPTIONS": False,
    "PRORATION_BEHAVIOR": "create_prorations",  # or "none"
}

# =========================
# External API Keys
# =========================
YOUTUBE_API_KEY = env("YOUTUBE_API_KEY", default="")
POLYGON_API_KEY = env("POLYGON_API_KEY", default="")
NEWSAPI_KEY = env("NEWSAPI_KEY", default="")
UNSPLASH_ACCESS_KEY = env("UNSPLASH_ACCESS_KEY", default="")
