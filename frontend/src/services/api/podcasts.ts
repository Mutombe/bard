/**
 * Podcasts API Service
 * Handles podcast shows, episodes, and subscriptions
 */
import { authClient, publicClient } from "./client";

// Types
export interface PodcastHost {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
}

export interface PodcastGuest {
  name: string;
  title: string;
  organization: string;
  bio?: string;
}

export interface PodcastShow {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  short_description?: string;
  cover_image?: string;
  banner_image?: string;
  hosts?: PodcastHost[];
  spotify_url?: string;
  apple_podcasts_url?: string;
  google_podcasts_url?: string;
  youtube_url?: string;
  rss_feed_url?: string;
  frequency?: string;
  publish_day?: string;
  topics?: any[];
  industries?: any[];
  status: string;
  is_featured?: boolean;
  episode_count?: number;
  total_listens?: number;
  subscriber_count?: number;
  recent_episodes?: PodcastEpisode[];
  created_at?: string;
}

export interface PodcastEpisode {
  id: string;
  show?: {
    id: string;
    name: string;
    slug: string;
    cover_image?: string;
  };
  title: string;
  slug: string;
  episode_number?: number;
  season_number?: number;
  description?: string;
  summary?: string;
  show_notes?: string;
  transcript?: string;
  key_topics?: Array<{ timestamp: string; topic: string }>;
  audio_file?: string;
  audio_url?: string;
  video_url?: string;
  duration_seconds?: number;
  duration_formatted?: string;
  cover_image?: string;
  hosts?: PodcastHost[];
  guests?: PodcastGuest[];
  topics?: any[];
  industries?: any[];
  spotify_episode_id?: string;
  apple_episode_id?: string;
  status: string;
  published_at?: string;
  is_featured?: boolean;
  is_premium?: boolean;
  listen_count?: number;
  completion_rate?: number;
  meta_title?: string;
  meta_description?: string;
  related_episodes?: PodcastEpisode[];
  created_at?: string;
  updated_at?: string;
}

export interface PodcastSubscription {
  id: string;
  show: {
    id: string;
    name: string;
    slug: string;
    cover_image?: string;
  };
  notify_new_episodes: boolean;
  created_at: string;
}

export interface PodcastListResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface EpisodeFilters {
  show?: string;
  topic?: string;
  status?: string;
  is_featured?: boolean;
  is_premium?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PodcastStats {
  total_shows: number;
  active_shows: number;
  total_episodes: number;
  published_episodes: number;
  new_this_week: number;
  total_listens: number;
}

// API Service
export const podcastsService = {
  // Shows
  async getShows(): Promise<PodcastShow[]> {
    const response = await publicClient.get("/podcasts/shows/");
    return response.data;
  },

  async getShow(slug: string): Promise<PodcastShow> {
    const response = await publicClient.get(`/podcasts/shows/${slug}/`);
    return response.data;
  },

  async getFeaturedShows(): Promise<PodcastShow[]> {
    const response = await publicClient.get("/podcasts/shows/featured/");
    return response.data;
  },

  async subscribeToShow(slug: string): Promise<{ message: string }> {
    const response = await authClient.post(`/podcasts/shows/${slug}/subscribe/`);
    return response.data;
  },

  async unsubscribeFromShow(slug: string): Promise<{ message: string }> {
    const response = await authClient.post(`/podcasts/shows/${slug}/unsubscribe/`);
    return response.data;
  },

  // Episodes
  async getEpisodes(filters?: EpisodeFilters): Promise<PodcastListResponse<PodcastEpisode>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const response = await publicClient.get(`/podcasts/episodes/?${params.toString()}`);
    return response.data;
  },

  async getEpisode(slug: string): Promise<PodcastEpisode> {
    const response = await publicClient.get(`/podcasts/episodes/${slug}/`);
    return response.data;
  },

  async getFeaturedEpisodes(): Promise<PodcastEpisode[]> {
    const response = await publicClient.get("/podcasts/episodes/featured/");
    return response.data;
  },

  async getLatestEpisodes(): Promise<PodcastEpisode[]> {
    const response = await publicClient.get("/podcasts/episodes/latest/");
    return response.data;
  },

  async trackListen(
    slug: string,
    data: { duration?: number; completion?: number; platform?: string }
  ): Promise<{ message: string }> {
    const response = await publicClient.post(`/podcasts/episodes/${slug}/listen/`, data);
    return response.data;
  },

  // Subscriptions (authenticated)
  async getSubscriptions(): Promise<PodcastSubscription[]> {
    const response = await authClient.get("/podcasts/subscriptions/");
    return response.data;
  },

  // Admin endpoints
  async createShow(data: Partial<PodcastShow>): Promise<PodcastShow> {
    const response = await authClient.post("/podcasts/shows/", data);
    return response.data;
  },

  async updateShow(slug: string, data: Partial<PodcastShow>): Promise<PodcastShow> {
    const response = await authClient.patch(`/podcasts/shows/${slug}/`, data);
    return response.data;
  },

  async deleteShow(slug: string): Promise<void> {
    await authClient.delete(`/podcasts/shows/${slug}/`);
  },

  async createEpisode(data: Partial<PodcastEpisode>): Promise<PodcastEpisode> {
    const response = await authClient.post("/podcasts/episodes/", data);
    return response.data;
  },

  async updateEpisode(slug: string, data: Partial<PodcastEpisode>): Promise<PodcastEpisode> {
    const response = await authClient.patch(`/podcasts/episodes/${slug}/`, data);
    return response.data;
  },

  async deleteEpisode(slug: string): Promise<void> {
    await authClient.delete(`/podcasts/episodes/${slug}/`);
  },

  async getStats(): Promise<PodcastStats> {
    const response = await authClient.get("/podcasts/episodes/stats/");
    return response.data;
  },
};

export default podcastsService;
