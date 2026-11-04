import { Router } from 'express';
import healthRoutes from './health.route.js';
import authRoutes from './auth.route.js';
import doctorRoutes from './doctor.route.js';
import patientRoutes from './patient.route.js';
import dashboardRoutes from './dashboard.route.js';

const apiRouter: Router = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

export default apiRouter;
