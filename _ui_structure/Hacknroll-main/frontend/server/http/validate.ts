import { z } from "zod"
import { badRequest } from "./errors"

export async function parseJson<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    throw badRequest("invalid_json", "Invalid JSON body")
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw badRequest("invalid_request", "Invalid request", parsed.error.flatten())
  }
  return parsed.data
}


