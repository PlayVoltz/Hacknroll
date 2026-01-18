"use client"

import { useState, useCallback } from "react"
import { ChevronRight, Shield, AlertCircle } from "lucide-react"
import { ControlPanel } from "./control-panel"
import { GameStage } from "./game-stage"
import { useToast } from "@/hooks/use-toast"

interface GameResult {
  side: "heads" | "tails"
  won: boolean
  net: number
  timestamp: Date
}

interface CoinTossGameProps {
  balance: number
  onBalanceChange: (balance: number) => void
}

export function CoinTossGame({ balance, onBalanceChange }: CoinTossGameProps) {
  const { toast } = useToast()
  const [betAmount, setBetAmount] = useState(100)
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | "random">("heads")
  const [streakMode, setStreakMode] = useState(false)
  const [flipsPerStreak, setFlipsPerStreak] = useState(3)
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState<"heads" | "tails" | null>(null)
  const [hasWon, setHasWon] = useState<boolean | null>(null)
  const [history, setHistory] = useState<GameResult[]>([])
  const [streakMultiplier, setStreakMultiplier] = useState(1.0)
  const [currentWinnings, setCurrentWinnings] = useState(0)
  const [consecutiveWins, setConsecutiveWins] = useState(0)

  const flipCoin = useCallback(() => {
    const actualChoice = selectedSide === "random" ? (Math.random() > 0.5 ? "heads" : "tails") : selectedSide

    setIsFlipping(true)
    onBalanceChange(balance - betAmount)

    toast({
      description: "Bet placed",
      duration: 1500,
    })

    const flipResult: "heads" | "tails" = Math.random() > 0.5 ? "heads" : "tails"
    const won = flipResult === actualChoice

    setTimeout(() => {
      setResult(flipResult)
      setIsFlipping(false)
      setHasWon(won)

      const winAmount = Math.floor(betAmount * streakMultiplier * 1.98)

      if (won) {
        const newWinnings = currentWinnings + winAmount
        setCurrentWinnings(newWinnings)
        setConsecutiveWins((prev) => prev + 1)

        if (streakMode) {
          setStreakMultiplier((prev) => Math.min(prev * 1.9, 100))
        } else {
          onBalanceChange(balance - betAmount + winAmount)
          setCurrentWinnings(0)
        }

        toast({
          description: `Win! +${winAmount.toLocaleString()} credits`,
          duration: 2000,
        })
      } else {
        setCurrentWinnings(0)
        setConsecutiveWins(0)
        setStreakMultiplier(1.0)

        toast({
          description: `Loss! -${betAmount.toLocaleString()} credits`,
          duration: 2000,
        })
      }

      setHistory((prev) => [
        ...prev,
        {
          side: flipResult,
          won,
          net: won ? winAmount : -betAmount,
          timestamp: new Date(),
        },
      ])
    }, 2000)
  }, [selectedSide, betAmount, balance, streakMultiplier, currentWinnings, streakMode, onBalanceChange, toast])

  const handleBet = () => {
    if (betAmount <= 0 || betAmount > balance) {
      toast({
        variant: "destructive",
        description: "Invalid bet amount",
      })
      return
    }
    flipCoin()
  }

  const handleFlipAgain = () => {
    if (betAmount > balance) {
      toast({
        variant: "destructive",
        description: "Insufficient balance",
      })
      return
    }
    flipCoin()
  }

  const handleCashOut = () => {
    const total = currentWinnings
    onBalanceChange(balance + total)
    setCurrentWinnings(0)
    setConsecutiveWins(0)
    setStreakMultiplier(1.0)
    setHasWon(null)
    setResult(null)

    toast({
      description: `Cashed out ${total.toLocaleString()} credits!`,
      duration: 2500,
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-4">
        <span className="text-[#778184] hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#778184]" />
        <span className="text-[#778184] hover:text-white cursor-pointer transition-colors">Originals</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#778184]" />
        <span className="text-white">Coin Toss</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold text-white">Coin Toss</h1>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#211E21] text-xs font-medium text-[#9DA6A3]">
            <Shield className="w-3.5 h-3.5" />
            Provably-fair UI
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#211E21] text-xs font-medium text-[#9DA6A3]">
            <AlertCircle className="w-3.5 h-3.5" />
            18+
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Mobile: Game Stage First */}
        <div className="lg:hidden">
          <GameStage
            isFlipping={isFlipping}
            result={result}
            hasWon={hasWon}
            winAmount={Math.floor(betAmount * streakMultiplier * 1.98)}
            betAmount={betAmount}
            streakMultiplier={streakMultiplier}
            history={history}
          />
        </div>

        {/* Control Panel */}
        <ControlPanel
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          selectedSide={selectedSide}
          onSideChange={setSelectedSide}
          streakMode={streakMode}
          onStreakModeChange={setStreakMode}
          flipsPerStreak={flipsPerStreak}
          onFlipsPerStreakChange={setFlipsPerStreak}
          onBet={handleBet}
          onFlipAgain={handleFlipAgain}
          onCashOut={handleCashOut}
          isFlipping={isFlipping}
          hasWon={hasWon}
          balance={balance}
          currentWinnings={currentWinnings}
        />

        {/* Desktop: Game Stage */}
        <div className="hidden lg:block flex-1">
          <GameStage
            isFlipping={isFlipping}
            result={result}
            hasWon={hasWon}
            winAmount={Math.floor(betAmount * streakMultiplier * 1.98)}
            betAmount={betAmount}
            streakMultiplier={streakMultiplier}
            history={history}
          />
        </div>
      </div>
    </div>
  )
}
