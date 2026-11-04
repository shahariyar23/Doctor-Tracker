export class ApiError extends Error {
  public statusCode: number;
  public success: boolean;
  public errors: unknown;

  /**
   * @param statusCode - HTTP status code
   * @param message - Error description message
   * @param errors - Detailed error payload or validation array
   * @param stack - Custom stack trace if available
   */
  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: unknown = null,
    stack: string = '',
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string = 'Bad request', errors: unknown = null): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized access', errors: unknown = null): ApiError {
    return new ApiError(401, message, errors);
  }

  static forbidden(message: string = 'Forbidden', errors: unknown = null): ApiError {
    return new ApiError(403, message, errors);
  }

  static notFound(message: string = 'Resource not found', errors: unknown = null): ApiError {
    return new ApiError(404, message, errors);
  }

  static conflict(message: string = 'Conflict', errors: unknown = null): ApiError {
    return new ApiError(409, message, errors);
  }

  static unprocessableEntity(
    message: string = 'Validation failed',
    errors: unknown = null,
  ): ApiError {
    return new ApiError(422, message, errors);
  }

  static internal(message: string = 'Internal server error', errors: unknown = null): ApiError {
    return new ApiError(500, message, errors);
  }
}
