export interface SearchDoctorResult {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  email: string;
  phone: string;
}

export interface SearchPatientResult {
  id: string;
  name: string;
  condition: string;
  age: number;
  gender: string;
  phone: string | null;
  assignedDoctor: {
    id: string;
    name: string;
  } | null;
}

export interface GlobalSearchData {
  doctors: SearchDoctorResult[];
  patients: SearchPatientResult[];
  total: number;
}

