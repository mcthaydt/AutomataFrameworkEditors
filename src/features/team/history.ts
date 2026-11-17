// What the history sheet says about one saved change: when, in the person's language, and where. Pure, so a clock and
// a language are all it needs.
import type { ChangeLine } from '../game/game.ts'
import type { HistoryLine } from '../wire/wire.ts'
import { type Lang, nameOf, type Words } from '../words/words.ts'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "2 minutes ago", "3 hours ago", "yesterday", then the date: said in `lang` by the browser's own words for it. */
export function whenWords(at: number, now: number, lang: Lang): string {
  const ago = Math.max(0, now - at)
  const rel = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (ago < MINUTE) return rel.format(0, 'second')
  if (ago < HOUR) return rel.format(-Math.floor(ago / MINUTE), 'minute')
  if (ago < DAY) return rel.format(-Math.floor(ago / HOUR), 'hour')
  if (ago < 2 * DAY) return rel.format(-1, 'day')
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    year: ago > 300 * DAY ? 'numeric' : undefined,
  }).format(at)
}

/** Which levels, or the map, a saved change touched, in the person's words. */
export function whereWords(line: HistoryLine, words: Words['team']): string {
  const said = (row: Words['team'][keyof Words['team']]): string => (typeof row === 'function' ? row() : row)
  const parts = [...line.levels.map(nameOf), ...(line.map ? [said(words.historyMap)] : [])]
  return parts.length === 0 ? said(words.historyWhole) : parts.join(', ')
}

/** Where "Show me" goes: the first level it touched, else the map; undefined when it touched neither. */
export function openingOf(line: HistoryLine): { level: string } | { map: true } | undefined {
  const [first] = line.levels
  if (first !== undefined) return { level: first }
  return line.map ? { map: true } : undefined
}

/** Where a line of a change was made, for "Show me on the level": the level, and the thing when it is about one. */
export function whereOfLine(line: ChangeLine): { level: string; thing?: string } {
  return 'thing' in line ? { level: line.level, thing: line.thing } : { level: line.level }
}
