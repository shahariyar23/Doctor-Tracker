"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Plus,
  Trash2,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Doctor } from "../types";
import {
  useDoctorPatients,
  useAddPatientToDoctor,
  useRemovePatientFromDoctor,
} from "../hooks/use-doctors";
import { cn } from "@/lib/utils";

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

const CONDITION_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200",
  Stable: "bg-teal-50 text-teal-700 border-teal-200",
  Recovering: "bg-blue-50 text-blue-700 border-blue-200",
};

export function DoctorDetailModal({
  doctor,
  isOpen,
  onClose,
}: DoctorDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientCondition, setPatientCondition] = useState("Stable");
  const [patientPhone, setPatientPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: patients = [], isLoading } = useDoctorPatients(
    doctor ? doctor.id : null
  );
  const addPatientMutation = useAddPatientToDoctor();
  const removePatientMutation = useRemovePatientFromDoctor();

  if (!isOpen || !doctor) return null;

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setFormError("Patient name is required");
      return;
    }

    setFormError(null);
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
      setIsAddingPatient(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(error.response?.data?.message || error.message || "Failed to add patient");
    }
  };

  const handleRemovePatient = async (patientId: string, patientNameStr: string) => {
    if (
      confirm(
        `Are you sure you want to remove ${patientNameStr} from ${doctor.name}'s caseload?`
      )
    ) {
      try {
        await removePatientMutation.mutateAsync({
          doctorId: doctor.id,
          patientId,
        });
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        alert(error.response?.data?.message || "Failed to remove patient from list");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Doctor Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border bg-muted/40 p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg ring-2 ring-primary/20">
              {doctor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {doctor.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {doctor.specialization}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                  {doctor.status || "Active"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
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

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors self-start sm:self-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Patients Section Header & Actions */}
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Corresponding Patients
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {patients.length} assigned
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Patients currently under active care of this physician
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search assigned patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPatient(!isAddingPatient)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Inline Add Patient Form (PDF §2.2 requirement) */}
        {isAddingPatient && (
          <form
            onSubmit={handleAddPatientSubmit}
            className="p-4 bg-muted/40 border-b border-border/80 flex flex-col gap-3 animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Add New Patient to {doctor.name}&apos;s List
              </span>
              <button
                type="button"
                onClick={() => setIsAddingPatient(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Patient Full Name *"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="h-8 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <select
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className="h-8 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Stable">Stable</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovering">Recovering</option>
                <option value="Critical">Critical</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="h-8 flex-1 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={addPatientMutation.isPending}
                  className="h-8 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {addPatientMutation.isPending ? "Adding..." : "Confirm"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Patients Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <User className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs font-medium">
                No patients assigned to this doctor yet.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingPatient(true)}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                + Add the first patient
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Condition Status</th>
                    <th className="py-2.5 px-3">Assigned Date</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {patient.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            CONDITION_COLORS[patient.condition] ||
                              "bg-slate-50 text-slate-700 border-slate-200"
                          )}
                        >
                          {patient.condition}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {patient.assignedDate}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {patient.phone || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemovePatient(patient.id, patient.name)
                          }
                          disabled={removePatientMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove patient from doctor's list"
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
    </div>
  );
}
