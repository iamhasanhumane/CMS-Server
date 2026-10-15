import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import {
  createDoctorController, getDoctorsController, updateDoctorController,
  createStaffController, getStaffController, updateStaffController,
} from "../controllers/admin.controller";

const router = Router();

// Doctor management - read for all authenticated, write for admin
router.post("/doctors", authMiddleware, authorize("admin"), createDoctorController);
router.get("/doctors", authMiddleware, getDoctorsController);
router.patch("/doctors/:id", authMiddleware, authorize("admin"), updateDoctorController);

// Staff management - read for all authenticated, write for admin
router.post("/staff", authMiddleware, authorize("admin"), createStaffController);
router.get("/staff", authMiddleware, getStaffController);
router.patch("/staff/:id", authMiddleware, authorize("admin"), updateStaffController);

export default router;
