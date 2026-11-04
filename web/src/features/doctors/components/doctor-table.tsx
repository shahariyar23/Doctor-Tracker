"use client";

import React from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Edit2,
  Trash2,
  Building2,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { Doctor } from "../types";
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
  onViewPatients: (doctor: Doctor) => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctor: Doctor) => void;
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
}: DoctorTableProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search doctors by name, specialty, hospital, phone, or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Specialty Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedSpecialty}
              onChange={(e) => onSpecialtyChange(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              {SPECIALTY_OPTIONS.map((spec) => (
                <option key={spec} value={spec === "All Specialties" ? "" : spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Date-wise Filter (PDF §2.2 requirement) */}
          <div className="flex items-center gap-1.5 border-l border-border pl-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              title="Start Date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              title="End Date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Physician Details</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Hospital / Facility</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Patients Under Care</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-36 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-32 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-28 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-16 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-16 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-8 rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Stethoscope className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-medium">No doctors found.</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      Try adjusting your search criteria or register a new doctor.
                    </p>
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Physician Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                          {doctor.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">
                            {doctor.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Added: {new Date(doctor.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                        {doctor.specialization}
                      </span>
                    </td>

                    {/* Hospital (PDF §2.2) */}
                    <td className="py-3 px-4 text-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {doctor.hospital}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex flex-col text-[11px]">
                        <span>{doctor.email}</span>
                        <span>{doctor.phone}</span>
                      </div>
                    </td>

                    {/* Corresponding Patients count */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onViewPatients(doctor)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        title="View assigned patients"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{doctor.patientCount || 0} patients</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          doctor.status === "On Leave"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {doctor.status || "Active"}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right">
                      <div className="relative inline-block text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewPatients(doctor)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="View patient list"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditDoctor(doctor)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Edit doctor profile"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDoctor(doctor)}
                            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete doctor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (PDF §2.2 requirement) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing page <strong className="text-foreground">{currentPage}</strong>{" "}
            of <strong className="text-foreground">{Math.max(totalPages, 1)}</strong>{" "}
            ({totalDoctors} total doctors)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
