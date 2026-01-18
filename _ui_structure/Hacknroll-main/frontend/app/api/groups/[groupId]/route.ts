import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { getGroupMembers } from "@/server/services/groups"

export async function GET(_req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  try {
    const userId = await requireSupabaseUserId()
    const { groupId } = await ctx.params
    const members = await getGroupMembers(userId, groupId)
    return jsonOk({ members })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


