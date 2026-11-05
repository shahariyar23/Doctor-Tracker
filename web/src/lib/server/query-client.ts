import "server-only";
import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a new, isolated QueryClient for each server-side request.
 * Crucial: A QueryClient MUST NOT be shared across requests or users
 * to avoid data leaking between sessions.
 */
export function createServerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we set staleTime to prevent immediate client-side refetching
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
      },
    },
  });
}

