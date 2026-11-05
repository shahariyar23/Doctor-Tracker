import React from "react";
import { Skeleton, KpiCardSkeleton, TableRowSkeleton, MobileCardSkeleton } from "@/components/ui/skeleton";

export default function DoctorsLoading() {
  return (
    <div className="space-y-6 motion-reduce:animate-none">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-8 w-56 sm:w-72 rounded-lg" />
          <Skeleton className="h-4 w-44 sm:w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 sm:w-40 rounded-lg shrink-0" />
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-border/80 bg-card shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 sm:w-36 rounded-lg" />
            <Skeleton className="h-9 w-32 sm:w-36 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Desktop Table View Skeleton (md and up) */}
      <div className="hidden md:block rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-border/80 text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th className="py-3 px-4">PHYSICIAN</th>
                <th className="py-3 px-4 hidden sm:table-cell">SPECIALIZATION</th>
                <th className="py-3 px-4 hidden md:table-cell">CONTACT</th>
                <th className="py-3 px-4 hidden lg:table-cell">HOSPITAL</th>
                <th className="py-3 px-4 hidden xl:table-cell">PATIENTS</th>
                <th className="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar Skeleton */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-border/60">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Mobile Card Stack Skeleton (< md) */}
      <div className="block md:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
