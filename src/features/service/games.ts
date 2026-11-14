// The games a signed-in person has the editor in: asked with their own token, so GitHub itself says which they reach.
import { reposOf } from '../github/github.ts'
import type { Answer, GameRef } from '../wire/wire.ts'
import { type ApiDeps, signedIn } from './enter.ts'

export async function listGames(deps: ApiDeps, request: Request): Promise<Answer<readonly GameRef[]>> {
  const person = await signedIn(deps, request)
  if (!person.ok) return person
  return reposOf(deps, person.value.token)
}
