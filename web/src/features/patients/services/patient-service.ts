import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api-response";
import type {
  Patient,
  PatientFilterParams,
  PaginatedPatientsResponse,
} from "../types";
import type { PatientFormData } from "../schemas/patient-schema";

export const patientService = {
  /**
   * GET /api/v1/patients
   */
  getPatients: async (
    params: PatientFilterParams = {}
  ): Promise<PaginatedPatientsResponse> => {
    const queryParams: Record<string, unknown> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    if (params.search) queryParams.search = params.search;
    if (params.condition) queryParams.condition = params.condition;
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;

    const response = await apiClient.get<ApiResponse<Patient[]>>("/patients", {
      params: queryParams,
    });

    const patients = (response.data.data || []).map((p) => ({
      ...p,
      id: p.id || p._id || "",
    }));

    const meta = response.data.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: patients.length,
      totalPages: Math.ceil(patients.length / (params.limit || 10)) || 1,
    };

    return {
      patients,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  },

  /**
   * GET /api/v1/patients/:id
   */
  getPatientById: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<ApiResponse<Patient>>(`/patients/${id}`);
    const p = response.data.data;
    return {
      ...p,
      id: p.id || p._id || "",
    };
  },

  /**
   * POST /api/v1/patients
   */
  createPatient: async (data: PatientFormData): Promise<Patient> => {
    const payload = {
      name: data.name,
      condition: data.condition,
      assignedDoctorId: data.assignedDoctorId,
      age: Number(data.age),
      gender: data.gender,
      phone: data.phone || null,
    };
    const response = await apiClient.post<ApiResponse<Patient>>("/patients", payload);
    const p = response.data.data;
    return {
      ...p,
      id: p.id || p._id || "",
    };
  },

  /**
   * PATCH /api/v1/patients/:id
   */
  updatePatient: async (id: string, data: Partial<PatientFormData>): Promise<Patient> => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.condition !== undefined) payload.condition = data.condition;
    if (data.assignedDoctorId !== undefined) payload.assignedDoctorId = data.assignedDoctorId;
    if (data.age !== undefined) payload.age = Number(data.age);
    if (data.gender !== undefined) payload.gender = data.gender;
    if (data.phone !== undefined) payload.phone = data.phone || null;

    const response = await apiClient.patch<ApiResponse<Patient>>(`/patients/${id}`, payload);
    const p = response.data.data;
    return {
      ...p,
      id: p.id || p._id || "",
    };
  },

  /**
   * DELETE /api/v1/patients/:id
   */
  deletePatient: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/patients/${id}`);
  },
};
