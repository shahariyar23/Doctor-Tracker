import { Router } from "express";
import healthRoutes from "./health.route.js";
import authRoutes from "./auth.route.js";
import doctorRoutes from "./doctor.route.js";

const apiRouter: Router = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/doctors", doctorRoutes);

export default apiRouter;
