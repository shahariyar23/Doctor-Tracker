export interface DashboardOverviewData {
  totalDoctors: number;
  totalPatients: number;
  newDoctors: number;
  newPatients: number;
  patientsPerDoctor: Array<{
    doctorId: string;
    doctorName: string;
    specialization: string;
    patientCount: number;
  }>;
  unassignedPatients: number;
  topConditions: Array<{
    condition: string;
    count: number;
  }>;
  registrationSummary: {
    periodStart: string;
    periodEnd: string;
    newPatients: number;
    newDoctors: number;
  };
  insights: string[];
}

export interface PatientTrendsData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export interface PatientsByDoctorItem {
  doctorId: string;
  doctorName: string;
  specialization: string;
  patientCount: number;
}

export interface ConditionDistributionItem {
  condition: string;
  count: number;
  percentage?: number;
}

export interface DashboardFilterParams {
  from?: string;
  to?: string;
  interval?: "day" | "month";
}

// Backward-compatible types for dashboard components
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
