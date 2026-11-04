"use client";

import React, { useState } from "react";
import { X, RefreshCw, Check, ArrowRightLeft, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Doctor } from "@/features/doctors/types";
import { Patient } from "@/features/patients/types";
import { useBulkReassignPatients, useReassignPatient } from "@/features/patients/hooks/use-patients";

interface MobileQuickReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoctorName?: string;
  doctors: Doctor[];
  patients?: Patient[];
}

export function MobileQuickReassignModal({
  isOpen,
  onClose,
  initialDoctorName,
  doctors,
  patients = [],
}: MobileQuickReassignModalProps) {
  const [selectedSourceDoctorId, setSelectedSourceDoctorId] = useState<string>("");
  const [selectedTargetDoctorId, setSelectedTargetDoctorId] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [reason, setReason] = useState<"Capacity relief" | "Specialty match">("Capacity relief");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const reassignMutation = useReassignPatient();

  // Find or match initial doctor
  React.useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      if (initialDoctorName && doctors.length > 0) {
        const matched = doctors.find((d) =>
          d.name.toLowerCase().includes(initialDoctorName.toLowerCase())
        );
        if (matched) {
          setSelectedSourceDoctorId(matched.id);
        } else {
          setSelectedSourceDoctorId(doctors[0]?.id || "");
        }
      } else if (doctors.length > 0 && !selectedSourceDoctorId) {
        setSelectedSourceDoctorId(doctors[0]?.id || "");
      }

      // Pick default target doctor different from source
      if (doctors.length > 1) {
        const target = doctors.find((d) => d.id !== selectedSourceDoctorId);
        if (target) setSelectedTargetDoctorId(target.id);
      }
    }
  }, [isOpen, initialDoctorName, doctors]);

  // Available patients for this source doctor
  const sourcePatients = patients.filter(
    (p) => p.assignedDoctorId === selectedSourceDoctorId || p.assignedDoctor?.id === selectedSourceDoctorId
  );

  React.useEffect(() => {
    if (sourcePatients.length > 0) {
      setSelectedPatientId(sourcePatients[0].id);
    } else {
      setSelectedPatientId("");
    }
  }, [selectedSourceDoctorId, sourcePatients.length]);

  if (!isOpen) return null;

  const sourceDoc = doctors.find((d) => d.id === selectedSourceDoctorId);
  const targetDoc = doctors.find((d) => d.id === selectedTargetDoctorId);

  const handleExecute = async () => {
    if (!selectedTargetDoctorId) {
      setStatusMessage({ type: "error", text: "Please select a target doctor with open capacity." });
      return;
    }

    try {
      if (selectedPatientId) {
        await reassignMutation.mutateAsync({
          patientId: selectedPatientId,
          doctorId: selectedTargetDoctorId,
        });
      }
      setStatusMessage({
        type: "success",
        text: `Transferred successfully under ${reason}!`,
      });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 900);
    } catch {
      setStatusMessage({
        type: "error",
        text: "Load transfer failed. Please try again.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs p-0 sm:items-center sm:justify-center sm:p-4"
    >
      <div
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-border/80 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200"
      >
        {/* Drag handle pill */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Immediate Rebalance
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Select high load patient & distribute to available physician
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Source Doctor */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Source Doctor (Saturated)
          </label>
          <select
            value={selectedSourceDoctorId}
            onChange={(e) => setSelectedSourceDoctorId(e.target.value)}
            className="w-full text-xs font-medium bg-muted/60 border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — {doc.specialization} ({doc.patientCount || 0}/35)
              </option>
            ))}
          </select>
          {sourceDoc && (
            <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
              <span>{sourceDoc.specialization} • {sourceDoc.hospital}</span>
              <span className="font-semibold text-red-600">
                {sourceDoc.patientCount || 34} / 35 slots
              </span>
            </div>
          )}
        </div>

        {/* Patient Selection (if available) */}
        {sourcePatients.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Patient to Reassign
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full text-xs font-medium bg-muted/60 border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sourcePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.condition})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Target Doctor */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Target Doctor (Capacity Available)
          </label>
          <select
            value={selectedTargetDoctorId}
            onChange={(e) => setSelectedTargetDoctorId(e.target.value)}
            className="w-full text-xs font-medium bg-muted/60 border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Choose available physician --</option>
            {doctors
              .filter((d) => d.id !== selectedSourceDoctorId)
              .map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} — {doc.specialization} ({(35 - (doc.patientCount || 14))} slots free)
                </option>
              ))}
          </select>
          {targetDoc && (
            <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
              <span>{targetDoc.specialization} • {targetDoc.hospital}</span>
              <span className="font-semibold text-emerald-600">
                {Math.max(0, 35 - (targetDoc.patientCount || 14))} open slots
              </span>
            </div>
          )}
        </div>

        {/* Reassignment Reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Reassignment Reason
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setReason("Capacity relief")}
              className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                reason === "Capacity relief"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Capacity relief
            </button>
            <button
              type="button"
              onClick={() => setReason("Specialty match")}
              className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                reason === "Specialty match"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Specialty match
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="button"
            className="w-full gap-2 py-2.5 font-semibold text-xs rounded-xl shadow-md"
            disabled={reassignMutation.isPending || !selectedTargetDoctorId}
            onClick={handleExecute}
          >
            {reassignMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="h-4 w-4" />
            )}
            <span>
              {reassignMutation.isPending ? "Executing Transfer..." : "Execute Load Transfer"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
