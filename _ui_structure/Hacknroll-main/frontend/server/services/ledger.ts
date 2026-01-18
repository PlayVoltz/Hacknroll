import { supabaseAdmin } from "../supabase/server"

export type LedgerTx = {
  id: string
  userId: string
  groupId: string
  seasonId: string
  game: string
  type: string
  bet: number
  payout: number
  net: number
  createdAt: string
}

export async function listLedger(params: {
  userId: string
  groupId: string
  seasonId: string
  game?: string | null
  limit?: number
}): Promise<LedgerTx[]> {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500)
  const supabase = supabaseAdmin()

  let q = supabase
    .from("transactions")
    .select("id,user_id,group_id,season_id,game,type,bet,payout,net,created_at")
    .eq("user_id", params.userId)
    .eq("group_id", params.groupId)
    .eq("season_id", params.seasonId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.game && params.game !== "All") {
    q = q.eq("game", params.game)
  }

  const res = await q
  if (res.error) throw res.error

  return (res.data || []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    groupId: r.group_id,
    seasonId: r.season_id,
    game: r.game,
    type: r.type,
    bet: Number(r.bet),
    payout: Number(r.payout),
    net: Number(r.net),
    createdAt: r.created_at,
  }))
}


