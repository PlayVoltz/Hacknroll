import prisma from "../db";
import { config } from "../config";
import { computeSpiderStatsEngine } from "./engine/spiderStats";

export async function getLeaderboard(groupId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { groupId },
    include: { user: true },
    // Highest balance first (goal: don't be the brokest)
    orderBy: { creditsMinor: "desc" },
  });

  return wallets.map((wallet: any, index: number) => ({
    rank: index + 1,
    userId: wallet.userId,
    username: wallet.user.username,
    creditsMinor: wallet.creditsMinor,
  }));
}

export async function getUserStats(groupId: string, userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const totals = await prisma.transaction.aggregate({
    where: { groupId, userId },
    _sum: { amountMinor: true },
  });

  const positives = await prisma.transaction.aggregate({
    where: { groupId, userId, amountMinor: { gt: 0 } },
    _sum: { amountMinor: true },
  });

  const negatives = await prisma.transaction.aggregate({
    where: { groupId, userId, amountMinor: { lt: 0 } },
    _sum: { amountMinor: true },
  });

  return {
    balanceMinor: wallet.creditsMinor,
    netChangeMinor: wallet.creditsMinor - config.creditsStartMinor,
    totalWonMinor: positives._sum.amountMinor || 0,
    totalLostMinor: Math.abs(negatives._sum.amountMinor || 0),
    ledgerSumMinor: totals._sum.amountMinor || 0,
  };
}

export async function getMemberProfile(groupId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });
  if (!user) throw new Error("User not found");

  const stats = await getUserStats(groupId, userId);
  return { user, stats };
}

export async function getGroupActivity(groupId: string) {
  const entries = await prisma.transaction.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const withBalances = await Promise.all(
    entries.map(async (entry: any) => {
      const sumToEntry = await prisma.transaction.aggregate({
        where: {
          groupId,
          userId: entry.userId,
          createdAt: { lte: entry.createdAt },
        },
        _sum: { amountMinor: true },
      });

      return {
        id: entry.id,
        createdAt: entry.createdAt,
        username: entry.user.username,
        type: entry.type,
        amountMinor: entry.amountMinor,
        description: (entry.meta as { description?: string })?.description,
        resultingBalanceMinor:
          config.creditsStartMinor + (sumToEntry._sum.amountMinor || 0),
      };
    }),
  );

  return withBalances;
}

type SpiderTx = {
  amountMinor: number;
  type: string;
  meta: unknown;
};

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function computeSpiderStatsFromTxs(txs: SpiderTx[], startCreditsMinor: number) {
  const betTxs = txs.filter((t) => t.type === "BET");
  const totalBetMinor = betTxs.reduce((sum, t) => sum + Math.abs(t.amountMinor), 0);

  const winTxs = txs.filter((t) => t.amountMinor > 0);
  const totalWonMinor = winTxs.reduce((sum, t) => sum + t.amountMinor, 0);

  const transferCount = txs.filter((t) => t.type === "TRANSFER").length;

  const gameTypes = new Set<string>();
  for (const t of txs) {
    const gt = (t.meta as { gameType?: string })?.gameType;
    if (gt) gameTypes.add(gt);
  }

  // Volatility: stddev of ledger deltas
  const amounts = txs.map((t) => t.amountMinor);
  const mean = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const variance =
    amounts.length > 1
      ? amounts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (amounts.length - 1)
      : 0;
  const stddev = Math.sqrt(variance);

  const aggression = clamp01(totalBetMinor / (startCreditsMinor * 3));
  const luck = clamp01(Math.min(2, totalWonMinor / Math.max(1, totalBetMinor)) / 2);
  const variety = clamp01(gameTypes.size / 6);
  const social = clamp01(transferCount / 10);
  const volatility = clamp01(stddev / (startCreditsMinor / 2));

  return {
    axes: [
      { key: "aggression", label: "Aggression", value: aggression },
      { key: "luck", label: "Luck", value: luck },
      { key: "variety", label: "Variety", value: variety },
      { key: "social", label: "Social", value: social },
      { key: "volatility", label: "Volatility", value: volatility },
    ],
    raw: {
      totalBetMinor,
      totalWonMinor,
      transferCount,
      uniqueGameTypes: Array.from(gameTypes),
      txCount: txs.length,
    },
  };
}

export async function getSpiderStats(groupId: string, userId: string) {
  const txs = await prisma.transaction.findMany({
    where: { groupId, userId },
    select: { amountMinor: true, type: true, meta: true, createdAt: true, relatedUserId: true },
    orderBy: { createdAt: "asc" },
  });

  const simpleTxs: SpiderTx[] = txs.map((t: any) => ({
    amountMinor: t.amountMinor,
    type: t.type,
    meta: t.meta,
  }));

  const engine = computeSpiderStatsEngine({
    txs: simpleTxs,
    startCreditsMinor: config.creditsStartMinor,
  });
  if (engine) return engine;

  return computeSpiderStatsFromTxs(simpleTxs, config.creditsStartMinor);
}
