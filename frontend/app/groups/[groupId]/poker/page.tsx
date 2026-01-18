"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { getSocket } from "../../../../lib/socket";
import { creditsToMinor, formatCredits } from "../../../../lib/credits";
import { normalizeNumberInput } from "../../../../lib/inputs";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { useAuth } from "../../../../components/auth/AuthProvider";
import { cn } from "../../../../lib/utils";
import { Check, ChevronRight, Club, Diamond, Heart, Spade } from "lucide-react";

type PokerState = {
  status: "WAITING" | "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
  potMinor: number;
  buyInMinor: number;
  minBetMinor: number;
  players: {
    userId: string;
    buyInMinor: number;
    hand: { suit: string; rank: string }[];
    folded: boolean;
    betMinor: number;
  }[];
  community: { suit: string; rank: string }[];
  currentPlayerIndex: number;
  currentBetMinor: number;
  winnerId?: string;
};

type LeaderboardEntry = {
  userId: string;
  username: string;
};

function suitIcon(suit: string) {
  const base = "h-4 w-4";
  if (suit === "♥") return <Heart className={cn(base, "text-magenta")} />;
  if (suit === "♦") return <Diamond className={cn(base, "text-magenta")} />;
  if (suit === "♣") return <Club className={cn(base, "text-foreground")} />;
  return <Spade className={cn(base, "text-foreground")} />;
}

function PokerCardView({
  card,
  hidden,
}: {
  card: { suit: string; rank: string } | null;
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <div className="h-14 w-10 rounded-lg border border-border bg-surface-elevated shadow-sm" />
    );
  }
  if (!card) {
    return (
      <div className="h-14 w-10 rounded-lg border border-border bg-surface/40" />
    );
  }

  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className="h-14 w-10 rounded-lg border border-border bg-background shadow-sm">
      <div className="flex h-full flex-col justify-between p-1">
        <div className={cn("text-xs font-bold leading-none", isRed ? "text-magenta" : "text-foreground")}>
          {card.rank}
        </div>
        <div className="flex justify-end">{suitIcon(card.suit)}</div>
      </div>
    </div>
  );
}

