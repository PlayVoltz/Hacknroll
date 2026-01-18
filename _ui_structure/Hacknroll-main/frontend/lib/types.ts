export interface User {
  id: string
  username: string
  avatar: string
  createdAt: string
}

export interface Group {
  id: string
  name: string
  members: string[]
  inviteCode: string
  createdAt: string
}

export interface Season {
  id: string
  groupId: string
  name: string
  startDate: string
  endDate: string
  startingCredits: number
  dares: string[]
  status: "active" | "ended"
  balances: Record<string, number>
  loserId?: string
}

export interface Transaction {
  id: string
  userId: string
  groupId: string
  seasonId: string
  game: string
  bet: number
  payout: number
  net: number
  timestamp: string
}

export interface Dare {
  id: string
  title: string
  description: string
  category: "social" | "physical" | "creative" | "food" | "challenge"
  intensity: "mild" | "medium" | "spicy" | "nuclear"
  indoor: boolean
}

export interface Game {
  id: string
  name: string
  description: string
  image: string
  category: "originals" | "popular" | "new" | "party"
  isNew?: boolean
  comingSoon?: boolean
}
