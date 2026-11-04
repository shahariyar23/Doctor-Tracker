"use client";

import React from "react";
import Link from "next/link";
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
      <Card>
        <CardContent className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search doctors by name, specialty, hospital, phone, or email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-xs"
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
              <Input
                type="date"
                title="Start Date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-9 w-36 px-2 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                title="End Date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-9 w-36 px-2 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Canvas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground">
                <TableHead className="py-3 px-4">Doctor Details</TableHead>
                <TableHead className="py-3 px-4">Specialty</TableHead>
                <TableHead className="py-3 px-4">Hospital Affiliation</TableHead>
                <TableHead className="py-3 px-4">Contact Info</TableHead>
                <TableHead className="py-3 px-4">Patients</TableHead>
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
                        Loading physician records...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : doctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Stethoscope className="h-8 w-8 text-muted-foreground/40" />
                      <span className="text-xs font-medium">
                        No doctors match the specified criteria.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                doctors.map((doctor) => (
                  <TableRow
                    key={doctor.id}
                    onClick={() => onViewPatients(doctor)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    {/* Doctor Details */}
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                          {doctor.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground hover:text-primary transition-colors text-xs">
                            {doctor.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ID: {doctor.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Specialty */}
                    <TableCell className="py-3 px-4">
                      <Badge variant="secondary" className="font-medium text-[11px] text-primary">
                        {doctor.specialization}
                      </Badge>
                    </TableCell>

                    {/* Hospital Affiliation */}
                    <TableCell className="py-3 px-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{doctor.hospital}</span>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="py-3 px-4 text-muted-foreground">
                      <div className="flex flex-col text-[11px]">
                        <span>{doctor.email}</span>
                        <span>{doctor.phone}</span>
                      </div>
                    </TableCell>

                    {/* Corresponding Patients count */}
                    <TableCell className="py-3 px-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => onViewPatients(doctor)}
                        className="gap-1.5 font-semibold text-primary hover:text-primary hover:bg-primary/10"
                        title="View assigned patients"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{doctor.patientCount || 0} patients</span>
                      </Button>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3 px-4">
                      <Badge
                        variant={doctor.status === "On Leave" ? "destructive" : "outline"}
                        className={doctor.status === "On Leave" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"}
                      >
                        {doctor.status || "Active"}
                      </Badge>
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onViewPatients(doctor)}
                          className="text-primary hover:bg-primary/10"
                          title="View patient list"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEditDoctor(doctor)}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit doctor profile"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDeleteDoctor(doctor)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Delete doctor"
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

        {/* Pagination Bar (PDF §2.2 requirement) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
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
