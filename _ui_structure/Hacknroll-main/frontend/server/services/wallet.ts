import { withTx } from "../db"
import { badRequest, forbidden } from "../http/errors"

export type WalletTx = {
  id: string
  bet: number
  payout: number
  net: number
  balance: number
  createdAt: string
}

export async function postTransaction(params: {
  userId: string
  groupId: string
  seasonId: string
  game: string
  type: string
  bet: number
  payout: number
  idempotencyKey: string
  meta?: unknown
}): Promise<WalletTx> {
  if (params.bet < 0 || params.payout < 0) throw badRequest("invalid_amount", "Invalid bet/payout")

  return await withTx({ userId: params.userId }, async ({ client }) => {
    // Ensure season is active & belongs to group
    const seasonRes = await client.query(`select status, group_id from public.seasons where id=$1`, [params.seasonId])
    const season = seasonRes.rows[0] as { status: string; group_id: string } | undefined
    if (!season) throw badRequest("season_not_found", "Season not found")
    if (season.group_id !== params.groupId) throw forbidden("Season/group mismatch")
    if (season.status !== "active") throw forbidden("Season is not active")

    // Lock balance row
    const balRes = await client.query(`select balance from public.balances where season_id=$1 and user_id=$2 for update`, [
      params.seasonId,
      params.userId,
    ])
    const balRow = balRes.rows[0] as { balance: string } | undefined
    if (!balRow) throw badRequest("balance_missing", "Balance not initialized for this season")
    const current = Number(balRow.balance)

    const net = params.payout - params.bet
    if (net < 0 && current + net < 0) throw badRequest("insufficient_balance", "Insufficient balance")

    const metaJson = params.meta ? JSON.stringify(params.meta) : "{}"

    // Idempotent insert
    const ins = await client.query(
      `
      insert into public.transactions (season_id, group_id, user_id, game, type, bet, payout, idempotency_key, meta_json)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
      on conflict (season_id, user_id, idempotency_key) do nothing
      returning id, bet, payout, net, created_at
      `,
      [
        params.seasonId,
        params.groupId,
        params.userId,
        params.game,
        params.type,
        params.bet,
        params.payout,
        params.idempotencyKey,
        metaJson,
      ],
    )

    let tx:
      | {
          id: string
          bet: string
          payout: string
          net: string
          created_at: string
        }
      | undefined = ins.rows[0]

    if (!tx) {
      // Conflict: read existing tx
      const existing = await client.query(
        `select id, bet, payout, net, created_at
         from public.transactions
         where season_id=$1 and user_id=$2 and idempotency_key=$3
         limit 1`,
        [params.seasonId, params.userId, params.idempotencyKey],
      )
      tx = existing.rows[0]
      if (!tx) throw new Error("Idempotency conflict but transaction not found")
      // Balance is already updated from original call; read it
      const bal2 = await client.query(`select balance from public.balances where season_id=$1 and user_id=$2`, [
        params.seasonId,
        params.userId,
      ])
      const b = Number((bal2.rows[0] as any).balance)
      return { id: tx.id, bet: Number(tx.bet), payout: Number(tx.payout), net: Number(tx.net), createdAt: tx.created_at, balance: b }
    }

    // Apply balance update
    const newBalance = current + Number(tx.net)
    await client.query(`update public.balances set balance=$3, updated_at=now() where season_id=$1 and user_id=$2`, [
      params.seasonId,
      params.userId,
      newBalance,
    ])

    return {
      id: tx.id,
      bet: Number(tx.bet),
      payout: Number(tx.payout),
      net: Number(tx.net),
      createdAt: tx.created_at,
      balance: newBalance,
    }
  })
}


