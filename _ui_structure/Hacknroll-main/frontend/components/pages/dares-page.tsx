"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Flame, Search, Filter, Sparkles, TreePine } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = ["all", "social", "physical", "creative", "food", "challenge"] as const
const intensities = ["all", "mild", "medium", "spicy", "nuclear"] as const

export default function DaresPage() {
  const { dares } = useApp()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<(typeof categories)[number]>("all")
  const [intensityFilter, setIntensityFilter] = useState<(typeof intensities)[number]>("all")

  const filteredDares = dares.filter((dare) => {
    const matchesSearch =
      dare.title.toLowerCase().includes(search.toLowerCase()) ||
      dare.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || dare.category === categoryFilter
    const matchesIntensity = intensityFilter === "all" || dare.intensity === intensityFilter
    return matchesSearch && matchesCategory && matchesIntensity
  })

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "mild":
        return "bg-neon-lime/20 text-neon-lime border-neon-lime/30"
      case "medium":
        return "bg-yellow/20 text-yellow border-yellow/30"
      case "spicy":
        return "bg-magenta/20 text-magenta border-magenta/30"
      case "nuclear":
        return "bg-purple/20 text-purple border-purple/30"
      default:
        return "bg-muted/20 text-muted-foreground"
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Flame className="w-7 h-7 text-magenta" />
          Dare Library
        </h1>
        <p className="text-muted-foreground">Browse and pick dares for your seasons</p>
      </div>

      {/* Quarterly Update Banner */}
      <div className="p-4 rounded-xl glass-card border border-neon-lime/20">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-neon-lime" />
          <div>
            <span className="font-semibold text-foreground">Q1 2024 Update Pack!</span>
            <span className="text-muted-foreground ml-2">10 new dares added this quarter</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Search dares..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-surface-elevated border-border text-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted-foreground">Category:</span>
          </div>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="outline"
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "capitalize border-border",
                categoryFilter === cat ? "bg-neon-lime/10 border-neon-lime text-neon-lime" : "text-foreground",
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted-foreground">Intensity:</span>
          </div>
          {intensities.map((int) => (
            <Button
              key={int}
              variant="outline"
              size="sm"
              onClick={() => setIntensityFilter(int)}
              className={cn(
                "capitalize border-border",
                intensityFilter === int ? getIntensityColor(int) : "text-foreground",
              )}
            >
              {int}
            </Button>
          ))}
        </div>
      </div>

      {/* Dare Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDares.map((dare) => (
          <div
            key={dare.id}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-foreground group-hover:text-neon-lime transition-colors">{dare.title}</h3>
              <span
                className={cn(
                  "px-2 py-1 text-xs font-semibold rounded-full capitalize border",
                  getIntensityColor(dare.intensity),
                )}
              >
                {dare.intensity}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{dare.description}</p>

            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-surface-elevated text-muted-foreground capitalize">
                {dare.category}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-surface-elevated text-muted-foreground flex items-center gap-1">
                {dare.indoor ? (
                  <>
                    <span className="w-3 h-3">🏠</span> Indoor
                  </>
                ) : (
                  <>
                    <TreePine className="w-3 h-3" /> Outdoor
                  </>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredDares.length === 0 && (
        <div className="text-center py-12">
          <Flame className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No dares found</h3>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
