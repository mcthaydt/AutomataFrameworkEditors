// The glass is told to the stylesheet once, on the page itself: see-through when the device can and the person lets it.
import { glassOn, type Me } from '../device/device.ts'

/** Sets `data-glass` on the page; the returned function takes it away again. */
export function showGlass(me: Me): () => void {
  const support = {
    blur: CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'),
    lessSeeThrough: matchMedia('(prefers-reduced-transparency: reduce)').matches,
    moreContrast: matchMedia('(prefers-contrast: more)').matches,
  }
  document.documentElement.dataset.glass = glassOn(me, support) ? 'on' : 'off'
  return () => {
    delete document.documentElement.dataset.glass
  }
}
