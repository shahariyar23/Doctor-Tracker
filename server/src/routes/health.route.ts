import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller.js';

const router: Router = Router();

router.get('/', getHealthStatus);

export default router;
