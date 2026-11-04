import type { Request, Response, NextFunction } from 'express';
import { Admin, type AdminDocument } from '../models/admin.model.js';
import { verifyAccessToken } from '../utils/token.util.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// Extend Express Request interface to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: AdminDocument;
    }
  }
}

/**
 * Middleware to authenticate requests via HTTP-only JWT cookie.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies?.token;

    if (!token || typeof token !== 'string') {
      throw ApiError.unauthorized('Authentication required. Please log in.');
    }

    let decoded: { sub: string };
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired authentication token.');
    }

    const admin = await Admin.findById(decoded.sub);
    if (!admin) {
      throw ApiError.unauthorized('Admin account no longer exists. Please re-authenticate.');
    }

    req.admin = admin;
    next();
  },
);
