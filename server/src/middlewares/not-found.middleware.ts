import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';

export const notFoundHandler: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const error = ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};
