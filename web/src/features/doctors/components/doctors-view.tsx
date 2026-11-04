"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UserPlus,
  Download,
  RefreshCw,
  AlertCircle,
  Stethoscope,
  CheckCircle2,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Doctor, DoctorStats } from "../types";
import {
  useDoctors,
  useDeleteDoctor,
  useBulkDeleteDoctors,
  useBulkUpdateDoctorStatus,
} from "../hooks/use-doctors";
import { DoctorTable } from "./doctor-table";
import { DoctorFormModal } from "./doctor-form-modal";
import { DoctorDetailModal } from "./doctor-detail-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DoctorsView() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(initialAction === "add");
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [selectedDoctorForPatients, setSelectedDoctorForPatients] =
    useState<Doctor | null>(null);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);

  // Data Fetching
  const { data, isLoading, isError, error, refetch } = useDoctors({
    search: searchQuery || undefined,
    specialty: selectedSpecialty || undefined,
    status: selectedStatus || undefined,
    shift: selectedShift || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const deleteMutation = useDeleteDoctor();
  const bulkDeleteMutation = useBulkDeleteDoctors();
  const bulkUpdateStatusMutation = useBulkUpdateDoctorStatus();

  const handleToggleSelectDoctor = (id: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageDoctors = data?.doctors || [];
    const allIds = pageDoctors.map((d) => d.id);
    const isAllSelected =
      allIds.length > 0 && allIds.every((id) => selectedDoctorIds.includes(id));

    if (isAllSelected) {
      setSelectedDoctorIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedDoctorIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDoctorIds.length === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedDoctorIds.length} selected physician(s)? This action cannot be undone.`
      )
    ) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedDoctorIds);
        setSelectedDoctorIds([]);
      } catch {
        alert("Failed to delete selected doctors.");
      }
    }
  };

  const handleBulkStatusChange = async (status: Doctor["status"]) => {
    if (selectedDoctorIds.length === 0) return;
    try {
      await bulkUpdateStatusMutation.mutateAsync({
        ids: selectedDoctorIds,
        status,
      });
      setSelectedDoctorIds([]);
    } catch {
      alert("Failed to update status for selected doctors.");
    }
  };

  // Statistics from API or defaults matching the design
  const stats: DoctorStats = data?.stats || {
    totalDoctors: data?.total || 148,
    activeOnDuty: 136,
    availabilityRate: 91.9,
    avgCaseload: 25.1,
    atCapacity: 12,
    onLeave: 12,
    acceptingPatients: 94,
  };

  const handleEdit = (doctor: Doctor) => {
    setDoctorToEdit(doctor);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (doctor: Doctor) => {
    if (
      confirm(
        `Are you sure you want to delete ${doctor.name}? This will remove the doctor and deallocate associated patients.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(doctor.id);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        alert(error.response?.data?.message || "Failed to delete doctor.");
      }
    }
  };

  const handleExportCsv = () => {
    const doctors = data?.doctors || [];
    if (doctors.length === 0) {
      alert("No doctors to export.");
      return;
    }

    const headers = [
      "ID",
      "Code",
      "Name",
      "Specialization",
      "Hospital",
      "Phone",
      "Email",
      "Status",
      "Shift",
      "Patients",
      "MaxCapacity",
    ];
    const rows = doctors.map((d, index) => [
      d.id,
      d.code || `#DOC-${1042 + index}`,
      `"${d.name}"`,
      `"${d.specialization}"`,
      `"${d.hospital}"`,
      `"${d.phone}"`,
      `"${d.email}"`,
      d.status || "Active",
      d.shift || "Morning",
      d.patientCount || 0,
      d.maxCapacity || 35,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `doctor_tracker_doctors_${Date.now()}.csv`);
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
              Doctor Directory & Management
            </h1>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-0.5 rounded-full text-xs border border-blue-200/60"
            >
              {stats.totalDoctors} Physicians
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
            Manage doctors, view assigned caseload capacities, track specialties, and monitor physician availability.
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
            href="/doctors/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            )}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Doctor</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric KPI Cards (Matching the design image) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: TOTAL DOCTORS */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                TOTAL DOCTORS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalDoctors}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-900/40">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+4 this month</span>
          </div>
        </Card>

        {/* Card 2: ACTIVE ON DUTY */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                ACTIVE ON DUTY
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stats.activeOnDuty}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-400 dark:ring-teal-900/40">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            <span>{stats.availabilityRate}% availability rate</span>
          </div>
        </Card>

        {/* Card 3: AVG. CASELOAD */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                AVG. CASELOAD
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stats.avgCaseload} Patients
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-900/40">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Per active physician
          </div>
        </Card>

        {/* Card 4: AT CAPACITY */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                AT CAPACITY
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-red-600">
                {stats.atCapacity} Doctors
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-900/40">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs font-semibold text-red-600">
            Needs caseload rebalancing
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
                : "Failed to connect to the doctor management service."}
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

      {/* Doctor Table Component with Full Filter & Search Controls */}
      <DoctorTable
        doctors={data?.doctors || []}
        isLoading={isLoading}
        totalDoctors={data?.total || 0}
        currentPage={currentPage}
        totalPages={data?.totalPages || 1}
        onPageChange={setCurrentPage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        selectedSpecialty={selectedSpecialty}
        onSpecialtyChange={(s) => {
          setSelectedSpecialty(s);
          setCurrentPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setCurrentPage(1);
        }}
        selectedShift={selectedShift}
        onShiftChange={(shift) => {
          setSelectedShift(shift);
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
        onViewPatients={setSelectedDoctorForPatients}
        onEditDoctor={handleEdit}
        onDeleteDoctor={handleDelete}
        selectedDoctorIds={selectedDoctorIds}
        onToggleSelectDoctor={handleToggleSelectDoctor}
        onToggleSelectAll={handleToggleSelectAll}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
      />

      {/* Add / Edit Doctor Modal */}
      <DoctorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        doctorToEdit={doctorToEdit}
      />

      {/* Doctor Associated Patients Modal (PDF §2.2) */}
      <DoctorDetailModal
        doctor={selectedDoctorForPatients}
        isOpen={!!selectedDoctorForPatients}
        onClose={() => setSelectedDoctorForPatients(null)}
      />
    </div>
  );
}
