"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  User,
  Stethoscope,
  Calendar,
  LayoutList,
  LayoutGrid,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Bed,
  CheckSquare,
} from "lucide-react";
import { Patient, PatientStats } from "../types";
import { Doctor } from "@/features/doctors/types";
import patientConditionOptions from "@/data/options/patient-conditions.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  totalPatients: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  selectedCondition: string;
  onConditionChange: (condition: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  stats?: PatientStats;
  onViewPatient?: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
  selectedPatientIds?: string[];
  onToggleSelectPatient?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onBulkDelete?: () => void;
  onBulkReassign?: (doctorId: string) => void;
  availableDoctors?: Doctor[];
}

const CONDITION_OPTIONS = ["All Conditions", ...patientConditionOptions];

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

export function PatientTable({
  patients,
  isLoading,
  totalPatients,
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  selectedCondition,
  onConditionChange,
  selectedStatus = "",
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  selectedPatientIds = [],
  onToggleSelectPatient,
  onToggleSelectAll,
  onBulkDelete,
  onBulkReassign,
  availableDoctors = [],
}: PatientTableProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reassignDoctorId, setReassignDoctorId] = useState("");

  const isAllSelected =
    patients.length > 0 &&
    patients.every((p) => selectedPatientIds.includes(p.id));
  const isSomeSelected =
    patients.some((p) => selectedPatientIds.includes(p.id)) && !isAllSelected;

  const getInitials = (nameStr: string) => {
    const clean = nameStr.trim();
    if (!clean) return "PT";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by patient name, phone, or doctor..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm bg-muted/30 focus-visible:bg-background rounded-xl"
            />
          </div>

          {/* Filter Dropdowns and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Condition Select */}
            <select
              value={selectedCondition}
              onChange={(e) => onConditionChange(e.target.value)}
              className="h-9 sm:h-10 flex-1 sm:flex-initial rounded-xl border border-input bg-card px-2.5 sm:px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c === "All Conditions" ? "" : c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Date Filter Toggle */}
            <Button
              type="button"
              variant={showDatePicker || startDate || endDate ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="h-9 sm:h-10 px-2.5 rounded-xl gap-1 text-xs"
              title="Filter by Registration Date Range"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Dates</span>
            </Button>

            {/* List / Grid Toggle (desktop only) */}
            <div className="hidden sm:flex items-center rounded-xl border border-border bg-muted/40 p-1">
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("list")}
                className={cn("h-7 w-7 rounded-lg", viewMode === "list" && "shadow-xs")}
                title="List View"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("grid")}
                className={cn("h-7 w-7 rounded-lg", viewMode === "grid" && "shadow-xs")}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Date-wise Filter */}
        {showDatePicker && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
            <span className="text-muted-foreground font-medium">Registered:</span>
            <Input
              type="date"
              title="Start Date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-8 w-32 sm:w-36 px-2 text-xs"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              title="End Date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-8 w-32 sm:w-36 px-2 text-xs"
            />
            {(startDate || endDate) && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  onStartDateChange("");
                  onEndDateChange("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Dates
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedPatientIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-50 dark:bg-blue-950/40 border border-teal-200 dark:border-teal-900 px-3 sm:px-4 py-2.5 text-xs text-teal-900 dark:text-teal-100 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              {selectedPatientIds.length} patient(s) selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onBulkReassign && availableDoctors.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={reassignDoctorId}
                  onChange={(e) => setReassignDoctorId(e.target.value)}
                  className="h-8 rounded-lg border border-teal-200 bg-white dark:bg-slate-900 px-2 text-xs text-foreground cursor-pointer"
                >
                  <option value="">Transfer to Doctor...</option>
                  {availableDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="xs"
                  disabled={!reassignDoctorId}
                  onClick={() => {
                    if (reassignDoctorId) {
                      onBulkReassign(reassignDoctorId);
                      setReassignDoctorId("");
                    }
                  }}
                  className="h-8 bg-primary hover:bg-teal-800 text-white text-xs"
                >
                  Assign
                </Button>
              </div>
            )}

            {onBulkDelete && (
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={onBulkDelete}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedPatientIds.length})</span>
              </Button>
            )}

            {onToggleSelectAll && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onToggleSelectAll}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Deselect
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Card Stack (< md screen size) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
            Loading clinical patient records...
          </div>
        ) : patients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card p-8 text-center text-xs text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            No patients match the specified criteria.
          </div>
        ) : (
          patients.map((patient, index) => {
            const initials = getInitials(patient.name);
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const isSelected = selectedPatientIds.includes(patient.id);

            return (
              <Card
                key={patient.id}
                className={cn(
                  "p-4 border border-border/80 bg-card shadow-xs space-y-3 transition-colors",
                  isSelected && "border-teal-500 bg-teal-50/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {onToggleSelectPatient && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${patient.name}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectPatient(patient.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs ring-1 ring-border/50",
                        avatarColor
                      )}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p
                        onClick={() => onViewPatient && onViewPatient(patient)}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                      >
                        {patient.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Age {patient.age} · {patient.gender ? patient.gender.replace(/_/g, " ") : "—"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                      patient.condition === "Critical"
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                        : patient.condition === "Under Treatment"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400"
                    )}
                  >
                    {patient.condition}
                  </span>
                </div>

                {/* Assigned Doctor Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {patient.assignedDoctor?.name || (
                        <span className="text-amber-600 font-semibold">Unassigned</span>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                    {patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onViewPatient && onViewPatient(patient)}
                      className="text-xs text-primary hover:text-teal-700"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onEditPatient(patient)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onDeletePatient(patient)}
                      className="text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop / Tablet View (md and above) */}
      <div className="hidden md:block">
        {viewMode === "list" ? (
          <Card className="overflow-hidden border border-border/80 shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 uppercase tracking-wider text-[11px] font-bold text-muted-foreground border-b border-border">
                    <TableHead className="py-3 px-3 w-10 text-center">
                      {onToggleSelectAll && (
                        <input
                          type="checkbox"
                          aria-label="Select all patients on this page"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected;
                          }}
                          onChange={onToggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      )}
                    </TableHead>
                    <TableHead className="py-3 px-4">PATIENT</TableHead>
                    <TableHead className="py-3 px-4">MEDICAL CONDITION</TableHead>
                    <TableHead className="py-3 px-4">ASSIGNED DOCTOR</TableHead>
                    <TableHead className="py-3 px-4">CONTACT</TableHead>
                    <TableHead className="py-3 px-4">REGISTERED</TableHead>
                    <TableHead className="py-3 px-5 text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-52 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-xs text-muted-foreground">
                            Loading clinical patient records...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-52 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <User className="h-8 w-8 text-muted-foreground/40" />
                          <span className="text-xs font-semibold">
                            No patients match the specified criteria.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient, index) => {
                      const initials = getInitials(patient.name);
                      const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                      const isSelected = selectedPatientIds.includes(patient.id);

                      return (
                        <TableRow
                          key={patient.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            isSelected && "bg-teal-50/50 dark:bg-blue-950/20"
                          )}
                        >
                          {/* SELECTION CHECKBOX */}
                          <TableCell className="py-3 px-3 text-center">
                            {onToggleSelectPatient && (
                              <input
                                type="checkbox"
                                aria-label={`Select ${patient.name}`}
                                checked={isSelected}
                                onChange={() => onToggleSelectPatient(patient.id)}
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            )}
                          </TableCell>

                          {/* PATIENT (Name, Age, Gender) */}
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs ring-1 ring-border/50",
                                  avatarColor
                                )}
                              >
                                {initials}
                              </div>
                              <div className="flex flex-col">
                                <span
                                  onClick={() => onViewPatient && onViewPatient(patient)}
                                  className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer leading-tight"
                                >
                                  {patient.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Age {patient.age} · {patient.gender ? patient.gender.replace(/_/g, " ") : "—"}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* MEDICAL CONDITION */}
                          <TableCell className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                                patient.condition === "Critical"
                                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                                  : patient.condition === "Under Treatment"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                  : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400"
                              )}
                            >
                              {patient.condition}
                            </span>
                          </TableCell>

                          {/* ASSIGNED DOCTOR */}
                          <TableCell className="py-3 px-4">
                            {patient.assignedDoctor ? (
                              <div className="flex flex-col text-xs leading-relaxed">
                                <Link
                                  href={`/doctors`}
                                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                  <Stethoscope className="h-3 w-3" />
                                  <span>{patient.assignedDoctor.name}</span>
                                </Link>
                                <span className="text-[11px] text-muted-foreground">
                                  {patient.assignedDoctor.specialization}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600">
                                Unassigned
                              </span>
                            )}
                          </TableCell>

                          {/* CONTACT */}
                          <TableCell className="py-3 px-4">
                            <span className="text-xs font-medium text-foreground">
                              {patient.phone || "Not provided"}
                            </span>
                          </TableCell>

                          {/* REGISTERED */}
                          <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                            {new Date(patient.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>

                          {/* ACTIONS */}
                          <TableCell className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => onViewPatient && onViewPatient(patient)}
                                className="text-xs font-semibold text-primary hover:text-teal-700 hover:underline px-1 py-0.5"
                              >
                                View
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                  aria-label="Open patient menu"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => onViewPatient && onViewPatient(patient)}
                                    className="flex items-center gap-2 cursor-pointer text-xs"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Full Profile</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onEditPatient(patient)}
                                    className="flex items-center gap-2 cursor-pointer text-xs"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    <span>Edit Record</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDeletePatient(patient)}
                                    className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete Record</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          /* Desktop Grid Layout Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient, index) => {
              const initials = getInitials(patient.name);
              const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
              const isSelected = selectedPatientIds.includes(patient.id);

              return (
                <Card
                  key={patient.id}
                  className={cn(
                    "p-5 border border-border/80 shadow-xs space-y-4 transition-all",
                    isSelected && "border-teal-500 bg-teal-50/20 ring-1 ring-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {onToggleSelectPatient && (
                        <input
                          type="checkbox"
                          aria-label={`Select ${patient.name}`}
                          checked={isSelected}
                          onChange={() => onToggleSelectPatient(patient.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                      )}
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-sm ring-1 ring-border/50",
                          avatarColor
                        )}
                      >
                        {initials}
                      </div>
                      <div>
                        <p
                          onClick={() => onViewPatient && onViewPatient(patient)}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          {patient.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Age {patient.age} · {patient.gender ? patient.gender.replace(/_/g, " ") : "—"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        patient.condition === "Critical"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-teal-50 text-teal-700 border-teal-200"
                      )}
                    >
                      {patient.condition}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">
                      {patient.assignedDoctor?.name || "Unassigned"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewPatient && onViewPatient(patient)}
                      className="font-semibold text-primary hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Bar (Responsive across all screens) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 px-3 sm:px-5 py-3 bg-muted/20 text-xs text-muted-foreground rounded-xl">
        <span className="order-2 sm:order-1 text-center sm:text-left">
          Showing page <strong className="text-foreground">{currentPage}</strong>{" "}
          of <strong className="text-foreground">{Math.max(totalPages, 1)}</strong>{" "}
          ({totalPatients} total patients)
        </span>

        <div className="flex items-center gap-1.5 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            className="gap-1 h-8 px-2.5 text-xs flex-1 sm:flex-initial justify-center"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="gap-1 h-8 px-2.5 text-xs flex-1 sm:flex-initial justify-center"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
