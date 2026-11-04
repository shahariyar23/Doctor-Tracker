import type { Request, Response } from 'express';
import { Doctor } from '../models/doctor.model.js';
import { Patient } from '../models/patient.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { escapeRegex } from '../validators/common.validator.js';
import type { GlobalSearchQueryInput } from '../validators/search.validator.js';

/**
 * Global search across Doctors and Patients
 * GET /api/v1/search?q=<term>&limit=5
 */
export const globalSearchHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { q, limit = 5 } = (req.validated?.query ?? req.query) as unknown as GlobalSearchQueryInput;
    const sanitizedQuery = q.trim();

    const searchRegex = new RegExp(escapeRegex(sanitizedQuery), 'i');

    // Doctor filter across supported fields: name, specialization, hospital, email, phone
    const doctorFilter = {
      $or: [
        { name: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    };

    // Patient filter across supported fields: name, condition, phone
    const patientFilter = {
      $or: [
        { name: searchRegex },
        { condition: searchRegex },
        { phone: searchRegex },
      ],
    };

    // Concurrently fetch matching Doctors and Patients with lean projection & limit
    const [doctors, patients] = await Promise.all([
      Doctor.find(doctorFilter)
        .select('_id name specialization hospital email phone')
        .limit(limit)
        .lean(),
      Patient.find(patientFilter)
        .select('_id name condition age gender phone assignedDoctorId')
        .populate<{ assignedDoctorId: { _id: string; name: string } | null }>({
          path: 'assignedDoctorId',
          select: '_id name',
        })
        .limit(limit)
        .lean(),
    ]);

    // Format Doctors response (mapping _id to id)
    const formattedDoctors = doctors.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      specialization: doc.specialization,
      hospital: doc.hospital,
      email: doc.email,
      phone: doc.phone,
    }));

    // Format Patients response (mapping _id to id and handling assignedDoctor)
    const formattedPatients = patients.map((patient) => {
      let assignedDoctor: { id: string; name: string } | null = null;
      if (
        patient.assignedDoctorId &&
        typeof patient.assignedDoctorId === 'object' &&
        'name' in patient.assignedDoctorId
      ) {
        assignedDoctor = {
          id: patient.assignedDoctorId._id.toString(),
          name: patient.assignedDoctorId.name,
        };
      }

      return {
        id: patient._id.toString(),
        name: patient.name,
        condition: patient.condition,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone || null,
        assignedDoctor,
      };
    });

    const total = formattedDoctors.length + formattedPatients.length;

    ApiResponse.success(res, {
      message: 'Global search completed successfully',
      data: {
        doctors: formattedDoctors,
        patients: formattedPatients,
        total,
      },
      meta: null,
    });
  },
);

