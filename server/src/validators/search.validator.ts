import { z } from 'zod';

/**
 * Validation schema for GET /api/v1/search
 */
export const globalSearchQuerySchema = z.object({
  q: z
    .string({ message: 'Search query (q) is required' })
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query cannot exceed 100 characters'),
  limit: z
    .string()
    .optional()
    .default('5')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 5 : parsed;
    })
    .pipe(
      z
        .number()
        .int('Limit must be an integer')
        .positive('Limit must be a positive integer')
        .max(10, 'Limit cannot exceed 10'),
    ),
});

export type GlobalSearchQueryInput = z.infer<typeof globalSearchQuerySchema>;
