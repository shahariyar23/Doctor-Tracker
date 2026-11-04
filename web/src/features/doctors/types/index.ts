export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DoctorFilterParams {
  search?: string;
  specialty?: string;
  hospital?: string;
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
  totalPatients: number;
  avgPatientsPerDoctor: number;
}

export interface AssociatedPatient {
  id: string;
  name: string;
  condition: string;
  phone?: string;
  createdAt?: string;
  assignedDate?: string;
}
