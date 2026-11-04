import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getHealthStatus = asyncHandler(async (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "Doctor Tracker API",
    status: "healthy",
  };

  return ApiResponse.success(res, {
    statusCode: 200,
    message: "Doctor Tracker API is up and running",
    data: healthData,
    meta: null,
  });
});
