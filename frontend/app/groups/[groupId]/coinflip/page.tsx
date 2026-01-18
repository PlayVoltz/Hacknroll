"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { creditsToMinor, formatCredits } from "../../../../lib/credits";
import { normalizeNumberInput } from "../../../../lib/inputs";
import { getErrorMessage } from "../../../../lib/errors";
import { Card, CardDescription, CardTitle } from "../../../../components/ui/card";
import { PageTitle } from "../../../../components/ui/shell";
import styles from "./coinflip.module.css";

type CoinflipResponse = {
  result: "heads" | "tails";
  won: boolean;
  payoutMinor: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function CoinflipPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [betCredits, setBetCredits] = useState<number | null>(10);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [phase, setPhase] = useState<"idle" | "flipping" | "done">("idle");
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<CoinflipResponse | null>(null);
  const [serverResult, setServerResult] = useState<"heads" | "tails" | null>(null);
  const [flipKey, setFlipKey] = useState(0);
  const [toast, setToast] = useState<{
    tone: "win" | "lose";
    title: string;
    subtitle?: string;
    at: number;
  } | null>(null);

  async function handlePlay(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOutcome(null);
    setServerResult(null);
    if (!betCredits || betCredits <= 0) {
      setError("Enter a bet amount.");
      return;
    }

    try {
      // Fetch server result first so the animation always lands on the correct face.
      const data = await apiFetch<CoinflipResponse>(`/api/groups/${groupId}/coinflip/play`, {
        method: "POST",
        body: JSON.stringify({ betMinor: creditsToMinor(betCredits), choice }),
      });

      setServerResult(data.result);
      setPhase("flipping");
      setFlipKey((k) => k + 1);
      const flipDurationMs = 3200;
      await sleep(flipDurationMs);

      setOutcome(data);
      setPhase("done");

      const betMinor = creditsToMinor(betCredits);
      const netMinor = data.payoutMinor - betMinor;
      setToast({
        tone: data.won ? "win" : "lose",
        title: data.won
          ? `You won ${formatCredits(Math.abs(netMinor))} credits`
          : `You lost ${formatCredits(Math.abs(netMinor))} credits`,
        subtitle: `Result: ${data.result.toUpperCase()} • Payout ${formatCredits(data.payoutMinor)} credits`,
        at: Date.now(),
      });
      setTimeout(() => setToast(null), 6500);
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase("idle");
    }
  }

  const headline = useMemo(() => {
    if (phase === "flipping") return "Flipping…";
    if (phase === "done" && outcome) return outcome.won ? "You won." : "You lost.";
    return "Pick a side and flip.";
  }, [phase, outcome]);

  return (
    <main className={styles.wrap}>
      <PageTitle
        title="Coinflip"
        subtitle="Coin Toss (DarePot style). Win pays 2x."
        right={
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
          >
            Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={`lg:col-span-2 ${styles.stageCard}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Coin Toss</CardTitle>
              <CardDescription>Result reveals after the flip ends.</CardDescription>
            </div>
          </div>

          <div className={styles.coinStage}>
            <div className={styles.coinOuter}>
              <div
                key={flipKey}
                className={[
                  styles.coin,
                  phase === "flipping"
                    ? serverResult === "tails"
                      ? styles.flipTails
                      : styles.flipHeads
                    : "",
                  phase === "done" && outcome?.won ? styles.winGlow : "",
                  phase === "done" && outcome && !outcome.won ? styles.lossGlow : "",
                ].join(" ")}
                style={{
                  transform:
                    phase !== "flipping" && serverResult === "tails"
                      ? "rotateY(180deg)"
                      : "rotateY(0deg)",
                }}
              >
                <div className={`${styles.face} ${styles.heads}`}>
                  <div className="text-center">
                    <div className={styles.labelBigHeads}>H</div>
                    <div className={styles.labelSmallHeads}>HEADS</div>
                  </div>
                  <div className={styles.rim} />
                </div>
                <div className={`${styles.face} ${styles.tails}`}>
                  <div className="text-center">
                    <div className={styles.labelBigTails}>T</div>
                    <div className={styles.labelSmallTails}>TAILS</div>
                  </div>
                  <div className={styles.rim} />
                </div>
              </div>
            </div>

            <div className={styles.resultBox}>
              <div>
                <div className={styles.resultTitle}>Result</div>
                <div className="text-sm text-muted-foreground">{headline}</div>
              </div>
              <div className={styles.resultValue}>
                {phase === "flipping" ? "?" : phase === "done" && outcome ? outcome.result.toUpperCase() : "—"}
              </div>
            </div>

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <CardTitle>Place bet</CardTitle>
            <CardDescription>Choose a side and flip.</CardDescription>
          </div>
          <form onSubmit={handlePlay} className="space-y-3">
            <input
              className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
              type="number"
              value={betCredits ?? ""}
              onChange={(e) => setBetCredits(normalizeNumberInput(e.target.value))}
              min={1}
              placeholder="Bet amount (credits)"
              disabled={phase === "flipping"}
            />
            <p className="text-xs text-muted-foreground">Example: 10</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChoice("heads")}
                disabled={phase === "flipping"}
                className={`rounded-md border border-border px-3 py-2 font-semibold ${
                  choice === "heads"
                    ? "bg-neon-lime/10 text-neon-lime"
                    : "bg-surface-elevated hover:bg-surface"
                }`}
              >
                Heads
              </button>
              <button
                type="button"
                onClick={() => setChoice("tails")}
                disabled={phase === "flipping"}
                className={`rounded-md border border-border px-3 py-2 font-semibold ${
                  choice === "tails"
                    ? "bg-neon-lime/10 text-neon-lime"
                    : "bg-surface-elevated hover:bg-surface"
                }`}
              >
                Tails
              </button>
            </div>

            <button
              disabled={phase === "flipping"}
              className="w-full rounded-md bg-neon-lime px-3 py-3 font-bold text-background neon-glow-hover disabled:opacity-50"
            >
              {phase === "flipping" ? "Flipping…" : "Flip"}
            </button>
          </form>
        </Card>
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
