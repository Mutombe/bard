"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Newspaper,
  AlertCircle,
  Check,
  Trash2,
  Settings,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { userService } from "@/services/api/user";
import type { Notification, NotificationType } from "@/types";
import { toast } from "sonner";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "breaking_news":
      return <Newspaper className="h-5 w-5 text-brand-orange" />;
    case "system":
      return <AlertCircle className="h-5 w-5 text-purple-400" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

function getNotificationLink(notification: Notification): string | undefined {
  const { data } = notification;

  if (data?.link) return data.link;
  if (data?.article_slug) return `/news/${data.article_slug}`;
  if (data?.company_slug) return `/companies/${data.company_slug}`;

  return undefined;
}

function NotificationSkeleton() {
  return (
    <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border divide-y divide-terminal-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="h-5 w-5 rounded bg-terminal-bg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-terminal-bg rounded w-1/3" />
              <div className="h-3 bg-terminal-bg rounded w-2/3" />
              <div className="h-3 bg-terminal-bg rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await userService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id: string) => {
    setActionLoading(id);
    try {
      await userService.markNotificationAsRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark as read");
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    setActionLoading("all");
    try {
      await userService.markAllNotificationsAsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteNotification = async (id: string) => {
    setActionLoading(id);
    try {
      await userService.deleteNotification(id);
      setNotifications(notifications.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.notification_type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
            <button
              onClick={openLogin}
              className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors inline-block"
            >
              Sign In
            </button>
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
              Stay updated with breaking news and system updates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={actionLoading === "all"}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50"
              >
                {actionLoading === "all" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
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
            { id: "breaking_news", label: "Breaking News" },
            { id: "system", label: "System" },
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
        {isLoading ? (
          <NotificationSkeleton />
        ) : filteredNotifications.length > 0 ? (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border divide-y divide-terminal-border">
            {filteredNotifications.map((notification) => {
              const link = getNotificationLink(notification);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-terminal-bg-elevated transition-colors",
                    !notification.is_read && "bg-brand-orange/5"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={cn(
                            "font-medium",
                            !notification.is_read && "text-brand-orange"
                          )}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString("en-ZA", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              disabled={actionLoading === notification.id}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg rounded disabled:opacity-50"
                              title="Mark as read"
                            >
                              {actionLoading === notification.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            disabled={actionLoading === notification.id}
                            className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg rounded disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading === notification.id && notification.is_read ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {link && (
                        <Link
                          href={link}
                          className="inline-block text-sm text-brand-orange hover:text-brand-orange-light mt-2"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
