// A waiting change as something to look at and play: the game as it is, with the change's files laid over it. Pure: it
// reads what the API sent and writes nothing. A file that is not a level, the map or the project file is counted, never
// shown, because this editor shows and plays levels.
import { type Level, parseContent, parseProject, type WorldFile } from '@automataframework/framework/headless'
import { type ChangeLine, describe, type OpenGame, startEdits, type Working } from '../game/game.ts'
import type { WaitingChange } from '../wire/wire.ts'

export interface Checked {
  readonly working: Working
  readonly lines: readonly ChangeLine[]
  /** How many files changed that are not shown here (a character, a picture's settings, and so on). */
  readonly other: number
}

const PROJECT = 'automata.toml'

/** What the project file lists by path, as a kind. */
function listed(text: string): ReadonlyMap<string, string> {
  const parsed = parseProject(text)
  return new Map((parsed.ok ? parsed.value.content : []).map((ref) => [ref.path, ref.type] as const))
}

/** The game with one side of the change's files laid over it; undefined when a file it holds does not read. */
function laid(
  base: Working,
  change: WaitingChange,
  side: 'before' | 'after',
): { readonly working: Working; readonly other: number } | undefined {
  const levels: Record<string, Level> = { ...base.levels }
  let world: WorldFile | undefined = base.world
  let project = base.project
  const projectChange = change.changes.find((file) => file.path === PROJECT)
  if (projectChange !== undefined && projectChange[side] !== undefined) project = projectChange[side]
  const kinds = new Map([
    ...listed(base.project),
    ...change.changes
      .flatMap((file) => (file.path === PROJECT ? [file.before, file.after] : []))
      .flatMap((text) => (text === undefined ? [] : [...listed(text)])),
  ])
  let other = 0

  for (const file of change.changes) {
    if (file.path === PROJECT) continue
    const kind = kinds.get(file.path)
    if (kind !== 'level' && kind !== 'world') {
      other += 1
      continue
    }
    const text = file[side]
    if (text === undefined) {
      // Not there on this side: the level by the id it has on the other side, which the game may hold.
      const away = side === 'after' ? file.before : file.after
      const was = away === undefined ? undefined : parseContent(kind, away, file.path)
      if (was?.ok !== true) return undefined
      if (kind === 'level') delete levels[(was.value as Level).id]
      else world = undefined
      continue
    }
    const now = parseContent(kind, text, file.path)
    if (!now.ok) return undefined
    if (kind === 'level') levels[(now.value as Level).id] = now.value as Level
    else world = now.value as WorldFile
  }
  return { working: { levels, world, project }, other }
}

/**
 * The change as a `Working` to look at and its lines; undefined when a file it holds does not read. The lines compare the
 * change with the files it was made from, not with the game as this person opened it: the author's own game is read
 * from their waiting change, so it already holds it.
 */
export function changeAsWorking(game: OpenGame, change: WaitingChange): Checked | undefined {
  const base = startEdits(game).base
  const after = laid(base, change, 'after')
  const before = laid(base, change, 'before')
  if (after === undefined || before === undefined) return undefined
  return { working: after.working, lines: describe(before.working, after.working), other: after.other }
}
