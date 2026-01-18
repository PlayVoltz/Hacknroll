import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { getActiveSeason } from "@/server/services/seasons"
import { badRequest } from "@/server/http/errors"

export async function GET(req: Request) {
  try {
    const userId = await requireSupabaseUserId()
    const url = new URL(req.url)
    const groupId = url.searchParams.get("groupId")
    if (!groupId) throw badRequest("missing_groupId", "groupId is required")
    const season = await getActiveSeason(userId, groupId)
    return jsonOk({ season })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


