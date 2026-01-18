import { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { verifyJwt } from "../utils/auth";

export type AuthedRequest = Request & { userId: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[config.cookieName];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyJwt(token);
    (req as AuthedRequest).userId = payload.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
