import jwt from "jsonwebtoken";
import { config } from "../config";

export type JwtPayload = {
  userId: string;
};

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
