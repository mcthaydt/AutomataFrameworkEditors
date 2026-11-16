import { expect, test } from 'vitest'
import { editorItems, gameItems, noteFor, partItems } from '#src/features/shell/menus.ts'
import { EDITORS, TOOLS } from '#src/features/shell/shell.ts'
import { LANGUAGES, type Row, wordsIn } from '#src/features/words/words.ts'
import { WORLD } from '../../fixtures/shell.ts'

const bar = wordsIn('en').menus
const owner = { signedIn: true, level: 'owner', waiting: 0, levelName: 'level-1' } as const

test('a visitor is never shown who can change the game, and is offered sign-in, not sign-out', () => {
  const rows = gameItems({ ...owner, signedIn: false, level: 'look' }, bar)
  expect(rows.map((row) => row.id)).not.toContain('share')
  expect(rows.map((row) => row.id)).toContain('sign-in')
  expect(rows.map((row) => row.id)).not.toContain('sign-out')
})

test('an owner is shown who can change the game; someone who only suggests is not', () => {
  expect(gameItems(owner, bar).map((row) => row.words)).toContain('Who can change it')
  const suggest = gameItems({ ...owner, level: 'suggest' }, bar)
  expect(suggest.map((row) => row.id)).not.toContain('share')
})

test('waiting changes are a row only when some wait, and keeping a copy names the level', () => {
  expect(gameItems(owner, bar).map((row) => row.id)).not.toContain('waiting')
  const waiting = gameItems({ ...owner, waiting: 2 }, bar)
  expect(waiting.find((row) => row.id === 'waiting')?.words).toBe('2 changes are waiting')
  expect(gameItems(owner, bar).find((row) => row.id === 'keep')?.words).toBe('Keep a copy of Level 1')
})

test('no row of the game menu is a rule twice in a row or at an end', () => {
  for (const facts of [owner, { ...owner, signedIn: false, level: 'look' as const, levelName: undefined }]) {
    const rows = gameItems(facts, bar)
    expect(rows[0]?.kind).not.toBe('rule')
    expect(rows.at(-1)?.kind).not.toBe('rule')
    rows.forEach((row, i) => {
      if (row.kind === 'rule') expect(rows[i + 1]?.kind).not.toBe('rule')
    })
  }
})

test('the six editors are listed, World ticked, and only the ones not built have a note', () => {
  const rows = editorItems(bar, 'world')
  expect(rows.map((row) => row.words)).toEqual(['World', 'Characters', 'Feel', 'Sound', 'Story', 'Screens'])
  expect(rows.filter((row) => row.here).map((row) => row.id)).toEqual(['world'])
  expect(noteFor(bar, 'world')).toBeUndefined()
  expect(noteFor(bar, 'characters')).toBe(
    'Characters is not in this version yet. It will be where you decide who is in the game and how they move.',
  )
  for (const editor of EDITORS.filter((one) => !one.built)) expect(noteFor(bar, editor.id)).toBeDefined()
})

test('no row of the editors says what a person should not read, in any language', () => {
  const said = (row: Row): string => (typeof row === 'string' ? row : row('a', 'b', 'c'))
  const later = new RegExp(
    [
      '\\bsoon',
      'comes later',
      'próximamente',
      'bientôt',
      'demnächst',
      'скоро',
      '近日',
      '곧',
      'もうすぐ',
      '即将',
      'em breve',
    ].join('|'),
    'i',
  )
  for (const lang of LANGUAGES) {
    const { bar: top, menus, panels } = wordsIn(lang)
    for (const [name, row] of Object.entries({ ...top, ...menus, ...panels })) {
      expect(said(row as Row), `${name} in ${lang}`).not.toMatch(later)
    }
  }
})

test('the part menu holds the parts and every level; only an upright phone adds the editors and the game', () => {
  const game = owner
  const wide = partItems(
    { workspace: WORLD, part: 'levels', compact: false, levels: ['level-1', 'level-2'], level: 'level-2' },
    game,
    bar,
  )
  expect(wide.map((row) => row.words)).toEqual(['In World', 'Levels', 'All levels', 'Level 1', 'Level 2'])
  expect(wide.filter((row) => row.here).map((row) => row.id)).toEqual(['part:levels', 'level:level-2'])
  const phone = partItems(
    { workspace: WORLD, part: 'levels', compact: true, levels: ['level-1'], level: 'level-1' },
    game,
    bar,
  )
  const ids = phone.map((row) => row.id)
  expect(ids).toContain('editor:characters')
  expect(ids).toContain('game:sign-out')
  expect(ids).not.toContain('h-levels')
})

test('every workspace shares the same five tools, in the order the toolbar draws them', () => {
  expect(TOOLS).toEqual(['pick', 'place', 'paint', 'erase', 'join'])
  for (const tool of WORLD.tools) expect(TOOLS).toContain(tool)
})
