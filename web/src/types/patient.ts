import { PaginationParams } from "./pagination";

export type PatientGender = "male" | "female" | "other" | "prefer_not_to_say";
export type PatientCondition = string;

export interface PatientDoctorReference {
  id: string;
  _id?: string;
  name: string;
  specialization?: string;
  hospital?: string;
  email?: string;
  phone?: string;
}

export interface Patient {
  id: string;
  _id?: string;
  name: string;
  phone?: string | null;
  age: number;
  gender: PatientGender;
  condition: PatientCondition;
  assignedDoctorId?: string | null | PatientDoctorReference;
  assignedDoctor?: PatientDoctorReference | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientFilterParams extends PaginationParams {
  search?: string;
  condition?: string;
  from?: string;
  to?: string;
  doctorId?: string;
}

export interface PatientStats {
  totalPatients: number;
  criticalPatients: number;
  underTreatmentPatients: number;
  unassignedPatients: number;
  criticalCare: number;
  underTreatment: number;
  unassigned: number;
  stable?: number;
  recovering?: number;
}

export interface PaginatedPatientsResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: PatientStats;
}
