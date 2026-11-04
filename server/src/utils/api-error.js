export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error description message
   * @param {any} [errors=null] - Detailed error payload or validation array
   * @param {string} [stack=""] - Custom stack trace if available
   */
  constructor(statusCode, message = "Something went wrong", errors = null, stack = "") {
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

  static badRequest(message = "Bad request", errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized access", errors = null) {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = "Forbidden", errors = null) {
    return new ApiError(403, message, errors);
  }

  static notFound(message = "Resource not found", errors = null) {
    return new ApiError(404, message, errors);
  }

  static internal(message = "Internal server error", errors = null) {
    return new ApiError(500, message, errors);
  }
}
