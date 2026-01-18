"use client"

import type { Game } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Sparkles, Lock } from "lucide-react"

interface GameTileProps {
  game: Game
  onClick: () => void
  size?: "normal" | "large"
}

export default function GameTile({ game, onClick, size = "normal" }: GameTileProps) {
  return (
    <button
      onClick={game.comingSoon ? undefined : onClick}
      className={cn(
        "relative group rounded-2xl overflow-hidden bg-surface border border-border transition-all duration-300",
        "hover:border-neon-lime/50 neon-glow-hover",
        "flex-shrink-0",
        size === "large" ? "w-[280px] h-[180px]" : "w-[200px] h-[140px]",
        game.comingSoon && "opacity-60 cursor-not-allowed hover:border-border",
      )}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundImage: `url(${game.image})` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        {game.isNew && (
          <span className="px-2 py-1 text-xs font-bold bg-neon-lime text-background rounded-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            NEW
          </span>
        )}
        {game.comingSoon && (
          <span className="px-2 py-1 text-xs font-semibold bg-surface-elevated text-muted-foreground rounded-md flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Soon
          </span>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className={cn("font-bold text-foreground", size === "large" ? "text-xl" : "text-lg")}>{game.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{game.description}</p>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-neon-lime/5" />
      </div>
    </button>
  )
}
