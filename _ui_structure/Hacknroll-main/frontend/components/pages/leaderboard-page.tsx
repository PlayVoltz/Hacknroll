"use client"

import { useApp } from "@/lib/app-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Skull } from "lucide-react"
import { mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function LeaderboardPage() {
  const { activeGroup, activeSeason } = useApp()

  if (!activeGroup || !activeSeason) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Active Season</h3>
          <p className="text-muted-foreground">Join or create a season to see the leaderboard!</p>
        </div>
      </div>
    )
  }

  // Sort members by balance
  const leaderboard = activeGroup.members
    .map((memberId) => ({
      user: mockUsers.find((u) => u.id === memberId)!,
      balance: activeSeason.balances[memberId] || 1000,
      change: (activeSeason.balances[memberId] || 1000) - 1000,
    }))
    .sort((a, b) => b.balance - a.balance)

  const getPositionStyle = (position: number) => {
    if (position === 0) return "bg-yellow/10 border-yellow/30"
    if (position === 1) return "bg-muted/10 border-muted/30"
    if (position === 2) return "bg-[#CD7F32]/10 border-[#CD7F32]/30"
    if (position === leaderboard.length - 1) return "bg-magenta/10 border-magenta/30"
    return "bg-surface border-border"
  }

  const getPositionIcon = (position: number) => {
    if (position === 0) return <Crown className="w-5 h-5 text-yellow" />
    if (position === leaderboard.length - 1) return <Skull className="w-5 h-5 text-magenta" />
    return <span className="text-muted-foreground font-bold">#{position + 1}</span>
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="w-7 h-7 text-yellow" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          {activeGroup.name} • {activeSeason.name}
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        {leaderboard.slice(0, 3).map((entry, index) => {
          const order = [1, 0, 2][index] // 2nd, 1st, 3rd for visual
          const actualEntry = leaderboard[order]
          if (!actualEntry) return null

          return (
            <div
              key={actualEntry.user.id}
              className={cn(
                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                order === 0 && "bg-yellow/10 border-yellow/30 -mt-4",
                order === 1 && "bg-muted/10 border-muted/30",
                order === 2 && "bg-[#CD7F32]/10 border-[#CD7F32]/30",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold",
                  order === 0 && "bg-yellow text-background",
                  order === 1 && "bg-muted text-foreground",
                  order === 2 && "bg-[#CD7F32] text-background",
                )}
              >
                {order + 1}
              </div>
              <Avatar className="w-16 h-16 border-2 border-border mb-2">
                <AvatarImage src={actualEntry.user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-surface-elevated text-foreground">
                  {actualEntry.user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground text-center">{actualEntry.user.username}</span>
              <span className="text-xl font-bold text-foreground">{actualEntry.balance.toLocaleString()}</span>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm",
                  actualEntry.change > 0 ? "text-neon-lime" : actualEntry.change < 0 ? "text-magenta" : "text-muted",
                )}
              >
                {actualEntry.change > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : actualEntry.change < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {actualEntry.change > 0 ? "+" : ""}
                {actualEntry.change}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full List */}
      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.user.id}
            className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all", getPositionStyle(index))}
          >
            <div className="w-8 flex justify-center">{getPositionIcon(index)}</div>

            <Avatar className="w-10 h-10">
              <AvatarImage src={entry.user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-surface-elevated text-foreground">
                {entry.user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <span className="font-semibold text-foreground">{entry.user.username}</span>
              {index === leaderboard.length - 1 && <span className="ml-2 text-xs text-magenta">DANGER ZONE 💀</span>}
            </div>

            <div className="text-right">
              <div className="font-bold text-foreground">{entry.balance.toLocaleString()}</div>
              <div
                className={cn(
                  "flex items-center justify-end gap-1 text-sm",
                  entry.change > 0 ? "text-neon-lime" : entry.change < 0 ? "text-magenta" : "text-muted",
                )}
              >
                {entry.change > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : entry.change < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {entry.change > 0 ? "+" : ""}
                {entry.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
