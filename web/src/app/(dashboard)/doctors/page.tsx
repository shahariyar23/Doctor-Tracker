import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { createServerQueryClient } from "@/lib/server/query-client";
import { serverDoctorService } from "@/lib/server/data-services";
import { serverDashboardService } from "@/lib/server/data-services";
import { DoctorsView } from "@/features/doctors/components/doctors-view";
import { DASHBOARD_OVERVIEW_KEY } from "@/features/dashboard/hooks/use-dashboard";

export const metadata = {
  title: "Doctors — Doctor Tracker",
};

export const instant = false;

interface DoctorsPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    specialty?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  await connection();
  const queryClient = createServerQueryClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || undefined;
  const specialty = resolvedSearchParams.specialty || undefined;
  const startDate = resolvedSearchParams.startDate || undefined;
  const endDate = resolvedSearchParams.endDate || undefined;

  const initialFilter = {
    search,
    specialty,
    startDate,
    endDate,
    page,
    limit: 10,
  };

  // DoctorsView uses useDoctors(initialFilter) and useDashboardOverview() with default {}
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["doctors", initialFilter],
      queryFn: () => serverDoctorService.getDoctors(initialFilter),
    }),
    queryClient.prefetchQuery({
      queryKey: [...DASHBOARD_OVERVIEW_KEY, {}],
      queryFn: () => serverDashboardService.getOverview({}),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorsView />
    </HydrationBoundary>
  );
}
