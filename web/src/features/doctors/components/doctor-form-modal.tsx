"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, AlertCircle, Building2, Mail, Phone, Stethoscope, User } from "lucide-react";
import { doctorSchema, DoctorFormData } from "../schemas/doctor-schema";
import { Doctor } from "../types";
import { useCreateDoctor, useUpdateDoctor } from "../hooks/use-doctors";

interface DoctorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorToEdit?: Doctor | null;
}

const COMMON_SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Oncology",
  "Pediatrics",
  "Internal Medicine",
  "Geriatrics",
  "Thoracic Surgery",
  "Endocrinology",
  "Orthopedics",
  "Dermatology",
  "Psychiatry",
  "General Surgery",
];

export function DoctorFormModal({
  isOpen,
  onClose,
  doctorToEdit,
}: DoctorFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();

  const isEditing = !!doctorToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      specialization: "",
      hospital: "",
      phone: "",
      email: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (doctorToEdit) {
      reset({
        name: doctorToEdit.name,
        specialization: doctorToEdit.specialization,
        hospital: doctorToEdit.hospital || "",
        phone: doctorToEdit.phone,
        email: doctorToEdit.email,
        status: doctorToEdit.status || "Active",
      });
    } else {
      reset({
        name: "",
        specialization: "",
        hospital: "",
        phone: "",
        email: "",
        status: "Active",
      });
    }
  }, [doctorToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: DoctorFormData) => {
    setFormError(null);

    try {
      if (isEditing && doctorToEdit) {
        await updateMutation.mutateAsync({ id: doctorToEdit.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save doctor profile. Please verify all fields."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? "Edit Doctor Profile" : "Add New Doctor"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Register a physician into the Doctor Tracker roster
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Full Name (with credentials) *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Arthur Pendelton, MD"
                  {...register("name")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Specialization */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Specialization *
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  list="specialties-list"
                  type="text"
                  placeholder="e.g. Cardiology"
                  {...register("specialization")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <datalist id="specialties-list">
                  {COMMON_SPECIALTIES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              {errors.specialization && (
                <p className="text-[11px] text-destructive">
                  {errors.specialization.message}
                </p>
              )}
            </div>

            {/* Hospital (PDF §2.2 requirement) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Hospital / Clinical Facility *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Central Memorial Hospital"
                  {...register("hospital")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {errors.hospital && (
                <p className="text-[11px] text-destructive">
                  {errors.hospital.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  placeholder="doctor@hospital.org"
                  {...register("email")}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Phone Number *
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

            {/* Status */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Operational Status
              </label>
              <select
                {...register("status")}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Active">Active (On Duty)</option>
                <option value="Available">Available (Accepting Patients)</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
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
              <span>{isEditing ? "Save Changes" : "Register Doctor"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
