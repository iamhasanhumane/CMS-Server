import { Request, Response } from "express";
import { findUserByUsername, checkPassword, findUserById } from "../services/user.service";
import { generateToken, verifyToken } from "../utils/jwt";
import Responder from "../utils/responder";

export const loginController = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await findUserByUsername(username);
    if (!user) {
      return Responder(res, { error: "Invalid username or password", httpCode: 401 });
    }

    if (!user.isActive) {
      return Responder(res, { error: "Account is deactivated", httpCode: 403 });
    }

    const isMatch = await checkPassword(password, user.password!);
    if (!isMatch) {
      return Responder(res, { error: "Invalid username or password", httpCode: 401 });
    }

    const { accessToken, refreshToken } = generateToken(user.id, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    const userData = user.toJSON();
    const { password: _, ...userWithoutPassword } = userData;

    return Responder(res, {
      message: "Logged in successfully",
      data: { user: userWithoutPassword, accessToken },
      httpCode: 200,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const refreshTokenController = (req: Request, res: Response) => {
  try {
    if (!req.cookies) {
      return Responder(res, { error: "No cookies provided", httpCode: 401 });
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return Responder(res, { error: "No refresh token provided", httpCode: 401 });
    }

    const decoded = verifyToken(refreshToken, "refresh") as any;
    if (!decoded || decoded.type !== "refresh" || !decoded.userId || !decoded.role) {
      return Responder(res, { error: "Invalid refresh token", httpCode: 401 });
    }

    const { accessToken } = generateToken(decoded.userId, decoded.role);

    return Responder(res, {
      message: "Access token refreshed successfully",
      data: { accessToken },
      httpCode: 200,
    });
  } catch (error: any) {
    console.error("Refresh Token Error:", error);
    return Responder(res, { error: error.message, httpCode: 401 });
  }
};

export const logOutController = async (req: Request, res: Response) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return Responder(res, { message: "Logged out successfully", httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getMeController = async (req: Request, res: Response) => {
  try {
    const user = await findUserById(req.userId!);
    if (!user) {
      return Responder(res, { error: "User not found", httpCode: 404 });
    }
    return Responder(res, { message: "User fetched", data: { user }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
