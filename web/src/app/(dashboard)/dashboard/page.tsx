import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { createServerQueryClient } from "@/lib/server/query-client";
import {
  serverDashboardService,
  serverPatientService,
} from "@/lib/server/data-services";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import {
  DASHBOARD_OVERVIEW_KEY,
  DASHBOARD_TRENDS_KEY,
  DASHBOARD_BY_DOCTOR_KEY,
  DASHBOARD_CONDITIONS_KEY,
} from "@/features/dashboard/hooks/use-dashboard";

export const metadata = {
  title: "Dashboard — Doctor Tracker",
};

export const instant = false;

// Default date range is 30 days, matching the initial state in DashboardView
function getDefaultDateRange() {
  const days = 30;
  const now = new Date();
  const fromDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days)
  );
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
}

export default async function DashboardPage() {
  await connection();
  const queryClient = createServerQueryClient();
  const defaultRange = getDefaultDateRange();

  // Prefetch all initial dashboard resources in parallel on the server
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: [...DASHBOARD_OVERVIEW_KEY, defaultRange],
      queryFn: () => serverDashboardService.getOverview(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: [...DASHBOARD_TRENDS_KEY, defaultRange],
      queryFn: () => serverDashboardService.getPatientTrends(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_BY_DOCTOR_KEY,
      queryFn: () => serverDashboardService.getPatientsByDoctor(),
    }),
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_CONDITIONS_KEY,
      queryFn: () => serverDashboardService.getConditionsDistribution(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["patients", { page: 1, limit: 5 }],
      queryFn: () => serverPatientService.getPatients({ page: 1, limit: 5 }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
}
