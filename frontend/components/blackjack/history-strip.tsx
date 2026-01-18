"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { PlayingCardComponent } from "./playing-card";
import type { HistoryEntry } from "../../lib/blackjack-types";

export function HistoryStrip({ history }: { history: HistoryEntry[] }) {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const last20 = history.slice(-20).reverse();

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
                "w-8 h-8 rounded-lg font-bold text-xs transition-all border-2 hover:scale-110",
                (entry.result === "win" || entry.result === "blackjack") && "border-primary text-primary bg-primary/10",
                (entry.result === "lose" || entry.result === "bust") && "border-destructive text-destructive bg-destructive/10",
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

      {selectedEntry ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedEntry(null)}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Hand Summary</h2>
                <p className="text-sm text-muted-foreground">{new Date(selectedEntry.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

