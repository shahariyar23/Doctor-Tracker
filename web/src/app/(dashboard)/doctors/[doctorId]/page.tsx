import { notFound } from "next/navigation";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createServerQueryClient } from "@/lib/server/query-client";
import { serverDoctorService, serverPatientService } from "@/lib/server/data-services";
import { DoctorDetailView } from "@/features/doctors/components/doctor-detail-view";

interface DoctorDetailPageProps {
  params: Promise<{
    doctorId: string;
  }>;
}

export const metadata = {
  title: "Doctor Profile — Doctor Tracker",
};

export const instant = false;

// 24-character hexadecimal MongoDB ObjectId validator
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export default async function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const { doctorId } = await params;

  // Validate parameter format before calling backend
  if (!doctorId || !OBJECT_ID_REGEX.test(doctorId)) {
    notFound();
  }

  await connection();
  const queryClient = createServerQueryClient();

  // Prefetch doctor details and associated patients
  try {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ["doctor", doctorId],
        queryFn: () => serverDoctorService.getDoctorById(doctorId),
      }),
      queryClient.prefetchQuery({
        queryKey: ["doctor-patients", doctorId],
        queryFn: async () => {
          const res = await serverPatientService.getPatients({
            doctorId,
            limit: 100,
          });
          return res.patients.map((p) => ({
            id: p.id,
            name: p.name,
            condition: p.condition,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            assignedDate: p.createdAt,
          }));
        },
      }),
    ]);
  } catch {
    // If not found, will be handled gracefully
  }

  // Check if doctor query succeeded or 404
  const doctorData = queryClient.getQueryData(["doctor", doctorId]);
  if (!doctorData) {
    // In case the doctor was deleted or does not exist
    // Let the component or not-found render
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorDetailView doctorId={doctorId} />
    </HydrationBoundary>
  );
}
