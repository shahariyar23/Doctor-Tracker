import { z } from "zod";

export const patientSchema = z.object({
  name: z
    .string()
    .min(2, "Patient full name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string()
    .min(6, "Valid contact phone number is required")
    .regex(/^[0-9+()\-.\s]{6,25}$/, "Invalid phone number format"),
  condition: z.enum(["Critical", "Under Treatment", "Stable", "Recovering"]),
  status: z.enum(["Active", "Inactive", "Archived"]),
  assignedDoctorId: z.string().optional().nullable(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
