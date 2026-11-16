// Which files a person's change may touch: the level and world files the game lists, and the ones the change itself adds
// (a level at content/levels/<id>.json, a world at content/worlds/<id>.json). Never anything else: not the sharing file,
// not the game's code, not a character. The page is never asked which files are fine.
import type { ContentRef } from '@automataframework/framework/headless'
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
