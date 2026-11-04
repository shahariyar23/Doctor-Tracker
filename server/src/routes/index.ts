import { Router } from "express";
import healthRoutes from "./health.route.js";
import authRoutes from "./auth.route.js";

const apiRouter: Router = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/auth", authRoutes);

export default apiRouter;
