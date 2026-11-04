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

  const handleEdit = (doctor: Doctor) => {
    setDoctorToEdit(doctor);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (doctor: Doctor) => {
    if (
      confirm(
        `Are you sure you want to remove Dr. ${doctor.name}? This will affect their caseload.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(doctor.id);
      } catch {
        alert("Failed to delete doctor.");
      }
    }
  };

  // Derive Doctor Directory Stats
  const doctorsList = data?.doctors || [];
  const activeCount = doctorsList.filter((d) => d.status === "Active" || !d.status).length;
  const atCapCount = doctorsList.filter((d) => {
    const current = d.patientCount || 0;
    const max = d.maxCapacity || 35;
    return (current / max) >= 0.9;
  }).length;
  const totalPatientsServed = doctorsList.reduce((acc, d) => acc + (d.patientCount || 0), 0);

  const stats: DoctorStats = {
    totalDoctors: data?.total || doctorsList.length,
    activeOnDuty: activeCount,
    availabilityRate: doctorsList.length > 0 ? Math.round((activeCount / doctorsList.length) * 100) : 0,
    avgCaseload: doctorsList.length > 0 ? Math.round(totalPatientsServed / doctorsList.length) : 0,
    atCapacity: atCapCount,
    onLeave: doctorsList.filter((d) => d.status === "On Leave").length,
    acceptingPatients: doctorsList.filter((d) => d.status === "Available").length,
  };

  const handleExportCsv = () => {
    if (!doctorsList.length) return;
    const headers = [
      "Doctor ID",
      "Name",
      "Specialty",
      "Hospital",
      "Phone",
      "Email",
      "Status",
      "Shift",
      "Patient Count",
      "Max Capacity",
    ];

    const rows = doctorsList.map((d, index) => [
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
    <div className="space-y-5 sm:space-y-6">
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Doctor Directory & Management
            </h1>
            <Badge
              variant="secondary"
              className="bg-teal-100 text-teal-700 hover:bg-teal-100 font-semibold px-2.5 py-0.5 rounded-full text-xs border border-teal-200/60"
            >
              {stats.totalDoctors} Physicians
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
            Manage doctors, view assigned caseload capacities, track specialties, and monitor physician availability.
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
            href="/doctors/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "flex-1 sm:flex-initial justify-center gap-1.5 h-8 sm:h-9 px-3.5 bg-primary hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all"
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add New Doctor</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Indicator Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Doctors */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Doctors
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-50 text-primary dark:bg-teal-950/40">
              <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.totalDoctors}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> Active
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Registered medical staff
          </p>
        </Card>

        {/* Active on Shift */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              On Duty
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.activeOnDuty}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              ({stats.totalDoctors > 0 ? Math.round((stats.activeOnDuty / stats.totalDoctors) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Available for consults
          </p>
        </Card>

        {/* Patients Under Care */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Caseload
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.avgCaseload}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              pts/doc
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Active patient caseloads
          </p>
        </Card>

        {/* At Capacity Physicians */}
        <Card className="p-3.5 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-1 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Near Capacity
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.atCapacity}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-amber-600">
              &gt;90% load
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Physicians requiring relief
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
                : "Failed to connect to the physician database."}
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
