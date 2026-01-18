import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { deleteSessionCookie } from "@/server/auth/session"

export async function POST() {
  try {
    await deleteSessionCookie()
    return jsonOk({ ok: true })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


