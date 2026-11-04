import { apiClient } from "@/lib/api-client";
import { DashboardData } from "../types";

const FALLBACK_DASHBOARD_DATA: DashboardData = {
  metrics: {
    totalDoctors: 148,
    totalPatients: 3842,
    assignedPatients: 3718,
    unassignedPatients: 124,
    doctorGrowthRate: 6.2,
    patientGrowthRate: 3.2,
  },
  trends: [
    { date: "Oct 01", count: 85 },
    { date: "Oct 06", count: 112 },
    { date: "Oct 11", count: 98 },
    { date: "Oct 16", count: 142 },
    { date: "Oct 21", count: 130 },
    { date: "Oct 26", count: 165 },
    { date: "Oct 31", count: 184 },
    { date: "Nov 04", count: 210 },
  ],
  workload: [
    { id: "doc-1", name: "Dr. Marcus Vance", specialty: "Cardiology", patientCount: 32 },
    { id: "doc-2", name: "Dr. Priya Patel", specialty: "Neurology", patientCount: 28 },
    { id: "doc-3", name: "Dr. Aris Thorne", specialty: "Oncology", patientCount: 26 },
    { id: "doc-4", name: "Dr. Rachel Green", specialty: "Geriatrics", patientCount: 24 },
    { id: "doc-5", name: "Dr. Colin Drake", specialty: "Internal Medicine", patientCount: 21 },
  ],
  conditions: [
    { condition: "Stable", count: 1614, percentage: 42 },
    { condition: "Under Treatment", count: 1191, percentage: 31 },
    { condition: "Recovering", count: 692, percentage: 18 },
    { condition: "Critical", count: 345, percentage: 9 },
  ],
  recentPatients: [
    {
      id: "pt-1",
      name: "Elena Rostova",
      registeredDate: "Today, 10:45 AM",
      condition: "Critical",
      assignedDoctor: { id: "doc-1", name: "Dr. Marcus Vance", specialty: "Cardiology" },
    },
    {
      id: "pt-2",
      name: "David Kim",
      registeredDate: "Yesterday, 3:20 PM",
      condition: "Under Treatment",
      assignedDoctor: { id: "doc-2", name: "Dr. Priya Patel", specialty: "Neurology" },
    },
    {
      id: "pt-3",
      name: "Katherine Hawthorne",
      registeredDate: "Nov 02, 2026",
      condition: "Stable",
      assignedDoctor: { id: "doc-3", name: "Dr. Aris Thorne", specialty: "Oncology" },
    },
    {
      id: "pt-4",
      name: "Marcus Vance Jr",
      registeredDate: "Nov 01, 2026",
      condition: "Recovering",
      assignedDoctor: { id: "doc-4", name: "Dr. Rachel Green", specialty: "Geriatrics" },
    },
    {
      id: "pt-5",
      name: "Chloe Bennett",
      registeredDate: "Oct 31, 2026",
      condition: "Stable",
      assignedDoctor: null,
    },
  ],
};

export const dashboardService = {
  getDashboardData: async (period: "7d" | "30d" | "90d" = "30d"): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<DashboardData>("/analytics/dashboard", {
        params: { period },
      });
      return response.data;
    } catch {
      // Fallback for preview before backend is launched
      return FALLBACK_DASHBOARD_DATA;
    }
  },
};
