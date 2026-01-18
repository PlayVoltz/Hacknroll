"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Receipt, TrendingUp, TrendingDown, Filter, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const gameFilters = ["All", "Blackjack", "Poker", "Mines", "Crash", "Roulette", "Plinko"] as const

export default function LedgerPage() {
  const { user, activeGroup, activeSeason, transactions } = useApp()
  const [gameFilter, setGameFilter] = useState<string>("All")

  const userTransactions = transactions
    .filter(
      (tx) =>
        tx.userId === user?.id && tx.groupId === activeGroup?.id && (gameFilter === "All" || tx.game === gameFilter),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const totalNet = userTransactions.reduce((sum, tx) => sum + tx.net, 0)
  const totalBets = userTransactions.reduce((sum, tx) => sum + tx.bet, 0)
  const totalWins = userTransactions.filter((tx) => tx.net > 0).length
  const totalLosses = userTransactions.filter((tx) => tx.net < 0).length

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Receipt className="w-7 h-7 text-cyan" />
          Transaction Ledger
        </h1>
        <p className="text-muted-foreground">
          {activeGroup?.name} • {activeSeason?.name || "No active season"}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="text-sm text-muted-foreground">Total Wagered</div>
          <div className="text-2xl font-bold text-foreground">{totalBets.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="text-sm text-muted-foreground">Net P/L</div>
          <div
            className={cn(
              "text-2xl font-bold",
              totalNet > 0 ? "text-neon-lime" : totalNet < 0 ? "text-magenta" : "text-foreground",
            )}
          >
            {totalNet > 0 ? "+" : ""}
            {totalNet.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="text-sm text-muted-foreground">Wins</div>
          <div className="text-2xl font-bold text-neon-lime">{totalWins}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="text-sm text-muted-foreground">Losses</div>
          <div className="text-2xl font-bold text-magenta">{totalLosses}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted" />
        {gameFilters.map((game) => (
          <Button
            key={game}
            variant="outline"
            size="sm"
            onClick={() => setGameFilter(game)}
            className={cn(
              "border-border",
              gameFilter === game ? "bg-cyan/10 border-cyan text-cyan" : "text-foreground",
            )}
          >
            {game}
          </Button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {userTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-border/80 transition-all"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                tx.net > 0 ? "bg-neon-lime/10" : "bg-magenta/10",
              )}
            >
              {tx.net > 0 ? (
                <TrendingUp className="w-5 h-5 text-neon-lime" />
              ) : (
                <TrendingDown className="w-5 h-5 text-magenta" />
              )}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-foreground">{tx.game}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(tx.timestamp), "MMM d, h:mm a")}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Bet: {tx.bet} → Payout: {tx.payout}
              </div>
              <div className={cn("font-bold", tx.net > 0 ? "text-neon-lime" : "text-magenta")}>
                {tx.net > 0 ? "+" : ""}
                {tx.net}
              </div>
            </div>
          </div>
        ))}
      </div>

      {userTransactions.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
          <p className="text-muted-foreground">Start playing games to see your history!</p>
        </div>
      )}
    </div>
  )
}
