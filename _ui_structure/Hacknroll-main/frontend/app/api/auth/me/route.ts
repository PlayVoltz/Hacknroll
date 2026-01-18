import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { requireSession } from "@/server/auth/session"
import { getMe } from "@/server/services/users"

export async function GET() {
  try {
    const session = await requireSession()
    const user = await getMe(session.userId)
    return jsonOk({ user })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


