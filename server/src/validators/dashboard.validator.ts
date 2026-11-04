import { z } from "zod";
import { calendarDateSchema, parseDateFrom, parseDateTo } from "./common.validator.js";

/**
 * Base dashboard date range schema.
 * Rejects invalid calendar dates and ensures from <= to.
 */
export const dashboardDateRangeSchema = z
  .object({
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const fromDate = parseDateFrom(data.from);
        const toDate = parseDateTo(data.to);
        return fromDate <= toDate;
      }
      return true;
    },
    {
      message: "'from' date cannot be later than 'to' date",
      path: ["from"],
    },
  );

export type DashboardDateRangeInput = z.infer<typeof dashboardDateRangeSchema>;

/**
 * Patient trends query schema with interval parameter
 */
export const patientTrendsQuerySchema = z
  .object({
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
    interval: z.enum(["day", "month"]).optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const fromDate = parseDateFrom(data.from);
        const toDate = parseDateTo(data.to);
        return fromDate <= toDate;
      }
      return true;
    },
    {
      message: "'from' date cannot be later than 'to' date",
      path: ["from"],
    },
  );

export type PatientTrendsQueryInput = z.infer<typeof patientTrendsQuerySchema>;

