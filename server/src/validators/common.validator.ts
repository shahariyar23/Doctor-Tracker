import { z } from "zod";

/**
 * Reusable Mongo ObjectId validation helper
 */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ID format: must be a 24-character hex string",
  );

/**
 * Common schema for routes taking an :id param
 */
export const idParamSchema = z.object({
  id: objectIdSchema,
});

export type IdParamInput = z.infer<typeof idParamSchema>;

/**
 * Common pagination and date range query parameters schema
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine(
      (val) => !isNaN(val) && val >= 1,
      "Page must be a positive integer",
    ),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine(
      (val) => !isNaN(val) && val >= 1 && val <= 100,
      "Limit must be between 1 and 100",
    ),
  search: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
