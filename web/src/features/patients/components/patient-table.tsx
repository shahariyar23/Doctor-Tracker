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
  Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Stable: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900",
  Recovering: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
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
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Top: Search and Date Range */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search patients by name, phone, or condition..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Date-wise Filter (PDF §2.3 requirement) */}
            <div className="flex items-center gap-1.5 self-start lg:self-auto">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                title="Admission Start Date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-9 w-36 px-2 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                title="Admission End Date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-9 w-36 px-2 text-xs"
              />
            </div>
          </div>

          {/* Condition Filter Tabs (PDF §2.3 requirement) */}
          <div className="flex items-center gap-1 border-t border-border/60 pt-3 overflow-x-auto">
            {CONDITION_TABS.map((tab) => {
              const isActive = selectedCondition === tab.value;
              return (
                <Button
                  key={tab.label}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="xs"
                  onClick={() => onConditionChange(tab.value)}
                  className="rounded-lg shrink-0"
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table Canvas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground">
                <TableHead className="py-3 px-4">Patient Profile</TableHead>
                <TableHead className="py-3 px-4">Medical Condition</TableHead>
                <TableHead className="py-3 px-4">Assigned Doctor</TableHead>
                <TableHead className="py-3 px-4">Contact Phone</TableHead>
                <TableHead className="py-3 px-4">Registration Date</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                <TableHead className="py-3 px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs text-muted-foreground">
                        Loading patient records...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <User className="h-8 w-8 text-muted-foreground/40" />
                      <span className="text-xs font-medium">
                        No patients match the specified criteria.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                    {/* Patient Profile */}
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                          {patient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">
                            {patient.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ID: {patient.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Condition Badge */}
                    <TableCell className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          BADGE_STYLES[patient.condition] ||
                            "bg-slate-50 text-slate-700 border-slate-200"
                        )}
                      >
                        {patient.condition}
                      </span>
                    </TableCell>

                    {/* Assigned Doctor */}
                    <TableCell className="py-3 px-4">
                      {patient.assignedDoctor ? (
                        <div className="flex flex-col text-xs">
                          <Link
                            href={`/doctors/${patient.assignedDoctor.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                          >
                            <Stethoscope className="h-3 w-3 text-primary" />
                            <span>{patient.assignedDoctor.name}</span>
                          </Link>
                          <span className="text-[11px] text-muted-foreground">
                            {patient.assignedDoctor.specialization}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    {/* Contact Phone */}
                    <TableCell className="py-3 px-4 text-muted-foreground text-xs">
                      {patient.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{patient.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Registration Date */}
                    <TableCell className="py-3 px-4 text-muted-foreground text-[11px]">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={patient.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-50 text-slate-600 border-slate-200"}
                      >
                        {patient.status}
                      </Badge>
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEditPatient(patient)}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit patient"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDeletePatient(patient)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Delete patient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar (PDF §2.3 requirement) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
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
              className="gap-1"
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
              className="gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
