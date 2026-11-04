import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api-response";
import type { GlobalSearchData } from "@/types/search";

export const searchService = {
  /**
   * GET /api/v1/search?q=<term>&limit=<limit>
   */
  globalSearch: async (
    query: string,
    limit: number = 5,
    signal?: AbortSignal
  ): Promise<GlobalSearchData> => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return { doctors: [], patients: [], total: 0 };
    }

    const response = await apiClient.get<ApiResponse<GlobalSearchData>>("/search", {
      params: { q: trimmed, limit },
      signal,
    });

    return response.data.data;
  },
};

