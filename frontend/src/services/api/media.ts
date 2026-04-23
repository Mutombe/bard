import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authClient } from "./client";
import { store } from "@/store";
import { refreshToken, clearAuth } from "@/store/slices/authSlice";
import { getVisitorId } from "@/lib/visitor";
import type { PaginatedResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// A dedicated axios instance for FormData uploads — crucially, NO default
// Content-Type header. If we use the shared authClient (which defaults to
// application/json), axios 1.6's transformRequest silently JSON-ifies the
// FormData and the file never reaches the server. By creating a separate
// client with no Content-Type, the browser's XHR layer sets
// `multipart/form-data; boundary=…` correctly.
const uploadClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 120000, // uploads can be slow on mobile — give them 2 minutes
});

uploadClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const visitorId = getVisitorId();
    if (visitorId && config.headers) {
      config.headers["X-Visitor-Id"] = visitorId;
    }
  }
  return config;
});

// Refresh-and-retry on 401 so a stale access token during a long editing
// session doesn't silently kill uploads. Mirrors authClient's logic but
// simpler — uploads are less concurrent so no queue is needed.
uploadClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const result = await store.dispatch(refreshToken()).unwrap();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${result.access}`;
        }
        return uploadClient(originalRequest);
      } catch {
        store.dispatch(clearAuth());
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
      }
    }
    return Promise.reject(error);
  }
);

// =========================
// Types
// =========================

export interface MediaFile {
  id: number;
  name: string;
  file: string;
  url: string;
  file_type: "image" | "video" | "document" | "audio" | "other";
  mime_type: string;
  size: number;
  size_display: string;
  width?: number;
  height?: number;
  dimensions?: string;
  alt_text: string;
  caption: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface MediaStats {
  total_files: number;
  total_size: number;
  total_size_display: string;
  by_type: Record<string, number>;
}

// =========================
// API Service
// =========================

export const mediaService = {
  // =========================
  // Media Library
  // =========================

  async getFiles(params?: {
    file_type?: string;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<MediaFile>> {
    try {
      const response = await authClient.get<PaginatedResponse<MediaFile>>("/media/library/", { params });
      return response.data;
    } catch (error) {
      return { results: [], count: 0, next: null, previous: null, total_pages: 0, current_page: 1 };
    }
  },

  async getFile(id: number): Promise<MediaFile> {
    const response = await authClient.get<MediaFile>(`/media/library/${id}/`);
    return response.data;
  },

  async uploadFile(file: File, data?: { name?: string; alt_text?: string; caption?: string }): Promise<MediaFile> {
    const formData = new FormData();
    formData.append("file", file);
    // Use provided name or default to filename
    formData.append("name", data?.name || file.name);
    if (data?.alt_text) formData.append("alt_text", data.alt_text);
    if (data?.caption) formData.append("caption", data.caption);

    // Use the dedicated uploadClient (no default Content-Type) so the browser
    // sets `multipart/form-data; boundary=…` with a real boundary. If the
    // shared authClient were used, axios 1.6's transformRequest would JSON-ify
    // the FormData and the file would be lost.
    const response = await uploadClient.post<MediaFile>("/media/library/", formData);
    return response.data;
  },

  async deleteFile(id: number): Promise<void> {
    await authClient.delete(`/media/library/${id}/`);
  },

  async bulkDelete(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    const response = await authClient.post<{ message: string; deleted_count: number }>(
      "/media/library/bulk_delete/",
      { ids }
    );
    return response.data;
  },

  async getStats(): Promise<MediaStats> {
    try {
      const response = await authClient.get<MediaStats>("/media/library/stats/");
      return response.data;
    } catch {
      return { total_files: 0, total_size: 0, total_size_display: "0 B", by_type: {} };
    }
  },

  getDownloadUrl(id: number): string {
    return `/api/media/library/${id}/download/`;
  },

  // =========================
  // Unsplash Search
  // =========================

  async searchUnsplash(params: {
    q: string;
    orientation?: "landscape" | "portrait" | "squarish";
    per_page?: number;
    page?: number;
  }): Promise<{
    results: Array<{ id: string; url: string; thumb: string; photographer: string; alt: string }>;
    query: string;
    page: number;
    per_page: number;
  }> {
    const response = await authClient.get("/media/unsplash/search/", { params });
    return response.data;
  },
};
