import { publicClient } from "./client";
import apiClient from "./client";
import type {
  NewsArticle,
  Category,
  Tag,
  CursorPaginatedResponse,
} from "@/types";

export const newsService = {
  // =========================
  // Categories
  // =========================

  async getCategories(): Promise<Category[]> {
    const response = await publicClient.get<Category[]>("/news/categories/");
    return response.data;
  },

  async getCategory(slug: string): Promise<Category> {
    const response = await publicClient.get<Category>(`/news/categories/${slug}/`);
    return response.data;
  },

  // =========================
  // Tags
  // =========================

  async getTags(): Promise<Tag[]> {
    const response = await publicClient.get<Tag[]>("/news/tags/");
    return response.data;
  },

  // =========================
  // Articles
  // =========================

  async getArticles(params?: {
    category?: string;
    tag?: string;
    content_type?: string;
    company?: string;
    is_featured?: boolean;
    is_premium?: boolean;
    cursor?: string;
    search?: string;
  }): Promise<CursorPaginatedResponse<NewsArticle>> {
    const response = await publicClient.get<CursorPaginatedResponse<NewsArticle>>(
      "/news/articles/",
      { params }
    );
    return response.data;
  },

  async getArticle(slug: string): Promise<NewsArticle> {
    const response = await publicClient.get<NewsArticle>(`/news/articles/${slug}/`);
    return response.data;
  },

  async getFeaturedArticles(): Promise<NewsArticle[]> {
    const response = await publicClient.get<NewsArticle[]>("/news/articles/featured/");
    return response.data;
  },

  async getBreakingNews(): Promise<NewsArticle[]> {
    const response = await publicClient.get<NewsArticle[]>("/news/articles/breaking/");
    return response.data;
  },

  async getArticlesByCompany(companyId: string): Promise<CursorPaginatedResponse<NewsArticle>> {
    const response = await publicClient.get<CursorPaginatedResponse<NewsArticle>>(
      `/news/articles/by-company/${companyId}/`
    );
    return response.data;
  },

  // =========================
  // Editor Actions (Authenticated)
  // =========================

  async createArticle(data: {
    title: string;
    subtitle?: string;
    excerpt: string;
    content: string;
    category: string;
    tags?: string[];
    content_type?: string;
    related_companies?: string[];
    is_featured?: boolean;
    is_breaking?: boolean;
    is_premium?: boolean;
  }): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>("/news/articles/", data);
    return response.data;
  },

  async updateArticle(
    slug: string,
    data: Partial<{
      title: string;
      subtitle: string;
      excerpt: string;
      content: string;
      category: string;
      tags: string[];
      content_type: string;
      related_companies: string[];
      is_featured: boolean;
      is_breaking: boolean;
      is_premium: boolean;
    }>
  ): Promise<NewsArticle> {
    const response = await apiClient.patch<NewsArticle>(`/news/articles/${slug}/`, data);
    return response.data;
  },

  async publishArticle(slug: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/news/articles/${slug}/publish/`);
    return response.data;
  },
};
