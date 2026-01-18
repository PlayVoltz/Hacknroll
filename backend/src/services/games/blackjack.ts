import crypto from "crypto";

const suits = ["♠", "♥", "♦", "♣"] as const;
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

export type Card = {
  suit: (typeof suits)[number];
  rank: (typeof ranks)[number];
};

export type BlackjackResult = {
  playerHand: Card[];
  dealerHand: Card[];
  playerTotal: number;
  dealerTotal: number;
  outcome: "WIN" | "LOSE" | "PUSH";
  payoutMinor: number;
};

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function draw(deck: Card[]) {
  const idx = crypto.randomInt(0, deck.length);
  return deck.splice(idx, 1)[0];
}

function handValue(hand: Card[]) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (["K", "Q", "J"].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function playBlackjack(betMinor: number): BlackjackResult {
  const deck = buildDeck();
  const playerHand = [draw(deck), draw(deck)];
  const dealerHand = [draw(deck), draw(deck)];

  let playerTotal = handValue(playerHand);
  while (playerTotal < 17) {
    playerHand.push(draw(deck));
    playerTotal = handValue(playerHand);
  }

  let dealerTotal = handValue(dealerHand);
  while (dealerTotal < 17) {
    dealerHand.push(draw(deck));
    dealerTotal = handValue(dealerHand);
  }

  let outcome: BlackjackResult["outcome"] = "PUSH";
  if (playerTotal > 21) {
    outcome = "LOSE";
  } else if (dealerTotal > 21) {
    outcome = "WIN";
  } else if (playerTotal > dealerTotal) {
    outcome = "WIN";
  } else if (playerTotal < dealerTotal) {
    outcome = "LOSE";
  }

  const payoutMinor =
    outcome === "WIN" ? betMinor * 2 : outcome === "PUSH" ? betMinor : 0;

  return {
    playerHand,
    dealerHand,
    playerTotal,
    dealerTotal,
    outcome,
    payoutMinor,
  };
}
