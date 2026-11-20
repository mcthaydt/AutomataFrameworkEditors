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

/** The change as a `Working` to look at and its lines; undefined when a file it holds does not read. */
export function changeAsWorking(game: OpenGame, change: WaitingChange): Checked | undefined {
  const base = startEdits(game).base
  const levels: Record<string, Level> = { ...base.levels }
  let world: WorldFile | undefined = base.world
  let project = base.project
  const projectChange = change.changes.find((file) => file.path === PROJECT)
  if (projectChange?.after !== undefined) project = projectChange.after
  const kinds = new Map([...listed(base.project), ...listed(project)])
  let other = 0

  for (const file of change.changes) {
    if (file.path === PROJECT) continue
    const kind = kinds.get(file.path)
    if (kind !== 'level' && kind !== 'world') {
      other += 1
      continue
    }
    if (file.after === undefined) {
      // Taken away: the level by the id it had, which is the one the game holds.
      const was = file.before === undefined ? undefined : parseContent(kind, file.before, file.path)
      if (was?.ok !== true) return undefined
      if (kind === 'level') delete levels[(was.value as Level).id]
      else world = undefined
      continue
    }
    const now = parseContent(kind, file.after, file.path)
    if (!now.ok) return undefined
    if (kind === 'level') levels[(now.value as Level).id] = now.value as Level
    else world = now.value as WorldFile
  }
  const working: Working = { levels, world, project }
  return { working, lines: describe(base, working), other }
}
