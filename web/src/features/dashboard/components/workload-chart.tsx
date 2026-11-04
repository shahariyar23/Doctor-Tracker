"use client";

import React from "react";
import { DoctorWorkloadItem } from "../types";
import { cn } from "@/lib/utils";

interface WorkloadChartProps {
  data: DoctorWorkloadItem[];
  className?: string;
}

export function WorkloadChart({ data, className }: WorkloadChartProps) {
  // Sort descending by patient count
  const sorted = [...data].sort((a, b) => b.patientCount - a.patientCount).slice(0, 5);
  const maxPatients = Math.max(...sorted.map((d) => d.patientCount), 30);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs",
        className
      )}
    >
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Patients per Doctor
          </h2>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Top Caseloads
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Workload distribution across active attending physicians
        </p>
      </div>

      <div className="space-y-4 py-2">
        {sorted.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            No doctor caseload data recorded yet.
          </div>
        ) : (
          sorted.map((doctor) => {
            const percentage = Math.min(
              Math.round((doctor.patientCount / maxPatients) * 100),
              100
            );

            return (
              <div key={doctor.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {doctor.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      • {doctor.specialty}
                    </span>
                  </div>
                  <span className="font-semibold text-primary">
                    {doctor.patientCount} patients
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      percentage > 85 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

