import { ApiError } from "../utils/api-error.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize generic or unhandled errors into ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error.errors || null, err.stack);
  }

  const response = {
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors || null,
  };

  return res.status(error.statusCode || 500).json(response);
};
