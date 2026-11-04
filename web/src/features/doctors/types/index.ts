export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status?: "Active" | "Available" | "On Leave";
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

