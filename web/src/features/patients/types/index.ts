export type PatientCondition = string;

export interface Patient {
  id: string;
  name: string;
  condition: PatientCondition;
  assignedDoctorId?: string | null;
  assignedDoctor?: {
    id: string;
    name: string;
    specialization?: string;
  } | null;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientFilterParams {
  search?: string;
  condition?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PatientStats {
  totalPatients: number;
  assignedCount: number;
  unassignedCount: number;
}

export interface PaginatedPatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: PatientStats;
}
