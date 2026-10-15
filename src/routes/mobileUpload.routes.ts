import { Router } from "express";
import { visitImageUpload } from "../middlewares/upload.middleware";
import {
  getMobileUploadMetaController,
  uploadMobileAttachmentController,
} from "../controllers/attachment.controller";
import { serveMobileCapturePage } from "../controllers/mobileCapture.controller";

const router = Router();

// HTML capture page — same host as API (ngrok single-tunnel friendly)
router.get("/capture/:token", serveMobileCapturePage);

// Public JSON + upload API
router.get("/upload/:token", getMobileUploadMetaController);
router.post(
  "/upload/:token",
  visitImageUpload.single("image"),
  uploadMobileAttachmentController
);

export default router;
