"use client"

import { useState, useEffect } from "react"
import { Gem, Bomb } from "lucide-react"
import type { GameStatus, TileState } from "./mines-game"

interface TileProps {
  tile: TileState
  gameStatus: GameStatus
  onClick: () => void
  index: number
}

export function Tile({ tile, gameStatus, onClick, index }: TileProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [wasRevealed, setWasRevealed] = useState(false)

  useEffect(() => {
    if (tile.isRevealed && !wasRevealed) {
      setIsAnimating(true)
      setWasRevealed(true)
      const timer = setTimeout(() => setIsAnimating(false), 400)
      return () => clearTimeout(timer)
    }
    if (!tile.isRevealed) {
      setWasRevealed(false)
    }
  }, [tile.isRevealed, wasRevealed])

  const isDisabled = gameStatus !== "PLAYING" || tile.isRevealed
  const isClickable = gameStatus === "PLAYING" && !tile.isRevealed

  const baseClasses =
    "aspect-square rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deep"

  let stateClasses = ""

  if (!tile.isRevealed) {
    stateClasses = isClickable
      ? "bg-gradient-to-b from-[#2a2a2f] to-[#1a1a1f] border-2 border-[#3a3a40] cursor-pointer hover:border-neon-lime hover:shadow-[0_0_15px_rgba(56,248,104,0.3)] active:scale-95"
      : "bg-gradient-to-b from-[#2a2a2f] to-[#1a1a1f] border-2 border-[#3a3a40] opacity-60 cursor-not-allowed"
  } else if (tile.isMine) {
    stateClasses = `bg-magenta/20 border-2 border-magenta shadow-[0_0_20px_rgba(224,72,144,0.4)] ${isAnimating ? "animate-shake" : ""}`
  } else {
    stateClasses = `bg-neon-lime/10 border-2 border-neon-lime/50 shadow-[0_0_15px_rgba(56,248,104,0.3)] ${isAnimating ? "animate-tile-flip" : ""}`
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${stateClasses}`}
      tabIndex={isClickable ? 0 : -1}
      aria-label={tile.isRevealed ? (tile.isMine ? "Mine revealed" : "Gem revealed") : `Tile ${index + 1}, unrevealed`}
    >
      {tile.isRevealed && (
        <div className={isAnimating ? "animate-tile-flip" : ""}>
          {tile.isMine ? (
            <Bomb className="h-6 w-6 md:h-8 md:w-8 text-magenta" />
          ) : (
            <Gem className="h-6 w-6 md:h-8 md:w-8 text-neon-lime" />
          )}
        </div>
      )}
    </button>
  )
}
