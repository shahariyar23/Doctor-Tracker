import type { Request, Response } from 'express';
import { Doctor } from '../models/doctor.model.js';
import { Patient } from '../models/patient.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { parseDateFrom, parseDateTo } from '../validators/common.validator.js';
import type {
  DashboardDateRangeInput,
  PatientTrendsQueryInput,
} from '../validators/dashboard.validator.js';

/**
 * Resolves standard UTC date boundaries for dashboard queries.
 * If both from and to are omitted, defaults to the most recent 30 calendar days (UTC).
 */
function resolveDateRange(from?: string, to?: string): { startDate: Date; endDate: Date } {
  if (from && to) {
    return {
      startDate: parseDateFrom(from),
      endDate: parseDateTo(to),
    };
  }

  if (from && !to) {
    return {
      startDate: parseDateFrom(from),
      endDate: new Date(),
    };
  }

  if (!from && to) {
    const toDate = parseDateTo(to);
    const startDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate,
      endDate: toDate,
    };
  }

  // Default: most recent 30 days up to current moment
  const now = new Date();
  const past30Days = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 0, 0, 0, 0),
  );
  return {
    startDate: past30Days,
    endDate: now,
  };
}

/**
 * GET /api/v1/dashboard/overview
 * Returns summary statistics and data-driven insights.
 */
export const getDashboardOverviewHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = (req.validated?.query ?? req.query) as unknown as DashboardDateRangeInput;
    const { startDate, endDate } = resolveDateRange(query.from, query.to);

    const [
      totalDoctors,
      totalPatients,
      newDoctors,
      newPatients,
      patientsByDoctorRaw,
      topConditionsRaw,
      unassignedPatientsCount,
    ] = await Promise.all([
      // 1. All-time total doctors
      Doctor.countDocuments(),

      // 2. All-time total patients
      Patient.countDocuments(),

      // 3. New doctors created in date range
      Doctor.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // 4. New patients created in date range
      Patient.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // 5. Patients assigned per doctor (including 0-count doctors)
      Doctor.aggregate<{
        doctorId: string;
        doctorName: string;
        specialization: string;
        patientCount: number;
      }>([
        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: 'assignedDoctorId',
            as: 'patients',
          },
        },
        {
          $project: {
            _id: 0,
            doctorId: { $toString: '$_id' },
            doctorName: '$name',
            specialization: '$specialization',
            patientCount: { $size: '$patients' },
          },
        },
        { $sort: { patientCount: -1, doctorName: 1 } },
      ]),

      // 6. Top conditions across all patients
      Patient.aggregate<{ condition: string; count: number }>([
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, condition: '$_id', count: 1 } },
      ]),

      // 7. Unassigned patients (patients whose assignedDoctorId does not exist in doctors collection)
      Patient.aggregate<{ count: number }>([
        {
          $lookup: {
            from: 'doctors',
            localField: 'assignedDoctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $match: { doctor: { $size: 0 } } },
        { $count: 'count' },
      ]),
    ]);

    const unassignedPatients = unassignedPatientsCount[0]?.count ?? 0;

    // Generate factual data-driven insights (no hallucinations, no LLM)
    const insights: string[] = [];

    if (totalDoctors === 0 && totalPatients === 0) {
      // Empty database state
      insights.push('The system currently has no recorded doctors or patients.');
    } else {
      if (patientsByDoctorRaw.length > 0) {
        const topDoctor = patientsByDoctorRaw[0]!;
        if (topDoctor.patientCount > 0) {
          const prefix = topDoctor.doctorName.startsWith('Dr.') ? '' : 'Dr. ';
          insights.push(
            `${prefix}${topDoctor.doctorName} (${topDoctor.specialization}) manages the highest patient load with ${topDoctor.patientCount} patient(s).`,
          );
        }
        const zeroPatientDoctors = patientsByDoctorRaw.filter((d) => d.patientCount === 0);
        if (zeroPatientDoctors.length > 0) {
          insights.push(
            `${zeroPatientDoctors.length} doctor(s) currently have no assigned patients.`,
          );
        }
      }

      if (topConditionsRaw.length > 0) {
        const topCondition = topConditionsRaw[0]!;
        insights.push(
          `The most prevalent condition recorded is "${topCondition.condition}" with ${topCondition.count} patient(s).`,
        );
      }

      insights.push(
        `${newPatients} new patient(s) registered during the selected observation period.`,
      );

      if (unassignedPatients > 0) {
        insights.push(
          `Notice: ${unassignedPatients} patient(s) currently have orphaned or unassigned doctor references.`,
        );
      }
    }

    ApiResponse.success(res, {
      message: 'Dashboard overview statistics retrieved successfully',
      data: {
        totalDoctors,
        totalPatients,
        newDoctors,
        newPatients,
        patientsPerDoctor: patientsByDoctorRaw,
        unassignedPatients,
        topConditions: topConditionsRaw,
        registrationSummary: {
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          newPatients,
          newDoctors,
        },
        insights,
      },
    });
  },
);

