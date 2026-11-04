import { apiClient } from "@/lib/api-client";
import {
  Patient,
  PatientFilterParams,
  PaginatedPatientsResponse,
} from "../types";
import { PatientFormData } from "../schemas/patient-schema";

let mockPatients: Patient[] = [
  {
    id: "pt-1",
    code: "#MRN-8492",
    name: "Elena Rostova",
    phone: "+1 (555) 111-2233",
    age: 42,
    gender: "Female",
    condition: "Critical",
    status: "Active",
    roomNumber: "ICU-04",
    assignedDoctorId: "doc-1",
    assignedDoctor: { id: "doc-1", name: "Dr. Marcus Vance", specialization: "Cardiology" },
    createdAt: "2026-10-14T08:30:00Z",
  },
  {
    id: "pt-2",
    code: "#MRN-8510",
    name: "David Kim",
    phone: "+1 (555) 222-3344",
    age: 38,
    gender: "Male",
    condition: "Under Treatment",
    status: "Active",
    roomNumber: "Ward-202",
    assignedDoctorId: "doc-2",
    assignedDoctor: { id: "doc-2", name: "Dr. Priya Patel", specialization: "Neurology" },
    createdAt: "2026-10-18T10:15:00Z",
  },
  {
    id: "pt-3",
    code: "#MRN-8534",
    name: "Katherine Hawthorne",
    phone: "+1 (555) 333-4455",
    age: 61,
    gender: "Female",
    condition: "Stable",
    status: "Active",
    roomNumber: "Ward-110",
    assignedDoctorId: "doc-3",
    assignedDoctor: { id: "doc-3", name: "Dr. Aris Thorne", specialization: "Oncology" },
    createdAt: "2026-10-20T11:45:00Z",
  },
  {
    id: "pt-4",
    code: "#MRN-8560",
    name: "Marcus Vance Jr",
    phone: "+1 (555) 444-5566",
    age: 29,
    gender: "Male",
    condition: "Recovering",
    status: "Active",
    roomNumber: "Rehab-08",
    assignedDoctorId: "doc-4",
    assignedDoctor: { id: "doc-4", name: "Dr. Rachel Green", specialization: "Geriatrics" },
    createdAt: "2026-10-22T14:20:00Z",
  },
  {
    id: "pt-5",
    code: "#MRN-8588",
    name: "Arthur Pendelton",
    phone: "+1 (555) 555-6677",
    age: 55,
    gender: "Male",
    condition: "Stable",
    status: "Active",
    roomNumber: "Ward-305",
    assignedDoctorId: "doc-5",
    assignedDoctor: { id: "doc-5", name: "Dr. Nathan Drake", specialization: "Internal Medicine" },
    createdAt: "2026-10-25T09:00:00Z",
  },
  {
    id: "pt-6",
    code: "#MRN-8612",
    name: "Sarah Jenkins",
    phone: "+1 (555) 666-7788",
    age: 8,
    gender: "Female",
    condition: "Under Treatment",
    status: "Active",
    roomNumber: "Peds-12",
    assignedDoctorId: "doc-6",
    assignedDoctor: { id: "doc-6", name: "Dr. Maya Lin", specialization: "Pediatrics" },
    createdAt: "2026-10-28T16:10:00Z",
  },
  {
    id: "pt-7",
    code: "#MRN-8640",
    name: "James Wilson",
    phone: "+1 (555) 777-8899",
    age: 67,
    gender: "Male",
    condition: "Critical",
    status: "Active",
    roomNumber: "Surg-02",
    assignedDoctorId: "doc-7",
    assignedDoctor: { id: "doc-7", name: "Dr. Alistair Finch", specialization: "Thoracic Surgery" },
    createdAt: "2026-10-30T13:40:00Z",
  },
  {
    id: "pt-8",
    code: "#MRN-8675",
    name: "Chloe Bennett",
    phone: "+1 (555) 888-9900",
    age: 33,
    gender: "Female",
    condition: "Stable",
    status: "Active",
    roomNumber: "ER-01",
    assignedDoctorId: null,
    assignedDoctor: null,
    createdAt: "2026-10-31T15:00:00Z",
  },
];

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
      // Fallback preview filtering
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
