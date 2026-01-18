"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { mockGames } from "@/lib/mock-data"
import { useApp } from "@/lib/app-context"
import { ArrowLeft, Info, Shield, Minus, Plus, Coins, Volume2, VolumeX, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GamePageProps {
  gameId: string | null
  onBack: () => void
}

export default function GamePage({ gameId, onBack }: GamePageProps) {
  const { user, activeGroup, activeSeason, addTransaction } = useApp()
  const [betAmount, setBetAmount] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<{ won: boolean; payout: number } | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameHistory, setGameHistory] = useState<Array<{ won: boolean; amount: number }>>([])

  const game = mockGames.find((g) => g.id === gameId)
  const currentBalance = activeSeason?.balances[user?.id || ""] ?? 0

  // Reset state when game changes
  useEffect(() => {
    setResult(null)
    setGameHistory([])
    setBetAmount(50)
  }, [gameId])

  const handlePlay = () => {
    if (!game || !user || !activeGroup || !activeSeason) return

    setIsPlaying(true)
    setResult(null)

    // Simulate game result
    setTimeout(() => {
      const won = Math.random() > 0.5
      const multiplier = won ? 1 + Math.random() * 2 : 0
      const payout = Math.floor(betAmount * multiplier)
      const net = payout - betAmount

      setResult({ won, payout })
      setIsPlaying(false)
      setGameHistory((prev) => [...prev.slice(-9), { won, amount: net }])

      // Add transaction
      addTransaction({
        userId: user.id,
        groupId: activeGroup.id,
        seasonId: activeSeason.id,
        game: game.name,
        bet: betAmount,
        payout,
        net,
      })
    }, 1500)
  }

  const adjustBet = (amount: number) => {
    setBetAmount(Math.max(1, Math.min(currentBalance, betAmount + amount)))
  }

  const setQuickBet = (percentage: number) => {
    setBetAmount(Math.max(1, Math.floor(currentBalance * percentage)))
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Game not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Game Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{game.name}</h1>
            <p className="text-sm text-muted-foreground">{game.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-muted-foreground hover:text-foreground"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Game Canvas Area */}
        <div className="flex-1 relative bg-background p-4 lg:p-8 flex items-center justify-center overflow-auto">
          {game.comingSoon ? (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                <span className="text-6xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
              <p className="text-muted-foreground max-w-md">This game is still in development. Check back later!</p>
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              {/* Game Visual */}
              <div
                className="aspect-video rounded-2xl bg-cover bg-center border-2 border-border overflow-hidden relative group"
                style={{ backgroundImage: `url(${game.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

                {/* Play animation overlay */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full border-4 border-neon-lime border-t-transparent animate-spin mx-auto" />
                      <p className="text-xl font-bold text-foreground animate-pulse">Playing...</p>
                    </div>
                  </div>
                )}

                {/* Result overlay */}
                {result && !isPlaying && (
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      result.won ? "bg-neon-lime/20" : "bg-magenta/20",
                    )}
                  >
                    <div className="text-center space-y-2 animate-in zoom-in duration-300">
                      <div className={cn("text-6xl font-black", result.won ? "text-neon-lime" : "text-magenta")}>
                        {result.won ? `+${result.payout - betAmount}` : `-${betAmount}`}
                      </div>
                      <p className={cn("text-xl font-bold", result.won ? "text-neon-lime" : "text-magenta")}>
                        {result.won ? "You Won!" : "Better Luck Next Time"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Results */}
              {gameHistory.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Recent:</span>
                  <div className="flex gap-1">
                    {gameHistory.map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                          h.won ? "bg-neon-lime/20 text-neon-lime" : "bg-magenta/20 text-magenta",
                        )}
                      >
                        {h.won ? "W" : "L"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Sidebar */}
        {!game.comingSoon && (
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-surface p-4 space-y-4 overflow-auto">
            {/* Balance Display */}
            <div className="p-4 rounded-xl bg-surface-elevated border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow" />
                  <span className="text-xl font-bold text-foreground">{currentBalance}</span>
                </div>
              </div>
            </div>

            {/* Bet Controls */}
            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Bet Amount</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow" />
                  <span className="font-bold text-foreground">{betAmount}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustBet(-10)}
                  className="border-border text-foreground bg-transparent"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Slider
                  value={[betAmount]}
                  onValueChange={([value]) => setBetAmount(value)}
                  max={Math.min(currentBalance, 500)}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustBet(10)}
                  className="border-border text-foreground bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(Math.min(amount, currentBalance))}
                    className={cn(
                      "border-border",
                      betAmount === amount
                        ? "bg-neon-lime/10 border-neon-lime text-neon-lime"
                        : "text-foreground bg-transparent",
                    )}
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "10%", value: 0.1 },
                  { label: "25%", value: 0.25 },
                  { label: "50%", value: 0.5 },
                  { label: "MAX", value: 1 },
                ].map(({ label, value }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickBet(value)}
                    className="border-border text-muted-foreground hover:text-foreground bg-transparent"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Play Button */}
            <Button
              onClick={handlePlay}
              disabled={isPlaying || betAmount > currentBalance || !activeSeason}
              className={cn(
                "w-full h-14 text-lg font-bold transition-all",
                "bg-neon-lime text-background hover:bg-neon-lime/90",
                isPlaying && "animate-pulse",
              )}
            >
              {isPlaying ? "Playing..." : !activeSeason ? "Join a Season First" : "Play"}
            </Button>

            {/* Game Info */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Game Rules</span>
              </div>
              <p className="text-sm text-muted-foreground">{getGameRules(game.id)}</p>
            </div>

            {/* Provably Fair */}
            <div className="p-4 rounded-xl bg-surface-elevated border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-cyan" />
                <span className="text-sm font-medium text-foreground">Provably Fair</span>
              </div>
              <p className="text-xs text-muted">
                Server seed hash and client seed will be revealed after each game for verification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getGameRules(gameId: string): string {
  const rules: Record<string, string> = {
    poker: "Texas Hold'em rules apply. Best 5-card hand wins the pot. Fold, call, or raise to play your strategy.",
    blackjack: "Get as close to 21 as possible without going over. Beat the dealer's hand to win. Blackjack pays 3:2.",
    mines:
      "Reveal tiles to find gems. Each gem increases your multiplier. Hit a mine and lose your bet. Cash out anytime!",
    plinko:
      "Drop the ball and watch it bounce. Land in higher multiplier zones to win big. Adjust risk level for more excitement.",
    crash:
      "Watch the multiplier rise and cash out before it crashes! The longer you wait, the higher the reward - but don't get greedy.",
    roulette: "Place your bets on numbers, colors, or sections. Spin the wheel and hope for the best!",
    dice: "Predict if the roll will be over or under your target. Higher risk = higher reward.",
    default: "Place your bet and let fate decide. May the odds be ever in your favor!",
  }
  return rules[gameId] || rules.default
}
