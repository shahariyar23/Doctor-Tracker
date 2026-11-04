import { Router } from "express";
import {
  createDoctorHandler,
  getAllDoctorsHandler,
  getDoctorByIdHandler,
  updateDoctorHandler,
  deleteDoctorHandler,
} from "../controllers/doctor.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createDoctorBodySchema,
  updateDoctorBodySchema,
} from "../validators/doctor.validator.js";
import { idParamSchema } from "../validators/common.validator.js";

const router = Router();

// All doctor management endpoints require Admin authentication
router.use(authenticate);

router.post(
  "/",
  validate({ body: createDoctorBodySchema }),
  createDoctorHandler,
);

router.get("/", getAllDoctorsHandler);

router.get(
  "/:id",
  validate({ params: idParamSchema }),
  getDoctorByIdHandler,
);

router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateDoctorBodySchema }),
  updateDoctorHandler,
);

router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  deleteDoctorHandler,
);

export default router;

