import { apiClient } from "@/lib/api-client";
import {
  Patient,
  PatientFilterParams,
  PaginatedPatientsResponse,
} from "../types";
import { PatientFormData } from "../schemas/patient-schema";

export const patientService = {
  getPatients: async (
    params: PatientFilterParams = {}
  ): Promise<PaginatedPatientsResponse> => {
    const response = await apiClient.get<PaginatedPatientsResponse>("/patients", {
      params,
    });
    return response.data;
  },

  getPatientById: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: PatientFormData): Promise<Patient> => {
    const response = await apiClient.post<Patient>("/patients", data);
    return response.data;
  },

  updatePatient: async (
    id: string,
    data: Partial<PatientFormData>
  ): Promise<Patient> => {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  deletePatient: async (
    id: string
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete(`/patients/${id}`);
    return response.data;
  },

  reassignDoctor: async (
    patientId: string,
    doctorId: string
  ): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(
      `/patients/${patientId}/reassign`,
      { doctorId }
    );
    return response.data;
  },
};

