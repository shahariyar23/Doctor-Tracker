import "server-only";
import { cookies } from "next/headers";
import type { ApiResponse } from "@/types/api-response";

/**
 * Server-only backend URL.
 * Uses INTERNAL_API_URL with safe fallback to production backend or local development.
 * Must always return an absolute HTTP(S) URL. Never return a relative URL.
 */
export function getBackendUrl(): string {
  const rawUrl =
    process.env.INTERNAL_API_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:5000/api/v1"
      : "https://doctor-tracker-ten-iota.vercel.app/api/v1");

  const cleanUrl = rawUrl.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api/v1") ? cleanUrl : `${cleanUrl}/api/v1`;
}

export interface ServerFetchOptions extends RequestInit {
  params?: Record<string, unknown> | object;
}

export class ServerApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Authenticated server-side API client for Next.js Server Components.
 * Forwards only the HTTP-only 'token' cookie.
 * Always applies `cache: "no-store"` to ensure user-specific data is never cached or leaked.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const backendBase = getBackendUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Build full URL with query parameters if provided
  let url = `${backendBase}${normalizedEndpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Retrieve incoming HTTP-only cookies
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Forward authentication cookie if present
  if (tokenCookie?.value) {
    headers.set("Cookie", `token=${tokenCookie.value}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: "no-store", // Crucial: Never cache authenticated user responses on the server
    });

    if (!res.ok) {
      let errorMessage = `Server API error: ${res.status} ${res.statusText}`;
      let errorBody: unknown = null;
      try {
        errorBody = await res.json();
        if (
          typeof errorBody === "object" &&
          errorBody !== null &&
          "message" in errorBody &&
          typeof (errorBody as { message: unknown }).message === "string"
        ) {
          errorMessage = (errorBody as { message: string }).message;
        }
      } catch {
        // Body was not JSON
      }

      throw new ServerApiError(errorMessage, res.status, errorBody);
    }

    const payload = (await res.json()) as ApiResponse<T>;
    return payload.data;
  } catch (error) {
    if (error instanceof ServerApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Network error";
    throw new ServerApiError(message, 500);
  }
}
