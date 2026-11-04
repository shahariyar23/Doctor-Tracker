import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Strict rate limiter for Admin login attempts.
 * Maximum 5 failed attempts per 15 minutes per IP.
 * Successful logins do not count against the limit.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts allowed
  skipSuccessfulRequests: true, // Do not count 2xx responses
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message:
        "Too many failed login attempts. Please try again after 15 minutes.",
      errors: null,
    });
  },
});

