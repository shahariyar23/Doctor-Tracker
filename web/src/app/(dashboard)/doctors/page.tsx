import { Suspense } from "react";
import { DoctorsView } from "@/features/doctors/components/doctors-view";

export const metadata = {
  title: "Doctors — Doctor Tracker",
};

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <DoctorsView />
    </Suspense>
  );
}
