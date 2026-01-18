"use client";

import { cn } from "../../lib/utils";
import { getSuitSymbol, isRedSuit } from "../../lib/blackjack-utils";
import type { PlayingCard } from "../../lib/blackjack-types";

export function PlayingCardComponent({
  card,
  isAnimating,
  delay = 0,
}: {
  card: PlayingCard;
  isAnimating?: boolean;
  delay?: number;
}) {
  const suitSymbol = getSuitSymbol(card.suit);
  const isRed = isRedSuit(card.suit);

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "w-16 h-24 rounded-lg shadow-lg overflow-hidden",
          "bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-700",
          isAnimating && "animate-deal",
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-14 rounded border border-blue-600 bg-blue-800/50 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-400">?</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-16 h-24 rounded-lg shadow-lg overflow-hidden",
        "bg-white border border-gray-200",
        isAnimating && "animate-deal",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-full h-full p-1.5 flex flex-col justify-between">
        <div className={cn("flex flex-col items-start leading-none", isRed ? "text-red-600" : "text-gray-900")}>
          <span className="text-sm font-bold">{card.rank}</span>
          <span className="text-xs">{suitSymbol}</span>
        </div>

        <div className={cn("text-2xl text-center", isRed ? "text-red-600" : "text-gray-900")}>{suitSymbol}</div>

        <div className={cn("flex flex-col items-end leading-none rotate-180", isRed ? "text-red-600" : "text-gray-900")}>
          <span className="text-sm font-bold">{card.rank}</span>
          <span className="text-xs">{suitSymbol}</span>
        </div>
      </div>
    </div>
  );
}

