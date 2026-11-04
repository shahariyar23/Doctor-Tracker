import { apiClient } from "@/lib/api-client";
import {
  Doctor,
  DoctorFilterParams,
  PaginatedDoctorsResponse,
  AssociatedPatient,
} from "../types";
import { DoctorFormData } from "../schemas/doctor-schema";

let mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Marcus Vance, MD",
    specialization: "Cardiology",
    hospital: "Central City Hospital",
    phone: "+1 (555) 234-8910",
    email: "marcus.vance@doctortracker.com",
    status: "Active",
    patientCount: 32,
    createdAt: "2026-09-15T08:00:00Z",
  },
  {
    id: "doc-2",
    name: "Dr. Priya Patel, MD",
    specialization: "Neurology",
    hospital: "St. Jude Medical Center",
    phone: "+1 (555) 345-6789",
    email: "priya.patel@doctortracker.com",
    status: "Active",
    patientCount: 28,
    createdAt: "2026-09-18T09:30:00Z",
  },
  {
    id: "doc-3",
    name: "Dr. Aris Thorne, MD",
    specialization: "Oncology",
    hospital: "Metro Health Institute",
    phone: "+1 (555) 456-7890",
    email: "aris.thorne@doctortracker.com",
    status: "Available",
    patientCount: 26,
    createdAt: "2026-09-22T11:15:00Z",
  },
  {
    id: "doc-4",
    name: "Dr. Rachel Green, MD",
    specialization: "Geriatrics",
    hospital: "Pine Valley Hospital",
    phone: "+1 (555) 567-8901",
    email: "rachel.green@doctortracker.com",
    status: "Active",
    patientCount: 24,
    createdAt: "2026-09-25T14:00:00Z",
  },
  {
    id: "doc-5",
    name: "Dr. Nathan Drake, MD",
    specialization: "Internal Medicine",
    hospital: "Hope Memorial Hospital",
    phone: "+1 (555) 678-9012",
    email: "nathan.drake@doctortracker.com",
    status: "On Leave",
    patientCount: 21,
    createdAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "doc-6",
    name: "Dr. Maya Lin, MD",
    specialization: "Pediatrics",
    hospital: "Children's Health Hospital",
    phone: "+1 (555) 789-0123",
    email: "maya.lin@doctortracker.com",
    status: "Active",
    patientCount: 19,
    createdAt: "2026-10-05T08:45:00Z",
  },
  {
    id: "doc-7",
    name: "Dr. Alistair Finch, MD",
    specialization: "Thoracic Surgery",
    hospital: "University Surgical Center",
    phone: "+1 (555) 890-1234",
    email: "alistair.finch@doctortracker.com",
    status: "Available",
    patientCount: 15,
    createdAt: "2026-10-10T13:20:00Z",
  },
];

const mockDoctorPatients: Record<string, AssociatedPatient[]> = {
  "doc-1": [
    {
      id: "pt-1",
      name: "Elena Rostova",
      condition: "Critical",
      assignedDate: "Oct 14, 2026",
      phone: "+1 (555) 111-2233",
      notes: "Follow-up scheduled",
    },
    {
      id: "pt-8",
      name: "David Kim",
      condition: "Under Treatment",
      assignedDate: "Oct 18, 2026",
      phone: "+1 (555) 222-3344",
      notes: "Stable response to beta blockers",
    },
    {
      id: "pt-9",
      name: "Lucas Meyer",
      condition: "Stable",
      assignedDate: "Oct 22, 2026",
      phone: "+1 (555) 333-7788",
    },
  ],
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
      // Fallback preview filtering
      let filtered = [...mockDoctors];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.specialization.toLowerCase().includes(q) ||
            d.hospital.toLowerCase().includes(q) ||
            d.email.toLowerCase().includes(q)
        );
      }
      if (params.specialty) {
        filtered = filtered.filter((d) => d.specialization === params.specialty);
      }
      return {
        doctors: filtered,
        total: filtered.length,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(filtered.length / (params.limit || 10)) || 1,
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
