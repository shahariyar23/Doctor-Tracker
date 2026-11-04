import { apiClient } from "@/lib/api-client";
import { DashboardData } from "../types";

export const dashboardService = {
  getDashboardData: async (period: "7d" | "30d" | "90d" = "30d"): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>("/analytics/dashboard", {
      params: { period },
    });
    return response.data;
  },
};

