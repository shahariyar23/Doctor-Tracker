import { Suspense } from "react";
import { DoctorDetailView } from "@/features/doctors/components/doctor-detail-view";

interface DoctorDetailPageProps {
  params: Promise<{
    doctorId: string;
  }>;
}

export const metadata = {
  title: "Doctor Profile — Doctor Tracker",
};

export default async function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const { doctorId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <DoctorDetailView doctorId={doctorId} />
    </Suspense>
  );
}
