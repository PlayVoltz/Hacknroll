"use client"

import { useApp } from "@/lib/app-context"
import { mockGames } from "@/lib/mock-data"
import GameTile from "../game-tile"
import CarouselRow from "../carousel-row"
import { Button } from "@/components/ui/button"
import { Plus, Users, Clock, Sparkles, Zap, PartyPopper } from "lucide-react"
import { useState } from "react"
import CreateSeasonModal from "../create-season-modal"

interface HomePageProps {
  onOpenGame: (gameId: string) => void
}

export default function HomePage({ onOpenGame }: HomePageProps) {
  const { activeGroup, activeSeason, user } = useApp()
  const [showCreateSeason, setShowCreateSeason] = useState(false)

  const originals = mockGames.filter((g) => g.category === "originals")
  const popular = mockGames.filter((g) => g.category === "popular" || g.category === "originals").slice(0, 6)
  const newGames = mockGames.filter((g) => g.isNew)
  const partyModes = mockGames.filter((g) => g.category === "party")

  const getTimeRemaining = () => {
    if (!activeSeason) return null
    const end = new Date(activeSeason.endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-full overflow-hidden">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-surface border border-border overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/5 via-transparent to-magenta/5" />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Play the season. <span className="text-gradient">Someone&apos;s doing the dare.</span>
              </h1>

              {activeGroup ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{activeGroup.name}</span>
                  </div>

                  {activeSeason ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-lime/10 border border-neon-lime/20">
                        <Sparkles className="w-4 h-4 text-neon-lime" />
                        <span className="text-neon-lime font-medium">{activeSeason.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-yellow">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{getTimeRemaining()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No active season. Create one to start competing!</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Join or create a group to get started!</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {activeGroup && !activeSeason && (
                <Button
                  onClick={() => setShowCreateSeason(true)}
                  className="bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold neon-glow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Season
                </Button>
              )}
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-surface-elevated bg-transparent"
              >
                <Users className="w-4 h-4 mr-2" />
                Invite Friends
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DarePot Originals */}
      <CarouselRow title="DarePot Originals" icon={<Zap className="w-5 h-5 text-neon-lime" />}>
        {originals.map((game) => (
          <GameTile key={game.id} game={game} onClick={() => onOpenGame(game.id)} size="large" />
        ))}
      </CarouselRow>

      {/* Popular Games */}
      <CarouselRow title="Popular" icon={<Sparkles className="w-5 h-5 text-yellow" />}>
        {popular.map((game) => (
          <GameTile key={game.id} game={game} onClick={() => onOpenGame(game.id)} />
        ))}
      </CarouselRow>

      {/* New This Season */}
      {newGames.length > 0 && (
        <CarouselRow title="New This Season" icon={<Sparkles className="w-5 h-5 text-cyan" />}>
          {newGames.map((game) => (
            <GameTile key={game.id} game={game} onClick={() => onOpenGame(game.id)} />
          ))}
        </CarouselRow>
      )}

      {/* Party Modes */}
      <CarouselRow
        title="Party Modes"
        subtitle="Best with friends"
        icon={<PartyPopper className="w-5 h-5 text-magenta" />}
      >
        {partyModes.map((game) => (
          <GameTile key={game.id} game={game} onClick={() => onOpenGame(game.id)} />
        ))}
      </CarouselRow>

      {/* Create Season Modal */}
      <CreateSeasonModal open={showCreateSeason} onClose={() => setShowCreateSeason(false)} />
    </div>
  )
}
