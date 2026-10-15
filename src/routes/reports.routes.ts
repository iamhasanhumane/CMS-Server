import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import { getDashboardStats, getRevenueReport, getAuditLogsController, getClinicSettings, updateClinicSettings, getFollowUps, getDoctorDashboardStats, getAdminAnalytics } from "../controllers/reports.controller";

const router = Router();

router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/revenue", authMiddleware, authorize("admin"), getRevenueReport);
router.get("/doctor-stats", authMiddleware, getDoctorDashboardStats);
router.get("/admin-analytics", authMiddleware, authorize("admin"), getAdminAnalytics);
router.get("/audit-logs", authMiddleware, authorize("admin"), getAuditLogsController);
router.get("/settings", authMiddleware, getClinicSettings);
router.patch("/settings", authMiddleware, authorize("admin"), updateClinicSettings);
router.get("/follow-ups", authMiddleware, getFollowUps);

export default router;
