import { PrismaClient } from "@prisma/client";

// Create a singleton Prisma client for serverless functions
// This prevents connection pool exhaustion in serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
});

export default prisma;
