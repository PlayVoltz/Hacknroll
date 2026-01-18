"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import { Clock, Flame, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateSeasonModalProps {
  open: boolean
  onClose: () => void
}

const durations = [
  { value: "1h", label: "1 Hour", description: "Quick sprint" },
  { value: "1d", label: "1 Day", description: "Daily challenge" },
  { value: "3d", label: "3 Days", description: "Weekend warriors" },
  { value: "1w", label: "1 Week", description: "The marathon" },
]

export default function CreateSeasonModal({ open, onClose }: CreateSeasonModalProps) {
  const { activeGroup, dares, createSeason } = useApp()
  const [step, setStep] = useState<"duration" | "dares">("duration")
  const [selectedDuration, setSelectedDuration] = useState("1d")
  const [selectedDares, setSelectedDares] = useState<string[]>([])

  const toggleDare = (dareId: string) => {
    if (selectedDares.includes(dareId)) {
      setSelectedDares((prev) => prev.filter((id) => id !== dareId))
    } else if (selectedDares.length < 3) {
      setSelectedDares((prev) => [...prev, dareId])
    }
  }

  const handleCreate = () => {
    if (activeGroup && selectedDares.length > 0) {
      createSeason(activeGroup.id, selectedDuration, selectedDares)
      onClose()
      setStep("duration")
      setSelectedDares([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {step === "duration" ? "Create New Season" : "Choose Dares for the Loser"}
          </DialogTitle>
        </DialogHeader>

        {step === "duration" ? (
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan" />
                Season Duration
              </label>
              <div className="grid grid-cols-2 gap-3">
                {durations.map((duration) => (
                  <button
                    key={duration.value}
                    onClick={() => setSelectedDuration(duration.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      selectedDuration === duration.value
                        ? "border-neon-lime bg-neon-lime/10"
                        : "border-border bg-surface-elevated hover:border-border/80",
                    )}
                  >
                    <div className="font-bold text-foreground">{duration.label}</div>
                    <div className="text-sm text-muted-foreground">{duration.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated border border-border">
              <div className="text-sm text-muted-foreground">Starting Credits</div>
              <div className="text-2xl font-bold text-foreground">1,000</div>
              <div className="text-xs text-muted">Same for all players</div>
            </div>

            <Button
              onClick={() => setStep("dares")}
              className="w-full bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold"
            >
              Next: Choose Dares
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <p className="text-sm text-muted-foreground">Select 1-3 dares. The loser will have to do one of these!</p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {dares.map((dare) => (
                <button
                  key={dare.id}
                  onClick={() => toggleDare(dare.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    selectedDares.includes(dare.id)
                      ? "border-magenta bg-magenta/10"
                      : "border-border bg-surface-elevated hover:border-border/80",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Flame className="w-4 h-4 text-magenta" />
                        {dare.title}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{dare.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            dare.intensity === "mild" && "bg-neon-lime/20 text-neon-lime",
                            dare.intensity === "medium" && "bg-yellow/20 text-yellow",
                            dare.intensity === "spicy" && "bg-magenta/20 text-magenta",
                            dare.intensity === "nuclear" && "bg-purple/20 text-purple",
                          )}
                        >
                          {dare.intensity}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-surface text-muted-foreground">
                          {dare.category}
                        </span>
                      </div>
                    </div>
                    {selectedDares.includes(dare.id) && <Check className="w-5 h-5 text-magenta shrink-0" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("duration")}
                className="flex-1 border-border text-foreground"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={selectedDares.length === 0}
                className="flex-1 bg-neon-lime text-background hover:bg-neon-lime-glow font-semibold disabled:opacity-50"
              >
                Start Season ({selectedDares.length}/3 dares)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
