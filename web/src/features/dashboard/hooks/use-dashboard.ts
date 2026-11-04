import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard-service";

export function useDashboardData(period: "7d" | "30d" | "90d" = "30d") {
  return useQuery({
    queryKey: ["dashboard-data", period],
    queryFn: () => dashboardService.getDashboardData(period),
  });
}

