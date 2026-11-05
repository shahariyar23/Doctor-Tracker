import { z } from 'zod';
import {
  dateStringSchema,
  parseDateFrom,
  parseDateTo,
  parseExclusiveDateTo,
} from './common.validator.js';

/**
 * Zod schema for creating a new Doctor record.
 * Validates all required fields per the Doctor Mongoose model:
 * name, specialization, hospital, phone, email.
 */
export const createDoctorBodySchema = z.object({
  name: z
    .string({ message: 'Doctor name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  specialization: z
    .string({ message: 'Specialization is required' })
    .trim()
    .min(2, 'Specialization must be at least 2 characters'),
  hospital: z
    .string({ message: 'Hospital name is required' })
    .trim()
    .min(2, 'Hospital must be at least 2 characters'),
  phone: z
    .string({ message: 'Phone number is required' })
    .trim()
    .min(5, 'Phone number must be at least 5 characters'),
  email: z
    .string({ message: 'Doctor email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

export type CreateDoctorInput = z.infer<typeof createDoctorBodySchema>;

/**
 * Zod schema for updating an existing Doctor record.
 * Supports partial updates while rejecting completely empty payloads.
 */
export const updateDoctorBodySchema = createDoctorBodySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Update payload cannot be empty. At least one field must be provided.',
  );

export type UpdateDoctorInput = z.infer<typeof updateDoctorBodySchema>;

/**
 * Zod schema for Doctor list query parameters:
 * page, limit, search, from, to
 */
export const doctorQuerySchema = z
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

export type DoctorQueryInput = z.infer<typeof doctorQuerySchema>;
