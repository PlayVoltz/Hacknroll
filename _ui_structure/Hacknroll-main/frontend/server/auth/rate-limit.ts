import { withTx } from "../db"
import { tooManyRequests } from "../http/errors"

export async function rateLimitOrThrow(key: string, limit: number, windowSeconds: number) {
  const row = await withTx({ userId: null }, async ({ client }) => {
    const res = await client.query("select allowed, attempts, window_start_at from app.auth_rate_limit_check($1,$2,$3)", [
      key,
      limit,
      windowSeconds,
    ])
    return res.rows[0] as { allowed: boolean; attempts: number; window_start_at: string } | undefined
  })

  if (!row) return
  if (!row.allowed) {
    throw tooManyRequests("Too many attempts. Please wait and try again.")
  }
}


