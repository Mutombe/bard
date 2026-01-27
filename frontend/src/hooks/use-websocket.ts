"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  send: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  lastMessage: any;
}

/**
 * WebSocket Hook
 *
 * Features:
 * - Automatic reconnection
 * - Connection status tracking
 * - JSON message handling
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    // Don't connect if already connecting or connected
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    try {
      // Build WebSocket URL
      const wsUrl = url.startsWith("ws")
        ? url
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${url}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setStatus("connected");
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch {
          // Handle non-JSON messages
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      };

      wsRef.current.onclose = () => {
        setStatus("disconnected");
        onClose?.();

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };
    } catch (error) {
      setStatus("error");
      console.error("WebSocket connection error:", error);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectCountRef.current = reconnectAttempts; // Prevent reconnection
    wsRef.current?.close();
    setStatus("disconnected");
  }, [reconnectAttempts]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [autoConnect, connect]);

  return {
    status,
    send,
    connect,
    disconnect,
    lastMessage,
  };
}

/**
 * Market Data WebSocket Hook
 *
 * Specialized hook for real-time market data subscriptions.
 */
export function useMarketDataSocket() {
  const [tickerData, setTickerData] = useState<Record<string, any>>({});
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);

  const { status, send, connect, disconnect } = useWebSocket("/ws/market/", {
    onMessage: (data) => {
      if (data.type === "ticker_update") {
        const symbol = data.data?.symbol;
        if (symbol) {
          setTickerData((prev) => ({
            ...prev,
            [symbol]: data.data,
          }));
        }
      } else if (data.type === "exchange_update") {
        // Handle bulk exchange updates
        data.data?.forEach((ticker: any) => {
          if (ticker.symbol) {
            setTickerData((prev) => ({
              ...prev,
              [ticker.symbol]: ticker,
            }));
          }
        });
      }
    },
  });

  const subscribe = useCallback(
    (symbols: string[], exchanges?: string[]) => {
      send({
        action: "subscribe",
        symbols,
        exchanges: exchanges || [],
      });
      setSubscribedSymbols((prev) => [...new Set([...prev, ...symbols])]);
    },
    [send]
  );

  const unsubscribe = useCallback(
    (symbols: string[], exchanges?: string[]) => {
      send({
        action: "unsubscribe",
        symbols,
        exchanges: exchanges || [],
      });
      setSubscribedSymbols((prev) =>
        prev.filter((s) => !symbols.includes(s))
      );
    },
    [send]
  );

  return {
    status,
    tickerData,
    subscribedSymbols,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}

/**
 * Notifications WebSocket Hook
 */
export function useNotificationsSocket() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { status, send, connect, disconnect } = useWebSocket("/ws/notifications/", {
    onMessage: (data) => {
      if (data.type === "notification" || data.type === "price_alert" || data.type === "breaking_news") {
        setNotifications((prev) => [data.notification || data.alert || data.article, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    },
  });

  const markAsRead = useCallback(
    (notificationId: string) => {
      send({
        action: "mark_read",
        notification_id: notificationId,
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [send]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    status,
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    connect,
    disconnect,
  };
}
