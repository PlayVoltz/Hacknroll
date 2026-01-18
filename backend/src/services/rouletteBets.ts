import prisma from "../db";
import { applyLedgerEntry } from "./ledger";
import { RouletteBet } from "./games/roulette";

export async function placeRouletteBet(input: {
  groupId: string;
  userId: string;
  betType: "red" | "black" | "green";
  selection: null;
  amountMinor: number;
}) {
  const { groupId, userId, betType, selection, amountMinor } = input;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.status !== "ACTIVE") {
    throw new Error("Group is frozen");
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) {
    throw new Error("Not a member of this group");
  }

  const currentRound = await prisma.gameRound.findFirst({
    where: { groupId, gameType: "ROULETTE", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!currentRound) {
    throw new Error("No active roulette round");
  }

  const bettingEndsAt = (currentRound.result as { bettingEndsAt?: number } | null)
    ?.bettingEndsAt;
  if (!bettingEndsAt || Date.now() >= bettingEndsAt) {
    throw new Error("Betting is closed");
  }

  const bet: RouletteBet = { betType, selection: null };

  await prisma.$transaction(async (tx) => {
    const existing = await tx.gameBet.findFirst({
      where: { roundId: currentRound.id, userId },
    });
    if (existing) {
      throw new Error("Only 1 bet per spin");
    }

    await tx.gameBet.create({
      data: {
        roundId: currentRound.id,
        userId,
        amountMinor,
        selection: bet,
        payoutMinor: 0,
      },
    });

    await applyLedgerEntry(tx, {
      groupId,
      userId,
      type: "BET",
      amountMinor: -amountMinor,
      meta: {
        gameType: "ROULETTE",
        roundId: currentRound.id,
        betType: bet.betType,
        selection: bet.selection,
        description: "Roulette bet",
      },
    });
  });

  return { roundId: currentRound.id };
}
