"""
Development Settings for Bard Santner Journal
"""
from .base import *  # noqa: F401,F403

# =========================
# Debug Mode
# =========================
DEBUG = True

# =========================
# Allowed Hosts
# =========================
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# =========================
# Development Apps
# =========================
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS += [  # noqa: F405
        "debug_toolbar",
    ]
    # Development Middleware
    MIDDLEWARE = [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
    ] + MIDDLEWARE  # noqa: F405
except ImportError:
    pass

# =========================
# Debug Toolbar
# =========================
INTERNAL_IPS = [
    "127.0.0.1",
    "localhost",
]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
}

# =========================
# CORS (Allow all in development)
# =========================
CORS_ALLOW_ALL_ORIGINS = True

# =========================
# Email (Console backend for development)
# =========================
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# =========================
# Database (Use production DB if DATABASE_URL is set, otherwise SQLite)
# =========================
import dj_database_url

DATABASE_URL = env("DATABASE_URL", default=None)  # noqa: F405

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.config(default=DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# =========================
# Caching (Local memory for development)
# =========================
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

# =========================
# Channels (In-memory for development)
# =========================
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}

# =========================
# Logging (More verbose in development)
# =========================
LOGGING["handlers"]["console"]["level"] = "DEBUG"  # noqa: F405
LOGGING["loggers"]["apps"]["level"] = "DEBUG"  # noqa: F405
