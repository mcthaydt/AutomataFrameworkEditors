// What the game says for a message, in the game's own language: the words a thing's "words" value stands for.
import type { GameContent } from '@automataframework/framework/headless'

export function sayFor(content: GameContent, message: string): string | undefined {
  const source = content.project.source
  return source === undefined ? undefined : content.messages?.[source]?.messages[message]
}
