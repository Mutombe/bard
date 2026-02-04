/**
 * Research API Service
 * Handles research reports, topics, and industries
 */
import { authClient, publicClient } from "./client";

// Types
export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_featured?: boolean;
  article_count?: number;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_featured?: boolean;
  cover_image?: string;
}

export interface ResearchAuthor {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  abstract: string;
  content?: string;
  key_findings?: string[];
  methodology?: string;
  data_sources?: string;
  report_type: string;
  topics?: Topic[];
  industries?: Industry[];
  countries?: any[];
  lead_author?: ResearchAuthor;
  contributing_authors?: ResearchAuthor[];
  external_authors?: Array<{
    name: string;
    title: string;
    organization: string;
  }>;
  cover_image?: string;
  cover_image_url?: string;
  image_url?: string;
  pdf_file?: string;
  status: string;
  published_at?: string;
  is_featured?: boolean;
  is_premium?: boolean;
  view_count?: number;
  download_count?: number;
  read_time_minutes?: number;
  page_count?: number;
  meta_title?: string;
  meta_description?: string;
  related_reports?: ResearchReport[];
  created_at?: string;
  updated_at?: string;
}

export interface ResearchListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ResearchReport[];
}

export interface ResearchFilters {
  topic?: string;
  industry?: string;
  country?: string;
  report_type?: string;
  is_featured?: boolean;
  is_premium?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface ResearchStats {
  total: number;
  published: number;
  drafts: number;
  in_review: number;
  this_month: number;
  total_downloads: number;
}

// API Service
export const researchService = {
  // Topics
  async getTopics(): Promise<Topic[]> {
    const response = await publicClient.get("/research/topics/");
    return response.data;
  },

  async getTopic(slug: string): Promise<Topic> {
    const response = await publicClient.get(`/research/topics/${slug}/`);
    return response.data;
  },

  async getFeaturedTopics(): Promise<Topic[]> {
    const response = await publicClient.get("/research/topics/featured/");
    return response.data;
  },

  // Industries
  async getIndustries(): Promise<Industry[]> {
    const response = await publicClient.get("/research/industries/");
    return response.data;
  },

  async getIndustry(slug: string): Promise<Industry> {
    const response = await publicClient.get(`/research/industries/${slug}/`);
    return response.data;
  },

  async getFeaturedIndustries(): Promise<Industry[]> {
    const response = await publicClient.get("/research/industries/featured/");
    return response.data;
  },

  // Research Reports
  async getReports(filters?: ResearchFilters): Promise<ResearchListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const response = await publicClient.get(`/research/reports/?${params.toString()}`);
    return response.data;
  },

  async getReport(slug: string): Promise<ResearchReport> {
    const response = await publicClient.get(`/research/reports/${slug}/`);
    return response.data;
  },

  async getFeaturedReports(): Promise<ResearchReport[]> {
    const response = await publicClient.get("/research/reports/featured/");
    return response.data;
  },

  async downloadReport(slug: string): Promise<{ message: string; pdf_url?: string }> {
    const response = await authClient.post(`/research/reports/${slug}/download/`);
    return response.data;
  },

  // Admin endpoints
  async createReport(data: Partial<ResearchReport>): Promise<ResearchReport> {
    const response = await authClient.post("/research/reports/", data);
    return response.data;
  },

  async updateReport(slug: string, data: Partial<ResearchReport>): Promise<ResearchReport> {
    const response = await authClient.patch(`/research/reports/${slug}/`, data);
    return response.data;
  },

  async deleteReport(slug: string): Promise<void> {
    await authClient.delete(`/research/reports/${slug}/`);
  },

  async getStats(): Promise<ResearchStats> {
    const response = await authClient.get("/research/reports/stats/");
    return response.data;
  },

  // Topic management (admin)
  async createTopic(data: Partial<Topic>): Promise<Topic> {
    const response = await authClient.post("/research/topics/", data);
    return response.data;
  },

  async updateTopic(slug: string, data: Partial<Topic>): Promise<Topic> {
    const response = await authClient.patch(`/research/topics/${slug}/`, data);
    return response.data;
  },

  async deleteTopic(slug: string): Promise<void> {
    await authClient.delete(`/research/topics/${slug}/`);
  },

  // Industry management (admin)
  async createIndustry(data: Partial<Industry>): Promise<Industry> {
    const response = await authClient.post("/research/industries/", data);
    return response.data;
  },

  async updateIndustry(slug: string, data: Partial<Industry>): Promise<Industry> {
    const response = await authClient.patch(`/research/industries/${slug}/`, data);
    return response.data;
  },

  async deleteIndustry(slug: string): Promise<void> {
    await authClient.delete(`/research/industries/${slug}/`);
  },
};

export default researchService;
