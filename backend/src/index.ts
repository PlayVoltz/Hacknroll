import http from "http";
import app from "./app";
import prisma from "./db";
import { config } from "./config";
import { initSocket } from "./socket";
import { finalizeRouletteRound, startRouletteRound } from "./routes/games";
import { broadcastGroupState } from "./socket";

const server = http.createServer(app);
initSocket(server);

async function freezeExpiredGroups() {
  const now = new Date();
  const expired = await prisma.group.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now }, isUnlimited: false },
  });

  for (const group of expired) {
    await prisma.group.update({
      where: { id: group.id },
      data: { status: "FROZEN" },
    });
    await broadcastGroupState(group.id);
  }
}

async function ensureRouletteRounds() {
  const groups = await prisma.group.findMany({
    where: { status: "ACTIVE" },
  });

  for (const group of groups) {
    const activeRound = await prisma.gameRound.findFirst({
      where: { groupId: group.id, gameType: "ROULETTE", status: "ACTIVE" },
    });
    if (!activeRound) {
      await startRouletteRound(group.id);
      continue;
    }

    const bettingEndsAt = (activeRound.result as { bettingEndsAt?: number } | null)
      ?.bettingEndsAt;
    if (!bettingEndsAt) {
      await prisma.gameRound.update({
        where: { id: activeRound.id },
        data: { result: { bettingEndsAt: Date.now() + config.rouletteCountdownSeconds * 1000 } },
      });
      continue;
    }

    const secondsLeft = Math.ceil((bettingEndsAt - Date.now()) / 1000);
    if (secondsLeft <= 0) {
      await finalizeRouletteRound(activeRound.id);
    } else {
      // lightweight broadcast for countdown
      try {
        const { getSocketServer } = await import("./socket");
        getSocketServer().to(`group:${group.id}`).emit("roulette", { secondsLeft });
      } catch {
        // ignore if socket not ready
      }
    }
  }
}

setInterval(async () => {
  await freezeExpiredGroups();
  await ensureRouletteRounds();
}, 1000);

server.listen(config.serverPort, () => {
  console.log(`Backend listening on ${config.serverPort}`);
});
