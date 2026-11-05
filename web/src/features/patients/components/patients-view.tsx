"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UserPlus,
  Download,
  RefreshCw,
  AlertCircle,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Patient, PatientStats } from "../types";
import {
  usePatients,
  usePatientStats,
  useDeletePatient,
  useBulkDeletePatients,
  useBulkReassignPatients,
} from "../hooks/use-patients";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { PatientTable } from "./patient-table";
import { PatientFormModal } from "./patient-form-modal";
import { PatientDetailModal } from "./patient-detail-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PatientsView() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(initialAction === "register");
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

  // Doctors for bulk reassign
  const { data: doctorsData } = useDoctors({ limit: 100 });
  const doctors = doctorsData?.doctors || [];

  // Data Fetching
  const { data, isLoading, isError, error, refetch } = usePatients({
    search: searchQuery || undefined,
    condition: selectedCondition || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
  } = usePatientStats();

  const deleteMutation = useDeletePatient();
  const bulkDeleteMutation = useBulkDeletePatients();
  const bulkReassignMutation = useBulkReassignPatients();

  const handleToggleSelectPatient = (id: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    const pagePatients = data?.patients || [];
    const allIds = pagePatients.map((p) => p.id);
    const isAllSelected =
      allIds.length > 0 && allIds.every((id) => selectedPatientIds.includes(id));

    if (isAllSelected) {
      setSelectedPatientIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedPatientIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPatientIds.length === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedPatientIds.length} selected patient record(s)? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedPatientIds);
        setSelectedPatientIds([]);
      } catch {
        alert("Failed to delete selected patients.");
      }
    }
  };

  const handleBulkReassign = async (doctorId: string) => {
    if (selectedPatientIds.length === 0) return;
    try {
      await bulkReassignMutation.mutateAsync({
        patientIds: selectedPatientIds,
        doctorId,
      });
      setSelectedPatientIds([]);
      alert("Patients successfully reassigned.");
    } catch {
      alert("Failed to reassign selected patients.");
    }
  };

  const handleEdit = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (patient: Patient) => {
    if (confirm(`Are you sure you want to remove the medical record for ${patient.name}?`)) {
      try {
        await deleteMutation.mutateAsync(patient.id);
      } catch {
        alert("Failed to delete patient.");
      }
    }
  };

  // Derive Patient Directory Stats from global statistics
  const patientsList = data?.patients || [];
  const stats: PatientStats = {
    totalPatients: statsData?.totalPatients ?? (data?.total || 0),
    criticalPatients: statsData?.criticalPatients ?? statsData?.criticalCare ?? 0,
    criticalCare: statsData?.criticalPatients ?? statsData?.criticalCare ?? 0,
    underTreatmentPatients: statsData?.underTreatmentPatients ?? statsData?.underTreatment ?? 0,
    underTreatment: statsData?.underTreatmentPatients ?? statsData?.underTreatment ?? 0,
    unassignedPatients: statsData?.unassignedPatients ?? statsData?.unassigned ?? 0,
    unassigned: statsData?.unassignedPatients ?? statsData?.unassigned ?? 0,
    stable: statsData?.stable ?? 0,
    recovering: statsData?.recovering ?? 0,
  };

  const handleExportCsv = () => {
    if (!patientsList.length) return;
    const headers = [
      "Patient ID",
      "Name",
      "Age",
      "Gender",
      "Condition",
      "Phone",
      "Assigned Doctor",
      "Registered Date",
    ];

    const rows = patientsList.map((p) => [
      p.id,
      `"${p.name}"`,
      p.age ?? "—",
      p.gender || "—",
      p.condition,
      p.phone || "Not provided",
      `"${p.assignedDoctor?.name || (typeof p.assignedDoctorId === "object" && p.assignedDoctorId ? (p.assignedDoctorId as any).name : null) || "Unassigned"}"`,
      new Date(p.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `doctor_tracker_patients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">
              Patient Directory & Management
            </h1>
            <Badge
              variant="secondary"
              className="rounded-full border border-teal-200/60 bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              {stats.totalPatients} Registered Patients
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl text-xs sm:text-sm">
            Track patient medical records, monitor conditions, and manage attending physician
            assignments.
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="bg-card hover:bg-muted text-foreground border-border/80 h-8 flex-1 justify-center gap-1.5 px-3 text-xs font-semibold shadow-xs sm:h-9 sm:flex-initial"
          >
            <Download className="text-muted-foreground h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Link
            href="/patients/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-primary h-8 flex-1 justify-center gap-1.5 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-teal-800 sm:h-9 sm:flex-initial",
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register Patient</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Indicator Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Patients */}
        <Card className="border-border/80 border p-3.5 shadow-xs transition-shadow hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase sm:text-xs">
              Total Patients
            </span>
            <div className="text-primary flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 sm:h-8 sm:w-8 dark:bg-teal-950/40">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              {isStatsLoading ? (
                <Skeleton className="h-7 w-14 inline-block" />
              ) : (
                stats.totalPatients
              )}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px] sm:mt-1 sm:text-xs">
            Registered patient records
          </p>
        </Card>

        {/* Critical Condition */}
        <Card className="border-border/80 border p-3.5 shadow-xs transition-shadow hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase sm:text-xs">
              Critical Condition
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 sm:h-8 sm:w-8 dark:bg-red-950/40">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-red-600 sm:text-2xl">
              {isStatsLoading ? (
                <Skeleton className="h-7 w-14 inline-block" />
              ) : (
                stats.criticalCare
              )}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px] sm:mt-1 sm:text-xs">
            Critical condition patients
          </p>
        </Card>

        {/* Under Treatment */}
        <Card className="border-border/80 border p-3.5 shadow-xs transition-shadow hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase sm:text-xs">
              Under Treatment
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 sm:h-8 sm:w-8 dark:bg-amber-950/40">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              {isStatsLoading ? (
                <Skeleton className="h-7 w-14 inline-block" />
              ) : (
                stats.underTreatment
              )}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px] sm:mt-1 sm:text-xs">
            Active therapeutic care
          </p>
        </Card>

        {/* Unassigned Patients */}
        <Card className="border-border/80 border p-3.5 shadow-xs transition-shadow hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase sm:text-xs">
              Unassigned
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-8 sm:w-8 dark:bg-indigo-950/40">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              {isStatsLoading ? (
                <Skeleton className="h-7 w-14 inline-block" />
              ) : (
                stats.unassigned
              )}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px] sm:mt-1 sm:text-xs">
            No attending doctor assigned
          </p>
        </Card>
      </div>

      {/* Network Error Notification Banner */}
      {(isError || isStatsError) && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center justify-between rounded-xl border p-3 text-xs sm:p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {error instanceof Error
                ? error.message
                : statsError instanceof Error
                  ? statsError.message
                  : "Failed to connect to the patient management service."}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => refetch()}
            className="text-destructive hover:bg-destructive/10 flex shrink-0 items-center gap-1 font-semibold underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </div>
      )}

      {/* Patient Table Component with Full Filter & Search Controls */}
      <PatientTable
        patients={data?.patients || []}
        isLoading={isLoading}
        totalPatients={data?.total || 0}
        currentPage={currentPage}
        totalPages={data?.totalPages || 1}
        onPageChange={setCurrentPage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        selectedCondition={selectedCondition}
        onConditionChange={(c) => {
          setSelectedCondition(c);
          setCurrentPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(d) => {
          setStartDate(d);
          setCurrentPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(d) => {
          setEndDate(d);
          setCurrentPage(1);
        }}
        stats={stats}
        onViewPatient={(patient) => setSelectedPatientForDetail(patient)}
        onEditPatient={handleEdit}
        onDeletePatient={handleDelete}
        selectedPatientIds={selectedPatientIds}
        onToggleSelectPatient={handleToggleSelectPatient}
        onToggleSelectAll={handleToggleSelectAll}
        onBulkDelete={handleBulkDelete}
        onBulkReassign={handleBulkReassign}
        availableDoctors={doctors}
      />

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatientForDetail}
        isOpen={!!selectedPatientForDetail}
        onClose={() => setSelectedPatientForDetail(null)}
        onEditPatient={(patient) => {
          setSelectedPatientForDetail(null);
          handleEdit(patient);
        }}
      />

      {/* Register / Edit Patient Modal */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        patientToEdit={patientToEdit}
      />
    </div>
  );
}
