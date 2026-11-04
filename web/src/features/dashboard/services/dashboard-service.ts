import { apiClient } from "@/lib/api-client";
import { DashboardData } from "../types";
import fallbackDashboardData from "@/data/dashboard.json";

export const dashboardService = {
  getDashboardData: async (period: "7d" | "30d" | "90d" = "30d"): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<DashboardData>("/analytics/dashboard", {
        params: { period },
      });
      return response.data;
    } catch {
      // Fallback for preview before backend is launched
      return fallbackDashboardData as DashboardData;
    }
  },
};
