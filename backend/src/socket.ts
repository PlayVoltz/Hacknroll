import { Server } from "socket.io";
import prisma from "./db";
import { getGroupActivity, getLeaderboard, getUserStats } from "./services/groupStats";
import { placeRouletteBet } from "./services/rouletteBets";
import { config } from "./config";

let io: Server | null = null;

export function initSocket(server: import("http").Server) {
  io = new Server(server, {
    cors: {
      origin: config.clientOrigin,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("group", async ({ groupId, userId }) => {
      if (!groupId) return;
      socket.join(`group:${groupId}`);
      await broadcastGroupState(groupId);
      if (userId) {
        const stats = await getUserStats(groupId, userId);
        socket.emit("activity", { userStats: stats });
      }
    });

    socket.on("roulette", async ({ groupId, userId, betType, amountMinor }) => {
      try {
        await placeRouletteBet({
          groupId,
          userId,
          betType,
          selection: null,
          amountMinor,
        });
        await broadcastGroupState(groupId);
      } catch (error) {
        socket.emit("roulette:error", { error: (error as Error).message });
      }
    });
  });

  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
}

export async function broadcastGroupState(groupId: string) {
  if (!io) return;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;

  const [leaderboard, activity] = await Promise.all([
    getLeaderboard(groupId),
    getGroupActivity(groupId),
  ]);

  const timer = group.endsAt
    ? Math.max(0, Math.floor((group.endsAt.getTime() - Date.now()) / 1000))
    : null;

  io.to(`group:${groupId}`).emit("group", {
    timer,
    status: group.status,
    leaderboard,
    isUnlimited: group.isUnlimited,
  });

  io.to(`group:${groupId}`).emit("leaderboard", leaderboard);
  io.to(`group:${groupId}`).emit("activity", {
    latestEntries: activity,
  });
}

export async function emitUserStats(groupId: string, userId: string) {
  if (!io) return;
  const stats = await getUserStats(groupId, userId);
  io.to(`group:${groupId}`).emit("activity", { userStats: stats });
}
