import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "../services/patient-service";
import { Patient, PatientFilterParams } from "../types";
import { PatientFormData } from "../schemas/patient-schema";

export function usePatients(params: PatientFilterParams = {}) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => patientService.getPatients(params),
  });
}

export function usePatientStats() {
  return useQuery({
    queryKey: ["patients", "stats"],
    queryFn: () => patientService.getPatientStats(),
    staleTime: 30_000,
  });
}

export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => (id ? patientService.getPatientById(id) : null),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientFormData) => patientService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientFormData> }) =>
      patientService.updatePatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useBulkDeletePatients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await patientService.deletePatient(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useBulkReassignPatients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      patientIds,
      doctorId,
    }: {
      patientIds: string[];
      doctorId: string | null;
      doctorMeta?: { id: string; name: string; specialization: string };
    }) => {
      if (!doctorId) return;
      for (const id of patientIds) {
        await patientService.updatePatient(id, { assignedDoctorId: doctorId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useReassignPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, doctorId }: { patientId: string; doctorId: string }) =>
      patientService.updatePatient(patientId, { assignedDoctorId: doctorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
