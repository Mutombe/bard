"use client";

/**
 * News Data Hooks
 *
 * SWR hooks for fetching news articles, categories, and tags.
 * Features:
 * - Automatic caching and deduplication
 * - Background revalidation
 * - Optimistic UI updates
 * - Error handling
 */
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { newsService } from "@/services/api/news";
import type { NewsArticle, Category, Tag, CursorPaginatedResponse } from "@/types";

// =========================
// Categories
// =========================

export function useCategories() {
  return useSWR<Category[]>(
    "/news/categories/",
    () => newsService.getCategories(),
    {
      // Categories rarely change, cache for longer
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );
}

export function useCategory(slug: string | null) {
  return useSWR<Category>(
    slug ? `/news/categories/${slug}/` : null,
    () => newsService.getCategory(slug!),
    {
      revalidateOnFocus: false,
    }
  );
}

// =========================
// Tags
// =========================

export function useTags() {
  return useSWR<Tag[]>(
    "/news/tags/",
    () => newsService.getTags(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}

// =========================
// Articles
// =========================

export interface UseArticlesParams {
  category?: string;
  tag?: string;
  content_type?: string;
  company?: string;
  is_featured?: boolean;
  is_premium?: boolean;
  search?: string;
  page_size?: number;
}

export function useArticles(params?: UseArticlesParams) {
  // Build a stable cache key based on params
  const paramString = params ? JSON.stringify(params) : "";
  const key = `/news/articles/?${paramString}`;

  return useSWR<CursorPaginatedResponse<NewsArticle>>(
    key,
    () => newsService.getArticles(params),
    {
      // Articles update frequently
      revalidateOnFocus: true,
      dedupingInterval: 5000, // 5 seconds
    }
  );
}

// Infinite scroll hook for articles
export function useInfiniteArticles(params?: UseArticlesParams) {
  const getKey = (
    pageIndex: number,
    previousPageData: CursorPaginatedResponse<NewsArticle> | null
  ) => {
    // If previous page has no next cursor, we've reached the end
    if (previousPageData && !previousPageData.next) return null;

    // Build key with cursor for pagination
    const cursor = previousPageData?.next;
    const paramString = JSON.stringify({ ...params, cursor });
    return `/news/articles/infinite?${paramString}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<
    CursorPaginatedResponse<NewsArticle>
  >(
    getKey,
    (key) => {
      // Extract cursor from key
      const parsed = JSON.parse(key.split("?")[1] || "{}");
      return newsService.getArticles(parsed);
    },
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Flatten all pages into a single array
  const articles = data ? data.flatMap((page) => page.results) : [];
  const hasMore = data?.[data.length - 1]?.next != null;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  return {
    articles,
    error,
    isLoading,
    isValidating,
    hasMore,
    isLoadingMore,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
    size,
  };
}

export function useArticle(slug: string | null) {
  return useSWR<NewsArticle>(
    slug ? `/news/articles/${slug}/` : null,
    () => newsService.getArticle(slug!),
    {
      // Increment view count on the server
      revalidateOnFocus: false,
    }
  );
}

export function useFeaturedArticles() {
  return useSWR<NewsArticle[]>(
    "/news/articles/featured/",
    () => newsService.getFeaturedArticles(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
    }
  );
}

export function useBreakingNews() {
  return useSWR<NewsArticle[]>(
    "/news/articles/breaking/",
    () => newsService.getBreakingNews(),
    {
      // Breaking news should update frequently
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  );
}

export function useArticlesByCompany(companyId: string | null) {
  return useSWR<CursorPaginatedResponse<NewsArticle>>(
    companyId ? `/news/articles/by-company/${companyId}/` : null,
    () => newsService.getArticlesByCompany(companyId!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );
}
