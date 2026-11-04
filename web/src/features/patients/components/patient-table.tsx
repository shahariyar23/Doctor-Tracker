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
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Bed,
} from "lucide-react";
import { Patient, PatientStats } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
}

const CONDITION_OPTIONS = [
  "All Conditions",
  "Critical",
  "Under Treatment",
  "Stable",
  "Recovering",
];

const WARD_OPTIONS = [
  "All Wards & Wings",
  "ICU / Critical",
  "Cardiology Wing",
  "Neurology Unit",
  "Pediatrics",
  "General Ward",
  "Surgical Wing",
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const CONDITION_STYLES: Record<string, { badge: string; text: string }> = {
  Critical: {
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
    text: "text-red-600",
  },
  "Under Treatment": {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    text: "text-amber-600",
  },
  Stable: {
    badge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50",
    text: "text-teal-600",
  },
  Recovering: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
    text: "text-blue-600",
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getPatientMRN(patient: Patient, index: number): string {
  if (patient.code) return patient.code;
  const num = patient.id.replace(/\D/g, "");
  return `#MRN-${num ? 8490 + parseInt(num) : 8492 + index}`;
}

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
  stats,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
}: PatientTableProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedWard, setSelectedWard] = useState("All Wards & Wings");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const statusChips = [
    { label: "All Patients", value: "", count: stats?.totalPatients || totalPatients },
    { label: "Critical", value: "Critical", count: stats?.criticalCare || 18 },
    { label: "Under Treatment", value: "Under Treatment", count: stats?.underTreatment || 112 },
    { label: "Stable", value: "Stable", count: stats?.stable || 84 },
    { label: "Recovering", value: "Recovering", count: stats?.recovering || 34 },
    { label: "Unassigned", value: "Unassigned", count: stats?.unassigned || 6 },
  ];

  return (
    <div className="space-y-4">
      {/* Search, Filter Bar and Quick Status Chips (Matching Design System) */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          {/* Top Row: Search, Dropdowns, Date Range, Layout Switcher */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search patients by name, MRN, phone, condition, doctor..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 text-xs bg-muted/30 focus:bg-background rounded-xl border-border/80"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Condition Select */}
              <select
                value={selectedCondition}
                onChange={(e) => onConditionChange(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c === "All Conditions" ? "" : c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>

              {/* Ward Select */}
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                {WARD_OPTIONS.map((ward) => (
                  <option key={ward} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>

              {/* Date Filter Toggle */}
              <Button
                type="button"
                variant={showDatePicker || startDate || endDate ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-10 px-2.5 rounded-xl gap-1 text-xs"
                title="Filter by Admission Date Range"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Dates</span>
              </Button>

              {/* List / Grid Toggle */}
              <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
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
            <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-xs">
              <span className="text-muted-foreground font-medium">Admission Range:</span>
              <Input
                type="date"
                title="Start Date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-8 w-36 px-2 text-xs"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                title="End Date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-8 w-36 px-2 text-xs"
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

          {/* Bottom Row: Quick Status Filter Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50 overflow-x-auto pb-1">
            {statusChips.map((chip) => {
              const isActive = selectedCondition === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => onConditionChange(chip.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 select-none",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{chip.label}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table Canvas or Grid View */}
      {viewMode === "list" ? (
        <Card className="overflow-hidden border border-border/80 shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 uppercase tracking-wider text-[11px] font-bold text-muted-foreground border-b border-border">
                  <TableHead className="py-3 px-5">PATIENT & MRN</TableHead>
                  <TableHead className="py-3 px-4">MEDICAL CONDITION</TableHead>
                  <TableHead className="py-3 px-4">ATTENDING PHYSICIAN</TableHead>
                  <TableHead className="py-3 px-4">CONTACT & ROOM</TableHead>
                  <TableHead className="py-3 px-4">ADMITTED</TableHead>
                  <TableHead className="py-3 px-4">STATUS</TableHead>
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
                    const mrn = getPatientMRN(patient, index);
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const condStyle = CONDITION_STYLES[patient.condition] || {
                      badge: "bg-slate-50 text-slate-700 border-slate-200",
                      text: "text-slate-600",
                    };

                    return (
                      <TableRow
                        key={patient.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* PATIENT & MRN */}
                        <TableCell className="py-3 px-5">
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
                                className="font-bold text-foreground text-sm hover:text-blue-600 cursor-pointer transition-colors leading-tight"
                              >
                                {patient.name}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {mrn}
                                {patient.age ? ` • ${patient.age}y` : ""}
                                {patient.gender ? ` • ${patient.gender[0]}` : ""}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* MEDICAL CONDITION */}
                        <TableCell className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                              condStyle.badge
                            )}
                          >
                            {patient.condition}
                          </span>
                        </TableCell>

                        {/* ATTENDING PHYSICIAN */}
                        <TableCell className="py-3 px-4">
                          {patient.assignedDoctor ? (
                            <div className="flex flex-col text-xs leading-tight">
                              <Link
                                href={`/doctors/${patient.assignedDoctor.id}`}
                                className="font-semibold text-foreground hover:text-blue-600 hover:underline flex items-center gap-1.5"
                              >
                                <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span>{patient.assignedDoctor.name}</span>
                              </Link>
                              <span className="text-[11px] text-muted-foreground pl-5">
                                {patient.assignedDoctor.specialization}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                              <AlertCircle className="h-3 w-3" />
                              <span>Unassigned</span>
                            </span>
                          )}
                        </TableCell>

                        {/* CONTACT & ROOM */}
                        <TableCell className="py-3 px-4">
                          <div className="flex flex-col text-xs leading-relaxed">
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {patient.phone}
                            </span>
                            <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                              <Bed className="h-3 w-3 text-muted-foreground" />
                              {patient.roomNumber || "Main Facility"}
                            </span>
                          </div>
                        </TableCell>

                        {/* ADMITTED */}
                        <TableCell className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(patient.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>

                        {/* STATUS */}
                        <TableCell className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            <span>{patient.status}</span>
                          </span>
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onViewPatient && onViewPatient(patient)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1 py-0.5"
                            >
                              Details
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
                                  <span>View Chart</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEditPatient(patient)}
                                  className="flex items-center gap-2 cursor-pointer text-xs"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>Edit Patient</span>
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

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-5 py-3 bg-muted/20 text-xs text-muted-foreground">
            <span>
              Showing page <strong className="text-foreground">{currentPage}</strong>{" "}
              of <strong className="text-foreground">{Math.max(totalPages, 1)}</strong>{" "}
              ({totalPatients} total patients)
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onPageChange(currentPage - 1)}
                className="gap-1 h-8 px-2.5 text-xs"
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
                className="gap-1 h-8 px-2.5 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Grid Layout Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient, index) => {
            const initials = getInitials(patient.name);
            const mrn = getPatientMRN(patient, index);
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const condStyle = CONDITION_STYLES[patient.condition] || {
              badge: "bg-slate-50 text-slate-700 border-slate-200",
              text: "text-slate-600",
            };

            return (
              <Card key={patient.id} className="p-5 border border-border/80 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-sm ring-1 ring-border/50",
                        avatarColor
                      )}
                    >
                      {initials}
                    </div>
                    <div>
                      <h4
                        onClick={() => onViewPatient && onViewPatient(patient)}
                        className="font-bold text-sm text-foreground hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {patient.name}
                      </h4>
                      <p className="text-[11px] font-mono text-muted-foreground">{mrn}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                      condStyle.badge
                    )}
                  >
                    {patient.condition}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Physician:</span>
                    <span className="font-semibold text-foreground">
                      {patient.assignedDoctor?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Contact:</span>
                    <span className="text-foreground">{patient.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">{patient.roomNumber || "Ward"}</span>
                  <button
                    type="button"
                    onClick={() => onViewPatient && onViewPatient(patient)}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    View Chart
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
