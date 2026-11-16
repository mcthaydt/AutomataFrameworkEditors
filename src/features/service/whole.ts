// "Does the whole game still load?" The API trusts nothing a page sends, so before a level goes onto the default
// branch (a Save by someone who may, an Approve by someone who may) it reads the game as it would then be and runs
// the framework's own loader over it. One level that is fine alone can still break the game: a thing whose character
// is not there, say.

import type { ContentRef } from '@automataframework/framework/headless'
import { formatDiagnostic, loadGame } from '@automataframework/framework/headless'
import { EDITORS_FILE, parseEditors } from '../files/files.ts'
import type { Repo } from '../github/github.ts'
import type { Answer } from '../wire/wire.ts'

/**
 * Reads every listed file from `branch` (a missing one is left out, so the loader names it), puts `replace` over them
 * (an `undefined` text removes a file), and loads the result. `broken`, with the loader's sentences, when it will not.
 */
export async function wholeGameLoads(
  repo: Repo,
  branch: string,
  project: { readonly path: string; readonly text: string },
  listed: readonly ContentRef[],
  replace: ReadonlyMap<string, string | undefined>,
): Promise<Answer<true>> {
  const files = new Map<string, string>([[project.path, project.text]])
  for (const ref of listed) {
    if (replace.has(ref.path)) continue
    const read = await repo.readFile(branch, ref.path)
    if (read.ok) files.set(ref.path, read.value.text)
    else if (read.problem !== 'not-found') return read
  }
  for (const [path, text] of replace) if (text !== undefined) files.set(path, text)
  const game = await loadGame(async (path) => {
    const found = files.get(path)
    if (found === undefined) throw new Error(`${path}: no such file`)
    return found
  })
  return game.ok
    ? { ok: true, value: true }
    : { ok: false, problem: 'broken', details: game.diagnostics.map(formatDiagnostic) }
}

/**
 * Whether the game asks the editors to refuse a change that leaves a problem in it: its `automata.editors.toml` on
 * `branch` says `problems = "stop"`. With no such file, or one that cannot be read, a problem is shown and never in the way.
 */
export async function stopsOnProblems(repo: Repo, branch: string): Promise<Answer<boolean>> {
  const read = await repo.readFile(branch, EDITORS_FILE)
  if (!read.ok) return read.problem === 'not-found' ? { ok: true, value: false } : read
  const settings = parseEditors(read.value.text)
  return { ok: true, value: settings.ok && settings.value.problems === 'stop' }
}
