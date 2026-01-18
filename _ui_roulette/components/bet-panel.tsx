"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type BetColor = "black" | "red" | "green"

interface BetPanelProps {
  roundId: string
  onPlaceBet: (amount: number, color: BetColor) => void
  disabled: boolean
  currentBet: { amount: number; color: BetColor } | null
}

export function BetPanel({ roundId, onPlaceBet, disabled, currentBet }: BetPanelProps) {
  const [amount, setAmount] = useState(10)
  const [selectedColor, setSelectedColor] = useState<BetColor | null>(null)

  const handlePlaceBet = () => {
    if (selectedColor && amount > 0) {
      onPlaceBet(amount, selectedColor)
    }
  }

  const colorButtons: Array<{ color: BetColor; label: string; className: string }> = [
    {
      color: "black",
      label: "Black",
      className: "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white",
    },
    {
      color: "red",
      label: "Red",
      className: "bg-red-700 hover:bg-red-600 border-red-600 text-white",
    },
    {
      color: "green",
      label: "Green",
      className: "bg-green-700 hover:bg-green-600 border-green-600 text-white",
    },
  ]

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Place bet</h2>
        <p className="text-sm text-muted-foreground mt-1">Red/Black pays 2x. Green pays 14x.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Amount</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number.parseInt(e.target.value) || 1))}
          className="text-center text-lg font-semibold bg-secondary/30 border-border/50 h-12"
          min={1}
          disabled={disabled}
          aria-label="Bet amount"
        />
      </div>

      {/* Round ID */}
      <p className="text-sm text-muted-foreground">
        Round <span className="font-mono text-foreground">{roundId}</span> · Pick a color below.
      </p>

      {/* Color buttons */}
      <div className="grid grid-cols-3 gap-3">
        {colorButtons.map(({ color, label, className }) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            disabled={disabled}
            className={cn(
              "py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2",
              className,
              selectedColor === color
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                : "opacity-80 hover:opacity-100",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            aria-pressed={selectedColor === color}
            aria-label={`Bet on ${label}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Place bet button */}
      <Button
        onClick={handlePlaceBet}
        disabled={disabled || !selectedColor || currentBet !== null}
        className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] disabled:opacity-50 disabled:shadow-none"
      >
        {currentBet ? "Bet Placed" : "Place Bet"}
      </Button>

      {currentBet && (
        <p className="text-center text-sm text-green-400">
          You bet {currentBet.amount} on {currentBet.color}
        </p>
      )}
    </div>
  )
}
