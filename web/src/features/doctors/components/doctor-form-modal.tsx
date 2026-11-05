"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Building2, Mail, Phone, Stethoscope, User, UserPlus } from "lucide-react";
import { doctorSchema, DoctorFormData } from "../schemas/doctor-schema";
import { Doctor } from "../types";
import { useCreateDoctor, useUpdateDoctor } from "../hooks/use-doctors";
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
      });
    } else {
      reset({
        name: "",
        specialization: "",
        hospital: "",
        phone: "",
        email: "",
      });
    }
  }, [doctorToEdit, reset, isOpen]);

  const onSubmit = async (data: DoctorFormData) => {
    setFormError(null);
    try {
      if (isEditing && doctorToEdit) {
        await updateMutation.mutateAsync({
          id: doctorToEdit.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(
        e.response?.data?.message || e.message || "Failed to save doctor. Please verify details."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? "Edit Doctor Profile" : "Add New Doctor"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register a physician into the Doctor Tracker roster
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="doc-name" className="text-xs font-semibold">
                Full Name (with credentials) *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="doc-name"
                  type="text"
                  placeholder="e.g. Dr. Arthur Pendelton, MD"
                  {...register("name")}
                  className="pl-9 text-xs"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Specialization */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-spec" className="text-xs font-semibold">
                Specialization *
              </Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="doc-spec"
                  list="specialties-list"
                  type="text"
                  placeholder="e.g. Cardiology"
                  {...register("specialization")}
                  className="pl-9 text-xs"
                />
                <datalist id="specialties-list">
                  {COMMON_SPECIALTIES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              {errors.specialization && (
                <p className="text-[11px] text-destructive">{errors.specialization.message}</p>
              )}
            </div>

            {/* Hospital Affiliation */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-hospital" className="text-xs font-semibold">
                Hospital Affiliation *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="doc-hospital"
                  type="text"
                  placeholder="e.g. Metro Health System"
                  {...register("hospital")}
                  className="pl-9 text-xs"
                />
              </div>
              {errors.hospital && (
                <p className="text-[11px] text-destructive">{errors.hospital.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-phone" className="text-xs font-semibold">
                Phone Number *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="doc-phone"
                  type="tel"
                  placeholder="e.g. 01761102860"
                  {...register("phone")}
                  className="pl-9 text-xs"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-email" className="text-xs font-semibold">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="doc-email"
                  type="email"
                  placeholder="e.g. arthur.p@hospital.org"
                  {...register("email")}
                  className="pl-9 text-xs"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
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
              <span>{isEditing ? "Save Changes" : "Register Doctor"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
