import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { createServerQueryClient } from "@/lib/server/query-client";
import { serverPatientService, serverDoctorService } from "@/lib/server/data-services";
import { PatientsView } from "@/features/patients/components/patients-view";

export const metadata = {
  title: "Patients — Doctor Tracker",
};

export const instant = false;

interface PatientsPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    condition?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  await connection();
  const queryClient = createServerQueryClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || undefined;
  const condition = resolvedSearchParams.condition || undefined;
  const startDate = resolvedSearchParams.startDate || undefined;
  const endDate = resolvedSearchParams.endDate || undefined;

  const initialPatientFilter = {
    search,
    condition,
    startDate,
    endDate,
    page,
    limit: 10,
  };

  const initialDoctorsFilter = { limit: 100 };

  // Prefetch initial patients list, doctors dropdown list, and global patient stats in parallel
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["patients", initialPatientFilter],
      queryFn: () => serverPatientService.getPatients(initialPatientFilter),
    }),
    queryClient.prefetchQuery({
      queryKey: ["patients", "stats"],
      queryFn: () => serverPatientService.getPatientStats(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["doctors", initialDoctorsFilter],
      queryFn: () => serverDoctorService.getDoctors(initialDoctorsFilter),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PatientsView />
    </HydrationBoundary>
  );
}