/**
 * Formats a Date object to YYYY-MM-DD string in UTC
 */
function formatUtcDay(d: Date): string {
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to YYYY-MM string in UTC
 */
function formatUtcMonth(d: Date): string {
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * GET /api/v1/dashboard/patient-trends
 * Returns patient registration trends over time with filled zero-count dates.
 */
export const getPatientTrendsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = (req.validated?.query ?? req.query) as unknown as PatientTrendsQueryInput;
    const { startDate, endDate } = resolveDateRange(query.from, query.to);

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interval = query.interval ?? (diffDays > 90 ? 'month' : 'day');

    let labels: string[] = [];
    const countsMap = new Map<string, number>();

    if (interval === 'day') {
      // Build continuous daily labels
      const cursor = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
      );
      const endLimit = new Date(
        Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()),
      );

      while (cursor <= endLimit) {
        const key = formatUtcDay(cursor);
        labels.push(key);
        countsMap.set(key, 0);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      // Group by daily format in MongoDB
      const dailyAgg = await Patient.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
      ]);

      for (const item of dailyAgg) {
        if (countsMap.has(item._id)) {
          countsMap.set(item._id, item.count);
        }
      }
    } else {
      // Build continuous monthly labels (YYYY-MM)
      const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
      const endMonth = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));

      while (cursor <= endMonth) {
        const key = formatUtcMonth(cursor);
        labels.push(key);
        countsMap.set(key, 0);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }

      // Group by monthly format in MongoDB
      const monthlyAgg = await Patient.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
      ]);

      for (const item of monthlyAgg) {
        if (countsMap.has(item._id)) {
          countsMap.set(item._id, item.count);
        }
      }
    }

    const dataSeries = labels.map((label) => countsMap.get(label) ?? 0);

    ApiResponse.success(res, {
      message: 'Patient registration trends retrieved successfully',
      data: {
        labels,
        datasets: [
          {
            label: 'Patient Registrations',
            data: dataSeries,
          },
        ],
      },
    });
  },
);

/**
 * GET /api/v1/dashboard/patients-by-doctor
 * Returns patient count per doctor sorted descending.
 */
export const getPatientsByDoctorHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Doctor.aggregate<{
      doctorId: string;
      doctorName: string;
      specialization: string;
      patientCount: number;
    }>([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'assignedDoctorId',
          as: 'patients',
        },
      },
      {
        $project: {
          _id: 0,
          doctorId: { $toString: '$_id' },
          doctorName: '$name',
          specialization: '$specialization',
          patientCount: { $size: '$patients' },
        },
      },
      { $sort: { patientCount: -1, doctorName: 1 } },
    ]);

    ApiResponse.success(res, {
      message: 'Patients by doctor distribution retrieved successfully',
      data: result,
    });
  },
);

/**
 * GET /api/v1/dashboard/conditions
 * Returns condition-wise patient counts sorted descending.
 */
export const getConditionsDistributionHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Patient.aggregate<{ condition: string; count: number }>([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          condition: '$_id',
          count: 1,
        },
      },
    ]);

    ApiResponse.success(res, {
      message: 'Patient condition distribution retrieved successfully',
      data: result,
    });
  },
);
