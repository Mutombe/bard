import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Search
  searchOpen: boolean;
  searchQuery: string;

  // Modal states
  activeModal: string | null;
  modalData: Record<string, any> | null;

  // Selected exchange filter
  selectedExchange: string | null;

  // Theme
  theme: "dark" | "light";

  // Mobile menu
  mobileMenuOpen: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  searchOpen: false,
  searchQuery: "",
  activeModal: null,
  modalData: null,
  selectedExchange: null,
  theme: "dark",
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // Search
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
      if (!state.searchOpen) {
        state.searchQuery = "";
      }
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
      if (!action.payload) {
        state.searchQuery = "";
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Modal
    openModal: (
      state,
      action: PayloadAction<{ modal: string; data?: Record<string, any> }>
    ) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },

    // Exchange filter
    setSelectedExchange: (state, action: PayloadAction<string | null>) => {
      state.selectedExchange = action.payload;
    },

    // Theme
    setTheme: (state, action: PayloadAction<"dark" | "light">) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },

    // Mobile menu
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapse,
  toggleSearch,
  setSearchOpen,
  setSearchQuery,
  openModal,
  closeModal,
  setSelectedExchange,
  setTheme,
  toggleTheme,
  toggleMobileMenu,
  setMobileMenuOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
