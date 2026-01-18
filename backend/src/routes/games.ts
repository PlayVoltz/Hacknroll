import { Router } from "express";
import { z } from "zod";
import prisma from "../db";
import { AuthedRequest } from "../middleware/auth";
import { applyLedgerEntry } from "../services/ledger";
import { playCoinflip } from "../services/games/coinflip";
import { playBlackjack } from "../services/games/blackjack";
import {
  cashOut,
  generateMines,
  MinesState,
  revealTile,
} from "../services/games/mines";
import {
  resolveRouletteBet,
  RouletteBet,
  spinRoulette,
} from "../services/games/roulette";
import { settlePlinko } from "../services/games/plinko";
import {
  buildDeck,
  draw,
  PokerCard,
} from "../services/games/poker";
import { config } from "../config";
import { broadcastGroupState, getSocketServer } from "../socket";
import { placeRouletteBet } from "../services/rouletteBets";

const router = Router();

type PokerPlayerState = {
  userId: string;
  buyInMinor: number;
  hand: PokerCard[];
  folded: boolean;
  betMinor: number;
};

type PokerState = {
  status: "WAITING" | "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
  potMinor: number;
  buyInMinor: number;
  minBetMinor: number;
  players: PokerPlayerState[];
  community: PokerCard[];
  deck: PokerCard[];
  currentPlayerIndex: number;
  currentBetMinor: number;
  winnerId?: string;
};

function getNextPlayerIndex(players: PokerPlayerState[], start: number) {
  if (!players.length) return 0;
  let idx = start;
  for (let i = 0; i < players.length; i += 1) {
    idx = (idx + 1) % players.length;
    if (!players[idx].folded) return idx;
  }
  return start;
}

function allPlayersMatched(players: PokerPlayerState[], currentBetMinor: number) {
  return players
    .filter((p) => !p.folded)
    .every((p) => p.betMinor === currentBetMinor);
}

function advancePhase(state: PokerState) {
  if (state.status === "PREFLOP") {
    state.community.push(draw(state.deck), draw(state.deck), draw(state.deck));
    state.status = "FLOP";
  } else if (state.status === "FLOP") {
    state.community.push(draw(state.deck));
    state.status = "TURN";
  } else if (state.status === "TURN") {
    state.community.push(draw(state.deck));
    state.status = "RIVER";
  } else if (state.status === "RIVER") {
    state.status = "SHOWDOWN";
  }
  state.currentBetMinor = 0;
  state.players.forEach((p) => {
    p.betMinor = 0;
  });
  state.currentPlayerIndex = getNextPlayerIndex(state.players, state.currentPlayerIndex);
}

async function ensureActiveGroup(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new Error("Group not found");
  }
  if (group.status !== "ACTIVE") {
    throw new Error("Group is frozen");
  }
  return group;
}

async function ensureMembership(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) {
    throw new Error("Not a member of this group");
  }
}

const coinflipSchema = z.object({
  betMinor: z.number().int().positive(),
  choice: z.enum(["heads", "tails"]),
});

router.post("/:groupId/coinflip/play", async (req, res) => {
  const parsed = coinflipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const { betMinor, choice } = parsed.data;
  const { result, won, payoutMinor } = playCoinflip(choice, betMinor);

  try {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -betMinor,
        meta: { gameType: "COINFLIP", choice, description: "Coinflip bet" },
      });

      if (payoutMinor > 0) {
        await applyLedgerEntry(tx, {
          groupId,
          userId,
          type: "PAYOUT",
          amountMinor: payoutMinor,
          meta: {
            gameType: "COINFLIP",
            result,
            description: "Coinflip payout",
          },
        });
      }
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json({ result, won, payoutMinor });
});

const blackjackSchema = z.object({
  betMinor: z.number().int().positive(),
});

router.post("/:groupId/blackjack/play", async (req, res) => {
  const parsed = blackjackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const { betMinor } = parsed.data;
  const result = playBlackjack(betMinor);

  try {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -betMinor,
        meta: { gameType: "BLACKJACK", description: "Blackjack bet" },
      });

      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "GAME_RESULT",
        amountMinor: 0,
        meta: {
          gameType: "BLACKJACK",
          description: `Blackjack result: ${result.outcome}`,
        },
      });

      if (result.payoutMinor > 0) {
        await applyLedgerEntry(tx, {
          groupId,
          userId,
          type: "PAYOUT",
          amountMinor: result.payoutMinor,
          meta: { gameType: "BLACKJACK", description: "Blackjack payout" },
        });
      }
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json(result);
});

