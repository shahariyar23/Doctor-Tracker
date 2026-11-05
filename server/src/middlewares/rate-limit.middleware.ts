import rateLimit, {
  ipKeyGenerator,
  type Store,
  type Options,
  type ClientRateLimitInfo,
  type IncrementResponse,
} from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { RateLimit } from '../models/rate-limit.model.js';

/**
 * MongoDB-backed Store implementation for express-rate-limit.
 * Shares rate limiting state across all distributed backend instances via the
 * MongoDB collection, with automatic TTL cleanup and in-memory fallback.
 */
export class MongoRateLimitStore implements Store {
  public prefix: string;
  public windowMs: number = 15 * 60 * 1000;
  private memoryFallback = new Map<string, { totalHits: number; resetTime: Date }>();

  constructor(prefix: string = 'rl') {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = this.getFullKey(key);
    const now = new Date();
    const newResetTime = new Date(now.getTime() + this.windowMs);

    if (this.isDbConnected()) {
      try {
        // Increment totalHits atomically if record is within the current active window
        const activeRecord = await RateLimit.findOneAndUpdate(
          { key: fullKey, resetTime: { $gt: now } },
          { $inc: { totalHits: 1 } },
          { returnDocument: 'after' },
        );

        if (activeRecord) {
          return {
            totalHits: activeRecord.totalHits,
            resetTime: activeRecord.resetTime,
          };
        }

        // Previous window has expired or record does not exist: upsert with new window
        const freshRecord = await RateLimit.findOneAndUpdate(
          { key: fullKey },
          { $set: { totalHits: 1, resetTime: newResetTime } },
          { upsert: true, returnDocument: 'after' },
        );

        return {
          totalHits: freshRecord.totalHits,
          resetTime: freshRecord.resetTime,
        };
      } catch {
        // Fallback to in-memory store if DB query encounters transient error
      }
    }

    // In-memory fallback
    const mem = this.memoryFallback.get(fullKey);
    if (mem && mem.resetTime > now) {
      mem.totalHits += 1;
      return { totalHits: mem.totalHits, resetTime: mem.resetTime };
    }
    const fresh = { totalHits: 1, resetTime: newResetTime };
    this.memoryFallback.set(fullKey, fresh);
    return fresh;
  }

  async decrement(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    if (this.isDbConnected()) {
      try {
        await RateLimit.updateOne(
          { key: fullKey, totalHits: { $gt: 0 } },
          { $inc: { totalHits: -1 } },
        );
        return;
      } catch {
        // Fallback
      }
    }

    const mem = this.memoryFallback.get(fullKey);
    if (mem && mem.totalHits > 0) {
      mem.totalHits -= 1;
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    if (this.isDbConnected()) {
      try {
        await RateLimit.deleteOne({ key: fullKey });
      } catch {
        // Fallback
      }
    }
    this.memoryFallback.delete(fullKey);
  }

  async resetAll(): Promise<void> {
    if (this.isDbConnected()) {
      try {
        await RateLimit.deleteMany({ key: { $regex: new RegExp(`^${this.prefix}:`) } });
      } catch {
        // Fallback
      }
    }
    this.memoryFallback.clear();
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const fullKey = this.getFullKey(key);
    const now = new Date();
    if (this.isDbConnected()) {
      try {
        const doc = await RateLimit.findOne({ key: fullKey, resetTime: { $gt: now } });
        if (doc) {
          return {
            totalHits: doc.totalHits,
            resetTime: doc.resetTime,
          };
        }
      } catch {
        // Fallback
      }
    }

    const mem = this.memoryFallback.get(fullKey);
    if (mem && mem.resetTime > now) {
      return {
        totalHits: mem.totalHits,
        resetTime: mem.resetTime,
      };
    }
    return undefined;
  }
}

// Distinct shared stores for IP and Account limiters (express-rate-limit requirement)
export const ipRateLimitStore = new MongoRateLimitStore('ip');
export const accountRateLimitStore = new MongoRateLimitStore('account');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes cooldown window
const MAX_FAILED_ATTEMPTS = 5; // 5 failed authentication attempts allowed

const send429Response = (res: Response, windowMs: number): void => {
  const retryAfter = res.getHeader('Retry-After') || Math.ceil(windowMs / 1000);
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({
    success: false,
    message: 'Too many failed login attempts. Please try again after 15 minutes.',
    errors: null,
  });
};

/**
 * 1. IP-based rate limiter
 * Allows max 5 failed attempts (HTTP 401) per 15 minutes per IP address.
 */
export const loginIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_FAILED_ATTEMPTS,
  store: ipRateLimitStore,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req: Request, res: Response) => res.statusCode !== 401,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response, _next: NextFunction, options) => {
    send429Response(res, options.windowMs);
  },
});

/**
 * 2. Account-based protection limiter
 * Protects against distributed brute-force targeting a single account from multiple IPs.
 * Keyed by normalized email address. Applies to all emails equally to prevent account enumeration.
 */
export const loginAccountLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_FAILED_ATTEMPTS,
  store: accountRateLimitStore,
  keyGenerator: (req: Request) => {
    const email = (req.body?.email as string | undefined)?.trim()?.toLowerCase();
    if (email) {
      return email;
    }
    return ipKeyGenerator(req.ip || '');
  },
  validate: { keyGeneratorIpFallback: false },
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req: Request, res: Response) => res.statusCode !== 401,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response, _next: NextFunction, options) => {
    send429Response(res, options.windowMs);
  },
});

/**
 * Composite Login Rate Limiter middleware.
 * Sequentially executes IP limiter followed by Account-based limiter.
 */
export const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  loginIpLimiter(req, res, (ipErr?: unknown) => {
    if (ipErr) return next(ipErr);
    loginAccountLimiter(req, res, next);
  });
};

/**
 * Reset failed-attempt counters for a given IP and account upon successful authentication.
 */
export async function resetLoginRateLimits(ip?: string, email?: string): Promise<void> {
  const promises: Promise<void>[] = [];
  if (ip) {
    promises.push(ipRateLimitStore.resetKey(ip));
  }
  if (email && typeof email === 'string' && email.trim()) {
    promises.push(accountRateLimitStore.resetKey(email.trim().toLowerCase()));
  }
  await Promise.all(promises);
}

/**
 * Reset all rate limit counters (used by test suites).
 */
export async function clearAllRateLimits(): Promise<void> {
  await Promise.all([ipRateLimitStore.resetAll(), accountRateLimitStore.resetAll()]);
}
