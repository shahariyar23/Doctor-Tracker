import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api-response";
import type {
  DashboardOverviewData,
  PatientTrendsData,
  PatientsByDoctorItem,
  ConditionDistributionItem,
  DashboardFilterParams,
} from "../types";

export const dashboardService = {
  /**
   * GET /api/v1/dashboard/overview
   */
  getOverview: async (
    params: { from?: string; to?: string } = {}
  ): Promise<DashboardOverviewData> => {
    const response = await apiClient.get<ApiResponse<DashboardOverviewData>>(
      "/dashboard/overview",
      { params }
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/dashboard/patient-trends
   */
  getPatientTrends: async (
    params: DashboardFilterParams = {}
  ): Promise<PatientTrendsData> => {
    const response = await apiClient.get<ApiResponse<PatientTrendsData>>(
      "/dashboard/patient-trends",
      { params }
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/dashboard/patients-by-doctor
   */
  getPatientsByDoctor: async (): Promise<PatientsByDoctorItem[]> => {
    const response = await apiClient.get<ApiResponse<PatientsByDoctorItem[]>>(
      "/dashboard/patients-by-doctor"
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/dashboard/conditions
   */
  getConditionsDistribution: async (): Promise<ConditionDistributionItem[]> => {
    const response = await apiClient.get<ApiResponse<ConditionDistributionItem[]>>(
      "/dashboard/conditions"
    );
    return response.data.data;
  },
};
