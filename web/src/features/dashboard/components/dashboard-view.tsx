"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Users,
  UserCheck,
  AlertTriangle,
  UserPlus,
  PlusCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { RegistrationTrendsChart } from "./registration-trends-chart";
import { WorkloadChart } from "./workload-chart";
import { ConditionDonutChart } from "./condition-donut-chart";
import { RecentPatientsTable } from "./recent-patients-table";
import { useDashboardData } from "../hooks/use-dashboard";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { data, isLoading, isError, error, refetch } = useDashboardData(period);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-16 w-full max-w-md rounded-xl bg-muted/60" />

        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 sm:h-28 rounded-xl border border-border/60 bg-muted/50 p-4"
            />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 h-72 sm:h-80 rounded-xl border border-border/60 bg-muted/50" />
          <div className="lg:col-span-4 h-72 sm:h-80 rounded-xl border border-border/60 bg-muted/50" />
          <div className="lg:col-span-3 h-72 sm:h-80 rounded-xl border border-border/60 bg-muted/50" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 sm:p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          Failed to load dashboard data
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-md">
          {error instanceof Error
            ? error.message
            : "Could not establish connection to the backend analytics service. Please verify the API server is active."}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => refetch()}
          className="mt-4 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalDoctors: 0,
    totalPatients: 0,
    patientsPerDoctor: 0,
    assignedPatients: 0,
    unassignedPatients: 0,
  };

  const calculatedAvg =
    metrics.patientsPerDoctor ||
    (metrics.totalDoctors > 0
      ? Number((metrics.totalPatients / metrics.totalDoctors).toFixed(1))
      : 0);

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Responsive Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Clinical Dashboard
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {currentDateFormatted}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Healthcare System Metrics
          </h1>
          <p className="text-xs text-muted-foreground">
            Aggregate insights across hospital physicians and patient records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          <Link
            href="/patients"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 flex-1 sm:flex-initial justify-center text-xs h-8 sm:h-9"
            )}
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Patients</span>
          </Link>
          <Link
            href="/doctors/new"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 flex-1 sm:flex-initial justify-center text-xs h-8 sm:h-9"
            )}
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>Add Doctor</span>
          </Link>
          <Link
            href="/patients/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 flex-1 sm:flex-initial justify-center text-xs h-8 sm:h-9"
            )}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Patient</span>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Cards (PDF §3: Total Doctors, Total Patients, Patients per Doctor, Date-based Statistics) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total Doctors"
          value={metrics.totalDoctors}
          subtitle="Registered physicians"
          icon={Stethoscope}
        />
        <KpiCard
          title="Total Patients"
          value={metrics.totalPatients}
          subtitle="Registered patient records"
          icon={Users}
        />
        <KpiCard
          title="Patients / Doctor"
          value={calculatedAvg}
          subtitle="Average distribution"
          icon={UserCheck}
          variant="success"
        />
        <KpiCard
          title="Assigned Patients"
          value={metrics.assignedPatients || 0}
          subtitle="Under doctor care"
          icon={AlertTriangle}
          variant="default"
        />
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Trend Area Chart (5 cols on lg) */}
        <RegistrationTrendsChart
          data={data?.trends || []}
          period={period}
          onPeriodChange={setPeriod}
          className="lg:col-span-5"
        />

        {/* Workload Horizontal Bar Chart (4 cols on lg) */}
        <WorkloadChart
          data={data?.workload || []}
          className="lg:col-span-4"
        />

        {/* Condition Donut Chart (3 cols on lg) */}
        <ConditionDonutChart
          data={data?.conditions || []}
          className="lg:col-span-3"
        />
      </div>

      {/* Recent Activity Table */}
      <RecentPatientsTable patients={data?.recentPatients || []} />
    </div>
  );
}
