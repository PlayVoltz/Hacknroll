import { NextResponse } from "next/server"
import { jsonError, jsonOk } from "@/server/http/response"
import { requireSupabaseUserId } from "@/server/supabase/auth"
import { supabaseAdmin } from "@/server/supabase/server"

export async function GET() {
  try {
    // Must be logged in (keeps parity with app behavior)
    await requireSupabaseUserId()

    const supabase = supabaseAdmin()
    const res = await supabase
      .from("dares")
      .select("id,title,description,category,intensity,indoor")
      .order("created_at", { ascending: true })

    if (res.error) throw res.error

    const dares = (res.data || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      intensity: r.intensity,
      indoor: r.indoor,
    }))

    return jsonOk({ dares })
  } catch (e) {
    return jsonError(e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


