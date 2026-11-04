"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  Phone,
  Clock,
  Edit,
  RefreshCw,
  Search,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  Settings2,
  CheckSquare,
  Square,
  ArrowRightLeft,
} from "lucide-react";
import { Doctor } from "../types";
import {
  useDoctorPatients,
  useAddPatientToDoctor,
  useRemovePatientFromDoctor,
} from "../hooks/use-doctors";
import { Button } from "@/components/ui/button";

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onEditDoctor?: (doctor: Doctor) => void;
}

export function DoctorDetailModal({
  doctor,
  isOpen,
  onClose,
  onEditDoctor,
}: DoctorDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All Conditions");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [maxLimit, setMaxLimit] = useState(35);
  const [isAdjustingLimit, setIsAdjustingLimit] = useState(false);

  // Quick Inline Add Patient state
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientCondition, setNewPatientCondition] = useState<
    "Critical" | "Under Treatment" | "Stable" | "Recovering"
  >("Stable");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const { data: patients = [], isLoading, refetch } = useDoctorPatients(
    doctor ? doctor.id : null
  );

  const addPatientMutation = useAddPatientToDoctor();
  const removePatientMutation = useRemovePatientFromDoctor();

  if (!isOpen || !doctor) return null;

  // Filter patients by search & condition
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCondition =
      selectedCondition === "All Conditions" || p.condition === selectedCondition;
    return matchesSearch && matchesCondition;
  });

  // Pagination (5 per page as shown in Stitch design)
  const pageSize = 5;
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculations for Caseload & Condition Breakdown
  const totalPatientsCount = patients.length;
  const capacityPercent = Math.min(
    100,
    Math.round((totalPatientsCount / maxLimit) * 100)
  );
  const isNearCapacity = capacityPercent >= 85;
  const slotsRemaining = Math.max(0, maxLimit - totalPatientsCount);

  const criticalCount = patients.filter((p) => p.condition === "Critical").length;
  const underTreatmentCount = patients.filter(
    (p) => p.condition === "Under Treatment"
  ).length;
  const stableRecoveringCount = patients.filter(
    (p) => p.condition === "Stable" || p.condition === "Recovering"
  ).length;

  // Checkbox select all / toggle
  const allPageIds = paginatedPatients.map((p) => p.id);
  const isAllSelected =
    allPageIds.length > 0 &&
    allPageIds.every((id) => selectedPatientIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPatientIds((prev) =>
        prev.filter((id) => !allPageIds.includes(id))
      );
    } else {
      setSelectedPatientIds((prev) =>
        Array.from(new Set([...prev, ...allPageIds]))
      );
    }
  };

  const toggleSelectPatient = (id: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeallocate = async (patientId: string, patientName: string) => {
    if (
      confirm(
        `Are you sure you want to reassign / unassign ${patientName} from Dr. ${doctor.name}?`
      )
    ) {
      try {
        await removePatientMutation.mutateAsync({
          doctorId: doctor.id,
          patientId,
        });
        setSelectedPatientIds((prev) => prev.filter((id) => id !== patientId));
      } catch {
        alert("Failed to remove patient from doctor caseload.");
      }
    }
  };

  const handleBulkTransfer = async () => {
    if (selectedPatientIds.length === 0) return;
    if (
      confirm(
        `Reassign ${selectedPatientIds.length} selected patients from Dr. ${doctor.name}?`
      )
    ) {
      try {
        for (const pid of selectedPatientIds) {
          await removePatientMutation.mutateAsync({
            doctorId: doctor.id,
            patientId: pid,
          });
        }
        setSelectedPatientIds([]);
        refetch();
      } catch {
        alert("Some transfers could not be completed.");
      }
    }
  };

  const handleExportCsv = () => {
    if (patients.length === 0) {
      alert("No patient records to export.");
      return;
    }
    const headers = ["ID", "Name", "Phone", "Condition", "AssignedDate"];
    const rows = patients.map((p) => [
      p.id,
      `"${p.name}"`,
      p.phone || "",
      p.condition,
      p.assignedDate || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `patients_dr_${doctor.name.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      setAddError("Patient name is required");
      return;
    }
    setAddError(null);
    try {
      await addPatientMutation.mutateAsync({
        doctorId: doctor.id,
        patientData: {
          name: newPatientName.trim(),
          phone: newPatientPhone.trim() || "+1 (555) 000-0000",
          condition: newPatientCondition,
        },
      });
      setNewPatientName("");
      setNewPatientPhone("");
      setIsAddingPatient(false);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setAddError(
        error.response?.data?.message ||
          error.message ||
          "Failed to assign patient to doctor."
      );
    }
  };

  // Get Initials for Avatar
  const getInitials = (nameStr: string) => {
    const clean = nameStr.replace(/^(dr\.|dr|doctor|md|prof\.)\s+/i, "").trim();
    if (!clean) return "DR";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 ring-2 ring-blue-500/20 shadow-xs">
              {getInitials(doctor.name)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {doctor.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-semibold">
                  {doctor.specialization}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    isNearCapacity
                      ? "bg-red-50 text-red-700 border border-red-200/60"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isNearCapacity ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                  {isNearCapacity
                    ? `Near Capacity (${capacityPercent}%)`
                    : `Active (${capacityPercent}%)`}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  #DOC-{doctor.id.slice(0, 4).toUpperCase()}
                </span>
              </div>

              {/* Sub-meta details row */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {doctor.email}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {doctor.phone}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Day Shift ({doctor.hospital})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onEditDoctor && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditDoctor(doctor)}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddingPatient(!isAddingPatient)}
              className="gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Assign Patient</span>
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
        <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1 bg-white">
          {/* Inline Add Patient Drawer / Form */}
          {isAddingPatient && (
            <form
              onSubmit={handleAddPatientSubmit}
              className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col gap-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" /> Assign New Patient to Dr. {doctor.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingPatient(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {addError && (
                <div className="text-xs text-red-600 font-medium">{addError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Patient Full Name *"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  required
                  className="h-9 px-3 bg-white text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="h-9 px-3 bg-white text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newPatientCondition}
                  onChange={(e) =>
                    setNewPatientCondition(
                      e.target.value as "Critical" | "Under Treatment" | "Stable" | "Recovering"
                    )
                  }
                  className="h-9 px-3 bg-white text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Stable">Stable</option>
                  <option value="Recovering">Recovering</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Confirm Assignment
                </Button>
              </div>
            </form>
          )}

          {/* Section: Caseload Saturation & Capacity Card */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Caseload Saturation &amp; Capacity
                </span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {totalPatientsCount} / {maxLimit} Patients
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isNearCapacity ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    ({capacityPercent}% Assigned)
                  </span>
                  <span className="text-xs text-slate-400">
                    Threshold: {maxLimit} max
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdjustingLimit ? (
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Max:</span>
                    <input
                      type="number"
                      value={maxLimit}
                      min={1}
                      max={100}
                      onChange={(e) =>
                        setMaxLimit(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-14 h-6 text-xs text-center border rounded font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setIsAdjustingLimit(false)}
                      className="text-xs text-blue-600 font-semibold"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdjustingLimit(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Adjust Max Limit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    capacityPercent >= 85
                      ? "bg-red-600"
                      : capacityPercent >= 60
                      ? "bg-blue-600"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>{slotsRemaining} slots remaining before strict overload lock</span>
                <span className={isNearCapacity ? "text-red-600 font-semibold" : ""}>
                  {isNearCapacity ? "Warning threshold reached (>85%)" : "Within normal capacity limit"}
                </span>
              </div>
            </div>

            {/* 4 Condition Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {/* Active Patients */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  Active Patients
                </span>
                <span className="text-xl font-bold text-slate-900 mt-1">
                  {totalPatientsCount}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  Active care
                </span>
              </div>

              {/* Critical Condition */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs">
                <span className="text-[11px] text-red-600 font-medium">
                  Critical Condition
                </span>
                <span className="text-xl font-bold text-red-600 mt-1">
                  {criticalCount}
                </span>
                <span className="text-[11px] text-red-600/80 font-medium mt-0.5">
                  Requires monitoring
                </span>
              </div>

              {/* Under Treatment */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  Under Treatment
                </span>
                <span className="text-xl font-bold text-blue-600 mt-1">
                  {underTreatmentCount}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Routine therapy
                </span>
              </div>

              {/* Stable / Recovering */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex flex-col shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  Stable / Recovering
                </span>
                <span className="text-xl font-bold text-emerald-700 mt-1">
                  {stableRecoveringCount}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Discharge ready
                </span>
              </div>
            </div>
          </div>

          {/* Section: Assigned Patients Table */}
          <div className="flex flex-col gap-3">
            {/* Table Control Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Assigned Patients
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-semibold">
                  {totalPatientsCount} Total
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search assigned patients..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCondition}
                  onChange={(e) => {
                    setSelectedCondition(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="All Conditions">All Conditions</option>
                  <option value="Critical">Critical ({criticalCount})</option>
                  <option value="Under Treatment">Under Treatment ({underTreatmentCount})</option>
                  <option value="Stable">Stable</option>
                  <option value="Recovering">Recovering</option>
                </select>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider h-9 border-b border-slate-200">
                    <tr>
                      <th className="px-4 w-10">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 font-semibold">Patient Name &amp; MRN</th>
                      <th className="px-4 font-semibold">Demographics</th>
                      <th className="px-4 font-semibold">Condition Status</th>
                      <th className="px-4 font-semibold">Assigned Date</th>
                      <th className="px-4 font-semibold">Clinical Note</th>
                      <th className="px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="h-32 text-center text-slate-400">
                          Loading assigned patient records...
                        </td>
                      </tr>
                    ) : paginatedPatients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-32 text-center text-slate-400">
                          No patients currently assigned to this doctor.
                        </td>
                      </tr>
                    ) : (
                      paginatedPatients.map((patient) => {
                        const isSelected = selectedPatientIds.includes(patient.id);
                        return (
                          <tr
                            key={patient.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectPatient(patient.id)}
                                className="rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 leading-tight">
                                  {patient.name}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  #PT-{patient.id.slice(0, 5).toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {patient.phone ? patient.phone : "Clinical Record"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  patient.condition === "Critical"
                                    ? "bg-red-50 text-red-700 border-red-200/60"
                                    : patient.condition === "Under Treatment"
                                    ? "bg-blue-50 text-blue-700 border-blue-200/60"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    patient.condition === "Critical"
                                      ? "bg-red-500"
                                      : patient.condition === "Under Treatment"
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                  }`}
                                />
                                {patient.condition}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {patient.assignedDate
                                ? new Date(patient.assignedDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )
                                : "Active"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-slate-600 truncate max-w-[180px] inline-block">
                                Routine clinical therapy
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeallocate(patient.id, patient.name)
                                }
                                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-blue-600 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Reassign
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  {filteredPatients.length > 0
                    ? `${(currentPage - 1) * pageSize + 1}-${Math.min(
                        currentPage * pageSize,
                        filteredPatients.length
                      )}`
                    : "0"}{" "}
                  of {filteredPatients.length} assigned patients
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === pg
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Bulk selection transfers available via checkbox selection.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 h-9 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Patient List</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedPatientIds.length === 0}
              onClick={handleBulkTransfer}
              className="gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Selected ({selectedPatientIds.length})</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs font-semibold hover:bg-slate-200"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
