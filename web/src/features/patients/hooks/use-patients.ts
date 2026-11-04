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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useBulkDeletePatients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => patientService.bulkDeletePatients(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useBulkReassignPatients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientIds,
      doctorId,
      doctorMeta,
    }: {
      patientIds: string[];
      doctorId: string | null;
      doctorMeta?: { id: string; name: string; specialization: string };
    }) => patientService.bulkReassignPatients(patientIds, doctorId, doctorMeta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useBulkUpdatePatientStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientIds,
      status,
    }: {
      patientIds: string[];
      status: Patient["status"];
    }) => patientService.bulkUpdatePatientStatus(patientIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useReassignPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      doctorId,
    }: {
      patientId: string;
      doctorId: string;
    }) => patientService.reassignDoctor(patientId, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

