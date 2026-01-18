import { z } from "zod"
import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { parseJson } from "@/server/http/validate"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { createSeason } from "@/server/services/seasons"

const Body = z.object({
  groupId: z.string().uuid(),
  duration: z.enum(["1h", "1d", "3d", "1w"]),
  dareIds: z.array(z.string().uuid()).min(1).max(3),
})

export async function POST(req: Request) {
  try {
    const userId = await requireSupabaseUserId()
    const body = await parseJson(req, Body)
    const season = await createSeason({
      userId,
      groupId: body.groupId,
      duration: body.duration,
      dareIds: body.dareIds,
    })
    return jsonOk({ season }, { status: 201 })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


