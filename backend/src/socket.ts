// Socket.IO removed - Vercel serverless doesn't support WebSockets
// All real-time features now use polling via API endpoints

import prisma from "./db";
import { getGroupActivity, getLeaderboard, getUserStats } from "./services/groupStats";

// No-op functions for backward compatibility
export function initSocket(_server: any) {
  // Socket.IO not available in serverless environment
  return null;
}

export function getSocketServer() {
  // Return a mock object that won't crash and supports chaining
  // Accepts any arguments for emit() to match Socket.IO API
  const mockEmit = (..._args: any[]) => mockSocket;
  const mockSocket: any = {
    to: (_room: string) => ({
      emit: mockEmit,
    }),
    emit: mockEmit,
  };
  return mockSocket;
}

export async function broadcastGroupState(_groupId: string) {
  // No-op in serverless environment
  // Clients should poll /api/groups/:groupId/state instead
}

export async function emitUserStats(_groupId: string, _userId: string) {
  // No-op in serverless environment
  // Clients should poll /api/groups/:groupId/stats/:userId instead
}
