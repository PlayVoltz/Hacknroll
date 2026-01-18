import { z } from "zod"
import { NextResponse } from "next/server"
import { parseJson } from "@/server/http/validate"
import { jsonError, jsonOk } from "@/server/http/response"
import { getClientIp } from "@/server/http/request"
import { rateLimitOrThrow } from "@/server/auth/rate-limit"
import { createUser } from "@/server/services/users"
import { createSessionCookie } from "@/server/auth/session"

const Body = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, underscore only"),
  password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  try {
    const body = await parseJson(req, Body)
    const ip = getClientIp(req as any)

    await rateLimitOrThrow(`ip:${ip}:signup`, 10, 60)
    await rateLimitOrThrow(`user:${body.username.toLowerCase()}:signup`, 5, 60)

    const user = await createUser({
      username: body.username,
      password: body.password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.username)}`,
    })
    await createSessionCookie(user.id)
    return jsonOk({ user }, { status: 201 })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


