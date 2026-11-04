import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts loading until verifySession resolves
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticatedUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearAuthentication: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuthenticatedUser, clearAuthentication, setAuthLoading } =
  authSlice.actions;

export default authSlice.reducer;
