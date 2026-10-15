import { Router } from "express";
import { createMedicineController, deleteMedicineController, getMedicinesController, updateMedicineController } from "../controllers/medicine.controller";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, authorize("admin", "staff"), createMedicineController);
router.get("/", authMiddleware, getMedicinesController);
router.patch("/:id", authMiddleware, authorize("admin", "staff"), updateMedicineController);
router.delete("/:id", authMiddleware, authorize("admin", "staff"), deleteMedicineController);

export default router;
