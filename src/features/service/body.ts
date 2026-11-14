// Reading what a page POSTs. The cheap refusals come first (another origin, no sign-in at all), so a call that was
// never going to be let in costs nothing and is told the same thing whatever it sent.
import { sameOrigin } from '../exchange/exchange.ts'
import type { Answer, GameRef } from '../wire/wire.ts'

export type Json = Record<string, unknown>
export const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** `{ owner, name }` out of anything, or undefined when it is not two strings. */
export function readGame(value: unknown): GameRef | undefined {
  if (!isObject(value)) return undefined
  const { owner, name } = value
  return typeof owner === 'string' && typeof name === 'string' ? { owner, name } : undefined
}

/** The JSON object of a POST, or the problem the call should be answered with. */
export async function readBody(request: Request): Promise<Answer<Json>> {
  if (!sameOrigin(request)) return { ok: false, problem: 'not-allowed' }
  if (request.headers.get('authorization') === null) return { ok: false, problem: 'signed-out' }
  try {
    const body: unknown = await request.json()
    return isObject(body) ? { ok: true, value: body } : { ok: false, problem: 'bad-request' }
  } catch {
    return { ok: false, problem: 'bad-request' }
  }
}
