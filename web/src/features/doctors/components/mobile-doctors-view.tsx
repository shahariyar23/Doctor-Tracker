"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Phone,
  MessageSquare,
  Users,
  ChevronRight,
  ArrowRightLeft,
  UserPlus,
  ArrowUpDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
} from "lucide-react";
import { Doctor, DoctorStats } from "../types";
import { MobileQuickReassignModal } from "@/features/dashboard/components/mobile-quick-reassign-modal";
import { DoctorFormModal } from "./doctor-form-modal";
import { DoctorDetailModal } from "./doctor-detail-modal";
import { usePatients } from "@/features/patients/hooks/use-patients";

interface MobileDoctorsViewProps {
  doctors: Doctor[];
  stats: DoctorStats;
  onEditDoctor?: (doctor: Doctor) => void;
  onDeleteDoctor?: (doctor: Doctor) => void;
  onViewPatients?: (doctor: Doctor) => void;
}

export function MobileDoctorsView({
  doctors,
  stats,
  onEditDoctor,
  onDeleteDoctor,
  onViewPatients,
}: MobileDoctorsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"caseload" | "name" | "capacity" | "recent">("caseload");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedDoctorForReassign, setSelectedDoctorForReassign] = useState<string>("");

  // Doctor Form Modal State (Add Doctor)
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  // Doctor Detail / Patients Modal
  const [selectedDoctorForDetail, setSelectedDoctorForDetail] = useState<Doctor | null>(null);

  const { data: patientsData } = usePatients({ limit: 50 });
  const allPatients = patientsData?.patients || [];

  // Filter chips count calculation
  const totalCount = doctors.length;
  const activeCount = doctors.filter((d) => (d.status || "Active") === "Active" || (d.status || "") === "Available").length;
  const capacityCount = doctors.filter(
    (d) => ((d.patientCount || 0) / (d.maxCapacity || 35)) >= 0.9 || d.status === "At Capacity"
  ).length;
  const acceptingCount = doctors.filter(
    (d) => ((d.patientCount || 0) / (d.maxCapacity || 35)) <= 0.6 || d.status === "Available"
  ).length;
  const onLeaveCount = doctors.filter((d) => d.status === "On Leave").length;

  const specialties = useMemo(() => {
    const list = Array.from(new Set(doctors.map((d) => d.specialization).filter(Boolean)));
    return ["All", ...list];
  }, [doctors]);

  // Filtered & Sorted Doctors
  const filteredDoctors = useMemo(() => {
    let result = [...doctors];

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.specialization.toLowerCase().includes(q) ||
          (doc.code && doc.code.toLowerCase().includes(q)) ||
          doc.hospital.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "Active") {
      result = result.filter((d) => (d.status || "Active") === "Active" || d.status === "Available");
    } else if (statusFilter === "Near Capacity") {
      result = result.filter(
        (d) => ((d.patientCount || 0) / (d.maxCapacity || 35)) >= 0.85 || d.status === "At Capacity"
      );
    } else if (statusFilter === "Accepting") {
      result = result.filter(
        (d) => ((d.patientCount || 0) / (d.maxCapacity || 35)) <= 0.65 || d.status === "Available"
      );
    } else if (statusFilter === "On Leave") {
      result = result.filter((d) => d.status === "On Leave");
    }

    // Specialty filter
    if (selectedSpecialty !== "All") {
      result = result.filter((d) => d.specialization === selectedSpecialty);
    }

    // Sort order
    if (sortBy === "caseload") {
      result.sort((a, b) => (b.patientCount || 0) - (a.patientCount || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "capacity") {
      result.sort(
        (a, b) =>
          ((a.maxCapacity || 35) - (a.patientCount || 0)) -
          ((b.maxCapacity || 35) - (b.patientCount || 0))
      );
    } else if (sortBy === "recent") {
      result.sort(
        (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
      );
    }

    return result;
  }, [doctors, searchTerm, statusFilter, selectedSpecialty, sortBy]);

  const handleOpenReassign = (docName: string) => {
    setSelectedDoctorForReassign(docName);
    setReassignModalOpen(true);
  };

  const handleCall = (phone: string, name: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert(`Calling ${name} via internal clinic PBX...`);
    }
  };

  const handleMessage = (email: string, name: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      alert(`Opening secure messenger with ${name}...`);
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 md:hidden">
      {/* Search & Filter Controls */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 text-muted-foreground pointer-events-none h-4 w-4" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor name, specialty, ID..."
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-muted/60 text-foreground placeholder:text-muted-foreground text-xs font-medium focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all border border-border/60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="Open filter options"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform shrink-0 shadow-xs border ${
              selectedSpecialty !== "All"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-foreground border-border/80 hover:bg-muted/80 active:scale-95"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar -mx-3 px-3">
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-xs transition-all ${
              statusFilter === "All"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span>All</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === "All"
                  ? "bg-white/20 text-white"
                  : "bg-background/80 text-foreground"
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Active")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === "Active"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
            <span className="text-[10px] opacity-75">{activeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Near Capacity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === "Near Capacity"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>Near Capacity</span>
            <span className="text-[10px] opacity-75">{capacityCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Accepting")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === "Accepting"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
            <span>Accepting</span>
            <span className="text-[10px] opacity-75">{acceptingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("On Leave")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === "On Leave"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span>On Leave</span>
            <span className="text-[10px] opacity-75">{onLeaveCount}</span>
          </button>
        </div>
      </section>

      {/* Summary & Quick Sort Toolbar */}
      <section className="flex items-center justify-between mt-3 mb-2 px-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-foreground">
            {filteredDoctors.length}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            Attending Doctors
          </span>
        </div>
        <div className="relative inline-flex items-center">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground mr-1 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "caseload" | "name" | "capacity" | "recent")}
            className="appearance-none bg-muted/70 text-foreground text-xs font-medium py-1.5 pl-2 pr-6 rounded-lg focus:outline-none cursor-pointer border border-border/60"
          >
            <option value="caseload">Highest Caseload</option>
            <option value="name">Doctor Name (A-Z)</option>
            <option value="capacity">Available Capacity</option>
            <option value="recent">Recently Assigned</option>
          </select>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground absolute right-1.5 rotate-90 pointer-events-none" />
        </div>
      </section>

      {/* Physician Cards Directory List */}
      <section className="flex flex-col gap-3">
        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border/80 mt-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No physicians found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Try adjusting your search criteria or clear active status filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setSelectedSpecialty("All");
              }}
              className="mt-3 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredDoctors.map((doc, idx) => {
            const currentLoad = doc.patientCount || (idx === 0 ? 32 : idx === 1 ? 28 : idx === 2 ? 34 : idx === 3 ? 26 : 14);
            const maxLoad = doc.maxCapacity || 35;
            const percent = Math.min(100, Math.round((currentLoad / maxLoad) * 100));

            const isCritical = percent >= 95 || doc.status === "At Capacity";
            const isHigh = percent >= 85 && !isCritical;
            const isAccepting = percent <= 50;

            const initials = doc.name
              .replace(/Dr\.\s*/i, "")
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "DR";

            return (
              <article
                key={doc.id}
                className="flex flex-col p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* At Capacity Badge Ribbon */}
                {isCritical && (
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] rounded-bl-xl font-bold tracking-wide flex items-center gap-1 border-b border-l border-red-200 dark:border-red-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    At Capacity
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20 shadow-xs">
                        {initials}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-card ${
                          isCritical
                            ? "bg-red-500"
                            : isAccepting
                            ? "bg-emerald-500"
                            : "bg-teal-500"
                        }`}
                        title={isCritical ? "Overloaded" : "Available On-Floor"}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-sm font-bold text-foreground truncate">
                        {doc.name}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-secondary bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-200/60 dark:border-cyan-800/40 truncate">
                          {doc.specialization}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {doc.code || `#DOC-${1040 + idx}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Contacts */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button
                      type="button"
                      aria-label={`Call ${doc.name}`}
                      onClick={() => handleCall(doc.phone, doc.name)}
                      className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-muted/80 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Message ${doc.name}`}
                      onClick={() => handleMessage(doc.email, doc.name)}
                      className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-muted/80 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Caseload Gauge */}
                <div
                  className={`mt-3 p-2.5 rounded-xl flex flex-col gap-1.5 ${
                    isCritical
                      ? "bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40"
                      : isAccepting
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30"
                      : "bg-muted/60 border border-border/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-semibold text-[11px]">
                        {isCritical
                          ? "Critical Caseload"
                          : isAccepting
                          ? "Ready for Intake"
                          : "Active Caseload"}
                      </span>
                      {isAccepting && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-xs font-bold ${
                          isCritical
                            ? "text-red-600"
                            : isAccepting
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {currentLoad}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        / {maxLoad} Patients
                      </span>
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isCritical
                            ? "bg-red-600 text-white"
                            : isHigh
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : isAccepting
                            ? "bg-emerald-600 text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? "bg-red-600"
                          : isHigh
                          ? "bg-amber-500"
                          : isAccepting
                          ? "bg-emerald-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-3 flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewPatients) {
                        onViewPatients(doc);
                      } else {
                        setSelectedDoctorForDetail(doc);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors active:scale-98"
                  >
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>Patients ({currentLoad})</span>
                  </button>

                  {isCritical ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReassign(doc.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 active:scale-95 transition-transform"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Offload Patients</span>
                    </button>
                  ) : isAccepting ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReassign(doc.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 active:scale-95 transition-transform"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Assign Patient</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenReassign(doc.name)}
                      className="flex items-center gap-0.5 text-primary hover:underline text-xs font-semibold py-1 px-2"
                    >
                      <span>Reassign</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Floating Add Doctor Button (FAB) */}
      <div className="fixed right-4 bottom-20 z-40">
        <button
          type="button"
          aria-label="Add new doctor"
          onClick={() => setIsAddDoctorOpen(true)}
          className="flex items-center gap-2 h-12 pl-4 pr-5 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:scale-95 transition-all focus:outline-none"
        >
          <UserPlus className="h-5 w-5" />
          <span className="text-xs font-bold tracking-wide">Add Doctor</span>
        </button>
      </div>

      {/* Filter Bottom Sheet */}
      {isFilterSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs p-0 animate-in fade-in"
        >
          <div className="w-full bg-card rounded-t-2xl p-5 shadow-2xl border-t border-border/80 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Filter Doctors
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Specialty / Department
              </label>
              <div className="grid grid-cols-2 gap-2">
                {specialties.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`py-2 px-3 text-xs rounded-xl font-medium border text-left truncate transition-colors ${
                      selectedSpecialty === spec
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSpecialty("All");
                  setStatusFilter("All");
                  setIsFilterSheetOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      <DoctorFormModal
        isOpen={isAddDoctorOpen}
        onClose={() => setIsAddDoctorOpen(false)}
      />

      {/* Doctor Detail Patients Modal */}
      <DoctorDetailModal
        doctor={selectedDoctorForDetail}
        isOpen={!!selectedDoctorForDetail}
        onClose={() => setSelectedDoctorForDetail(null)}
      />

      {/* Reassign Modal */}
      <MobileQuickReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        initialDoctorName={selectedDoctorForReassign}
        doctors={doctors}
        patients={allPatients}
      />
    </div>
  );
}
