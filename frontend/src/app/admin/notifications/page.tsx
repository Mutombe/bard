"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  Mail,
  FileText,
  Trash2,
  Check,
  RefreshCw,
  Filter,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authClient } from "@/services/api/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

const notificationTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  info: { icon: Info, color: "text-blue-400", label: "Info" },
  success: { icon: CheckCircle, color: "text-market-up", label: "Success" },
  warning: { icon: AlertCircle, color: "text-yellow-400", label: "Warning" },
  error: { icon: AlertCircle, color: "text-market-down", label: "Error" },
  new_user: { icon: Users, color: "text-purple-400", label: "New User" },
  new_subscription: { icon: Mail, color: "text-brand-orange", label: "Subscription" },
  new_article: { icon: FileText, color: "text-blue-400", label: "Article" },
  system: { icon: Bell, color: "text-muted-foreground", label: "System" },
};

function getConfig(type: string) {
  return notificationTypeConfig[type] || notificationTypeConfig.info;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await authClient.get("/engagement/notifications/", {
        params: filter === "unread" ? { is_read: false } : undefined,
      });
      setNotifications(response.data.results || response.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const markAsRead = async (id: string) => {
    setMarkingRead(id);
    try {
      await authClient.post(`/engagement/notifications/${id}/mark_read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success("Marked as read");
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to mark as read");
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      await authClient.post("/engagement/notifications/mark_all_read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async () => {
    if (!deleteModal.id) return;
    try {
      await authClient.delete(`/engagement/notifications/${deleteModal.id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteModal.id));
      toast.success("Notification deleted");
      setDeleteModal({ open: false });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1 text-sm rounded-md",
            filter === "all"
              ? "bg-primary text-white"
              : "bg-terminal-bg-secondary hover:bg-terminal-bg-elevated"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-3 py-1 text-sm rounded-md",
            filter === "unread"
              ? "bg-primary text-white"
              : "bg-terminal-bg-secondary hover:bg-terminal-bg-elevated"
          )}
        >
          Unread
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-terminal-bg-secondary rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            {filter === "unread"
              ? "You've read all your notifications."
              : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = getConfig(notification.notification_type);
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  "bg-terminal-bg-secondary rounded-lg p-4 border transition-colors",
                  notification.is_read
                    ? "border-transparent"
                    : "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                      notification.is_read ? "bg-terminal-bg-elevated" : "bg-primary/10"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn("font-medium", !notification.is_read && "text-foreground")}>
                        {notification.title}
                      </h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded", config.color, "bg-current/10")}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        disabled={markingRead === notification.id}
                        className="p-2 text-muted-foreground hover:text-market-up hover:bg-terminal-bg-elevated rounded disabled:opacity-50"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteModal({ open: true, id: notification.id })}
                      className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg-elevated rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open })}
        title="Delete notification?"
        description="This notification will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteNotification}
        onCancel={() => setDeleteModal({ open: false })}
      />
    </div>
  );
}
