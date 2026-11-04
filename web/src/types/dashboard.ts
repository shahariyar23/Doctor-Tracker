export interface DashboardMetrics {
  totalDoctors: number;
  totalPatients: number;
  patientsPerDoctor: number;
  assignedPatients?: number;
  unassignedPatients?: number;
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
  condition: string;
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

