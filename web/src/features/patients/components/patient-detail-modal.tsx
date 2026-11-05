"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Phone,
  Edit,
  Stethoscope,
  Shield,
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";
import { Patient } from "../types";
import { useUpdatePatient } from "../hooks/use-patients";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { Button } from "@/components/ui/button";

interface PatientDetailModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onEditPatient?: (patient: Patient) => void;
}

export function PatientDetailModal({
  patient,
  isOpen,
  onClose,
  onEditPatient,
}: PatientDetailModalProps) {
  const updatePatientMutation = useUpdatePatient();
  const { data: doctorsData } = useDoctors({ limit: 100 });
  const doctors = doctorsData?.doctors || [];

  const rawDocId =
    patient?.assignedDoctorId && typeof patient.assignedDoctorId === "object"
      ? (patient.assignedDoctorId as any).id || (patient.assignedDoctorId as any)._id || ""
      : (patient?.assignedDoctorId as string) || "";

  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(rawDocId);
  const [reassignSuccess, setReassignSuccess] = useState(false);

  React.useEffect(() => {
    setSelectedDoctorId(rawDocId);
  }, [rawDocId, isOpen]);

  if (!isOpen || !patient) return null;

  const assignedDoc =
    patient.assignedDoctor ||
    (typeof patient.assignedDoctorId === "object" && patient.assignedDoctorId !== null
      ? (patient.assignedDoctorId as any)
      : null);

  const getInitials = (nameStr: string) => {
    const clean = nameStr.trim();
    if (!clean) return "PT";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
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

  const condColor = getConditionColor(patient.condition);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePatientMutation.mutateAsync({
        id: patient.id,
        data: {
          name: patient.name,
          phone: patient.phone,
          condition: patient.condition,
          age: patient.age,
          gender: patient.gender,
          assignedDoctorId: selectedDoctorId || null,
        },
      });
      setReassignSuccess(true);
      setTimeout(() => {
        setIsReassigning(false);
        setReassignSuccess(false);
      }, 1200);
    } catch {
      alert("Failed to reassign doctor.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 ring-2 ring-blue-500/20 shadow-xs">
              {getInitials(patient.name)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {patient.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${condColor.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${condColor.dot}`} />
                  {patient.condition}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Age {patient.age} · {patient.gender ? patient.gender.replace(/_/g, " ") : "—"}
                </span>
              </div>

              {/* Sub-meta details row */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone || "Not provided"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Registered:{" "}
                  {patient.createdAt
                    ? new Date(patient.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Active Record"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onEditPatient && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditPatient(patient)}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => setIsReassigning(!isReassigning)}
              className="gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Reassign Doctor</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto overflow-x-hidden flex flex-col gap-6 flex-1 bg-white">
          {/* Inline Reassign Doctor Drawer */}
          {isReassigning && (
            <form
              onSubmit={handleReassignSubmit}
              className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col gap-3 animate-in fade-in duration-150 w-full min-w-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" /> Reassign Attending Physician
                </span>
                <button
                  type="button"
                  onClick={() => setIsReassigning(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>

              {reassignSuccess && (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Successfully reassigned doctor!
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full min-w-0">
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full min-w-0 flex-1 h-9 px-3 bg-white text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium truncate"
                >
                  <option value="">-- No Doctor Assigned (Unassign) --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization} ({doc.hospital})
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  size="sm"
                  disabled={updatePatientMutation.isPending}
                  className="shrink-0 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 whitespace-nowrap"
                >
                  {updatePatientMutation.isPending ? "Saving..." : "Save Assignment"}
                </Button>
              </div>
            </form>
          )}

          {/* Section: Clinical Overview & Assignment Card */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Clinical Overview &amp; Attending Care
              </span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                Active Tracking
              </span>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Triage Status */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs min-w-0">
                <span className="text-[11px] text-slate-500 font-medium">Medical Condition</span>
                <span
                  className={`text-base font-bold mt-1 inline-flex items-center gap-1 ${
                    patient.condition === "Critical"
                      ? "text-red-600"
                      : patient.condition === "Under Treatment"
                      ? "text-amber-600"
                      : "text-emerald-700"
                  }`}
                >
                  {patient.condition}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Clinical Condition</span>
              </div>

              {/* Demographics */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs min-w-0">
                <span className="text-[11px] text-slate-500 font-medium">Demographics</span>
                <span className="text-base font-bold text-slate-900 mt-1 truncate">
                  Age {patient.age} · {patient.gender ? patient.gender.replace(/_/g, " ") : "—"}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Verified Profile</span>
              </div>

              {/* Attending Physician */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs min-w-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  Attending Physician
                </span>
                <div className="flex items-center gap-2 mt-1 min-w-0">
                  <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {assignedDoc?.name || "Unassigned"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {assignedDoc?.specialization || "No doctor assigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Patient Demographics & Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Contact & Registration Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
                Contact &amp; Registration
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact Telephone</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {patient.phone || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registration Date</span>
                  <span className="text-slate-700">
                    {patient.createdAt
                      ? new Date(patient.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Recently Registered"}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Clinical Facility & Caregiver */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
                Attending Doctor
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Doctor Name</span>
                  <span className="font-semibold text-blue-600 truncate max-w-[180px]">
                    {assignedDoc ? (
                      <Link
                        href={`/doctors`}
                        className="hover:underline"
                      >
                        {assignedDoc.name}
                      </Link>
                    ) : (
                      "Unassigned"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Specialization</span>
                  <span className="font-semibold text-slate-900">
                    {assignedDoc?.specialization || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 text-center sm:text-left">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Encrypted clinical chart compliant with Doctor Tracker specification.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReassigning(!isReassigning)}
              className="flex-1 sm:flex-initial justify-center gap-1.5 h-9 text-xs font-semibold"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Reassign Doctor</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-initial justify-center h-9 text-xs font-semibold hover:bg-slate-200"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

