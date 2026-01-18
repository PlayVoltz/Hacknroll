import { badRequest, forbidden, notFound } from "../http/errors"
import { supabaseAdmin } from "../supabase/server"

export type Season = {
  id: string
  groupId: string
  name: string
  startAt: string
  endAt: string
  startingCredits: number
  status: "active" | "ended"
}

export type BalanceRow = { userId: string; balance: number }

export async function getActiveSeason(userId: string, groupId: string): Promise<(Season & { balances: BalanceRow[] }) | null> {
  const supabase = supabaseAdmin()

  // membership check
  const m = await supabase.from("group_members").select("group_id").eq("group_id", groupId).eq("user_id", userId).maybeSingle()
  if (m.error) throw m.error
  if (!m.data) throw forbidden("You are not a member of this group")

  const sRes = await supabase
    .from("seasons")
    .select("id, group_id, name, start_at, end_at, starting_credits, status")
    .eq("group_id", groupId)
    .eq("status", "active")
    .maybeSingle()

  if (sRes.error) throw sRes.error
  if (!sRes.data) return null

  const s = sRes.data as any

  const bRes = await supabase.from("balances").select("user_id, balance").eq("season_id", s.id)
  if (bRes.error) throw bRes.error
  const balances = (bRes.data || []).map((r: any) => ({ userId: r.user_id as string, balance: Number(r.balance) }))

  return {
    id: s.id,
    groupId: s.group_id,
    name: s.name,
    startAt: s.start_at,
    endAt: s.end_at,
    startingCredits: Number(s.starting_credits),
    status: s.status,
    balances,
  }
}

function durationToEndAt(duration: "1h" | "1d" | "3d" | "1w"): Date {
  const end = new Date()
  switch (duration) {
    case "1h":
      end.setHours(end.getHours() + 1)
      return end
    case "1d":
      end.setDate(end.getDate() + 1)
      return end
    case "3d":
      end.setDate(end.getDate() + 3)
      return end
    case "1w":
      end.setDate(end.getDate() + 7)
      return end
  }
}

export async function createSeason(params: {
  userId: string
  groupId: string
  duration: "1h" | "1d" | "3d" | "1w"
  dareIds: string[]
}): Promise<Season> {
  if (!params.dareIds.length) throw badRequest("missing_dares", "Select at least 1 dare")
  if (params.dareIds.length > 3) throw badRequest("too_many_dares", "Select up to 3 dares")

  const supabase = supabaseAdmin()

  const gm = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", params.groupId)
    .eq("user_id", params.userId)
    .maybeSingle()
  if (gm.error) throw gm.error
  if (!gm.data) throw forbidden("You are not a member of this group")

  const existing = await supabase.from("seasons").select("id").eq("group_id", params.groupId).eq("status", "active").maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) throw badRequest("season_exists", "This group already has an active season")

  const endAt = durationToEndAt(params.duration)

  const countRes = await supabase.from("seasons").select("id", { count: "exact", head: true }).eq("group_id", params.groupId)
  if (countRes.error) throw countRes.error
  const name = `Season ${(countRes.count ?? 0) + 1}`

  const sRes = await supabase
    .from("seasons")
    .insert({ group_id: params.groupId, name, end_at: endAt.toISOString(), starting_credits: 1000, status: "active", created_by: params.userId })
    .select("id, group_id, name, start_at, end_at, starting_credits, status")
    .single()
  if (sRes.error) throw sRes.error
  const s = sRes.data as any

  const membersRes = await supabase.from("group_members").select("user_id").eq("group_id", params.groupId)
  if (membersRes.error) throw membersRes.error
  for (const m of membersRes.data || []) {
    const insBal = await supabase.from("balances").insert({ season_id: s.id, user_id: (m as any).user_id, balance: 1000 })
    if (insBal.error && String((insBal.error as any).code || "") !== "23505") throw insBal.error
  }

  for (const dareId of params.dareIds) {
    const ins = await supabase.from("season_dares").insert({ season_id: s.id, user_id: params.userId, dare_id: dareId })
    if (ins.error && String((ins.error as any).code || "") !== "23505") throw ins.error
  }

  return {
    id: s.id,
    groupId: s.group_id,
    name: s.name,
    startAt: s.start_at,
    endAt: s.end_at,
    startingCredits: Number(s.starting_credits),
    status: s.status,
  }
}


