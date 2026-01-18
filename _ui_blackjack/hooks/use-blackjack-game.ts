"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { GameState, GamePhase, HistoryEntry, PlayingCard } from "@/lib/blackjack-types"
import {
  createDeck,
  calculateFullHandValue,
  isBlackjack,
  isBusted,
  determineResult,
  calculatePayout,
} from "@/lib/blackjack-utils"

const INITIAL_BALANCE = 10000

function createInitialState(): GameState {
  return {
    phase: "betting",
    playerHands: [
      { cards: [], bet: 0, insuranceBet: 0, isDoubled: false, isSplit: false, isStanding: false, result: null },
    ],
    activeHandIndex: 0,
    dealerHand: [],
    deck: createDeck(),
    balance: INITIAL_BALANCE,
    currentBet: 100,
    insuranceBet: 0,
    showInsurance: false,
  }
}

export function useBlackjackGame() {
  const [state, setState] = useState<GameState>(createInitialState())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null)
  const [lastBet, setLastBet] = useState(100)

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const dealCard = useCallback(async (faceUp = true): Promise<PlayingCard> => {
    return new Promise((resolve) => {
      setState((prev) => {
        const [card, ...remainingDeck] = prev.deck
        const newCard = { ...card, faceUp }
        setAnimatingCardId(newCard.id)
        setTimeout(() => setAnimatingCardId(null), 300)
        setTimeout(() => resolve(newCard), 50)
        return { ...prev, deck: remainingDeck }
      })
    })
  }, [])

  const setBet = useCallback((bet: number) => {
    setState((prev) => ({
      ...prev,
      currentBet: Math.min(bet, prev.balance),
    }))
  }, [])

  const deal = useCallback(async () => {
    if (state.currentBet <= 0 || state.currentBet > state.balance) return

    setIsAnimating(true)
    setLastBet(state.currentBet)

    // Deduct bet
    setState((prev) => ({
      ...prev,
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
      dealerHand: [],
    }))

    toast("Bet placed", { description: `${state.currentBet} credits` })

    await sleep(200)

    // Deal sequence: dealer 1 (up), player 1, dealer 2 (down), player 2
    const dealerCard1 = await dealCard(true)
    setState((prev) => ({ ...prev, dealerHand: [dealerCard1] }))
    await sleep(200)

    const playerCard1 = await dealCard(true)
    setState((prev) => ({
      ...prev,
      playerHands: [{ ...prev.playerHands[0], cards: [playerCard1] }],
    }))
    await sleep(200)

    const dealerCard2 = await dealCard(false) // hole card face down
    setState((prev) => ({ ...prev, dealerHand: [...prev.dealerHand, dealerCard2] }))
    await sleep(200)

    const playerCard2 = await dealCard(true)
    setState((prev) => ({
      ...prev,
      playerHands: [{ ...prev.playerHands[0], cards: [...prev.playerHands[0].cards, playerCard2] }],
    }))
    await sleep(200)

    // Check for blackjack
    setState((prev) => {
      const playerCards = prev.playerHands[0].cards
      const dealerCards = prev.dealerHand

      // Check if dealer shows Ace for insurance
      const showInsurance = dealerCards[0]?.rank === "A"

      if (isBlackjack(playerCards)) {
        toast("Blackjack!", { description: "🎰 Natural 21!" })
        // Reveal dealer and resolve
        const revealedDealerHand = dealerCards.map((c) => ({ ...c, faceUp: true }))
        const result = isBlackjack(revealedDealerHand) ? "push" : "blackjack"
        const payout = calculatePayout({ ...prev.playerHands[0], cards: playerCards }, result)

        return {
          ...prev,
          phase: "result" as GamePhase,
          dealerHand: revealedDealerHand,
          balance: prev.balance + payout,
          playerHands: [{ ...prev.playerHands[0], cards: playerCards, result }],
          showInsurance: false,
        }
      }

      return {
        ...prev,
        phase: "player-turn" as GamePhase,
        showInsurance,
      }
    })

    setIsAnimating(false)
  }, [state.currentBet, state.balance, dealCard])

  const hit = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return

    setIsAnimating(true)

    const newCard = await dealCard(true)

    setState((prev) => {
      const currentHand = prev.playerHands[prev.activeHandIndex]
      const newCards = [...currentHand.cards, newCard]
      const newHands = [...prev.playerHands]
      newHands[prev.activeHandIndex] = { ...currentHand, cards: newCards }

      if (isBusted(newCards)) {
        toast("Busted!", { description: "💥 Over 21" })
        newHands[prev.activeHandIndex].result = "bust"

        // Check if more hands to play
        if (prev.activeHandIndex < prev.playerHands.length - 1) {
          return { ...prev, playerHands: newHands, activeHandIndex: prev.activeHandIndex + 1 }
        }

        // All hands done, go to dealer turn or result
        return { ...prev, playerHands: newHands, phase: "dealer-turn" as GamePhase }
      }

      return { ...prev, playerHands: newHands }
    })

    setIsAnimating(false)
  }, [state.phase, isAnimating, dealCard])

  const stand = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return

    setState((prev) => {
      const newHands = [...prev.playerHands]
      newHands[prev.activeHandIndex].isStanding = true

      // Check if more hands to play
      if (prev.activeHandIndex < prev.playerHands.length - 1) {
        return { ...prev, playerHands: newHands, activeHandIndex: prev.activeHandIndex + 1 }
      }

      // All hands done, go to dealer turn
      return { ...prev, playerHands: newHands, phase: "dealer-turn" as GamePhase }
    })

    // Trigger dealer play
    setTimeout(() => dealerPlay(), 100)
  }, [state.phase, isAnimating])

  const dealerPlay = useCallback(async () => {
    setIsAnimating(true)

    // Reveal hole card
    setState((prev) => ({
      ...prev,
      dealerHand: prev.dealerHand.map((c) => ({ ...c, faceUp: true })),
    }))
    await sleep(500)

    // Dealer draws until 17
    let keepDrawing = true
    while (keepDrawing) {
      const currentState = await new Promise<GameState>((resolve) => {
        setState((prev) => {
          resolve(prev)
          return prev
        })
      })

      const dealerValue = calculateFullHandValue(currentState.dealerHand)

      if (dealerValue >= 17) {
        keepDrawing = false
      } else {
        const newCard = await dealCard(true)
        setState((prev) => ({
          ...prev,
          dealerHand: [...prev.dealerHand, newCard],
        }))
        await sleep(500)
      }
    }

    // Resolve all hands
    setState((prev) => {
      const dealerCards = prev.dealerHand
      let totalPayout = 0

      const resolvedHands = prev.playerHands.map((hand) => {
        if (hand.result === "bust") {
          return hand // Already resolved
        }

        const result = determineResult(hand, dealerCards)
        const payout = calculatePayout(hand, result)
        totalPayout += payout

        return { ...hand, result }
      })

      // Add to history
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        result: resolvedHands[0].result,
        bet: resolvedHands[0].bet,
        payout: totalPayout,
        net: totalPayout - resolvedHands.reduce((sum, h) => sum + (h.isDoubled ? h.bet * 2 : h.bet), 0),
        playerCards: resolvedHands[0].cards,
        dealerCards,
        timestamp: new Date(),
      }

      setHistory((h) => [...h, historyEntry])

      if (resolvedHands[0].result === "win") toast("You win!", { description: "🎉" })
      else if (resolvedHands[0].result === "lose") toast("Dealer wins", { description: "😔" })
      else if (resolvedHands[0].result === "push") toast("Push", { description: "🤝 Tie game" })

      return {
        ...prev,
        phase: "result" as GamePhase,
        balance: prev.balance + totalPayout,
        playerHands: resolvedHands,
      }
    })

    setIsAnimating(false)
  }, [dealCard])

  const double = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return

    const currentHand = state.playerHands[state.activeHandIndex]
    if (currentHand.cards.length !== 2 || state.balance < currentHand.bet) return

    setIsAnimating(true)

    // Deduct additional bet
    setState((prev) => ({
      ...prev,
      balance: prev.balance - currentHand.bet,
    }))

    const newCard = await dealCard(true)

    setState((prev) => {
      const hand = prev.playerHands[prev.activeHandIndex]
      const newCards = [...hand.cards, newCard]
      const newHands = [...prev.playerHands]
      newHands[prev.activeHandIndex] = { ...hand, cards: newCards, isDoubled: true, isStanding: true }

      if (isBusted(newCards)) {
        toast("Busted!", { description: "💥 Over 21" })
        newHands[prev.activeHandIndex].result = "bust"
      }

      // Check if more hands
      if (prev.activeHandIndex < prev.playerHands.length - 1) {
        return { ...prev, playerHands: newHands, activeHandIndex: prev.activeHandIndex + 1 }
      }

      return { ...prev, playerHands: newHands, phase: "dealer-turn" as GamePhase }
    })

    setIsAnimating(false)
    setTimeout(() => dealerPlay(), 100)
  }, [state.phase, state.playerHands, state.activeHandIndex, state.balance, isAnimating, dealCard, dealerPlay])

  const split = useCallback(async () => {
    if (state.phase !== "player-turn" || isAnimating) return

    const currentHand = state.playerHands[state.activeHandIndex]
    if (currentHand.cards.length !== 2 || state.balance < currentHand.bet) return

    const [card1, card2] = currentHand.cards
    if (card1.rank !== card2.rank) return

    setIsAnimating(true)

    // Deduct additional bet
    setState((prev) => ({
      ...prev,
      balance: prev.balance - currentHand.bet,
    }))

    await sleep(200)

    // Deal one card to each hand
    const newCard1 = await dealCard(true)
    await sleep(200)
    const newCard2 = await dealCard(true)

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
      ]

      return {
        ...prev,
        playerHands: newHands,
        activeHandIndex: 0,
      }
    })

    setIsAnimating(false)
  }, [state.phase, state.playerHands, state.activeHandIndex, state.balance, isAnimating, dealCard])

  const resetGame = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      balance: prev.balance,
      currentBet: 100,
      deck: prev.deck.length < 20 ? createDeck() : prev.deck,
    }))
  }, [])

  const rebet = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      balance: prev.balance,
      currentBet: lastBet,
      deck: prev.deck.length < 20 ? createDeck() : prev.deck,
    }))
  }, [lastBet])

  return {
    state,
    history,
    isAnimating,
    animatingCardId,
    setBet,
    deal,
    hit,
    stand,
    double,
    split,
    resetGame,
    rebet,
  }
}
