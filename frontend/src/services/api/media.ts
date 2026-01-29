import { authClient } from "./client";
import type { PaginatedResponse } from "@/types";

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

    const response = await authClient.post<MediaFile>("/media/library/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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
