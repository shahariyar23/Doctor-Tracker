export type DoctorStatus = "Active" | "Available" | "On Leave" | "At Capacity";

export interface Doctor {
  id: string;
  code?: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status?: DoctorStatus;
  shift?: "Morning" | "Evening" | "Night" | "All Shifts";
  patientCount?: number;
  maxCapacity?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorFilterParams {
  search?: string;
  specialty?: string;
  hospital?: string;
  status?: string;
  shift?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: DoctorStats;
}

export interface DoctorStats {
  totalDoctors: number;
  activeOnDuty: number;
  availabilityRate: number;
  avgCaseload: number;
  atCapacity: number;
  onLeave: number;
  acceptingPatients: number;
}

export interface AssociatedPatient {
  id: string;
  name: string;
  phone?: string;
  condition: "Critical" | "Under Treatment" | "Stable" | "Recovering";
  assignedDate: string;
  mrn?: string;
  notes?: string;
}
