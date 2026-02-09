import apiClient, { publicClient } from "./client";
import type { User, AuthTokens } from "@/types";

interface LoginResponse extends AuthTokens {
  user: User;
}

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await publicClient.post<LoginResponse>("/auth/token/", credentials);
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ message: string; user: User }> {
    const response = await publicClient.post("/users/registration/register/", data);
    return response.data;
  },

  /**
   * Logout - blacklist refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post("/auth/logout/", { refresh: refreshToken });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await publicClient.post<{ access: string }>("/auth/token/refresh/", {
      refresh,
    });
    return response.data;
  },

  /**
   * Verify token is valid
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await publicClient.post("/auth/token/verify/", { token });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/users/me/");
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> {
    await apiClient.post("/auth/password/change/", data);
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await publicClient.post("/auth/password/reset/", { email });
  },

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: {
    token: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> {
    await publicClient.post("/auth/password/reset/confirm/", data);
  },

  /**
   * Authenticate with Google OAuth
   */
  async googleAuth(credential: string): Promise<LoginResponse> {
    const response = await publicClient.post<LoginResponse>("/auth/google/", { credential });
    return response.data;
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post<{ avatar: string }>("/users/me/avatar/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    company?: string;
    job_title?: string;
    phone?: string;
    country?: string;
    timezone?: string;
  }): Promise<User> {
    const response = await apiClient.patch<User>("/users/me/", data);
    return response.data;
  },

  // =========================
  // Author Following
  // =========================

  /**
   * Get list of followed authors
   */
  async getFollowedAuthors(): Promise<Array<{ id: string; full_name: string; email: string; avatar: string | null }>> {
    const response = await apiClient.get("/users/me/following/");
    return response.data;
  },

  /**
   * Check if following an author
   */
  async checkFollowing(authorId: string): Promise<{ is_following: boolean; author_id: string; author_name: string }> {
    const response = await apiClient.get(`/users/me/following/${authorId}/`);
    return response.data;
  },

  /**
   * Follow an author
   */
  async followAuthor(authorId: string): Promise<{ is_following: boolean; message: string }> {
    const response = await apiClient.post(`/users/me/follow/${authorId}/`);
    return response.data;
  },

  /**
   * Unfollow an author
   */
  async unfollowAuthor(authorId: string): Promise<{ is_following: boolean; message: string }> {
    const response = await apiClient.delete(`/users/me/follow/${authorId}/`);
    return response.data;
  },
};
