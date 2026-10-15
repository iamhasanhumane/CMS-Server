import { Router } from "express";
import { getPublicBaseController } from "../controllers/network.controller";

const router = Router();

// Public — needed before login cookie for QR tooling; no secrets returned
router.get("/public-base", getPublicBaseController);

export default router;
