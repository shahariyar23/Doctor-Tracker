import { PaginationParams } from "./pagination";

export interface Doctor {
  id: string;
  _id?: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorFilterParams extends PaginationParams {
  search?: string;
  from?: string;
  to?: string;
  specialty?: string;
}

export interface DoctorStats {
  totalDoctors: number;
  totalAssignedPatients: number;
  unassignedPatients: number;
}

export interface PaginatedDoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: DoctorStats;
}

export interface AssociatedPatient {
  id: string;
  name: string;
  phone?: string | null;
  condition: string;
  age: number;
  gender: string;
  assignedDate: string;
}
