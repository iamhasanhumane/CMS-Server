import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import { createBillController, getBillsController, getBillByIdController } from "../controllers/bill.controller";

const router = Router();

router.post("/", authMiddleware, authorize("staff"), createBillController);
router.get("/", authMiddleware, getBillsController);
router.get("/:id", authMiddleware, getBillByIdController);

export default router;
