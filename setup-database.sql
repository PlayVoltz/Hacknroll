-- Complete Database Setup for Hacknroll
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- STEP 1: Run Migration (Creates Tables)
-- =====================================================

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'FROZEN');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BET', 'PAYOUT', 'TRANSFER', 'GAME_RESULT');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('COINFLIP', 'BLACKJACK', 'MINES', 'PLINKO', 'POKER', 'ROULETTE');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "profileImageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Group" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "inviteCode" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "durationDays" INTEGER NOT NULL DEFAULT 0,
  "durationHours" INTEGER NOT NULL DEFAULT 0,
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
  "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GroupMember" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Wallet" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "creditsMinor" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "relatedUserId" TEXT,
  "type" "TransactionType" NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "meta" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GameRound" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT,
  "gameType" "GameType" NOT NULL,
  "status" "RoundStatus" NOT NULL DEFAULT 'ACTIVE',
  "seed" TEXT NOT NULL,
  "result" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),

  CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GameBet" (
  "id" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "selection" JSONB NOT NULL,
  "payoutMinor" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GameBet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Group_inviteCode_key" ON "Group"("inviteCode");
CREATE UNIQUE INDEX IF NOT EXISTS "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");
CREATE INDEX IF NOT EXISTS "GroupMember_groupId_idx" ON "GroupMember"("groupId");
CREATE INDEX IF NOT EXISTS "GroupMember_userId_idx" ON "GroupMember"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_groupId_userId_key" ON "Wallet"("groupId", "userId");
CREATE INDEX IF NOT EXISTS "Wallet_groupId_idx" ON "Wallet"("groupId");
CREATE INDEX IF NOT EXISTS "Wallet_userId_idx" ON "Wallet"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_groupId_idx" ON "Transaction"("groupId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "GameRound_groupId_idx" ON "GameRound"("groupId");
CREATE INDEX IF NOT EXISTS "GameRound_gameType_idx" ON "GameRound"("gameType");
CREATE INDEX IF NOT EXISTS "GameBet_roundId_idx" ON "GameBet"("roundId");
CREATE INDEX IF NOT EXISTS "GameBet_userId_idx" ON "GameBet"("userId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GroupMember_groupId_fkey'
  ) THEN
    ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" 
      FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GroupMember_userId_fkey'
  ) THEN
    ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_groupId_fkey'
  ) THEN
    ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_groupId_fkey" 
      FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Wallet_userId_fkey'
  ) THEN
    ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_groupId_fkey'
  ) THEN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_groupId_fkey" 
      FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_userId_fkey'
  ) THEN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GameRound_groupId_fkey'
  ) THEN
    ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_groupId_fkey" 
      FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GameRound_userId_fkey'
  ) THEN
    ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GameBet_roundId_fkey'
  ) THEN
    ALTER TABLE "GameBet" ADD CONSTRAINT "GameBet_roundId_fkey" 
      FOREIGN KEY ("roundId") REFERENCES "GameRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GameBet_userId_fkey'
  ) THEN
    ALTER TABLE "GameBet" ADD CONSTRAINT "GameBet_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Seed Demo Data
-- =====================================================

-- Insert demo users (password: password123)
INSERT INTO "User" (id, email, username, "passwordHash", "createdAt") VALUES
  ('clx00000000000000000000alex', 'alex@example.com', 'Alex', '$2b$10$Onm9p4Lp9T0sXquLgynDPO0GRBcK84CkUMeKMQRYKOYPaZHLdP.0e', NOW()),
  ('clx000000000000000000000sam', 'sam@example.com', 'Sam', '$2b$10$Onm9p4Lp9T0sXquLgynDPO0GRBcK84CkUMeKMQRYKOYPaZHLdP.0e', NOW())
ON CONFLICT (email) DO NOTHING;

-- Create demo group
INSERT INTO "Group" (id, name, "inviteCode", "isUnlimited", status, "startsAt", "createdAt") VALUES
  ('clx00000000000000000000grp1', 'Friday Night', 'FRIDAY42', true, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add users to group
INSERT INTO "GroupMember" (id, "groupId", "userId", role, "joinedAt") VALUES
  ('clx00000000000000000000mem1', 'clx00000000000000000000grp1', 'clx00000000000000000000alex', 'MEMBER', NOW()),
  ('clx00000000000000000000mem2', 'clx00000000000000000000grp1', 'clx000000000000000000000sam', 'MEMBER', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create wallets (starting with 100,000 credits = 100 credits in display)
INSERT INTO "Wallet" (id, "groupId", "userId", "creditsMinor", "createdAt") VALUES
  ('clx00000000000000000000wal1', 'clx00000000000000000000grp1', 'clx00000000000000000000alex', 100000, NOW()),
  ('clx00000000000000000000wal2', 'clx00000000000000000000grp1', 'clx000000000000000000000sam', 100000, NOW())
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database setup complete! Demo users: alex@example.com / sam@example.com (password: password123)' as status;
