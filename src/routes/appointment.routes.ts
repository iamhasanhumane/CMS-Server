import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import { createAppointmentController, getAppointmentsController, updateAppointmentStatusController, updateAppointmentFeeController, updateAppointmentController, deleteAppointmentController } from "../controllers/appointment.controller";

const router = Router();

router.post("/", authMiddleware, authorize("admin", "staff"), createAppointmentController);
router.get("/", authMiddleware, getAppointmentsController);
router.patch("/:id/status", authMiddleware, updateAppointmentStatusController);
router.patch("/:id/fee", authMiddleware, authorize("admin", "staff"), updateAppointmentFeeController);
router.patch("/:id", authMiddleware, authorize("admin", "staff"), updateAppointmentController);
router.delete("/:id", authMiddleware, authorize("admin", "staff"), deleteAppointmentController);

export default router;
