"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Edit2,
  Trash2,
  Calendar,
  Stethoscope,
  Phone,
} from "lucide-react";
import { Patient } from "../types";
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
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
}

const CONDITION_TABS: Array<{ label: string; value: string }> = [
  { label: "All Conditions", value: "" },
  { label: "Critical", value: "Critical" },
  { label: "Under Treatment", value: "Under Treatment" },
  { label: "Stable", value: "Stable" },
  { label: "Recovering", value: "Recovering" },
];

const BADGE_STYLES: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200",
  Stable: "bg-teal-50 text-teal-700 border-teal-200",
  Recovering: "bg-blue-50 text-blue-700 border-blue-200",
};

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
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onEditPatient,
  onDeletePatient,
}: PatientTableProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-xs">
        {/* Top: Search and Date Range */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search patients by name, phone, or condition..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Date-wise Filter (PDF §2.3 requirement) */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              title="Admission Start Date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              title="Admission End Date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Condition Filter Tabs (PDF §2.3 requirement) */}
        <div className="flex items-center gap-1 border-t border-border/60 pt-3 overflow-x-auto">
          {CONDITION_TABS.map((tab) => {
            const isActive = selectedCondition === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => onConditionChange(tab.value)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium transition-all shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Canvas */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">Medical Condition</th>
                <th className="py-3 px-4">Assigned Attending Doctor</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-32 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-28 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-16 rounded bg-muted" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-12 rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-medium">No patient records found.</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      Try updating your search query or registering a new patient.
                    </p>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Patient Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                          {patient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">
                            {patient.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ID: #{patient.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Medical Condition */}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                          BADGE_STYLES[patient.condition] ||
                            "bg-slate-50 text-slate-700 border-slate-200"
                        )}
                      >
                        {patient.condition}
                      </span>
                    </td>

                    {/* Assigned Attending Doctor */}
                    <td className="py-3 px-4">
                      {patient.assignedDoctor ? (
                        <Link
                          href={`/doctors/${patient.assignedDoctor.id}`}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                          <span>{patient.assignedDoctor.name}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                          patient.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        {patient.status}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditPatient(patient)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Edit patient"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePatient(patient)}
                          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete patient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (PDF §2.3 requirement) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing page <strong className="text-foreground">{currentPage}</strong>{" "}
            of <strong className="text-foreground">{Math.max(totalPages, 1)}</strong>{" "}
            ({totalPatients} total patients)
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
