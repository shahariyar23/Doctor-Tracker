import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initializeAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        const userStr = localStorage.getItem("auth_user");
        if (token && userStr) {
          try {
            state.user = JSON.parse(userStr);
            state.token = token;
            state.isAuthenticated = true;
          } catch {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
          }
        }
      }
      state.isLoading = false;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", action.payload.token);
        localStorage.setItem("auth_user", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    },
  },
});

export const { initializeAuth, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

