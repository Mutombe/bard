"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";

// Local storage keys (same as use-watchlist.ts)
const GUEST_WATCHLIST_KEY = "bardiq_guest_watchlist";
const GUEST_SAVES_KEY = "bardiq_guest_saves";
const BOOKMARKS_KEY = "bardiq_bookmarks";

interface SavedCounts {
  watchlistCount: number;
  savedArticlesCount: number;
  totalCount: number;
}

/**
 * Hook to get counts of saved items for both authenticated and guest users.
 * Used to show indicators on navigation items.
 */
export function useSavedCounts(): SavedCounts {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { items: watchlistItems } = useAppSelector((state) => state.watchlist);

  const [guestCounts, setGuestCounts] = useState<SavedCounts>({
    watchlistCount: 0,
    savedArticlesCount: 0,
    totalCount: 0,
  });

  // For guest users, read from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateCounts = () => {
      try {
        const watchlist = JSON.parse(localStorage.getItem(GUEST_WATCHLIST_KEY) || "[]");
        const saves = JSON.parse(localStorage.getItem(GUEST_SAVES_KEY) || "[]");
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");

        // Combine saves and bookmarks (they might be stored differently)
        const savedArticlesCount = saves.length + bookmarks.length;
        const watchlistCount = watchlist.length;

        setGuestCounts({
          watchlistCount,
          savedArticlesCount,
          totalCount: watchlistCount + savedArticlesCount,
        });
      } catch {
        setGuestCounts({
          watchlistCount: 0,
          savedArticlesCount: 0,
          totalCount: 0,
        });
      }
    };

    // Initial load
    updateCounts();

    // Listen for storage changes (in case another tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === GUEST_WATCHLIST_KEY ||
        e.key === GUEST_SAVES_KEY ||
        e.key === BOOKMARKS_KEY
      ) {
        updateCounts();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleCustomUpdate = () => updateCounts();
    window.addEventListener("savedItemsUpdated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("savedItemsUpdated", handleCustomUpdate);
    };
  }, []);

  // For authenticated users, use Redux state
  if (isAuthenticated) {
    const watchlistCount = watchlistItems?.length || 0;
    // TODO: Get saved articles count from Redux when available
    const savedArticlesCount = guestCounts.savedArticlesCount; // Fallback to local for now

    return {
      watchlistCount,
      savedArticlesCount,
      totalCount: watchlistCount + savedArticlesCount,
    };
  }

  return guestCounts;
}

export default useSavedCounts;
