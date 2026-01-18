import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import gameRoutes from "./routes/games";
import { requireAuth } from "./middleware/auth";
import { config } from "./config";
import { getDiag } from "./services/engine/diag";

const app = express();

// Error handler for async routes
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (doesn't require database)
app.get("/health", (_req, res) => {
  try {
    const diag = getDiag();
    return res.json(diag ? { ok: true, diag } : { ok: true });
  } catch (error) {
    return res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Debug endpoint to check environment and database connection
app.get("/debug", async (_req, res) => {
  try {
    const env = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasClientOrigin: !!process.env.CLIENT_ORIGIN,
      nodeEnv: process.env.NODE_ENV,
    };
    
    let dbStatus = "unknown";
    try {
      const prisma = await import("./db");
      await prisma.default.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (error) {
      dbStatus = error instanceof Error ? error.message : String(error);
    }
    
    return res.json({ env, dbStatus });
  } catch (error) {
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", requireAuth, groupRoutes);
app.use("/api/groups", requireAuth, gameRoutes);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
