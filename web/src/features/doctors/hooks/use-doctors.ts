import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService } from "../services/doctor-service";
import { patientService } from "@/features/patients/services/patient-service";
import { Doctor, DoctorFilterParams, AssociatedPatient } from "../types";
import { DoctorFormData } from "../schemas/doctor-schema";

export function useDoctors(params: DoctorFilterParams = {}) {
  return useQuery({
    queryKey: ["doctors", params],
    queryFn: () => doctorService.getDoctors(params),
  });
}

export function useDoctor(id: string | null) {
  return useQuery({
    queryKey: ["doctor", id],
    queryFn: () => (id ? doctorService.getDoctorById(id) : null),
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DoctorFormData) => doctorService.createDoctor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DoctorFormData> }) =>
      doctorService.updateDoctor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorService.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useBulkDeleteDoctors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await doctorService.deleteDoctor(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDoctorPatients(doctorId: string | null) {
  return useQuery<AssociatedPatient[]>({
    queryKey: ["doctor-patients", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await patientService.getPatients({
        doctorId,
        limit: 100,
      });
      return res.patients.map((p) => ({
        id: p.id,
        name: p.name,
        condition: p.condition,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        assignedDate: p.createdAt,
      }));
    },
    enabled: !!doctorId,
  });
}

export function useAddPatientToDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      doctorId: string;
      patientData: {
        name: string;
        phone?: string;
        condition: string;
        age?: number;
        gender?: "male" | "female" | "other" | "prefer_not_to_say";
      };
    }) => {
      return patientService.createPatient({
        name: payload.patientData.name,
        phone: payload.patientData.phone,
        condition: payload.patientData.condition,
        age: payload.patientData.age ?? 30,
        gender: payload.patientData.gender ?? "prefer_not_to_say",
        assignedDoctorId: payload.doctorId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-patients", variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRemovePatientFromDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { doctorId: string; patientId: string }) => {
      return patientService.updatePatient(payload.patientId, {
        assignedDoctorId: null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-patients", variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
