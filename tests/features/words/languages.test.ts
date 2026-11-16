import { expect, test } from 'vitest'
import {
  bar,
  first,
  idOf,
  LANGUAGE_NAMES,
  LANGUAGES,
  levels,
  menus,
  nameOf,
  panels,
  READ_BY_A_SPEAKER,
  type Row,
  shell,
  wordsIn,
} from '#src/features/words/words.ts'
import { bannedInLanguage } from '../../fixtures/banned.ts'

const AREAS = { shell, first, bar, menus, panels, levels } as const

const MARKS = ['⟦0⟧', '⟦1⟧', '⟦2⟧'] as const
/** A row said with marks for its parts, so what it names can be compared across languages. */
const said = (row: Row): string => (typeof row === 'string' ? row : row(...MARKS))
const marksIn = (text: string): string[] => MARKS.filter((mark) => text.includes(mark))

test('there are nine languages, English first, each named in its own words', () => {
  expect(LANGUAGES).toEqual(['en', 'es', 'ko', 'ja', 'zh', 'pt', 'fr', 'ru', 'de'])
  expect(LANGUAGE_NAMES.ko.name).toBe('한국어')
  expect(LANGUAGE_NAMES.de.name).toBe('Deutsch')
  for (const lang of LANGUAGES) expect(LANGUAGE_NAMES[lang].flag, lang).toMatch(/^[a-z]{2}$/)
})

for (const [area, table] of Object.entries(AREAS)) {
  test(`every language has every row of English in ${area}, with the same parts`, () => {
    for (const lang of LANGUAGES) {
      expect(Object.keys(table[lang]).sort(), `${area} ${lang}`).toEqual(Object.keys(table.en).sort())
    }
    for (const [name, english] of Object.entries(table.en)) {
      for (const lang of LANGUAGES) {
        const row = (table[lang] as Record<string, Row>)[name] as Row
        expect(marksIn(said(row)), `${area}.${name} in ${lang}`).toEqual(marksIn(said(english)))
        expect(said(row).trim(), `${area}.${name} in ${lang}`).not.toBe('')
      }
    }
  })

  test(`no row in ${area} says what a person never reads, in any language`, () => {
    for (const lang of LANGUAGES) {
      for (const [name, row] of Object.entries(table[lang] as Record<string, Row>)) {
        expect(bannedInLanguage(said(row), lang), `${area}.${name} in ${lang}`).toEqual([])
      }
    }
  })
}

test('wordsIn gives a language its own rows, and the rest of English where one is missing', () => {
  expect(wordsIn('en').shell.undo).toBe('Undo')
  expect(wordsIn('ru').shell.undo).not.toBe(wordsIn('en').shell.undo)
  expect(wordsIn('ja').first.languageTitle).toBe(first.ja.languageTitle)
})

test('a level or a thing is named from its id, and an id is made back from a name', () => {
  expect(nameOf('level-12')).toBe('Level 12')
  expect(nameOf('level-1')).toBe('Level 1')
  expect(nameOf('crate-2')).toBe('Crate 2')
  expect(nameOf('big-box')).toBe('Big box')
  expect(idOf('Big box')).toBe('big-box')
  expect(idOf('Level 12')).toBe('level-12')
  expect(idOf('  Crate   2 ')).toBe('crate-2')
  expect(idOf('!!')).toBeUndefined()
  expect(idOf('')).toBeUndefined()
})

test('every language says which of its rows a native speaker has read, and none has yet', () => {
  expect(Object.keys(READ_BY_A_SPEAKER).sort()).toEqual([...LANGUAGES].sort())
  for (const lang of LANGUAGES) expect(READ_BY_A_SPEAKER[lang]).toEqual([])
})
