import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { marketService } from "@/services/api/market";
import type { Company, MarketIndex, TickerData } from "@/types";

interface MarketState {
  // Featured ticker tape data
  tickerTape: TickerData[];
  tickerTapeLoading: boolean;

  // Market indices
  indices: MarketIndex[];
  indicesLoading: boolean;

  // Top movers
  gainers: Company[];
  losers: Company[];
  mostActive: Company[];
  moversLoading: boolean;

  // Selected company detail
  selectedCompany: Company | null;
  selectedCompanyLoading: boolean;

  // Search results
  searchResults: Company[];
  searchLoading: boolean;

  // Error state
  error: string | null;

  // Last update timestamp
  lastUpdated: string | null;
}

const initialState: MarketState = {
  tickerTape: [],
  tickerTapeLoading: false,
  indices: [],
  indicesLoading: false,
  gainers: [],
  losers: [],
  mostActive: [],
  moversLoading: false,
  selectedCompany: null,
  selectedCompanyLoading: false,
  searchResults: [],
  searchLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchTickerTape = createAsyncThunk(
  "market/fetchTickerTape",
  async (_, { rejectWithValue }) => {
    try {
      const response = await marketService.getTickerTape();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIndices = createAsyncThunk(
  "market/fetchIndices",
  async (exchange: string | undefined, { rejectWithValue }) => {
    try {
      const response = await marketService.getIndices(exchange);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTopMovers = createAsyncThunk(
  "market/fetchTopMovers",
  async (exchange: string | undefined, { rejectWithValue }) => {
    try {
      const [gainers, losers, mostActive] = await Promise.all([
        marketService.getGainers(exchange),
        marketService.getLosers(exchange),
        marketService.getMostActive(exchange),
      ]);
      return { gainers, losers, mostActive };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCompanyDetail = createAsyncThunk(
  "market/fetchCompanyDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await marketService.getCompany(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchCompanies = createAsyncThunk(
  "market/searchCompanies",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await marketService.searchCompanies(query);
      return response.results;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    // Real-time update for a single ticker
    updateTicker: (state, action: PayloadAction<TickerData>) => {
      const index = state.tickerTape.findIndex(
        (t) => t.symbol === action.payload.symbol
      );
      if (index !== -1) {
        state.tickerTape[index] = action.payload;
      }
    },
    // Batch update for tickers
    updateTickers: (state, action: PayloadAction<TickerData[]>) => {
      action.payload.forEach((ticker) => {
        const index = state.tickerTape.findIndex(
          (t) => t.symbol === ticker.symbol
        );
        if (index !== -1) {
          state.tickerTape[index] = ticker;
        }
      });
      state.lastUpdated = new Date().toISOString();
    },
    clearSelectedCompany: (state) => {
      state.selectedCompany = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Ticker tape
      .addCase(fetchTickerTape.pending, (state) => {
        state.tickerTapeLoading = true;
      })
      .addCase(fetchTickerTape.fulfilled, (state, action) => {
        state.tickerTapeLoading = false;
        state.tickerTape = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTickerTape.rejected, (state, action) => {
        state.tickerTapeLoading = false;
        state.error = action.payload as string;
      })
      // Indices
      .addCase(fetchIndices.pending, (state) => {
        state.indicesLoading = true;
      })
      .addCase(fetchIndices.fulfilled, (state, action) => {
        state.indicesLoading = false;
        state.indices = action.payload;
      })
      .addCase(fetchIndices.rejected, (state, action) => {
        state.indicesLoading = false;
        state.error = action.payload as string;
      })
      // Top movers
      .addCase(fetchTopMovers.pending, (state) => {
        state.moversLoading = true;
      })
      .addCase(fetchTopMovers.fulfilled, (state, action) => {
        state.moversLoading = false;
        state.gainers = action.payload.gainers;
        state.losers = action.payload.losers;
        state.mostActive = action.payload.mostActive;
      })
      .addCase(fetchTopMovers.rejected, (state, action) => {
        state.moversLoading = false;
        state.error = action.payload as string;
      })
      // Company detail
      .addCase(fetchCompanyDetail.pending, (state) => {
        state.selectedCompanyLoading = true;
      })
      .addCase(fetchCompanyDetail.fulfilled, (state, action) => {
        state.selectedCompanyLoading = false;
        state.selectedCompany = action.payload;
      })
      .addCase(fetchCompanyDetail.rejected, (state, action) => {
        state.selectedCompanyLoading = false;
        state.error = action.payload as string;
      })
      // Search
      .addCase(searchCompanies.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchCompanies.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchCompanies.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateTicker,
  updateTickers,
  clearSelectedCompany,
  clearSearchResults,
  clearError,
} = marketSlice.actions;

export default marketSlice.reducer;
