export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export type GamePhase = "betting" | "dealing" | "player-turn" | "dealer-turn" | "result";

export type GameResult = "win" | "lose" | "push" | "blackjack" | "bust";

export type PlayingCard = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

export type Hand = {
  cards: PlayingCard[];
  bet: number;
  insuranceBet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isStanding: boolean;
  result: GameResult | null;
};

export type GameState = {
  phase: GamePhase;
  playerHands: Hand[];
  activeHandIndex: number;
  dealerHand: PlayingCard[];
  deck: PlayingCard[];
  balance: number;
  currentBet: number;
  insuranceBet: number;
  showInsurance: boolean;
  roundKey: string | null;
};

export type HistoryEntry = {
  id: string;
  result: GameResult | null;
  bet: number;
  payout: number;
  net: number;
  playerCards: PlayingCard[];
  dealerCards: PlayingCard[];
  timestamp: Date;
};

