import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { userService } from "@/services/api/user";
import type { Company } from "@/types";

interface WatchlistState {
  items: Company[];
  isLoading: boolean;
  error: string | null;
  // Optimistic updates tracking
  pendingAdditions: string[]; // Company IDs being added
  pendingRemovals: string[]; // Company IDs being removed
}

const initialState: WatchlistState = {
  items: [],
  isLoading: false,
  error: null,
  pendingAdditions: [],
  pendingRemovals: [],
};

// Async thunks
export const fetchWatchlist = createAsyncThunk(
  "watchlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getWatchlist();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || "Failed to fetch watchlist");
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  "watchlist/add",
  async (company: Company, { rejectWithValue }) => {
    try {
      await userService.addToWatchlist(company.id);
      return company;
    } catch (error: any) {
      return rejectWithValue({
        companyId: company.id,
        message: error.response?.data?.error?.message || "Failed to add to watchlist",
      });
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  "watchlist/remove",
  async (companyId: string, { rejectWithValue }) => {
    try {
      await userService.removeFromWatchlist(companyId);
      return companyId;
    } catch (error: any) {
      return rejectWithValue({
        companyId,
        message: error.response?.data?.error?.message || "Failed to remove from watchlist",
      });
    }
  }
);

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    // Optimistic add
    optimisticAdd: (state, action: PayloadAction<Company>) => {
      const company = action.payload;
      // Add to pending
      state.pendingAdditions.push(company.id);
      // Optimistically add to items if not already present
      if (!state.items.find((item) => item.id === company.id)) {
        state.items.push(company);
      }
    },
    // Optimistic remove
    optimisticRemove: (state, action: PayloadAction<string>) => {
      const companyId = action.payload;
      // Add to pending
      state.pendingRemovals.push(companyId);
      // Optimistically remove from items
      state.items = state.items.filter((item) => item.id !== companyId);
    },
    // Revert optimistic add (on failure)
    revertAdd: (state, action: PayloadAction<string>) => {
      const companyId = action.payload;
      state.pendingAdditions = state.pendingAdditions.filter((id) => id !== companyId);
      state.items = state.items.filter((item) => item.id !== companyId);
    },
    // Revert optimistic remove (on failure)
    revertRemove: (state, action: PayloadAction<Company>) => {
      const company = action.payload;
      state.pendingRemovals = state.pendingRemovals.filter((id) => id !== company.id);
      if (!state.items.find((item) => item.id === company.id)) {
        state.items.push(company);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add to watchlist - confirm optimistic update
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        const companyId = action.payload.id;
        state.pendingAdditions = state.pendingAdditions.filter((id) => id !== companyId);
      })
      .addCase(addToWatchlist.rejected, (state, action) => {
        const { companyId, message } = action.payload as { companyId: string; message: string };
        state.pendingAdditions = state.pendingAdditions.filter((id) => id !== companyId);
        state.items = state.items.filter((item) => item.id !== companyId);
        state.error = message;
      })
      // Remove from watchlist - confirm optimistic update
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        const companyId = action.payload;
        state.pendingRemovals = state.pendingRemovals.filter((id) => id !== companyId);
      })
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        const { companyId, message } = action.payload as { companyId: string; message: string };
        state.pendingRemovals = state.pendingRemovals.filter((id) => id !== companyId);
        // Note: We can't restore the item here because we don't have the full company data
        // The UI should handle this by refetching the watchlist
        state.error = message;
      });
  },
});

export const {
  optimisticAdd,
  optimisticRemove,
  revertAdd,
  revertRemove,
  clearError,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;

// Selectors
export const selectIsInWatchlist = (state: { watchlist: WatchlistState }, companyId: string) =>
  state.watchlist.items.some((item) => item.id === companyId);

export const selectIsPending = (state: { watchlist: WatchlistState }, companyId: string) =>
  state.watchlist.pendingAdditions.includes(companyId) ||
  state.watchlist.pendingRemovals.includes(companyId);
