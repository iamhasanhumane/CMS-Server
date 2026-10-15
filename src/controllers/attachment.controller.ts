import { Request, Response } from "express";
import crypto from "crypto";
import { Op } from "sequelize";
import Visit from "../models/visit.model";
import Patient from "../models/patient.model";
import VisitAttachment from "../models/visitAttachment.model";
import UploadToken from "../models/uploadToken.model";
import { toPublicUploadPath } from "../middlewares/upload.middleware";
import { resolvePhoneReachableBaseUrl } from "./network.controller";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";

const DEFAULT_TOKEN_MINUTES = 15;

const isLoopbackUrl = (value?: string | null): boolean => {
  if (!value) return true;
  try {
    const u = new URL(value.includes("://") ? value : `http://${value}`);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "::1" ||
      u.hostname === "0.0.0.0"
    );
  } catch {
    return /localhost|127\.0\.0\.1/.test(value);
  }
};

/**
 * Phone-reachable app base URL for QR codes.
 * Prefer non-loopback PUBLIC_APP_URL / FRONTEND_URL / client origin;
 * otherwise auto-detect LAN IP (same as Next.js Network URL).
 */
const resolveCaptureBaseUrl = (req: Request, clientHint?: string): string => {
  const originHeader = req.get("origin") || undefined;
  let refererOrigin: string | undefined;
  const referer = req.get("referer");
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }

  const candidates = [
    process.env.PUBLIC_APP_URL,
    process.env.FRONTEND_URL,
    clientHint,
    originHeader,
    refererOrigin,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim().replace(/\/$/, ""));

  for (const c of candidates) {
    if (!isLoopbackUrl(c)) return c;
  }

  // Doctor opened the app via localhost — use LAN IP so the phone can open the QR
  return resolvePhoneReachableBaseUrl();
};

const buildCaptureUrl = (req: Request, token: string, clientHint?: string): string => {
  const base = resolveCaptureBaseUrl(req, clientHint);
  return `${base}/m/capture/${token}`;
};

export const createUploadTokenController = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    const minutesRaw = req.body?.expiresInMinutes ?? req.body?.minutes;
    const minutes = Number.isFinite(Number(minutesRaw)) && Number(minutesRaw) > 0
      ? Number(minutesRaw)
      : DEFAULT_TOKEN_MINUTES;
    const clientHint =
      typeof req.body?.publicBaseUrl === "string" ? req.body.publicBaseUrl.trim() : undefined;

    const visit = await Visit.findByPk(visitId);
    if (!visit) return Responder(res, { error: "Visit not found", httpCode: 404 });

    // Reuse a still-valid token for this visit
    const existing = await UploadToken.findOne({
      where: {
        visitId,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [["expiresAt", "DESC"]],
    });

    if (existing) {
      return Responder(res, {
        message: "Upload token reused",
        data: {
          token: existing.token,
          url: buildCaptureUrl(req, existing.token, clientHint),
          expiresAt: existing.expiresAt,
        },
        httpCode: 200,
      });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    const created = await UploadToken.create({ visitId, token, expiresAt });

    return Responder(res, {
      message: "Upload token created",
      data: {
        token: created.token,
        url: buildCaptureUrl(req, created.token, clientHint),
        expiresAt: created.expiresAt,
      },
      httpCode: 201,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getAttachmentsController = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    const visit = await Visit.findByPk(visitId);
    if (!visit) return Responder(res, { error: "Visit not found", httpCode: 404 });

    const attachments = await VisitAttachment.findAll({
      where: { visitId },
      order: [["createdAt", "ASC"]],
    });

    return Responder(res, {
      message: "Attachments fetched",
      data: { attachments },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const uploadAttachmentAuthController = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    const visit = await Visit.findByPk(visitId);
    if (!visit) return Responder(res, { error: "Visit not found", httpCode: 404 });

    if (!req.file) {
      return Responder(res, { error: "No image file provided", httpCode: 400 });
    }

    const fileUrl = toPublicUploadPath(req.file.path);
    const attachment = await VisitAttachment.create({
      visitId,
      fileUrl,
      caption: req.body?.caption || null,
      uploadedBy: req.userId || null,
    });

    await logAudit(req.userId!, "CREATE", "VisitAttachment", attachment.id, `Photo for visit ${visitId}`);

    return Responder(res, {
      message: "Attachment uploaded",
      data: { attachment },
      httpCode: 201,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const deleteAttachmentController = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await VisitAttachment.findByPk(attachmentId);
    if (!attachment) return Responder(res, { error: "Attachment not found", httpCode: 404 });

    await attachment.destroy();
    await logAudit(req.userId!, "DELETE", "VisitAttachment", attachmentId, "Clinical photo removed");

    return Responder(res, { message: "Attachment deleted", httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

const findValidToken = async (token: string) => {
  const row = await UploadToken.findOne({ where: { token } });
  if (!row) return { error: "Invalid upload link", httpCode: 404 as const };
  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    return { error: "Upload link has expired", httpCode: 410 as const };
  }
  return { row };
};

export const getMobileUploadMetaController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await findValidToken(token);
    if ("error" in result) {
      return Responder(res, { error: result.error, httpCode: result.httpCode });
    }

    const visit = await Visit.findByPk(result.row.visitId, {
      include: [{ model: Patient, as: "patient" }],
    });
    if (!visit) return Responder(res, { error: "Visit not found", httpCode: 404 });

    const patient = (visit as any).patient;
    return Responder(res, {
      message: "Upload session valid",
      data: {
        patientName: patient?.name || "Patient",
        uhid: patient?.uhid || "",
        expiresAt: result.row.expiresAt,
      },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const uploadMobileAttachmentController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await findValidToken(token);
    if ("error" in result) {
      return Responder(res, { error: result.error, httpCode: result.httpCode });
    }

    if (!req.file) {
      return Responder(res, { error: "No image file provided", httpCode: 400 });
    }

    const fileUrl = toPublicUploadPath(req.file.path);
    const attachment = await VisitAttachment.create({
      visitId: result.row.visitId,
      fileUrl,
      caption: req.body?.caption || null,
      uploadedBy: null,
    });

    return Responder(res, {
      message: "Photo uploaded",
      data: { attachment },
      httpCode: 201,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
