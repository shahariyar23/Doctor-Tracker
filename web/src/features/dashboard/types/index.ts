export interface DashboardMetrics {
  totalDoctors: number;
  totalPatients: number;
  assignedPatients: number;
  unassignedPatients: number;
  doctorGrowthRate?: number;
  patientGrowthRate?: number;
}

export interface RegistrationTrendItem {
  date: string;
  count: number;
}

export interface DoctorWorkloadItem {
  id: string;
  name: string;
  specialty: string;
  patientCount: number;
  capacity?: number;
}

export interface ConditionDistributionItem {
  condition: string;
  count: number;
  percentage: number;
}

export interface RecentPatientItem {
  id: string;
  name: string;
  registeredDate: string;
  condition: "Critical" | "Under Treatment" | "Stable" | "Recovering";
  assignedDoctor: {
    id: string;
    name: string;
    specialty?: string;
  } | null;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  trends: RegistrationTrendItem[];
  workload: DoctorWorkloadItem[];
  conditions: ConditionDistributionItem[];
  recentPatients: RecentPatientItem[];
}

