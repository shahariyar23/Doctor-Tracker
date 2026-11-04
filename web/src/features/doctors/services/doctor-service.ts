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
    code: "#DOC-1042",
    name: "Dr. Marcus Vance",
    specialization: "Cardiology",
    hospital: "Central City Hospital",
    phone: "+1 (555) 234-8910",
    email: "marcus.vance@doctortracker.com",
    status: "Active",
    shift: "Morning",
    patientCount: 32,
    maxCapacity: 35,
    createdAt: "2026-09-15T08:00:00Z",
  },
  {
    id: "doc-2",
    code: "#DOC-1088",
    name: "Dr. Priya Patel",
    specialization: "Neurology",
    hospital: "St. Jude Medical Center",
    phone: "+1 (555) 782-9901",
    email: "priya.patel@doctortracker.com",
    status: "Active",
    shift: "Morning",
    patientCount: 28,
    maxCapacity: 35,
    createdAt: "2026-09-18T09:30:00Z",
  },
  {
    id: "doc-3",
    code: "#DOC-1102",
    name: "Dr. Aris Thorne",
    specialization: "Oncology",
    hospital: "Metro Health Institute",
    phone: "+1 (555) 441-2094",
    email: "aris.thorne@doctortracker.com",
    status: "At Capacity",
    shift: "Evening",
    patientCount: 34,
    maxCapacity: 35,
    createdAt: "2026-09-22T11:15:00Z",
  },
  {
    id: "doc-4",
    code: "#DOC-1120",
    name: "Dr. Rachel Green",
    specialization: "Geriatrics",
    hospital: "Pine Valley Hospital",
    phone: "+1 (555) 567-8901",
    email: "rachel.green@doctortracker.com",
    status: "Active",
    shift: "Morning",
    patientCount: 24,
    maxCapacity: 35,
    createdAt: "2026-09-25T14:00:00Z",
  },
  {
    id: "doc-5",
    code: "#DOC-1135",
    name: "Dr. Nathan Drake",
    specialization: "Internal Medicine",
    hospital: "Hope Memorial Hospital",
    phone: "+1 (555) 678-9012",
    email: "nathan.drake@doctortracker.com",
    status: "On Leave",
    shift: "Night",
    patientCount: 0,
    maxCapacity: 35,
    createdAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "doc-6",
    code: "#DOC-1148",
    name: "Dr. Maya Lin",
    specialization: "Pediatrics",
    hospital: "Children's Health Hospital",
    phone: "+1 (555) 789-0123",
    email: "maya.lin@doctortracker.com",
    status: "Available",
    shift: "Morning",
    patientCount: 19,
    maxCapacity: 35,
    createdAt: "2026-10-05T08:45:00Z",
  },
  {
    id: "doc-7",
    code: "#DOC-1160",
    name: "Dr. Alistair Finch",
    specialization: "Thoracic Surgery",
    hospital: "University Surgical Center",
    phone: "+1 (555) 890-1234",
    email: "alistair.finch@doctortracker.com",
    status: "Available",
    shift: "Evening",
    patientCount: 15,
    maxCapacity: 35,
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
