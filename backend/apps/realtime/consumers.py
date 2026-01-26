"""
WebSocket Consumers for Real-time Data

Provides live streaming for:
- Market prices and ticker updates
- Breaking news notifications
- Price alerts
- User notifications
"""
import json
import logging
from decimal import Decimal

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

logger = logging.getLogger(__name__)


class MarketDataConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time market data.

    Clients subscribe to specific symbols or exchanges.
    Server pushes price updates as they occur.
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.subscriptions = set()
        self.user = self.scope.get("user")

        await self.accept()

        # Send connection confirmation
        await self.send_json({
            "type": "connection_established",
            "message": "Connected to market data stream",
            "timestamp": timezone.now().isoformat(),
        })

        logger.info(f"Market data connection established: {self.channel_name}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Unsubscribe from all channels
        for subscription in self.subscriptions:
            await self.channel_layer.group_discard(subscription, self.channel_name)

        logger.info(f"Market data connection closed: {self.channel_name}")

    async def receive_json(self, content):
        """Handle incoming messages from client."""
        action = content.get("action")

        if action == "subscribe":
            await self.handle_subscribe(content)
        elif action == "unsubscribe":
            await self.handle_unsubscribe(content)
        elif action == "ping":
            await self.send_json({"type": "pong", "timestamp": timezone.now().isoformat()})
        else:
            await self.send_json({"type": "error", "message": f"Unknown action: {action}"})

    async def handle_subscribe(self, content):
        """Subscribe to symbol or exchange updates."""
        symbols = content.get("symbols", [])
        exchanges = content.get("exchanges", [])

        # Subscribe to individual symbols
        for symbol in symbols:
            group_name = f"ticker_{symbol.upper()}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.subscriptions.add(group_name)

        # Subscribe to exchange-wide updates
        for exchange in exchanges:
            group_name = f"exchange_{exchange.upper()}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.subscriptions.add(group_name)

        await self.send_json({
            "type": "subscribed",
            "symbols": symbols,
            "exchanges": exchanges,
        })

    async def handle_unsubscribe(self, content):
        """Unsubscribe from updates."""
        symbols = content.get("symbols", [])
        exchanges = content.get("exchanges", [])

        for symbol in symbols:
            group_name = f"ticker_{symbol.upper()}"
            await self.channel_layer.group_discard(group_name, self.channel_name)
            self.subscriptions.discard(group_name)

        for exchange in exchanges:
            group_name = f"exchange_{exchange.upper()}"
            await self.channel_layer.group_discard(group_name, self.channel_name)
            self.subscriptions.discard(group_name)

        await self.send_json({
            "type": "unsubscribed",
            "symbols": symbols,
            "exchanges": exchanges,
        })

    async def ticker_update(self, event):
        """Receive ticker update from channel layer."""
        await self.send_json({
            "type": "ticker_update",
            "data": event["data"],
            "timestamp": event.get("timestamp", timezone.now().isoformat()),
        })

    async def exchange_update(self, event):
        """Receive exchange-wide update from channel layer."""
        await self.send_json({
            "type": "exchange_update",
            "exchange": event["exchange"],
            "data": event["data"],
            "timestamp": event.get("timestamp", timezone.now().isoformat()),
        })


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for user notifications.

    Authenticated users receive:
    - Price alerts
    - Breaking news alerts
    - System notifications
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.user_group = f"user_{self.user.id}"

        # Join user-specific group
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Join broadcast group for breaking news
        await self.channel_layer.group_add("broadcast_news", self.channel_name)

        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": "Connected to notification stream",
            "user_id": str(self.user.id),
        })

        # Send any pending notifications
        await self.send_pending_notifications()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        await self.channel_layer.group_discard("broadcast_news", self.channel_name)

    async def receive_json(self, content):
        """Handle incoming messages."""
        action = content.get("action")

        if action == "mark_read":
            await self.mark_notification_read(content.get("notification_id"))
        elif action == "ping":
            await self.send_json({"type": "pong"})

    async def notification(self, event):
        """Receive notification from channel layer."""
        await self.send_json({
            "type": "notification",
            "notification": event["notification"],
        })

    async def price_alert(self, event):
        """Receive price alert from channel layer."""
        await self.send_json({
            "type": "price_alert",
            "alert": event["alert"],
        })

    async def breaking_news(self, event):
        """Receive breaking news broadcast."""
        await self.send_json({
            "type": "breaking_news",
            "article": event["article"],
        })

    @database_sync_to_async
    def send_pending_notifications(self):
        """Send any unread notifications on connect."""
        from apps.engagement.models import Notification

        notifications = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).order_by("-created_at")[:10]

        return [
            {
                "id": str(n.id),
                "type": n.notification_type,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ]

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read."""
        from apps.engagement.models import Notification

        Notification.objects.filter(
            id=notification_id,
            user=self.user
        ).update(is_read=True, read_at=timezone.now())


class MarketSummaryConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for market summary updates.

    Provides periodic updates for:
    - Index values
    - Top gainers/losers
    - Market status
    """

    async def connect(self):
        """Handle WebSocket connection."""
        await self.channel_layer.group_add("market_summary", self.channel_name)
        await self.accept()

        # Send initial market summary
        summary = await self.get_market_summary()
        await self.send_json({
            "type": "market_summary",
            "data": summary,
        })

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard("market_summary", self.channel_name)

    async def receive_json(self, content):
        """Handle incoming messages."""
        action = content.get("action")

        if action == "refresh":
            summary = await self.get_market_summary()
            await self.send_json({
                "type": "market_summary",
                "data": summary,
            })

    async def summary_update(self, event):
        """Receive summary update from channel layer."""
        await self.send_json({
            "type": "market_summary",
            "data": event["data"],
        })

    @database_sync_to_async
    def get_market_summary(self):
        """Get current market summary."""
        from apps.markets.models import MarketIndex, Company

        # Get indices
        indices = list(
            MarketIndex.objects.filter(is_active=True).values(
                "code", "name", "current_value", "change_percent"
            )
        )

        # Get top gainers
        top_gainers = list(
            Company.objects.filter(is_active=True)
            .exclude(change_percent__isnull=True)
            .order_by("-change_percent")[:5]
            .values("symbol", "name", "current_price", "change_percent")
        )

        # Get top losers
        top_losers = list(
            Company.objects.filter(is_active=True)
            .exclude(change_percent__isnull=True)
            .order_by("change_percent")[:5]
            .values("symbol", "name", "current_price", "change_percent")
        )

        return {
            "indices": indices,
            "top_gainers": top_gainers,
            "top_losers": top_losers,
            "timestamp": timezone.now().isoformat(),
        }