export default function PokerPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { me } = useAuth();
  const [buyInCredits, setBuyInCredits] = useState<number | null>(50);
  const [minBetCredits, setMinBetCredits] = useState<number | null>(5);
  const [useFullWallet, setUseFullWallet] = useState(false);
  const [state, setState] = useState<PokerState | null>(null);
  const [message, setMessage] = useState("");
  const [betCredits, setBetCredits] = useState<number | null>(5);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const data = await apiFetch<{ round: { result: PokerState } | null }>(
        `/api/groups/${groupId}/poker/status`,
      );
      if (data.round) {
        setState(data.round.result);
      }
    }
    loadStatus();

    async function loadNames() {
      try {
        const lb = await apiFetch<LeaderboardEntry[]>(
          `/api/groups/${groupId}/leaderboard`,
        );
        const next: Record<string, string> = {};
        for (const e of lb) next[e.userId] = e.username;
        setNameByUserId(next);
      } catch {
        // non-fatal; we'll fall back to userId display
      }
    }
    loadNames();

    const socket = getSocket();
    socket.emit("group", { groupId });
    socket.on("poker", (payload) => {
      if (payload.state) {
        setState(payload.state);
      }
    });
    return () => {
      socket.off("poker");
    };
  }, [groupId]);

  const myUserId = me?.id ?? null;
  const isMyTurn = useMemo(() => {
    if (!state || myUserId == null) return false;
    const p = state.players[state.currentPlayerIndex];
    return !!p && p.userId === myUserId;
  }, [state, myUserId]);

  const currentPlayer = state?.players?.[state.currentPlayerIndex] ?? null;
  const meInGame = useMemo(() => {
    if (!state || !myUserId) return false;
    return state.players.some((p) => p.userId === myUserId);
  }, [state, myUserId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      if (!buyInCredits || buyInCredits <= 0) throw new Error("Buy-in required");
      if (!minBetCredits || minBetCredits <= 0) throw new Error("Min bet required");
      await apiFetch(`/api/groups/${groupId}/poker/create`, {
        method: "POST",
        body: JSON.stringify({
          buyInMinor: creditsToMinor(buyInCredits),
          minBetMinor: creditsToMinor(minBetCredits),
        }),
      });
      setMessage("Table created.");
      setShowCreate(false);
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      if (!useFullWallet && (!buyInCredits || buyInCredits <= 0)) {
        throw new Error("Buy-in required");
      }
      await apiFetch(`/api/groups/${groupId}/poker/join`, {
        method: "POST",
        body: JSON.stringify({
          buyInMinor: useFullWallet ? undefined : creditsToMinor(buyInCredits),
          useFullWallet,
        }),
      });
      setMessage("Joined table.");
      setShowJoin(false);
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  async function handleAction(action: "CHECK" | "CALL" | "BET" | "FOLD") {
    try {
      await apiFetch(`/api/groups/${groupId}/poker/action`, {
        method: "POST",
        body: JSON.stringify({
          action,
          amountMinor:
            action === "BET" && betCredits ? creditsToMinor(betCredits) : undefined,
        }),
      });
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Poker</h1>
          <p className="text-muted-foreground">
            Texas Hold&apos;em vibes. Create a table, join, and play.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/groups/${groupId}/games`)}
          >
            Back to Games
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/5 via-transparent to-magenta/5" />
            <div className="relative p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="text-lg font-bold text-foreground">
                    Pot <span className="font-mono">{state ? formatCredits(state.potMinor) : "—"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status{" "}
                    <span className="font-semibold text-foreground">{state?.status || "—"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!state ? (
                    <>
                      <Button
                        className="bg-neon-lime text-background hover:bg-neon-lime/90 font-semibold"
                        onClick={() => setShowCreate(true)}
                      >
                        Create Table
                      </Button>
                      <Button
                        variant="outline"
                        className="border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10 bg-transparent"
                        onClick={() => setShowJoin(true)}
                      >
                        Join Table
                      </Button>
                    </>
                  ) : (
                    <>
                      {!meInGame ? (
                        <Button
                          className="bg-neon-lime text-background hover:bg-neon-lime/90 font-semibold"
                          onClick={() => setShowJoin(true)}
                        >
                          Join Table
                        </Button>
                      ) : null}
                      <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Current bet </span>
                        <span className="font-mono text-foreground">
                          {state ? formatCredits(state.currentBetMinor) : "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Felt */}
              <div className="mt-6 rounded-2xl border border-border bg-[#0b2b1c] p-5 shadow-inner">
                {/* Community cards */}
                <div className="flex items-center justify-center gap-2">
                  {(state?.community?.length ? state.community : [null, null, null, null, null]).map(
                    (c, idx) => (
                      <PokerCardView key={idx} card={c as any} />
                    ),
                  )}
                </div>

                {/* Players list (compact, folder-10-ish cards) */}
                <div className="mt-6 grid gap-2 md:grid-cols-2">
                  {state?.players?.length ? (
                    state.players.map((p, idx) => {
                      const display = nameByUserId[p.userId] || p.userId;
                      const isCurrent = idx === state.currentPlayerIndex;
                      const isMe = myUserId != null && p.userId === myUserId;
                      const hideHand = !isMe && state.status !== "SHOWDOWN";
                      return (
                        <div
                          key={p.userId}
                          className={cn(
                            "rounded-xl border bg-surface/60 p-3",
                            isCurrent ? "border-neon-lime/50" : "border-border",
                            p.folded && "opacity-60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-sm font-bold truncate", isCurrent ? "text-neon-lime" : "text-foreground")}>
                                  {display}
                                </span>
                                {isMe ? (
                                  <span className="rounded-full border border-neon-lime/30 bg-neon-lime/10 px-2 py-0.5 text-[10px] font-semibold text-neon-lime">
                                    YOU
                                  </span>
                                ) : null}
                                {p.folded ? (
                                  <span className="rounded-full border border-magenta/30 bg-magenta/10 px-2 py-0.5 text-[10px] font-semibold text-magenta">
                                    FOLDED
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Buy-in{" "}
                                <span className="font-mono text-foreground">
                                  {formatCredits(p.buyInMinor)}
                                </span>{" "}
                                • Bet{" "}
                                <span className="font-mono text-foreground">
                                  {formatCredits(p.betMinor)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <PokerCardView card={p.hand?.[0] ?? null} hidden={hideHand} />
                              <PokerCardView card={p.hand?.[1] ?? null} hidden={hideHand} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">No players yet.</div>
                  )}
                </div>

                {state?.winnerId ? (
                  <div className="mt-6 rounded-xl border border-neon-lime/30 bg-neon-lime/10 p-4">
                    <p className="text-sm text-muted-foreground">Winner</p>
                    <p className="mt-1 text-lg font-bold text-neon-lime">
                      {nameByUserId[state.winnerId] || state.winnerId}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Table settings</p>
                <p className="text-lg font-bold text-foreground">Buy-in & blinds</p>
              </div>
              {!state ? (
                <span className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-muted-foreground">
                  No table
                </span>
              ) : (
                <span className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-muted-foreground">
                  {state.status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-surface-elevated p-3">
                <p className="text-xs text-muted-foreground">Buy-in</p>
                <p className="mt-1 font-mono text-foreground">
                  {state ? formatCredits(state.buyInMinor) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-elevated p-3">
                <p className="text-xs text-muted-foreground">Min bet</p>
                <p className="mt-1 font-mono text-foreground">
                  {state ? formatCredits(state.minBetMinor) : "—"}
                </p>
              </div>
            </div>

            {!state ? (
              <div className="flex flex-col gap-2">
                <Button
                  className="bg-neon-lime text-background hover:bg-neon-lime/90 font-semibold"
                  onClick={() => setShowCreate(true)}
                >
                  Create Table <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10 bg-transparent"
                  onClick={() => setShowJoin(true)}
                >
                  Join Table <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actions</p>
                <p className="text-lg font-bold text-foreground">
                  {state ? (isMyTurn ? "Your turn" : "Waiting") : "No table"}
                </p>
              </div>
              {state && currentPlayer ? (
                <span className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  isMyTurn
                    ? "border-neon-lime/30 bg-neon-lime/10 text-neon-lime"
                    : "border-border bg-surface-elevated text-muted-foreground",
                )}>
                  {isMyTurn ? "PLAY" : "TURN"}
                </span>
              ) : null}
            </div>

            {state ? (
              <>
                <div className="rounded-xl border border-border bg-surface-elevated p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Current player</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {currentPlayer ? (nameByUserId[currentPlayer.userId] || currentPlayer.userId) : "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAction("CHECK")}
                    disabled={!isMyTurn}
                  >
                    Check
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("CALL")}
                    disabled={!isMyTurn}
                  >
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("FOLD")}
                    disabled={!isMyTurn}
                    className="text-magenta"
                  >
                    Fold
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleAction("BET")}
                    disabled={!isMyTurn}
                  >
                    Bet
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="w-28 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm placeholder:text-muted-foreground"
                    type="number"
                    value={betCredits ?? ""}
                    onChange={(e) => setBetCredits(normalizeNumberInput(e.target.value))}
                    placeholder="Bet"
                    disabled={!isMyTurn}
                  />
                  <div className="text-xs text-muted-foreground">
                    Min{" "}
                    <span className="font-mono text-foreground">
                      {state ? formatCredits(state.minBetMinor) : "—"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create or join a table to play.
              </p>
            )}

            {message ? (
              <div className="rounded-xl border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
                {message}
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Create modal */}
      {showCreate ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreate(false)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Create poker table</h2>
                <p className="text-sm text-muted-foreground">One active table at a time per group.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <input
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                type="number"
                value={buyInCredits ?? ""}
                onChange={(e) => setBuyInCredits(normalizeNumberInput(e.target.value))}
                min={1}
                placeholder="Buy-in (credits)"
              />
              <input
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                type="number"
                value={minBetCredits ?? ""}
                onChange={(e) => setMinBetCredits(normalizeNumberInput(e.target.value))}
                min={1}
                placeholder="Min bet (credits)"
              />
              <Button className="w-full bg-neon-lime text-background hover:bg-neon-lime/90">
                <Check className="mr-2 h-4 w-4" />
                Create
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Join modal */}
      {showJoin ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowJoin(false)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Join poker table</h2>
                <p className="text-sm text-muted-foreground">Buy in, or use your full wallet.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowJoin(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleJoin} className="mt-4 space-y-3">
              <input
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                type="number"
                value={buyInCredits ?? ""}
                onChange={(e) => setBuyInCredits(normalizeNumberInput(e.target.value))}
                min={1}
                disabled={useFullWallet}
                placeholder="Buy-in (credits)"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useFullWallet}
                  onChange={(e) => setUseFullWallet(e.target.checked)}
                />
                Use full wallet
              </label>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Check className="mr-2 h-4 w-4" />
                Join
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
