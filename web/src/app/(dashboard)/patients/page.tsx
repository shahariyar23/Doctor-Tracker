import { Suspense } from "react";
import { PatientsView } from "@/features/patients/components/patients-view";

export const metadata = {
  title: "Patients — Doctor Tracker",
};

export const instant = false;

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <PatientsView />
    </Suspense>
  );
}
