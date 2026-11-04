import { apiClient } from "@/lib/api-client";
import { AuthResponse, LoginCredentials } from "../types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  },
};

