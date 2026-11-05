import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

/**
 * Universal Skeleton component for Doctor Tracker.
 * Provides subtle neutral gray tone (slate-200/90 in light, slate-700/60 in dark)
 * with consistent contrast across cards, table rows, avatars, text, and charts.
 * Respects prefers-reduced-motion for accessibility.
 */
export function Skeleton({
  className,
  shimmer = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-slate-200/90 dark:bg-slate-700/60 motion-reduce:animate-none",
        shimmer
          ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
          : "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/**
 * Reusable KPI Card Skeleton matching the exact layout and dimensions
 * of the application's metric cards (Dashboard, Doctors, Patients).
 */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-xs motion-reduce:animate-none",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 sm:pb-3">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
      </div>
      <div className="space-y-1.5 py-1">
        <Skeleton className="h-7 w-16 sm:h-8 sm:w-20 rounded-md" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    </div>
  );
}

/**
 * Reusable Table Row Skeleton with avatar, text lines, badges, and action buttons.
 */
export function TableRowSkeleton({
  columns = 7,
  hasAvatar = true,
}: {
  columns?: number;
  hasAvatar?: boolean;
}) {
  return (
    <tr className="border-b border-border/60 transition-colors">
      <td className="py-3.5 px-4">
        <Skeleton className="h-4 w-4 rounded" />
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          {hasAvatar && <Skeleton className="h-9 w-9 rounded-full shrink-0" />}
          <div className="space-y-1.5 min-w-0 flex-1">
            <Skeleton className="h-3.5 w-28 sm:w-36 rounded" />
            <Skeleton className="h-2.5 w-20 sm:w-24 rounded" />
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 hidden sm:table-cell">
        <Skeleton className="h-5 w-24 rounded-full" />
      </td>
      <td className="py-3.5 px-4 hidden md:table-cell">
        <Skeleton className="h-3.5 w-24 rounded" />
      </td>
      <td className="py-3.5 px-4 hidden lg:table-cell">
        <Skeleton className="h-3.5 w-28 rounded" />
      </td>
      <td className="py-3.5 px-4 hidden xl:table-cell">
        <Skeleton className="h-3 w-20 rounded" />
      </td>
      <td className="py-3.5 px-5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

/**
 * Reusable Mobile Card Skeleton for responsive stacked view.
 */
export function MobileCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </div>
  );
}

