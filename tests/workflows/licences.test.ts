// The fonts and icons the editors serve each come with a licence that asks for its notice to travel with them.
// `public/licences.txt` is served beside the page. Move a package's version, copy its LICENSE there again.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const notices = readFileSync(join(ROOT, 'public/licences.txt'), 'utf8')
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  devDependencies: Record<string, string>
}

const PACKAGES = [
  '@fontsource-variable/fraunces',
  '@fontsource-variable/onest',
  '@fontsource/jetbrains-mono',
  '@phosphor-icons/core',
]

test.each(PACKAGES)("the notices are %s's own", (name) => {
  const licence = readFileSync(join(ROOT, 'node_modules', name, 'LICENSE'), 'utf8').trim()
  expect(notices).toContain(licence)
  expect(notices).toContain(`${name} ${manifest.devDependencies[name]}`)
})
