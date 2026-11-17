// The small tags that sit beside things: a value that matters to a person looking at the level (a way into another
// level, a number, a changed switch), faint until its thing is picked. This works out which values are tagged; the words
// that say each one are the screen's.
import {
  type Level,
  type LevelThing,
  shownOf,
  type ThingValue,
  type ValueDeclaration,
} from '@automataframework/framework/headless'
import type { Characters } from './edit.ts'
import { rowsOf } from './values.ts'

export interface TagFact {
  readonly thing: LevelThing
  readonly declaration: ValueDeclaration
  readonly value: ThingValue
}

const isDefault = (declaration: ValueDeclaration, value: ThingValue): boolean =>
  declaration.type === 'switch' && value === declaration.default

/** Every value to tag, in the order of the level's things and then each character's values. */
export function tagFacts(level: Level, characters: Characters): readonly TagFact[] {
  const facts: TagFact[] = []
  for (const thing of level.things) {
    for (const row of rowsOf(thing, characters[thing.character])) {
      const { declaration, value } = row
      if (declaration === undefined || value === undefined || shownOf(declaration) !== 'tag') continue
      if (declaration.type === 'words' && value === '') continue
      if (isDefault(declaration, value)) continue
      facts.push({ thing, declaration, value })
    }
  }
  return facts
}
