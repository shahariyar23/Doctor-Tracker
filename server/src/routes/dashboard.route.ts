import { Router } from 'express';
import {
  getDashboardOverviewHandler,
  getPatientTrendsHandler,
  getPatientsByDoctorHandler,
  getConditionsDistributionHandler,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  dashboardDateRangeSchema,
  patientTrendsQuerySchema,
} from '../validators/dashboard.validator.js';

const router = Router();

// All dashboard endpoints require Admin authentication
router.use(authenticate);

router.get('/overview', validate({ query: dashboardDateRangeSchema }), getDashboardOverviewHandler);

router.get(
  '/patient-trends',
  validate({ query: patientTrendsQuerySchema }),
  getPatientTrendsHandler,
);

router.get('/patients-by-doctor', getPatientsByDoctorHandler);

router.get('/conditions', getConditionsDistributionHandler);

export default router;
