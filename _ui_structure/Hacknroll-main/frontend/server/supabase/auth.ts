import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { unauthorized } from "../http/errors"

export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  if (!url || !anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")

  // Next.js 16+ exposes cookies() as an async API in many runtimes.
  // If we don't await it, we end up reading zero cookies and auth fails (401 Unauthorized).
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const anyStore = cookieStore as any
        if (typeof anyStore.getAll === "function") return anyStore.getAll()
        // Fallback for Next.js cookie stores that are iterable but don't expose getAll().
        try {
          return Array.from(cookieStore as any, (c: any) => ({ name: String(c?.name), value: String(c?.value) }))
        } catch {
          return []
        }
      },
      setAll(cookiesToSet) {
        // Route handlers can set cookies via next/headers
        const anyStore = cookieStore as any
        if (typeof anyStore.set !== "function") return
        cookiesToSet.forEach(({ name, value, options }) => anyStore.set(name, value, options))
      },
    },
  })
}

export async function requireSupabaseUserId(): Promise<string> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) throw unauthorized()
  return data.user.id
}


