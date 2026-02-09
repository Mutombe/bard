import { publicClient, authClient } from "./client";
import apiClient from "./client";
import type {
  NewsArticle,
  Category,
  Tag,
  CursorPaginatedResponse,
  PaginatedResponse,
} from "@/types";

// =========================
// Comment Types
// =========================

export interface CommentAuthor {
  id: string;
  full_name: string;
  email: string;
  avatar?: string | null;
}

export interface Comment {
  id: number;
  article: string;
  author: CommentAuthor;
  parent: number | null;
  content: string;
  likes_count: number;
  is_liked: boolean;
  is_approved: boolean;
  is_edited: boolean;
  edited_at: string | null;
  reply_count: number;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export const newsService = {
  // =========================
  // Categories
  // =========================

  async getCategories(): Promise<Category[]> {
    const response = await publicClient.get<{ results: Category[] } | Category[]>("/news/categories/");
    // Handle both paginated and direct array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getCategory(slug: string): Promise<Category> {
    const response = await publicClient.get<Category>(`/news/categories/${slug}/`);
    return response.data;
  },

  // =========================
  // Tags
  // =========================

  async getTags(): Promise<Tag[]> {
    const response = await publicClient.get<{ results: Tag[] } | Tag[]>("/news/tags/");
    // Handle both paginated and direct array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
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
    page_size?: number;
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

  // =========================
  // Comments
  // =========================

  async getComments(articleId: string, page?: number): Promise<PaginatedResponse<Comment>> {
    const response = await publicClient.get<PaginatedResponse<Comment>>(
      `/news/comments/article/${articleId}/`,
      { params: { page } }
    );
    return response.data;
  },

  async createComment(data: {
    article: string;
    content: string;
    parent?: number | null;
  }): Promise<Comment> {
    const response = await authClient.post<Comment>("/news/comments/", data);
    return response.data;
  },

  async updateComment(id: number, content: string): Promise<Comment> {
    const response = await authClient.patch<Comment>(`/news/comments/${id}/`, { content });
    return response.data;
  },

  async deleteComment(id: number): Promise<void> {
    await authClient.delete(`/news/comments/${id}/`);
  },

  async likeComment(id: number): Promise<{ liked: boolean; likes_count: number }> {
    const response = await authClient.post<{ liked: boolean; likes_count: number }>(
      `/news/comments/${id}/like/`
    );
    return response.data;
  },
};
