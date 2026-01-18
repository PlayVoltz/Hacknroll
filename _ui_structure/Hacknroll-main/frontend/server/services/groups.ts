import crypto from "crypto"
import { badRequest, forbidden, notFound } from "../http/errors"
import { supabaseAdmin } from "../supabase/server"

export type GroupSummary = {
  id: string
  name: string
  code: string
  ownerId: string
  createdAt: string
  memberCount: number
}

export type GroupMember = {
  userId: string
  role: string
  joinedAt: string
  username: string
  avatar: string | null
}

function makeCode(): string {
  // 6 chars base32-ish, avoids ambiguous chars
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(6)
  let out = ""
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i]! % alphabet.length]
  return out
}

export async function listMyGroups(userId: string): Promise<GroupSummary[]> {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from("groups")
    .select("id,name,code,owner_id,created_at,group_members(count)")
    .eq("group_members.user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    code: g.code,
    ownerId: g.owner_id,
    createdAt: g.created_at,
    memberCount: Array.isArray(g.group_members) && g.group_members[0]?.count != null ? Number(g.group_members[0].count) : 0,
  }))
}

export async function createGroup(userId: string, name: string): Promise<GroupSummary> {
  if (!name.trim()) throw badRequest("invalid_name", "Group name is required")
  const trimmed = name.trim()

  const supabase = supabaseAdmin()

  // Try a few times to avoid code collisions
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode()

    const ins = await supabase
      .from("groups")
      .insert({ name: trimmed, code, owner_id: userId })
      .select("id,name,code,owner_id,created_at")
      .single()

    if (ins.error) {
      // unique violation (code collision)
      // PostgREST uses 23505 in error.details sometimes; safest retry on conflict-like errors
      const maybeConflict = String((ins.error as any).code || "") === "23505"
      if (maybeConflict) continue
      throw ins.error
    }

    const g = ins.data as any

    const gm = await supabase.from("group_members").insert({ group_id: g.id, user_id: userId, role: "owner" })
    if (gm.error) throw gm.error

    return {
      id: g.id,
      name: g.name,
      code: g.code,
      ownerId: g.owner_id,
      createdAt: g.created_at,
      memberCount: 1,
    }
  }

  throw new Error("Unable to generate unique group code")
}

export async function joinGroupByCode(userId: string, code: string): Promise<GroupSummary> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) throw badRequest("invalid_code", "Invite code is required")

  const supabase = supabaseAdmin()

  const gRes = await supabase.from("groups").select("id,name,code,owner_id,created_at").eq("code", normalized).single()
  if (gRes.error) {
    if ((gRes.error as any).code === "PGRST116") throw notFound("Group not found")
    throw gRes.error
  }
  const g = gRes.data as any

  const mRes = await supabase.from("group_members").select("group_id").eq("group_id", g.id).eq("user_id", userId).maybeSingle()
  if (mRes.error) throw mRes.error
  if (mRes.data) throw forbidden("You're already in this group")

  const ins = await supabase.from("group_members").insert({ group_id: g.id, user_id: userId, role: "member" })
  if (ins.error) throw ins.error

  const countRes = await supabase.from("group_members").select("*", { count: "exact", head: true }).eq("group_id", g.id)
  if (countRes.error) throw countRes.error
  const memberCount = countRes.count ?? 0

  return {
    id: g.id,
    name: g.name,
    code: g.code,
    ownerId: g.owner_id,
    createdAt: g.created_at,
    memberCount,
  }
}

export async function getGroupMembers(userId: string, groupId: string): Promise<GroupMember[]> {
  const supabase = supabaseAdmin()

  // membership check (server-authoritative)
  const m = await supabase.from("group_members").select("group_id").eq("group_id", groupId).eq("user_id", userId).maybeSingle()
  if (m.error) throw m.error
  if (!m.data) throw forbidden("You are not a member of this group")

  const res = await supabase
    .from("group_members")
    .select("user_id, role, joined_at, profiles:profiles!group_members_user_id_fkey(username, avatar)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true })

  if (res.error) throw res.error

  return (res.data || []).map((r: any) => ({
    userId: r.user_id,
    role: r.role,
    joinedAt: r.joined_at,
    username: r.profiles?.username ?? "Unknown",
    avatar: r.profiles?.avatar ?? null,
  }))
}


