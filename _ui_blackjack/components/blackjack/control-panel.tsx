"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ManualTab } from "./manual-tab"
import { AutoTab } from "./auto-tab"
import type { GameState } from "@/lib/blackjack-types"

interface ControlPanelProps {
  state: GameState
  isAnimating: boolean
  onBetChange: (bet: number) => void
  onDeal: () => void
  onHit: () => void
  onStand: () => void
  onDouble: () => void
  onSplit: () => void
  onPlayAgain: () => void
  onRebet: () => void
}

export function ControlPanel({
  state,
  isAnimating,
  onBetChange,
  onDeal,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onPlayAgain,
  onRebet,
}: ControlPanelProps) {
  return (
    <Card className="bg-elevated border-border p-0 gap-0">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="w-full bg-deep-surface rounded-none rounded-t-xl border-b border-border h-12">
          <TabsTrigger value="manual" className="flex-1 data-[state=active]:bg-elevated">
            Manual
          </TabsTrigger>
          <TabsTrigger value="auto" className="flex-1 data-[state=active]:bg-elevated">
            Auto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="p-4 mt-0">
          <ManualTab
            state={state}
            isAnimating={isAnimating}
            onBetChange={onBetChange}
            onDeal={onDeal}
            onHit={onHit}
            onStand={onStand}
            onDouble={onDouble}
            onSplit={onSplit}
            onPlayAgain={onPlayAgain}
            onRebet={onRebet}
          />
        </TabsContent>

        <TabsContent value="auto" className="p-4 mt-0">
          <AutoTab />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
