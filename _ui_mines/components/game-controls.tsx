"use client"

import { Play, RotateCcw, Bomb, AlertTriangle, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GameStatus } from "./mines-game"

interface GameControlsProps {
  minesCount: number
  setMinesCount: (count: number) => void
  betAmount: number
  setBetAmount: (amount: number) => void
  gameStatus: GameStatus
  onStart: () => void
  onReset: () => void
}

export function GameControls({
  minesCount,
  setMinesCount,
  betAmount,
  setBetAmount,
  gameStatus,
  onStart,
  onReset,
}: GameControlsProps) {
  const isPlaying = gameStatus === "PLAYING"
  const isGameOver = gameStatus === "LOST" || gameStatus === "CASHED_OUT"

  // Risk level based on mines count
  const riskLevel = minesCount <= 5 ? "Low" : minesCount <= 12 ? "Medium" : minesCount <= 18 ? "High" : "Extreme"
  const riskColor =
    minesCount <= 5
      ? "text-neon-lime"
      : minesCount <= 12
        ? "text-yellow"
        : minesCount <= 18
          ? "text-magenta"
          : "text-destructive"

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] border border-[#2a2a30] p-5">
      <div className="space-y-5">
        {/* Mines Count Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bomb className="h-4 w-4" />
              Mines
            </Label>
            <span className="text-xl font-bold text-foreground">{minesCount}</span>
          </div>
          <Slider
            value={[minesCount]}
            onValueChange={([value]) => setMinesCount(value)}
            min={1}
            max={24}
            step={1}
            disabled={isPlaying}
            className="[&_[role=slider]]:bg-neon-lime [&_[role=slider]]:border-neon-lime [&_[role=slider]]:shadow-[0_0_10px_rgba(56,248,104,0.5)] [&_.relative]:bg-surface-elevated-start [&_[data-disabled]_[role=slider]]:opacity-50"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">1</span>
            <span className="text-muted-foreground">24</span>
          </div>
        </div>

        {/* Risk Meter */}
        <div className="flex items-center justify-between rounded-xl bg-surface-deep px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Risk Level
          </div>
          <span className={`text-sm font-semibold ${riskColor}`}>{riskLevel}</span>
        </div>

        {/* Bet Amount Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Bet Amount
          </Label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, Number.parseFloat(e.target.value) || 1))}
            disabled={isPlaying}
            min={1}
            className="h-12 rounded-xl border-border bg-surface-deep text-lg font-semibold text-foreground focus:border-neon-lime focus:ring-neon-lime/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {!isPlaying && !isGameOver && (
            <Button
              onClick={onStart}
              variant="outline"
              className="h-12 rounded-xl border-neon-lime bg-transparent text-neon-lime font-semibold hover:bg-neon-lime/10 hover:text-neon-lime hover:shadow-[0_0_20px_rgba(56,248,104,0.3)] transition-all"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          )}

          {(isPlaying || isGameOver) && (
            <Button
              onClick={onReset}
              variant="outline"
              className="h-12 rounded-xl border-neon-lime bg-transparent text-neon-lime font-semibold hover:bg-neon-lime/10 hover:text-neon-lime hover:shadow-[0_0_20px_rgba(56,248,104,0.3)] transition-all"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              New Game
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
