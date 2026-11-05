import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api-response";
import type {
  Doctor,
  DoctorFilterParams,
  PaginatedDoctorsResponse,
} from "../types";
import type { DoctorFormData } from "../schemas/doctor-schema";

export const doctorService = {
  /**
   * GET /api/v1/doctors
   */
  getDoctors: async (
    params: DoctorFilterParams = {}
  ): Promise<PaginatedDoctorsResponse> => {
    // Map any specialty query to search or directly pass
    const queryParams: Record<string, unknown> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    if (params.search) queryParams.search = params.search;
    const fromDate = params.from || params.startDate;
    const toDate = params.to || params.endDate;
    if (fromDate) queryParams.from = fromDate;
    if (toDate) queryParams.to = toDate;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.specialty && !params.search) queryParams.search = params.specialty;

    const response = await apiClient.get<ApiResponse<Doctor[]>>("/doctors", {
      params: queryParams,
    });

    const doctors = (response.data.data || []).map((doc) => ({
      ...doc,
      id: doc.id || doc._id || "",
    }));

    const meta = response.data.meta || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: doctors.length,
      totalPages: Math.ceil(doctors.length / (params.limit || 10)) || 1,
    };

    return {
      doctors,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  },

  /**
   * GET /api/v1/doctors/:id
   */
  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    const doc = response.data.data;
    return {
      ...doc,
      id: doc.id || doc._id || "",
    };
  },

  /**
   * POST /api/v1/doctors
   */
  createDoctor: async (data: DoctorFormData): Promise<Doctor> => {
    const payload = {
      name: data.name,
      specialization: data.specialization,
      hospital: data.hospital,
      phone: data.phone,
      email: data.email,
    };
    const response = await apiClient.post<ApiResponse<Doctor>>("/doctors", payload);
    const doc = response.data.data;
    return {
      ...doc,
      id: doc.id || doc._id || "",
    };
  },

  /**
   * PATCH /api/v1/doctors/:id
   */
  updateDoctor: async (id: string, data: Partial<DoctorFormData>): Promise<Doctor> => {
    const payload: Record<string, unknown> = {};
    if (data.name) payload.name = data.name;
    if (data.specialization) payload.specialization = data.specialization;
    if (data.hospital) payload.hospital = data.hospital;
    if (data.phone) payload.phone = data.phone;
    if (data.email) payload.email = data.email;

    const response = await apiClient.patch<ApiResponse<Doctor>>(`/doctors/${id}`, payload);
    const doc = response.data.data;
    return {
      ...doc,
      id: doc.id || doc._id || "",
    };
  },

  /**
   * DELETE /api/v1/doctors/:id
   */
  deleteDoctor: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/doctors/${id}`);
  },
};
