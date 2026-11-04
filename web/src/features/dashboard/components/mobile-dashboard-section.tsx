"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  ClipboardList,
  Users,
  Gauge,
  ArrowRightLeft,
  ChevronRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { DashboardData } from "../types";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { usePatients } from "@/features/patients/hooks/use-patients";
import { MobileQuickReassignModal } from "./mobile-quick-reassign-modal";
import { Button } from "@/components/ui/button";

interface MobileDashboardSectionProps {
  data?: DashboardData;
}

export function MobileDashboardSection({ data }: MobileDashboardSectionProps) {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<string>("Dr. Aris Thorne");

  const { data: doctorsData } = useDoctors({ limit: 50 });
  const { data: patientsData } = usePatients({ limit: 50 });

  const doctors = doctorsData?.doctors || [];
  const patients = patientsData?.patients || [];

  const metrics = data?.metrics || {
    totalDoctors: 148,
    totalPatients: 842,
    patientsPerDoctor: 25.1,
    assignedPatients: 818,
    unassignedPatients: 24,
  };

  const handleOpenReassign = (doctorName?: string) => {
    if (doctorName) setSelectedDoctorForModal(doctorName);
    setReassignModalOpen(true);
  };

  // Physician Saturation List items matching the mobile layout
  const saturationList = [
    {
      id: "doc-1",
      name: "Dr. Aris Thorne",
      unit: "Oncology · Unit 4B",
      current: 34,
      max: 35,
      percent: 97,
      status: "Critical",
      statusColor: "text-red-600",
      barColor: "bg-red-500",
      remainingText: "1 slot remaining",
      actionText: "Offload",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "doc-2",
      name: "Dr. Marcus Vance",
      unit: "Cardiology · Unit 2C",
      current: 32,
      max: 35,
      percent: 91,
      status: "High",
      statusColor: "text-cyan-700 dark:text-cyan-400",
      barColor: "bg-cyan-500",
      remainingText: "3 slots remaining",
      actionText: "Balance",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "doc-3",
      name: "Dr. Priya Patel",
      unit: "Neurology · Wing A",
      current: 28,
      max: 35,
      percent: 80,
      status: "Moderate",
      statusColor: "text-blue-600",
      barColor: "bg-blue-600",
      remainingText: "7 slots remaining",
      badgeText: "Optimal Load",
      avatar: "https://images.unsplash.com/photo-1594824813511-662580556277?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "doc-4",
      name: "Dr. Elena Gomez",
      unit: "Endocrinology · Clinic 3",
      current: 14,
      max: 35,
      percent: 40,
      status: "Available",
      statusColor: "text-emerald-700 dark:text-emerald-400",
      barColor: "bg-emerald-500",
      remainingText: "21 slots open for intake",
      actionText: "Assign More",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const recentReassignments = [
    {
      id: "r-1",
      patientName: "Eleanor Sterling",
      patientCode: "#PT-9041",
      timeAgo: "18m ago",
      sourceDoctor: "Dr. Aris Thorne",
      targetDoctor: "Dr. Elena Gomez",
      reason: "Capacity relief",
      staffId: "#AD-810",
    },
    {
      id: "r-2",
      patientName: "Liam Chen",
      patientCode: "#PT-4822",
      timeAgo: "1h 12m ago",
      sourceDoctor: "Dr. S. Kalu",
      targetDoctor: "Dr. Marcus Vance",
      reason: "Specialty match",
      staffId: "#AD-902",
    },
    {
      id: "r-3",
      patientName: "Rachel Diaz",
      patientCode: "#PT-3310",
      timeAgo: "2h 45m ago",
      sourceDoctor: "Dr. Aris Thorne",
      targetDoctor: "Dr. Priya Patel",
      reason: "Capacity relief",
      staffId: "#AD-810",
    },
  ];

  return (
    <div className="flex flex-col w-full space-y-4 md:hidden pb-12">
      {/* Welcoming & Pulse Strip */}
      <div className="flex items-center justify-between bg-card/80 border border-border/80 p-3.5 rounded-xl shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground">
              Good morning, Admin
            </span>
            <span
              className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              title="System Live"
            />
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Shift: 07:00 – 19:00 (Day Rotation)
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full text-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Today, Oct 24</span>
        </div>
      </div>

      {/* Caseload Saturation Alert Banner */}
      {!alertDismissed && (
        <div className="relative overflow-hidden bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200 p-3.5 rounded-xl shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900 dark:text-red-100">
                12 Doctors Near Capacity
              </span>
              <span className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-bold">
                Action Needed
              </span>
            </div>
            <p className="text-xs text-red-800/80 dark:text-red-300/80 mt-1">
              Load rebalancing recommended across Oncology and Critical Care wards.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenReassign("Dr. Aris Thorne")}
                className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Review Roster</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlertDismissed(true)}
                className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile KPI Grid (2x2) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* KPI 1 */}
        <div className="bg-card border border-border/80 p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Doctors
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground block">
              {metrics.totalDoctors}
            </span>
            <div className="flex items-center gap-1 mt-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+4 this month</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border/80 p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Active on Duty
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 flex items-center justify-center">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground block">136</span>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <span className="text-[10px]">91.9% active pool</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border/80 p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Patients
            </span>
            <div className="w-7 h-7 rounded-lg bg-muted text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground block">
              {metrics.totalPatients}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                {metrics.unassignedPatients || 24} unassigned
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border/80 p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Avg Caseload
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground block">
              {metrics.patientsPerDoctor || 25.1}
            </span>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <span className="text-[10px]">Max cap: 35.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physician Caseload Saturation Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">
              Caseload Saturation
            </h2>
            <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Top Load
            </span>
          </div>
          <Link
            href="/doctors"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-col space-y-2.5">
          {saturationList.map((doc) => (
            <div
              key={doc.id}
              className="bg-card border border-border/80 p-3.5 rounded-xl shadow-xs flex flex-col space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-border"
                    src={doc.avatar}
                    alt={doc.name}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {doc.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {doc.unit}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold ${doc.statusColor}`}>
                    {doc.current} / {doc.max}
                  </span>
                  <span className={`block text-[10px] font-medium ${doc.statusColor}`}>
                    {doc.percent}% ({doc.status})
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${doc.barColor}`}
                  style={{ width: `${doc.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-0.5">
                <span className="text-[11px] text-muted-foreground">
                  {doc.remainingText}
                </span>
                {doc.actionText ? (
                  <button
                    type="button"
                    onClick={() => handleOpenReassign(doc.name)}
                    className="text-primary text-xs font-semibold hover:underline active:scale-95"
                  >
                    {doc.actionText}
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                    {doc.badgeText}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Patient Reassignments Section */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">
              Recent Reassignments
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[11px] text-muted-foreground">Past 4 Hours</span>
        </div>

        <div className="space-y-2.5">
          {recentReassignments.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border/80 p-3.5 rounded-xl shadow-xs flex flex-col space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground truncate">
                    {item.patientName}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {item.patientCode}
                  </span>
                </div>
                <span className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {item.timeAgo}
                </span>
              </div>

              <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 min-w-0 text-xs">
                  <span className="text-muted-foreground truncate">
                    {item.sourceDoctor}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {item.targetDoctor}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.reason === "Capacity relief"
                      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                      : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                  }`}
                >
                  {item.reason}
                </span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  Staff ID: {item.staffId}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Quick Reassign CTA Button */}
      <div className="fixed bottom-20 right-4 z-30 flex justify-end">
        <Button
          type="button"
          onClick={() => handleOpenReassign("Dr. Aris Thorne")}
          className="gap-2 rounded-full shadow-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Quick Reassign</span>
        </Button>
      </div>

      {/* Reassign Modal */}
      <MobileQuickReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        initialDoctorName={selectedDoctorForModal}
        doctors={doctors}
        patients={patients}
      />
    </div>
  );
}
