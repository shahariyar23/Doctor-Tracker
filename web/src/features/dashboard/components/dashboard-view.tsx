"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Users,
  UserCheck,
  UserPlus,
  PlusCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import DashboardLoading from "@/app/(dashboard)/dashboard/loading";
import { RegistrationTrendsChart } from "./registration-trends-chart";
import { WorkloadChart } from "./workload-chart";
import { ConditionDonutChart } from "./condition-donut-chart";
import { RecentPatientsTable } from "./recent-patients-table";
import {
  useDashboardOverview,
  usePatientTrends,
  usePatientsByDoctor,
  useConditionDistribution,
} from "../hooks/use-dashboard";
import { usePatients } from "@/features/patients/hooks/use-patients";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Calculate start/end date for trends & overview based on period
  const getDateRangeForPeriod = (p: "7d" | "30d" | "90d") => {
    const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
    const now = new Date();
    const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
    const toDate = now;

    const format = (d: Date) =>
      `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d
        .getUTCDate()
        .toString()
        .padStart(2, "0")}`;

    return {
      from: format(fromDate),
      to: format(toDate),
    };
  };

  const dateRange = getDateRangeForPeriod(period);

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview(dateRange);

  const {
    data: trendsData,
    isLoading: isTrendsLoading,
  } = usePatientTrends(dateRange);

  const {
    data: workloadData,
    isLoading: isWorkloadLoading,
  } = usePatientsByDoctor();

  const {
    data: conditionsData,
    isLoading: isConditionsLoading,
  } = useConditionDistribution();

  const {
    data: recentPatientsData,
  } = usePatients({ page: 1, limit: 5 });

  const isLoading = isOverviewLoading || isTrendsLoading || isWorkloadLoading || isConditionsLoading;

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isOverviewError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 sm:p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          Failed to load live dashboard statistics
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-md">
          {overviewError instanceof Error
            ? overviewError.message
            : "Could not establish connection to the backend analytics service. Please verify the API server is active."}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => refetchOverview()}
          className="mt-4 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  // Format trend data for Recharts [{ date: "YYYY-MM-DD", count: N }]
  const formattedTrends = (trendsData?.labels || []).map((label, idx) => ({
    date: label,
    count: trendsData?.datasets?.[0]?.data?.[idx] || 0,
  }));

  // Format workload data for WorkloadChart
  const formattedWorkload = (workloadData || []).map((doc) => ({
    id: doc.doctorId,
    name: doc.doctorName,
    specialty: doc.specialization,
    patientCount: doc.patientCount,
  }));

  // Format condition distribution
  const formattedConditions = (conditionsData || []).map((c) => ({
    condition: c.condition,
    count: c.count,
    percentage: overview?.totalPatients ? Math.round((c.count / overview.totalPatients) * 100) : 0,
  }));

  // Format recent patients
  const recentPatients = (recentPatientsData?.patients || []).map((p) => ({
    id: p.id,
    name: p.name,
    registeredDate: p.createdAt
      ? new Date(p.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent",
    condition: p.condition,
    assignedDoctor: p.assignedDoctor
      ? {
          id: p.assignedDoctor.id,
          name: p.assignedDoctor.name,
          specialty: p.assignedDoctor.specialization,
        }
      : null,
  }));

  const totalDoctors = overview?.totalDoctors || 0;
  const totalPatients = overview?.totalPatients || 0;
  const calculatedAvg =
    totalDoctors > 0 ? Number((totalPatients / totalDoctors).toFixed(1)) : 0;

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              Live Healthcare Metrics
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {currentDateFormatted}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Healthcare System Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time aggregate analytics across hospital physicians and patient allocations.
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

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total Doctors"
          value={totalDoctors}
          subtitle="All-time physicians"
          icon={Stethoscope}
        />
        <KpiCard
          title="Total Patients"
          value={totalPatients}
          subtitle="All-time registrations"
          icon={Users}
        />
        <KpiCard
          title="Patients / Doctor"
          value={calculatedAvg}
          subtitle="Average caseload"
          icon={UserCheck}
          variant="success"
        />
        <KpiCard
          title={`New Patients (${period})`}
          value={overview?.newPatients ?? 0}
          subtitle={`${overview?.newDoctors ?? 0} new doctors in period`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Backend-Generated Factual Insights Banner */}
      {overview?.insights && overview.insights.length > 0 && (
        <div className="p-4 rounded-xl border border-teal-200/70 bg-gradient-to-r from-teal-50/60 to-emerald-50/40 text-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-teal-900">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>Data-Driven Healthcare Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
            {overview.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-teal-600 font-bold">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Trend Area Chart (5 cols on lg) */}
        <RegistrationTrendsChart
          data={formattedTrends}
          period={period}
          onPeriodChange={setPeriod}
          className="lg:col-span-5"
        />

        {/* Workload Horizontal Bar Chart (4 cols on lg) */}
        <WorkloadChart
          data={formattedWorkload}
          className="lg:col-span-4"
        />

        {/* Condition Donut Chart (3 cols on lg) */}
        <ConditionDonutChart
          data={formattedConditions}
          className="lg:col-span-3"
        />
      </div>

      {/* Recent Activity Table */}
      <RecentPatientsTable patients={recentPatients} />
    </div>
  );
}
