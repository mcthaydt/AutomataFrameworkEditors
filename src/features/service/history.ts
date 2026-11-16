// What changed: the newest changes to a game's content, ten to a page and five pages at most. A page costs eleven calls
// to GitHub and never more: one list of the newest fifty, and one look at each of the ten rows' files.
import type { Answer, GameRef, HistoryLine, HistoryPage } from '../wire/wire.ts'
import { type ApiDeps, enter } from './enter.ts'

const PAGE = 10
const PAGES = 5
const LEVEL = /^content\/levels\/([^/]+)\.json$/
const WORLD = /^content\/worlds\/[^/]+\.json$/

/** The first line of what a person said a change was. */
const firstLine = (message: string): string => message.split(/\r?\n/)[0]?.trim() ?? ''

export async function showHistory(
  deps: ApiDeps,
  request: Request,
  game: GameRef,
  page: string | null,
): Promise<Answer<HistoryPage>> {
  if (page === null || !/^[0-4]$/.test(page)) return { ok: false, problem: 'bad-request' }
  const number = Number(page)
  const entered = await enter(deps, request, game, 'look', { visitors: true })
  if (!entered.ok) return entered
  const { repo } = entered.value

  const rows = await repo.history(repo.facts.branch, 'content', PAGE * PAGES)
  if (!rows.ok) return rows
  const shown = rows.value.slice(number * PAGE, (number + 1) * PAGE)
  const lines: HistoryLine[] = []
  for (const row of shown) {
    const paths = await repo.commitPaths(row.commit)
    if (!paths.ok) return paths
    const levels = paths.value.flatMap((path) => LEVEL.exec(path)?.[1] ?? [])
    lines.push({
      commit: row.commit,
      by: row.by,
      at: row.at,
      words: firstLine(row.message),
      levels: [...new Set(levels)],
      map: paths.value.some((path) => WORLD.test(path)),
    })
  }
  return { ok: true, value: { lines, more: rows.value.length > (number + 1) * PAGE } }
}
