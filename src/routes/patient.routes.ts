import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import { createPatientController, getPatientsController, getPatientByIdController, updatePatientController, deletePatientController } from "../controllers/patient.controller";

const router = Router();

router.post("/", authMiddleware, authorize("admin", "staff", "doctor"), createPatientController);
router.get("/", authMiddleware, getPatientsController);
router.get("/:id", authMiddleware, getPatientByIdController);
router.patch("/:id", authMiddleware, authorize("admin", "staff", "doctor"), updatePatientController);
router.delete("/:id", authMiddleware, authorize("admin"), deletePatientController);

export default router;

