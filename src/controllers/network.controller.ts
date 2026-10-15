import { Request, Response } from "express";
import os from "os";
import Responder from "../utils/responder";

const isLoopbackHost = (hostname: string): boolean =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "0.0.0.0";

const getLanIpv4 = (): string | null => {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      const family = String(net.family);
      if ((family === "IPv4" || family === "4") && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

const frontendDevPort = (): string => {
  for (const raw of [process.env.PUBLIC_APP_URL, process.env.FRONTEND_URL, "http://localhost:3000"]) {
    if (!raw) continue;
    try {
      const u = new URL(raw.trim());
      if (u.port) return u.port;
    } catch {
      /* ignore */
    }
  }
  return "3000";
};

/**
 * Phone-reachable frontend base URL (for QR codes).
 * Prefer PUBLIC_APP_URL / FRONTEND_URL when they are not localhost;
 * otherwise use the machine LAN IP (same as Next.js "Network" URL).
 */
export const resolvePhoneReachableBaseUrl = (): string => {
  for (const raw of [process.env.PUBLIC_APP_URL, process.env.FRONTEND_URL]) {
    if (!raw) continue;
    try {
      const u = new URL(raw.trim());
      if (!isLoopbackHost(u.hostname)) {
        return `${u.protocol}//${u.host}`.replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
  }

  const lan = getLanIpv4();
  if (lan) return `http://${lan}:${frontendDevPort()}`;

  return `http://localhost:${frontendDevPort()}`;
};

/** GET /api/v1/network/public-base — used by doctor desk for QR links */
export const getPublicBaseController = async (_req: Request, res: Response) => {
  try {
    const baseUrl = resolvePhoneReachableBaseUrl();
    return Responder(res, {
      message: "Public base resolved",
      data: { baseUrl, lanIp: getLanIpv4() },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
