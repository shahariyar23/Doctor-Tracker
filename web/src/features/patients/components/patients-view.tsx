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
  const [selectedPatientForDetail, setSelectedPatientForDetail] =
    useState<Patient | null>(null);
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

  const deleteMutation = useDeletePatient();
  const bulkDeleteMutation = useBulkDeletePatients();
  const bulkReassignMutation = useBulkReassignPatients();

  const handleToggleSelectPatient = (id: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
        `Are you sure you want to delete ${selectedPatientIds.length} selected patient record(s)? This action cannot be undone.`
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
    if (
      confirm(
        `Are you sure you want to remove the medical record for ${patient.name}?`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(patient.id);
      } catch {
        alert("Failed to delete patient.");
      }
    }
  };

  // Derive Patient Directory Stats
  const patientsList = data?.patients || [];
  const stats: PatientStats = {
    totalPatients: data?.total || patientsList.length,
    criticalCare: patientsList.filter((p) => p.condition === "Critical").length,
    underTreatment: patientsList.filter(
      (p) => p.condition === "Under Treatment"
    ).length,
    stable: patientsList.filter((p) => p.condition === "Stable").length,
    recovering: patientsList.filter((p) => p.condition === "Recovering").length,
    unassigned: patientsList.filter((p) => !p.assignedDoctorId && !p.assignedDoctor).length,
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
      `"${p.assignedDoctor?.name || 'Unassigned'}"`,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Patient Directory & Management
            </h1>
            <Badge
              variant="secondary"
              className="bg-teal-100 text-teal-700 hover:bg-teal-100 font-semibold px-2.5 py-0.5 rounded-full text-xs border border-teal-200/60"
            >
              {stats.totalPatients} Registered Patients
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
            Track patient medical records, monitor conditions, and manage attending physician assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial justify-center gap-1.5 h-8 sm:h-9 px-3 bg-card hover:bg-muted text-xs font-semibold text-foreground shadow-xs border-border/80"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
          <Link
            href="/patients/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "flex-1 sm:flex-initial justify-center gap-1.5 h-8 sm:h-9 px-3.5 bg-primary hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all"
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
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Patients
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-50 text-primary dark:bg-teal-950/40">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.totalPatients}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Registered patient records
          </p>
        </Card>

        {/* Critical Condition */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Critical Condition
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-red-600">
              {stats.criticalCare}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Critical condition patients
          </p>
        </Card>

        {/* Under Treatment */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Under Treatment
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.underTreatment}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Active therapeutic care
          </p>
        </Card>

        {/* Unassigned Patients */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unassigned
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.unassigned}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            No attending doctor assigned
          </p>
        </Card>
      </div>

      {/* Network Error Notification Banner */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-3 sm:p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {error instanceof Error
                ? error.message
                : "Failed to connect to the patient management service."}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => refetch()}
            className="font-semibold underline flex items-center gap-1 text-destructive hover:bg-destructive/10 shrink-0"
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
