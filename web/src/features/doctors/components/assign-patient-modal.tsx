"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { patientService } from "@/features/patients/services/patient-service";
import { useAssignExistingPatientToDoctor } from "../hooks/use-doctors";
import type { Patient } from "@/features/patients/types";
import { cn } from "@/lib/utils";

interface AssignPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
}

export function AssignPatientModal({
  isOpen,
  onClose,
  doctorId,
  doctorName,
}: AssignPatientModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const assignMutation = useAssignExistingPatientToDoctor();

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Execute search when debounced search term updates
  useEffect(() => {
    if (!isOpen) return;

    if (!debouncedSearch) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    setErrorMessage(null);

    patientService
      .getPatients({
        search: debouncedSearch,
        limit: 8,
      })
      .then((res) => {
        if (isMounted) {
          setSearchResults(res.patients);
          setIsSearching(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setIsSearching(false);
          const errObj = err as { message?: string };
          setErrorMessage(errObj.message || "Failed to search patients.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, isOpen]);

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setDebouncedSearch("");
      setSearchResults([]);
      setSelectedPatient(null);
      setHasConfirmedTransfer(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine assignment state for the selected patient
  const isAlreadyAssignedToCurrent =
    selectedPatient?.assignedDoctorId === doctorId ||
    selectedPatient?.assignedDoctor?.id === doctorId ||
    selectedPatient?.assignedDoctor?._id === doctorId;

  const currentDoctorName =
    selectedPatient?.assignedDoctor?.name ||
    (selectedPatient?.assignedDoctorId ? "Another Physician" : null);

  const isAssignedToOtherDoctor =
    Boolean(selectedPatient?.assignedDoctorId || selectedPatient?.assignedDoctor) &&
    !isAlreadyAssignedToCurrent;

  const isUnassigned =
    !selectedPatient?.assignedDoctorId && !selectedPatient?.assignedDoctor;

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setHasConfirmedTransfer(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAssignSubmit = async () => {
    if (!selectedPatient) return;
    if (isAlreadyAssignedToCurrent) return;

    if (isAssignedToOtherDoctor && !hasConfirmedTransfer) {
      setErrorMessage("Please check the confirmation box to authorize reassignment.");
      return;
    }

    setErrorMessage(null);

    try {
      await assignMutation.mutateAsync({
        doctorId,
        patientId: selectedPatient.id,
      });

      setSuccessMessage(
        `Successfully assigned ${selectedPatient.name} to Dr. ${doctorName}.`
      );

      // Auto close after brief celebration
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const errObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        errObj.response?.data?.message ||
          errObj.message ||
          "Failed to assign patient to doctor."
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-muted/40 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-primary dark:bg-teal-950/60 ring-1 ring-primary/20">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Assign Existing Patient
              </h2>
              <p className="text-xs text-muted-foreground">
                Target: <span className="font-semibold text-foreground">Dr. {doctorName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Search Patient Record
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search patients by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs sm:text-sm bg-muted/30 focus-visible:bg-background rounded-xl"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Search through existing database records. No new patient will be created.
            </p>
          </div>

          {/* Search Results Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Matching Patients</span>
              {isSearching && (
                <span className="flex items-center gap-1 text-[11px] text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                </span>
              )}
            </div>

            {isSearching ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1.5 text-primary" />
                Searching patient records...
              </div>
            ) : debouncedSearch && searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                <User className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/40" />
                No patients found matching &ldquo;{debouncedSearch}&rdquo;.
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-card shadow-2xs">
                {searchResults.map((patient) => {
                  const isSelected = selectedPatient?.id === patient.id;
                  const isCurrent =
                    patient.assignedDoctorId === doctorId ||
                    patient.assignedDoctor?.id === doctorId ||
                    patient.assignedDoctor?._id === doctorId;
                  const docName = patient.assignedDoctor?.name;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className={cn(
                        "w-full text-left p-3 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-muted/40 cursor-pointer",
                        isSelected && "bg-teal-50/60 dark:bg-teal-950/40 border-l-2 border-primary"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-xs sm:text-sm truncate">
                          {patient.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                          <span>
                            Age {patient.age} · {patient.gender ? patient.gender.replace(/_/g, " ") : "—"}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground/60" />
                            {patient.phone || "No phone"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                          {patient.condition}
                        </span>

                        {isCurrent ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Already assigned here
                          </span>
                        ) : docName ? (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 truncate max-w-[130px]">
                            Dr. {docName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Type a patient name or phone number above to find matching records.
              </div>
            )}
          </div>

          {/* Selected Patient Preview & Confirmation Area */}
          {selectedPatient && (
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Selected Patient Preview
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    isAlreadyAssignedToCurrent
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : isAssignedToOtherDoctor
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                  )}
                >
                  {isAlreadyAssignedToCurrent
                    ? "Already Assigned to Dr. " + doctorName
                    : isAssignedToOtherDoctor
                    ? "Currently with Dr. " + currentDoctorName
                    : "Unassigned Patient"}
                </span>
              </div>

              {/* Patient Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground">Name:</span>
                  <p className="font-semibold text-foreground">{selectedPatient.name}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Contact:</span>
                  <p className="font-semibold text-foreground">
                    {selectedPatient.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Demographics:</span>
                  <p className="font-semibold text-foreground">
                    Age {selectedPatient.age} · {selectedPatient.gender}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Condition:</span>
                  <p className="font-semibold text-foreground">
                    {selectedPatient.condition}
                  </p>
                </div>
              </div>

              {/* Context Case Handling */}
              {isAlreadyAssignedToCurrent ? (
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>This patient is already on Dr. {doctorName}&apos;s caseload. No action needed.</span>
                </div>
              ) : isAssignedToOtherDoctor ? (
                <div className="space-y-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Reassignment Warning</p>
                      <p className="text-[11px] mt-0.5">
                        This patient is currently assigned to <strong className="underline">Dr. {currentDoctorName}</strong>.
                        Assigning them here will transfer the patient to <strong className="underline">Dr. {doctorName}</strong>.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800 cursor-pointer text-xs font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={hasConfirmedTransfer}
                      onChange={(e) => setHasConfirmedTransfer(e.target.checked)}
                      className="h-4 w-4 rounded border-amber-400 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>I confirm transferring this patient to Dr. {doctorName}</span>
                  </label>
                </div>
              ) : isUnassigned ? (
                <div className="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-200 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                  <span>This patient is currently unassigned. Click below to assign them to Dr. {doctorName}.</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-muted/40 border-t border-border flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={
              !selectedPatient ||
              isAlreadyAssignedToCurrent ||
              (isAssignedToOtherDoctor && !hasConfirmedTransfer) ||
              assignMutation.isPending
            }
            onClick={handleAssignSubmit}
            className="bg-primary hover:bg-teal-800 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : isAlreadyAssignedToCurrent ? (
              <span>Already Assigned</span>
            ) : isAssignedToOtherDoctor ? (
              <span>Confirm Transfer to Dr. {doctorName}</span>
            ) : (
              <span>Assign to Dr. {doctorName}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

