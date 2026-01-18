"use client";

import type { GameState } from "../../lib/blackjack-types";
import { ManualTab } from "./manual-tab";

export function ControlPanel({
  state,
  isAnimating,
  onBetChange,
  onDeal,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onPlayAgain,
  onRebet,
}: {
  state: GameState;
  isAnimating: boolean;
  onBetChange: (bet: number) => void;
  onDeal: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onPlayAgain: () => void;
  onRebet: () => void;
}) {
  return (
    <div className="bg-elevated border border-border rounded-2xl overflow-hidden">
      <div className="p-4">
        <ManualTab
          state={state}
          isAnimating={isAnimating}
          onBetChange={onBetChange}
          onDeal={onDeal}
          onHit={onHit}
          onStand={onStand}
          onDouble={onDouble}
          onSplit={onSplit}
          onPlayAgain={onPlayAgain}
          onRebet={onRebet}
        />
      </div>
    </div>
  );
}

