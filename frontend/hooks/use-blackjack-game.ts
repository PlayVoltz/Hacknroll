"use client";

import { useCallback, useEffect, useState } from "react";
import type { GamePhase, GameState, HistoryEntry, PlayingCard } from "../lib/blackjack-types";
import {
  createDeck,
  calculateFullHandValue,
  isBlackjack,
  isBusted,
  determineResult,
  calculatePayout,
} from "../lib/blackjack-utils";

function createInitialState(balance: number): GameState {
  return {
    phase: "betting",
    playerHands: [
      {
        cards: [],
        bet: 0,
        insuranceBet: 0,
        isDoubled: false,
        isSplit: false,
        isStanding: false,
        result: null,
      },
    ],
    activeHandIndex: 0,
    dealerHand: [],
    deck: createDeck(),
    balance,
    currentBet: 10,
    insuranceBet: 0,
    showInsurance: false,
    roundKey: null,
  };
}

export function useBlackjackGame(params: {
  initialBalance: number;
  onDebit?: (amount: number, roundKey: string) => Promise<void>;
}) {
  const [state, setState] = useState<GameState>(() => createInitialState(params.initialBalance));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
  const [lastBet, setLastBet] = useState(10);
  const dealerPlayTriggeredRoundRef = useState<{ roundKey: string | null }>({ roundKey: null })[0];

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const setExternalBalance = useCallback((balance: number) => {
    setState((prev) => ({ ...prev, balance, currentBet: Math.min(prev.currentBet, balance) }));
  }, []);

  const dealCard = useCallback(async (faceUp = true): Promise<PlayingCard> => {
    return new Promise((resolve) => {
      setState((prev) => {
        const [card, ...remainingDeck] = prev.deck;
        const newCard = { ...card, faceUp };
        setAnimatingCardId(newCard.id);
        setTimeout(() => setAnimatingCardId(null), 300);
        setTimeout(() => resolve(newCard), 50);
        return { ...prev, deck: remainingDeck };
      });
    });
  }, []);

  const setBet = useCallback((bet: number) => {
    setState((prev) => ({
      ...prev,
      currentBet: Math.min(bet, prev.balance),
    }));
  }, []);

  const deal = useCallback(async () => {
    if (state.currentBet <= 0 || state.currentBet > state.balance) return;
    if (isAnimating) return;

    const roundKey = crypto.randomUUID();

    // debit wallet first (server authoritative)
    if (params.onDebit) {
      try {
        await params.onDebit(state.currentBet, roundKey);
      } catch {
        return;
      }
    }

    setIsAnimating(true);
    setLastBet(state.currentBet);

    setState((prev) => ({
      ...prev,
      roundKey,
      phase: "dealing" as GamePhase,
      balance: prev.balance - prev.currentBet,
      playerHands: [
        {
          cards: [],
          bet: prev.currentBet,
          insuranceBet: 0,
          isDoubled: false,
          isSplit: false,
          isStanding: false,
          result: null,
        },
      ],
      activeHandIndex: 0,
      dealerHand: [],
    }));

    await sleep(200);

    const dealerCard1 = await dealCard(true);
    setState((prev) => ({ ...prev, dealerHand: [dealerCard1] }));
    await sleep(200);

    const playerCard1 = await dealCard(true);
    setState((prev) => ({
      ...prev,
      playerHands: [{ ...prev.playerHands[0], cards: [playerCard1] }],
    }));
    await sleep(200);

    const dealerCard2 = await dealCard(false);
    setState((prev) => ({ ...prev, dealerHand: [...prev.dealerHand, dealerCard2] }));
    await sleep(200);

    const playerCard2 = await dealCard(true);
    setState((prev) => ({
      ...prev,
      playerHands: [{ ...prev.playerHands[0], cards: [...prev.playerHands[0].cards, playerCard2] }],
    }));
    await sleep(200);

    setState((prev) => {
      const playerCards = prev.playerHands[0].cards;
      const dealerCards = prev.dealerHand;
      const showInsurance = dealerCards[0]?.rank === "A";

      if (isBlackjack(playerCards)) {
        const revealedDealerHand = dealerCards.map((c) => ({ ...c, faceUp: true }));
        const result = isBlackjack(revealedDealerHand) ? "push" : "blackjack";
        const payout = calculatePayout({ ...prev.playerHands[0], cards: playerCards }, result);

        return {
          ...prev,
          phase: "result" as GamePhase,
          dealerHand: revealedDealerHand,
          balance: prev.balance + payout,
          playerHands: [{ ...prev.playerHands[0], cards: playerCards, result }],
          showInsurance: false,
        };
      }

      return {
        ...prev,
        phase: "player-turn" as GamePhase,
        showInsurance,
      };
    });

    setIsAnimating(false);
  }, [state.currentBet, state.balance, isAnimating, dealCard, params]);

  const hit = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return;
    setIsAnimating(true);

    const newCard = await dealCard(true);

    setState((prev) => {
      const currentHand = prev.playerHands[prev.activeHandIndex];
      const newCards = [...currentHand.cards, newCard];
      const newHands = [...prev.playerHands];
      newHands[prev.activeHandIndex] = { ...currentHand, cards: newCards };

      if (isBusted(newCards)) {
        newHands[prev.activeHandIndex].result = "bust";
        if (prev.activeHandIndex < prev.playerHands.length - 1) {
          return { ...prev, playerHands: newHands, activeHandIndex: prev.activeHandIndex + 1 };
        }
        return { ...prev, playerHands: newHands, phase: "dealer-turn" as GamePhase };
      }

      return { ...prev, playerHands: newHands };
    });

    setIsAnimating(false);
  }, [state.phase, isAnimating, dealCard]);

  const dealerPlay = useCallback(async () => {
    setIsAnimating(true);

    setState((prev) => ({
      ...prev,
      dealerHand: prev.dealerHand.map((c) => ({ ...c, faceUp: true })),
    }));
    await sleep(500);

    let keepDrawing = true;
    while (keepDrawing) {
      const currentState = await new Promise<GameState>((resolve) => {
        setState((prev) => {
          resolve(prev);
          return prev;
        });
      });
      const dealerValue = calculateFullHandValue(currentState.dealerHand);
      if (dealerValue < 17) {
        const newCard = await dealCard(true);
        setState((prev) => ({ ...prev, dealerHand: [...prev.dealerHand, newCard] }));
        await sleep(300);
      } else {
        keepDrawing = false;
      }
    }

    setState((prev) => {
      const dealerCards = prev.dealerHand.map((c) => ({ ...c, faceUp: true }));
      let totalPayout = 0;

      const resolvedHands = prev.playerHands.map((hand) => {
        if (hand.result === "bust") return hand;
        const result = determineResult(hand, dealerCards);
        const payout = calculatePayout(hand, result);
        totalPayout += payout;
        return { ...hand, result };
      });

      const totalBet = resolvedHands.reduce((sum, h) => sum + (h.isDoubled ? h.bet * 2 : h.bet), 0);
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        result: resolvedHands[0].result,
        bet: resolvedHands[0].bet,
        payout: totalPayout,
        net: totalPayout - totalBet,
        playerCards: resolvedHands[0].cards,
        dealerCards,
        timestamp: new Date(),
      };
      setHistory((h) => [...h, historyEntry]);

      return {
        ...prev,
        phase: "result" as GamePhase,
        balance: prev.balance + totalPayout,
        playerHands: resolvedHands,
        dealerHand: dealerCards,
      };
    });

    setIsAnimating(false);
  }, [dealCard]);

  const triggerDealerPlay = useCallback(() => {
    if (!state.roundKey) return;
    if (dealerPlayTriggeredRoundRef.roundKey === state.roundKey) return;
    dealerPlayTriggeredRoundRef.roundKey = state.roundKey;
    dealerPlay();
  }, [dealerPlay, dealerPlayTriggeredRoundRef, state.roundKey]);

  const stand = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return;

    setState((prev) => {
      const newHands = [...prev.playerHands];
      newHands[prev.activeHandIndex].isStanding = true;

      if (prev.activeHandIndex < prev.playerHands.length - 1) {
        return { ...prev, playerHands: newHands, activeHandIndex: prev.activeHandIndex + 1 };
      }

      return { ...prev, playerHands: newHands, phase: "dealer-turn" as GamePhase };
    });

    setTimeout(() => {
      triggerDealerPlay();
    }, 100);
  }, [state.phase, isAnimating, triggerDealerPlay]);

  // If we ever enter dealer-turn (e.g. bust on last hand), auto-run dealer logic once.
  // This fixes the UI getting stuck on "Waiting for dealer".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.phase === "dealer-turn" && !isAnimating) {
      triggerDealerPlay();
    }
  }, [state.phase, isAnimating, triggerDealerPlay]);

  const double = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return;

    const currentHand = state.playerHands[state.activeHandIndex];
    if (currentHand.cards.length !== 2 || state.balance < currentHand.bet) return;

    if (params.onDebit && state.roundKey) {
      try {
        await params.onDebit(currentHand.bet, state.roundKey);
      } catch {
        return;
      }
    }

    setIsAnimating(true);

    setState((prev) => ({ ...prev, balance: prev.balance - currentHand.bet }));
    const newCard = await dealCard(true);

    setState((prev) => {
      const hand = prev.playerHands[prev.activeHandIndex];
      const newCards = [...hand.cards, newCard];
      const newHands = [...prev.playerHands];
      newHands[prev.activeHandIndex] = { ...hand, cards: newCards, isDoubled: true, isStanding: true };
      if (isBusted(newCards)) newHands[prev.activeHandIndex].result = "bust";

      if (prev.activeHandIndex < prev.playerHands.length - 1) {
        return { ...prev, playerHands: newHands, activeHandIndex: prev.activeHandIndex + 1 };
      }
      return { ...prev, playerHands: newHands, phase: "dealer-turn" as GamePhase };
    });

    setIsAnimating(false);
    setTimeout(() => triggerDealerPlay(), 100);
  }, [state.phase, state.playerHands, state.activeHandIndex, state.balance, state.roundKey, isAnimating, dealCard, triggerDealerPlay, params]);

  const split = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return;

    const currentHand = state.playerHands[state.activeHandIndex];
    if (currentHand.cards.length !== 2 || state.balance < currentHand.bet) return;

    const [card1, card2] = currentHand.cards;
    if (card1.rank !== card2.rank) return;

    if (params.onDebit && state.roundKey) {
      try {
        await params.onDebit(currentHand.bet, state.roundKey);
      } catch {
        return;
      }
    }

    setIsAnimating(true);

    setState((prev) => ({ ...prev, balance: prev.balance - currentHand.bet }));
    await sleep(200);

    const newCard1 = await dealCard(true);
    await sleep(200);
    const newCard2 = await dealCard(true);

    setState((prev) => {
      const newHands = [
        { ...currentHand, cards: [card1, newCard1], isSplit: true },
        {
          cards: [card2, newCard2],
          bet: currentHand.bet,
          insuranceBet: 0,
          isDoubled: false,
          isSplit: true,
          isStanding: false,
          result: null,
        },
      ];
      return { ...prev, playerHands: newHands, activeHandIndex: 0 };
    });

    setIsAnimating(false);
  }, [state.phase, state.playerHands, state.activeHandIndex, state.balance, state.roundKey, isAnimating, dealCard, params]);

  const resetGame = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(prev.balance),
      currentBet: 10,
      deck: prev.deck.length < 20 ? createDeck() : prev.deck,
    }));
  }, []);

  const rebet = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(prev.balance),
      currentBet: lastBet,
      deck: prev.deck.length < 20 ? createDeck() : prev.deck,
    }));
  }, [lastBet]);

  return {
    state,
    history,
    isAnimating,
    animatingCardId,
    setBet,
    setExternalBalance,
    deal,
    hit,
    stand,
    double,
    split,
    resetGame,
    rebet,
  };
}

