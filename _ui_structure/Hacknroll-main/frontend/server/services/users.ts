import { withTx } from "../db"
import { badRequest, unauthorized } from "../http/errors"
import { hashPassword, verifyPassword } from "../auth/password"

export type PublicUser = {
  id: string
  username: string
  avatar: string | null
  createdAt: string
}

export async function createUser(params: { username: string; password: string; avatar?: string | null }): Promise<PublicUser> {
  const passwordHash = await hashPassword(params.password)

  const user = await withTx({ userId: null }, async ({ client }) => {
    try {
      const res = await client.query(
        `insert into public.users (username, password_hash, avatar)
         values ($1,$2,$3)
         returning id, username, avatar, created_at`,
        [params.username, passwordHash, params.avatar || null],
      )
      return res.rows[0] as { id: string; username: string; avatar: string | null; created_at: string }
    } catch (e: any) {
      // Postgres unique violation
      if (e?.code === "23505") throw badRequest("username_taken", "Username already taken")
      throw e
    }
  })

  return { id: user.id, username: user.username, avatar: user.avatar, createdAt: user.created_at }
}

export async function authenticateUser(params: { username: string; password: string }): Promise<PublicUser & { passwordHash: string }> {
  const row = await withTx({ userId: null }, async ({ client }) => {
    const res = await client.query("select id, username, password_hash, avatar, created_at from app.auth_lookup_user($1)", [
      params.username,
    ])
    return res.rows[0] as
      | { id: string; username: string; password_hash: string; avatar: string | null; created_at: string }
      | undefined
  })

  // Don't reveal which part failed
  if (!row) throw unauthorized("Invalid username or password")
  const ok = await verifyPassword(row.password_hash, params.password)
  if (!ok) throw unauthorized("Invalid username or password")

  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  }
}

export async function getMe(userId: string): Promise<PublicUser> {
  const row = await withTx({ userId }, async ({ client }) => {
    const res = await client.query("select id, username, avatar, created_at from public.users where id = $1", [userId])
    return res.rows[0] as { id: string; username: string; avatar: string | null; created_at: string } | undefined
  })
  if (!row) throw unauthorized()
  return { id: row.id, username: row.username, avatar: row.avatar, createdAt: row.created_at }
}


