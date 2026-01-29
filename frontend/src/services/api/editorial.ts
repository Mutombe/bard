import { authClient } from "./client";
import type { PaginatedResponse } from "@/types";

// =========================
// Types
// =========================

export interface Article {
  id: string; // UUID
  title: string;
  slug: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  featured_image_url?: string;
  featured_image_caption?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{ id: string; name: string; slug: string } | string>;
  content_type: string;
  author: {
    id: string;
    email: string;
    full_name: string;
  } | null;
  editor?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
  status: string;
  published_at?: string;
  is_featured: boolean;
  is_breaking: boolean;
  is_premium: boolean;
  view_count: number;
  read_time_minutes: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContentBucket {
  id: number;
  name: string;
  slug: string;
  description?: string;
  bucket_type: "CAMPAIGN" | "SERIES" | "THEME" | "EVENT" | "SECTION";
  is_active: boolean;
  articles_count: number;
  created_at: string;
}

export interface ArticleRevision {
  id: number;
  article: number;
  revision_number: number;
  title: string;
  content: string;
  editor: {
    id: number;
    full_name: string;
  };
  change_summary?: string;
  created_at: string;
}

export interface EditorialNote {
  id: number;
  article: number;
  author: {
    id: number;
    full_name: string;
  };
  note_type: "COMMENT" | "SUGGESTION" | "ISSUE" | "APPROVAL";
  content: string;
  is_resolved: boolean;
  created_at: string;
}

export interface EditorialAssignment {
  id: number;
  article: {
    id: number;
    title: string;
    slug: string;
  };
  assigned_to: {
    id: number;
    full_name: string;
  };
  assigned_by: {
    id: number;
    full_name: string;
  };
  assignment_type: "WRITE" | "EDIT" | "REVIEW" | "PROOFREAD" | "FACT_CHECK";
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "REJECTED";
  due_date?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string;
  created_at: string;
}

// Input type for creating/updating articles (accepts slug strings instead of objects)
export interface ArticleInput {
  title?: string;
  slug?: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  featured_image_caption?: string;
  category?: string; // Accepts category slug
  tags?: string[]; // Accepts tag slugs
  content_type?: string;
  status?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_premium?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface ContentCalendarItem {
  id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  article?: {
    id: number;
    title: string;
    status: string;
  };
  status: "SCHEDULED" | "PUBLISHED" | "CANCELLED";
  category?: {
    id: number;
    name: string;
  };
}

export interface EditorDashboard {
  articles_count: number;
  published_today: number;
  pending_review: number;
  draft_count: number;
  my_assignments: number;
  recent_activity: Array<{
    id: number;
    action_type: string;
    details: string;
    created_at: string;
  }>;
}

// =========================
// API Service
// =========================

export const editorialService = {
  // =========================
  // Articles
  // =========================

  async getArticles(params?: {
    status?: string;
    content_type?: string;
    category?: string;
    author?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Article>> {
    const response = await authClient.get<PaginatedResponse<Article>>("/news/articles/", { params });
    return response.data;
  },

  async getArticle(slug: string): Promise<Article> {
    const response = await authClient.get<Article>(`/news/articles/${slug}/`);
    return response.data;
  },

  async createArticle(data: {
    title: string;
    excerpt: string;
    content: string;
    category: string; // slug
    subtitle?: string;
    tags?: string[]; // slugs
    content_type?: string;
    status?: string;
    is_featured?: boolean;
    is_breaking?: boolean;
    is_premium?: boolean;
    featured_image_url?: string;
    featured_image_caption?: string;
    meta_title?: string;
    meta_description?: string;
  }): Promise<Article> {
    // Ensure status is lowercase for backend
    const payload = {
      ...data,
      status: data.status?.toLowerCase() || "draft",
    };
    const response = await authClient.post<Article>("/news/articles/", payload);
    return response.data;
  },

  async updateArticle(slug: string, data: ArticleInput): Promise<Article> {
    const response = await authClient.patch<Article>(`/news/articles/${slug}/`, data);
    return response.data;
  },

  async deleteArticle(idOrSlug: string): Promise<void> {
    // UUIDs contain hyphens, slugs typically don't have the UUID pattern
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      await authClient.delete(`/news/articles/by-id/${idOrSlug}/`);
    } else {
      await authClient.delete(`/news/articles/${idOrSlug}/`);
    }
  },

  async publishArticle(slug: string): Promise<Article> {
    const response = await authClient.post<Article>(`/news/articles/${slug}/publish/`);
    return response.data;
  },

  async getFeaturedArticles(): Promise<Article[]> {
    const response = await authClient.get<Article[]>("/news/articles/featured/");
    return response.data;
  },

  // =========================
  // Content Buckets
  // =========================

  async getBuckets(): Promise<ContentBucket[]> {
    const response = await authClient.get<ContentBucket[]>("/editorial/buckets/");
    return response.data;
  },

  async createBucket(data: Partial<ContentBucket>): Promise<ContentBucket> {
    const response = await authClient.post<ContentBucket>("/editorial/buckets/", data);
    return response.data;
  },

  async addArticleToBucket(bucketSlug: string, articleId: number): Promise<void> {
    await authClient.post(`/editorial/buckets/${bucketSlug}/add-article/`, { article_id: articleId });
  },

  async removeArticleFromBucket(bucketSlug: string, articleId: number): Promise<void> {
    await authClient.delete(`/editorial/buckets/${bucketSlug}/remove-article/`, {
      data: { article_id: articleId },
    });
  },

  // =========================
  // Revisions
  // =========================

  async getRevisions(articleId: number): Promise<ArticleRevision[]> {
    const response = await authClient.get<ArticleRevision[]>("/editorial/revisions/", {
      params: { article: articleId },
    });
    return response.data;
  },

  async restoreRevision(revisionId: number): Promise<Article> {
    const response = await authClient.post<Article>(`/editorial/revisions/${revisionId}/restore/`);
    return response.data;
  },

  // =========================
  // Editorial Notes
  // =========================

  async getNotes(articleId: number): Promise<EditorialNote[]> {
    const response = await authClient.get<EditorialNote[]>("/editorial/notes/", {
      params: { article: articleId },
    });
    return response.data;
  },

  async createNote(articleId: number, data: { note_type: string; content: string }): Promise<EditorialNote> {
    const response = await authClient.post<EditorialNote>("/editorial/notes/", {
      article: articleId,
      ...data,
    });
    return response.data;
  },

  async resolveNote(noteId: number): Promise<EditorialNote> {
    const response = await authClient.post<EditorialNote>(`/editorial/notes/${noteId}/resolve/`);
    return response.data;
  },

  // =========================
  // Assignments
  // =========================

  async getAssignments(params?: { status?: string }): Promise<EditorialAssignment[]> {
    const response = await authClient.get<EditorialAssignment[]>("/editorial/assignments/", { params });
    return response.data;
  },

  async getMyAssignments(): Promise<EditorialAssignment[]> {
    const response = await authClient.get<EditorialAssignment[]>("/editorial/assignments/my_assignments/");
    return response.data;
  },

  async createAssignment(data: Partial<EditorialAssignment>): Promise<EditorialAssignment> {
    const response = await authClient.post<EditorialAssignment>("/editorial/assignments/", data);
    return response.data;
  },

  async acceptAssignment(assignmentId: number): Promise<EditorialAssignment> {
    const response = await authClient.post<EditorialAssignment>(
      `/editorial/assignments/${assignmentId}/accept/`
    );
    return response.data;
  },

  async submitAssignment(assignmentId: number): Promise<EditorialAssignment> {
    const response = await authClient.post<EditorialAssignment>(
      `/editorial/assignments/${assignmentId}/submit/`
    );
    return response.data;
  },

  async completeAssignment(assignmentId: number): Promise<EditorialAssignment> {
    const response = await authClient.post<EditorialAssignment>(
      `/editorial/assignments/${assignmentId}/complete/`
    );
    return response.data;
  },

  // =========================
  // Content Calendar
  // =========================

  async getCalendarItems(params?: { month?: string; week?: string }): Promise<ContentCalendarItem[]> {
    const response = await authClient.get<ContentCalendarItem[]>("/editorial/calendar/", { params });
    return response.data;
  },

  async createCalendarItem(data: Partial<ContentCalendarItem>): Promise<ContentCalendarItem> {
    const response = await authClient.post<ContentCalendarItem>("/editorial/calendar/", data);
    return response.data;
  },

  async getWeeklyCalendar(): Promise<ContentCalendarItem[]> {
    const response = await authClient.get<ContentCalendarItem[]>("/editorial/calendar/week/");
    return response.data;
  },

  async getMonthlyCalendar(): Promise<ContentCalendarItem[]> {
    const response = await authClient.get<ContentCalendarItem[]>("/editorial/calendar/month/");
    return response.data;
  },

  // =========================
  // Dashboard
  // =========================

  async getDashboard(): Promise<EditorDashboard> {
    const response = await authClient.get<EditorDashboard>("/editorial/dashboard/");
    return response.data;
  },

  // =========================
  // Bulk Actions
  // =========================

  async bulkAction(
    action: "publish" | "unpublish" | "delete" | "add_to_bucket" | "remove_from_bucket" | "assign",
    articleIds: string[],
    extraData?: Record<string, any>
  ): Promise<void> {
    await authClient.post("/editorial/bulk-action/", {
      action,
      article_ids: articleIds,
      ...extraData,
    });
  },
};
