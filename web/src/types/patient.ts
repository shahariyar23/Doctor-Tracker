import { PaginationParams } from "./pagination";

export type PatientCondition = "Critical" | "Under Treatment" | "Stable" | "Recovering";

export type PatientStatus = "Active" | "Inactive" | "Archived";

export interface Patient {
  id: string;
  code?: string;
  name: string;
  phone: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  condition: PatientCondition;
  status: PatientStatus;
  bloodGroup?: string;
  roomNumber?: string;
  assignedDoctorId?: string | null;
  assignedDoctor?: {
    id: string;
    name: string;
    specialization?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientFilterParams extends PaginationParams {
  condition?: string;
  status?: string;
  doctorId?: string;
}

export interface PatientStats {
  totalPatients: number;
  underTreatment: number;
  criticalCare: number;
  stable: number;
  recovering: number;
  unassigned: number;
}

export interface PaginatedPatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: PatientStats;
}
