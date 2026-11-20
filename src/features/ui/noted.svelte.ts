// What floats at the top of the screen by itself (a note with Undo, the helper's card). What else is stacked there (the tips,
// someone's note) starts below all of it, so no card lies on another.
import { SvelteMap } from 'svelte/reactivity'

const heights = new SvelteMap<object, number>()

/** The room the floating cards take, with a gap under each. */
export const stacked = {
  get height(): number {
    let total = 0
    for (const one of heights.values()) total += one + 16
    return total
  },
}

/** An action for a floating card: its height counts while it is on the screen (and `on` is true). */
export function stack(
  node: HTMLElement,
  on: boolean = true,
): { update: (on: boolean) => void; destroy: () => void } {
  const key = {}
  let watch: ResizeObserver | undefined
  const measure = (): void => void heights.set(key, node.getBoundingClientRect().height)
  const start = (): void => {
    measure()
    watch = new ResizeObserver(measure)
    watch.observe(node)
  }
  const stop = (): void => {
    watch?.disconnect()
    watch = undefined
    heights.delete(key)
  }
  if (on) start()
  return {
    update(next) {
      if (next && watch === undefined) start()
      else if (!next) stop()
    },
    destroy: stop,
  }
}
