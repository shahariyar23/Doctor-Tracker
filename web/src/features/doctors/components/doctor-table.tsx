"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Stethoscope,
  LayoutList,
  LayoutGrid,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Doctor, DoctorStats } from "../types";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DoctorTableProps {
  doctors: Doctor[];
  isLoading: boolean;
  totalDoctors: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  selectedSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  stats?: DoctorStats;
  onViewPatients: (doctor: Doctor) => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctor: Doctor) => void;
  selectedDoctorIds?: string[];
  onToggleSelectDoctor?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onBulkDelete?: () => void;
}

const SPECIALTY_OPTIONS = [
  "All Specialties",
  "Cardiology",
  "Neurology",
  "Oncology",
  "Pediatrics",
  "Internal Medicine",
  "Geriatrics",
  "Thoracic Surgery",
  "Endocrinology",
  "Orthopedics",
];

const SHIFT_OPTIONS = [
  "All Shifts",
  "Morning",
  "Evening",
  "Night",
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

function getInitials(name: string): string {
  const clean = name.replace(/^Dr\.\s*/i, "").replace(/,\s*MD$/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getDoctorCode(doctor: Doctor, index: number): string {
  if (doctor.code) return doctor.code;
  const num = doctor.id.replace(/\D/g, "");
  return `#DOC-${num ? 1040 + parseInt(num) : 1042 + index}`;
}

export function DoctorTable({
  doctors,
  isLoading,
  totalDoctors,
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  selectedSpecialty,
  onSpecialtyChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  stats,
  onViewPatients,
  onEditDoctor,
  onDeleteDoctor,
  selectedDoctorIds = [],
  onToggleSelectDoctor,
  onToggleSelectAll,
  onBulkDelete,
}: DoctorTableProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isAllSelected =
    doctors.length > 0 && doctors.every((d) => selectedDoctorIds.includes(d.id));
  const isSomeSelected =
    doctors.some((d) => selectedDoctorIds.includes(d.id)) && !isAllSelected;

  return (
    <div className="space-y-4">
      {/* Search and Date Filter Bar */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          {/* Top Row: Search, Specialty, Date Range, Layout Switcher */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search doctors by name, specialization, hospital, email, phone..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 text-xs bg-muted/30 focus:bg-background rounded-xl border-border/80"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Specialty */}
              <select
                value={selectedSpecialty}
                onChange={(e) => onSpecialtyChange(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                {SPECIALTY_OPTIONS.map((spec) => (
                  <option key={spec} value={spec === "All Specialties" ? "" : spec}>
                    {spec}
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
                title="Filter by Registration Date Range"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Date Filter</span>
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
              <span className="text-muted-foreground font-medium">Date Range:</span>
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
        </CardContent>
      </Card>

      {/* Floating Bulk Actions Bar */}
      {selectedDoctorIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              {selectedDoctorIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              doctor{selectedDoctorIds.length > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onBulkDelete && (
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={onBulkDelete}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedDoctorIds.length})</span>
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
                Deselect All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table Canvas or Grid View */}
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
                        aria-label="Select all doctors on this page"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={onToggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    )}
                  </TableHead>
                  <TableHead className="py-3 px-4">PHYSICIAN & HOSPITAL</TableHead>
                  <TableHead className="py-3 px-4">SPECIALIZATION</TableHead>
                  <TableHead className="py-3 px-4">PHONE</TableHead>
                  <TableHead className="py-3 px-4">EMAIL</TableHead>
                  <TableHead className="py-3 px-4">ASSIGNED PATIENTS</TableHead>
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
                          Loading physician records...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-52 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Stethoscope className="h-8 w-8 text-muted-foreground/40" />
                        <span className="text-xs font-semibold">
                          No doctors match the specified criteria.
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  doctors.map((doctor, index) => {
                    const initials = getInitials(doctor.name);
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const currentCount = doctor.patientCount || 0;
                    const isSelected = selectedDoctorIds.includes(doctor.id);

                    return (
                      <TableRow
                        key={doctor.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          isSelected && "bg-blue-50/50 dark:bg-blue-950/20"
                        )}
                      >
                        {/* SELECTION CHECKBOX */}
                        <TableCell className="py-3 px-3 text-center">
                          {onToggleSelectDoctor && (
                            <input
                              type="checkbox"
                              aria-label={`Select ${doctor.name}`}
                              checked={isSelected}
                              onChange={() => onToggleSelectDoctor(doctor.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          )}
                        </TableCell>

                        {/* NAME & HOSPITAL (PDF REQUIRED) */}
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
                              <Link
                                href={`/doctors/${doctor.id}`}
                                className="font-bold text-foreground text-sm hover:text-blue-600 transition-colors leading-tight"
                              >
                                {doctor.name}
                              </Link>
                              <span className="text-[11px] text-muted-foreground">
                                {doctor.hospital}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* SPECIALIZATION (PDF REQUIRED) */}
                        <TableCell className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                            {doctor.specialization}
                          </span>
                        </TableCell>

                        {/* PHONE (PDF REQUIRED) */}
                        <TableCell className="py-3 px-4">
                          <span className="text-xs font-medium text-foreground">{doctor.phone}</span>
                        </TableCell>

                        {/* EMAIL (PDF REQUIRED) */}
                        <TableCell className="py-3 px-4">
                          <span className="text-xs text-muted-foreground">{doctor.email}</span>
                        </TableCell>

                        {/* CORRESPONDING PATIENTS COUNT */}
                        <TableCell className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {currentCount} patient{currentCount === 1 ? "" : "s"}
                          </span>
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onViewPatients(doctor)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1 py-0.5 cursor-pointer"
                            >
                              View Patients
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                                aria-label="Open doctor menu"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => {
                                    router.push(`/doctors/${doctor.id}`);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer text-xs"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>View Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEditDoctor(doctor)}
                                  className="flex items-center gap-2 cursor-pointer text-xs"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>Edit Doctor</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDeleteDoctor(doctor)}
                                  className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete Doctor</span>
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
              ({totalDoctors} total doctors)
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
          {doctors.map((doctor, index) => {
            const initials = getInitials(doctor.name);
            const docCode = getDoctorCode(doctor, index);
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const currentCount = doctor.patientCount || 0;
            const maxCap = doctor.maxCapacity || 35;
            const caseloadPercent = Math.min(Math.round((currentCount / maxCap) * 100), 100);
            const isOverloaded = caseloadPercent >= 90;
            const isSelected = selectedDoctorIds.includes(doctor.id);

            return (
              <Card
                key={doctor.id}
                className={cn(
                  "p-5 border border-border/80 shadow-xs space-y-4 transition-all",
                  isSelected && "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {onToggleSelectDoctor && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${doctor.name}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectDoctor(doctor.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
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
                      <Link
                        href={`/doctors/${doctor.id}`}
                        className="font-bold text-sm text-foreground hover:text-blue-600 transition-colors"
                      >
                        {doctor.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{doctor.hospital}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    {doctor.specialization}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Email:</span>
                    <span className="text-foreground">{doctor.email}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phone:</span>
                    <span className="text-foreground">{doctor.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">
                    {currentCount} assigned patient{currentCount === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewPatients(doctor)}
                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Patients
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
