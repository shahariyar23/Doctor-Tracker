import { apiClient } from "@/lib/api-client";
import {
  Doctor,
  DoctorFilterParams,
  PaginatedDoctorsResponse,
  AssociatedPatient,
} from "../types";
import { DoctorFormData } from "../schemas/doctor-schema";
import initialDoctors from "@/data/doctors.json";
import initialDoctorPatients from "@/data/doctor-patients.json";

let mockDoctors: Doctor[] = [...(initialDoctors as Doctor[])];

const mockDoctorPatients: Record<string, AssociatedPatient[]> = {
  ...(initialDoctorPatients as Record<string, AssociatedPatient[]>),
};

export const doctorService = {
  getDoctors: async (
    params: DoctorFilterParams = {}
  ): Promise<PaginatedDoctorsResponse> => {
    try {
      const response = await apiClient.get<PaginatedDoctorsResponse>("/doctors", {
        params,
      });
      return response.data;
    } catch {
      // Fallback preview filtering using centralized JSON data
      let filtered = [...mockDoctors];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.code && d.code.toLowerCase().includes(q)) ||
            d.specialization.toLowerCase().includes(q) ||
            d.hospital.toLowerCase().includes(q) ||
            d.email.toLowerCase().includes(q)
        );
      }
      if (params.specialty) {
        filtered = filtered.filter((d) => d.specialization === params.specialty);
      }
      if (params.status) {
        if (params.status === "Accepting Patients") {
          filtered = filtered.filter((d) => d.status === "Available" || d.status === "Active");
        } else {
          filtered = filtered.filter((d) => d.status === params.status);
        }
      }
      if (params.shift && params.shift !== "All Shifts") {
        filtered = filtered.filter((d) => d.shift === params.shift);
      }

      return {
        doctors: filtered,
        total: filtered.length,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(filtered.length / (params.limit || 10)) || 1,
        stats: {
          totalDoctors: 148,
          activeOnDuty: 136,
          availabilityRate: 91.9,
          avgCaseload: 25.1,
          atCapacity: 12,
          onLeave: 12,
          acceptingPatients: 94,
        },
      };
    }
  },

  getDoctorById: async (id: string): Promise<Doctor> => {
    try {
      const response = await apiClient.get<Doctor>(`/doctors/${id}`);
      return response.data;
    } catch {
      const doc = mockDoctors.find((d) => d.id === id);
      if (!doc) throw new Error("Doctor not found");
      return doc;
    }
  },

  createDoctor: async (data: DoctorFormData): Promise<Doctor> => {
    try {
      const response = await apiClient.post<Doctor>("/doctors", data);
      return response.data;
    } catch {
      const newDoc: Doctor = {
        id: `doc-${Date.now()}`,
        name: data.name,
        specialization: data.specialization,
        hospital: data.hospital,
        phone: data.phone,
        email: data.email,
        status: data.status || "Active",
        patientCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockDoctors = [newDoc, ...mockDoctors];
      return newDoc;
    }
  },

  updateDoctor: async (id: string, data: Partial<DoctorFormData>): Promise<Doctor> => {
    try {
      const response = await apiClient.put<Doctor>(`/doctors/${id}`, data);
      return response.data;
    } catch {
      const idx = mockDoctors.findIndex((d) => d.id === id);
      if (idx !== -1) {
        mockDoctors[idx] = { ...mockDoctors[idx], ...data };
        return mockDoctors[idx];
      }
      throw new Error("Doctor not found");
    }
  },

  deleteDoctor: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/doctors/${id}`);
      return response.data;
    } catch {
      mockDoctors = mockDoctors.filter((d) => d.id !== id);
      return { success: true };
    }
  },

  bulkDeleteDoctors: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; count: number }>("/doctors/bulk-delete", { ids });
      return response.data;
    } catch {
      const initialLength = mockDoctors.length;
      mockDoctors = mockDoctors.filter((d) => !ids.includes(d.id));
      return { success: true, count: initialLength - mockDoctors.length };
    }
  },

  bulkUpdateDoctorStatus: async (ids: string[], status: Doctor["status"]): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; count: number }>("/doctors/bulk-status", { ids, status });
      return response.data;
    } catch {
      let count = 0;
      mockDoctors = mockDoctors.map((d) => {
        if (ids.includes(d.id)) {
          count++;
          return { ...d, status };
        }
        return d;
      });
      return { success: true, count };
    }
  },

  getDoctorPatients: async (doctorId: string): Promise<AssociatedPatient[]> => {
    try {
      const response = await apiClient.get<AssociatedPatient[]>(
        `/doctors/${doctorId}/patients`
      );
      return response.data;
    } catch {
      return mockDoctorPatients[doctorId] || [];
    }
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
    try {
      const response = await apiClient.post<AssociatedPatient>(
        `/doctors/${doctorId}/patients`,
        patientData
      );
      return response.data;
    } catch {
      const newPatient: AssociatedPatient = {
        id: `pt-${Date.now()}`,
        name: patientData.name,
        condition: patientData.condition as AssociatedPatient["condition"],
        assignedDate: new Date().toLocaleDateString(),
        phone: patientData.phone,
        notes: patientData.notes,
      };
      if (!mockDoctorPatients[doctorId]) {
        mockDoctorPatients[doctorId] = [];
      }
      mockDoctorPatients[doctorId] = [newPatient, ...mockDoctorPatients[doctorId]];
      // Increment doctor patient count
      const doc = mockDoctors.find((d) => d.id === doctorId);
      if (doc) doc.patientCount = (doc.patientCount || 0) + 1;
      return newPatient;
    }
  },

  removePatientFromDoctor: async (
    doctorId: string,
    patientId: string
  ): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete(
        `/doctors/${doctorId}/patients/${patientId}`
      );
      return response.data;
    } catch {
      if (mockDoctorPatients[doctorId]) {
        mockDoctorPatients[doctorId] = mockDoctorPatients[doctorId].filter(
          (p) => p.id !== patientId
        );
      }
      const doc = mockDoctors.find((d) => d.id === doctorId);
      if (doc && (doc.patientCount || 0) > 0) {
        doc.patientCount = doc.patientCount! - 1;
      }
      return { success: true };
    }
  },
};
