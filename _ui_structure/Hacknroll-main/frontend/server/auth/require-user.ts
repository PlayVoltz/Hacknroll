import { requireSession } from "./session"
import { getMe, type PublicUser } from "../services/users"

export async function requireUser(): Promise<PublicUser> {
  const session = await requireSession()
  return await getMe(session.userId)
}


