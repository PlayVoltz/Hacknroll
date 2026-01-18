export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

export interface PlayingCard {
  suit: Suit
  rank: Rank
  faceUp: boolean
  id: string
}

export type GamePhase = "betting" | "dealing" | "player-turn" | "dealer-turn" | "result"
export type GameResult = "win" | "lose" | "push" | "blackjack" | "bust" | null

export interface Hand {
  cards: PlayingCard[]
  bet: number
  insuranceBet: number
  isDoubled: boolean
  isSplit: boolean
  isStanding: boolean
  result: GameResult
}

export interface GameState {
  phase: GamePhase
  playerHands: Hand[]
  activeHandIndex: number
  dealerHand: PlayingCard[]
  deck: PlayingCard[]
  balance: number
  currentBet: number
  insuranceBet: number
  showInsurance: boolean
}

export interface HistoryEntry {
  id: string
  result: GameResult
  bet: number
  payout: number
  net: number
  playerCards: PlayingCard[]
  dealerCards: PlayingCard[]
  timestamp: Date
}

export interface LedgerTransaction {
  id: string
  game: "Blackjack"
  bet: number
  insuranceBet: number
  payout: number
  net: number
  timestamp: Date
  meta: {
    result: GameResult
    playerCards: PlayingCard[]
    dealerCards: PlayingCard[]
  }
}
