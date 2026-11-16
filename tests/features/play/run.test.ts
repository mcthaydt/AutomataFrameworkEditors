import { loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { playLanguage } from '#src/features/play/play.ts'
import { fixtureFiles, readFrom } from '../../fixtures/game/read.ts'

/** The Crate Game with words in English and Spanish (English written first), or with none. */
async function game(words: boolean) {
  const files: Record<string, string> = words
    ? {
        ...fixtureFiles,
        'automata.toml': `${fixtureFiles['automata.toml']?.replace('format = 1\n', 'format = 1\nsource = "en"\n')}
[[content]]
type = "messages"
path = "content/messages/en.json"

[[content]]
type = "messages"
path = "content/messages/es.json"
`,
        'content/messages/en.json': '{"format":1,"id":"en","messages":{"game.name":"Crate Game"}}',
        'content/messages/es.json': '{"format":1,"id":"es","messages":{"game.name":"Juego de cajas"}}',
      }
    : fixtureFiles
  const loaded = await loadGame(readFrom(files))
  if (!loaded.ok) throw new Error(loaded.diagnostics.map((d) => d.message).join('; '))
  return loaded.value
}

test('a game plays in the editor language when the game has its words', async () => {
  expect(playLanguage(await game(true), 'es')).toBe('es')
})

test("a game without the editor's language plays in its own: French, Russian and German are the editor's alone", async () => {
  const spanish = await game(true)
  expect(playLanguage(spanish, 'pt')).toBe('en')
  expect(playLanguage(spanish, 'fr')).toBe('en')
})

test('a game with no words of its own has the six languages, and English for the rest', async () => {
  const bare = await game(false)
  expect(playLanguage(bare, 'ja')).toBe('ja')
  expect(playLanguage(bare, 'de')).toBe('en')
})
