// Props a test can change after a component is mounted: Svelte watches the object, so setting a field re-renders the
// component the way a parent screen changing its own state would.
export function live<T extends object>(initial: T): T {
  const props = $state(initial)
  return props
}
