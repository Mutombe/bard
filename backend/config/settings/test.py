"""
Test Settings for Bard Santner Journal
"""
from .base import *  # noqa: F401,F403

# =========================
# Debug Mode
# =========================
DEBUG = False

# =========================
# Test Database (SQLite for speed)
# =========================
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# =========================
# Password Hashing (Fast for tests)
# =========================
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# =========================
# Email (In-memory for tests)
# =========================
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# =========================
# Django-Q2 (Sync execution for tests)
# =========================
Q_CLUSTER = {
    "name": "bard-test",
    "sync": True,  # Execute tasks synchronously in tests
    "orm": "default",
}

# =========================
# Caching (Dummy for tests)
# =========================
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}

# =========================
# Disable Throttling in Tests
# =========================
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}  # noqa: F405
