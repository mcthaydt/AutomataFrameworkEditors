import { expect, test } from 'vitest'
import { glassOn } from '#src/features/device/glass.ts'
import { ME_DEFAULT } from '#src/features/device/me.ts'

const fine = { blur: true, lessSeeThrough: false, moreContrast: false }

test('glass is on where the browser can blur and nothing asks for less', () => {
  expect(glassOn(ME_DEFAULT, fine)).toBe(true)
})

test('glass is off with no blur, with less see-through, with more contrast, or when it is set Off', () => {
  expect(glassOn(ME_DEFAULT, { ...fine, blur: false })).toBe(false)
  expect(glassOn(ME_DEFAULT, { ...fine, lessSeeThrough: true })).toBe(false)
  expect(glassOn(ME_DEFAULT, { ...fine, moreContrast: true })).toBe(false)
  expect(glassOn({ ...ME_DEFAULT, glass: 'off' }, fine)).toBe(false)
})

test('"On" beats less see-through, but never a missing blur or more contrast', () => {
  const on = { ...ME_DEFAULT, glass: 'on' as const }
  expect(glassOn(on, { ...fine, lessSeeThrough: true })).toBe(true)
  expect(glassOn(on, { ...fine, blur: false })).toBe(false)
  expect(glassOn(on, { ...fine, moreContrast: true })).toBe(false)
})
