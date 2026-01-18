import { Pool, type PoolClient } from "pg"
import { ENV } from "./env"

let _pool: Pool | null = null

function shouldUseSsl(connectionString: string): boolean {
  const lc = connectionString.toLowerCase()
  if (lc.includes("sslmode=require")) return true
  // Supabase Postgres requires SSL in most environments.
  if (lc.includes(".supabase.co")) return true
  return false
}

export function dbPool(): Pool {
  if (_pool) return _pool
  const connectionString = ENV.databaseUrl()
  _pool = new Pool({
    connectionString,
    max: 10,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  })
  return _pool
}

export type DbTx = {
  client: PoolClient
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await dbPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function withTx<T>(
  options: { userId?: string | null },
  fn: (tx: DbTx) => Promise<T>,
): Promise<T> {
  return await withClient(async (client) => {
    await client.query("begin")
    try {
      if (options.userId) {
        // custom RLS context
        await client.query("select set_config('app.user_id', $1, true)", [options.userId])
      } else {
        await client.query("select set_config('app.user_id', '', true)")
      }
      const result = await fn({ client })
      await client.query("commit")
      return result
    } catch (e) {
      await client.query("rollback")
      throw e
    }
  })
}


