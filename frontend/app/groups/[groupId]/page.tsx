"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";
import { formatCredits } from "../../../lib/credits";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import {
  Crown,
  Minus,
  Skull,
  Trophy,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  creditsMinor: number;
};

type UserStats = {
  balanceMinor: number;
  netChangeMinor: number;
  totalWonMinor: number;
  totalLostMinor: number;
};

type GroupInfo = {
  id: string;
  name: string;
  inviteCode: string;
  isUnlimited: boolean;
  status: string;
};

const START_BALANCE_MINOR = 100000; // keep in sync with backend default start credits

export default function GroupLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [timer, setTimer] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);

  const formattedTimer = useMemo(() => {
    if (isUnlimited) return "Unlimited";
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timer, isUnlimited]);

  const leaderboardRows = useMemo(() => {
    // Leaderboard API returns ranks, but we also want stable sort + change values.
    // Highest balance first (goal: don't be the brokest)
    const sorted = [...leaderboard].sort((a, b) => b.creditsMinor - a.creditsMinor);
    return sorted.map((entry, idx) => ({
      ...entry,
      position: idx,
      changeMinor: entry.creditsMinor - START_BALANCE_MINOR,
    }));
  }, [leaderboard]);

  const podium = useMemo(() => {
    return leaderboardRows.slice(0, 3);
  }, [leaderboardRows]);

  const getPositionStyle = (position: number) => {
    if (position === 0) return "bg-yellow/10 border-yellow/30";
    if (position === 1) return "bg-muted/10 border-muted/30";
    if (position === 2) return "bg-[#CD7F32]/10 border-[#CD7F32]/30";
    if (position === leaderboardRows.length - 1)
      return "bg-magenta/10 border-magenta/30";
    return "bg-surface border-border";
  };

  const getPositionIcon = (position: number) => {
    if (position === 0) return <Crown className="w-5 h-5 text-yellow" />;
    if (position === leaderboardRows.length - 1)
      return <Skull className="w-5 h-5 text-magenta" />;
    return <span className="text-muted-foreground font-bold">#{position + 1}</span>;
  };

  const getChangeBadge = (changeMinor: number) => {
    if (changeMinor > 0) {
      return (
        <span className="flex items-center gap-1 text-sm text-neon-lime">
          <TrendingUp className="w-3.5 h-3.5" />
          +{formatCredits(changeMinor)}
        </span>
      );
    }
    if (changeMinor < 0) {
      return (
        <span className="flex items-center gap-1 text-sm text-magenta">
          <TrendingDown className="w-3.5 h-3.5" />
          {formatCredits(changeMinor)}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="w-3.5 h-3.5" />
        {formatCredits(0)}
      </span>
    );
  };

  async function loadGroup() {
    try {
      const data = await apiFetch<GroupInfo>(`/api/groups/${groupId}`);
      setGroup(data);
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 401) router.push("/?auth=login");
    }
  }

  async function loadActivity() {
    try {
      const data = await apiFetch<{
        userStats: UserStats;
      }>(`/api/groups/${groupId}/activity`);
      setStats(data.userStats);
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 401) {
        router.push("/?auth=login");
      }
    }
  }

  async function loadLeaderboard() {
    try {
      const data = await apiFetch<LeaderboardEntry[]>(
        `/api/groups/${groupId}/leaderboard`,
      );
      setLeaderboard(data);
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 401) {
        router.push("/?auth=login");
      }
    }
  }

  useEffect(() => {
    loadGroup();
    loadActivity();
    loadLeaderboard();
    const socket = getSocket();
    socket.emit("group", { groupId });
    socket.on("group", (payload) => {
      if (payload.timer !== undefined && payload.timer !== null) {
        setTimer(payload.timer);
      }
      if (payload.isUnlimited !== undefined) setIsUnlimited(payload.isUnlimited);
      if (payload.leaderboard) setLeaderboard(payload.leaderboard);
    });
    socket.on("leaderboard", (payload) => setLeaderboard(payload));
    socket.on("activity", (payload) => {
      if (payload.userStats) setStats(payload.userStats);
    });
    return () => {
      socket.off("group");
      socket.off("leaderboard");
      socket.off("activity");
    };
  }, [groupId]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="w-7 h-7 text-yellow" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            {group ? (
              <>
                <span className="text-foreground font-semibold">{group.name}</span>
                <span className="mx-2">•</span>
              </>
            ) : null}
            Don&apos;t be the brokest.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Time left</p>
          <p className="mt-1 text-xl font-bold">{formattedTimer}</p>
        </Card>
        <Card className="p-4 md:col-span-3">
          <p className="text-sm text-muted-foreground">Your session</p>
          {stats ? (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Balance</p>
                <p className="font-semibold">{formatCredits(stats.balanceMinor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net</p>
                <p className="font-semibold">{formatCredits(stats.netChangeMinor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Won</p>
                <p className="font-semibold">{formatCredits(stats.totalWonMinor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lost</p>
                <p className="font-semibold">{formatCredits(stats.totalLostMinor)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
          )}
        </Card>
      </div>

      {/* Podium (top 3) */}
      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
        {podium.map((entry, index) => {
          const order = [1, 0, 2][index];
          const actual = podium[order];
          if (!actual) return null;
          const border =
            order === 0
              ? "bg-yellow/10 border-yellow/30 -mt-3"
              : order === 1
              ? "bg-muted/10 border-muted/30"
              : "bg-[#CD7F32]/10 border-[#CD7F32]/30";
          const badge =
            order === 0
              ? "bg-yellow text-background"
              : order === 1
              ? "bg-muted text-foreground"
              : "bg-[#CD7F32] text-background";
          return (
            <div
              key={actual.userId}
              className={cn(
                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                border,
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold",
                  badge,
                )}
              >
                {order + 1}
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-border bg-surface-elevated flex items-center justify-center mb-2">
                <span className="text-lg font-bold text-foreground">
                  {actual.username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="font-semibold text-foreground text-center">
                {actual.username}
              </span>
              <span className="text-xl font-bold text-foreground">
                {formatCredits(actual.creditsMinor)}
              </span>
              {getChangeBadge(actual.changeMinor)}
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {leaderboardRows.map((entry) => (
          <Link
            key={entry.userId}
            href={`/groups/${groupId}/members/${entry.userId}`}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border transition-all hover:bg-surface-elevated",
              getPositionStyle(entry.position),
            )}
          >
            <div className="w-8 flex justify-center">{getPositionIcon(entry.position)}</div>

            <div className="w-10 h-10 rounded-full border border-border bg-surface-elevated flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">
                {entry.username.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground">{entry.username}</span>
              {entry.position === leaderboardRows.length - 1 ? (
                <span className="ml-2 text-xs text-magenta">BROKE ZONE 💀</span>
              ) : null}
            </div>

            <div className="text-right">
              <div className="font-bold text-foreground">
                {formatCredits(entry.creditsMinor)}
              </div>
              <div className="flex items-center justify-end">
                {getChangeBadge(entry.changeMinor)}
              </div>
            </div>
          </Link>
        ))}
        {leaderboardRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading leaderboard…
          </div>
        ) : null}
      </div>
    </main>
  );
}
