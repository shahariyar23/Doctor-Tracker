export type PatientCondition =
  | "Critical"
  | "Under Treatment"
  | "Stable"
  | "Recovering";

export type PatientStatus = "Active" | "Inactive" | "Archived";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  condition: PatientCondition;
  status: PatientStatus;
  assignedDoctorId?: string | null;
  assignedDoctor?: {
    id: string;
    name: string;
    specialization?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientFilterParams {
  search?: string;
  condition?: string;
  status?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

