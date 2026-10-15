import { Router } from "express";
import { getMeController, loginController, logOutController, refreshTokenController } from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", loginController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", authMiddleware, logOutController);
router.get("/me", authMiddleware, getMeController);



export default router;
