// Whether panels are see-through. Glass turns into a solid panel when the browser has no blur, the device asks for more
// contrast, or "See-through panels" is Off; a device that asks for less see-through (Apple's "Reduce Transparency")
// is obeyed unless the person set the panels to On. The kit's stylesheet reads the answer as `data-glass` on the page.
import type { Me } from './me.ts'

export function glassOn(
  me: Me,
  device: { readonly blur: boolean; readonly lessSeeThrough: boolean; readonly moreContrast: boolean },
): boolean {
  if (!device.blur || device.moreContrast) return false
  if (me.glass === 'off') return false
  if (me.glass === 'on') return true
  return !device.lessSeeThrough
}