const blackjackBetSchema = z.object({
  amountMinor: z.number().int().positive(),
  roundKey: z.string().min(1).optional(),
});

router.post("/:groupId/blackjack/bet", async (req, res) => {
  const parsed = blackjackBetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const { amountMinor, roundKey } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -amountMinor,
        meta: {
          gameType: "BLACKJACK",
          roundKey,
          description: "Blackjack bet",
        },
      });
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json({ ok: true });
});

const blackjackSettleSchema = z.object({
  payoutMinor: z.number().int().min(0),
  roundKey: z.string().min(1).optional(),
  outcome: z.string().min(1).optional(),
  meta: z.any().optional(),
});

router.post("/:groupId/blackjack/settle", async (req, res) => {
  const parsed = blackjackSettleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const { payoutMinor, roundKey, outcome, meta } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "GAME_RESULT",
        amountMinor: 0,
        meta: {
          gameType: "BLACKJACK",
          roundKey,
          outcome,
          description: outcome ? `Blackjack result: ${outcome}` : "Blackjack result",
          ...(meta ?? {}),
        },
      });

      if (payoutMinor > 0) {
        await applyLedgerEntry(tx, {
          groupId,
          userId,
          type: "PAYOUT",
          amountMinor: payoutMinor,
          meta: {
            gameType: "BLACKJACK",
            roundKey,
            description: "Blackjack payout",
            ...(meta ?? {}),
          },
        });
      }
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json({ ok: true });
});

const minesStartSchema = z.object({
  betMinor: z.number().int().positive(),
  mineCount: z.number().int().min(1).max(24),
});

router.post("/:groupId/mines/start", async (req, res) => {
  const parsed = minesStartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const { betMinor, mineCount } = parsed.data;
  const minePositions = generateMines(mineCount);
  const state: MinesState = {
    betMinor,
    mineCount,
    minePositions,
    revealed: [],
    multiplier: 1,
    status: "ACTIVE",
  };

  let round;
  try {
    round = await prisma.$transaction(async (tx) => {
      const created = await tx.gameRound.create({
        data: {
          groupId,
          userId,
          gameType: "MINES",
          seed: "crypto",
          result: state,
        },
      });

      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -betMinor,
        meta: {
          gameType: "MINES",
          roundId: created.id,
          description: "Mines bet",
        },
      });

      return created;
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json({ roundId: round.id, revealed: [], multiplier: 1 });
});

router.get("/:groupId/mines/active", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const round = await prisma.gameRound.findFirst({
    where: {
      groupId,
      userId,
      gameType: "MINES",
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!round) {
    return res.json({ round: null });
  }

  const state = round.result as MinesState;
  return res.json({
    round: {
      id: round.id,
      revealed: state.revealed,
      multiplier: state.multiplier,
      status: state.status,
    },
  });
});

const minesRevealSchema = z.object({
  roundId: z.string(),
  position: z.number().int().min(0).max(24),
});

router.post("/:groupId/mines/reveal", async (req, res) => {
  const parsed = minesRevealSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const round = await prisma.gameRound.findUnique({
    where: { id: parsed.data.roundId },
  });

  if (!round || round.groupId !== groupId || round.userId !== userId) {
    return res.status(404).json({ error: "Round not found" });
  }

  const state = round.result as MinesState;
  const nextState = revealTile(state, parsed.data.position);

  const update: Partial<MinesState> = {
    revealed: nextState.revealed,
    multiplier: nextState.multiplier,
    status: nextState.status,
  };

  const roundUpdate: { status?: "FINISHED"; finishedAt?: Date } = {};
  if (nextState.status === "BUST") {
    roundUpdate.status = "FINISHED";
    roundUpdate.finishedAt = new Date();
  }

  await prisma.$transaction(async (tx) => {
    await tx.gameRound.update({
      where: { id: round.id },
      data: { result: { ...state, ...update }, ...roundUpdate },
    });

    if (nextState.status === "BUST") {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "GAME_RESULT",
        amountMinor: 0,
        meta: {
          gameType: "MINES",
          roundId: round.id,
          description: "Mines bust",
        },
      });
    }
  });

  await broadcastGroupState(groupId);
  return res.json({
    status: nextState.status,
    revealed: nextState.revealed,
    multiplier: nextState.multiplier,
    hitMine: nextState.status === "BUST",
    minePositions: nextState.status === "BUST" ? state.minePositions : [],
  });
});

