import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import {
  createPrescriptionController, updatePrescriptionController, finalizePrescriptionController,
  getPrescriptionController, getPrescriptionByVisitController,
} from "../controllers/prescription.controller";

const router = Router();

router.post("/", authMiddleware, authorize("doctor"), createPrescriptionController);
router.patch("/:id", authMiddleware, authorize("doctor"), updatePrescriptionController);
router.patch("/:id/finalize", authMiddleware, authorize("doctor"), finalizePrescriptionController);
router.get("/:id", authMiddleware, getPrescriptionController);
router.get("/visit/:visitId", authMiddleware, getPrescriptionByVisitController);

export default router;
