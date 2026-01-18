import { Router } from "express";
import { z } from "zod";
import prisma from "../db";
import { AuthedRequest } from "../middleware/auth";
import { config } from "../config";
import { generateInviteCode } from "../utils/invite";
import { getGroupActivity, getLeaderboard, getMemberProfile, getSpiderStats, getUserStats } from "../services/groupStats";
import { applyLedgerEntry } from "../services/ledger";

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(2),
  durationDays: z.number().int().min(0).max(30).default(0),
  durationHours: z.number().int().min(0).max(23).default(0),
  durationMinutes: z.number().int().min(0).max(59).default(0),
  isUnlimited: z.boolean().default(false),
});

router.post("/", async (req, res) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { name, durationDays, durationHours, durationMinutes, isUnlimited } =
    parsed.data;
  const userId = (req as AuthedRequest).userId;
  const inviteCode = generateInviteCode();
  const totalMinutes = durationDays * 24 * 60 + durationHours * 60 + durationMinutes;
  if (!isUnlimited && totalMinutes <= 0) {
    return res.status(400).json({ error: "Duration required" });
  }
  const endsAt = isUnlimited ? null : new Date(Date.now() + totalMinutes * 60 * 1000);

  const group = await prisma.group.create({
    data: {
      name,
      createdByUserId: userId,
      durationDays,
      durationHours,
      durationMinutes,
      isUnlimited,
      inviteCode,
      endsAt,
      members: { create: { userId, role: "ADMIN" } },
      wallets: { create: { userId, creditsMinor: config.creditsStartMinor } },
    },
  });

  return res.json(group);
});

const joinSchema = z.object({
  inviteCode: z.string().min(4),
});

router.post("/join", async (req, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const userId = (req as AuthedRequest).userId;
  const group = await prisma.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
  });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
  });

  if (!membership) {
    await prisma.groupMember.create({
      data: { groupId: group.id, userId, role: "MEMBER" },
    });
    await prisma.wallet.create({
      data: {
        groupId: group.id,
        userId,
        creditsMinor: config.creditsStartMinor,
      },
    });
  }

  return res.json(group);
});

router.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });

  return res.json(
    memberships.map((membership) => ({
      ...membership.group,
      joinedAt: membership.joinedAt,
    })),
  );
});

router.post("/:groupId/leave", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    return res.status(404).json({ error: "Not a member" });
  }

  // If admin, ensure there is another admin before leaving
  if (membership.role === "ADMIN") {
    const otherAdmins = await prisma.groupMember.count({
      where: { groupId, role: "ADMIN", NOT: { userId } },
    });
    if (otherAdmins === 0) {
      return res.status(400).json({
        error: "You are the last admin. Delete the group instead of leaving.",
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
    await tx.wallet.deleteMany({
      where: { groupId, userId },
    });
  });

  return res.json({ ok: true });
});

router.delete("/:groupId", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: "Group not found" });

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) return res.status(403).json({ error: "Not a member" });

  // Only the creator can delete (fallback: allow admin if createdByUserId missing)
  const isCreator = !!group.createdByUserId && group.createdByUserId === userId;
  const canDelete = isCreator || (!group.createdByUserId && membership.role === "ADMIN");
  if (!canDelete) {
    return res.status(403).json({ error: "Only the group creator can delete this group" });
  }

  // Delete all group data in a transaction (order matters for FK constraints)
  await prisma.$transaction(async (tx) => {
    await tx.gameBet.deleteMany({ where: { round: { groupId } } });
    await tx.gameRound.deleteMany({ where: { groupId } });
    await tx.transaction.deleteMany({ where: { groupId } });
    await tx.wallet.deleteMany({ where: { groupId } });
    await tx.groupMember.deleteMany({ where: { groupId } });
    await tx.group.delete({ where: { id: groupId } });
  });

  return res.json({ ok: true });
});

router.get("/:groupId/leaderboard", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) {
    return res.status(403).json({ error: "Not a member" });
  }
  const leaderboard = await getLeaderboard(groupId);
  return res.json(leaderboard);
});

router.get("/:groupId", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) {
    return res.status(403).json({ error: "Not a member" });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      durationDays: true,
      durationHours: true,
      durationMinutes: true,
      isUnlimited: true,
      status: true,
      startsAt: true,
      endsAt: true,
      createdByUserId: true,
    },
  });
  if (!group) return res.status(404).json({ error: "Group not found" });

  return res.json({ ...group, myRole: member.role });
});

