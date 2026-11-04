import { Suspense } from "react";

interface DoctorDetailPageProps {
  params: Promise<{
    doctorId: string;
  }>;
}

async function DoctorDetailContent({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;
  return <h1 className="text-xl font-semibold">Doctor Details: {doctorId}</h1>;
}

export default function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  return (
    <div className="p-6">
      <Suspense fallback={<div>Loading doctor details...</div>}>
        <DoctorDetailContent params={params} />
      </Suspense>
    </div>
  );
}
