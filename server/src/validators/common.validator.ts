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
 * Helper to escape user input string for safe usage in RegExp
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Common date string validator.
 * Accepts ISO date strings or calendar strings (e.g. YYYY-MM-DD or full ISO 8601),
 * validates that Date.parse succeeds, and rejects malformed dates.
 */
export const dateStringSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const timestamp = Date.parse(val);
      return !isNaN(timestamp);
    },
    { message: "Invalid date format. Expected a valid ISO date string." },
  );

/**
 * Transforms a valid date string to the start of that calendar day in UTC (00:00:00.000)
 * or parsed exact Date if full ISO with time was supplied.
 */
export function parseDateFrom(val: string): Date {
  const d = new Date(val);
  // If calendar date format without time (e.g., YYYY-MM-DD), set to start of day UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return new Date(`${val.trim()}T00:00:00.000Z`);
  }
  return d;
}

/**
 * Transforms a valid date string to the end of that calendar day in UTC (23:59:59.999)
 * or parsed exact Date if full ISO with time was supplied.
 */
export function parseDateTo(val: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return new Date(`${val.trim()}T23:59:59.999Z`);
  }
  const d = new Date(val);
  return d;
}

/**
 * Common pagination and date range query parameters schema
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val !== undefined && val !== "" ? parseInt(val, 10) : 1))
    .refine(
      (val) => !isNaN(val) && val >= 1,
      "Page must be a positive integer",
    ),
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined && val !== "" ? parseInt(val, 10) : 10))
    .refine(
      (val) => !isNaN(val) && val >= 1 && val <= 100,
      "Limit must be between 1 and 100",
    ),
  search: z.string().trim().max(100, "Search term cannot exceed 100 characters").optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
