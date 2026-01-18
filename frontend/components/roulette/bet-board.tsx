"use client";

import { cn } from "../../lib/utils";
import { formatCredits } from "../../lib/credits";
import type { BetColor } from "./bet-panel";

export type BetRow = {
  id: string;
  username: string;
  amountMinor: number;
  color: BetColor;
};

export function BetBoard({ bets }: { bets: BetRow[] }) {
  const columns: Array<{ color: BetColor; label: string; bgClass: string; borderClass: string }> = [
    { color: "black", label: "Black", bgClass: "bg-zinc-900/50", borderClass: "border-zinc-700" },
    { color: "red", label: "Red", bgClass: "bg-red-950/30", borderClass: "border-red-800/50" },
    { color: "green", label: "Green", bgClass: "bg-green-950/30", borderClass: "border-green-800/50" },
  ];

  const getBetsForColor = (color: BetColor) => bets.filter((b) => b.color === color);

  return (
    <div className="glass-card rounded-2xl p-6 relative z-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Bet board</h2>
        <p className="text-sm text-muted-foreground mt-1">Who bet what (one bet per user per spin).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(({ color, label, bgClass, borderClass }) => {
          const colorBets = getBetsForColor(color);
          return (
            <div
              key={color}
              className={cn("rounded-xl border p-4 min-h-[200px] flex flex-col", bgClass, borderClass)}
            >
              <div className="mb-3">
                <h3
                  className={cn(
                    "font-bold",
                    color === "red" && "text-red-400",
                    color === "black" && "text-zinc-300",
                    color === "green" && "text-green-400",
                  )}
                >
                  {label}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[150px]">
                {colorBets.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">No bets yet.</p>
                ) : (
                  colorBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-start justify-between text-sm py-1.5 px-2 rounded-lg bg-black/20"
                    >
                      <div className="min-w-0">
                        <div className="text-foreground/90 text-xs font-semibold leading-4 truncate">{bet.username}</div>
                        <div className="font-mono text-foreground text-xs">{formatCredits(bet.amountMinor)} credits</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

