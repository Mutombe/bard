"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppSelector } from "@/store";

// Local storage keys - MUST match what pages actually use
const GUEST_WATCHLIST_KEY = "bardiq_guest_watchlist";
const LIKES_KEY = "bardiq_likes";
const BOOKMARKS_KEY = "bardiq_bookmarks";

interface SavedCounts {
  watchlistCount: number;
  savedArticlesCount: number;
  likesCount: number;
  totalCount: number;
}

/**
 * Hook to get counts of saved items for both authenticated and guest users.
 * Used to show indicators on navigation items.
 */
export function useSavedCounts(): SavedCounts {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { items: watchlistItems } = useAppSelector((state) => state.watchlist);

  const [counts, setCounts] = useState<SavedCounts>({
    watchlistCount: 0,
    savedArticlesCount: 0,
    likesCount: 0,
    totalCount: 0,
  });

  const updateCounts = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const watchlist = JSON.parse(localStorage.getItem(GUEST_WATCHLIST_KEY) || "[]");
      const likes = JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
      const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");

      const watchlistCount = Array.isArray(watchlist) ? watchlist.length : 0;
      const likesCount = Array.isArray(likes) ? likes.length : 0;
      const savedArticlesCount = Array.isArray(bookmarks) ? bookmarks.length : 0;

      setCounts({
        watchlistCount,
        savedArticlesCount,
        likesCount,
        totalCount: watchlistCount + savedArticlesCount + likesCount,
      });
    } catch (e) {
      console.error("Error reading saved counts:", e);
      setCounts({
        watchlistCount: 0,
        savedArticlesCount: 0,
        likesCount: 0,
        totalCount: 0,
      });
    }
  }, []);

  // Initial load and set up listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial load
    updateCounts();

    // Listen for storage changes (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === GUEST_WATCHLIST_KEY ||
        e.key === LIKES_KEY ||
        e.key === BOOKMARKS_KEY ||
        e.key === null // null means storage was cleared
      ) {
        updateCounts();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Poll for changes every 2 seconds (for same-tab updates since localStorage doesn't trigger events in same tab)
    const interval = setInterval(updateCounts, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [updateCounts]);

  // For authenticated users, combine Redux watchlist with localStorage counts
  if (isAuthenticated) {
    const watchlistCount = watchlistItems?.length || 0;
    return {
      watchlistCount,
      savedArticlesCount: counts.savedArticlesCount,
      likesCount: counts.likesCount,
      totalCount: watchlistCount + counts.savedArticlesCount + counts.likesCount,
    };
  }

  return counts;
}

export default useSavedCounts;
