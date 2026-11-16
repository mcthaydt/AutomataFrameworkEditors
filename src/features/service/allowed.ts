// Which files a person's change may touch: the level and world files the game lists, and the ones the change itself adds
// (a level at content/levels/<id>.json, a world at content/worlds/<id>.json). Never anything else: not the sharing file,
// not the game's code, not a character. The page is never asked which files are fine.
import { type ContentRef, parseProject } from '@automataframework/framework/headless'
import type { ProjectChange } from '../files/files.ts'

export type EditableKind = 'level' | 'world'

const FOLDER: Readonly<Record<EditableKind, string>> = { level: 'content/levels', world: 'content/worlds' }
/** An id: lower-case words joined by dashes, starting with a letter, at most 64 characters (the framework's own). */
const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/** Whether `path` is where a new file of this kind goes. */
export function isNewPathFor(kind: EditableKind, path: string): boolean {
  const prefix = `${FOLDER[kind]}/`
  if (!path.startsWith(prefix) || !path.endsWith('.json')) return false
  const id = path.slice(prefix.length, -'.json'.length)
  return id.length <= 64 && ID.test(id)
}

/** Each file a change may touch, and what kind of file it is. */
export function allowedFiles(
  listed: readonly ContentRef[],
  project: ProjectChange | undefined,
): ReadonlyMap<string, EditableKind> {
  const files = new Map<string, EditableKind>()
  for (const ref of listed) if (ref.type === 'level' || ref.type === 'world') files.set(ref.path, ref.type)
  for (const add of project?.add ?? []) if (isNewPathFor(add.type, add.path)) files.set(add.path, add.type)
  return files
}

/** Which paths a person's change may touch. */
export function allowedPaths(
  listed: readonly ContentRef[],
  project: ProjectChange | undefined,
): ReadonlySet<string> {
  return new Set(allowedFiles(listed, project).keys())
}

/**
 * Whether a project file went from `before` to `after` by level lines only: the same name, hero and every other
 * setting, the same character, tuning and other listings, and only level and world files listed or taken out (a new
 * one in the place a new one goes), with `start` and `levels` free to follow them. That is all a change of levels
 * does to `automata.toml`, so it is the only change of that file the editor will look at or approve.
 */
export function levelLinesOnly(before: string, after: string): boolean {
  const a = parseProject(before)
  const b = parseProject(after)
  if (!a.ok || !b.ok) return false
  const rest = (project: object): string => {
    const fields = project as Record<string, unknown>
    const { content: _content, levels: _levels, start: _start, ...others } = fields
    return JSON.stringify(others)
  }
  if (rest(a.value) !== rest(b.value)) return false
  const others = (refs: readonly ContentRef[]): string[] =>
    refs.filter((r) => r.type !== 'level' && r.type !== 'world').map((r) => `${r.type}:${r.path}`)
  if (others(a.value.content).join('\n') !== others(b.value.content).join('\n')) return false
  const was = new Map(a.value.content.map((r) => [r.path, r.type]))
  return b.value.content.every((r) => {
    const type = was.get(r.path)
    if (type !== undefined) return type === r.type
    return (r.type === 'level' || r.type === 'world') && isNewPathFor(r.type, r.path)
  })
}
