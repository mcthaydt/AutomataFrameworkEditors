import { expect, test } from 'vitest'
import { EDITORS_DEFAULT, EDITORS_FILE, parseEditors, writeEditors } from '#src/features/files/files.ts'

const why = (text: string): string => {
  const parsed = parseEditors(text)
  if (parsed.ok) throw new Error('expected a refusal')
  return parsed.why
}

test('no file is the default: problems are warned about', () => {
  expect(EDITORS_FILE).toBe('automata.editors.toml')
  expect(parseEditors(undefined)).toEqual({ ok: true, value: EDITORS_DEFAULT })
  expect(EDITORS_DEFAULT).toEqual({ format: 1, problems: 'warn' })
})

test('writing then reading gives the same value, for both choices', () => {
  for (const problems of ['warn', 'stop'] as const) {
    const text = writeEditors({ format: 1, problems })
    expect(parseEditors(text)).toEqual({ ok: true, value: { format: 1, problems } })
  }
  expect(writeEditors(EDITORS_DEFAULT)).toBe('format = 1\nproblems = "warn"\n')
})

test('an unknown key, a wrong choice or a damaged file is one plain sentence', () => {
  expect(why('format = 1\nproblems = "warn"\nstrict = true\n')).toBe(
    `${EDITORS_FILE} doesn't use strict. Take it out.`,
  )
  expect(why('format = 1\nproblems = "maybe"\n')).toBe(
    `In ${EDITORS_FILE}, write problems = "warn" or problems = "stop".`,
  )
  expect(why('format = 2\nproblems = "warn"\n')).toContain('must start with format = 1')
  expect(why('format = 1\nproblems = ')).toContain("can't be read")
})
