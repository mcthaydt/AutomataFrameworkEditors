// What a change to a level means to the first run: a thing that moved, or a value of a thing that changed.
import type { Level } from '@automataframework/framework/headless'
import { same } from '../../lib/same.ts'

export function didWhat(was: Level | undefined, next: Level): readonly ('moved' | 'value')[] {
  const did: ('moved' | 'value')[] = []
  for (const thing of next.things) {
    const old = was?.things.find((one) => one.id === thing.id)
    if (old === undefined) continue
    if (old.x !== thing.x || old.y !== thing.y) did.push('moved')
    if (!same(old.values, thing.values)) did.push('value')
  }
  return [...new Set(did)]
}
