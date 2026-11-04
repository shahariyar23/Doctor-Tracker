import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
import { config } from "../config/index.js";

/**
 * Validates whether a number is a standard HTTP status code (100-599).
 */
const isValidStatusCode = (code: unknown): code is number => {
  return typeof code === "number" && Number.isInteger(code) && code >= 100 && code <= 599;
};

/**
 * Safe object type guard for unknown values
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: unknown = null;
  let stack: string | undefined = undefined;

  if (err instanceof ApiError) {
    statusCode = isValidStatusCode(err.statusCode) ? err.statusCode : 500;
    message = err.message || "Something went wrong";
    errors = err.errors ?? null;
    stack = err.stack;
  } else if (err instanceof Error) {
    stack = err.stack;

    // Safely check for custom status codes on standard Error objects without unsafe assertions
    if (isRecord(err)) {
      const candidate = err["statusCode"] ?? err["status"];
      if (isValidStatusCode(candidate)) {
        statusCode = candidate;
        message = err.message;
        errors = err["errors"] ?? null;
      } else {
        statusCode = 500;
        message = "Internal server error";
      }
    } else {
      statusCode = 500;
      message = "Internal server error";
    }
  } else {
    statusCode = 500;
    message = "Internal server error";
  }

  const response: {
    success: false;
    message: string;
    errors: unknown;
    stack?: string;
  } = {
    success: false,
    message,
    errors,
  };

  // Stack traces strictly exposed only in development environment
  if (config.env === "development" && stack) {
    response.stack = stack;
  }

  res.status(statusCode).json(response);
};
