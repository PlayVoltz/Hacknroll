import { z } from "zod"
import { NextResponse } from "next/server"
import { parseJson } from "@/server/http/validate"
import { jsonError, jsonOk } from "@/server/http/response"
import { getClientIp } from "@/server/http/request"
import { rateLimitOrThrow } from "@/server/auth/rate-limit"
import { authenticateUser } from "@/server/services/users"
import { createSessionCookie } from "@/server/auth/session"

const Body = z.object({
  username: z.string().min(1).max(24),
  password: z.string().min(1).max(200),
})

export async function POST(req: Request) {
  try {
    const body = await parseJson(req, Body)
    const ip = getClientIp(req as any)

    await rateLimitOrThrow(`ip:${ip}:login`, 20, 60)
    await rateLimitOrThrow(`user:${body.username.toLowerCase()}:login`, 10, 60)

    const user = await authenticateUser({ username: body.username, password: body.password })
    await createSessionCookie(user.id)
    return jsonOk({ user: { id: user.id, username: user.username, avatar: user.avatar, createdAt: user.createdAt } })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


