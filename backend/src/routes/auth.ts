import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../db";
import { config } from "../config";
import { signJwt } from "../utils/auth";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { email, username, password } = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(400).json({ error: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  const token = signJwt({ userId: user.id });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signJwt({ userId: user.id });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie(config.cookieName);
  return res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, profileImageUrl: true },
  });
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  return res.json(user);
});

const updateProfileSchema = z.object({
  username: z.string().min(3).optional(),
  profileImageUrl: z.string().min(1).max(500).optional().nullable(),
});

router.patch("/me", requireAuth, async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { username, profileImageUrl } = parsed.data;
  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: "Username already taken" });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username ? { username } : {}),
      ...(profileImageUrl !== undefined ? { profileImageUrl } : {}),
    },
    select: { id: true, email: true, username: true, profileImageUrl: true },
  });

  return res.json(updated);
});

export default router;
