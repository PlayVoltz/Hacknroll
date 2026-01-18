"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { GameState } from "@/lib/blackjack-types"
import { canSplit, canDouble } from "@/lib/blackjack-utils"

interface ManualTabProps {
  state: GameState
  isAnimating: boolean
  onBetChange: (bet: number) => void
  onDeal: () => void
  onHit: () => void
  onStand: () => void
  onDouble: () => void
  onSplit: () => void
  onPlayAgain: () => void
  onRebet: () => void
}

const chips = [10, 25, 50, 100, 250]

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
}: ManualTabProps) {
  const [autoStand, setAutoStand] = useState(false)
  const [showValue, setShowValue] = useState(true)

  const activeHand = state.playerHands[state.activeHandIndex]
  const canSplitHand = activeHand && canSplit(activeHand) && state.balance >= activeHand.bet
  const canDoubleHand = activeHand && canDouble(activeHand) && state.balance >= activeHand.bet

  const minBet = 10
  const maxBet = Math.min(10000, state.balance)

  return (
    <div className="space-y-6">
      {/* Bet Amount Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Bet Amount</Label>
        <div className="relative">
          <Input
            type="number"
            value={state.currentBet}
            onChange={(e) => onBetChange(Math.max(0, Number.parseInt(e.target.value) || 0))}
            className="bg-deep-surface border-border pr-16 font-mono text-lg h-12"
            disabled={state.phase !== "betting"}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">credits</span>
        </div>

        {/* Chip Selector */}
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

        {/* Utility Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBetChange(0)}
            disabled={state.phase !== "betting"}
            className="bg-deep-surface border-border"
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBetChange(Math.floor(state.currentBet / 2))}
            disabled={state.phase !== "betting"}
            className="bg-deep-surface border-border"
          >
            1/2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBetChange(Math.min(state.currentBet * 2, maxBet))}
            disabled={state.phase !== "betting"}
            className="bg-deep-surface border-border"
          >
            2x
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBetChange(maxBet)}
            disabled={state.phase !== "betting"}
            className="bg-deep-surface border-border"
          >
            Max
          </Button>
        </div>

        {/* Min/Max Display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Min: {minBet} credits</span>
          <span>Max: {maxBet.toLocaleString()} credits</span>
        </div>
      </div>

      {/* Side Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">Options</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-stand" className="text-sm">
              Auto-stand on 17
            </Label>
            <Switch id="auto-stand" checked={autoStand} onCheckedChange={setAutoStand} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-value" className="text-sm">
              Show hand value
            </Label>
            <Switch id="show-value" checked={showValue} onCheckedChange={setShowValue} />
          </div>
        </div>
      </div>

      {/* Insurance Notice */}
      {state.showInsurance && (
        <div className="p-3 rounded-lg bg-yellow/10 border border-yellow/30 text-sm">
          <p className="text-yellow font-medium">Insurance Available</p>
          <p className="text-muted-foreground text-xs mt-1">Dealer shows an Ace. Insurance pays 2:1.</p>
        </div>
      )}

      {/* Primary CTA */}
      <div className="space-y-3">
        {state.phase === "betting" && (
          <Button
            onClick={onDeal}
            disabled={state.currentBet < minBet || state.currentBet > state.balance || isAnimating}
            className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-glow disabled:opacity-50 disabled:shadow-none"
          >
            DEAL
          </Button>
        )}

        {state.phase === "player-turn" && (
          <div className="space-y-3">
            <p className="text-center text-sm text-primary font-medium">Your turn</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onHit}
                disabled={isAnimating}
                className="h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                HIT
              </Button>
              <Button
                onClick={onStand}
                disabled={isAnimating}
                className="h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                STAND
              </Button>
              <Button
                onClick={onDouble}
                disabled={!canDoubleHand || isAnimating}
                variant="outline"
                className="h-12 font-bold border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:border-muted bg-transparent"
              >
                DOUBLE
              </Button>
              <Button
                onClick={onSplit}
                disabled={!canSplitHand || isAnimating}
                variant="outline"
                className="h-12 font-bold border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:border-muted bg-transparent"
              >
                SPLIT
              </Button>
            </div>
          </div>
        )}

        {(state.phase === "dealing" || state.phase === "dealer-turn") && (
          <div className="h-14 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>{state.phase === "dealing" ? "Dealing..." : "Dealer playing..."}</span>
            </div>
          </div>
        )}

        {state.phase === "result" && (
          <div className="flex gap-2">
            <Button
              onClick={onPlayAgain}
              className="flex-1 h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
            >
              PLAY AGAIN
            </Button>
            <Button
              onClick={onRebet}
              variant="outline"
              className="flex-1 h-12 font-bold border-primary text-primary hover:bg-primary/10 bg-transparent"
            >
              REBET
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
