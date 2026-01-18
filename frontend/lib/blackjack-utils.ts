import type { PlayingCard, Suit, Rank, Hand, GameResult } from "./blackjack-types";

const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        faceUp: true,
        id: `${suit}-${rank}-${Math.random().toString(36).slice(2, 11)}`,
      });
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: PlayingCard[]): PlayingCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardValue(card: PlayingCard): number {
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 11;
  return Number.parseInt(card.rank, 10);
}

export function calculateHandValue(cards: PlayingCard[]): number {
  const visibleCards = cards.filter((c) => c.faceUp);
  let value = 0;
  let aces = 0;

  for (const card of visibleCards) {
    if (card.rank === "A") {
      aces++;
      value += 11;
    } else {
      value += getCardValue(card);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

export function calculateFullHandValue(cards: PlayingCard[]): number {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === "A") {
      aces++;
      value += 11;
    } else {
      value += getCardValue(card);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

export function isBlackjack(cards: PlayingCard[]): boolean {
  return cards.length === 2 && calculateFullHandValue(cards) === 21;
}

export function isBusted(cards: PlayingCard[]): boolean {
  return calculateFullHandValue(cards) > 21;
}

export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  if (hand.isSplit) return false;
  const [card1, card2] = hand.cards;
  return getCardValue(card1) === getCardValue(card2);
}

export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.isDoubled;
}

export function determineResult(playerHand: Hand, dealerCards: PlayingCard[]): GameResult {
  const playerValue = calculateFullHandValue(playerHand.cards);
  const dealerValue = calculateFullHandValue(dealerCards);

  if (playerValue > 21) return "bust";
  if (isBlackjack(playerHand.cards) && !isBlackjack(dealerCards)) return "blackjack";
  if (dealerValue > 21) return "win";
  if (playerValue > dealerValue) return "win";
  if (playerValue < dealerValue) return "lose";
  return "push";
}

export function calculatePayout(hand: Hand, result: GameResult): number {
  const bet = hand.isDoubled ? hand.bet * 2 : hand.bet;
  switch (result) {
    case "blackjack":
      return bet * 2.5;
    case "win":
      return bet * 2;
    case "push":
      return bet;
    case "lose":
    case "bust":
    default:
      return 0;
  }
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
    case "spades":
      return "♠";
  }
}

export function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

