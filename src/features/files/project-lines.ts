// Changes the lines of a game's project file (`automata.toml`) that a level or a world file needs, and no others. The
// file is read and written as lines of text, never parsed and written back, so a comment, a blank line or the order of
// the keys stays exactly as the person or an agent left it. The framework's `parseProject` is the check at the end: a
// result that does not read as a project file is `undefined`, never written.
import { parseProject } from '@automataframework/framework/headless'

export interface ProjectChange {
  /** Level and world files to list. A path already listed is left alone. */
  readonly add?: readonly { readonly type: 'level' | 'world'; readonly path: string }[]
  /** Paths to take out of the list. */
  readonly remove?: readonly string[]
  /** Level ids to rename where `start` or `levels` name them. */
  readonly rename?: Readonly<Record<string, string>>
}

const HEADER = '[[content]]'
const START = /^(\s*start\s*=\s*)"([^"]*)"(.*)$/
const LEVELS = /^(\s*levels\s*=\s*)\[([^\]]*)\](.*)$/
const LEVELS_OPENED = /^\s*levels\s*=\s*\[/
const QUOTED = /"([^"]*)"/g
const TYPE = /^\s*type\s*=\s*"([^"]*)"/
const PATH = /^\s*path\s*=\s*"([^"]*)"/

/** A level's id is its file's name without `.json`. */
const idOf = (path: string): string => (path.split('/').pop() ?? '').replace(/\.json$/, '')

interface Block {
  /** The first line (the header) and one past the last line of the block. */
  readonly from: number
  readonly to: number
  readonly type: string
  readonly path: string
}

/** The `[[content]]` blocks: a header and the lines that follow it up to a blank line or the next table. */
function blocks(lines: readonly string[]): Block[] {
  const found: Block[] = []
  lines.forEach((line, from) => {
    if (line.trim() !== HEADER) return
    let to = from + 1
    while (to < lines.length) {
      const next = (lines[to] ?? '').trim()
      if (next === '' || next.startsWith('[')) break
      to++
    }
    const body = lines.slice(from + 1, to)
    found.push({
      from,
      to,
      type: body.map((l) => TYPE.exec(l)?.[1]).find((t) => t !== undefined) ?? '',
      path: body.map((l) => PATH.exec(l)?.[1]).find((p) => p !== undefined) ?? '',
    })
  })
  return found
}

/** The index of the first table header: the lines before it are the file's own keys. */
function keysEnd(lines: readonly string[]): number {
  const at = lines.findIndex((l) => l.trim().startsWith('['))
  return at === -1 ? lines.length : at
}

/** The same text with only those lines changed; undefined when the result would not read as a project file. */
export function changeProject(text: string, change: ProjectChange): string | undefined {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  const renames = change.rename ?? {}

  const find = (pattern: RegExp): number => lines.slice(0, keysEnd(lines)).findIndex((l) => pattern.test(l))

  // Renames: `start`, and the ids inside `levels`.
  const startAt = find(START)
  if (startAt !== -1) {
    const match = START.exec(lines[startAt] ?? '')
    const renamed = renames[match?.[2] ?? '']
    if (match !== null && renamed !== undefined) lines[startAt] = `${match[1]}"${renamed}"${match[3]}`
  }

  const levelsAt = find(LEVELS_OPENED)
  let ids: string[] | undefined
  let original = ''
  let tail = ''
  let head = ''
  if (levelsAt !== -1) {
    const match = LEVELS.exec(lines[levelsAt] ?? '')
    // A list that runs over several lines is not one this knows how to change.
    if (match === null) return undefined
    head = match[1] ?? ''
    tail = match[3] ?? ''
    const listed = [...(match[2] ?? '').matchAll(QUOTED)].map((m) => m[1] ?? '')
    original = listed.join('\n')
    ids = listed.map((id) => renames[id] ?? id)
  }

  // Removals: exactly the block and one blank line, and the level's id from `levels`.
  for (const path of change.remove ?? []) {
    const block = blocks(lines).find((b) => b.path === path)
    if (block === undefined) continue
    if (block.type === 'level') {
      const id = idOf(path)
      const start = START.exec(lines[find(START)] ?? '')?.[2]
      if (start === id) return undefined
      if (ids !== undefined) ids = ids.filter((i) => i !== id)
    }
    const blankBefore = block.from > 0 && (lines[block.from - 1] ?? '').trim() === ''
    const blankAfter = block.to < lines.length && (lines[block.to] ?? '').trim() === ''
    if (blankBefore) lines.splice(block.from - 1, block.to - block.from + 1)
    else if (blankAfter) lines.splice(block.from, block.to - block.from + 1)
    else lines.splice(block.from, block.to - block.from)
  }

  // Additions: a block of three lines at the end, in the form the framework's template writes.
  for (const file of change.add ?? []) {
    if (blocks(lines).some((b) => b.path === file.path)) continue
    const last = lines.at(-1) === '' ? lines.length - 1 : lines.length
    lines.splice(last, 0, '', HEADER, `type = "${file.type}"`, `path = "${file.path}"`)
    const id = idOf(file.path)
    if (file.type === 'level' && ids !== undefined && !ids.includes(id)) ids.push(id)
  }

  // `levels`: written again only when its ids changed; gone when it would be empty (a game with none plays `start`).
  if (levelsAt !== -1 && ids !== undefined && ids.join('\n') !== original) {
    if (ids.length === 0) lines.splice(levelsAt, 1)
    else lines[levelsAt] = `${head}[${ids.map((i) => `"${i}"`).join(', ')}]${tail}`
  }

  const result = lines.join(eol)
  return parseProject(result).ok ? result : undefined
}
