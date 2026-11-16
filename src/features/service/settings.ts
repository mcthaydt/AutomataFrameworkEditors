// The editors' settings for everyone on a game: `automata.editors.toml` on the default branch. Everyone who opens the
// game gets them (see `open`); only an Owner changes them, and the change is one commit straight onto the default branch.
import { checkEditors, EDITORS_FILE, type EditorsFile, parseEditors, writeEditors } from '../files/files.ts'
import type { Answer } from '../wire/wire.ts'
import { readBody, readGame } from './body.ts'
import { type ApiDeps, enter } from './enter.ts'

const MESSAGE = 'Change how the editors work for this game'

export async function writeSettings(deps: ApiDeps, request: Request): Promise<Answer<EditorsFile>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const game = readGame(body.value.game)
  const wanted = checkEditors(body.value.editors)
  const { version } = body.value
  if (
    game === undefined ||
    wanted === undefined ||
    (version !== undefined && version !== null && typeof version !== 'string')
  ) {
    return { ok: false, problem: 'bad-request' }
  }

  const entered = await enter(deps, request, game, 'share')
  if (!entered.ok) return entered
  const { repo, who } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }

  const text = writeEditors(wanted)
  const now = await repo.readFile(repo.facts.branch, EDITORS_FILE)
  if (!now.ok && now.problem !== 'not-found') return now
  // The same settings again write nothing.
  if (now.ok) {
    const read = parseEditors(now.value.text)
    if (read.ok && writeEditors(read.value) === text) return { ok: true, value: wanted }
  }
  const saved = await repo.saveFile({
    branch: repo.facts.branch,
    path: EDITORS_FILE,
    text,
    version: typeof version === 'string' ? version : undefined,
    message: MESSAGE,
    author: { name: who.login, email: `${who.id}+${who.login}@users.noreply.github.com` },
  })
  return saved.ok ? { ok: true, value: wanted } : saved
}
