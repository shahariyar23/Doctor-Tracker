import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard-service";
import type { DashboardFilterParams } from "../types";

export const DASHBOARD_OVERVIEW_KEY = ["dashboard", "overview"];
export const DASHBOARD_TRENDS_KEY = ["dashboard", "trends"];
export const DASHBOARD_BY_DOCTOR_KEY = ["dashboard", "by-doctor"];
export const DASHBOARD_CONDITIONS_KEY = ["dashboard", "conditions"];

export function useDashboardOverview(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...DASHBOARD_OVERVIEW_KEY, params],
    queryFn: () => dashboardService.getOverview(params),
  });
}

export function usePatientTrends(params: DashboardFilterParams = {}) {
  return useQuery({
    queryKey: [...DASHBOARD_TRENDS_KEY, params],
    queryFn: () => dashboardService.getPatientTrends(params),
  });
}

export function usePatientsByDoctor() {
  return useQuery({
    queryKey: DASHBOARD_BY_DOCTOR_KEY,
    queryFn: () => dashboardService.getPatientsByDoctor(),
  });
}

export function useConditionDistribution() {
  return useQuery({
    queryKey: DASHBOARD_CONDITIONS_KEY,
    queryFn: () => dashboardService.getConditionsDistribution(),
  });
}
