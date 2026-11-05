import { RegisterPatientView } from "@/features/patients/components/register-patient-view";

export const metadata = {
  title: "Register New Patient — Doctor Tracker",
};

export const instant = false;

export default function NewPatientPage() {
  return <RegisterPatientView />;
}

