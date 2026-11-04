import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
import { config } from "../config/index.js";

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: ApiError;

  // Safe type narrowing without using 'any'
  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Error) {
    const customStatus =
      "statusCode" in err &&
      typeof (err as { statusCode: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;
    const customErrors =
      "errors" in err ? (err as { errors: unknown }).errors : null;
    error = new ApiError(customStatus, err.message, customErrors, err.stack);
  } else {
    error = new ApiError(500, "Something went wrong");
  }

  const response: {
    success: false;
    message: string;
    errors: unknown;
    stack?: string;
  } = {
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors ?? null,
  };

  if (config.env === "development" && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
};
