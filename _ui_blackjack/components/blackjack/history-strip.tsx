"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { PlayingCardComponent } from "./playing-card"
import type { HistoryEntry } from "@/lib/blackjack-types"

interface HistoryStripProps {
  history: HistoryEntry[]
}

export function HistoryStrip({ history }: HistoryStripProps) {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const last20 = history.slice(-20).reverse()

  return (
    <div className="bg-elevated rounded-2xl border border-border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Last 20 hands</h3>

      <div className="flex flex-wrap gap-2">
        {last20.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hands played yet</p>
        ) : (
          last20.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={cn(
                "w-8 h-8 rounded-lg font-bold text-xs transition-all border-2",
                "hover:scale-110",
                (entry.result === "win" || entry.result === "blackjack") && "border-primary text-primary bg-primary/10",
                (entry.result === "lose" || entry.result === "bust") &&
                  "border-destructive text-destructive bg-destructive/10",
                entry.result === "push" && "border-muted-foreground text-muted-foreground bg-muted",
              )}
            >
              {entry.result === "win" || entry.result === "blackjack"
                ? "W"
                : entry.result === "lose" || entry.result === "bust"
                  ? "L"
                  : "P"}
            </button>
          ))
        )}
      </div>

      {/* Hand Summary Drawer */}
      <Drawer open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader>
            <DrawerTitle className="text-foreground">Hand Summary</DrawerTitle>
            <DrawerDescription>{selectedEntry && new Date(selectedEntry.timestamp).toLocaleString()}</DrawerDescription>
          </DrawerHeader>

          {selectedEntry && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Your Hand</p>
                  <div className="flex gap-1">
                    {selectedEntry.playerCards.map((card) => (
                      <PlayingCardComponent key={card.id} card={{ ...card, faceUp: true }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Dealer Hand</p>
                  <div className="flex gap-1">
                    {selectedEntry.dealerCards.map((card) => (
                      <PlayingCardComponent key={card.id} card={{ ...card, faceUp: true }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div>
                  <p className="text-xs text-muted-foreground">Result</p>
                  <p
                    className={cn(
                      "font-bold uppercase",
                      (selectedEntry.result === "win" || selectedEntry.result === "blackjack") && "text-primary",
                      (selectedEntry.result === "lose" || selectedEntry.result === "bust") && "text-destructive",
                      selectedEntry.result === "push" && "text-muted-foreground",
                    )}
                  >
                    {selectedEntry.result}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Net</p>
                  <p
                    className={cn(
                      "font-mono font-bold",
                      selectedEntry.net > 0 && "text-primary",
                      selectedEntry.net < 0 && "text-destructive",
                      selectedEntry.net === 0 && "text-muted-foreground",
                    )}
                  >
                    {selectedEntry.net >= 0 ? "+" : ""}
                    {selectedEntry.net}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
