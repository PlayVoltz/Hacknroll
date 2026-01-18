"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { User, Group, Season, Transaction, Dare } from "./types"
import { mockUsers, mockGroups, mockSeasons, mockTransactions, mockDares } from "./mock-data"

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  groups: Group[]
  activeGroup: Group | null
  setActiveGroup: (group: Group) => void
  seasons: Season[]
  activeSeason: Season | null
  transactions: Transaction[]
  dares: Dare[]
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<boolean>
  logout: () => void
  createGroup: (name: string) => void
  joinGroup: (code: string) => boolean
  createSeason: (groupId: string, duration: string, dares: string[]) => void
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>(mockGroups)
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [seasons, setSeasons] = useState<Season[]>(mockSeasons)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [dares] = useState<Dare[]>(mockDares)

  const login = async (username: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const foundUser = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (foundUser) {
      setUser(foundUser)
      const userGroups = groups.filter((g) => g.members.includes(foundUser.id))
      if (userGroups.length > 0) {
        setActiveGroup(userGroups[0])
      }
      return true
    }
    return false
  }

  const register = async (username: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const exists = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (exists) return false

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    setUser(newUser)
    return true
  }

  const logout = () => {
    setUser(null)
    setActiveGroup(null)
  }

  const createGroup = (name: string) => {
    if (!user) return
    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name,
      members: [user.id],
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    }
    setGroups((prev) => [...prev, newGroup])
    setActiveGroup(newGroup)
  }

  const joinGroup = (code: string): boolean => {
    if (!user) return false
    const group = groups.find((g) => g.inviteCode.toUpperCase() === code.toUpperCase())
    if (group && !group.members.includes(user.id)) {
      const updatedGroup = { ...group, members: [...group.members, user.id] }
      setGroups((prev) => prev.map((g) => (g.id === group.id ? updatedGroup : g)))
      setActiveGroup(updatedGroup)
      return true
    }
    return false
  }

  const createSeason = (groupId: string, duration: string, selectedDares: string[]) => {
    const endDate = new Date()
    switch (duration) {
      case "1h":
        endDate.setHours(endDate.getHours() + 1)
        break
      case "1d":
        endDate.setDate(endDate.getDate() + 1)
        break
      case "3d":
        endDate.setDate(endDate.getDate() + 3)
        break
      case "1w":
        endDate.setDate(endDate.getDate() + 7)
        break
    }

    const newSeason: Season = {
      id: `season_${Date.now()}`,
      groupId,
      name: `Season ${seasons.filter((s) => s.groupId === groupId).length + 1}`,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      startingCredits: 1000,
      dares: selectedDares,
      status: "active",
      balances: {},
    }

    const group = groups.find((g) => g.id === groupId)
    if (group) {
      group.members.forEach((memberId) => {
        newSeason.balances[memberId] = 1000
      })
    }

    setSeasons((prev) => [...prev, newSeason])
  }

  const addTransaction = (transaction: Omit<Transaction, "id" | "timestamp">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
  }

  const activeSeason = activeGroup
    ? seasons.find((s) => s.groupId === activeGroup.id && s.status === "active") || null
    : null

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        groups,
        activeGroup,
        setActiveGroup,
        seasons,
        activeSeason,
        transactions,
        dares,
        login,
        register,
        logout,
        createGroup,
        joinGroup,
        createSeason,
        addTransaction,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
