import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (
  requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(requestHandler(req, res, next)).catch((err: unknown) => next(err));
  };
};
