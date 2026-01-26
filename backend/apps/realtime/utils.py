"""
Real-time Utility Functions

Functions to push updates through WebSocket channels.
"""
import logging
from decimal import Decimal

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

logger = logging.getLogger(__name__)


def broadcast_ticker_update(symbol: str, data: dict):
    """
    Broadcast a ticker update to all subscribed clients.

    Args:
        symbol: Stock symbol (e.g., "AGL")
        data: Ticker data dictionary
    """
    channel_layer = get_channel_layer()

    # Convert Decimal to float for JSON serialization
    serialized_data = {
        k: float(v) if isinstance(v, Decimal) else v
        for k, v in data.items()
    }

    message = {
        "type": "ticker_update",
        "data": {
            "symbol": symbol,
            **serialized_data,
        },
        "timestamp": timezone.now().isoformat(),
    }

    async_to_sync(channel_layer.group_send)(
        f"ticker_{symbol.upper()}",
        message
    )


def broadcast_exchange_update(exchange: str, tickers: list):
    """
    Broadcast exchange-wide updates.

    Args:
        exchange: Exchange code (e.g., "JSE")
        tickers: List of ticker data dictionaries
    """
    channel_layer = get_channel_layer()

    # Serialize data
    serialized_tickers = []
    for ticker in tickers:
        serialized_tickers.append({
            k: float(v) if isinstance(v, Decimal) else v
            for k, v in ticker.items()
        })

    message = {
        "type": "exchange_update",
        "exchange": exchange,
        "data": serialized_tickers,
        "timestamp": timezone.now().isoformat(),
    }

    async_to_sync(channel_layer.group_send)(
        f"exchange_{exchange.upper()}",
        message
    )


def send_user_notification(user_id: int, notification: dict):
    """
    Send a notification to a specific user.

    Args:
        user_id: User ID
        notification: Notification data dictionary
    """
    channel_layer = get_channel_layer()

    message = {
        "type": "notification",
        "notification": notification,
    }

    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        message
    )


def send_price_alert(user_id: int, alert: dict):
    """
    Send a price alert to a specific user.

    Args:
        user_id: User ID
        alert: Alert data dictionary
    """
    channel_layer = get_channel_layer()

    message = {
        "type": "price_alert",
        "alert": alert,
    }

    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        message
    )


def broadcast_breaking_news(article: dict):
    """
    Broadcast breaking news to all connected users.

    Args:
        article: Article data dictionary
    """
    channel_layer = get_channel_layer()

    message = {
        "type": "breaking_news",
        "article": article,
    }

    async_to_sync(channel_layer.group_send)(
        "broadcast_news",
        message
    )


def update_market_summary(summary: dict):
    """
    Push market summary update to all subscribers.

    Args:
        summary: Market summary data dictionary
    """
    channel_layer = get_channel_layer()

    # Serialize Decimals
    def serialize(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: serialize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [serialize(item) for item in obj]
        return obj

    message = {
        "type": "summary_update",
        "data": serialize(summary),
    }

    async_to_sync(channel_layer.group_send)(
        "market_summary",
        message
    )
