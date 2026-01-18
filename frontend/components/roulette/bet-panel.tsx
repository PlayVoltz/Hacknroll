"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { normalizeNumberInput } from "../../lib/inputs";

export type BetColor = "black" | "red" | "green";

export function BetPanel({
  roundId,
  onPlaceBet,
  disabled,
  currentBet,
  defaultAmountCredits = 10,
}: {
  roundId: string | null;
  onPlaceBet: (amountCredits: number, color: BetColor) => void;
  disabled: boolean;
  currentBet: { amountCredits: number; color: BetColor } | null;
  defaultAmountCredits?: number;
}) {
  const [amountCredits, setAmountCredits] = useState<number | null>(defaultAmountCredits);
  const [selectedColor, setSelectedColor] = useState<BetColor | null>("red");

  const handlePlaceBet = () => {
    if (selectedColor && amountCredits && amountCredits > 0) {
      onPlaceBet(amountCredits, selectedColor);
    }
  };

  const colorButtons: Array<{ color: BetColor; label: string; className: string }> = [
    { color: "black", label: "Black", className: "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white" },
    { color: "red", label: "Red", className: "bg-red-700 hover:bg-red-600 border-red-600 text-white" },
    { color: "green", label: "Green", className: "bg-green-700 hover:bg-green-600 border-green-600 text-white" },
  ];

  const roundLabel = roundId ? `Round ${roundId.slice(-6).toUpperCase()}` : "Waiting for round…";

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 relative z-10">
      <div>
        <h2 className="text-xl font-bold text-white">Place bet</h2>
        <p className="text-sm text-muted-foreground mt-1">Red/Black pays 2x. Green pays 14x.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Amount</label>
        <input
          type="number"
          value={amountCredits ?? ""}
          onChange={(e) => setAmountCredits(normalizeNumberInput(e.target.value))}
          className="w-full text-center text-lg font-semibold bg-secondary/30 border border-border/50 h-12 rounded-md"
          min={1}
          disabled={disabled}
          placeholder="10"
        />
      </div>

      <p className="text-sm text-muted-foreground">{roundLabel} · Pick a color below.</p>

      <div className="grid grid-cols-3 gap-3">
        {colorButtons.map(({ color, label, className }) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            disabled={disabled}
            className={cn(
              "py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2",
              className,
              selectedColor === color
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                : "opacity-80 hover:opacity-100",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            aria-pressed={selectedColor === color}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={handlePlaceBet}
        disabled={disabled || !selectedColor || !amountCredits || amountCredits <= 0 || currentBet !== null}
        className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] disabled:opacity-50 disabled:shadow-none"
      >
        {currentBet ? "Bet Placed" : "Place Bet"}
      </button>

      {currentBet ? (
        <p className="text-center text-sm text-green-400">
          You bet {currentBet.amountCredits} on {currentBet.color}
        </p>
      ) : null}
    </div>
  );
}

