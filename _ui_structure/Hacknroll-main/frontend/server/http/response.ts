import { NextResponse } from "next/server"
import { HttpError } from "./errors"
import { ENV } from "../env"

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function jsonError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    )
  }

  // Log full details server-side; return details only in non-production.
  // eslint-disable-next-line no-console
  console.error(err)

  const anyErr = err as any
  const isProd = ENV.nodeEnv() === "production"
  const code = typeof anyErr?.code === "string" ? anyErr.code : "internal"
  const message = !isProd && typeof anyErr?.message === "string" ? anyErr.message : "Internal server error"

  return NextResponse.json({ ok: false, error: { code, message } }, { status: 500 })
}


