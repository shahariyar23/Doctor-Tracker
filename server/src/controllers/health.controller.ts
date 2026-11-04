import { Request, Response, RequestHandler } from "express";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

interface HealthData {
  uptime: number;
  timestamp: string;
  service: string;
  status: string;
}

export const getHealthStatus: RequestHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<Response> => {
    const healthData: HealthData = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: "Doctor Tracker API",
      status: "healthy",
    };

    return ApiResponse.success<HealthData>(res, {
      statusCode: 200,
      message: "Doctor Tracker API is up and running",
      data: healthData,
      meta: null,
    });
  },
);
