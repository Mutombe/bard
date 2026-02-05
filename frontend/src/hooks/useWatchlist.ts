"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  optimisticAdd,
  optimisticRemove,
  selectIsInWatchlist,
  selectIsPending,
} from "@/store/slices/watchlistSlice";
import type { Company } from "@/types";

/**
 * Custom hook for watchlist operations with optimistic UI updates.
 *
 * Provides:
 * - Optimistic add/remove operations
 * - Loading states
 * - Automatic error handling with rollback
 * - Toast notifications
 *
 * @example
 * ```tsx
 * const { isInWatchlist, isPending, toggleWatchlist } = useWatchlist(company);
 *
 * <Button onClick={toggleWatchlist} disabled={isPending}>
 *   {isInWatchlist ? 'Remove' : 'Add'}
 * </Button>
 * ```
 */
export function useWatchlist(company: Company) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isInWatchlist = useAppSelector((state) =>
    selectIsInWatchlist(state, company.id)
  );
  const isPending = useAppSelector((state) =>
    selectIsPending(state, company.id)
  );
  const watchlistItems = useAppSelector((state) => state.watchlist.items);
  const isLoading = useAppSelector((state) => state.watchlist.isLoading);

  /**
   * Toggle watchlist status with optimistic update
   */
  const toggleWatchlist = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to manage your watchlist");
      return;
    }

    if (isPending) {
      return; // Prevent double clicks
    }

    const symbol = company.symbol;

    if (isInWatchlist) {
      // === REMOVE FROM WATCHLIST ===
      // 1. Optimistic update - immediately update UI
      dispatch(optimisticRemove(company.id));

      // 2. Show success toast immediately (optimistic)
      const toastId = toast.success(`Removed ${symbol} from watchlist`);

      try {
        // 3. Make API call
        await dispatch(removeFromWatchlist(company.id)).unwrap();
        // Success - optimistic update confirmed
      } catch (error: any) {
        // 4. Revert on failure
        dispatch(optimisticAdd(company)); // Re-add the company
        toast.dismiss(toastId);
        toast.error(`Failed to remove ${symbol} from watchlist`, {
          description: error.message || "Please try again",
        });
      }
    } else {
      // === ADD TO WATCHLIST ===
      // 1. Optimistic update - immediately update UI
      dispatch(optimisticAdd(company));

      // 2. Show success toast immediately (optimistic)
      const toastId = toast.success(`Added ${symbol} to watchlist`);

      try {
        // 3. Make API call
        await dispatch(addToWatchlist(company)).unwrap();
        // Success - optimistic update confirmed
      } catch (error: any) {
        // 4. Revert on failure
        dispatch(optimisticRemove(company.id)); // Remove the company
        toast.dismiss(toastId);
        toast.error(`Failed to add ${symbol} to watchlist`, {
          description: error.message || "Please try again",
        });
      }
    }
  }, [dispatch, company, isAuthenticated, isInWatchlist, isPending]);

  /**
   * Force refresh the watchlist from API
   */
  const refreshWatchlist = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await dispatch(fetchWatchlist()).unwrap();
    } catch (error) {
      toast.error("Failed to refresh watchlist");
    }
  }, [dispatch, isAuthenticated]);

  return {
    // State
    isInWatchlist,
    isPending,
    isLoading,
    watchlistItems,
    watchlistCount: watchlistItems.length,

    // Actions
    toggleWatchlist,
    refreshWatchlist,

    // Convenience
    isAuthenticated,
  };
}

/**
 * Hook for managing the entire watchlist
 */
export function useWatchlistManager() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { items, isLoading, error } = useAppSelector((state) => state.watchlist);

  const loadWatchlist = useCallback(async () => {
    if (!isAuthenticated) return;
    await dispatch(fetchWatchlist());
  }, [dispatch, isAuthenticated]);

  const addCompany = useCallback(
    async (company: Company) => {
      if (!isAuthenticated) {
        toast.error("Please sign in to manage your watchlist");
        return false;
      }

      dispatch(optimisticAdd(company));

      try {
        await dispatch(addToWatchlist(company)).unwrap();
        toast.success(`Added ${company.symbol} to watchlist`);
        return true;
      } catch (error) {
        dispatch(optimisticRemove(company.id));
        toast.error(`Failed to add ${company.symbol}`);
        return false;
      }
    },
    [dispatch, isAuthenticated]
  );

  const removeCompany = useCallback(
    async (companyId: string) => {
      if (!isAuthenticated) return false;

      const company = items.find((c) => c.id === companyId);
      if (!company) return false;

      dispatch(optimisticRemove(companyId));

      try {
        await dispatch(removeFromWatchlist(companyId)).unwrap();
        toast.success(`Removed ${company.symbol} from watchlist`);
        return true;
      } catch (error) {
        dispatch(optimisticAdd(company));
        toast.error(`Failed to remove ${company.symbol}`);
        return false;
      }
    },
    [dispatch, isAuthenticated, items]
  );

  const isWatching = useCallback(
    (companyId: string) => items.some((c) => c.id === companyId),
    [items]
  );

  return {
    items,
    isLoading,
    error,
    count: items.length,
    isAuthenticated,
    loadWatchlist,
    addCompany,
    removeCompany,
    isWatching,
  };
}
