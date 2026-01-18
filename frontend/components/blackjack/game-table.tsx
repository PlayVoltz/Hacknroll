"use client";

import { cn } from "../../lib/utils";
import { PlayingCardComponent } from "./playing-card";
import { calculateHandValue, calculateFullHandValue } from "../../lib/blackjack-utils";
import type { GameState } from "../../lib/blackjack-types";

export function GameTable({
  state,
  isAnimating,
  animatingCardId,
}: {
  state: GameState;
  isAnimating: boolean;
  animatingCardId: string | null;
}) {
  const dealerValue =
    state.phase === "result" || state.phase === "dealer-turn"
      ? calculateFullHandValue(state.dealerHand)
      : calculateHandValue(state.dealerHand);

  return (
    <div className="bg-gradient-to-b from-elevated to-accent rounded-3xl border border-border p-6 min-h-[400px] lg:min-h-[500px]">
      <div className="relative h-full table-felt rounded-2xl p-4 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-start pt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Dealer</div>

          <div className="flex items-center justify-center gap-2 min-h-[100px]">
            {state.dealerHand.length === 0 ? (
              <div className="w-16 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30" />
            ) : (
              state.dealerHand.map((card, index) => (
                <PlayingCardComponent
                  key={card.id}
                  card={card}
                  isAnimating={animatingCardId === card.id}
                  delay={index * 150}
                />
              ))
            )}
          </div>

          {state.dealerHand.length > 0 && (
            <div
              className={cn(
                "mt-2 px-3 py-1 rounded-full text-sm font-mono font-bold",
                dealerValue > 21 ? "bg-destructive/20 text-destructive" : "bg-muted text-foreground",
              )}
            >
              {state.dealerHand.some((c) => !c.faceUp) ? `${dealerValue}+?` : dealerValue}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center py-6">
          {state.currentBet > 0 && (
            <div
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30",
                isAnimating && "animate-chip-grow",
              )}
            >
              <span className="text-xs text-muted-foreground">Pot</span>
              <span className="font-mono font-bold text-primary">
                {(state.playerHands[0]?.isDoubled ? state.currentBet * 2 : state.currentBet).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-end pb-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {state.playerHands.map((hand, handIndex) => {
              const handValue = calculateFullHandValue(hand.cards);
              const isActive = handIndex === state.activeHandIndex && state.phase === "player-turn";
              return (
                <div key={handIndex} className="flex flex-col items-center">
                  {state.playerHands.length > 1 && (
                    <div className="text-xs text-muted-foreground mb-1">Hand {String.fromCharCode(65 + handIndex)}</div>
                  )}
                  <div className={cn("flex items-center justify-center gap-2 p-2 rounded-xl transition-all", isActive && "ring-2 ring-primary animate-pulse-glow")}>
                    {hand.cards.length === 0 ? (
                      <div className="w-16 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30" />
                    ) : (
                      hand.cards.map((card, cardIndex) => (
                        <PlayingCardComponent
                          key={card.id}
                          card={card}
                          isAnimating={animatingCardId === card.id}
                          delay={cardIndex * 150}
                        />
                      ))
                    )}
                  </div>

                  {hand.cards.length > 0 && (
                    <div
                      className={cn(
                        "mt-2 px-3 py-1 rounded-full text-sm font-mono font-bold animate-count-up",
                        handValue > 21
                          ? "bg-destructive/20 text-destructive"
                          : handValue === 21
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-foreground",
                      )}
                    >
                      {handValue}
                      {hand.isDoubled && <span className="ml-1 text-xs">(2x)</span>}
                    </div>
                  )}

                  {hand.result && (
                    <div
                      className={cn(
                        "mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase",
                        hand.result === "win" && "bg-primary/20 text-primary",
                        hand.result === "blackjack" && "bg-primary/30 text-primary",
                        hand.result === "lose" && "bg-destructive/20 text-destructive",
                        hand.result === "bust" && "bg-destructive/20 text-destructive",
                        hand.result === "push" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {hand.result}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-4">You</div>
        </div>
      </div>
    </div>
  );
}

