import { Request, Response, NextFunction } from "express";
import Responder from "../utils/responder";
import { verifyToken } from "../utils/jwt";
import { JwtPayload } from "../types/jwt";
import { findUserById } from "../services/user.service";

export default async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Responder(res, { error: "Access Token Missing or Invalid", httpCode: 401 });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(accessToken, "access") as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    const user = await findUserById(req.userId);
    if (!user) {
      return Responder(res, { error: "User not found", httpCode: 404 });
    }

    next();
  } catch (error: any) {
    return Responder(res, { error: error.message, httpCode: 401 });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return Responder(res, { error: "Unauthorized: Insufficient permissions", httpCode: 403 });
    }
    next();
  };
};
