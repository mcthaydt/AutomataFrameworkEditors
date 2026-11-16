// A device's storage for the tests: a map that answers like `localStorage`, and a full one that refuses every write.
export function memoryStore(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  }
}

/** A store with no room: every write throws, as a full one does. What it already holds can still be read. */
export function fullStore(held: Storage = memoryStore()): Storage {
  return {
    get length() {
      return held.length
    },
    clear: () => held.clear(),
    getItem: (key) => held.getItem(key),
    key: (index) => held.key(index),
    removeItem: (key) => held.removeItem(key),
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
}

/** A store that throws on every call: a device that blocks storage. */
export function brokenStore(): Storage {
  const fail = (): never => {
    throw new Error('SecurityError')
  }
  return {
    get length(): number {
      return fail()
    },
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  }
}
