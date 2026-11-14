import { expect, test } from 'vitest'
import { ICONS } from '#src/features/ui/icons.ts'

test('every icon is a Phosphor regular file that fills with the colour of its words', () => {
  for (const [name, svg] of Object.entries(ICONS)) {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), name).toBe(true)
    expect(svg, name).toContain('fill="currentColor"')
  }
})
