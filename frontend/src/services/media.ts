/**
 * Media API Service - Videos and Podcasts
 */
import apiClient from "./api/client";

// Types
export interface YouTubeVideo {
  video_id: string;
  title: string;
  description: string;
  channel_id: string;
  channel_title: string;
  published_at: string | null;
  thumbnail_url: string;
  duration: string;
  duration_seconds: number;
  duration_formatted: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  tags: string[];
  video_url: string;
  embed_url: string;
}

export interface Video {
  id: number;
  title: string;
  slug: string;
  description: string;
  platform: "youtube" | "vimeo" | "upload";
  video_id: string;
  video_url: string;
  embed_url: string;
  thumbnail_url: string;
  duration: string;
  duration_seconds: number;
  duration_formatted: string;
  channel_id: string;
  channel_title: string;
  published_at: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  category: number | null;
  category_name: string | null;
  author: number | null;
  author_name: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface VideoListItem {
  id: number;
  title: string;
  slug: string;
  platform: string;
  video_id: string;
  thumbnail_url: string;
  duration_seconds: number;
  duration_formatted: string;
  channel_title: string;
  published_at: string | null;
  view_count: number;
  category_name: string | null;
  is_featured: boolean;
}

export interface VideoCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  video_count: number;
}

export interface PodcastShow {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover_image: string | null;
  cover_url: string;
  spotify_url: string;
  apple_podcasts_url: string;
  youtube_playlist_id: string;
  rss_feed: string;
  is_active: boolean;
  episode_count: number;
  created_at: string;
}

export interface PodcastEpisode {
  id: number;
  show: number;
  show_name: string;
  show_slug: string;
  title: string;
  slug: string;
  description: string;
  season: number;
  episode_number: number;
  platform: string;
  video_id: string;
  audio_url: string;
  thumbnail_url: string;
  duration: string;
  duration_seconds: number;
  duration_formatted: string;
  published_at: string | null;
  view_count: number;
  like_count: number;
  status: string;
  is_featured: boolean;
  guests: string[];
  embed_url: string;
  created_at: string;
}

export interface PodcastEpisodeListItem {
  id: number;
  show: number;
  show_name: string;
  title: string;
  slug: string;
  thumbnail_url: string;
  duration_seconds: number;
  duration_formatted: string;
  published_at: string | null;
  view_count: number;
  is_featured: boolean;
  guests: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Media API Service
export const mediaService = {
  // Videos
  async getVideos(params?: {
    page?: number;
    category?: string;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<VideoListItem>> {
    const response = await apiClient.get("/media/videos/", { params });
    return response.data;
  },

  async getVideo(slug: string): Promise<Video> {
    const response = await apiClient.get(`/media/videos/${slug}/`);
    return response.data;
  },

  async getFeaturedVideos(): Promise<VideoListItem[]> {
    const response = await apiClient.get("/media/videos/featured/");
    return response.data;
  },

  async getLatestVideos(): Promise<VideoListItem[]> {
    const response = await apiClient.get("/media/videos/latest/");
    return response.data;
  },

  // YouTube Live Search
  async searchYouTube(params?: {
    q?: string;
    max_results?: number;
    region?: string;
  }): Promise<YouTubeVideo[]> {
    const response = await apiClient.get("/media/videos/youtube_search/", { params });
    return response.data;
  },

  async getYouTubeFinanceVideos(params?: {
    region?: string;
    max_results?: number;
  }): Promise<YouTubeVideo[]> {
    const response = await apiClient.get("/media/videos/youtube_finance/", { params });
    return response.data;
  },

  async importYouTubeVideo(videoId: string): Promise<Video> {
    const response = await apiClient.post("/media/videos/import_youtube/", {
      video_id: videoId,
    });
    return response.data;
  },

  // Video Categories
  async getCategories(): Promise<VideoCategory[]> {
    const response = await apiClient.get("/media/categories/");
    return response.data;
  },

  // Podcasts - Shows
  async getPodcastShows(): Promise<PodcastShow[]> {
    const response = await apiClient.get("/media/podcasts/shows/");
    return response.data;
  },

  async getPodcastShow(slug: string): Promise<PodcastShow> {
    const response = await apiClient.get(`/media/podcasts/shows/${slug}/`);
    return response.data;
  },

  async getShowEpisodes(slug: string): Promise<PodcastEpisodeListItem[]> {
    const response = await apiClient.get(`/media/podcasts/shows/${slug}/episodes/`);
    return response.data;
  },

  // Podcasts - Episodes
  async getPodcastEpisodes(params?: {
    page?: number;
    show?: number;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<PodcastEpisodeListItem>> {
    const response = await apiClient.get("/media/podcasts/episodes/", { params });
    return response.data;
  },

  async getPodcastEpisode(id: number): Promise<PodcastEpisode> {
    const response = await apiClient.get(`/media/podcasts/episodes/${id}/`);
    return response.data;
  },

  async getFeaturedEpisodes(): Promise<PodcastEpisodeListItem[]> {
    const response = await apiClient.get("/media/podcasts/episodes/featured/");
    return response.data;
  },

  async getLatestEpisodes(): Promise<PodcastEpisodeListItem[]> {
    const response = await apiClient.get("/media/podcasts/episodes/latest/");
    return response.data;
  },
};

export default mediaService;
