"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Phone,
  Activity,
  Stethoscope,
  UserPlus,
  ArrowLeft,
  Info,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { patientSchema, PatientFormData } from "../schemas/patient-schema";
import { useCreatePatient } from "../hooks/use-patients";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { Button } from "@/components/ui/button";
import patientConditionOptions from "@/data/options/patient-conditions.json";

const CONDITION_OPTIONS = patientConditionOptions as Array<
  "Critical" | "Under Treatment" | "Stable" | "Recovering"
>;

export function RegisterPatientView() {
  const router = useRouter();
  const createMutation = useCreatePatient();
  const [formError, setFormError] = useState<string | null>(null);

  // Load available doctors for selection
  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors({ limit: 100 });
  const doctors = doctorsData?.doctors || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "Amelia Chen",
      phone: "+1 (415) 890-2391",
      condition: "Under Treatment",
      status: "Active",
      assignedDoctorId: null,
    },
  });

  // Watch for sidebar summary sync
  const watchedName = watch("name") || "";
  const watchedPhone = watch("phone") || "";
  const watchedCondition = watch("condition") || "Under Treatment";
  const watchedDoctorId = watch("assignedDoctorId");

  const selectedDoctor = doctors.find((d) => d.id === watchedDoctorId);

  const onSubmit = async (data: PatientFormData) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        ...data,
        assignedDoctorId: data.assignedDoctorId || null,
      });
      router.push("/patients");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to register patient. Please review input fields and try again."
      );
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "Critical":
        return {
          badge: "bg-red-50 text-red-700 border-red-200/60",
          dot: "bg-red-500",
        };
      case "Under Treatment":
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200/60",
          dot: "bg-amber-500",
        };
      case "Stable":
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          dot: "bg-emerald-500",
        };
      case "Recovering":
        return {
          badge: "bg-blue-50 text-blue-700 border-blue-200/60",
          dot: "bg-blue-500",
        };
      default:
        return {
          badge: "bg-slate-50 text-slate-700 border-slate-200/60",
          dot: "bg-slate-500",
        };
    }
  };

  const condColor = getConditionColor(watchedCondition);

  return (
    <div className="relative w-full overflow-hidden space-y-6">
      {/* Ambient background glow accents */}
      <div className="absolute -top-32 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Meta & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Doctor Tracker
            </Link>
            <span>/</span>
            <Link href="/patients" className="hover:text-foreground transition-colors">
              Patients
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Create Patient</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-medium text-[11px] ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Proposed Form v1.0
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Create Patient
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Submit new patient details to initialize administrative tracking and assign a managing physician.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            <span>Back to Patients</span>
          </Link>
        </div>
      </div>

      {/* Proposed Patient Data Schema Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Info className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-xs font-bold text-blue-950">
            Proposed Patient Data Schema
          </span>
          <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
            Fields displayed below capture essential clinical triage and doctor assignment data according to the Doctor Tracker specification.
          </p>
        </div>
      </div>

      {/* Main Grid Workspace: Form 8-col / Summary 4-col */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6"
        >
          {/* Section 1: Patient Information */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-foreground pb-2 border-b border-border/60">
              Patient Information
            </h2>

            {/* Error Banner */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Name */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label
                  htmlFor="patientName"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Patient Name <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <input
                    id="patientName"
                    type="text"
                    {...register("name")}
                    placeholder="Enter patient's full name (e.g. Amelia Chen)"
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label
                  htmlFor="phoneNumber"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <input
                    id="phoneNumber"
                    type="tel"
                    {...register("phone")}
                    placeholder="+1 (415) 890-2391"
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Condition & Assignment */}
          <div className="flex flex-col gap-4 pt-2">
            <h2 className="text-base font-bold text-foreground pb-2 border-b border-border/60">
              Condition &amp; Assignment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Condition */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="patientCondition"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Patient Condition <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <Activity className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <select
                    id="patientCondition"
                    {...register("condition")}
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Select triage condition to enable filtering across rosters.
                </span>
              </div>

              {/* Assigned Doctor */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="assignedDoctor"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  Assigned Doctor
                </label>
                <div className="relative flex items-center">
                  <Stethoscope className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                  <select
                    id="assignedDoctor"
                    value={watchedDoctorId || ""}
                    onChange={(e) => {
                      setValue("assignedDoctorId", e.target.value || null);
                    }}
                    disabled={isLoadingDoctors}
                    className="w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    <option value="">-- Leave Unassigned --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Identifies the primary attending physician.
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Link
              href="/patients"
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
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Patient</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Right Column: Schema Specification & Live Summary */}
        <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Schema Specification
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[11px] font-semibold">
                Active
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This form captures essential administrative intake attributes without extraneous medical history or diagnostic coding requirements.
            </p>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/60 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-semibold text-foreground truncate max-w-[170px]">
                  {watchedName.trim() || "Amelia Chen"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Contact Phone</span>
                <span className="font-mono text-foreground">
                  {watchedPhone || "+1 (415) 890-2391"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Care Triage</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${condColor.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${condColor.dot}`} />
                  {watchedCondition}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Assigned Doctor</span>
                <span className="font-semibold text-foreground truncate max-w-[170px]">
                  {selectedDoctor ? selectedDoctor.name : "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-start gap-3 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Unrequested fields such as complex insurance identifiers, secondary emergency contacts, and prescription records are omitted in accordance with the Doctor Tracker specification.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
