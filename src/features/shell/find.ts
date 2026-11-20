// One box that finds anything: a thing, a level, a setting or something to do. Pure: it is given what the person holds and
// gives back what matches, the open level's things first, and says where each goes in `go`.
import type { GameContent } from '@automataframework/framework/headless'
import type { Working } from '../game/game.ts'
import { nameOf, type Row, type Words } from '../words/words.ts'
import type { Key } from './keys.ts'

export interface Found {
  readonly kind: 'thing' | 'level' | 'value' | 'command' | 'file'
  /** What the person reads. */
  readonly words: string
  /** The few words under it that say what it is and where. */
  readonly hint: string
  /** The key that does it, when it has one. */
  readonly key?: string
  /** Where pressing it goes: see `parseGo`. */
  readonly go: string
}

export type Go =
  | { readonly kind: 'thing'; readonly level: string; readonly thing: string }
  | { readonly kind: 'level'; readonly level: string }
  | { readonly kind: 'map' }
  | { readonly kind: 'command'; readonly id: string }

/** What a `go` says, or undefined for one that says nothing. */
export function parseGo(go: string): Go | undefined {
  const [kind, first, second] = go.split(':')
  if (kind === 'map') return { kind }
  if (kind === 'level' && first !== undefined) return { kind, level: first }
  if (kind === 'thing' && first !== undefined && second !== undefined)
    return { kind, level: first, thing: second }
  if (kind === 'command' && first !== undefined)
    return { kind, id: [first, second].filter(Boolean).join(':') }
  return undefined
}

const MOST = 20
const say = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row

/** The things to do, by the key's id and the words for them. */
const DOINGS = [
  'undo',
  'redo',
  'play',
  'help',
  'tool:pick',
  'tool:paint',
  'tool:erase',
  'tool:join',
  'duplicate',
] as const
const DOING_WORDS = {
  undo: 'doUndo',
  redo: 'doRedo',
  play: 'doPlay',
  help: 'doHelp',
  'tool:pick': 'doPick',
  'tool:paint': 'doPaint',
  'tool:erase': 'doErase',
  'tool:join': 'doJoin',
  duplicate: 'doDuplicate',
} as const

/**
 * What matches `query` (a part of a name, in any case), at most twenty: things in the open level, then things in other
 * levels, then settings of the open level's things, levels, and last what can be done.
 */
export function find(
  query: string,
  working: Working,
  content: GameContent,
  keys: readonly Key[],
  words: Words,
  open?: string,
): readonly Found[] {
  const asked = query.trim().toLowerCase()
  if (asked === '') return []
  const h = words.helper
  const matches = (...names: string[]): boolean => names.some((name) => name.toLowerCase().includes(asked))
  const keyOf = (id: string): string | undefined => keys.find((key) => key.id === id)?.key

  const things: Found[] = []
  const elsewhere: Found[] = []
  const settings: Found[] = []
  for (const [level, one] of Object.entries(working.levels)) {
    for (const thing of one.things) {
      const name = nameOf(thing.id)
      const here = level === open
      if (matches(name, thing.id)) {
        const found: Found = {
          kind: 'thing',
          words: name,
          hint: here ? say(h.findHere) : say(h.findIn, nameOf(level)),
          go: `thing:${level}:${thing.id}`,
        }
        ;(here ? things : elsewhere).push(found)
      }
      if (!here) continue
      for (const value of content.characters[thing.character]?.values ?? []) {
        if (!matches(value.name)) continue
        settings.push({
          kind: 'value',
          words: value.name,
          hint: say(h.findSetting, name),
          go: `thing:${level}:${thing.id}`,
        })
      }
    }
  }
  const levels: Found[] = Object.keys(working.levels)
    .filter((id) => matches(nameOf(id), id))
    .map((id) => ({ kind: 'level', words: nameOf(id), hint: say(h.findLevel), go: `level:${id}` }))

  const commands: Found[] = []
  for (const id of DOINGS) {
    const said = say(h[DOING_WORDS[id]])
    if (!matches(said)) continue
    const key = keyOf(id)
    commands.push({
      kind: 'command',
      words: said,
      hint: say(h.findDo),
      ...(key === undefined ? {} : { key }),
      go: `command:${id}`,
    })
  }
  const placeKey = keyOf('tool:place')
  for (const character of Object.keys(content.characters)) {
    const said = say(h.doPlace, nameOf(character))
    if (!matches(said)) continue
    commands.push({
      kind: 'command',
      words: said,
      hint: say(h.findDo),
      ...(placeKey === undefined ? {} : { key: placeKey }),
      go: `command:place:${character}`,
    })
  }
  return [...things, ...elsewhere, ...settings, ...levels, ...commands].slice(0, MOST)
}
