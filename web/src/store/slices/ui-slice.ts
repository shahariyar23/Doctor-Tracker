import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  searchOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setSearchOpen } =
  uiSlice.actions;
export default uiSlice.reducer;

