import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService } from "../services/doctor-service";
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

export function useBulkUpdateDoctorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: { ids: string[]; status: any }) => {
      // Backend does not maintain status flags
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useDoctorPatients(_doctorId: string | null) {
  return useQuery<AssociatedPatient[]>({
    queryKey: ["doctor-patients", _doctorId],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });
}

export function useAddPatientToDoctor() {
  return useMutation({
    mutationFn: async (_payload: {
      doctorId: string;
      patientData: {
        name: string;
        phone: string;
        condition: string;
      };
    }) => Promise.resolve(),
  });
}

export function useRemovePatientFromDoctor() {
  return useMutation({
    mutationFn: async (_payload: { doctorId: string; patientId: string }) => Promise.resolve(),
  });
}
