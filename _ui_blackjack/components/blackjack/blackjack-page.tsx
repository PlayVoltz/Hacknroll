"use client"

import { useState } from "react"
import { AppShell } from "./app-shell"
import { BlackjackHeader } from "./blackjack-header"
import { HighlightCard } from "./highlight-card"
import { ControlPanel } from "./control-panel"
import { GameTable } from "./game-table"
import { HistoryStrip } from "./history-strip"
import { FairnessAccordion } from "./fairness-accordion"
import { ResultOverlay } from "./result-overlay"
import { useBlackjackGame } from "@/hooks/use-blackjack-game"

export function BlackjackPage() {
  const game = useBlackjackGame()
  const [showResult, setShowResult] = useState(false)

  return (
    <AppShell balance={game.state.balance}>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <BlackjackHeader />
          <HighlightCard balance={game.state.balance} history={game.history} />

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            {/* Mobile: Table first */}
            <div className="lg:hidden">
              <GameTable state={game.state} isAnimating={game.isAnimating} animatingCardId={game.animatingCardId} />
            </div>

            <ControlPanel
              state={game.state}
              isAnimating={game.isAnimating}
              onBetChange={game.setBet}
              onDeal={async () => {
                await game.deal()
              }}
              onHit={game.hit}
              onStand={game.stand}
              onDouble={game.double}
              onSplit={game.split}
              onPlayAgain={game.resetGame}
              onRebet={game.rebet}
            />

            {/* Desktop: Table on right */}
            <div className="hidden lg:flex flex-col gap-6">
              <div className="relative">
                <GameTable state={game.state} isAnimating={game.isAnimating} animatingCardId={game.animatingCardId} />
                {game.state.phase === "result" && (
                  <ResultOverlay
                    hands={game.state.playerHands}
                    onPlayAgain={game.resetGame}
                    onRebet={game.rebet}
                    show={showResult}
                    setShow={setShowResult}
                  />
                )}
              </div>
              <HistoryStrip history={game.history} />
              <FairnessAccordion />
            </div>
          </div>

          {/* Mobile: Additional sections */}
          <div className="lg:hidden space-y-6">
            {game.state.phase === "result" && (
              <ResultOverlay
                hands={game.state.playerHands}
                onPlayAgain={game.resetGame}
                onRebet={game.rebet}
                show={showResult}
                setShow={setShowResult}
              />
            )}
            <HistoryStrip history={game.history} />
            <FairnessAccordion />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
