/** A copy of the set with one id in it or out of it; the set it was given is never changed. */
export function withId(set: ReadonlySet<string>, id: string, on: boolean): ReadonlySet<string> {
  const next = new Set(set)
  if (on) next.add(id)
  else next.delete(id)
  return next
}
