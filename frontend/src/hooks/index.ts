/**
 * Hooks Index
 *
 * Central export for all custom hooks.
 */

// SWR Configuration
export { SWRProvider } from "./use-swr-config";

// Watchlist
export { useWatchlist, useWatchlistManager } from "./useWatchlist";

// News Hooks
export {
  useCategories,
  useCategory,
  useTags,
  useArticles,
  useInfiniteArticles,
  useArticle,
  useFeaturedArticles,
  useBreakingNews,
  useArticlesByCompany,
} from "./use-news";
export type { UseArticlesParams } from "./use-news";

// Market Hooks
export {
  useExchanges,
  useExchange,
  useSectors,
  useCompanies,
  useCompany,
  useCompanySearch,
  useGainers,
  useLosers,
  useMostActive,
  useTickerTape,
  useChartData,
  useIndices,
  useIndex,
  useMarketOverview,
} from "./use-markets";
export type { UseCompaniesParams, UseChartDataParams } from "./use-markets";

// Media Hooks
export {
  useVideos,
  useVideo,
  useFeaturedVideos,
  useLatestVideos,
  useVideoCategories,
  useYouTubeSearch,
  useYouTubeFinanceVideos,
  useCNBCAfricaVideo,
  usePodcastShows,
  usePodcastShow,
  useShowEpisodes,
  usePodcastEpisodes,
  usePodcastEpisode,
  useFeaturedEpisodes,
  useLatestEpisodes,
} from "./use-media";
export type { UseVideosParams, UseYouTubeSearchParams, UsePodcastEpisodesParams } from "./use-media";

// WebSocket Hooks
export {
  useWebSocket,
  useMarketDataSocket,
  useNotificationsSocket,
} from "./use-websocket";
