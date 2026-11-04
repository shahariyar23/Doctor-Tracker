import { z } from 'zod';

/**
 * Zod validation schema for admin login request body.
 * Enforces email normalization and 72-byte UTF-8 limit for bcrypt compatibility.
 */
export const loginBodySchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address' }),
  password: z
    .string({ message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, {
      message: 'Password cannot exceed 72 bytes',
    }),
});

export type LoginInput = z.infer<typeof loginBodySchema>;
