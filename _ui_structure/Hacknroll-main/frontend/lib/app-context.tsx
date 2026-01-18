"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User, Group, Season, Transaction, Dare } from "./types"
import { supabaseBrowser } from "./supabase/client"

export type GroupMemberProfile = { userId: string; username: string; avatar: string | null }

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  groups: Group[]
  groupMembersByGroupId: Record<string, GroupMemberProfile[]>
  activeGroup: Group | null
  setActiveGroup: (group: Group) => void
  seasons: Season[]
  activeSeason: Season | null
  transactions: Transaction[]
  dares: Dare[]
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  register: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
  createGroup: (name: string) => Promise<{ ok: true; group: Group } | { ok: false; error: string }>
  joinGroup: (code: string) => boolean
  createSeason: (groupId: string, duration: string, dares: string[]) => void
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMembersByGroupId, setGroupMembersByGroupId] = useState<Record<string, GroupMemberProfile[]>>({})
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dares, setDares] = useState<Dare[]>([])
  const [loadingBoot, setLoadingBoot] = useState(true)

  const activeSeason = useMemo(() => {
    return activeGroup ? seasons.find((s) => s.groupId === activeGroup.id && s.status === "active") || null : null
  }, [activeGroup, seasons])

  const supabase = useMemo(() => supabaseBrowser(), [])

  function userFromAuth(authUser: any): User {
    const email: string | undefined = authUser?.email
    const meta = (authUser?.user_metadata || {}) as any
    const username = String(meta.username || (email ? email.split("@")[0] : "Player"))
    const avatar = String(meta.avatar || "/placeholder.svg")
    const createdAt = String(authUser?.created_at || new Date().toISOString())
    return { id: String(authUser.id), username, avatar, createdAt }
  }

  const loadBootstrap = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("not_logged_in")

      // Set a minimal user immediately so the UI switches off the landing page.
      // (Profile/groups/dares may still fail due to migrations/RLS/env and shouldn't log the user out.)
      setUser(userFromAuth(userData.user))

      // Prefer the profiles table if present (migration 0002).
      try {
        const profileRes = await supabase
          .from("profiles")
          .select("id, username, avatar, created_at")
          .eq("id", userData.user.id)
          .single()
        if (!profileRes.error && profileRes.data) {
          setUser({
            id: profileRes.data.id,
            username: profileRes.data.username,
            avatar: profileRes.data.avatar || "/placeholder.svg",
            createdAt: profileRes.data.created_at,
          })
        } else if (profileRes.error) {
          console.warn("[bootstrap] profiles lookup failed:", profileRes.error)
        }
      } catch (e) {
        console.warn("[bootstrap] profiles lookup exception:", e)
      }

      // Groups bootstrap (best-effort)
      try {
        const groupsRes = await fetch("/api/groups", { cache: "no-store" }).then((r) => r.json())
        if (groupsRes.ok) {
          const myUserId = String(userData.user.id)
          const mappedGroups: Group[] = (groupsRes.data.groups as any[]).map((g) => ({
            id: g.id,
            name: g.name,
            // We already know these are "my groups" (server filtered), so include at least myself
            // to avoid UI hiding groups before member hydration runs.
            members: [myUserId],
            inviteCode: g.code,
            createdAt: g.createdAt,
          }))
          setGroups(mappedGroups)

          const lastGroupId =
            typeof window !== "undefined" ? window.localStorage.getItem("darepot_active_group") : null
          const preferred = mappedGroups.find((g) => g.id === lastGroupId) || mappedGroups[0] || null
          if (preferred) {
            setActiveGroup(preferred)
            try {
              await refreshGroupState(preferred.id)
            } catch (e) {
              console.warn("[bootstrap] refreshGroupState failed:", e)
            }
          } else {
            setActiveGroup(null)
            setSeasons([])
            setTransactions([])
          }
        } else {
          console.warn("[bootstrap] /api/groups failed:", groupsRes?.error?.message || groupsRes)
          setGroups([])
          setActiveGroup(null)
          setSeasons([])
          setTransactions([])
        }
      } catch (e) {
        console.warn("[bootstrap] /api/groups exception:", e)
      }

      // Dares bootstrap (best-effort)
      try {
        const daresRes = await fetch("/api/dares", { cache: "no-store" }).then((r) => r.json())
        if (daresRes.ok) setDares(daresRes.data.dares)
        else console.warn("[bootstrap] /api/dares failed:", daresRes?.error?.message || daresRes)
      } catch (e) {
        console.warn("[bootstrap] /api/dares exception:", e)
      }
    } catch {
      // Not logged in (or session invalid)
      setUser(null)
      setGroups([])
      setGroupMembersByGroupId({})
      setActiveGroup(null)
      setSeasons([])
      setTransactions([])
      setDares([])
    } finally {
      setLoadingBoot(false)
    }
  }

  const refreshGroupState = async (groupId: string) => {
    const seasonRes = await fetch(`/api/seasons/active?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store" }).then((r) =>
      r.json(),
    )
    if (!seasonRes.ok) throw new Error(seasonRes.error?.message || "failed_active_season")
    const season = seasonRes.data.season as any
    const nextSeasons: Season[] = []
    if (season) {
      const balances: Record<string, number> = {}
      season.balances.forEach((b: any) => (balances[b.userId] = b.balance))
      nextSeasons.push({
        id: season.id,
        groupId: season.groupId,
        name: season.name,
        startDate: season.startAt,
        endDate: season.endAt,
        startingCredits: season.startingCredits,
        dares: [],
        status: season.status,
        balances,
      })
      // Hydrate transactions for this season (ledger page)
      const txRes = await fetch(
        `/api/ledger?groupId=${encodeURIComponent(groupId)}&seasonId=${encodeURIComponent(season.id)}`,
        { cache: "no-store" },
      ).then((r) => r.json())
      if (!txRes.ok) throw new Error(txRes.error?.message || "failed_ledger")
      setTransactions(
        (txRes.data.transactions as any[]).map((t) => ({
          id: t.id,
          userId: t.userId,
          groupId: t.groupId,
          seasonId: t.seasonId,
          game: t.game,
          bet: t.bet,
          payout: t.payout,
          net: t.net,
          timestamp: t.createdAt,
        })),
      )
    } else {
      setTransactions([])
    }
    setSeasons((prev) => {
      // Keep other groups' seasons if already loaded
      const others = prev.filter((s) => s.groupId !== groupId)
      return [...others, ...nextSeasons]
    })

    // Populate members for leaderboard by fetching members list
    const membersRes = await fetch(`/api/groups/${groupId}`, { cache: "no-store" }).then((r) => r.json())
    if (!membersRes.ok) throw new Error(membersRes.error?.message || "failed_members")
    const members = (membersRes.data.members as any[]).map((m) => ({
      userId: String(m.userId),
      username: String(m.username ?? "Unknown"),
      avatar: (m.avatar ?? null) as string | null,
    }))
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, members: members.map((m) => m.userId) } : g)),
    )
    setGroupMembersByGroupId((prev) => ({ ...prev, [groupId]: members }))
  }

  useEffect(() => {
    loadBootstrap()
    const sub = supabase.auth.onAuthStateChange(() => {
      loadBootstrap().catch(() => {})
    })
    return () => sub.data.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const email = `${username}@darepot.local`
      const res = await supabase.auth.signInWithPassword({ email, password })
      if (res.error) {
        console.error("[auth] login error:", res.error)
        return { ok: false, error: res.error.message || "Login failed" }
      }
      await loadBootstrap()
      return { ok: true }
    } catch (e: any) {
      console.error("[auth] login exception:", e)
      return { ok: false, error: e?.message || "Login failed" }
    }
  }

  const register = async (username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const email = `${username}@darepot.local`
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`
      const res = await supabase.auth.signUp({ email, password, options: { data: { username, avatar } } })
      if (res.error) {
        console.error("[auth] register error:", res.error)
        return { ok: false, error: res.error.message || "Sign up failed" }
      }
      await loadBootstrap()
      return { ok: true }
    } catch (e: any) {
      console.error("[auth] register exception:", e)
      return { ok: false, error: e?.message || "Sign up failed" }
    }
  }

  const logout = () => {
    supabase.auth.signOut().catch(() => {})
    setUser(null)
    setActiveGroup(null)
    setGroups([])
    setGroupMembersByGroupId({})
    setSeasons([])
    setTransactions([])
    setDares([])
  }

  const createGroup = async (name: string): Promise<{ ok: true; group: Group } | { ok: false; error: string }> => {
    if (!user) return { ok: false, error: "Not logged in" }
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      }).then((r) => r.json())
      if (!res.ok) return { ok: false, error: String(res.error?.message || "Failed to create group") }

      const gg = res.data.group
      const g: Group = { id: gg.id, name: gg.name, members: [user.id], inviteCode: gg.code, createdAt: gg.createdAt }
      setGroups((prev) => [g, ...prev])
      setActiveGroup(g)
      window.localStorage.setItem("darepot_active_group", g.id)
      setGroupMembersByGroupId((prev) => ({
        ...prev,
        [g.id]: [{ userId: user.id, username: user.username, avatar: user.avatar || null }],
      }))

      await refreshGroupState(g.id)
      return { ok: true, group: g }
    } catch (e: any) {
      return { ok: false, error: e?.message || "Failed to create group" }
    }
  }

  const joinGroup = (code: string): boolean => {
    if (!user) return false
    fetch("/api/groups/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) })
      .then((r) => r.json())
      .then(async (res) => {
        if (!res.ok) return
        const gg = res.data.group
        const g: Group = { id: gg.id, name: gg.name, members: [user.id], inviteCode: gg.code, createdAt: gg.createdAt }
        setGroups((prev) => [g, ...prev.filter((x) => x.id !== g.id)])
        setActiveGroup(g)
        window.localStorage.setItem("darepot_active_group", g.id)
        setGroupMembersByGroupId((prev) => ({
          ...prev,
          [g.id]: [{ userId: user.id, username: user.username, avatar: user.avatar || null }],
        }))
        await refreshGroupState(g.id)
      })
      .catch(() => {})
    return true // optimistic
  }

  const createSeason = (groupId: string, duration: string, selectedDares: string[]) => {
    fetch("/api/seasons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId, duration, dareIds: selectedDares }),
    })
      .then(async () => {
        await refreshGroupState(groupId)
      })
      .catch(() => {})
  }

  const addTransaction = (transaction: Omit<Transaction, "id" | "timestamp">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        groups,
        groupMembersByGroupId,
        activeGroup,
        setActiveGroup: (g) => {
          setActiveGroup(g)
          window.localStorage.setItem("darepot_active_group", g.id)
          refreshGroupState(g.id).catch(() => {})
        },
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
      {loadingBoot ? children : children}
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
