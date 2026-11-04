"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserPlus, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Doctor } from "../types";
import { useDoctors, useDeleteDoctor } from "../hooks/use-doctors";
import { DoctorTable } from "./doctor-table";
import { DoctorFormModal } from "./doctor-form-modal";
import { DoctorDetailModal } from "./doctor-detail-modal";

export function DoctorsView() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(initialAction === "add");
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [selectedDoctorForPatients, setSelectedDoctorForPatients] =
    useState<Doctor | null>(null);

  // Data Fetching
  const { data, isLoading, isError, error, refetch } = useDoctors({
    search: searchQuery || undefined,
    specialty: selectedSpecialty || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const deleteMutation = useDeleteDoctor();

  const handleOpenAdd = () => {
    setDoctorToEdit(null);
    setIsFormModalOpen(true);
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

    const headers = ["ID", "Name", "Specialization", "Hospital", "Phone", "Email", "Status", "Patients"];
    const rows = doctors.map((d) => [
      d.id,
      `"${d.name}"`,
      `"${d.specialization}"`,
      `"${d.hospital}"`,
      `"${d.phone}"`,
      `"${d.email}"`,
      d.status || "Active",
      d.patientCount || 0,
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
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Doctor Directory & Roster
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage physician credentials, assigned hospital facilities, and caseload limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-card text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Doctor</span>
          </button>
        </div>
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
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Doctor Table Component */}
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
        onViewPatients={setSelectedDoctorForPatients}
        onEditDoctor={handleEdit}
        onDeleteDoctor={handleDelete}
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

