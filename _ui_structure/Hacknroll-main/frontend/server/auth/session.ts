import crypto from "crypto"
import { cookies } from "next/headers"
import { ENV } from "../env"
import { withTx } from "../db"
import { unauthorized } from "../http/errors"

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.nodeEnv() === "production",
  sameSite: "lax" as const,
  path: "/",
}

function hmacToken(token: string): Buffer {
  return crypto.createHmac("sha256", ENV.sessionSecret()).update(token).digest()
}

export type Session = {
  sessionId: string
  userId: string
  expiresAt: string
}

export async function createSessionCookie(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url")
  const tokenHash = hmacToken(token)
  const ttlDays = ENV.sessionTtlDays()
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

  await withTx({ userId: null }, async ({ client }) => {
    await client.query("select app.auth_create_session($1,$2,$3)", [userId, tokenHash, expiresAt.toISOString()])
  })

  const jar = await cookies()
  jar.set(ENV.sessionCookieName(), token, {
    ...COOKIE_OPTIONS,
    expires: expiresAt,
  })
}

export async function deleteSessionCookie(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(ENV.sessionCookieName())?.value
  if (token) {
    const tokenHash = hmacToken(token)
    await withTx({ userId: null }, async ({ client }) => {
      await client.query("select app.auth_delete_session($1)", [tokenHash])
    })
  }
  jar.set(ENV.sessionCookieName(), "", { ...COOKIE_OPTIONS, expires: new Date(0) })
}

export async function requireSession(): Promise<Session> {
  const jar = await cookies()
  const token = jar.get(ENV.sessionCookieName())?.value
  if (!token) throw unauthorized()

  const tokenHash = hmacToken(token)

  const row = await withTx({ userId: null }, async ({ client }) => {
    const res = await client.query(
      "select id, user_id, expires_at, created_at from app.auth_lookup_session($1)",
      [tokenHash],
    )
    return res.rows[0] as { id: string; user_id: string; expires_at: string } | undefined
  })

  if (!row) throw unauthorized()
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteSessionCookie()
    throw unauthorized()
  }

  return { sessionId: row.id, userId: row.user_id, expiresAt: row.expires_at }
}


