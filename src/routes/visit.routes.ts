import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/auth.middleware";
import { visitImageUpload } from "../middlewares/upload.middleware";
import {
  createVisitController,
  completeVisitController,
  saveVisitDraftController,
  getPatientHistoryController,
  getVisitByAppointmentController,
} from "../controllers/visit.controller";
import {
  createUploadTokenController,
  deleteAttachmentController,
  getAttachmentsController,
  uploadAttachmentAuthController,
} from "../controllers/attachment.controller";

const router = Router();

router.post("/", authMiddleware, authorize("doctor"), createVisitController);
router.patch("/:id/complete", authMiddleware, authorize("doctor"), completeVisitController);
router.patch("/:id/draft", authMiddleware, authorize("doctor"), saveVisitDraftController);
router.get("/patient/:patientId/history", authMiddleware, getPatientHistoryController);
router.get("/appointment/:appointmentId", authMiddleware, getVisitByAppointmentController);

router.post(
  "/:visitId/upload-token",
  authMiddleware,
  authorize("doctor", "admin"),
  createUploadTokenController
);
router.get(
  "/:visitId/attachments",
  authMiddleware,
  getAttachmentsController
);
router.post(
  "/:visitId/attachments",
  authMiddleware,
  authorize("doctor", "admin", "staff"),
  visitImageUpload.single("image"),
  uploadAttachmentAuthController
);
router.delete(
  "/attachments/:attachmentId",
  authMiddleware,
  authorize("doctor", "admin"),
  deleteAttachmentController
);

export default router;
