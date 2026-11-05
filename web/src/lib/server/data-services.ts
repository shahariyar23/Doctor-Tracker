import "server-only";
import { serverFetch, getBackendUrl } from "@/lib/server/api-client";
import type {
  DashboardOverviewData,
  PatientTrendsData,
  PatientsByDoctorItem,
  ConditionDistributionItem,
  DashboardFilterParams,
} from "@/types/dashboard";
import type { PaginatedDoctorsResponse, Doctor, DoctorFilterParams } from "@/types/doctor";
import type {
  PaginatedPatientsResponse,
  Patient,
  PatientFilterParams,
  PatientStats,
} from "@/types/patient";

export const serverDashboardService = {
  getOverview: async (
    params: { from?: string; to?: string } = {},
  ): Promise<DashboardOverviewData> => {
    return serverFetch<DashboardOverviewData>("/dashboard/overview", { params });
  },

  getPatientTrends: async (params: DashboardFilterParams = {}): Promise<PatientTrendsData> => {
    return serverFetch<PatientTrendsData>("/dashboard/patient-trends", { params });
  },

  getPatientsByDoctor: async (): Promise<PatientsByDoctorItem[]> => {
    return serverFetch<PatientsByDoctorItem[]>("/dashboard/patients-by-doctor");
  },

  getConditionsDistribution: async (): Promise<ConditionDistributionItem[]> => {
    return serverFetch<ConditionDistributionItem[]>("/dashboard/conditions");
  },
};

export const serverDoctorService = {
  getDoctors: async (params: DoctorFilterParams = {}): Promise<PaginatedDoctorsResponse> => {
    const queryParams: Record<string, string | number | boolean | undefined> = {
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

    // The backend returns an array of doctors in data and pagination in meta
    // Note: serverFetch unwraps data. To preserve meta when needed, we can call directly
    // Let's do a direct fetch or handle meta:
    const cookieStore = await (await import("next/headers")).cookies();
    const tokenCookie = cookieStore.get("token");
    const backendBase = getBackendUrl();

    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined) searchParams.append(k, String(v));
    }

    const res = await fetch(`${backendBase}/doctors?${searchParams.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(tokenCookie?.value ? { Cookie: `token=${tokenCookie.value}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch doctors: ${res.status}`);
    }

    const payload = await res.json();
    const rawList: Doctor[] = payload.data || [];
    const doctors = rawList.map((doc: Doctor & { _id?: string }) => ({
      ...doc,
      id: doc.id || doc._id || "",
    }));

    const meta = payload.meta || {
      page: Number(queryParams.page),
      limit: Number(queryParams.limit),
      total: doctors.length,
      totalPages: Math.ceil(doctors.length / Number(queryParams.limit)) || 1,
    };

    return {
      doctors,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  },

  getDoctorById: async (id: string): Promise<Doctor> => {
    const doc = await serverFetch<Doctor & { _id?: string }>(`/doctors/${id}`);
    return {
      ...doc,
      id: doc.id || doc._id || "",
    };
  },
};

export const serverPatientService = {
  getPatients: async (params: PatientFilterParams = {}): Promise<PaginatedPatientsResponse> => {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    if (params.search) queryParams.search = params.search;
    if (params.condition) queryParams.condition = params.condition;
    if (params.doctorId) queryParams.doctorId = params.doctorId;
    const fromDate = params.from || params.startDate;
    const toDate = params.to || params.endDate;
    if (fromDate) queryParams.from = fromDate;
    if (toDate) queryParams.to = toDate;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const cookieStore = await (await import("next/headers")).cookies();
    const tokenCookie = cookieStore.get("token");
    const backendBase = getBackendUrl();

    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined) searchParams.append(k, String(v));
    }

    const res = await fetch(`${backendBase}/patients?${searchParams.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(tokenCookie?.value ? { Cookie: `token=${tokenCookie.value}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch patients: ${res.status}`);
    }

    const payload = await res.json();
    const rawList: (Patient & { _id?: string })[] = payload.data || [];
    const patients = rawList.map((p) => {
      let rawDoctorId: string | null = null;
      let populatedDoctor: any = null;

      if (p.assignedDoctorId && typeof p.assignedDoctorId === "object") {
        const d = p.assignedDoctorId as any;
        rawDoctorId = d.id || d._id || null;
        populatedDoctor = {
          id: d.id || d._id || "",
          _id: d._id,
          name: d.name || "",
          specialization: d.specialization,
          hospital: d.hospital,
          email: d.email,
          phone: d.phone,
        };
      } else if (typeof p.assignedDoctorId === "string" && p.assignedDoctorId.trim().length > 0) {
        rawDoctorId = p.assignedDoctorId.trim();
        populatedDoctor = p.assignedDoctor || null;
      }

      return {
        ...p,
        id: p.id || p._id || "",
        assignedDoctorId: rawDoctorId,
        assignedDoctor: populatedDoctor,
      };
    });

    const meta = payload.meta || {
      page: Number(queryParams.page),
      limit: Number(queryParams.limit),
      total: patients.length,
      totalPages: Math.ceil(patients.length / Number(queryParams.limit)) || 1,
    };

    return {
      patients,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  },

  getPatientStats: async (): Promise<PatientStats> => {
    return serverFetch<PatientStats>("/patients/stats");
  },
};
