import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodType, ZodIssue, z } from 'zod';
import { ApiError } from '../utils/api-error.js';

export interface RequestValidationSchema<
  TBody extends ZodType = ZodType,
  TQuery extends ZodType = ZodType,
  TParams extends ZodType = ZodType,
> {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidatedData<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
}

// Augment Express Request so req.validated is globally available
declare global {
  namespace Express {
    interface Request {
      validated?: ValidatedData;
    }
  }
}

/**
 * Express Request strongly typed with validated data properties.
 * Use this to type route handler parameters:
 *
 * Example:
 *   const createPatientHandler = (req: ValidatedRequest<CreatePatientInput>, res: Response) => {
 *     const { name, age, gender } = req.validated.body; // Fully typed!
 *   };
 */
export interface ValidatedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> extends Request {
  validated: ValidatedData<TBody, TQuery, TParams>;
}

/**
 * Type-safe accessor helper for req.validated.
 * Retrieves validated data without relying on unused/misleading schema parameters.
 */
export const getValidated = <TBody = unknown, TQuery = unknown, TParams = unknown>(
  req: Request,
): ValidatedData<TBody, TQuery, TParams> => {
  return (req.validated ?? {}) as ValidatedData<TBody, TQuery, TParams>;
};

/**
 * Centralized request validation middleware using Zod.
 * - Validates body, query, and params using safeParse().
 * - Does NOT mutate raw Express properties (req.body, req.query, req.params).
 * - Stores all parsed and coerced data exclusively on req.validated.
 * - Collects all errors with source prefixes: 'body.field', 'query.field', 'params.field'.
 * - If validation fails, immediately forwards an HTTP 422 ApiError to the global error handler.
 */
export const validate = <
  TBody extends ZodType = ZodType,
  TQuery extends ZodType = ZodType,
  TParams extends ZodType = ZodType,
>(
  schema: RequestValidationSchema<TBody, TQuery, TParams>,
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errorDetails: ValidationErrorDetail[] = [];
    let parsedBody: z.infer<TBody> | undefined = undefined;
    let parsedQuery: z.infer<TQuery> | undefined = undefined;
    let parsedParams: z.infer<TParams> | undefined = undefined;

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => {
          errorDetails.push({
            field: issue.path.length > 0 ? `params.${issue.path.join('.')}` : 'params',
            message: issue.message,
          });
        });
      } else {
        parsedParams = result.data;
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => {
          errorDetails.push({
            field: issue.path.length > 0 ? `query.${issue.path.join('.')}` : 'query',
            message: issue.message,
          });
        });
      } else {
        parsedQuery = result.data;
      }
    }

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        result.error.issues.forEach((issue: ZodIssue) => {
          errorDetails.push({
            field: issue.path.length > 0 ? `body.${issue.path.join('.')}` : 'body',
            message: issue.message,
          });
        });
      } else {
        parsedBody = result.data;
      }
    }

    if (errorDetails.length > 0) {
      const validationError = ApiError.unprocessableEntity('Validation failed', errorDetails);
      next(validationError);
      return;
    }

    req.validated = {
      body: parsedBody,
      query: parsedQuery,
      params: parsedParams,
    };

    next();
  };
};
