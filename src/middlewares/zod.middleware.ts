import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import Responder from "../utils/responder";

export function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errorMessages = result.error.issues.map((issue: any) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));
        return Responder(res, {
          error: errorMessages,
          message: "Invalid Data",
          httpCode: 400,
        });
      }

      req.body = result.data;
      next();
    } catch (error) {
      Responder(res, {
        message: "Internal Server Error",
        httpCode: 500,
      });
    }
  };
}
