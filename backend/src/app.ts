import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import gameRoutes from "./routes/games";
import { requireAuth } from "./middleware/auth";
import { config } from "./config";

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/groups", requireAuth, groupRoutes);
app.use("/api/groups", requireAuth, gameRoutes);

export default app;
