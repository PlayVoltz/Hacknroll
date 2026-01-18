import { z } from "zod"
import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { parseJson } from "@/server/http/validate"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { createGroup, listMyGroups } from "@/server/services/groups"

const CreateBody = z.object({
  name: z.string().min(1).max(60),
})

export async function GET() {
  try {
    const userId = await requireSupabaseUserId()
    const groups = await listMyGroups(userId)
    return jsonOk({ groups })
  } catch (e) {
    return jsonError(e)
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireSupabaseUserId()
    const body = await parseJson(req, CreateBody)
    const group = await createGroup(userId, body.name)
    return jsonOk({ group }, { status: 201 })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


