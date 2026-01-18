"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { getSocket } from "../../../../lib/socket";
import { formatCredits } from "../../../../lib/credits";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Check, Clock, Copy, Sparkles, Trophy, Users } from "lucide-react";

const games = [
  {
    slug: "coinflip",
    name: "Coinflip",
    desc: "Pick heads/tails. Win pays 2x.",
    img: "/darepot/dice-rolling-neon-glow.jpg",
  },
  {
    slug: "blackjack",
    name: "Blackjack",
    desc: "Beat the dealer to 21.",
    img: "/darepot/blackjack-cards-casino-neon.jpg",
  },
  {
    slug: "mines",
    name: "Mines",
    desc: "Reveal safe tiles and cash out.",
    img: "/darepot/mines-grid-game-neon-gems.jpg",
  },
  {
    slug: "plinko",
    name: "Plinko",
    desc: "Drop a ball for a multiplier.",
    img: "/darepot/plinko-balls-pyramid-neon.jpg",
  },
  {
    slug: "roulette",
    name: "Roulette",
    desc: "Bet red/black/green.",
    img: "/darepot/roulette-wheel-casino-neon.jpg",
  },
  {
    slug: "poker",
    name: "Poker",
    desc: "Create a table and play.",
    img: "/darepot/poker-cards-chips-neon-green.jpg",
  },
];

type GroupInfo = {
  id: string;
  name: string;
  inviteCode: string;
  isUnlimited: boolean;
  status: string;
};

type UserStats = {
  balanceMinor: number;
};

type LeaderboardEntry = {
  userId: string;
  username: string;
  creditsMinor: number;
  rank: number;
};

export default function GroupGamesPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timer, setTimer] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedTimer = useMemo(() => {
    if (isUnlimited) return "Unlimited";
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timer, isUnlimited]);

  const top3 = useMemo(() => {
    // Highest balance first → top3 = current leaders
    return [...leaderboard].sort((a, b) => b.creditsMinor - a.creditsMinor).slice(0, 3);
  }, [leaderboard]);

  async function loadGroup() {
    const data = await apiFetch<GroupInfo>(`/api/groups/${groupId}`);
    setGroup(data);
  }

  async function loadStats() {
    const data = await apiFetch<{ userStats: UserStats }>(
      `/api/groups/${groupId}/activity`,
    );
    setStats(data.userStats);
  }

  async function loadLeaderboard() {
    const data = await apiFetch<LeaderboardEntry[]>(
      `/api/groups/${groupId}/leaderboard`,
    );
    setLeaderboard(data);
  }

  useEffect(() => {
    async function boot() {
      try {
        await Promise.all([loadGroup(), loadStats(), loadLeaderboard()]);
      } catch (err) {
        const error = err as Error & { status?: number };
        if (error.status === 401) router.push("/?auth=login");
      }
    }
    void boot();

    const socket = getSocket();
    socket.emit("group", { groupId });
    socket.on("group", (payload) => {
      if (payload.timer !== undefined && payload.timer !== null) setTimer(payload.timer);
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
  }, [groupId, router]);

  function copyInvite() {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="space-y-8">
      {/* Hero banner (folder-10-ish) */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/5 via-transparent to-magenta/5" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {group ? (
                  <>
                    {group.name} <span className="text-gradient">Games</span>
                  </>
                ) : (
                  <>
                    Games <span className="text-gradient">Dashboard</span>
                  </>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{leaderboard.length || "…" } members</span>
                </div>
                <div className="flex items-center gap-2 text-yellow">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formattedTimer}</span>
                </div>
                {group ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-neon-lime/10 border border-neon-lime/20 text-neon-lime font-medium">
                      {group.status}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {group ? (
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-surface-elevated bg-transparent"
                  onClick={copyInvite}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-neon-lime" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-mono">{group.inviteCode}</span>
                </Button>
              ) : null}
              <Link href={`/groups/${groupId}`}>
                <Button className="bg-neon-lime text-background hover:bg-neon-lime/90 font-semibold">
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Your balance</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {stats ? formatCredits(stats.balanceMinor) : "Loading…"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Top 3 leaders</p>
          <div className="mt-2 space-y-1 text-sm">
            {top3.length ? (
              top3.map((e, i) => (
                <div key={e.userId} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground w-6">#{i + 1}</span>
                  <span className="flex-1 truncate font-semibold text-foreground">
                    {e.username}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatCredits(e.creditsMinor)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Loading…</p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pick a game</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-neon-lime font-semibold">Tip:</span> don&apos;t be the brokest.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-lime/10 border border-neon-lime/20">
            <Sparkles className="w-4 h-4 text-neon-lime" />
            <span className="text-neon-lime font-medium text-sm">Let it rip</span>
          </div>
        </Card>
      </div>

      {/* Game grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {games.map((g) => (
          <Link key={g.slug} href={`/groups/${groupId}/${g.slug}`}>
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-neon-lime/50 neon-glow-hover">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `url(${g.img})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-2xl font-bold">{g.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

