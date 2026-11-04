import { apiClient } from "@/lib/api-client";
import {
  Patient,
  PatientFilterParams,
  PaginatedPatientsResponse,
} from "../types";
import { PatientFormData } from "../schemas/patient-schema";
import initialPatients from "@/data/patients.json";

let mockPatients: Patient[] = [...(initialPatients as Patient[])];

export const patientService = {
  getPatients: async (
    params: PatientFilterParams = {}
  ): Promise<PaginatedPatientsResponse> => {
    try {
      const response = await apiClient.get<PaginatedPatientsResponse>("/patients", {
        params,
      });
      return response.data;
    } catch {
      // Fallback preview filtering using centralized JSON data
      let filtered = [...mockPatients];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.code && p.code.toLowerCase().includes(q)) ||
            p.phone.toLowerCase().includes(q) ||
            p.condition.toLowerCase().includes(q) ||
            (p.assignedDoctor?.name && p.assignedDoctor.name.toLowerCase().includes(q))
        );
      }
      if (params.condition) {
        if (params.condition === "Unassigned") {
          filtered = filtered.filter((p) => !p.assignedDoctorId);
        } else {
          filtered = filtered.filter((p) => p.condition === params.condition);
        }
      }
      if (params.status) {
        filtered = filtered.filter((p) => p.status === params.status);
      }
      return {
        patients: filtered,
        total: filtered.length,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(filtered.length / (params.limit || 10)) || 1,
        stats: {
          totalPatients: 248,
          underTreatment: 112,
          criticalCare: 18,
          stable: 84,
          recovering: 34,
          unassigned: 6,
        },
      };
    }
  },

  getPatientById: async (id: string): Promise<Patient> => {
    try {
      const response = await apiClient.get<Patient>(`/patients/${id}`);
      return response.data;
    } catch {
      const p = mockPatients.find((item) => item.id === id);
      if (!p) throw new Error("Patient not found");
      return p;
    }
  },

  createPatient: async (data: PatientFormData): Promise<Patient> => {
    try {
      const response = await apiClient.post<Patient>("/patients", data);
      return response.data;
    } catch {
      const newPt: Patient = {
        id: `pt-${Date.now()}`,
        name: data.name,
        phone: data.phone,
        condition: data.condition,
        status: data.status,
        assignedDoctorId: data.assignedDoctorId || null,
        assignedDoctor: data.assignedDoctorId
          ? { id: data.assignedDoctorId, name: "Assigned Physician" }
          : null,
        createdAt: new Date().toISOString(),
      };
      mockPatients = [newPt, ...mockPatients];
      return newPt;
    }
  },

  updatePatient: async (
    id: string,
    data: Partial<PatientFormData>
  ): Promise<Patient> => {
    try {
      const response = await apiClient.put<Patient>(`/patients/${id}`, data);
      return response.data;
    } catch {
      const idx = mockPatients.findIndex((p) => p.id === id);
      if (idx !== -1) {
        mockPatients[idx] = { ...mockPatients[idx], ...data };
        return mockPatients[idx];
      }
      throw new Error("Patient not found");
    }
  },

  deletePatient: async (
    id: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/patients/${id}`);
      return response.data;
    } catch {
      mockPatients = mockPatients.filter((p) => p.id !== id);
      return { success: true };
    }
  },

  bulkDeletePatients: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; count: number }>("/patients/bulk-delete", { ids });
      return response.data;
    } catch {
      const initialLength = mockPatients.length;
      mockPatients = mockPatients.filter((d) => !ids.includes(d.id));
      return { success: true, count: initialLength - mockPatients.length };
    }
  },

  bulkReassignPatients: async (
    patientIds: string[],
    doctorId: string | null,
    doctorMeta?: { id: string; name: string; specialization: string }
  ): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; count: number }>("/patients/bulk-reassign", {
        patientIds,
        doctorId,
      });
      return response.data;
    } catch {
      let count = 0;
      mockPatients = mockPatients.map((p) => {
        if (patientIds.includes(p.id)) {
          count++;
          return {
            ...p,
            assignedDoctorId: doctorId,
            assignedDoctor: doctorMeta ? { id: doctorMeta.id, name: doctorMeta.name, specialization: doctorMeta.specialization } : null,
          };
        }
        return p;
      });
      return { success: true, count };
    }
  },

  bulkUpdatePatientStatus: async (
    patientIds: string[],
    status: Patient["status"]
  ): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; count: number }>("/patients/bulk-status", {
        patientIds,
        status,
      });
      return response.data;
    } catch {
      let count = 0;
      mockPatients = mockPatients.map((p) => {
        if (patientIds.includes(p.id)) {
          count++;
          return { ...p, status };
        }
        return p;
      });
      return { success: true, count };
    }
  },

  reassignDoctor: async (
    patientId: string,
    doctorId: string
  ): Promise<Patient> => {
    try {
      const response = await apiClient.patch<Patient>(
        `/patients/${patientId}/reassign`,
        { doctorId }
      );
      return response.data;
    } catch {
      const idx = mockPatients.findIndex((p) => p.id === patientId);
      if (idx !== -1) {
        mockPatients[idx].assignedDoctorId = doctorId;
        return mockPatients[idx];
      }
      throw new Error("Patient not found");
    }
  },
};
