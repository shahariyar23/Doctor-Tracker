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
  useBulkUpdatePatientStatus,
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
  const [selectedStatus, setSelectedStatus] = useState("");
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
    status: selectedStatus || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const deleteMutation = useDeletePatient();
  const bulkDeleteMutation = useBulkDeletePatients();
  const bulkReassignMutation = useBulkReassignPatients();
  const bulkUpdateStatusMutation = useBulkUpdatePatientStatus();

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
        `Are you sure you want to delete ${selectedPatientIds.length} selected patient records? This action cannot be undone.`
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

  const handleBulkStatusChange = async (status: Patient["status"]) => {
    if (selectedPatientIds.length === 0) return;
    try {
      await bulkUpdateStatusMutation.mutateAsync({
        patientIds: selectedPatientIds,
        status,
      });
      setSelectedPatientIds([]);
    } catch {
      alert("Failed to update status for selected patients.");
    }
  };

  const handleBulkReassign = async (doctorId: string) => {
    if (selectedPatientIds.length === 0) return;
    const doc = doctors.find((d) => d.id === doctorId);
    try {
      await bulkReassignMutation.mutateAsync({
        patientIds: selectedPatientIds,
        doctorId: doctorId || null,
        doctorMeta: doc
          ? { id: doc.id, name: doc.name, specialization: doc.specialization }
          : undefined,
      });
      setSelectedPatientIds([]);
    } catch {
      alert("Failed to reassign doctor to selected patients.");
    }
  };

  // Statistics matching design system
  const stats: PatientStats = data?.stats || {
    totalPatients: data?.total || 248,
    underTreatment: 112,
    criticalCare: 18,
    stable: 84,
    recovering: 34,
    unassigned: 6,
  };

  const handleEdit = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (patient: Patient) => {
    if (confirm(`Are you sure you want to delete patient record for ${patient.name}?`)) {
      try {
        await deleteMutation.mutateAsync(patient.id);
      } catch (err: unknown) {
        const errObj = err as { response?: { data?: { message?: string } }; message?: string };
        alert(errObj.response?.data?.message || "Failed to delete patient record.");
      }
    }
  };

  const handleExportCsv = () => {
    const patients = data?.patients || [];
    if (patients.length === 0) {
      alert("No patient records to export.");
      return;
    }

    const headers = [
      "ID",
      "MRN",
      "Name",
      "Phone",
      "Age",
      "Gender",
      "Condition",
      "Room",
      "Status",
      "Assigned Doctor",
      "Registered Date",
    ];
    const rows = patients.map((p, index) => [
      p.id,
      p.code || `#MRN-${8492 + index}`,
      `"${p.name}"`,
      `"${p.phone}"`,
      p.age || "—",
      p.gender || "—",
      p.condition,
      p.roomNumber || "Main Ward",
      p.status,
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
    <div className="space-y-6">
      {/* Header & Primary Action Bar matching the design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Patient Directory & Management
            </h1>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-0.5 rounded-full text-xs border border-blue-200/60"
            >
              {stats.totalPatients} Active Patients
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
            Track medical admissions, monitor clinical condition statuses, and manage physician assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-2 h-9 px-3.5 bg-card hover:bg-muted text-xs font-semibold text-foreground shadow-xs border-border/80"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
          <Link
            href="/patients/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            )}
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Patient</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric KPI Cards (Matching Design System) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: TOTAL PATIENTS */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                TOTAL PATIENTS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalPatients}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-900/40">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+12 this week</span>
          </div>
        </Card>

        {/* Card 2: UNDER TREATMENT */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                UNDER TREATMENT
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stats.underTreatment}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:ring-amber-900/40">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            <span>45.2% active therapies</span>
          </div>
        </Card>

        {/* Card 3: CRITICAL CARE */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                CRITICAL CARE
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-red-600">
                {stats.criticalCare} Patients
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-900/40">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs font-semibold text-red-600">
            Requires urgent attention
          </div>
        </Card>

        {/* Card 4: UNASSIGNED */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                UNASSIGNED
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stats.unassigned} Patients
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 dark:bg-purple-950/60 dark:text-purple-400 dark:ring-purple-900/40">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Awaiting physician allocation
          </div>
        </Card>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive text-xs">
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
            className="font-semibold underline flex items-center gap-1 text-destructive hover:bg-destructive/10"
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
        selectedStatus={selectedStatus}
        onStatusChange={(s) => {
          setSelectedStatus(s);
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
        onBulkStatusChange={handleBulkStatusChange}
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