const minesCashoutSchema = z.object({
  roundId: z.string(),
});

router.post("/:groupId/mines/cashout", async (req, res) => {
  const parsed = minesCashoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const round = await prisma.gameRound.findUnique({
    where: { id: parsed.data.roundId },
  });

  if (!round || round.groupId !== groupId || round.userId !== userId) {
    return res.status(404).json({ error: "Round not found" });
  }

  const state = round.result as MinesState;
  const { state: nextState, payoutMinor } = cashOut(state);

  await prisma.$transaction(async (tx) => {
    await tx.gameRound.update({
      where: { id: round.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        result: nextState,
      },
    });

    if (payoutMinor > 0) {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "PAYOUT",
        amountMinor: payoutMinor,
        meta: {
          gameType: "MINES",
          roundId: round.id,
          description: "Mines cashout",
        },
      });
    }
  });

  await broadcastGroupState(groupId);
  return res.json({ payoutMinor, multiplier: nextState.multiplier });
});

const plinkoSchema = z.object({
  betMinor: z.number().int().positive(),
  rows: z.union([z.literal(8), z.literal(10), z.literal(12), z.literal(14), z.literal(16)]),
  risk: z.enum(["low", "medium", "high"]),
  slotIndex: z.number().int().min(0).max(16),
});

router.post("/:groupId/plinko/play", async (req, res) => {
  const parsed = plinkoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const { betMinor, rows, risk, slotIndex } = parsed.data;
  const { multiplier, payoutMinor } = settlePlinko({ betMinor, rows, risk, slotIndex });

  try {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -betMinor,
        meta: { gameType: "PLINKO", description: "Plinko drop", rows, risk, slotIndex },
      });

      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "GAME_RESULT",
        amountMinor: 0,
        meta: {
          gameType: "PLINKO",
          description: `Plinko multiplier: ${multiplier}x`,
          rows,
          risk,
          slotIndex,
        },
      });

      if (payoutMinor > 0) {
        await applyLedgerEntry(tx, {
          groupId,
          userId,
          type: "PAYOUT",
          amountMinor: payoutMinor,
          meta: { gameType: "PLINKO", description: "Plinko payout", rows, risk, slotIndex },
        });
      }
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json({ multiplier, payoutMinor, rows, risk, slotIndex });
});

const pokerCreateSchema = z.object({
  buyInMinor: z.number().int().positive(),
  minBetMinor: z.number().int().positive().optional(),
});

