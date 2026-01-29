import { authClient } from "./client";
import type { PaginatedResponse } from "@/types";

// =========================
// Types
// =========================

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: "super_admin" | "editor" | "analyst" | "subscriber";
  subscription_tier: "free" | "basic" | "professional" | "enterprise";
  is_active: boolean;
  is_email_verified: boolean;
  date_joined: string;
  last_login: string | null;
  profile?: {
    avatar?: string;
    bio?: string;
    job_title?: string;
    company?: string;
  };
}

export interface UserStats {
  total_users: number;
  premium_users: number;
  admin_count: number;
  new_today: number;
}

export interface NewsletterSubscription {
  id: number;
  email: string;
  newsletter_type: "morning_brief" | "evening_wrap" | "weekly_digest" | "breaking_news" | "earnings";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  preferred_exchanges?: string[];
}

export interface NewsletterStats {
  total_subscribers: number;
  active_subscribers: number;
  open_rate: number;
  click_rate: number;
}

// =========================
// API Service
// =========================

export const adminService = {
  // =========================
  // Users
  // =========================

  async getUsers(params?: {
    role?: string;
    subscription_tier?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AdminUser>> {
    try {
      const response = await authClient.get<PaginatedResponse<AdminUser>>("/users/", { params });
      return response.data;
    } catch (error) {
      // If the endpoint doesn't exist, return empty results
      return { results: [], count: 0, next: null, previous: null, total_pages: 0, current_page: 1 };
    }
  },

  async getUser(id: number): Promise<AdminUser> {
    const response = await authClient.get<AdminUser>(`/users/${id}/`);
    return response.data;
  },

  async updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await authClient.patch<AdminUser>(`/users/${id}/`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await authClient.delete(`/users/${id}/`);
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await authClient.get<UserStats>("/users/stats/");
      return response.data;
    } catch {
      // Return placeholder stats if endpoint doesn't exist
      return {
        total_users: 0,
        premium_users: 0,
        admin_count: 0,
        new_today: 0,
      };
    }
  },

  async bulkUserAction(
    action: "activate" | "deactivate" | "delete",
    userIds: number[]
  ): Promise<void> {
    await authClient.post("/users/bulk-action/", {
      action,
      user_ids: userIds,
    });
  },

  // =========================
  // Newsletters
  // =========================

  async getNewsletterSubscriptions(params?: {
    newsletter_type?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<NewsletterSubscription>> {
    try {
      const response = await authClient.get<PaginatedResponse<NewsletterSubscription>>(
        "/engagement/newsletters/",
        { params }
      );
      return response.data;
    } catch {
      return { results: [], count: 0, next: null, previous: null, total_pages: 0, current_page: 1 };
    }
  },

  async getNewsletterStats(): Promise<NewsletterStats> {
    try {
      const response = await authClient.get<NewsletterStats>("/engagement/newsletters/stats/");
      return response.data;
    } catch {
      return {
        total_subscribers: 0,
        active_subscribers: 0,
        open_rate: 0,
        click_rate: 0,
      };
    }
  },

  async createNewsletter(data: {
    subject: string;
    content: string;
    subscription_types: string[];
    scheduled_for?: string;
  }): Promise<{ status: string; emails_sent: number; total_subscribers: number; errors?: any[] }> {
    const response = await authClient.post("/engagement/newsletters/send/", data);
    return response.data;
  },

  async getNewsletters(): Promise<any[]> {
    try {
      const response = await authClient.get("/engagement/newsletters/history/");
      return response.data.results || response.data || [];
    } catch {
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  },
};
