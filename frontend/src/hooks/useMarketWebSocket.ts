"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

interface TickerUpdate {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

interface MarketSummary {
  indices: Array<{
    code: string;
    name: string;
    current_value: number;
    change_percent: number;
  }>;
  top_gainers: Array<{
    symbol: string;
    name: string;
    current_price: number;
    change_percent: number;
  }>;
  top_losers: Array<{
    symbol: string;
    name: string;
    current_price: number;
    change_percent: number;
  }>;
  timestamp: string;
}

interface UseMarketWebSocketOptions {
  symbols?: string[];
  exchanges?: string[];
  onTickerUpdate?: (data: TickerUpdate) => void;
  onSummaryUpdate?: (data: MarketSummary) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useMarketWebSocket({
  symbols = [],
  exchanges = [],
  onTickerUpdate,
  onSummaryUpdate,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseMarketWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/ws/market/`);

    ws.onopen = () => {
      console.log("Market WebSocket connected");
      setIsConnected(true);

      // Subscribe to symbols and exchanges
      if (symbols.length > 0 || exchanges.length > 0) {
        ws.send(
          JSON.stringify({
            action: "subscribe",
            symbols,
            exchanges,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "ticker_update":
            setLastUpdate(new Date());
            onTickerUpdate?.(data.data);
            break;

          case "exchange_update":
            setLastUpdate(new Date());
            data.data.forEach((ticker: TickerUpdate) => {
              onTickerUpdate?.(ticker);
            });
            break;

          case "market_summary":
            onSummaryUpdate?.(data.data);
            break;

          case "subscribed":
            console.log("Subscribed to:", data.symbols, data.exchanges);
            break;

          case "error":
            console.error("WebSocket error:", data.message);
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("Market WebSocket closed:", event.code);
      setIsConnected(false);

      if (autoReconnect && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Reconnecting to market WebSocket...");
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error("Market WebSocket error:", error);
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [symbols, exchanges, onTickerUpdate, onSummaryUpdate, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((newSymbols: string[], newExchanges: string[] = []) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "subscribe",
          symbols: newSymbols,
          exchanges: newExchanges,
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((symbolsToRemove: string[], exchangesToRemove: string[] = []) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "unsubscribe",
          symbols: symbolsToRemove,
          exchanges: exchangesToRemove,
        })
      );
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastUpdate,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect: connect,
  };
}

/**
 * Hook for receiving user notifications via WebSocket.
 */
export function useNotificationWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback((token: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/ws/notifications/`);

    ws.onopen = () => {
      console.log("Notification WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "notification":
            toast.info(data.notification.title, {
              description: data.notification.message,
            });
            break;

          case "price_alert":
            const alert = data.alert;
            toast.warning(`Price Alert: ${alert.symbol}`, {
              description: `${alert.symbol} has reached ${alert.current_price}`,
            });
            break;

          case "breaking_news":
            toast.error("Breaking News", {
              description: data.article.headline,
              action: {
                label: "Read",
                onClick: () => {
                  window.location.href = `/article/${data.article.slug}`;
                },
              },
            });
            break;
        }
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("Notification WebSocket closed:", event.code);
      setIsConnected(false);

      // Reconnect unless intentionally closed
      if (event.code !== 1000 && event.code !== 4001) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect(token);
        }, 5000);
      }
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const markRead = useCallback((notificationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "mark_read",
          notification_id: notificationId,
        })
      );
    }
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    markRead,
  };
}
