import { z } from "zod";

export const patientSchema = z.object({
  name: z
    .string()
    .min(2, "Patient name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  condition: z
    .string()
    .min(1, "Condition is required for medical record tracking"),
  assignedDoctorId: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+()\-.\s]{6,25}$/.test(val),
      "Invalid phone number format"
    ),
});

export type PatientFormData = z.infer<typeof patientSchema>;
