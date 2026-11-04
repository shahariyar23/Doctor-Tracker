import { z } from "zod";

export const patientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Patient full name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  condition: z
    .string()
    .trim()
    .min(2, "Condition is required (e.g. Critical, Stable, Under Treatment)"),
  assignedDoctorId: z
    .string()
    .optional()
    .nullable(),
  age: z
    .number({ message: "Age is required" })
    .int("Age must be an integer")
    .min(0, "Age cannot be negative")
    .max(120, "Age cannot exceed 120 years"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    message: "Select a valid gender option",
  }),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
