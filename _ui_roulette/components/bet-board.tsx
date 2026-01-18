"use client"

import { cn } from "@/lib/utils"
import type { BetColor } from "./bet-panel"

export interface Bet {
  username: string
  amount: number
  color: BetColor
}

interface BetBoardProps {
  bets: Bet[]
}

export function BetBoard({ bets }: BetBoardProps) {
  const columns: Array<{ color: BetColor; label: string; bgClass: string; borderClass: string }> = [
    { color: "black", label: "Black", bgClass: "bg-zinc-900/50", borderClass: "border-zinc-700" },
    { color: "red", label: "Red", bgClass: "bg-red-950/30", borderClass: "border-red-800/50" },
    { color: "green", label: "Green", bgClass: "bg-green-950/30", borderClass: "border-green-800/50" },
  ]

  const getBetsForColor = (color: BetColor) => bets.filter((bet) => bet.color === color)

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Bet board</h2>
        <p className="text-sm text-muted-foreground mt-1">Who bet what (one bet per user per spin).</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {columns.map(({ color, label, bgClass, borderClass }) => {
          const colorBets = getBetsForColor(color)

          return (
            <div key={color} className={cn("rounded-xl border p-4 min-h-[200px] flex flex-col", bgClass, borderClass)}>
              <div className="mb-3">
                <h3
                  className={cn(
                    "font-bold",
                    color === "red" && "text-red-400",
                    color === "black" && "text-zinc-300",
                    color === "green" && "text-green-400",
                  )}
                >
                  {label}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[150px]">
                {colorBets.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">No bets yet.</p>
                ) : (
                  colorBets.map((bet, index) => (
                    <div
                      key={`${bet.username}-${index}`}
                      className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-black/20"
                    >
                      <span className="text-foreground/80">{bet.username}</span>
                      <span className="font-mono text-foreground">{bet.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
