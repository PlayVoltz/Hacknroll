"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { getSocket } from "../../../../lib/socket";
import { creditsToMinor, formatCredits, minorToCredits } from "../../../../lib/credits";
import { getErrorMessage } from "../../../../lib/errors";
import { PageTitle } from "../../../../components/ui/shell";
import { useAuth } from "../../../../components/auth/AuthProvider";
import { RouletteWheel } from "../../../../components/roulette/roulette-wheel";
import { BetPanel, type BetColor } from "../../../../components/roulette/bet-panel";
import { BetBoard, type BetRow } from "../../../../components/roulette/bet-board";

type RouletteBet = {
  id: string;
  userId: string;
  username: string;
  amountMinor: number;
  selection: any;
};

export default function RoulettePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { me } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState("");
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [resultBox, setResultBox] = useState<{
    state: "idle" | "spinning" | "revealed";
    color?: "black" | "red" | "green";
  }>({ state: "idle" });
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    color: "black" | "red" | "green";
    earnedMinor: number;
    lostMinor: number;
    netMinor: number;
    outcome: "WIN" | "LOSE";
    at: string;
  } | null>(null);

  const spinDurationMs = 5600;
  const betsRef = useRef<RouletteBet[]>([]);
  const meRef = useRef(me);
  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("group", { groupId });
    socket.on("roulette", (payload) => {
      if (payload.secondsLeft !== undefined) {
        setSecondsLeft(payload.secondsLeft);
      }
      if (payload.stopRotationDeg !== undefined) {
        const at = new Date().toISOString();
        const color = payload.color as "red" | "black" | "green";
        const wheelIndex =
          payload.wheelIndex !== undefined ? Number(payload.wheelIndex) : null;

        // 2/4/5: show ? while spinning, reveal only after wheel finishes
        setResultBox({ state: "spinning" });
        setIsAnimating(true);
        setHighlightIndex(null);

        // Server chooses a random stop rotation; we animate to it (plus extra full spins).
        const stopRotationDeg = Number(payload.stopRotationDeg) || 0;
        setWheelRotation((prev) => {
          const currentMod = ((prev % 360) + 360) % 360;
          const targetMod = ((stopRotationDeg % 360) + 360) % 360;
          const delta = (targetMod - currentMod + 360) % 360;
          // 6-10 turns for nicer feel, then land exactly at the server angle
          const extraTurns = 6 * 360;
          return prev + extraTurns + delta;
        });

        // Reveal after the spin completes
        setTimeout(() => {
          setResultBox({ state: "revealed", color });
          setIsAnimating(false);
          setHighlightIndex(wheelIndex);
        }, spinDurationMs + 80);

        // Hold the revealed result for a bit, then go back to idle (question mark)
        setTimeout(() => {
          setResultBox((cur) =>
            cur.state === "revealed" ? { state: "idle" } : cur,
          );
        }, spinDurationMs + 6000);

        // 6: if you bet, show a popup with earned/lost + result color (no roulette number)
        const meId = meRef.current?.id;
        const myBet = meId ? betsRef.current.find((b) => b.userId === meId) : null;
        if (meId && myBet) {
          const betMinor = myBet.amountMinor;
          const payoutMinor =
            Array.isArray(payload.payouts) && payload.payouts.length
              ? (payload.payouts.find((p: any) => p.userId === meId)?.payoutMinor ?? 0)
              : 0;
          const netMinor = payoutMinor - betMinor;
          const outcome = netMinor >= 0 ? "WIN" : "LOSE";
          setTimeout(() => {
            setToast({
              color,
              earnedMinor: payoutMinor,
              lostMinor: betMinor,
              netMinor,
              outcome,
              at,
            });
            setTimeout(() => setToast(null), 7000);
          }, spinDurationMs + 120);
        }

        // Refresh bet board for the next spin
        setTimeout(() => refreshBets(), 900);
      }
    });
    return () => {
      socket.off("roulette");
    };
  }, [groupId]);

  async function refreshBets() {
    try {
      const data = await apiFetch<{ round: { id: string } | null; bets: RouletteBet[] }>(
        `/api/groups/${groupId}/roulette/bets`,
      );
      setRoundId(data.round?.id || null);
      setBets(data.bets || []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshBets();
    const t = setInterval(refreshBets, 1500);
    return () => clearInterval(t);
  }, [groupId]);

  const betsByColor = useMemo(() => {
    const map: Record<"red" | "black" | "green", RouletteBet[]> = {
      red: [],
      black: [],
      green: [],
    };
    for (const b of bets) {
      const bt = (b.selection as any)?.betType as "red" | "black" | "green" | undefined;
      if (bt && map[bt]) map[bt].push(b);
    }
    return map;
  }, [bets]);

  const iAlreadyBet = useMemo(() => {
    if (!me) return false;
    return bets.some((b) => b.userId === me.id);
  }, [bets, me]);

  async function placeBet(amountCredits: number, color: BetColor) {
    setMessage("");
    try {
      await apiFetch(`/api/groups/${groupId}/roulette/bet`, {
        method: "POST",
        body: JSON.stringify({
          betType: color,
          amountMinor: creditsToMinor(amountCredits),
        }),
      });
      setMessage("");
      await refreshBets();
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  const betRows: BetRow[] = useMemo(() => {
    return bets
      .map((b) => {
        const bt = (b.selection as any)?.betType as BetColor | undefined;
        if (bt !== "red" && bt !== "black" && bt !== "green") return null;
        return { id: b.id, username: b.username, amountMinor: b.amountMinor, color: bt };
      })
      .filter(Boolean) as BetRow[];
  }, [bets]);

  return (
    <main className="space-y-6">
      <PageTitle
        title="Roulette"
        subtitle="Pick a color. One bet per spin. Watch the board fill up."
        right={
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
          >
            Back
          </button>
        }
      />

      <div className="min-h-[70vh] bg-background noise-bg rounded-2xl overflow-hidden border border-border">
        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="glass-card-glow rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Wheel</h2>

                {resultBox.state === "revealed" && resultBox.color ? (
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                      resultBox.color === "red"
                        ? "bg-red-600"
                        : resultBox.color === "green"
                        ? "bg-green-600"
                        : "bg-zinc-700"
                    }`}
                  >
                    {resultBox.color.toUpperCase()}
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full bg-secondary/50 text-sm text-muted-foreground">
                    {resultBox.state === "spinning" ? "?" : "RESULT"}
                  </div>
                )}
              </div>

              <p className="text-sm mb-6 text-center text-muted-foreground" role="timer" aria-live="polite">
                {isAnimating ? "Spinning..." : `Betting closes in ${secondsLeft}s.`}
              </p>

              <div className="flex-1 flex items-center justify-center py-4">
                <RouletteWheel rotationDeg={wheelRotation} isAnimating={isAnimating} highlightIndex={highlightIndex} />
              </div>
            </div>

            <BetPanel
              roundId={roundId}
              disabled={iAlreadyBet || isAnimating || secondsLeft <= 0}
              currentBet={
                me && iAlreadyBet
                  ? (() => {
                      const b = bets.find((x) => x.userId === me.id);
                      const c = (b?.selection as any)?.betType as BetColor | undefined;
                      if (!b || !c) return null;
                      return { amountCredits: minorToCredits(b.amountMinor), color: c };
                    })()
                  : null
              }
              onPlaceBet={placeBet}
            />
          </div>

          {message ? <p className="mb-4 text-sm text-muted-foreground">{message}</p> : null}

          <BetBoard bets={betRows} />
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 w-[320px] rounded-2xl border border-border bg-surface p-4 neon-glow">
          <div
            className={`mb-2 inline-flex rounded-full border border-border px-3 py-1 text-xs font-bold uppercase text-white ${
              toast.color === "red" ? "bg-red-500/20" : toast.color === "green" ? "bg-emerald-500/20" : "bg-surface-elevated"
            }`}
          >
            Result: {toast.color}
          </div>
          <div className="text-base font-bold">
            {toast.outcome === "WIN"
              ? `You won ${formatCredits(Math.abs(toast.netMinor))} credits`
              : `You lost ${formatCredits(Math.abs(toast.netMinor))} credits`}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Earned: {formatCredits(toast.earnedMinor)} • Lost: {formatCredits(toast.lostMinor)}
          </div>
        </div>
      ) : null}
    </main>
  );
}
