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
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border/60 bg-muted/50 p-5"
            />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 h-80 rounded-xl border border-border/60 bg-muted/50" />
          <div className="lg:col-span-4 h-80 rounded-xl border border-border/60 bg-muted/50" />
          <div className="lg:col-span-3 h-80 rounded-xl border border-border/60 bg-muted/50" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center">
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
    assignedPatients: 0,
    unassignedPatients: 0,
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Clinical Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Healthcare System Metrics
          </h2>
          <p className="text-xs text-muted-foreground">
            Aggregate insights across hospital physicians and patient records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/patients"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>View All Patients</span>
          </Link>
          <Link
            href="/doctors?action=add"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <UserPlus className="h-4 w-4 text-primary" />
            <span>Add Doctor</span>
          </Link>
          <Link
            href="/patients?action=register"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Patient</span>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Doctors"
          value={metrics.totalDoctors}
          subtitle="Registered physicians"
          icon={Stethoscope}
          trend={
            metrics.doctorGrowthRate !== undefined
              ? {
                  value: metrics.doctorGrowthRate,
                  label: "this month",
                  positive: metrics.doctorGrowthRate >= 0,
                }
              : undefined
          }
        />
        <KpiCard
          title="Total Patients"
          value={metrics.totalPatients}
          subtitle="Medical records"
          icon={Users}
          trend={
            metrics.patientGrowthRate !== undefined
              ? {
                  value: metrics.patientGrowthRate,
                  label: "this month",
                  positive: metrics.patientGrowthRate >= 0,
                }
              : undefined
          }
        />
        <KpiCard
          title="Assigned Patients"
          value={metrics.assignedPatients}
          subtitle="Under active care"
          icon={UserCheck}
          variant="success"
        />
        <KpiCard
          title="Unassigned Patients"
          value={metrics.unassignedPatients}
          subtitle="Needs attending doctor"
          icon={AlertTriangle}
          variant={metrics.unassignedPatients > 0 ? "warning" : "default"}
        />
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Trend Area Chart (5 cols) */}
        <RegistrationTrendsChart
          data={data?.trends || []}
          period={period}
          onPeriodChange={setPeriod}
          className="lg:col-span-5"
        />

        {/* Workload Horizontal Bar Chart (4 cols) */}
        <WorkloadChart
          data={data?.workload || []}
          className="lg:col-span-4"
        />

        {/* Condition Donut Chart (3 cols) */}
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

