import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { badRequest } from "@/server/http/errors"
import { listLedger } from "@/server/services/ledger"

export async function GET(req: Request) {
  try {
    const userId = await requireSupabaseUserId()
    const url = new URL(req.url)
    const groupId = url.searchParams.get("groupId")
    const seasonId = url.searchParams.get("seasonId")
    const game = url.searchParams.get("game")
    if (!groupId) throw badRequest("missing_groupId", "groupId is required")
    if (!seasonId) throw badRequest("missing_seasonId", "seasonId is required")

    const txs = await listLedger({
      userId,
      groupId,
      seasonId,
      game,
      limit: 200,
    })

    return jsonOk({ transactions: txs })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


