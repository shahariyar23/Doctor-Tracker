import type { Request, Response } from 'express';
import { Doctor, type IDoctor } from '../models/doctor.model.js';
import { Patient } from '../models/patient.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import type {
  CreateDoctorInput,
  UpdateDoctorInput,
  DoctorQueryInput,
} from '../validators/doctor.validator.js';
import type { IdParamInput } from '../validators/common.validator.js';
import { escapeRegex, parseDateFrom, parseDateTo } from '../validators/common.validator.js';

/**
 * Helper to handle MongoDB duplicate key errors (code 11000)
 */
function handleDuplicateKeyError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  ) {
    const keyPattern = (error as { keyPattern?: Record<string, number> }).keyPattern;
    const duplicateField = keyPattern ? Object.keys(keyPattern)[0] : 'field';
    throw ApiError.conflict(`A doctor with this ${duplicateField} already exists.`);
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

      ApiResponse.success(res, {
        statusCode: 201,
        message: 'Doctor created successfully',
        data: doctor,
      });
    } catch (error) {
      handleDuplicateKeyError(error);
    }
  },
);

/**
 * Retrieve Doctors with search, date filtering and database pagination
 * GET /api/v1/doctors
 */
export const getAllDoctorsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = (req.validated?.query ?? req.query) as unknown as DoctorQueryInput;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Search condition across name, specialization, hospital, email
    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { name: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
        { email: searchRegex },
      ];
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

    // Run query and total count concurrently
    const [doctors, total] = await Promise.all([
      Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Doctor.countDocuments(filter),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    ApiResponse.success(res, {
      message: 'Doctors retrieved successfully',
      data: doctors,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
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
      throw ApiError.notFound('Doctor not found');
    }

    ApiResponse.success(res, {
      message: 'Doctor retrieved successfully',
      data: doctor,
    });
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
          returnDocument: 'after',
          runValidators: true,
        },
      );

      if (!updatedDoctor) {
        throw ApiError.notFound('Doctor not found');
      }

      ApiResponse.success(res, {
        message: 'Doctor updated successfully',
        data: updatedDoctor,
      });
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
      throw ApiError.notFound('Doctor not found');
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

    ApiResponse.success(res, {
      message: 'Doctor deleted successfully',
      data: {},
    });
  },
);
