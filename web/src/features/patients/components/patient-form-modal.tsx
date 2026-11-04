"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Phone, User, Activity, Stethoscope, AlertCircle } from "lucide-react";
import { patientSchema, PatientFormData } from "../schemas/patient-schema";
import { Patient } from "../types";
import { useCreatePatient, useUpdatePatient } from "../hooks/use-patients";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const onSubmit = async (data: PatientFormData) => {
    setFormError(null);
    try {
      if (isEditing && patientToEdit) {
        await updateMutation.mutateAsync({
          id: patientToEdit.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(
        e.response?.data?.message || e.message || "Failed to save patient. Please check required fields."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? "Edit Patient Details" : "Register New Patient"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enter medical profile and allocate an attending physician
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="patient-name" className="text-xs font-semibold">
                Patient Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="patient-name"
                  type="text"
                  placeholder="e.g. Katherine Hawthorne"
                  {...register("name")}
                  className="pl-9 text-xs"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="patient-phone" className="text-xs font-semibold">
                Contact Phone Number *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="patient-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                  className="pl-9 text-xs"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Medical Condition */}
              <div className="space-y-1.5">
                <Label htmlFor="patient-condition" className="text-xs font-semibold">
                  Medical Condition *
                </Label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <select
                    id="patient-condition"
                    {...register("condition")}
                    className="h-8 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
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
              <div className="space-y-1.5">
                <Label htmlFor="patient-status" className="text-xs font-semibold">
                  Record Status
                </Label>
                <select
                  id="patient-status"
                  {...register("status")}
                  className="h-8 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Assigned Doctor */}
            <div className="space-y-1.5">
              <Label htmlFor="patient-doc" className="text-xs font-semibold">
                Assigned Attending Doctor
              </Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <select
                  id="patient-doc"
                  {...register("assignedDoctorId")}
                  className="h-8 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
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
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="gap-1.5"
            >
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              )}
              <span>{isEditing ? "Save Patient" : "Register Patient"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
