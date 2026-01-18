import { z } from "zod"
import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { parseJson } from "@/server/http/validate"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { joinGroupByCode } from "@/server/services/groups"

const Body = z.object({
  code: z.string().min(1).max(16),
})

export async function POST(req: Request) {
  try {
    const userId = await requireSupabaseUserId()
    const body = await parseJson(req, Body)
    const group = await joinGroupByCode(userId, body.code)
    return jsonOk({ group })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


