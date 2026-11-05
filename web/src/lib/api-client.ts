import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api-response";

/**
 * Base URL for the Express backend API.
 * Uses same-origin reverse proxy /api/v1 by default in the browser.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Required for HTTP-only cookie exchange
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Extracts a user-friendly error message from an unknown error or API error response.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.message) {
      if (axiosError.code === "ECONNABORTED" || axiosError.code === "ERR_NETWORK") {
        return "Backend server is currently unreachable. Please ensure the backend is running.";
      }
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful handling of network / 401 errors
    return Promise.reject(error);
  }
);
