import { PaginationParams } from "./pagination";

export type PatientGender = "male" | "female" | "other" | "prefer_not_to_say";
export type PatientCondition = string;
export type PatientStatus = "Active" | "Inactive" | "Archived";

export interface Patient {
  id: string;
  _id?: string;
  code?: string;
  name: string;
  phone?: string | null;
  age: number;
  gender: PatientGender;
  condition: PatientCondition;
  status?: PatientStatus;
  bloodGroup?: string;
  roomNumber?: string;
  assignedDoctorId: string;
  assignedDoctor?: {
    id: string;
    _id?: string;
    name: string;
    specialization?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientFilterParams extends PaginationParams {
  search?: string;
  condition?: string;
  status?: string;
  from?: string;
  to?: string;
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
