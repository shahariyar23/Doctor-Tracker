import React from "react";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { RecentPatientItem } from "../types";
import { cn } from "@/lib/utils";

interface RecentPatientsTableProps {
  patients: RecentPatientItem[];
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  "Under Treatment": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Stable: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900",
  Recovering: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
};

export function RecentPatientsTable({
  patients,
  className,
}: RecentPatientsTableProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 sm:pb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground">
            Recent Patient Registrations
          </h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Latest admissions and assigned physicians
          </p>
        </div>
        <Link
          href="/patients"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Mobile Card List (under md) */}
      <div className="block md:hidden divide-y divide-border/60">
        {patients.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No recent patient registrations.
          </div>
        ) : (
          patients.slice(0, 5).map((patient) => (
            <div key={patient.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {patient.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {patient.assignedDoctor?.name || "Unassigned"} · {patient.registeredDate}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                  BADGE_STYLES[patient.condition] ||
                    "bg-slate-50 text-slate-700 border-slate-200"
                )}
              >
                {patient.condition}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Desktop / Tablet Table View (md and above) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Patient</th>
              <th className="py-2.5 px-3">Registered</th>
              <th className="py-2.5 px-3">Condition</th>
              <th className="py-2.5 px-3">Assigned Doctor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No recent patient registrations.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span>{patient.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {patient.registeredDate}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                        BADGE_STYLES[patient.condition] ||
                          "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {patient.condition}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {patient.assignedDoctor ? (
                      <Link
                        href={`/doctors`}
                        className="font-medium text-primary hover:underline"
                      >
                        {patient.assignedDoctor.name}
                      </Link>
                    ) : (
                      <span className="text-amber-600 font-medium">
                        Unassigned
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
