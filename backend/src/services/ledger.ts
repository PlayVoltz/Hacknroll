import { Prisma, PrismaClient, TransactionType } from "@prisma/client";
import prisma from "../db";

export type LedgerEntryInput = {
  groupId: string;
  userId: string;
  relatedUserId?: string | null;
  type: TransactionType;
  amountMinor: number;
  meta: Prisma.InputJsonValue;
};

type LedgerClient = Prisma.TransactionClient | PrismaClient;

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
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      await applyLedgerEntry(tx, entry);
    }
  });
}
