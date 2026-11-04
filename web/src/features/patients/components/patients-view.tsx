"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserPlus, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Patient } from "../types";
import { usePatients, useDeletePatient } from "../hooks/use-patients";
import { PatientTable } from "./patient-table";
import { PatientFormModal } from "./patient-form-modal";
import { PatientDetailModal } from "./patient-detail-modal";
import { Button } from "@/components/ui/button";

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

  const handleOpenAdd = () => {
    setPatientToEdit(null);
    setIsFormModalOpen(true);
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
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        alert(error.response?.data?.message || "Failed to delete patient record.");
      }
    }
  };

  const handleExportCsv = () => {
    const patients = data?.patients || [];
    if (patients.length === 0) {
      alert("No patient records to export.");
      return;
    }

    const headers = ["ID", "Name", "Phone", "Condition", "Status", "Assigned Doctor", "Registered Date"];
    const rows = patients.map((p) => [
      p.id,
      `"${p.name}"`,
      `"${p.phone}"`,
      p.condition,
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
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Patient Directory & Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Search, filter, track clinical conditions, and administer doctor assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Patient</span>
          </Link>
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

      {/* Patient Table Component */}
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
        onViewPatient={(patient) => setSelectedPatientForDetail(patient)}
        onEditPatient={handleEdit}
        onDeletePatient={handleDelete}
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
