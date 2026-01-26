"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Newspaper,
  AlertCircle,
  Check,
  Trash2,
  Settings,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";

interface Notification {
  id: string;
  type: "price_alert" | "news" | "system" | "market";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "price_alert",
    title: "Price Alert: NPN",
    message: "Naspers (NPN) has risen above your target of R3,200.00",
    link: "/companies/npn",
    isRead: false,
    createdAt: "2025-01-24T14:30:00Z",
  },
  {
    id: "2",
    type: "news",
    title: "Breaking News",
    message: "JSE All Share Index hits record high amid global rally",
    link: "/news/jse-record-high",
    isRead: false,
    createdAt: "2025-01-24T12:00:00Z",
  },
  {
    id: "3",
    type: "market",
    title: "Market Close",
    message: "JSE has closed. Your portfolio is up 2.3% today.",
    link: "/portfolio",
    isRead: false,
    createdAt: "2025-01-24T17:00:00Z",
  },
  {
    id: "4",
    type: "price_alert",
    title: "Price Alert: MTN",
    message: "MTN Group (MTN) is approaching your target of R160.00",
    link: "/companies/mtn",
    isRead: true,
    createdAt: "2025-01-23T10:30:00Z",
  },
  {
    id: "5",
    type: "system",
    title: "Welcome to Bardiq Journal",
    message: "Complete your profile to get personalized recommendations.",
    link: "/profile",
    isRead: true,
    createdAt: "2025-01-20T08:00:00Z",
  },
];

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "price_alert":
      return <TrendingUp className="h-5 w-5 text-market-up" />;
    case "news":
      return <Newspaper className="h-5 w-5 text-brand-orange" />;
    case "market":
      return <TrendingDown className="h-5 w-5 text-blue-400" />;
    case "system":
      return <AlertCircle className="h-5 w-5 text-purple-400" />;
  }
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState("all");

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to view your notifications.
            </p>
            <Link
              href="/login"
              className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Bell className="h-6 w-6 text-brand-orange" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-brand-orange text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Stay updated with price alerts, news, and more.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
            <Link
              href="/settings"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "price_alert", label: "Price Alerts" },
            { id: "news", label: "News" },
            { id: "market", label: "Market" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors",
                filter === f.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border divide-y divide-terminal-border">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-terminal-bg-elevated transition-colors",
                  !notification.isRead && "bg-brand-orange/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          "font-medium",
                          !notification.isRead && "text-brand-orange"
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleString("en-ZA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="inline-block text-sm text-brand-orange hover:text-brand-orange-light mt-2"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === "unread"
                ? "You're all caught up!"
                : "You don't have any notifications yet."}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
