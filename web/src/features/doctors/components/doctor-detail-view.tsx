"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  Phone,
  Clock,
  Search,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Settings2,
  ArrowRightLeft,
} from "lucide-react";
import {
  useDoctor,
  useDoctorPatients,
  useRemovePatientFromDoctor,
} from "../hooks/use-doctors";
import { AssignPatientModal } from "./assign-patient-modal";
import { Button } from "@/components/ui/button";
import {
  Skeleton,
  KpiCardSkeleton,
  TableRowSkeleton,
  MobileCardSkeleton,
} from "@/components/ui/skeleton";

interface DoctorDetailViewProps {
  doctorId: string;
}

export function DoctorDetailView({ doctorId }: DoctorDetailViewProps) {
  const { data: doctor, isLoading, isError, error } = useDoctor(doctorId);
  const { data: patients = [], isLoading: isLoadingPatients } =
    useDoctorPatients(doctorId);
  const removePatientMutation = useRemovePatientFromDoctor();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All Conditions");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 motion-reduce:animate-none">
        {/* Profile Card Skeleton */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>

        {/* Patients Table Container */}
        <div className="rounded-xl border border-border/80 bg-card shadow-xs p-6 space-y-4">
          <Skeleton className="h-5 w-44 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-destructive/20">
        <AlertCircle className="w-10 h-10 text-destructive mb-3" />
        <h3 className="text-base font-bold text-foreground">Doctor Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {error instanceof Error ? error.message : "The requested physician profile could not be retrieved."}
        </p>
        <Link
          href="/doctors"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
        >
          Return to Doctors
        </Link>
      </div>
    );
  }

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

  // Pagination (5 per page)
  const pageSize = 5;
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPatientsCount = doctor.patientCount ?? patients.length;

  const criticalCount = patients.filter((p) => p.condition === "Critical").length;
  const underTreatmentCount = patients.filter(
    (p) => p.condition === "Under Treatment"
  ).length;
  const stableRecoveringCount = patients.filter(
    (p) => p.condition === "Stable" || p.condition === "Recovering"
  ).length;

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
        `Reassign ${selectedPatientIds.length} selected patients to another available physician?`
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
        alert("Selected patients successfully unassigned for redistribution.");
      } catch {
        alert("Failed to unassign some patients.");
      }
    }
  };

  const handleExportCsv = () => {
    if (!patients.length) return;
    const headers = [
      "Patient ID",
      "Name",
      "Condition",
      "Phone",
      "Assigned Date",
    ];
    const rows = patients.map((p) => [
      p.id,
      `"${p.name}"`,
      p.condition,
      `"${p.phone || ''}"`,
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
    <div className="relative w-full max-w-6xl mx-auto bg-card rounded-2xl shadow-xl overflow-hidden border border-border my-2 sm:my-4 flex flex-col">
      {/* View Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-muted/40 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 text-teal-700 font-bold text-sm sm:text-base flex items-center justify-center shrink-0 ring-2 ring-primary/20 shadow-xs">
            {getInitials(doctor.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {doctor.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 text-xs font-semibold">
                {doctor.specialization}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-foreground text-xs font-semibold">
                {totalPatientsCount} Assigned {totalPatientsCount === 1 ? "Patient" : "Patients"}
              </span>
            </div>

            {/* Sub-meta details row */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                {doctor.email}
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">•</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
                {doctor.phone}
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">•</span>
              <span className="flex items-center gap-1">
                {doctor.hospital}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-center justify-between sm:justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            className="gap-1.5 h-8 bg-primary hover:bg-teal-800 text-white text-xs font-semibold shadow-xs flex-1 sm:flex-initial justify-center cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Assign Patient</span>
          </Button>

          <Link
            href="/doctors"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center"
            title="Back to Doctors"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 sm:gap-6 flex-1 bg-card">
        {/* Real Patient Count Summary Header */}
        <div className="bg-muted/30 rounded-2xl p-4 sm:p-5 border border-border flex flex-col gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Caseload Summary
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {totalPatientsCount} Assigned {totalPatientsCount === 1 ? "Patient" : "Patients"}
            </span>
            <span className="text-xs text-muted-foreground">
              Registered under Dr. {doctor.name}
            </span>
          </div>
        </div>

        {/* Section: Assigned Patients Table */}
        <div className="flex flex-col gap-3">
          {/* Table Control Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Assigned Patients
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 text-xs font-semibold">
                {totalPatientsCount} Total
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assigned patients..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-muted/40 focus:bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 bg-card text-foreground text-xs font-medium rounded-lg border border-input focus:outline-none cursor-pointer"
              >
                <option value="All Conditions">All Conditions</option>
                <option value="Critical">Critical ({criticalCount})</option>
                <option value="Under Treatment">Under Treatment ({underTreatmentCount})</option>
                <option value="Stable">Stable</option>
                <option value="Recovering">Recovering</option>
              </select>
            </div>
          </div>

          {/* Responsive Mobile Card List (< md) */}
          <div className="block md:hidden divide-y divide-border/60 border border-border rounded-xl p-3 bg-card">
            {isLoadingPatients ? (
              <div className="space-y-3 py-1">
                {[1, 2, 3].map((i) => (
                  <MobileCardSkeleton key={i} />
                ))}
              </div>
            ) : paginatedPatients.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No patients currently assigned to this doctor.
              </div>
            ) : (
              paginatedPatients.map((patient) => {
                const isSelected = selectedPatientIds.includes(patient.id);
                return (
                  <div key={patient.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectPatient(patient.id)}
                        className="rounded text-primary border-slate-300 focus:ring-0 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {patient.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {patient.condition} · {patient.phone || "Clinical Record"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeallocate(patient.id, patient.name)}
                      className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-primary font-semibold text-[11px] shrink-0 cursor-pointer transition-colors"
                    >
                      Reassign
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop / Tablet Table Container (md and above) */}
          <div className="hidden md:block border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider h-9 border-b border-border">
                  <tr>
                    <th className="px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded text-primary border-slate-300 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 font-semibold">Patient Name</th>
                    <th className="px-4 font-semibold">Demographics</th>
                    <th className="px-4 font-semibold">Medical Condition</th>
                    <th className="px-4 font-semibold">Contact</th>
                    <th className="px-4 font-semibold">Assigned Date</th>
                    <th className="px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {isLoadingPatients ? (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <TableRowSkeleton key={i} />
                      ))}
                    </>
                  ) : paginatedPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-muted-foreground">
                        No patients currently assigned to this doctor.
                      </td>
                    </tr>
                  ) : (
                    paginatedPatients.map((patient) => {
                      const isSelected = selectedPatientIds.includes(patient.id);
                      const demoStr = [
                        patient.age !== undefined ? `${patient.age} yrs` : null,
                        patient.gender ? patient.gender.replace("_", " ") : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—";

                      return (
                        <tr
                          key={patient.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isSelected ? "bg-teal-50/40 dark:bg-teal-950/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectPatient(patient.id)}
                              className="rounded text-primary border-slate-300 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground leading-tight">
                              {patient.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">
                            {demoStr}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60">
                              {patient.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {patient.phone ? patient.phone : "Not provided"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
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
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeallocate(patient.id, patient.name)
                              }
                              className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-primary font-semibold text-[11px] transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t border-border text-xs text-muted-foreground">
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
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Bottom Footer */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground text-center sm:text-left">
          <Info className="w-4 h-4 text-muted-foreground/70 shrink-0" />
          <span>Caseload allocations and transfers reflect live hospital census.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial justify-center gap-1.5 h-8 sm:h-9 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Patients</span>
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={selectedPatientIds.length === 0}
            onClick={handleBulkTransfer}
            className="flex-1 sm:flex-initial justify-center gap-1.5 h-8 sm:h-9 bg-primary hover:bg-teal-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer ({selectedPatientIds.length})</span>
          </Button>

          <Link
            href="/doctors"
            className="w-full sm:w-auto h-8 sm:h-9 px-4 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center transition-colors"
          >
            Back to Doctors
          </Link>
        </div>
      </div>

      {/* Assign Patient Search & Assignment Modal */}
      <AssignPatientModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        doctorId={doctor.id || doctor._id || doctorId}
        doctorName={doctor.name}
      />
    </div>
  );
}
