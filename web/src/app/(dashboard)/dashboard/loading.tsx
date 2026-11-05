import React from "react";
import { Skeleton, KpiCardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 motion-reduce:animate-none">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-8 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-4 w-48 sm:w-96 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-32 sm:w-40 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg hidden sm:block" />
        </div>
      </div>

      {/* 4 KPI Statistic Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Analytics Charts Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Left Chart: Registration Trends (col-span-5) */}
        <div className="lg:col-span-5 rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-56 rounded mb-6" />
          </div>
          {/* Simulated chart area with subtle axis and bars */}
          <div className="h-56 sm:h-64 flex items-end gap-2 pt-4 px-2 border-b border-border/60">
            {[45, 65, 30, 80, 55, 90, 70, 40, 85, 60, 75, 95].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <Skeleton
                  className="w-full rounded-t"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3">
            <Skeleton className="h-2.5 w-16 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>

        {/* Middle Chart: Physician Workload (col-span-4) */}
        <div className="lg:col-span-4 rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48 rounded mb-6" />
          </div>
          {/* Simulated horizontal bars */}
          <div className="space-y-4 py-2">
            {[80, 60, 45, 30, 20].map((width, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                  <Skeleton
                    className="h-full rounded-full"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border/60 flex justify-between">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>

        {/* Right Chart: Condition Distribution (col-span-3) */}
        <div className="lg:col-span-3 rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <Skeleton className="h-4 w-36 rounded mb-1.5" />
            <Skeleton className="h-3 w-44 rounded mb-4" />
          </div>
          {/* Donut circle simulation */}
          <div className="flex items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              <Skeleton className="h-36 w-36 sm:h-40 sm:w-40 rounded-full" />
              <div className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card" />
            </div>
          </div>
          {/* Donut legend pills */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-3 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Patients Table Skeleton Card */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="divide-y divide-border/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28 sm:w-36 rounded" />
                  <Skeleton className="h-2.5 w-20 sm:w-24 rounded" />
                </div>
              </div>
              <div className="hidden sm:block">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="hidden md:block">
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
