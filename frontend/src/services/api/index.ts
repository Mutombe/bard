// API Services barrel export
export { default as apiClient, publicClient } from "./client";
export { authService } from "./auth";
export { marketService } from "./market";
export { userService } from "./user";
export { newsService } from "./news";
export { mediaService } from "./media";
export { editorialService } from "./editorial";
export { adminService } from "./admin";
export { researchService } from "./research";
export { podcastsService } from "./podcasts";

// Re-export types
export type {
  Topic,
  Industry,
  ResearchReport,
  ResearchFilters,
  ResearchStats,
} from "./research";
export type {
  PodcastShow,
  PodcastEpisode,
  PodcastSubscription,
  EpisodeFilters,
  PodcastStats,
} from "./podcasts";
