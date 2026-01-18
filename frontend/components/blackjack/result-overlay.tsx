"use client";

import { useEffect } from "react";
import { cn } from "../../lib/utils";
import { calculatePayout } from "../../lib/blackjack-utils";
import type { Hand } from "../../lib/blackjack-types";

export function ResultOverlay({
  hands,
  onPlayAgain,
  onRebet,
  show,
  setShow,
}: {
  hands: Hand[];
  onPlayAgain: () => void;
  onRebet: () => void;
  show: boolean;
  setShow: (show: boolean) => void;
}) {
  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, [setShow]);

  const totalBet = hands.reduce((sum, h) => sum + (h.isDoubled ? h.bet * 2 : h.bet), 0);
  const totalPayout = hands.reduce((sum, h) => sum + calculatePayout(h, h.result ?? "lose"), 0);
  const netChange = totalPayout - totalBet;
  const primaryResult = hands[0]?.result;

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-start justify-center pt-8 z-10 pointer-events-none">
      <div
        className={cn(
          "bg-elevated/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-2xl animate-slide-in-overlay pointer-events-auto",
          "flex flex-col items-center gap-4",
        )}
      >
        <div
          className={cn(
            "text-3xl font-bold uppercase tracking-wider",
            (primaryResult === "win" || primaryResult === "blackjack") && "text-primary neon-glow",
            (primaryResult === "lose" || primaryResult === "bust") && "text-destructive",
            primaryResult === "push" && "text-muted-foreground",
          )}
        >
          {primaryResult === "blackjack"
            ? "🎰 BLACKJACK!"
            : primaryResult === "win"
              ? "🎉 WIN"
              : primaryResult === "lose"
                ? "LOSE"
                : primaryResult === "bust"
                  ? "💥 BUST"
                  : "🤝 PUSH"}
        </div>

        <div
          className={cn(
            "text-2xl font-mono font-bold",
            netChange > 0 && "text-primary",
            netChange < 0 && "text-destructive",
            netChange === 0 && "text-muted-foreground",
          )}
        >
          {netChange >= 0 ? "+" : ""}
          {netChange.toLocaleString()} credits
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onPlayAgain}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-semibold"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onRebet}
            className="border border-primary text-primary hover:bg-primary/10 bg-transparent rounded-md px-4 py-2 font-semibold"
          >
            REBET
          </button>
        </div>
      </div>
    </div>
  );
}

