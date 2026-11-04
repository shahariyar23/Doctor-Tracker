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
  CheckSquare,
  CheckCircle,
  Clock,
  Phone,
} from "lucide-react";
import { Doctor, DoctorStats } from "../types";
import specialtyOptionsData from "@/data/options/specializations.json";
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
import { Card } from "@/components/ui/card";
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

const SPECIALTY_OPTIONS = ["All Specialties", ...specialtyOptionsData];

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

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
    doctors.length > 0 &&
    doctors.every((d) => selectedDoctorIds.includes(d.id));
  const isSomeSelected =
    doctors.some((d) => selectedDoctorIds.includes(d.id)) && !isAllSelected;

  const getInitials = (nameStr: string) => {
    const clean = nameStr.replace(/^(dr\.|dr|doctor|md|prof\.)\s+/i, "").trim();
    if (!clean) return "DR";
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
              placeholder="Search by physician name, specialty, email, or hospital..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm bg-muted/30 focus-visible:bg-background rounded-xl"
            />
          </div>

          {/* Filter Dropdowns and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Specialty Select */}
            <select
              value={selectedSpecialty}
              onChange={(e) => onSpecialtyChange(e.target.value)}
              className="h-9 sm:h-10 flex-1 sm:flex-initial rounded-xl border border-input bg-card px-2.5 sm:px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              {SPECIALTY_OPTIONS.map((opt) => (
                <option key={opt} value={opt === "All Specialties" ? "" : opt}>
                  {opt}
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

            {/* List / Grid Toggle (hidden on mobile, defaults to card stack / table) */}
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
            <span className="text-muted-foreground font-medium">Joined Range:</span>
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
      {selectedDoctorIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 px-3 sm:px-4 py-2.5 text-xs text-teal-900 dark:text-teal-100 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              {selectedDoctorIds.length} physician(s) selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            Loading physician records...
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card p-8 text-center text-xs text-muted-foreground">
            <Stethoscope className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            No doctors match the specified criteria.
          </div>
        ) : (
          doctors.map((doctor, index) => {
            const initials = getInitials(doctor.name);
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const currentCount = doctor.patientCount || 0;
            const isSelected = selectedDoctorIds.includes(doctor.id);

            return (
              <Card
                key={doctor.id}
                className={cn(
                  "p-4 border border-border/80 bg-card shadow-xs space-y-3 transition-colors",
                  isSelected && "border-teal-500 bg-teal-50/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {onToggleSelectDoctor && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${doctor.name}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectDoctor(doctor.id)}
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
                      <Link
                        href={`/doctors/${doctor.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {doctor.name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {doctor.specialization} · {doctor.hospital}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 cursor-pointer transition-colors"
                      aria-label="Open doctor menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => router.push(`/doctors/${doctor.id}`)}
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

                {/* Contact and Quick Action */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <div className="flex flex-col text-muted-foreground text-[11px] truncate">
                    <span>{doctor.email}</span>
                    {doctor.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {doctor.phone}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewPatients(doctor)}
                    className="font-semibold text-primary hover:text-teal-700 hover:underline shrink-0 text-xs cursor-pointer transition-colors"
                  >
                    {currentCount} {currentCount === 1 ? "Patient" : "Patients"}
                  </button>
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
                          aria-label="Select all doctors on this page"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected;
                          }}
                          onChange={onToggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      )}
                    </TableHead>
                    <TableHead className="py-3 px-4">DOCTOR</TableHead>
                    <TableHead className="py-3 px-4">SPECIALIZATION</TableHead>
                    <TableHead className="py-3 px-4">HOSPITAL</TableHead>
                    <TableHead className="py-3 px-4">CONTACT</TableHead>
                    <TableHead className="py-3 px-4 text-center">ASSIGNED PATIENTS</TableHead>
                    <TableHead className="py-3 px-4">REGISTERED</TableHead>
                    <TableHead className="py-3 px-5 text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-52 text-center">
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
                      <TableCell colSpan={8} className="h-52 text-center">
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
                      const regDate = doctor.createdAt
                        ? new Date(doctor.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—";

                      return (
                        <TableRow
                          key={doctor.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            isSelected && "bg-teal-50/50 dark:bg-teal-950/20"
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
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            )}
                          </TableCell>

                          {/* DOCTOR */}
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
                                  className="font-bold text-foreground text-sm hover:text-primary transition-colors leading-tight"
                                >
                                  {doctor.name}
                                </Link>
                              </div>
                            </div>
                          </TableCell>

                          {/* SPECIALIZATION */}
                          <TableCell className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/50 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50">
                              {doctor.specialization}
                            </span>
                          </TableCell>

                          {/* HOSPITAL */}
                          <TableCell className="py-3 px-4">
                            <span className="text-xs text-foreground font-medium">
                              {doctor.hospital}
                            </span>
                          </TableCell>

                          {/* CONTACT */}
                          <TableCell className="py-3 px-4">
                            <div className="flex flex-col text-xs leading-relaxed">
                              <span className="font-medium text-foreground">{doctor.email}</span>
                              <span className="text-muted-foreground text-[11px]">{doctor.phone}</span>
                            </div>
                          </TableCell>

                          {/* ASSIGNED PATIENTS */}
                          <TableCell className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => onViewPatients(doctor)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 transition-colors cursor-pointer"
                            >
                              <span>{currentCount}</span>
                              <span className="text-[11px] font-normal text-muted-foreground">
                                {currentCount === 1 ? "patient" : "patients"}
                              </span>
                            </button>
                          </TableCell>

                          {/* REGISTERED */}
                          <TableCell className="py-3 px-4">
                            <span className="text-xs text-muted-foreground">
                              {regDate}
                            </span>
                          </TableCell>

                          {/* ACTIONS */}
                          <TableCell className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => router.push(`/doctors/${doctor.id}`)}
                                className="text-xs font-medium text-primary hover:text-teal-700"
                              >
                                View
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                  aria-label="Open doctor menu"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/doctors/${doctor.id}`)}
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
          </Card>
        ) : (
          /* Desktop Grid Layout Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor, index) => {
              const initials = getInitials(doctor.name);
              const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
              const currentCount = doctor.patientCount || 0;
              const isSelected = selectedDoctorIds.includes(doctor.id);
              const regDate = doctor.createdAt
                ? new Date(doctor.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";

              return (
                <Card
                  key={doctor.id}
                  className={cn(
                    "p-5 border border-border/80 shadow-xs space-y-4 transition-all",
                    isSelected && "border-teal-500 bg-teal-50/20 ring-1 ring-primary/30"
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
                        <Link
                          href={`/doctors/${doctor.id}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {doctor.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{doctor.hospital}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700">
                      {doctor.specialization}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Assigned Patients:</span>
                      <span className="font-semibold text-foreground">{currentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registered:</span>
                      <span>{regDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">{doctor.phone}</span>
                    <button
                      type="button"
                      onClick={() => onViewPatients(doctor)}
                      className="font-semibold text-primary hover:text-teal-700 hover:underline cursor-pointer transition-colors"
                    >
                      View Patients ({currentCount})
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
          ({totalDoctors} total doctors)
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