router.post("/:groupId/poker/create", async (req, res) => {
  const parsed = pokerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const activeRound = await prisma.gameRound.findFirst({
    where: { groupId, gameType: "POKER", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (activeRound) {
    return res.status(400).json({ error: "Poker game already active" });
  }

  const { buyInMinor, minBetMinor } = parsed.data;
  const nextState: PokerState = {
    status: "WAITING",
    potMinor: buyInMinor,
    buyInMinor,
    minBetMinor: minBetMinor || Math.max(100, Math.floor(buyInMinor * 0.1)),
    players: [
      {
        userId,
        buyInMinor,
        hand: [],
        folded: false,
        betMinor: 0,
      },
    ],
    community: [],
    deck: [],
    currentPlayerIndex: 0,
    currentBetMinor: 0,
  };

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.gameRound.create({
        data: {
          groupId,
          userId,
          gameType: "POKER",
          seed: "crypto",
          result: nextState,
        },
      });

      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -buyInMinor,
        meta: {
          gameType: "POKER",
          roundId: created.id,
          description: "Poker buy-in",
        },
      });
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  getSocketServer().to(`group:${groupId}`).emit("poker", { state: nextState });
  await broadcastGroupState(groupId);
  return res.json({ ok: true, state: nextState });
});

const pokerJoinSchema = z.object({
  buyInMinor: z.number().int().positive().optional(),
  useFullWallet: z.boolean().optional(),
});

router.post("/:groupId/poker/join", async (req, res) => {
  const parsed = pokerJoinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureActiveGroup(groupId);
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  const round = await prisma.gameRound.findFirst({
    where: { groupId, gameType: "POKER", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!round) {
    return res.status(404).json({ error: "No poker game to join" });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!wallet) {
    return res.status(404).json({ error: "Wallet not found" });
  }

  const state = round.result as PokerState;
  if (state.players.some((player) => player.userId === userId)) {
    return res.status(400).json({ error: "Already joined" });
  }

  const buyInMinor = parsed.data.useFullWallet
    ? wallet.creditsMinor
    : parsed.data.buyInMinor || state.buyInMinor;

  const nextState: PokerState = {
    ...state,
    potMinor: state.potMinor + buyInMinor,
    players: [
      ...state.players,
      {
        userId,
        buyInMinor,
        hand: [],
        folded: false,
        betMinor: 0,
      },
    ],
  };

  if (nextState.status === "WAITING" && nextState.players.length >= 2) {
    nextState.deck = buildDeck();
    nextState.players = nextState.players.map((player) => ({
      ...player,
      hand: [draw(nextState.deck), draw(nextState.deck)],
    }));
    nextState.status = "PREFLOP";
    nextState.currentPlayerIndex = 0;
    nextState.currentBetMinor = 0;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gameRound.update({
        where: { id: round.id },
        data: { result: nextState },
      });

      await applyLedgerEntry(tx, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -buyInMinor,
        meta: {
          gameType: "POKER",
          roundId: round.id,
          description: "Poker buy-in",
        },
      });
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  getSocketServer().to(`group:${groupId}`).emit("poker", { state: nextState });
  await broadcastGroupState(groupId);
  return res.json({ ok: true, state: nextState });
});

const pokerActionSchema = z.object({
  action: z.enum(["CHECK", "CALL", "BET", "FOLD"]),
  amountMinor: z.number().int().positive().optional(),
});

router.post("/:groupId/poker/action", async (req, res) => {
  const parsed = pokerActionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const round = await prisma.gameRound.findFirst({
    where: { groupId, gameType: "POKER", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!round) {
    return res.status(404).json({ error: "No active poker game" });
  }

  const state = round.result as PokerState;
  if (state.status === "WAITING") {
    return res.status(400).json({ error: "Game not started" });
  }

  const player = state.players[state.currentPlayerIndex];
  if (!player || player.userId !== userId) {
    return res.status(400).json({ error: "Not your turn" });
  }

  if (parsed.data.action === "FOLD") {
    player.folded = true;
  } else if (parsed.data.action === "CHECK") {
    if (player.betMinor !== state.currentBetMinor) {
      return res.status(400).json({ error: "Cannot check" });
    }
  } else if (parsed.data.action === "CALL") {
    const toPay = state.currentBetMinor - player.betMinor;
    if (toPay > 0) {
      try {
        await applyLedgerEntry(prisma, {
          groupId,
          userId,
          type: "BET",
          amountMinor: -toPay,
          meta: {
            gameType: "POKER",
            roundId: round.id,
            description: "Poker call",
          },
        });
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
      player.betMinor += toPay;
      state.potMinor += toPay;
    }
  } else if (parsed.data.action === "BET") {
    const target = parsed.data.amountMinor || 0;
    if (target < state.currentBetMinor + state.minBetMinor) {
      return res.status(400).json({ error: "Bet too small" });
    }
    const toPay = target - player.betMinor;
    try {
      await applyLedgerEntry(prisma, {
        groupId,
        userId,
        type: "BET",
        amountMinor: -toPay,
        meta: {
          gameType: "POKER",
          roundId: round.id,
          description: "Poker bet",
        },
      });
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
    player.betMinor += toPay;
    state.potMinor += toPay;
    state.currentBetMinor = target;
  }

  const activePlayers = state.players.filter((p) => !p.folded);
  if (activePlayers.length <= 1) {
    state.status = "SHOWDOWN";
  }

  if (state.status !== "SHOWDOWN" && allPlayersMatched(state.players, state.currentBetMinor)) {
    advancePhase(state);
  } else {
    state.currentPlayerIndex = getNextPlayerIndex(
      state.players,
      state.currentPlayerIndex,
    );
  }

  let winnerId: string | undefined;
  if (state.status === "SHOWDOWN") {
    const contenders = state.players.filter((p) => !p.folded);
    winnerId = contenders[Math.floor(Math.random() * contenders.length)]?.userId;
    state.winnerId = winnerId;
  }

  await prisma.gameRound.update({
    where: { id: round.id },
    data: { result: state },
  });

  if (state.status === "SHOWDOWN" && winnerId) {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId: winnerId,
        type: "PAYOUT",
        amountMinor: state.potMinor,
        meta: {
          gameType: "POKER",
          roundId: round.id,
          description: "Poker payout",
        },
      });
      await tx.gameRound.update({
        where: { id: round.id },
        data: { status: "FINISHED", finishedAt: new Date() },
      });
    });
  }

  getSocketServer().to(`group:${groupId}`).emit("poker", { state });
  await broadcastGroupState(groupId);
  return res.json({ ok: true, state });
});

router.get("/:groupId/poker/status", async (req, res) => {
  const groupId = req.params.groupId;
  const round = await prisma.gameRound.findFirst({
    where: { groupId, gameType: "POKER", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!round) {
    return res.json({ round: null });
  }

  return res.json({ round });
});

const rouletteBetSchema = z.object({
  betType: z.enum(["red", "black", "green"]),
  amountMinor: z.number().int().positive(),
});

router.post("/:groupId/roulette/bet", async (req, res) => {
  const parsed = rouletteBetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await placeRouletteBet({
      groupId,
      userId,
      betType: parsed.data.betType,
      selection: null,
      amountMinor: parsed.data.amountMinor,
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await broadcastGroupState(groupId);
  return res.json({ ok: true });
});

router.get("/:groupId/roulette/bets", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  try {
    await ensureMembership(groupId, userId);
  } catch (error) {
    return res.status(403).json({ error: (error as Error).message });
  }

  const round = await prisma.gameRound.findFirst({
    where: { groupId, gameType: "ROULETTE", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!round) {
    return res.json({ round: null, bets: [] });
  }

  const bets = await prisma.gameBet.findMany({
    where: { roundId: round.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return res.json({
    round: { id: round.id, result: round.result },
    bets: bets.map((b) => ({
      id: b.id,
      userId: b.userId,
      username: b.user.username,
      amountMinor: b.amountMinor,
      selection: b.selection,
    })),
  });
});

export async function startRouletteRound(groupId: string) {
  const round = await prisma.gameRound.create({
    data: {
      groupId,
      gameType: "ROULETTE",
      seed: "crypto",
      result: {
        bettingEndsAt: Date.now() + config.rouletteCountdownSeconds * 1000,
      },
    },
  });

  const io = getSocketServer();
  io.to(`group:${groupId}`).emit("roulette", {
    secondsLeft: config.rouletteCountdownSeconds,
    roundId: round.id,
  });
}

export async function finalizeRouletteRound(roundId: string) {
  const round = await prisma.gameRound.findUnique({ where: { id: roundId } });
  if (!round || round.status !== "ACTIVE") {
    return;
  }

  const result = spinRoulette();
  const bets = await prisma.gameBet.findMany({
    where: { roundId },
  });

  const payouts: { userId: string; payoutMinor: number }[] = [];
  await prisma.$transaction(async (tx) => {
    for (const bet of bets) {
      const selection = bet.selection as RouletteBet;
      const { payoutMinor } = resolveRouletteBet(
        selection,
        result,
        bet.amountMinor,
      );

      await applyLedgerEntry(tx, {
        groupId: round.groupId,
        userId: bet.userId,
        type: "GAME_RESULT",
        amountMinor: 0,
        meta: {
          gameType: "ROULETTE",
          roundId,
          description: `Roulette result: ${result.color} ${payoutMinor > 0 ? "(win)" : "(loss)"}`,
        },
      });

      if (payoutMinor > 0) {
        await applyLedgerEntry(tx, {
          groupId: round.groupId,
          userId: bet.userId,
          type: "PAYOUT",
          amountMinor: payoutMinor,
          meta: {
            gameType: "ROULETTE",
            roundId,
            description: "Roulette payout",
          },
        });
      }

      await tx.gameBet.update({
        where: { id: bet.id },
        data: { payoutMinor },
      });
      payouts.push({ userId: bet.userId, payoutMinor });
    }

    await tx.gameRound.update({
      where: { id: roundId },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        result,
      },
    });
  });

  const io = getSocketServer();
  io.to(`group:${round.groupId}`).emit("roulette", {
    color: result.color,
    stopRotationDeg: result.stopRotationDeg,
    wheelIndex: (result as any).wheelIndex,
    winningNumber: (result as any).winningNumber,
    payouts,
  });
  await broadcastGroupState(round.groupId);
}


export default router;
