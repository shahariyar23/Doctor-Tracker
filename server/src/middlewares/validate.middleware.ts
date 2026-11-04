import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType, ZodIssue } from "zod";
import { ApiError } from "../utils/api-error.js";

export interface RequestValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Centralized request validation middleware using Zod.
 * Validates req.body, req.query, and req.params synchronously with safeParse().
 * Emits standard field-level validation errors conforming to the project's API error format.
 */
export const validate = (schema: RequestValidationSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errorDetails: ValidationErrorDetail[] = [];

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => {
          errorDetails.push({
            field:
              issue.path.length > 0
                ? `params.${issue.path.join(".")}`
                : "params",
            message: issue.message,
          });
        });
      } else {
        req.params = result.data as Request["params"];
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => {
          errorDetails.push({
            field:
              issue.path.length > 0 ? `query.${issue.path.join(".")}` : "query",
            message: issue.message,
          });
        });
      } else {
        req.query = result.data as Request["query"];
      }
    }

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => {
          errorDetails.push({
            field: issue.path.join("."),
            message: issue.message,
          });
        });
      } else {
        req.body = result.data as Request["body"];
      }
    }

    if (errorDetails.length > 0) {
      const validationError = ApiError.badRequest(
        "Validation failed on submitted request",
        errorDetails,
      );
      next(validationError);
      return;
    }

    next();
  };
};
