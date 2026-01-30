"use client";

/**
 * Media Data Hooks
 *
 * SWR hooks for fetching videos, podcasts, and YouTube content.
 */
import useSWR from "swr";
import { mediaService } from "@/services/media";
import type {
  Video,
  VideoListItem,
  VideoCategory,
  YouTubeVideo,
  PodcastShow,
  PodcastEpisode,
  PodcastEpisodeListItem,
  PaginatedResponse,
} from "@/services/media";

// =========================
// Videos
// =========================

export interface UseVideosParams {
  page?: number;
  category?: string;
  search?: string;
  ordering?: string;
}

export function useVideos(params?: UseVideosParams) {
  const paramString = params ? JSON.stringify(params) : "";
  const key = `/media/videos/?${paramString}`;

  return useSWR<PaginatedResponse<VideoListItem>>(
    key,
    () => mediaService.getVideos(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );
}

export function useVideo(slug: string | null) {
  return useSWR<Video>(
    slug ? `/media/videos/${slug}/` : null,
    () => mediaService.getVideo(slug!),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useFeaturedVideos() {
  return useSWR<VideoListItem[]>(
    "/media/videos/featured/",
    () => mediaService.getFeaturedVideos(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );
}

export function useLatestVideos() {
  return useSWR<VideoListItem[]>(
    "/media/videos/latest/",
    () => mediaService.getLatestVideos(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );
}

export function useVideoCategories() {
  return useSWR<VideoCategory[]>(
    "/media/categories/",
    () => mediaService.getCategories(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

// =========================
// YouTube
// =========================

export interface UseYouTubeSearchParams {
  q?: string;
  max_results?: number;
  region?: string;
}

export function useYouTubeSearch(params?: UseYouTubeSearchParams) {
  const hasQuery = params?.q && params.q.length >= 2;
  const paramString = params ? JSON.stringify(params) : "";

  return useSWR<YouTubeVideo[]>(
    hasQuery ? `/media/videos/youtube_search/?${paramString}` : null,
    () => mediaService.searchYouTube(params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}

export function useYouTubeFinanceVideos(region: string = "africa", maxResults: number = 10) {
  return useSWR<YouTubeVideo[]>(
    `/media/videos/youtube_finance/?region=${region}&max_results=${maxResults}`,
    () => mediaService.getYouTubeFinanceVideos({ region, max_results: maxResults }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 300000, // Auto-refresh every 5 minutes
    }
  );
}

/**
 * Live YouTube Videos (always fetches from YouTube API)
 *
 * Use this when you need real-time videos directly from YouTube.
 * Falls back to searchYouTube with African finance query.
 */
export function useLiveYouTubeVideos(maxResults: number = 5) {
  const defaultQuery = "African stock market OR CNBC Africa OR JSE news";
  return useSWR<YouTubeVideo[]>(
    `/media/videos/youtube_search/?q=${encodeURIComponent(defaultQuery)}&max_results=${maxResults}`,
    () => mediaService.searchYouTube({ q: defaultQuery, max_results: maxResults }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 300000, // 5 minutes (longer cache since it's live API)
      refreshInterval: 600000, // Auto-refresh every 10 minutes
    }
  );
}

/**
 * CNBC Africa Featured Video
 *
 * Returns the latest CNBC Africa video.
 * This video is refreshed every hour on the backend.
 */
export function useCNBCAfricaVideo() {
  return useSWR<YouTubeVideo | null>(
    "/media/videos/cnbc_africa/",
    () => mediaService.getCNBCAfricaVideo(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 3600000, // Auto-refresh every hour
    }
  );
}

// =========================
// Podcasts
// =========================

export function usePodcastShows() {
  return useSWR<PodcastShow[]>(
    "/media/podcasts/shows/",
    () => mediaService.getPodcastShows(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

export function usePodcastShow(slug: string | null) {
  return useSWR<PodcastShow>(
    slug ? `/media/podcasts/shows/${slug}/` : null,
    () => mediaService.getPodcastShow(slug!),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useShowEpisodes(showSlug: string | null) {
  return useSWR<PodcastEpisodeListItem[]>(
    showSlug ? `/media/podcasts/shows/${showSlug}/episodes/` : null,
    () => mediaService.getShowEpisodes(showSlug!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );
}

export interface UsePodcastEpisodesParams {
  page?: number;
  show?: number;
  search?: string;
  ordering?: string;
}

export function usePodcastEpisodes(params?: UsePodcastEpisodesParams) {
  const paramString = params ? JSON.stringify(params) : "";
  const key = `/media/podcasts/episodes/?${paramString}`;

  return useSWR<PaginatedResponse<PodcastEpisodeListItem>>(
    key,
    () => mediaService.getPodcastEpisodes(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );
}

export function usePodcastEpisode(id: number | null) {
  return useSWR<PodcastEpisode>(
    id ? `/media/podcasts/episodes/${id}/` : null,
    () => mediaService.getPodcastEpisode(id!),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useFeaturedEpisodes() {
  return useSWR<PodcastEpisodeListItem[]>(
    "/media/podcasts/episodes/featured/",
    () => mediaService.getFeaturedEpisodes(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );
}

export function useLatestEpisodes() {
  return useSWR<PodcastEpisodeListItem[]>(
    "/media/podcasts/episodes/latest/",
    () => mediaService.getLatestEpisodes(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );
}
