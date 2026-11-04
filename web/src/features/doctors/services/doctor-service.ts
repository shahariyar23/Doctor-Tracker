import { apiClient } from "@/lib/api-client";
import {
  Doctor,
  DoctorFilterParams,
  PaginatedDoctorsResponse,
  AssociatedPatient,
} from "../types";
import { DoctorFormData } from "../schemas/doctor-schema";

export const doctorService = {
  getDoctors: async (
    params: DoctorFilterParams = {}
  ): Promise<PaginatedDoctorsResponse> => {
    const response = await apiClient.get<PaginatedDoctorsResponse>("/doctors", {
      params,
    });
    return response.data;
  },

  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await apiClient.get<Doctor>(`/doctors/${id}`);
    return response.data;
  },

  createDoctor: async (data: DoctorFormData): Promise<Doctor> => {
    const response = await apiClient.post<Doctor>("/doctors", data);
    return response.data;
  },

  updateDoctor: async (id: string, data: Partial<DoctorFormData>): Promise<Doctor> => {
    const response = await apiClient.put<Doctor>(`/doctors/${id}`, data);
    return response.data;
  },

  deleteDoctor: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete(`/doctors/${id}`);
    return response.data;
  },

  getDoctorPatients: async (doctorId: string): Promise<AssociatedPatient[]> => {
    const response = await apiClient.get<AssociatedPatient[]>(
      `/doctors/${doctorId}/patients`
    );
    return response.data;
  },

  addPatientToDoctor: async (
    doctorId: string,
    patientData: {
      name: string;
      condition: string;
      phone?: string;
      notes?: string;
    }
  ): Promise<AssociatedPatient> => {
    const response = await apiClient.post<AssociatedPatient>(
      `/doctors/${doctorId}/patients`,
      patientData
    );
    return response.data;
  },

  removePatientFromDoctor: async (
    doctorId: string,
    patientId: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(
      `/doctors/${doctorId}/patients/${patientId}`
    );
    return response.data;
  },
};

