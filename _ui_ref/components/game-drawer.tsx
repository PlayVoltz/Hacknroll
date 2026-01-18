"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { mockGames } from "@/lib/mock-data"
import { useApp } from "@/lib/app-context"
import { X, Info, Shield, Minus, Plus, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameDrawerProps {
  gameId: string | null
  onClose: () => void
}

export default function GameDrawer({ gameId, onClose }: GameDrawerProps) {
  const { user, activeGroup, activeSeason, addTransaction } = useApp()
  const [betAmount, setBetAmount] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<{ won: boolean; payout: number } | null>(null)

  const game = mockGames.find((g) => g.id === gameId)
  const currentBalance = activeSeason?.balances[user?.id || ""] ?? 0

  const handlePlay = () => {
    if (!game || !user || !activeGroup || !activeSeason) return

    setIsPlaying(true)
    setResult(null)

    // Simulate game result
    setTimeout(() => {
      const won = Math.random() > 0.5
      const multiplier = won ? 1 + Math.random() * 2 : 0
      const payout = Math.floor(betAmount * multiplier)

      setResult({ won, payout })
      setIsPlaying(false)

      // Add transaction
      addTransaction({
        userId: user.id,
        groupId: activeGroup.id,
        seasonId: activeSeason.id,
        game: game.name,
        bet: betAmount,
        payout,
        net: payout - betAmount,
      })
    }, 1500)
  }

  const adjustBet = (amount: number) => {
    setBetAmount(Math.max(1, Math.min(currentBalance, betAmount + amount)))
  }

  if (!game) return null

  return (
    <Sheet open={!!gameId} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-surface border-l border-border p-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface border-b border-border">
          <SheetHeader className="p-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold text-foreground">{game.name}</SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>
        </div>

        <div className="p-4 space-y-6">
          {/* Game Preview */}
          <div
            className="aspect-video rounded-2xl bg-cover bg-center border border-border overflow-hidden"
            style={{ backgroundImage: `url(${game.image})` }}
          >
            <div className="w-full h-full bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
              <p className="text-foreground font-medium">{game.description}</p>
            </div>
          </div>

          {game.comingSoon ? (
            <div className="p-6 rounded-xl bg-surface-elevated border border-border text-center">
              <p className="text-muted-foreground">This game is coming soon!</p>
              <p className="text-sm text-muted mt-2">Stay tuned for updates.</p>
            </div>
          ) : (
            <>
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
                    className="border-border text-foreground"
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
                    className="border-border text-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(Math.min(amount, currentBalance))}
                      className={cn(
                        "flex-1 border-border",
                        betAmount === amount ? "bg-neon-lime/10 border-neon-lime text-neon-lime" : "text-foreground",
                      )}
                    >
                      {amount}
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
                  "bg-neon-lime text-background hover:bg-neon-lime-glow neon-glow",
                  isPlaying && "animate-pulse",
                )}
              >
                {isPlaying ? "Playing..." : !activeSeason ? "Join a Season First" : "Play"}
              </Button>

              {/* Result */}
              {result && (
                <div
                  className={cn(
                    "p-4 rounded-xl border text-center",
                    result.won ? "bg-neon-lime/10 border-neon-lime" : "bg-magenta/10 border-magenta",
                  )}
                >
                  <div className={cn("text-2xl font-bold", result.won ? "text-neon-lime" : "text-magenta")}>
                    {result.won ? `+${result.payout - betAmount}` : `-${betAmount}`}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {result.won ? "You won!" : "Better luck next time!"}
                  </div>
                </div>
              )}

              {/* Game Info */}
              <div className="space-y-3">
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
                  <span className="text-sm font-medium text-foreground">Provably Fair Ready</span>
                </div>
                <p className="text-xs text-muted">
                  Server seed hash and client seed will be revealed after each game for verification.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
