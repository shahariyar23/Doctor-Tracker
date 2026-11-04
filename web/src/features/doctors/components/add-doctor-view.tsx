"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { doctorSchema, DoctorFormData } from "../schemas/doctor-schema";
import { useCreateDoctor } from "../hooks/use-doctors";
import { Button } from "@/components/ui/button";

const COMMON_SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Internal Medicine",
  "Oncology",
  "Orthopedics",
  "Dermatology",
  "General Surgery",
  "Psychiatry",
  "Endocrinology",
  "Geriatrics",
  "Thoracic Surgery",
];

export function AddDoctorView() {
  const router = useRouter();
  const createMutation = useCreateDoctor();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "Dr. Alexander Vance",
      specialization: "Cardiology",
      hospital: "St. Jude Memorial Hospital",
      phone: "+1 (555) 019-2834",
      email: "a.vance@hospital.org",
      status: "Active",
    },
  });

  // Watch fields for live preview card synchronization
  const watchedName = watch("name") || "";
  const watchedSpec = watch("specialization") || "Cardiology";
  const watchedHospital = watch("hospital") || "Hospital Name";
  const watchedPhone = watch("phone") || "Phone Number";
  const watchedEmail = watch("email") || "Email Address";

  // Derive initials for avatar
  const getInitials = (nameStr: string) => {
    const clean = nameStr.replace(/^(dr\.|dr|doctor|md|prof\.)\s+/i, "").trim();
    if (!clean) return "DR";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const onSubmit = async (data: DoctorFormData) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync(data);
      router.push("/doctors");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create doctor record. Please verify fields and try again."
      );
    }
  };

  return (
    <div className="relative w-full overflow-hidden space-y-6">
      {/* Ambient background glow accents */}
      <div className="absolute -top-32 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          {/* Breadcrumb row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Doctor Tracker
            </Link>
            <span>/</span>
            <Link href="/doctors" className="hover:text-foreground transition-colors">
              Doctors
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Create Doctor</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-medium text-[11px] ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              System Directory Form
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Create Doctor
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Add a new physician to the Doctor Tracker system with essential credential details.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            <span>Back to Doctors</span>
          </Link>
        </div>
      </div>

      {/* Main Content Workspace: Asymmetrical Split 7-col / 5-col */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 flex flex-col">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6"
          >
            {/* Form Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold border border-blue-100">
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">
                    Doctor Information
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Required credentials and contact info for the physician
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">* Mandatory fields</span>
            </div>

            {/* Error banner if submission fails */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* Doctor Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-doctor-name"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Doctor Name <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <input
                    id="input-doctor-name"
                    type="text"
                    {...register("name")}
                    placeholder="Enter doctor's full name (e.g. Dr. Alexander Vance)"
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                {errors.name ? (
                  <p className="text-xs text-destructive font-medium">
                    {errors.name.message}
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Enter full formal name including title (e.g., Dr. Jane Smith).
                  </span>
                )}
              </div>

              {/* Specialization */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-doctor-spec"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Specialization <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <Stethoscope className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <select
                    id="input-doctor-spec"
                    {...register("specialization")}
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    <option value="" disabled>
                      Select specialization
                    </option>
                    {COMMON_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.specialization ? (
                  <p className="text-xs text-destructive font-medium">
                    {errors.specialization.message}
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Primary medical clinical specialty category.
                  </span>
                )}
              </div>

              {/* Hospital */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-doctor-hospital"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Hospital <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <input
                    id="input-doctor-hospital"
                    type="text"
                    {...register("hospital")}
                    placeholder="Enter hospital name (e.g. St. Jude Memorial Hospital)"
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                {errors.hospital ? (
                  <p className="text-xs text-destructive font-medium">
                    {errors.hospital.message}
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Current affiliated healthcare facility or primary hospital campus.
                  </span>
                )}
              </div>

              {/* Phone and Email Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="input-doctor-phone"
                    className="text-xs font-semibold text-foreground flex items-center gap-1"
                  >
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                    <input
                      id="input-doctor-phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="+1 (555) 019-2834"
                      className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-destructive font-medium">
                      {errors.phone.message}
                    </p>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Contact phone for direct clinical communication.
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="input-doctor-email"
                    className="text-xs font-semibold text-foreground flex items-center gap-1"
                  >
                    Email <span className="text-destructive">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                    <input
                      id="input-doctor-email"
                      type="email"
                      {...register("email")}
                      placeholder="a.vance@hospital.org"
                      className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-destructive font-medium">
                      {errors.email.message}
                    </p>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Official institutional email address.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
              <Link
                href="/doctors"
                className="h-10 px-4 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating Doctor...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Doctor</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Doctor Card Preview */}
        <aside className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Doctor Card Preview
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#123B63] to-[#2563EB] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-900/10 shrink-0">
                {getInitials(watchedName)}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-foreground truncate leading-tight">
                  {watchedName.trim() || "Dr. Alexander Vance"}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-semibold rounded-lg">
                    {watchedSpec}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-details Box */}
            <div className="flex flex-col gap-2.5 p-4 bg-muted/40 rounded-xl border border-border/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Hospital
                </span>
                <span className="text-foreground font-semibold text-right truncate pl-2 max-w-[200px]">
                  {watchedHospital}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone
                </span>
                <span className="text-foreground font-mono text-right">
                  {watchedPhone}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </span>
                <span className="text-blue-600 truncate text-right pl-2 font-medium max-w-[200px]">
                  {watchedEmail}
                </span>
              </div>
            </div>

            {/* Verified Note Box */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-950 leading-relaxed">
                This record will be immediately added to the physician directory and available for patient assignments.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
