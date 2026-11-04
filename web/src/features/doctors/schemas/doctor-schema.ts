import { z } from "zod";

export const doctorSchema = z.object({
  name: z
    .string()
    .min(2, "Doctor name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  specialization: z
    .string()
    .min(2, "Specialization is required (e.g., Cardiology, Neurology)"),
  hospital: z
    .string()
    .min(2, "Hospital name is required"),
  phone: z
    .string()
    .min(6, "Valid phone number is required")
    .regex(/^[0-9+()\-.\s]{6,25}$/, "Invalid phone number format"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please provide a valid email address"),
});

export type DoctorFormData = z.infer<typeof doctorSchema>;

