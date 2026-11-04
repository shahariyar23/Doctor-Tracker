import { PaginationParams } from "./pagination";

export type DoctorStatus = "Active" | "Available" | "On Leave" | "At Capacity";
export type DoctorShift = "Morning" | "Evening" | "Night" | "All Shifts";

export interface Doctor {
  id: string;
  _id?: string;
  code?: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status?: DoctorStatus;
  shift?: DoctorShift;
  patientCount?: number;
  maxCapacity?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorFilterParams extends PaginationParams {
  search?: string;
  from?: string;
  to?: string;
  specialty?: string;
  hospital?: string;
  status?: string;
  shift?: string;
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
  phone?: string;
  condition?: string;
  status?: string;
  assignedDate?: string;
}
