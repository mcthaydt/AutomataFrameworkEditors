// What the pure edits of a level need to know of the game: its characters, by id.
import type { Character } from '@automataframework/framework/headless'

export type Characters = Readonly<Record<string, Character>>
