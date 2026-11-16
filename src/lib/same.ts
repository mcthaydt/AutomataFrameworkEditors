// Whether two pieces of data are the same by value: plain data only (numbers, text, true and false, lists, objects).
// An object is the same when it has the same keys with the same values, in any order; a key whose value is
// `undefined` counts as no key, because a written file never has one.

const keysOf = (value: Readonly<Record<string, unknown>>): string[] =>
  Object.keys(value).filter((key) => value[key] !== undefined)

export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => same(item, b[i]))
    )
  }
  const left = a as Readonly<Record<string, unknown>>
  const right = b as Readonly<Record<string, unknown>>
  const keys = keysOf(left)
  return keys.length === keysOf(right).length && keys.every((key) => same(left[key], right[key]))
}
