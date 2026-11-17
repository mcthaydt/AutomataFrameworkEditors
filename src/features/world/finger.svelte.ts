// A value that follows what is wanted, except while a finger is down: it then waits for the finger to lift, so a change of
// layout never moves what is under a finger that is pressing or dragging it.
import { untrack } from 'svelte'

/** Call while a component is made. */
export function afterFinger<T>(wanted: () => T): { readonly value: T } {
  let value = $state.raw(untrack(wanted))
  let down = false
  $effect(() => {
    const next = wanted()
    if (!down) value = next
  })
  $effect(() => {
    const press = (): void => {
      down = true
    }
    const lift = (): void => {
      down = false
      value = untrack(wanted)
    }
    addEventListener('pointerdown', press, true)
    addEventListener('pointerup', lift, true)
    addEventListener('pointercancel', lift, true)
    return () => {
      removeEventListener('pointerdown', press, true)
      removeEventListener('pointerup', lift, true)
      removeEventListener('pointercancel', lift, true)
    }
  })
  return {
    get value() {
      return value
    },
  }
}
