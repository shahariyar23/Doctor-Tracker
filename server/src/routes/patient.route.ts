import { Router } from 'express';
import {
  createPatientHandler,
  getAllPatientsHandler,
  getPatientByIdHandler,
  updatePatientHandler,
  deletePatientHandler,
  getPatientStatsHandler,
} from '../controllers/patient.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createPatientBodySchema,
  updatePatientBodySchema,
  patientQuerySchema,
} from '../validators/patient.validator.js';
import { idParamSchema } from '../validators/common.validator.js';

const router = Router();

// All patient management endpoints require Admin authentication
router.use(authenticate);

router.post('/', validate({ body: createPatientBodySchema }), createPatientHandler);

router.get('/stats', getPatientStatsHandler);

router.get('/', validate({ query: patientQuerySchema }), getAllPatientsHandler);

router.get('/:id', validate({ params: idParamSchema }), getPatientByIdHandler);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updatePatientBodySchema }),
  updatePatientHandler,
);

router.delete('/:id', validate({ params: idParamSchema }), deletePatientHandler);

export default router;
