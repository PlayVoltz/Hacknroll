"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BlackjackHeader } from "./blackjack-header";
import { ControlPanel } from "./control-panel";
import { GameTable } from "./game-table";
import { HistoryStrip } from "./history-strip";
import { ResultOverlay } from "./result-overlay";
import { useBlackjackGame } from "../../hooks/use-blackjack-game";
import { apiFetch } from "../../lib/api";
import { creditsToMinor, formatCredits, minorToCredits } from "../../lib/credits";
import { calculatePayout } from "../../lib/blackjack-utils";

export function BlackjackPage({ groupId }: { groupId: string }) {
  const [showResult, setShowResult] = useState(false);
  const [serverBalanceMinor, setServerBalanceMinor] = useState(0);
  const settledRoundRef = useRef<string | null>(null);

  const game = useBlackjackGame({
    initialBalance: 0,
    onDebit: async (amountCredits, roundKey) => {
      await apiFetch(`/api/groups/${groupId}/blackjack/bet`, {
        method: "POST",
        body: JSON.stringify({ amountMinor: creditsToMinor(amountCredits), roundKey }),
      });
    },
  });

  async function refreshBalance() {
    const data = await apiFetch<{ userStats: { balanceMinor: number } }>(`/api/groups/${groupId}/activity`);
    setServerBalanceMinor(data.userStats.balanceMinor);
    game.setExternalBalance(minorToCredits(data.userStats.balanceMinor));
  }

  useEffect(() => {
    refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Settle when the round finishes (client-side game, server-side ledger)
  useEffect(() => {
    if (game.state.phase !== "result") return;
    if (!game.state.roundKey) return;
    if (settledRoundRef.current === game.state.roundKey) return;

    const roundKey = game.state.roundKey;
    settledRoundRef.current = roundKey;

    const totalPayoutCredits = game.state.playerHands.reduce(
      (sum, h) => sum + calculatePayout(h, h.result ?? "lose"),
      0,
    );
    const payoutMinor = creditsToMinor(totalPayoutCredits);
    const outcome = game.state.playerHands[0]?.result ?? "unknown";

    apiFetch(`/api/groups/${groupId}/blackjack/settle`, {
      method: "POST",
      body: JSON.stringify({
        payoutMinor,
        roundKey,
        outcome,
        meta: {
          dealer: game.state.dealerHand.map((c) => ({ suit: c.suit, rank: c.rank })),
          hands: game.state.playerHands.map((h) => ({
            bet: h.bet,
            isDoubled: h.isDoubled,
            isSplit: h.isSplit,
            result: h.result,
            cards: h.cards.map((c) => ({ suit: c.suit, rank: c.rank })),
          })),
        },
      }),
    })
      .then(() => refreshBalance())
      .catch(() => refreshBalance());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.state.phase, game.state.roundKey]);

  const balanceCredits = useMemo(() => minorToCredits(serverBalanceMinor), [serverBalanceMinor]);

  return (
    <div className="min-h-[80vh] bg-black text-white rounded-2xl border border-border overflow-hidden">
      {/* Top header area (zip style) */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xl font-bold">
          <span className="text-[#38F868]">Blackjack</span>
        </h2>
        <div className="text-[#38F868] font-bold">{formatCredits(serverBalanceMinor)} credits</div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <BlackjackHeader />

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            <div className="lg:hidden">
              <GameTable state={game.state} isAnimating={game.isAnimating} animatingCardId={game.animatingCardId} />
            </div>

            <ControlPanel
              state={game.state}
              isAnimating={game.isAnimating}
              onBetChange={game.setBet}
              onDeal={async () => {
                settledRoundRef.current = null;
                await game.deal();
              }}
              onHit={game.hit}
              onStand={game.stand}
              onDouble={game.double}
              onSplit={game.split}
              onPlayAgain={() => {
                game.resetGame();
                refreshBalance();
              }}
              onRebet={() => {
                game.rebet();
                refreshBalance();
              }}
            />

            <div className="hidden lg:flex flex-col gap-6">
              <div className="relative">
                <GameTable state={game.state} isAnimating={game.isAnimating} animatingCardId={game.animatingCardId} />
                {game.state.phase === "result" ? (
                  <ResultOverlay
                    hands={game.state.playerHands}
                    onPlayAgain={game.resetGame}
                    onRebet={game.rebet}
                    show={showResult}
                    setShow={setShowResult}
                  />
                ) : null}
              </div>
              <HistoryStrip history={game.history} />
            </div>
          </div>

          <div className="lg:hidden space-y-6">
            {game.state.phase === "result" ? (
              <ResultOverlay
                hands={game.state.playerHands}
                onPlayAgain={game.resetGame}
                onRebet={game.rebet}
                show={showResult}
                setShow={setShowResult}
              />
            ) : null}
            <HistoryStrip history={game.history} />
          </div>
        </div>
      </div>
    </div>
  );
}

