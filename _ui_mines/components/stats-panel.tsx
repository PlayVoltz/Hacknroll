"use client"

import type React from "react"

import { Gem, Bomb, Grid3X3, TrendingUp } from "lucide-react"
import type { GameStatus } from "./mines-game"

interface StatsPanelProps {
  tilesLeft: number
  gemsFound: number
  minesCount: number
  multiplier: number
  payout: number
  gameStatus: GameStatus
}

export function StatsPanel({ tilesLeft, gemsFound, minesCount, multiplier, payout, gameStatus }: StatsPanelProps) {
  const isPlaying = gameStatus === "PLAYING"
  const isCashedOut = gameStatus === "CASHED_OUT"

  return (
    <div className="space-y-4">
      {/* Current Multiplier - Glass Card */}
      <div className={`rounded-2xl p-5 glass-card ${isPlaying && gemsFound > 0 ? "animate-pulse-glow" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Current Multiplier
          </div>
          <span className="text-2xl font-bold text-neon-lime">{multiplier.toFixed(2)}x</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-foreground/10 pt-3">
          <span className="text-sm text-muted-foreground">Potential Payout</span>
          <span className={`text-lg font-semibold ${isCashedOut ? "text-cyan" : "text-foreground"}`}>
            ${payout.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Grid3X3 className="h-4 w-4" />} label="Tiles Left" value={tilesLeft} color="text-foreground" />
        <StatCard icon={<Gem className="h-4 w-4" />} label="Gems" value={gemsFound} color="text-neon-lime" />
        <StatCard icon={<Bomb className="h-4 w-4" />} label="Mines" value={minesCount} color="text-magenta" />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl bg-surface-deep p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}
