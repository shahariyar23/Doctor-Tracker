"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, Phone, User, Activity, Stethoscope, AlertCircle } from "lucide-react";
import { patientSchema, PatientFormData } from "../schemas/patient-schema";
import { Patient } from "../types";
import { useCreatePatient, useUpdatePatient } from "../hooks/use-patients";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
}

export function PatientFormModal({
  isOpen,
  onClose,
  patientToEdit,
}: PatientFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();

  // Load available doctors for assignment selector
  const { data: doctorsData } = useDoctors({ limit: 100 });
  const doctors = doctorsData?.doctors || [];

  const isEditing = !!patientToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      condition: "Stable",
      status: "Active",
      assignedDoctorId: null,
    },
  });

  useEffect(() => {
    if (patientToEdit) {
      reset({
        name: patientToEdit.name,
        phone: patientToEdit.phone,
        condition: patientToEdit.condition,
        status: patientToEdit.status,
        assignedDoctorId: patientToEdit.assignedDoctorId || null,
      });
    } else {
      reset({
        name: "",
        phone: "",
        condition: "Stable",
        status: "Active",
        assignedDoctorId: null,
      });
    }
  }, [patientToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: PatientFormData) => {
    setFormError(null);

    // Format empty doctor string as null
    const payload = {
      ...data,
      assignedDoctorId: data.assignedDoctorId ? data.assignedDoctorId : null,
    };

    try {
      if (isEditing && patientToEdit) {
        await updateMutation.mutateAsync({ id: patientToEdit.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save patient profile. Please verify your inputs."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? "Edit Patient Details" : "Register New Patient"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter medical profile and allocate an attending physician
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Patient Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Katherine Hawthorne"
                  {...register("name")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Contact Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Medical Condition */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Medical Condition *
                </label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    {...register("condition")}
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Stable">Stable</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Recovering">Recovering</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                {errors.condition && (
                  <p className="text-[11px] text-destructive">
                    {errors.condition.message}
                  </p>
                )}
              </div>

              {/* Record Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Record Status
                </label>
                <select
                  {...register("status")}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Assigned Doctor */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Assigned Attending Doctor
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  {...register("assignedDoctorId")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">-- No doctor assigned (Unassigned) --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization}) - {d.hospital}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="h-9 px-5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              )}
              <span>{isEditing ? "Save Patient" : "Register Patient"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
