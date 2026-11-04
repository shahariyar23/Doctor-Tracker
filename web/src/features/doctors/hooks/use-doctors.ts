import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService } from "../services/doctor-service";
import { Doctor, DoctorFilterParams } from "../types";
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
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
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorService.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useBulkDeleteDoctors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => doctorService.bulkDeleteDoctors(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useBulkUpdateDoctorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Doctor["status"] }) =>
      doctorService.bulkUpdateDoctorStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useDoctorPatients(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctor-patients", doctorId],
    queryFn: () =>
      doctorId ? doctorService.getDoctorPatients(doctorId) : Promise.resolve([]),
    enabled: !!doctorId,
  });
}

export function useAddPatientToDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      doctorId,
      patientData,
    }: {
      doctorId: string;
      patientData: {
        name: string;
        condition: string;
        phone?: string;
        notes?: string;
      };
    }) => doctorService.addPatientToDoctor(doctorId, patientData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["doctor-patients", variables.doctorId],
      });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useRemovePatientFromDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      doctorId,
      patientId,
    }: {
      doctorId: string;
      patientId: string;
    }) => doctorService.removePatientFromDoctor(doctorId, patientId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["doctor-patients", variables.doctorId],
      });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

