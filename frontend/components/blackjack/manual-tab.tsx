"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import type { GameState } from "../../lib/blackjack-types";
import { canDouble, canSplit } from "../../lib/blackjack-utils";

const chips = [10, 25, 50, 100, 250];

export function ManualTab({
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
  const [autoStand, setAutoStand] = useState(false);
  const [showValue, setShowValue] = useState(true);

  // (UI-only toggles; kept for parity with zip UI)
  void autoStand;
  void showValue;

  const activeHand = state.playerHands[state.activeHandIndex];
  const canSplitHand = !!activeHand && canSplit(activeHand) && state.balance >= activeHand.bet;
  const canDoubleHand = !!activeHand && canDouble(activeHand) && state.balance >= activeHand.bet;

  const minBet = 10;
  const maxBet = Math.min(10000, state.balance);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Bet Amount</div>
        <div className="relative">
          <input
            type="number"
            value={state.phase === "betting" ? state.currentBet : state.currentBet}
            onChange={(e) => onBetChange(Math.max(0, Number.parseInt(e.target.value) || 0))}
            className="w-full bg-deep-surface border border-border rounded-md pr-16 font-mono text-lg h-12 px-3"
            disabled={state.phase !== "betting"}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            credits
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => onBetChange(state.currentBet + chip)}
              disabled={state.phase !== "betting" || state.currentBet + chip > state.balance}
              className={cn(
                "w-12 h-12 rounded-full font-bold text-xs transition-all border-2",
                "bg-elevated hover:bg-elevated-hover disabled:opacity-50 disabled:cursor-not-allowed",
                chip === 10 && "border-cyan text-cyan",
                chip === 25 && "border-primary text-primary",
                chip === 50 && "border-yellow text-yellow",
                chip === 100 && "border-magenta text-magenta",
                chip === 250 && "border-purple text-purple",
                state.phase === "betting" && "neon-glow-hover",
              )}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onBetChange(0)}
            disabled={state.phase !== "betting"}
            className="rounded-md border border-border bg-deep-surface px-3 py-2 text-sm hover:bg-elevated-hover disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={() => onBetChange(Math.floor(state.currentBet / 2))}
            disabled={state.phase !== "betting"}
            className="rounded-md border border-border bg-deep-surface px-3 py-2 text-sm hover:bg-elevated-hover disabled:opacity-50"
          >
            1/2
          </button>
          <button
            onClick={() => onBetChange(Math.min(state.currentBet * 2, maxBet))}
            disabled={state.phase !== "betting"}
            className="rounded-md border border-border bg-deep-surface px-3 py-2 text-sm hover:bg-elevated-hover disabled:opacity-50"
          >
            2x
          </button>
          <button
            onClick={() => onBetChange(maxBet)}
            disabled={state.phase !== "betting"}
            className="rounded-md border border-border bg-deep-surface px-3 py-2 text-sm hover:bg-elevated-hover disabled:opacity-50"
          >
            Max
          </button>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Min: {minBet} credits</span>
          <span>Max: {maxBet.toLocaleString()} credits</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Options</div>
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Auto-stand on 17</span>
            <input
              type="checkbox"
              checked={autoStand}
              onChange={(e) => setAutoStand(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Show hand value</span>
            <input
              type="checkbox"
              checked={showValue}
              onChange={(e) => setShowValue(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      </div>

      {state.showInsurance ? (
        <div className="p-3 rounded-lg bg-yellow/10 border border-yellow/30 text-sm">
          <p className="text-yellow font-medium">Insurance Available</p>
          <p className="text-muted-foreground text-xs mt-1">
            Dealer shows an Ace. Insurance pays 2:1.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {state.phase === "betting" ? (
          <button
            onClick={onDeal}
            disabled={state.currentBet < minBet || state.currentBet > state.balance || isAnimating}
            className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-glow disabled:opacity-50 disabled:shadow-none rounded-md"
          >
            DEAL
          </button>
        ) : null}

        {state.phase === "player-turn" ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-primary font-medium">Your turn</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onHit}
                disabled={isAnimating}
                className="h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
              >
                HIT
              </button>
              <button
                onClick={onStand}
                disabled={isAnimating}
                className="h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
              >
                STAND
              </button>
              <button
                onClick={onDouble}
                disabled={!canDoubleHand || isAnimating}
                className="h-12 font-bold border border-primary text-primary hover:bg-primary/10 rounded-md bg-transparent disabled:opacity-50 disabled:border-muted"
              >
                DOUBLE
              </button>
              <button
                onClick={onSplit}
                disabled={!canSplitHand || isAnimating}
                className="h-12 font-bold border border-primary text-primary hover:bg-primary/10 rounded-md bg-transparent disabled:opacity-50 disabled:border-muted"
              >
                SPLIT
              </button>
            </div>
          </div>
        ) : null}

        {state.phase === "dealing" || state.phase === "dealer-turn" ? (
          <div className="h-14 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>{state.phase === "dealing" ? "Dealing..." : "Dealer playing..."}</span>
            </div>
          </div>
        ) : null}

        {state.phase === "result" ? (
          <div className="flex gap-2">
            <button
              onClick={onPlayAgain}
              className="flex-1 h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-glow rounded-md"
            >
              PLAY AGAIN
            </button>
            <button
              onClick={onRebet}
              className="flex-1 h-12 font-bold border border-primary text-primary hover:bg-primary/10 bg-transparent rounded-md"
            >
              REBET
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

