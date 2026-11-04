import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api-response";
import type { AuthResponse, LoginCredentials, User } from "../types";

export const authService = {
  /**
   * Admin Login
   * POST /api/v1/auth/login
   * Backend sets HTTP-only cookie and returns safe user profile in data.user
   */
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    return response.data.data.user;
  },

  /**
   * Get Current Authenticated Admin
   * GET /api/v1/auth/me
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me");
    return response.data.data;
  },

  /**
   * Admin Logout
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/logout");
  },
};
