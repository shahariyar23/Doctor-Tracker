"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useDoctor,
  useDoctorPatients,
  useAddPatientToDoctor,
  useRemovePatientFromDoctor,
} from "../hooks/use-doctors";
import { cn } from "@/lib/utils";

interface DoctorDetailViewProps {
  doctorId: string;
}

const CONDITION_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200",
  Stable: "bg-teal-50 text-teal-700 border-teal-200",
  Recovering: "bg-blue-50 text-blue-700 border-blue-200",
};

export function DoctorDetailView({ doctorId }: DoctorDetailViewProps) {
  const { data: doctor, isLoading, isError, error, refetch } = useDoctor(doctorId);
  const { data: patients = [], isLoading: isLoadingPatients } =
    useDoctorPatients(doctorId);
  const addPatientMutation = useAddPatientToDoctor();
  const removePatientMutation = useRemovePatientFromDoctor();

  const [isAdding, setIsAdding] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientCondition, setPatientCondition] = useState("Stable");
  const [patientPhone, setPatientPhone] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-xs">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="font-semibold text-foreground">Doctor profile not found</p>
        <p className="text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "Unable to retrieve doctor details."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
          <Link
            href="/doctors"
            className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            Back to Roster
          </Link>
        </div>
      </div>
    );
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setAddError("Patient name is required");
      return;
    }

    setAddError(null);
    try {
      await addPatientMutation.mutateAsync({
        doctorId: doctor.id,
        patientData: {
          name: patientName.trim(),
          condition: patientCondition,
          phone: patientPhone.trim() || undefined,
        },
      });
      setPatientName("");
      setPatientPhone("");
      setIsAdding(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setAddError(e.response?.data?.message || "Failed to add patient");
    }
  };

  const handleRemovePatient = async (patientId: string, name: string) => {
    if (confirm(`Remove ${name} from ${doctor.name}'s caseload?`)) {
      try {
        await removePatientMutation.mutateAsync({
          doctorId: doctor.id,
          patientId,
        });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        alert(e.response?.data?.message || "Failed to remove patient");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Doctor Directory</span>
        </Link>
      </div>

      {/* Doctor Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl ring-2 ring-primary/20">
            {doctor.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {doctor.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {doctor.specialization}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {doctor.status || "Active"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {doctor.hospital}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {doctor.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {doctor.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Section */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Corresponding Patients ({patients.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Active patient caseload assigned to {doctor.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Patient to Doctor</span>
          </button>
        </div>

        {/* Add Patient inline form */}
        {isAdding && (
          <form
            onSubmit={handleAddPatient}
            className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Add New Patient Under {doctor.name}
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            {addError && (
              <p className="text-xs text-destructive">{addError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Patient Full Name *"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="h-8 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <select
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Stable">Stable</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovering">Recovering</option>
                <option value="Critical">Critical</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={addPatientMutation.isPending}
                  className="h-8 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {addPatientMutation.isPending ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Patients Table */}
        {isLoadingPatients ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : patients.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-medium">No patients currently assigned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Medical Condition</th>
                  <th className="py-2.5 px-3">Assigned Date</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          CONDITION_COLORS[p.condition] ||
                            "bg-slate-50 text-slate-700 border-slate-200"
                        )}
                      >
                        {p.condition}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {p.assignedDate}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {p.phone || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePatient(p.id, p.name)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete from doctor's list"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

