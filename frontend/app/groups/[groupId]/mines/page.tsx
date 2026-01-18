"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { creditsToMinor, formatCredits } from "../../../../lib/credits";
import { normalizeNumberInput } from "../../../../lib/inputs";
import { getErrorMessage } from "../../../../lib/errors";
import { Card, CardDescription, CardTitle } from "../../../../components/ui/card";
import { PageTitle } from "../../../../components/ui/shell";

type RevealResponse = {
  status: string;
  revealed: number[];
  multiplier: number;
  hitMine: boolean;
  minePositions: number[];
};

type UserStats = {
  balanceMinor: number;
};

export default function MinesPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [betCredits, setBetCredits] = useState<number | null>(10);
  const [mineCount, setMineCount] = useState<number | null>(3);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [status, setStatus] = useState("IDLE");
  const [message, setMessage] = useState("");
  const [activeBetMinor, setActiveBetMinor] = useState<number | null>(null);
  const [toast, setToast] = useState<
    | { tone: "win" | "lose"; title: string; subtitle?: string; at: number }
    | null
  >(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);

  async function refreshBalance() {
    try {
      const data = await apiFetch<{ userStats: UserStats }>(
        `/api/groups/${groupId}/activity`,
      );
      setBalanceMinor(data.userStats.balanceMinor);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    async function loadActiveRound() {
      const data = await apiFetch<{
        round: { id: string; revealed: number[]; multiplier: number; status: string } | null;
      }>(`/api/groups/${groupId}/mines/active`);
      if (data.round) {
        setRoundId(data.round.id);
        setRevealed(data.round.revealed);
        setMultiplier(data.round.multiplier);
        setStatus(data.round.status);
      }
    }
    loadActiveRound();
    refreshBalance();
  }, [groupId]);

  async function startRound(e: React.FormEvent) {
    e.preventDefault();
    if (!betCredits || betCredits <= 0) {
      setMessage("Enter a bet amount.");
      return;
    }
    if (!mineCount || mineCount < 1 || mineCount > 24) {
      setMessage("Enter mine count (1–24).");
      return;
    }
    try {
      const betMinor = creditsToMinor(betCredits);
      const data = await apiFetch<{
        roundId: string;
        revealed: number[];
        multiplier: number;
      }>(`/api/groups/${groupId}/mines/start`, {
        method: "POST",
        body: JSON.stringify({ betMinor, mineCount }),
      });
      setRoundId(data.roundId);
      setRevealed(data.revealed);
      setMinePositions([]);
      setMultiplier(data.multiplier);
      setStatus("ACTIVE");
      setMessage("");
      setActiveBetMinor(betMinor);
      setAnimatingIndex(null);
      refreshBalance();
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  async function revealTile(position: number) {
    if (!roundId) return;
    try {
      setAnimatingIndex(position);
      setTimeout(() => setAnimatingIndex(null), 450);
      const data = await apiFetch<RevealResponse>(`/api/groups/${groupId}/mines/reveal`, {
        method: "POST",
        body: JSON.stringify({ roundId, position }),
      });
      setRevealed(data.revealed);
      setMultiplier(data.multiplier);
      setStatus(data.status);
      refreshBalance();
      if (data.hitMine) {
        setMinePositions(data.minePositions);
        setMessage("Boom! You hit a mine.");
        const lostMinor = activeBetMinor ?? 0;
        setToast({
          tone: "lose",
          title: `Lost ${formatCredits(lostMinor)} credits`,
          subtitle: "You hit a mine.",
          at: Date.now(),
        });
        setTimeout(() => setToast(null), 6500);
      }
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  async function cashOut() {
    if (!roundId) return;
    try {
      const data = await apiFetch<{ payoutMinor: number; multiplier: number }>(
        `/api/groups/${groupId}/mines/cashout`,
        {
          method: "POST",
          body: JSON.stringify({ roundId }),
        },
      );
      setStatus("CASHED");
      setMessage(`Cashed out ${formatCredits(data.payoutMinor)}`);
      const betMinor = activeBetMinor ?? 0;
      const netMinor = data.payoutMinor - betMinor;
      setToast({
        tone: "win",
        title: `Earned ${formatCredits(Math.max(0, netMinor))} credits`,
        subtitle: `Payout ${formatCredits(data.payoutMinor)} • ${data.multiplier}x`,
        at: Date.now(),
      });
      setTimeout(() => setToast(null), 6500);
      refreshBalance();
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  const gemsFound = revealed.length;
  const tilesLeft = 25 - (mineCount || 0) - gemsFound;
  const payoutMinor =
    activeBetMinor && status === "ACTIVE"
      ? Math.floor(activeBetMinor * multiplier)
      : 0;
  const canCashOut = status === "ACTIVE" && gemsFound > 0;

  return (
    <main className="space-y-6">
      <PageTitle
        title="Mines"
        subtitle="Avoid the bombs. Cash out anytime."
        right={
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
          >
            Back
          </button>
        }
      />

      <div className="mx-auto max-w-5xl">
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="order-2 lg:order-1 space-y-4">
            {status === "ACTIVE" ? (
              <div className="flex items-center justify-between rounded-2xl border border-[#2a2a30] bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] p-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Current Payout</span>
                  <span className="text-xl font-bold text-neon-lime">
                    {formatCredits(payoutMinor)} credits
                  </span>
                </div>
                <button
                  onClick={cashOut}
                  disabled={!canCashOut}
                  className="h-12 rounded-xl bg-magenta text-white font-semibold hover:bg-magenta/90 hover:shadow-[0_0_20px_rgba(224,72,144,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed px-5"
                >
                  Cash Out
                </button>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[#2a2a30] bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] p-4 md:p-6">
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                {Array.from({ length: 25 }).map((_, index) => {
                  const isSafeRevealed = revealed.includes(index);
                  const isMine = minePositions.includes(index);
                  const isRevealed = isSafeRevealed || isMine;
                  const isClickable = status === "ACTIVE" && !isSafeRevealed;
                  const isDisabled = status !== "ACTIVE" || isSafeRevealed;

                  const base =
                    "aspect-square rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-background";
                  let state = "";
                  if (!isRevealed) {
                    state = isClickable
                      ? "bg-gradient-to-b from-[#2a2a2f] to-[#1a1a1f] border-2 border-[#3a3a40] cursor-pointer hover:border-neon-lime hover:shadow-[0_0_15px_rgba(56,248,104,0.3)] active:scale-95"
                      : "bg-gradient-to-b from-[#2a2a2f] to-[#1a1a1f] border-2 border-[#3a3a40] opacity-60 cursor-not-allowed";
                  } else if (isMine) {
                    state = `bg-magenta/20 border-2 border-magenta shadow-[0_0_20px_rgba(224,72,144,0.4)] ${
                      animatingIndex === index ? "animate-shake" : ""
                    }`;
                  } else {
                    state = `bg-neon-lime/10 border-2 border-neon-lime/50 shadow-[0_0_15px_rgba(56,248,104,0.3)] ${
                      animatingIndex === index ? "animate-tile-flip" : ""
                    }`;
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => revealTile(index)}
                      disabled={isDisabled}
                      className={`${base} ${state}`}
                      tabIndex={isClickable ? 0 : -1}
                      aria-label={
                        isRevealed
                          ? isMine
                            ? "Mine revealed"
                            : "Gem revealed"
                          : `Tile ${index + 1}, unrevealed`
                      }
                    >
                      {isRevealed ? (
                        <div className={animatingIndex === index ? "animate-tile-flip" : ""}>
                          <span className={isMine ? "text-magenta text-2xl" : "text-neon-lime text-2xl"}>
                            {isMine ? "💣" : "💎"}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </div>

          <div className="order-1 lg:order-2 flex flex-col gap-4">
            <Card className="rounded-2xl border border-[#2a2a30] bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] p-5 space-y-2">
              <CardTitle>Current balance</CardTitle>
              <CardDescription>How much you own in this group.</CardDescription>
              <p className="mt-2 text-3xl font-bold text-neon-lime">
                {balanceMinor === null ? "—" : `${formatCredits(balanceMinor)} credits`}
              </p>
            </Card>

            <Card className="rounded-2xl border border-[#2a2a30] bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] p-5 space-y-4">
              <div>
                <CardTitle>Controls</CardTitle>
                <CardDescription>Pick mines + bet and start.</CardDescription>
              </div>
              <form onSubmit={startRound} className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mines</p>
                  <input
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground"
                    type="number"
                    value={mineCount ?? ""}
                    onChange={(e) => setMineCount(normalizeNumberInput(e.target.value))}
                    min={1}
                    max={24}
                    placeholder="5"
                    disabled={status === "ACTIVE"}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Bet amount</p>
                  <input
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground"
                    type="number"
                    value={betCredits ?? ""}
                    onChange={(e) => setBetCredits(normalizeNumberInput(e.target.value))}
                    min={1}
                    placeholder="10"
                    disabled={status === "ACTIVE"}
                  />
                </div>
                <button
                  disabled={status === "ACTIVE"}
                  className="h-12 w-full rounded-xl border border-neon-lime bg-transparent text-neon-lime font-semibold hover:bg-neon-lime/10 hover:shadow-[0_0_20px_rgba(56,248,104,0.3)] transition-all disabled:opacity-50"
                >
                  Start Game
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="h-12 w-full rounded-xl border border-neon-lime bg-transparent text-neon-lime font-semibold hover:bg-neon-lime/10 hover:shadow-[0_0_20px_rgba(56,248,104,0.3)] transition-all"
                >
                  New Game
                </button>
              </form>
            </Card>

            <Card className="rounded-2xl border border-[#2a2a30] bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] p-5 space-y-3">
              <CardTitle>Stats</CardTitle>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Gems found</p>
                  <p className="font-bold text-foreground">{gemsFound}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tiles left</p>
                  <p className="font-bold text-foreground">{tilesLeft}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mines</p>
                  <p className="font-bold text-foreground">{mineCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Multiplier</p>
                  <p className="font-bold text-neon-lime">{multiplier.toFixed(2)}x</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {toast ? (
        <div className="fixed right-5 top-24 z-50 w-[min(420px,calc(100vw-40px))] rounded-2xl border border-border bg-surface p-4 shadow-2xl">
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              toast.tone === "win" ? "text-neon-lime" : "text-magenta"
            }`}
          >
            {toast.tone === "win" ? "WIN" : "LOSS"}
          </p>
          <p className="mt-1 text-lg font-bold">{toast.title}</p>
          {toast.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{toast.subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
