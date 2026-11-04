import type { Request, Response } from "express";
import { Doctor } from "../models/doctor.model.js";
import { Patient } from "../models/patient.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import type {
  CreateDoctorInput,
  UpdateDoctorInput,
} from "../validators/doctor.validator.js";
import type { IdParamInput } from "../validators/common.validator.js";

/**
 * Helper to handle MongoDB duplicate key errors (code 11000)
 */
function handleDuplicateKeyError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  ) {
    const keyPattern = (error as { keyPattern?: Record<string, number> }).keyPattern;
    const duplicateField = keyPattern ? Object.keys(keyPattern)[0] : "field";
    throw ApiError.conflict(
      `A doctor with this ${duplicateField} already exists.`,
    );
  }
  throw error;
}

/**
 * Create a new Doctor
 * POST /api/v1/doctors
 */
export const createDoctorHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = (req.validated?.body ?? req.body) as CreateDoctorInput;

    try {
      const doctor = await Doctor.create(data);

      ApiResponse.success(
        res,
        {
          statusCode: 201,
          message: "Doctor created successfully",
          data: doctor,
        },
      );
    } catch (error) {
      handleDuplicateKeyError(error);
    }
  },
);

/**
 * Retrieve all Doctors
 * GET /api/v1/doctors
 */
export const getAllDoctorsHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const doctors = await Doctor.find().sort({ createdAt: -1 });

    ApiResponse.success(
      res,
      {
        message: "Doctors retrieved successfully",
        data: doctors,
      },
    );
  },
);

/**
 * Retrieve one Doctor by ID
 * GET /api/v1/doctors/:id
 */
export const getDoctorByIdHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = (req.validated?.params ?? req.params) as IdParamInput;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw ApiError.notFound("Doctor not found");
    }

    ApiResponse.success(
      res,
      {
        message: "Doctor retrieved successfully",
        data: doctor,
      },
    );
  },
);

/**
 * Update a Doctor
 * PATCH /api/v1/doctors/:id
 */
export const updateDoctorHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = (req.validated?.params ?? req.params) as IdParamInput;
    const updateData = (req.validated?.body ?? req.body) as UpdateDoctorInput;

    try {
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      if (!updatedDoctor) {
        throw ApiError.notFound("Doctor not found");
      }

      ApiResponse.success(
        res,
        {
          message: "Doctor updated successfully",
          data: updatedDoctor,
        },
      );
    } catch (error) {
      handleDuplicateKeyError(error);
    }
  },
);

/**
 * Delete a Doctor
 * DELETE /api/v1/doctors/:id
 */
export const deleteDoctorHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = (req.validated?.params ?? req.params) as IdParamInput;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw ApiError.notFound("Doctor not found");
    }

    // Check whether Patient documents reference this Doctor through assignedDoctorId
    const assignedPatientCount = await Patient.countDocuments({
      assignedDoctorId: doctor._id,
    });

    if (assignedPatientCount > 0) {
      throw ApiError.conflict(
        `Cannot delete doctor. There are ${assignedPatientCount} patient(s) assigned to this doctor. Please reassign or remove the patients first.`,
      );
    }

    await Doctor.findByIdAndDelete(id);

    ApiResponse.success(
      res,
      {
        message: "Doctor deleted successfully",
        data: {},
      },
    );
  },
);
