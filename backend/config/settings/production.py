"""
Production Settings for Bardiq Journal
"""
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration

from .base import *  # noqa: F401,F403

# =========================
# Security Settings
# =========================
DEBUG = False
SECRET_KEY = env("SECRET_KEY")  # noqa: F405

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")  # noqa: F405

# =========================
# HTTPS / Security Headers
# =========================
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)  # noqa: F405
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# =========================
# CORS (Strict in production)
# =========================
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list(  # noqa: F405
    "CORS_ALLOWED_ORIGINS",
    default=[
        "https://bardiq-frontend.onrender.com",
        "https://bardiqjournal.com",
        "https://www.bardiqjournal.com",
    ]
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# =========================
# Database Connection Pooling
# =========================
# Use shorter connection age on Render to prevent stale connections
DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=0)  # noqa: F405
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True  # noqa: F405
# Disable server-side cursors which can cause issues with connection pooling
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True  # noqa: F405
# Neon-compatible options (no statement_timeout in startup params)
DATABASES["default"]["OPTIONS"] = {  # noqa: F405
    "connect_timeout": 10,
    "sslmode": "require",  # Required for Neon
}

# =========================
# DigitalOcean Spaces (S3-compatible) Storage
# =========================
USE_SPACES = env.bool("USE_SPACES", default=True)  # noqa: F405

if USE_SPACES:
    # DigitalOcean Spaces credentials
    AWS_ACCESS_KEY_ID = env("DO_SPACES_ACCESS_KEY", default="DO00YXAR8JQNBMUJ2QJJ")  # noqa: F405
    AWS_SECRET_ACCESS_KEY = env("DO_SPACES_SECRET_KEY", default="")  # noqa: F405
    AWS_STORAGE_BUCKET_NAME = env("DO_SPACES_BUCKET", default="bgfi")  # noqa: F405
    AWS_S3_REGION_NAME = env("DO_SPACES_REGION", default="sgp1")  # noqa: F405

    # DigitalOcean Spaces endpoint
    AWS_S3_ENDPOINT_URL = f"https://{AWS_S3_REGION_NAME}.digitaloceanspaces.com"
    AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.{AWS_S3_REGION_NAME}.digitaloceanspaces.com"

    # S3 settings
    AWS_DEFAULT_ACL = "public-read"
    AWS_S3_OBJECT_PARAMETERS = {
        "CacheControl": "max-age=86400",  # 1 day cache
    }
    AWS_QUERYSTRING_AUTH = False  # Public URLs without query strings
    AWS_S3_FILE_OVERWRITE = False

    # Static files (keep using whitenoise for static, only use Spaces for media)
    # STATICFILES_STORAGE = "apps.core.storage.StaticStorage"

    # Media files - use DigitalOcean Spaces
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"
    DEFAULT_FILE_STORAGE = "apps.core.storage.MediaStorage"

# =========================
# Sentry Error Tracking
# =========================
SENTRY_DSN = env("SENTRY_DSN", default=None)  # noqa: F405

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        environment="production",
    )

# =========================
# Email (Production SMTP)
# =========================
EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
ANYMAIL = {
    "SENDGRID_API_KEY": env("SENDGRID_API_KEY", default=""),  # noqa: F405
}

# =========================
# Caching (Redis in production)
# =========================
REDIS_URL = env("REDIS_URL", default="")  # noqa: F405

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
                "IGNORE_EXCEPTIONS": True,  # Don't crash if Redis is down
                "SOCKET_CONNECT_TIMEOUT": 5,
                "SOCKET_TIMEOUT": 5,
                "CONNECTION_POOL_KWARGS": {
                    "max_connections": 10,
                    "retry_on_timeout": True,
                },
            },
            "KEY_PREFIX": "bard",
        }
    }
else:
    # Fallback to local memory cache if Redis not available
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-snowflake",
        }
    }

# =========================
# Session (Redis backed if available, otherwise DB)
# =========================
if REDIS_URL:
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
else:
    SESSION_ENGINE = "django.contrib.sessions.backends.db"

# =========================
# Celery (Production)
# =========================
if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
else:
    # Disable Celery tasks if no Redis
    CELERY_TASK_ALWAYS_EAGER = True

# Reduce Celery task timeout to prevent long-running tasks
CELERY_TASK_TIME_LIMIT = 60 * 5  # 5 minutes max
CELERY_TASK_SOFT_TIME_LIMIT = 60 * 4  # Soft limit at 4 minutes

# =========================
# Logging (Production)
# =========================
LOGGING = {  # noqa: F405
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
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
            "level": "WARNING",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
