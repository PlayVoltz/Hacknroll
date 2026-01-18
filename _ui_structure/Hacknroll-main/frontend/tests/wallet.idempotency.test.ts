import { describe, expect, it, vi } from "vitest"
import { postTransaction } from "../server/services/wallet"

// This is a unit-style test using an in-memory mock of db transactions.
// For real integration tests, we'll add a test DB later.

vi.mock("../server/db", () => {
  type TxRow = { id: string; bet: number; payout: number; net: number; created_at: string }
  const txByKey = new Map<string, TxRow>()
  const balanceByUser = new Map<string, number>()
  balanceByUser.set("u1", 1000)

  return {
    withTx: async (_opts: any, fn: any) => {
      const client = {
        query: async (sql: string, params?: any[]) => {
          if (sql.includes("select status, group_id from public.seasons")) {
            return { rows: [{ status: "active", group_id: "g1" }] }
          }
          if (sql.includes("select balance from public.balances") && sql.includes("for update")) {
            return { rows: [{ balance: String(balanceByUser.get("u1") ?? 0) }] }
          }
          if (sql.includes("insert into public.transactions")) {
            const [seasonId, groupId, userId, game, type, bet, payout, idem] = params as any[]
            const key = `${seasonId}:${userId}:${idem}`
            if (txByKey.has(key)) return { rows: [] }
            const net = Number(payout) - Number(bet)
            const row: TxRow = { id: "tx1", bet: Number(bet), payout: Number(payout), net, created_at: new Date().toISOString() }
            txByKey.set(key, row)
            return { rows: [{ id: row.id, bet: String(row.bet), payout: String(row.payout), net: String(row.net), created_at: row.created_at }] }
          }
          if (sql.includes("select id, bet, payout, net, created_at") && sql.includes("from public.transactions")) {
            const [seasonId, userId, idem] = params as any[]
            const key = `${seasonId}:${userId}:${idem}`
            const row = txByKey.get(key)
            return { rows: row ? [{ id: row.id, bet: String(row.bet), payout: String(row.payout), net: String(row.net), created_at: row.created_at }] : [] }
          }
          if (sql.startsWith("update public.balances set balance")) {
            const [, , balance] = params as any[]
            balanceByUser.set("u1", Number(balance))
            return { rows: [] }
          }
          if (sql.includes("select balance from public.balances where season_id")) {
            return { rows: [{ balance: String(balanceByUser.get("u1") ?? 0) }] }
          }
          return { rows: [], rowCount: 0 }
        },
      }
      return await fn({ client })
    },
  }
})

describe("WalletService idempotency", () => {
  it("returns same tx and doesn't double-apply balance on replay", async () => {
    const base = {
      userId: "u1",
      groupId: "g1",
      seasonId: "s1",
      game: "Mines",
      type: "bet_settle",
      bet: 100,
      payout: 150,
      idempotencyKey: "00000000-0000-0000-0000-000000000001",
      meta: { test: true },
    }

    const first = await postTransaction(base)
    const second = await postTransaction(base)

    expect(first.id).toBe(second.id)
    expect(first.net).toBe(50)
    expect(second.net).toBe(50)
    expect(first.balance).toBe(1050)
    expect(second.balance).toBe(1050)
  })
})


