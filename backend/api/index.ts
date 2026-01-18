// Vercel Serverless Function entrypoint.
// @vercel/node will compile this TypeScript file automatically.

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Import and export the Express app
// Vercel's @vercel/node handles TypeScript compilation
import app from "../src/app";

export default app;

