"use client";

import React, { useState } from "react";
import {
  User,
  Plus,
  Trash2,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Doctor } from "../types";
import {
  useDoctorPatients,
  useAddPatientToDoctor,
  useRemovePatientFromDoctor,
} from "../hooks/use-doctors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

const CONDITION_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Stable: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900",
  Recovering: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
};

export function DoctorDetailModal({
  doctor,
  isOpen,
  onClose,
}: DoctorDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientCondition, setPatientCondition] = useState("Stable");
  const [patientPhone, setPatientPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: patients = [], isLoading } = useDoctorPatients(
    doctor ? doctor.id : null
  );
  const addPatientMutation = useAddPatientToDoctor();
  const removePatientMutation = useRemovePatientFromDoctor();

  if (!doctor) return null;

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setFormError("Patient name is required");
      return;
    }

    setFormError(null);
    try {
      await addPatientMutation.mutateAsync({
        doctorId: doctor.id,
        patientData: {
          name: patientName.trim(),
          condition: patientCondition,
          phone: patientPhone.trim() || undefined,
        },
      });
      setPatientName("");
      setPatientPhone("");
      setIsAddingPatient(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(e.response?.data?.message || "Failed to add patient to doctor");
    }
  };

  const handleRemovePatient = async (patientId: string, name: string) => {
    if (confirm(`Remove ${name} from ${doctor.name}'s active patients?`)) {
      try {
        await removePatientMutation.mutateAsync({
          doctorId: doctor.id,
          patientId,
        });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        alert(e.response?.data?.message || "Failed to remove patient");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Doctor Header Banner */}
        <div className="bg-muted/40 p-6 border-b border-border/80">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg ring-2 ring-primary/20">
                {doctor.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                    {doctor.name}
                  </DialogTitle>
                  <Badge variant="secondary" className="font-semibold text-primary">
                    {doctor.specialization}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {doctor.status || "Active"}
                  </Badge>
                </div>
                <DialogDescription className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {doctor.hospital}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {doctor.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {doctor.phone}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Patients Section Header & Actions */}
        <div className="p-4 sm:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Corresponding Patients
              </h3>
              <Badge variant="secondary" className="font-semibold text-xs">
                {patients.length} assigned
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Patients currently under active care of this physician
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search assigned patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddingPatient(!isAddingPatient)}
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Patient</span>
            </Button>
          </div>
        </div>

        {/* Inline Add Patient Form (PDF §2.2 requirement) */}
        {isAddingPatient && (
          <form
            onSubmit={handleAddPatientSubmit}
            className="p-4 bg-muted/30 border-b border-border/80 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Add New Patient to {doctor.name}&apos;s List
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsAddingPatient(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                type="text"
                placeholder="Patient Full Name *"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="h-8 text-xs"
              />
              <select
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className="h-8 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Stable">Stable</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovering">Recovering</option>
                <option value="Critical">Critical</option>
              </select>
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addPatientMutation.isPending}
                >
                  {addPatientMutation.isPending ? "Adding..." : "Confirm"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Patients Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <User className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs font-medium">
                No patients assigned to this doctor yet.
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setIsAddingPatient(true)}
                className="mt-2 text-xs"
              >
                + Add the first patient
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground">
                    <TableHead className="py-2.5 px-3">Patient Name</TableHead>
                    <TableHead className="py-2.5 px-3">Condition Status</TableHead>
                    <TableHead className="py-2.5 px-3">Assigned Date</TableHead>
                    <TableHead className="py-2.5 px-3">Contact</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                        {patient.name}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            CONDITION_COLORS[patient.condition] ||
                              "bg-slate-50 text-slate-700 border-slate-200"
                          )}
                        >
                          {patient.condition}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-muted-foreground">
                        {patient.assignedDate}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-muted-foreground">
                        {patient.phone || "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            handleRemovePatient(patient.id, patient.name)
                          }
                          disabled={removePatientMutation.isPending}
                          className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Remove patient from doctor's list"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
