"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useDoctor,
  useDoctorPatients,
  useAddPatientToDoctor,
  useRemovePatientFromDoctor,
} from "../hooks/use-doctors";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DoctorDetailViewProps {
  doctorId: string;
}

const CONDITION_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Stable: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900",
  Recovering: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
};

export function DoctorDetailView({ doctorId }: DoctorDetailViewProps) {
  const { data: doctor, isLoading, isError, error, refetch } = useDoctor(doctorId);
  const { data: patients = [], isLoading: isLoadingPatients } =
    useDoctorPatients(doctorId);
  const addPatientMutation = useAddPatientToDoctor();
  const removePatientMutation = useRemovePatientFromDoctor();

  const [isAdding, setIsAdding] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientCondition, setPatientCondition] = useState("Stable");
  const [patientPhone, setPatientPhone] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 text-center">
        <CardContent className="pt-6">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-foreground text-sm">Doctor profile not found</h3>
          <p className="text-muted-foreground text-xs mt-1">
            {error instanceof Error ? error.message : "Unable to retrieve doctor details."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </Button>
            <Link href="/doctors" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Back to Roster
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setAddError("Patient name is required");
      return;
    }

    setAddError(null);
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
      setIsAdding(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setAddError(e.response?.data?.message || "Failed to add patient");
    }
  };

  const handleRemovePatient = async (patientId: string, name: string) => {
    if (confirm(`Remove ${name} from ${doctor.name}'s caseload?`)) {
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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/doctors"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Doctor Directory</span>
        </Link>
      </div>

      {/* Doctor Overview Card */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl ring-2 ring-primary/20">
              {doctor.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {doctor.name}
                </h2>
                <Badge variant="secondary" className="font-semibold text-primary">
                  {doctor.specialization}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  {doctor.status || "Active"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Section Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Corresponding Patients ({patients.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Active patient caseload assigned to {doctor.name}
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Patient to Doctor</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Add Patient inline form */}
          {isAdding && (
            <form
              onSubmit={handleAddPatient}
              className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Add New Patient Under {doctor.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsAdding(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
              {addError && (
                <p className="text-xs text-destructive">{addError}</p>
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
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="Stable">Stable</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Recovering">Recovering</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="flex items-center gap-2">
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addPatientMutation.isPending}
                  >
                    {addPatientMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Patients Table */}
          {isLoadingPatients ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-medium">No patients currently assigned.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground">
                    <TableHead className="py-2.5 px-3">Patient Name</TableHead>
                    <TableHead className="py-2.5 px-3">Medical Condition</TableHead>
                    <TableHead className="py-2.5 px-3">Assigned Date</TableHead>
                    <TableHead className="py-2.5 px-3">Contact</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                        {p.name}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            CONDITION_COLORS[p.condition] ||
                              "bg-slate-50 text-slate-700 border-slate-200"
                          )}
                        >
                          {p.condition}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-muted-foreground">
                        {p.assignedDate}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-muted-foreground">
                        {p.phone || "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRemovePatient(p.id, p.name)}
                          className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete from doctor's list"
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
        </CardContent>
      </Card>
    </div>
  );
}
