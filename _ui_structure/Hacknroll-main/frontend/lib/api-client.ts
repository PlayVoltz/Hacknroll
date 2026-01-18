export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; error: { code: string; message: string; details?: unknown } }
export type ApiResult<T> = ApiOk<T> | ApiErr

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const json = (await res.json()) as ApiResult<T>
  if (!json.ok) {
    const err = new Error(json.error.message) as Error & { code?: string; details?: unknown; status?: number }
    err.code = json.error.code
    err.details = json.error.details
    err.status = res.status
    throw err
  }
  return json.data
}

export const api = {
  auth: {
    signup: (username: string, password: string) =>
      apiFetch<{ user: { id: string; username: string; avatar: string | null; createdAt: string } }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      apiFetch<{ user: { id: string; username: string; avatar: string | null; createdAt: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    logout: () => apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) }),
    me: () => apiFetch<{ user: { id: string; username: string; avatar: string | null; createdAt: string } }>("/api/auth/me"),
  },
  groups: {
    list: () => apiFetch<{ groups: Array<{ id: string; name: string; code: string; ownerId: string; createdAt: string; memberCount: number }> }>("/api/groups"),
    create: (name: string) =>
      apiFetch<{ group: { id: string; name: string; code: string; ownerId: string; createdAt: string; memberCount: number } }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    join: (code: string) =>
      apiFetch<{ group: { id: string; name: string; code: string; ownerId: string; createdAt: string; memberCount: number } }>(
        "/api/groups/join",
        { method: "POST", body: JSON.stringify({ code }) },
      ),
    members: (groupId: string) => apiFetch<{ members: Array<{ userId: string; role: string; joinedAt: string; username: string; avatar: string | null }> }>(`/api/groups/${groupId}`),
  },
  seasons: {
    create: (groupId: string, duration: "1h" | "1d" | "3d" | "1w", dareIds: string[]) =>
      apiFetch<{ season: { id: string; groupId: string; name: string; startAt: string; endAt: string; startingCredits: number; status: "active" | "ended" } }>(
        "/api/seasons",
        { method: "POST", body: JSON.stringify({ groupId, duration, dareIds }) },
      ),
    active: (groupId: string) => apiFetch<{ season: null | { id: string; groupId: string; name: string; startAt: string; endAt: string; startingCredits: number; status: "active" | "ended"; balances: Array<{ userId: string; balance: number }> } }>(`/api/seasons/active?groupId=${encodeURIComponent(groupId)}`),
  },
  dares: {
    list: () => apiFetch<{ dares: Array<{ id: string; title: string; description: string; category: string; intensity: string; indoor: boolean }> }>("/api/dares"),
  },
  ledger: {
    list: (groupId: string, seasonId: string, game?: string) => {
      const qs = new URLSearchParams({ groupId, seasonId })
      if (game) qs.set("game", game)
      return apiFetch<{ transactions: Array<{ id: string; userId: string; groupId: string; seasonId: string; game: string; type: string; bet: number; payout: number; net: number; createdAt: string }> }>(
        `/api/ledger?${qs.toString()}`,
      )
    },
  },
}


