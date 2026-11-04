import type { Request, Response, CookieOptions } from "express";
import { Admin } from "../models/admin.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { comparePassword, compareWithDummy } from "../utils/password.util.js";
import { signAccessToken } from "../utils/token.util.js";
import { config } from "../config/index.js";
import type { LoginInput } from "../validators/auth.validator.js";

const COOKIE_NAME = "token";
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Standard cookie configuration for authentication JWT.
 */
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: "lax",
  path: "/",
  maxAge: ONE_HOUR_MS,
};

/**
 * Admin Login Handler
 * POST /api/v1/auth/login
 */
export const loginHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = (req.validated?.body ?? req.body) as LoginInput;

    const admin = await Admin.findOne({ email }).select("+passwordHash");

    if (!admin) {
      await compareWithDummy(password);
      throw ApiError.unauthorized("Invalid email or password combination");
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password combination");
    }

    const token = signAccessToken(admin._id.toString());

    res.cookie(COOKIE_NAME, token, authCookieOptions);

    ApiResponse.success(res, {
      message: "Admin authenticated successfully",
      data: {
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
        },
      },
    });
  },
);

/**
 * Get Current Authenticated Admin
 * GET /api/v1/auth/me
 */
export const getMeHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const admin = req.admin;
    if (!admin) {
      throw ApiError.unauthorized("Authentication required. Please log in.");
    }

    ApiResponse.success(res, {
      message: "Admin profile retrieved successfully",
      data: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  },
);

/**
 * Admin Logout Handler
 * POST /api/v1/auth/logout
 */
export const logoutHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: authCookieOptions.httpOnly,
      secure: authCookieOptions.secure,
      sameSite: authCookieOptions.sameSite,
      path: authCookieOptions.path,
    });

    ApiResponse.success(res, {
      message: "Logged out successfully",
      data: {},
    });
  },
);
