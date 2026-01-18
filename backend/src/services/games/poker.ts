import crypto from "crypto";

const suits = ["♠", "♥", "♦", "♣"] as const;
const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

export type PokerCard = {
  suit: (typeof suits)[number];
  rank: (typeof ranks)[number];
};

export type PokerPlayer = {
  userId: string;
  buyInMinor: number;
  hand: PokerCard[];
};

export type PokerRoundState = {
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  potMinor: number;
  players: PokerPlayer[];
  winnerId?: string;
  startedAt?: string;
  finishedAt?: string;
};

export function buildDeck(): PokerCard[] {
  const deck: PokerCard[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function draw(deck: PokerCard[]) {
  const idx = crypto.randomInt(0, deck.length);
  return deck.splice(idx, 1)[0];
}

export function dealHands(players: PokerPlayer[]) {
  const deck = buildDeck();
  return players.map((player) => ({
    ...player,
    hand: [draw(deck), draw(deck)],
  }));
}

export function pickWinner(players: PokerPlayer[]) {
  const idx = crypto.randomInt(0, players.length);
  return players[idx].userId;
}
