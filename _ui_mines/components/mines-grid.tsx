"use client"

import { HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tile } from "./tile"
import type { GameStatus, TileState } from "./mines-game"

interface MinesGridProps {
  tiles: TileState[]
  gameStatus: GameStatus
  onReveal: (index: number) => void
  onCashOut: () => void
  gemsFound: number
  multiplier: number
  betAmount: number
}

export function MinesGrid({
  tiles,
  gameStatus,
  onReveal,
  onCashOut,
  gemsFound,
  multiplier,
  betAmount,
}: MinesGridProps) {
  const isPlaying = gameStatus === "PLAYING"
  const canCashOut = isPlaying && gemsFound > 0
  const payout = (betAmount * multiplier).toFixed(2)

  return (
    <div className="space-y-4">
      {isPlaying && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] border border-[#2a2a30] p-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Current Payout</span>
            <span className="text-xl font-bold text-neon-lime">${payout}</span>
          </div>
          <Button
            onClick={onCashOut}
            disabled={!canCashOut}
            className="h-12 rounded-xl bg-magenta text-white font-semibold hover:bg-magenta/90 hover:shadow-[0_0_20px_rgba(224,72,144,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HandCoins className="mr-2 h-5 w-5" />
            Cash Out
          </Button>
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] border border-[#2a2a30] p-4 md:p-6">
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {tiles.map((tile, index) => (
            <Tile key={index} tile={tile} gameStatus={gameStatus} onClick={() => onReveal(index)} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
