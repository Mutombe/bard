"""
ASGI config for Bard Santner Journal.

Exposes the ASGI callable as a module-level variable named ``application``.

Supports both HTTP and WebSocket protocols for real-time market data.
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

# Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

# Import after Django setup
from apps.realtime.routing import websocket_urlpatterns


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
