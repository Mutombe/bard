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
};
