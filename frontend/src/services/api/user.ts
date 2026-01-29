import apiClient from "./client";
import type { Company, Notification, PriceAlert, UserProfile } from "@/types";

export const userService = {
  // =========================
  // Profile
  // =========================

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/users/me/profile/");
    return response.data;
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>("/users/me/profile/", data);
    return response.data;
  },

  async updatePreferences(preferences: Record<string, any>): Promise<{ preferences: Record<string, any> }> {
    const response = await apiClient.patch("/users/me/preferences/", preferences);
    return response.data;
  },

  // =========================
  // Watchlist
  // =========================

  async getWatchlist(): Promise<Company[]> {
    const response = await apiClient.get<Company[]>("/users/me/watchlist/");
    return response.data;
  },

  async addToWatchlist(companyId: string): Promise<{ message: string }> {
    const response = await apiClient.post("/users/me/watchlist/", {
      company_id: companyId,
    });
    return response.data;
  },

  async removeFromWatchlist(companyId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/users/me/watchlist/${companyId}/`);
    return response.data;
  },

  // =========================
  // Notifications
  // =========================

  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<{ results: Notification[] } | Notification[]>("/engagement/notifications/");
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>("/engagement/notifications/unread/");
    return response.data;
  },

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>("/engagement/notifications/unread_count/");
    return response.data;
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/engagement/notifications/${notificationId}/mark-read/`);
  },

  async markAllNotificationsAsRead(): Promise<void> {
    await apiClient.post("/engagement/notifications/mark-all-read/");
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/engagement/notifications/${notificationId}/`);
  },

  // =========================
  // Price Alerts
  // =========================

  async getPriceAlerts(): Promise<PriceAlert[]> {
    const response = await apiClient.get<PriceAlert[]>("/engagement/alerts/");
    return response.data;
  },

  async createPriceAlert(data: {
    company: string;
    alert_type: "above" | "below" | "percent_change";
    target_price?: number;
    target_percent?: number;
    expires_at?: string;
  }): Promise<PriceAlert> {
    const response = await apiClient.post<PriceAlert>("/engagement/alerts/", data);
    return response.data;
  },

  async cancelPriceAlert(alertId: string): Promise<void> {
    await apiClient.post(`/engagement/alerts/${alertId}/cancel/`);
  },

  async deletePriceAlert(alertId: string): Promise<void> {
    await apiClient.delete(`/engagement/alerts/${alertId}/`);
  },
};
