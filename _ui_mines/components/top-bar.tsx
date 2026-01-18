"use client"

import { Bomb, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GameStatus } from "./mines-game"

interface TopBarProps {
  gameStatus: GameStatus
  onBack?: () => void
}

const statusConfig: Record<GameStatus, { label: string; className: string }> = {
  READY: { label: "READY", className: "bg-muted text-muted-foreground" },
  PLAYING: { label: "PLAYING", className: "bg-neon-lime/20 text-neon-lime border border-neon-lime/30" },
  LOST: { label: "LOST", className: "bg-magenta/20 text-magenta border border-magenta/30" },
  CASHED_OUT: { label: "CASHED OUT", className: "bg-cyan/20 text-cyan border border-cyan/30" },
}

export function TopBar({ gameStatus, onBack }: TopBarProps) {
  const status = statusConfig[gameStatus]

  return (
    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] border border-[#2a2a30] px-5 py-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-neon-lime/10 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-lime/10">
          <Bomb className="h-5 w-5 text-neon-lime" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neon-lime">MINES</h1>
      </div>

      <div className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${status.className}`}>
        {status.label}
      </div>
    </div>
  )
}
