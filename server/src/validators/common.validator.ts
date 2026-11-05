import { z } from 'zod';

/**
 * Strict calendar date regex YYYY-MM-DD
 */
const CALENDAR_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validates whether YYYY-MM-DD is an actual real calendar date (e.g. leap years, 30 vs 31 days).
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!CALENDAR_DATE_REGEX.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const day = parseInt(dayStr!, 10);

  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Strict ISO calendar date string schema (YYYY-MM-DD)
 */
export const calendarDateSchema = z
  .string()
  .trim()
  .refine((val) => isValidCalendarDate(val), {
    message: 'Invalid calendar date. Expected a valid YYYY-MM-DD calendar date.',
  });

/**
 * Reusable Mongo ObjectId validation helper
 */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format: must be a 24-character hex string');

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
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
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
    { message: 'Invalid date format. Expected a valid ISO date string.' },
  );

/**
 * Application default timezone offset: Asia/Dhaka is UTC+6 (+06:00, no daylight savings).
 */
export const APP_TIMEZONE_OFFSET = '+06:00';

/**
 * Transforms a valid date string to the start of that calendar day in local application timezone (+06:00 Asia/Dhaka)
 * or specified timezone offset, returning a UTC Date instance for MongoDB comparison.
 */
export function parseDateFrom(val: string, offset: string = APP_TIMEZONE_OFFSET): Date {
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const tz = offset === 'UTC' || offset === 'Z' ? 'Z' : offset;
    return new Date(`${trimmed}T00:00:00.000${tz}`);
  }
  return new Date(trimmed);
}

/**
 * Transforms a valid date string to the start of the following calendar day in local application timezone (+06:00 Asia/Dhaka)
 * or specified timezone offset.
 * Used with MongoDB's `$lt` operator to provide an exclusive upper boundary that cleanly covers the entire selected end day
 * without any millisecond precision loss.
 */
export function parseExclusiveDateTo(val: string, offset: string = APP_TIMEZONE_OFFSET): Date {
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yearStr, monthStr, dayStr] = trimmed.split('-');
    const year = parseInt(yearStr!, 10);
    const month = parseInt(monthStr!, 10);
    const day = parseInt(dayStr!, 10);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
    const nextYear = nextDate.getUTCFullYear();
    const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');
    const tz = offset === 'UTC' || offset === 'Z' ? 'Z' : offset;
    return new Date(`${nextYear}-${nextMonth}-${nextDay}T00:00:00.000${tz}`);
  }
  const parsed = new Date(trimmed);
  return new Date(parsed.getTime() + 1);
}

/**
 * Transforms a valid date string to the end of that calendar day in local timezone or UTC (23:59:59.999)
 * or parsed exact Date if full ISO with time was supplied.
 */
export function parseDateTo(val: string, offset: string = APP_TIMEZONE_OFFSET): Date {
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const tz = offset === 'UTC' || offset === 'Z' ? 'Z' : offset;
    return new Date(`${trimmed}T23:59:59.999${tz}`);
  }
  return new Date(trimmed);
}

/**
 * Common pagination and date range query parameters schema
 */
export const paginationQuerySchema = z
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
  });

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
