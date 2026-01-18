export function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function requireStartsWith(name: string, value: string, prefixes: string[]): string {
  if (!prefixes.some((p) => value.startsWith(p))) {
    throw new Error(`Invalid ${name}. Expected to start with: ${prefixes.join(" or ")}`)
  }
  return value
}

export const ENV = {
  databaseUrl: () => requireStartsWith("DATABASE_URL", getEnv("DATABASE_URL"), ["postgres://", "postgresql://"]),
  sessionSecret: () => getEnv("SESSION_SECRET"),
  sessionCookieName: () => process.env.SESSION_COOKIE_NAME || "darepot_session",
  sessionTtlDays: () => Number(process.env.SESSION_TTL_DAYS || 14),
  nodeEnv: () => process.env.NODE_ENV || "development",
}


