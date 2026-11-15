// Which floating parts of the level screen a person has closed (ruling 17, and the zoom buttons from ruling 23). They
// are kept on the device so a reload finds the screen as it was left. Everything is open on a first visit.

export type PanelName = 'tools' | 'card' | 'block' | 'switch' | 'zoom'
export const PANEL_NAMES: readonly PanelName[] = ['tools', 'card', 'block', 'switch', 'zoom']

/** The one key the device keeps this under (CLAUDE.md lists it among the things a device may keep). */
export const PANELS_KEY = 'af.panels'

const isName = (value: unknown): value is PanelName => PANEL_NAMES.some((name) => name === value)

/** What was closed, from the device. Nothing stored, rubbish, or a store that throws: nothing is closed. */
export function readClosed(store: Storage | undefined): ReadonlySet<PanelName> {
  try {
    const text = store?.getItem(PANELS_KEY)
    if (text === null || text === undefined) return new Set()
    const list: unknown = JSON.parse(text)
    return new Set(Array.isArray(list) ? list.filter(isName) : [])
  } catch {
    return new Set()
  }
}

/** Keeps what is closed on the device. Never throws: a full or missing store only means it is not kept. */
export function keepClosed(store: Storage | undefined, closed: ReadonlySet<PanelName>): void {
  try {
    store?.setItem(PANELS_KEY, JSON.stringify(PANEL_NAMES.filter((name) => closed.has(name))))
  } catch {
    // Not kept; the screen carries on.
  }
}

/** The set with `name` closed if it was open, and open if it was closed. */
export function toggled(closed: ReadonlySet<PanelName>, name: PanelName): ReadonlySet<PanelName> {
  const next = new Set(closed)
  if (!next.delete(name)) next.add(name)
  return next
}

/** Are all the parts that float here closed? (With none floating, there is nothing to say yes about.) */
export function allClosed(closed: ReadonlySet<PanelName>, floating: readonly PanelName[]): boolean {
  return floating.length > 0 && floating.every((name) => closed.has(name))
}
