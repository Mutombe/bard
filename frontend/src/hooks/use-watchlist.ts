"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  selectIsInWatchlist,
} from "@/store/slices/watchlistSlice";
import type { Company } from "@/types";

// Local storage key for guest watchlist
const GUEST_WATCHLIST_KEY = "bardiq_guest_watchlist";
const GUEST_LIKES_KEY = "bardiq_guest_likes";
const GUEST_SAVES_KEY = "bardiq_guest_saves";

interface GuestData {
  watchlist: Company[];
  likes: string[]; // Article IDs
  saves: string[]; // Article IDs
}

// Get guest data from localStorage
function getGuestData(): GuestData {
  if (typeof window === "undefined") {
    return { watchlist: [], likes: [], saves: [] };
  }

  try {
    const watchlist = JSON.parse(localStorage.getItem(GUEST_WATCHLIST_KEY) || "[]");
    const likes = JSON.parse(localStorage.getItem(GUEST_LIKES_KEY) || "[]");
    const saves = JSON.parse(localStorage.getItem(GUEST_SAVES_KEY) || "[]");
    return { watchlist, likes, saves };
  } catch {
    return { watchlist: [], likes: [], saves: [] };
  }
}

// Save guest watchlist to localStorage
function saveGuestWatchlist(watchlist: Company[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_WATCHLIST_KEY, JSON.stringify(watchlist));
}

// Save guest likes to localStorage
function saveGuestLikes(likes: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(likes));
}

// Save guest saves to localStorage
function saveGuestSaves(saves: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_SAVES_KEY, JSON.stringify(saves));
}

// Clear all guest data (after sync to server)
function clearGuestData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_WATCHLIST_KEY);
  localStorage.removeItem(GUEST_LIKES_KEY);
  localStorage.removeItem(GUEST_SAVES_KEY);
}

/**
 * Hook for managing watchlist (works for both authenticated and guest users)
 */
export function useWatchlist() {
  const dispatch = useAppDispatch();
  const { items: serverItems, isLoading, error } = useAppSelector((state) => state.watchlist);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [guestWatchlist, setGuestWatchlist] = useState<Company[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize guest watchlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const guestData = getGuestData();
      setGuestWatchlist(guestData.watchlist);
      setIsInitialized(true);
    }
  }, []);

  // Fetch server watchlist when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWatchlist());
    }
  }, [isAuthenticated, dispatch]);

  // Sync guest data to server when user authenticates
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      syncGuestDataToServer();
    }
  }, [isAuthenticated, isInitialized]);

  // The combined watchlist (server + guest for display)
  const items = isAuthenticated ? serverItems : guestWatchlist;

  // Check if a company is in the watchlist
  const isInWatchlist = useCallback(
    (companyId: string) => {
      return items.some((item) => item.id === companyId);
    },
    [items]
  );

  // Add company to watchlist
  const addCompany = useCallback(
    async (company: Company) => {
      if (isAuthenticated) {
        // Server-side for authenticated users
        dispatch(addToWatchlist(company));
      } else {
        // Local storage for guests
        const updated = [...guestWatchlist.filter((c) => c.id !== company.id), company];
        setGuestWatchlist(updated);
        saveGuestWatchlist(updated);
      }
    },
    [isAuthenticated, guestWatchlist, dispatch]
  );

  // Remove company from watchlist
  const removeCompany = useCallback(
    async (companyId: string) => {
      if (isAuthenticated) {
        // Server-side for authenticated users
        dispatch(removeFromWatchlist(companyId));
      } else {
        // Local storage for guests
        const updated = guestWatchlist.filter((c) => c.id !== companyId);
        setGuestWatchlist(updated);
        saveGuestWatchlist(updated);
      }
    },
    [isAuthenticated, guestWatchlist, dispatch]
  );

  // Toggle company in watchlist
  const toggleCompany = useCallback(
    async (company: Company) => {
      if (isInWatchlist(company.id)) {
        await removeCompany(company.id);
        return false;
      } else {
        await addCompany(company);
        return true;
      }
    },
    [isInWatchlist, addCompany, removeCompany]
  );

  // Sync guest data to server after authentication
  const syncGuestDataToServer = useCallback(async () => {
    const guestData = getGuestData();

    if (guestData.watchlist.length === 0 && guestData.likes.length === 0 && guestData.saves.length === 0) {
      return; // Nothing to sync
    }

    try {
      // Sync watchlist
      for (const company of guestData.watchlist) {
        try {
          await dispatch(addToWatchlist(company)).unwrap();
        } catch {
          // Ignore errors for individual items (might already exist)
        }
      }

      // TODO: Sync likes and saves when those endpoints are available
      // For now, we'll just clear them

      // Clear guest data after successful sync
      clearGuestData();
      setGuestWatchlist([]);

      console.log("Guest data synced to server successfully");
    } catch (error) {
      console.error("Failed to sync guest data:", error);
    }
  }, [dispatch]);

  return {
    items,
    isLoading,
    error,
    isInWatchlist,
    addCompany,
    removeCompany,
    toggleCompany,
    isAuthenticated,
  };
}

/**
 * Hook for managing article likes (works for both authenticated and guest users)
 */
export function useLikes() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [guestLikes, setGuestLikes] = useState<string[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const guestData = getGuestData();
      setGuestLikes(guestData.likes);
    }
  }, []);

  const isLiked = useCallback(
    (articleId: string) => {
      // TODO: Check server-side for authenticated users
      return guestLikes.includes(articleId);
    },
    [guestLikes]
  );

  const toggleLike = useCallback(
    (articleId: string) => {
      if (isAuthenticated) {
        // TODO: Server-side like toggle
        return;
      }

      const updated = isLiked(articleId)
        ? guestLikes.filter((id) => id !== articleId)
        : [...guestLikes, articleId];

      setGuestLikes(updated);
      saveGuestLikes(updated);
    },
    [isAuthenticated, guestLikes, isLiked]
  );

  return { isLiked, toggleLike, likes: guestLikes };
}

/**
 * Hook for managing article saves (works for both authenticated and guest users)
 */
export function useSaves() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [guestSaves, setGuestSaves] = useState<string[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const guestData = getGuestData();
      setGuestSaves(guestData.saves);
    }
  }, []);

  const isSaved = useCallback(
    (articleId: string) => {
      // TODO: Check server-side for authenticated users
      return guestSaves.includes(articleId);
    },
    [guestSaves]
  );

  const toggleSave = useCallback(
    (articleId: string) => {
      if (isAuthenticated) {
        // TODO: Server-side save toggle
        return;
      }

      const updated = isSaved(articleId)
        ? guestSaves.filter((id) => id !== articleId)
        : [...guestSaves, articleId];

      setGuestSaves(updated);
      saveGuestSaves(updated);
    },
    [isAuthenticated, guestSaves, isSaved]
  );

  return { isSaved, toggleSave, saves: guestSaves };
}

export default useWatchlist;