router.get("/:groupId/activity", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) {
    return res.status(403).json({ error: "Not a member" });
  }
  const [activity, userStats] = await Promise.all([
    getGroupActivity(groupId),
    getUserStats(groupId, userId),
  ]);
  return res.json({ latestEntries: activity, userStats });
});

router.get("/:groupId/members/:memberUserId/profile", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const memberUserId = req.params.memberUserId;

  const viewer = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!viewer) {
    return res.status(403).json({ error: "Not a member" });
  }

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberUserId } },
  });
  if (!target) {
    return res.status(404).json({ error: "Member not found" });
  }

  try {
    const profile = await getMemberProfile(groupId, memberUserId);
    return res.json(profile);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.get("/:groupId/members/:memberUserId/spider", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const memberUserId = req.params.memberUserId;

  const viewer = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!viewer) return res.status(403).json({ error: "Not a member" });

  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberUserId } },
  });
  if (!target) return res.status(404).json({ error: "Member not found" });

  try {
    const spider = await getSpiderStats(groupId, memberUserId);
    return res.json(spider);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

const transferSchema = z.object({
  toUsername: z.string().min(3),
  amountMinor: z.number().int().positive(),
});

router.post("/:groupId/transfer", async (req, res) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const groupId = req.params.groupId;
  const fromUserId = (req as AuthedRequest).userId;
  const { toUsername, amountMinor } = parsed.data;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.status !== "ACTIVE") {
    return res.status(400).json({ error: "Group is frozen" });
  }

  const toUser = await prisma.user.findUnique({
    where: { username: toUsername },
  });

  if (!toUser) {
    return res.status(404).json({ error: "Recipient not found" });
  }

  if (toUser.id === fromUserId) {
    return res.status(400).json({ error: "Cannot transfer to self" });
  }

  const [fromMember, toMember] = await Promise.all([
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: fromUserId } },
    }),
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: toUser.id } },
    }),
  ]);

  if (!fromMember || !toMember) {
    return res.status(400).json({ error: "Both users must be in group" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await applyLedgerEntry(tx, {
        groupId,
        userId: fromUserId,
        relatedUserId: toUser.id,
        type: "TRANSFER",
        amountMinor: -amountMinor,
        meta: { description: `Transfer sent to ${toUser.username}` },
      });

      const sender = await tx.user.findUnique({ where: { id: fromUserId } });

      await applyLedgerEntry(tx, {
        groupId,
        userId: toUser.id,
        relatedUserId: fromUserId,
        type: "TRANSFER",
        amountMinor,
        meta: {
          description: `Transfer received from ${sender?.username || "Unknown"}`,
        },
      });
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await import("../socket").then(({ broadcastGroupState }) =>
    broadcastGroupState(groupId),
  );
  return res.json({ ok: true });
});

async function requireAdmin(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new Error("Not a member");
  if (member.role !== "ADMIN") throw new Error("Admin only");
  return member;
}

router.delete("/:groupId/members/:memberUserId", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;
  const memberUserId = req.params.memberUserId;

  try {
    await requireAdmin(groupId, userId);
  } catch (error) {
    return res.status(403).json({ error: (error as Error).message });
  }

  if (memberUserId === userId) {
    return res.status(400).json({ error: "Admin cannot kick self" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.wallet.deleteMany({
        where: { groupId, userId: memberUserId },
      });
      await tx.groupMember.deleteMany({
        where: { groupId, userId: memberUserId },
      });
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  await import("../socket").then(({ broadcastGroupState }) =>
    broadcastGroupState(groupId),
  );
  return res.json({ ok: true });
});

router.delete("/:groupId", async (req, res) => {
  const groupId = req.params.groupId;
  const userId = (req as AuthedRequest).userId;

  try {
    await requireAdmin(groupId, userId);
  } catch (error) {
    return res.status(403).json({ error: (error as Error).message });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gameBet.deleteMany({ where: { round: { groupId } } });
      await tx.gameRound.deleteMany({ where: { groupId } });
      await tx.transaction.deleteMany({ where: { groupId } });
      await tx.wallet.deleteMany({ where: { groupId } });
      await tx.groupMember.deleteMany({ where: { groupId } });
      await tx.group.delete({ where: { id: groupId } });
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }

  return res.json({ ok: true });
});

export default router;
