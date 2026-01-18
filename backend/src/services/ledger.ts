import { PrismaClient } from "@prisma/client";
import prisma from "../db";

export type LedgerEntryInput = {
  groupId: string;
  userId: string;
  relatedUserId?: string | null;
  type: "BET" | "PAYOUT" | "TRANSFER" | "GAME_RESULT";
  amountMinor: number;
  meta: any;
};

type LedgerClient = any;

export async function applyLedgerEntry(
  tx: LedgerClient,
  entry: LedgerEntryInput,
) {
  const wallet = await tx.wallet.findUnique({
    where: { groupId_userId: { groupId: entry.groupId, userId: entry.userId } },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const nextBalance = wallet.creditsMinor + entry.amountMinor;
  if (nextBalance < 0) {
    throw new Error("Insufficient credits");
  }

  await tx.wallet.update({
    where: { groupId_userId: { groupId: entry.groupId, userId: entry.userId } },
    data: { creditsMinor: nextBalance },
  });

  const transaction = await tx.transaction.create({
    data: {
      groupId: entry.groupId,
      userId: entry.userId,
      relatedUserId: entry.relatedUserId ?? null,
      type: entry.type,
      amountMinor: entry.amountMinor,
      meta: entry.meta,
    },
  });

  return { transaction, nextBalance };
}

export async function applyLedgerEntries(entries: LedgerEntryInput[]) {
  await prisma.$transaction(async (tx: any) => {
    for (const entry of entries) {
      await applyLedgerEntry(tx, entry);
    }
  });
}
