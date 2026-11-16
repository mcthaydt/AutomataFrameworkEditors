// The window's own events the World screen listens to, put on and taken off together.
interface Heard {
  resized: () => void
  /** The tab is being closed. */
  leaving: (e: BeforeUnloadEvent) => void
  key: (e: KeyboardEvent) => void
  online: (on: boolean) => void
  pointer: (e: PointerEvent) => void
}

const POINTERS = ['pointerdown', 'pointermove', 'pointerover', 'pointerout', 'pointercancel']

/** True when a key press is going into a field: it is the field's, not a command. */
export function typing(e: KeyboardEvent): boolean {
  const target = e.target
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  )
}

/** True when a key press is on a control that takes Space to press itself: the control's, not a command. */
export function onControl(e: KeyboardEvent): boolean {
  const target = e.target
  return (
    target instanceof HTMLElement &&
    target.closest(
      'button, a[href], summary, [role="button"], [role="tab"], [role="menuitem"], [role="switch"]',
    ) !== null
  )
}

/** Starts listening; the returned function stops. */
export function listen(heard: Heard): () => void {
  const up = (): void => heard.online(true)
  const down = (): void => heard.online(false)
  window.addEventListener('resize', heard.resized)
  window.addEventListener('beforeunload', heard.leaving)
  window.addEventListener('keydown', heard.key)
  window.addEventListener('online', up)
  window.addEventListener('offline', down)
  for (const type of POINTERS) {
    window.addEventListener(type, heard.pointer as EventListener, { capture: true, passive: true })
  }
  return () => {
    window.removeEventListener('resize', heard.resized)
    window.removeEventListener('beforeunload', heard.leaving)
    window.removeEventListener('keydown', heard.key)
    window.removeEventListener('online', up)
    window.removeEventListener('offline', down)
    for (const type of POINTERS) {
      window.removeEventListener(type, heard.pointer as EventListener, { capture: true })
    }
  }
}
