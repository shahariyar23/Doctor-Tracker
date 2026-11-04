import type { Request, Response } from "express";
import { Patient, type IPatient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import type {
  CreatePatientInput,
  UpdatePatientInput,
  PatientQueryInput,
} from "../validators/patient.validator.js";
import type { IdParamInput } from "../validators/common.validator.js";
import {
  escapeRegex,
  parseDateFrom,
  parseDateTo,
} from "../validators/common.validator.js";

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
      `A patient with this ${duplicateField} already exists.`,
    );
  }
  throw error;
}

/**
 * Create a new Patient
 * POST /api/v1/patients
 */
export const createPatientHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = (req.validated?.body ?? req.body) as CreatePatientInput;

    // Verify assigned doctor exists before creation
    const doctorExists = await Doctor.exists({ _id: data.assignedDoctorId });
    if (!doctorExists) {
      throw ApiError.badRequest(
        `Referenced doctor with ID "${data.assignedDoctorId}" does not exist.`,
      );
    }

    try {
      const patient = await Patient.create(data);

      ApiResponse.success(
        res,
        {
          statusCode: 201,
          message: "Patient created successfully",
          data: patient,
        },
      );
    } catch (error) {
      handleDuplicateKeyError(error);
    }
  },
);

/**
 * Retrieve Patients with search, condition filtering, date filtering, and database pagination
 * GET /api/v1/patients
 */
export const getAllPatientsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = (req.validated?.query ?? req.query) as unknown as PatientQueryInput;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Search condition across patient name, condition, and phone
    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(escapeRegex(query.search.trim()), "i");
      filter.$or = [
        { name: searchRegex },
        { condition: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Condition exact match (case-insensitive)
    if (query.condition && query.condition.trim().length > 0) {
      const conditionRegex = new RegExp(`^${escapeRegex(query.condition.trim())}$`, "i");
      filter.condition = conditionRegex;
    }

    // Date range condition on createdAt
    if (query.from || query.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) {
        dateFilter.$gte = parseDateFrom(query.from);
      }
      if (query.to) {
        dateFilter.$lte = parseDateTo(query.to);
      }
      filter.createdAt = dateFilter;
    }

    // Run query and count concurrently
    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Patient.countDocuments(filter),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    ApiResponse.success(
      res,
      {
        message: "Patients retrieved successfully",
        data: patients,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    );
  },
);

/**
 * Retrieve one Patient by ID
 * GET /api/v1/patients/:id
 */
export const getPatientByIdHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = (req.validated?.params ?? req.params) as IdParamInput;

    const patient = await Patient.findById(id);
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    ApiResponse.success(
      res,
      {
        message: "Patient retrieved successfully",
        data: patient,
      },
    );
  },
);

/**
 * Update a Patient
 * PATCH /api/v1/patients/:id
 */
export const updatePatientHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = (req.validated?.params ?? req.params) as IdParamInput;
    const updateData = (req.validated?.body ?? req.body) as UpdatePatientInput;

    // If assignedDoctorId is provided in update, verify target doctor exists
    if (updateData.assignedDoctorId) {
      const doctorExists = await Doctor.exists({ _id: updateData.assignedDoctorId });
      if (!doctorExists) {
        throw ApiError.badRequest(
          `Referenced doctor with ID "${updateData.assignedDoctorId}" does not exist.`,
        );
      }
    }

    try {
      const updatedPatient = await Patient.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      if (!updatedPatient) {
        throw ApiError.notFound("Patient not found");
      }

      ApiResponse.success(
        res,
        {
          message: "Patient updated successfully",
          data: updatedPatient,
        },
      );
    } catch (error) {
      handleDuplicateKeyError(error);
    }
  },
);

/**
 * Delete a Patient
 * DELETE /api/v1/patients/:id
 */
export const deletePatientHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = (req.validated?.params ?? req.params) as IdParamInput;

    const deletedPatient = await Patient.findByIdAndDelete(id);
    if (!deletedPatient) {
      throw ApiError.notFound("Patient not found");
    }

    ApiResponse.success(
      res,
      {
        message: "Patient deleted successfully",
        data: {},
      },
    );
  },
);
