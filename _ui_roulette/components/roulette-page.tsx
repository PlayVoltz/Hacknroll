"use client"

import { useCallback, useEffect, useState } from "react"
import { RouletteWheel } from "./roulette-wheel"
import { BetPanel, type BetColor } from "./bet-panel"
import { BetBoard, type Bet } from "./bet-board"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
]

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

const getSegmentColor = (num: number): "red" | "black" | "green" => {
  if (num === 0) return "green"
  return RED_NUMBERS.includes(num) ? "red" : "black"
}

const SEGMENTS = WHEEL_NUMBERS.map((num) => ({
  number: num,
  color: getSegmentColor(num),
}))

const SEGMENT_COUNT = 37

const BETTING_TIME = 7 // seconds

function generateRoundId() {
  return `PZY${Math.random().toString(36).substring(2, 5).toUpperCase()}${Math.floor(Math.random() * 1000)}`
}

export function RoulettePage() {
  const [countdown, setCountdown] = useState(BETTING_TIME)
  const [isSpinning, setIsSpinning] = useState(false)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [result, setResult] = useState<{ color: "red" | "black" | "green"; index: number } | null>(null)
  const [roundId, setRoundId] = useState(generateRoundId())
  const [bets, setBets] = useState<Bet[]>([])
  const [currentBet, setCurrentBet] = useState<{ amount: number; color: BetColor } | null>(null)
  const [showResult, setShowResult] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (isSpinning) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Start spin
          startSpin()
          return BETTING_TIME
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isSpinning])

  const startSpin = () => {
    setIsSpinning(true)
    setShowResult(false)

    const randomIndex = Math.floor(Math.random() * SEGMENT_COUNT)
    setTargetIndex(randomIndex)
  }

  const handleSpinComplete = useCallback(() => {
    if (targetIndex !== null) {
      const winningSegment = SEGMENTS[targetIndex]
      setResult({ color: winningSegment.color, index: targetIndex })
      setShowResult(true)

      // Reset for next round after a delay
      setTimeout(() => {
        setIsSpinning(false)
        setTargetIndex(null)
        setRoundId(generateRoundId())
        setBets([])
        setCurrentBet(null)
        setCountdown(BETTING_TIME)
      }, 3000)
    }
  }, [targetIndex])

  const handlePlaceBet = (amount: number, color: BetColor) => {
    if (isSpinning || countdown <= 0) return

    const newBet: Bet = {
      username: "You",
      amount,
      color,
    }

    setBets((prev) => [...prev, newBet])
    setCurrentBet({ amount, color })

    // Add some mock bets for visual interest
    const mockNames = ["Player42", "LuckyOne", "HighRoller", "Gambler99"]
    const mockColors: BetColor[] = ["red", "black", "green"]

    setTimeout(() => {
      if (Math.random() > 0.5) {
        setBets((prev) => [
          ...prev,
          {
            username: mockNames[Math.floor(Math.random() * mockNames.length)],
            amount: Math.floor(Math.random() * 50) + 5,
            color: mockColors[Math.floor(Math.random() * mockColors.length)],
          },
        ])
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background noise-bg">
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-start justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Roulette</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Pick a color. One bet per spin. Watch the board fill up.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full bg-secondary/50 hover:bg-secondary gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Wheel panel */}
          <div className="glass-card-glow rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Wheel</h2>
              {showResult && result && (
                <div
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-bold",
                    result.color === "red" && "bg-red-600 text-white",
                    result.color === "black" && "bg-zinc-700 text-white",
                    result.color === "green" && "bg-green-600 text-white",
                  )}
                  role="status"
                  aria-live="polite"
                >
                  {result.color.toUpperCase()}
                </div>
              )}
              {!showResult && (
                <div className="px-3 py-1 rounded-full bg-secondary/50 text-sm text-muted-foreground">RESULT</div>
              )}
            </div>

            <p
              className={cn(
                "text-sm mb-6 text-center",
                countdown <= 3 && !isSpinning ? "text-yellow-400" : "text-muted-foreground",
              )}
              role="timer"
              aria-live="polite"
            >
              {isSpinning ? "Spinning..." : `Betting closes in ${countdown}s.`}
            </p>

            <div className="flex-1 flex items-center justify-center py-4">
              <RouletteWheel
                isSpinning={isSpinning}
                targetIndex={targetIndex}
                onSpinComplete={handleSpinComplete}
                result={result}
              />
            </div>
          </div>

          {/* Bet panel */}
          <BetPanel
            roundId={roundId}
            onPlaceBet={handlePlaceBet}
            disabled={isSpinning || countdown <= 0}
            currentBet={currentBet}
          />
        </div>

        {/* Bet board */}
        <BetBoard bets={bets} />
      </div>
    </div>
  )
}
