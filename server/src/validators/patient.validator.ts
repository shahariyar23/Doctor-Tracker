import { z } from 'zod';
import {
  objectIdSchema,
  dateStringSchema,
  parseDateFrom,
  parseDateTo,
  parseExclusiveDateTo,
} from './common.validator.js';
import { PATIENT_GENDERS } from '../models/patient.model.js';

/**
 * Zod enum validator for Patient Gender.
 * Normalizes input using trim and lowercase before enum validation.
 */
export const patientGenderEnum = z.preprocess(
  (val: unknown) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(PATIENT_GENDERS, {
    message: "Gender must be 'male', 'female', 'other', or 'prefer_not_to_say'",
  }),
);

/**
 * Zod schema for creating a new Patient record.
 * Enforces required integer age (0–120), normalized gender, and mandatory doctor reference.
 */
export const createPatientBodySchema = z.object({
  name: z
    .string({ message: 'Patient full name is required' })
    .trim()
    .min(2, 'Patient full name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  condition: z
    .string({ message: 'Patient condition is required' })
    .trim()
    .min(2, 'Patient condition is required'),
  assignedDoctorId: objectIdSchema.optional().nullable(),
  age: z
    .number({ message: 'Patient age is required and must be a number' })
    .int('Age must be an integer')
    .min(0, 'Age cannot be negative')
    .max(120, 'Age cannot exceed 120 years'),
  gender: patientGenderEnum,
  phone: z
    .string()
    .trim()
    .min(5, 'Phone number must be at least 5 characters')
    .optional()
    .nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientBodySchema>;

/**
 * Zod schema for updating a Patient record.
 * Supports partial updates while rejecting completely empty payloads.
 */
export const updatePatientBodySchema = createPatientBodySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Update payload cannot be empty. At least one field must be provided.',
  );

export type UpdatePatientInput = z.infer<typeof updatePatientBodySchema>;

/**
 * Zod schema for Patient list query parameters:
 * page, limit, search, condition, from, to
 */
export const patientQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val !== undefined && val !== '' ? parseInt(val, 10) : 1))
      .refine((val) => !isNaN(val) && val >= 1, 'Page must be a positive integer'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val !== undefined && val !== '' ? parseInt(val, 10) : 10))
      .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
    search: z.string().trim().max(100, 'Search term cannot exceed 100 characters').optional(),
    condition: z
      .string()
      .trim()
      .max(100, 'Condition filter cannot exceed 100 characters')
      .optional(),
    doctorId: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || val === 'unassigned' || /^[0-9a-fA-F]{24}$/.test(val),
        "doctorId must be a valid 24-character hexadecimal ObjectId or 'unassigned'",
      ),
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .transform((data) => {
    const from = data.from || data.startDate;
    const to = data.to || data.endDate;
    return {
      ...data,
      from,
      to,
    };
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const fromDate = parseDateFrom(data.from);
        const toDate = parseExclusiveDateTo(data.to);
        return fromDate < toDate;
      }
      return true;
    },
    {
      message: "'from' date cannot be later than 'to' date",
      path: ['from'],
    },
  );

export type PatientQueryInput = z.infer<typeof patientQuerySchema>;
