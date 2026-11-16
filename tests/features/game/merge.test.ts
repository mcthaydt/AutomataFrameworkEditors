import { type Level, parseContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { startEdits, type Working } from '#src/features/game/changes.ts'
import { type Clash, keep, merge } from '#src/features/game/merge.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const base: Working = startEdits(await openedGame(linksFiles())).now

const room = (w: Working, id: string): Level => w.levels[id] as Level
const withLevel = (w: Working, id: string, fn: (level: Level) => Level): Working => ({
  ...w,
  levels: { ...w.levels, [id]: fn(room(w, id)) },
})
const thingIn = (w: Working, id: string, thing: string) => room(w, id).things.find((t) => t.id === thing)
const move = (w: Working, id: string, thing: string, x: number): Working =>
  withLevel(w, id, (level) => ({
    ...level,
    things: level.things.map((t) => (t.id === thing ? { ...t, x } : t)),
  }))
const without = (w: Working, id: string, thing: string): Working =>
  withLevel(w, id, (level) => ({ ...level, things: level.things.filter((t) => t.id !== thing) }))
const paint = (w: Working, id: string, x: number, y: number, letter: string): Working =>
  withLevel(w, id, (level) => ({
    ...level,
    tiles: level.tiles.map((row, i) => (i === y ? row.slice(0, x) + letter + row.slice(x + 1) : row)),
  }))
const clash = (merged: { clashes: readonly Clash[] }, what: Clash['what']): Clash => {
  const found = merged.clashes.find((c) => c.what === what)
  if (found === undefined) throw new Error(`no ${what} clash`)
  return found
}
const placedAt = (w: Working, id: string, x: number): Working => ({
  ...w,
  world: w.world && {
    ...w.world,
    levels: w.world.levels.map((l) => (l.level === id ? { ...l, at: { x, y: 0 } } : l)),
  },
})
const at = (w: Working, id: string) => w.world?.levels.find((l) => l.level === id)?.at

test('theirs the same as base gives mine, and mine the same as base gives theirs and no clash', () => {
  const mine = move(paint(base, 'room-1', 3, 2, '#'), 'room-1', 'crate-1', 7.5)
  expect(merge(base, mine, base)).toMatchObject({ now: mine, clashes: [] })
  const theirs = move(base, 'room-2', 'door-in', 3.5)
  const taken = merge(base, base, theirs)
  expect(taken.now).toEqual(theirs)
  expect(taken.clashes).toEqual([])
})

test('a thing only one of us moved goes where that one put it, even in the same level', () => {
  const merged = merge(base, move(base, 'room-1', 'crate-1', 7.5), move(base, 'room-1', 'plate-1', 9.5))
  expect(merged.clashes).toEqual([])
  expect(thingIn(merged.now, 'room-1', 'crate-1')?.x).toBe(7.5)
  expect(thingIn(merged.now, 'room-1', 'plate-1')?.x).toBe(9.5)
})

test('a thing moved to the same place by both is moved there, with no clash', () => {
  const merged = merge(base, move(base, 'room-1', 'crate-1', 7.5), move(base, 'room-1', 'crate-1', 7.5))
  expect(merged.clashes).toEqual([])
  expect(thingIn(merged.now, 'room-1', 'crate-1')?.x).toBe(7.5)
})

test('a thing moved two ways is a clash that holds theirs, and keep gives either, and either again', () => {
  const mine = move(base, 'room-1', 'crate-1', 7.5)
  const theirs = move(base, 'room-1', 'crate-1', 6.5)
  const merged = merge(base, mine, theirs)
  const one = clash(merged, 'thing')
  expect(merged.clashes).toHaveLength(1)
  expect(one).toMatchObject({ what: 'thing', level: 'room-1', thing: 'crate-1' })
  expect(thingIn(merged.now, 'room-1', 'crate-1')?.x).toBe(6.5)
  const mineKept = keep(merged, mine, one, 'mine')
  expect(thingIn(mineKept.now, 'room-1', 'crate-1')?.x).toBe(7.5)
  const back = keep(mineKept, mine, one, 'theirs')
  expect(back.now).toEqual(merged.now)
  expect(back.clashes).toEqual(merged.clashes)
})

test('a thing moved by me and taken away by them is a clash: "where I put it" or "stays deleted"', () => {
  const mine = move(base, 'room-1', 'crate-1', 7.5)
  const merged = merge(base, mine, without(base, 'room-1', 'crate-1'))
  const one = clash(merged, 'thing')
  expect(one).toMatchObject({ theirs: undefined, mine: { id: 'crate-1', x: 7.5 } })
  expect(thingIn(merged.now, 'room-1', 'crate-1')).toBeUndefined()
  expect(thingIn(keep(merged, mine, one, 'mine').now, 'room-1', 'crate-1')?.x).toBe(7.5)
  const flipped = keep(keep(merged, mine, one, 'mine'), mine, one, 'theirs')
  expect(thingIn(flipped.now, 'room-1', 'crate-1')).toBeUndefined()
})

test('a thing taken away by me and moved by them is a clash too, and a thing taken away by both is gone', () => {
  const gone = without(base, 'room-1', 'crate-1')
  const theirs = move(base, 'room-1', 'crate-1', 6.5)
  const merged = merge(base, gone, theirs)
  const one = clash(merged, 'thing')
  expect(thingIn(merged.now, 'room-1', 'crate-1')?.x).toBe(6.5)
  expect(thingIn(keep(merged, gone, one, 'mine').now, 'room-1', 'crate-1')).toBeUndefined()
  const both = merge(base, gone, without(base, 'room-1', 'crate-1'))
  expect(both.clashes).toEqual([])
  expect(thingIn(both.now, 'room-1', 'crate-1')).toBeUndefined()
})

test('a thing taken away by one of us and not touched by the other is taken away, with no clash', () => {
  const merged = merge(base, without(base, 'room-1', 'crate-1'), move(base, 'room-1', 'plate-1', 9.5))
  expect(merged.clashes).toEqual([])
  expect(thingIn(merged.now, 'room-1', 'crate-1')).toBeUndefined()
  expect(thingIn(merged.now, 'room-1', 'plate-1')?.x).toBe(9.5)
})

test('two new things with one id: mine takes the next free id, with no clash, and mine are last', () => {
  const made = (w: Working, x: number): Working =>
    withLevel(w, 'room-1', (level) => ({
      ...level,
      things: [...level.things, { id: 'crate-2', character: 'crate', x, y: 7.5 }],
    }))
  const merged = merge(base, made(base, 3.5), made(base, 4.5))
  expect(merged.clashes).toEqual([])
  const ids = room(merged.now, 'room-1').things.map((t) => t.id)
  expect(ids).toEqual(['crate-1', 'plate-1', 'gate-1', 'exit', 'crate-2', 'crate-3'])
  expect(thingIn(merged.now, 'room-1', 'crate-2')?.x).toBe(4.5)
  expect(thingIn(merged.now, 'room-1', 'crate-3')?.x).toBe(3.5)
})

test('two new things that are the same are one thing, and a new thing of mine goes last after theirs', () => {
  const add = (w: Working, id: string, x: number): Working =>
    withLevel(w, 'room-1', (level) => ({
      ...level,
      things: [...level.things, { id, character: 'crate', x, y: 7.5 }],
    }))
  const same = merge(base, add(base, 'crate-2', 3.5), add(base, 'crate-2', 3.5))
  expect(room(same.now, 'room-1').things.filter((t) => t.id === 'crate-2')).toHaveLength(1)
  const mixed = merge(base, add(base, 'crate-5', 3.5), add(base, 'crate-6', 4.5))
  expect(
    room(mixed.now, 'room-1')
      .things.slice(-2)
      .map((t) => t.id),
  ).toEqual(['crate-6', 'crate-5'])
})

test('the ground laid together tile by tile when we painted different tiles', () => {
  const mine = paint(base, 'room-1', 3, 2, '#')
  const theirs = paint(base, 'room-1', 10, 4, '#')
  const merged = merge(base, mine, theirs)
  expect(merged.clashes).toEqual([])
  const tiles = room(merged.now, 'room-1').tiles
  expect(tiles[2]?.[3]).toBe('#')
  expect(tiles[4]?.[10]).toBe('#')
})

test('two letters on one tile is one ground clash for the level, which holds theirs', () => {
  const mine = paint(paint(base, 'room-1', 3, 2, '#'), 'room-1', 5, 2, '#')
  const theirs = paint(base, 'room-1', 3, 2, '@')
  const merged = merge(base, mine, theirs)
  expect(merged.clashes).toEqual([{ what: 'ground', level: 'room-1' }])
  expect(room(merged.now, 'room-1').tiles).toEqual(room(theirs, 'room-1').tiles)
  const one = clash(merged, 'ground')
  expect(room(keep(merged, mine, one, 'mine').now, 'room-1').tiles).toEqual(room(mine, 'room-1').tiles)
})

test('a size changed by either of us, with the other painting, is one ground clash', () => {
  const taller = withLevel(base, 'room-1', (level) => ({
    ...level,
    tiles: [...level.tiles, level.tiles[8] ?? ''],
  }))
  const merged = merge(base, taller, paint(base, 'room-1', 3, 2, '#'))
  expect(merged.clashes).toEqual([{ what: 'ground', level: 'room-1' }])
  expect(room(merged.now, 'room-1').tiles).toHaveLength(9)
  const alone = merge(base, taller, base)
  expect(alone.clashes).toEqual([])
  expect(room(alone.now, 'room-1').tiles).toHaveLength(10)
})

test('the starts, and the look with the joints, are a piece each', () => {
  const startAt = (x: number) => [{ player: 1, x, y: 7.5 }]
  const mine = withLevel(base, 'room-1', (level) => ({ ...level, starts: startAt(5.5), sky: '#112233' }))
  const theirs = withLevel(base, 'room-1', (level) => ({ ...level, starts: startAt(6.5), sky: '#445566' }))
  const merged = merge(base, mine, theirs)
  expect(merged.clashes.map((c) => c.what)).toEqual(['starts', 'look'])
  expect(room(merged.now, 'room-1').sky).toBe('#445566')
  const keptStarts = keep(merged, mine, clash(merged, 'starts'), 'mine')
  expect(room(keptStarts.now, 'room-1').starts).toEqual(room(mine, 'room-1').starts)
  expect(room(keptStarts.now, 'room-1').sky).toBe('#445566')
  const keptLook = keep(keptStarts, mine, clash(merged, 'look'), 'mine')
  expect(room(keptLook.now, 'room-1').sky).toBe('#112233')
  expect(keep(keptLook, mine, clash(merged, 'look'), 'theirs').now).toEqual(keptStarts.now)
})

test('a look only one of us changed is that look, with no clash', () => {
  const mine = withLevel(base, 'room-1', (level) => ({ ...level, sky: '#112233' }))
  const merged = merge(base, mine, move(base, 'room-1', 'crate-1', 7.5))
  expect(merged.clashes).toEqual([])
  expect(room(merged.now, 'room-1').sky).toBe('#112233')
  expect(thingIn(merged.now, 'room-1', 'crate-1')?.x).toBe(7.5)
})

test("each level's place on the map is a piece: both can move different levels, one clash when both move one", () => {
  const merged = merge(base, placedAt(base, 'room-1', 4), placedAt(base, 'room-2', 30))
  expect(merged.clashes).toEqual([])
  expect(at(merged.now, 'room-1')?.x).toBe(4)
  expect(at(merged.now, 'room-2')?.x).toBe(30)
  const mine = placedAt(base, 'room-1', 4)
  const theirs = placedAt(base, 'room-1', 8)
  const both = merge(base, mine, theirs)
  const one = clash(both, 'place')
  expect(one).toMatchObject({ level: 'room-1', mine: { x: 4 }, theirs: { x: 8 } })
  expect(at(both.now, 'room-1')?.x).toBe(8)
  expect(at(keep(both, mine, one, 'mine').now, 'room-1')?.x).toBe(4)
})

test('a level one of us took away and the other changed is a level clash; unchanged, it is just gone', () => {
  const { 'room-3': _gone, ...rest } = base.levels
  const gone: Working = { ...base, levels: rest }
  const changed = move(base, 'room-3', 'goal-1', 5.5)
  const mineGone = merge(base, gone, changed)
  const one = clash(mineGone, 'level')
  expect(one).toEqual({ what: 'level', level: 'room-3', gone: 'mine' })
  expect(mineGone.now.levels['room-3']).toBeDefined()
  expect(keep(mineGone, gone, one, 'mine').now.levels['room-3']).toBeUndefined()
  const flipped = keep(keep(mineGone, gone, one, 'mine'), gone, one, 'theirs')
  expect(flipped.now.levels['room-3']).toEqual(changed.levels['room-3'])

  const theirsGone = merge(base, changed, gone)
  const two = clash(theirsGone, 'level')
  expect(two).toEqual({ what: 'level', level: 'room-3', gone: 'theirs' })
  expect(theirsGone.now.levels['room-3']).toBeUndefined()
  expect(keep(theirsGone, changed, two, 'mine').now.levels['room-3']).toEqual(changed.levels['room-3'])

  const plain = merge(base, gone, move(base, 'room-1', 'crate-1', 7.5))
  expect(plain.clashes).toEqual([])
  expect(plain.now.levels['room-3']).toBeUndefined()
  expect(merge(base, gone, gone).clashes).toEqual([])
})

test('a level taken away takes its place on the map with it, and a level given back gets its place back', () => {
  const { 'room-3': _gone, ...rest } = base.levels
  const onMap = base.world?.levels.filter((l) => l.level !== 'room-3') ?? []
  const gone: Working = { ...base, levels: rest, world: base.world && { ...base.world, levels: onMap } }
  const changed = move(base, 'room-3', 'goal-1', 5.5)
  const merged = merge(base, gone, changed)
  expect(at(merged.now, 'room-3')).toBeUndefined()
  const given = keep(merged, gone, clash(merged, 'level'), 'theirs')
  expect(given.now.levels['room-3']).toBeDefined()
  expect(at(given.now, 'room-3')).toEqual(at(base, 'room-3'))
  const out = merge(base, changed, gone)
  expect(at(out.now, 'room-3')).toBeUndefined()
  expect(at(keep(out, changed, clash(out, 'level'), 'mine').now, 'room-3')).toEqual(at(base, 'room-3'))
})

test('two levels made with one name are a twin clash that holds theirs', () => {
  const made = (w: Working, x: number): Working => ({
    ...w,
    levels: {
      ...w.levels,
      'room-4': { ...room(w, 'room-2'), id: 'room-4', starts: [{ player: 1, x, y: 7.5 }] },
    },
  })
  const mine = made(base, 2.5)
  const merged = merge(base, mine, made(base, 3.5))
  const one = clash(merged, 'twin')
  expect(one).toEqual({ what: 'twin', level: 'room-4' })
  expect(room(merged.now, 'room-4').starts[0]?.x).toBe(3.5)
  expect(room(keep(merged, mine, one, 'mine').now, 'room-4').starts[0]?.x).toBe(2.5)
  expect(merge(base, mine, made(base, 2.5)).clashes).toEqual([])
})

test('my new level and their new level are both in the game, and the project lists both', () => {
  const made = (w: Working, id: string): Working => ({
    ...w,
    levels: { ...w.levels, [id]: { ...room(w, 'room-2'), id } },
  })
  const merged = merge(base, made(base, 'room-4'), made(base, 'room-5'))
  expect(merged.clashes).toEqual([])
  expect(Object.keys(merged.now.levels)).toEqual(['room-1', 'room-2', 'room-3', 'room-5', 'room-4'])
  expect(merged.now.project).toContain('content/levels/room-4.json')
  expect(merged.now.project).not.toBe(base.project)
  const listed = merge(base, base, made(base, 'room-5')).now.project
  const theirsListed = { ...made(base, 'room-5'), project: listed }
  expect(merge(base, made(base, 'room-4'), theirsListed).now.project).toContain('content/levels/room-5.json')
  expect(merge(base, made(base, 'room-4'), theirsListed).now.project).toContain('content/levels/room-4.json')
})

test('my level taken away is taken out of the project, and a level I did not touch is left in it', () => {
  const { 'room-3': _gone, ...rest } = base.levels
  const merged = merge(base, { ...base, levels: rest }, move(base, 'room-1', 'crate-1', 7.5))
  expect(merged.now.project).not.toContain('content/levels/room-3.json')
  expect(merged.now.project).toContain('content/levels/room-2.json')
  expect(base.project).toContain('content/levels/room-3.json')
})

test('every merged level is a level the framework reads', () => {
  const mine = move(paint(base, 'room-1', 3, 2, '#'), 'room-1', 'crate-1', 7.5)
  const theirs = move(paint(base, 'room-1', 10, 4, '#'), 'room-1', 'plate-1', 9.5)
  const merged = merge(base, mine, theirs)
  for (const [id, level] of Object.entries(merged.now.levels)) {
    const read = parseContent('level', JSON.stringify(level), `content/levels/${id}.json`)
    expect(read.ok).toBe(true)
  }
})

test('theirs lists what came in that I never touched, and is shorter after I keep mine', () => {
  const mine = move(base, 'room-1', 'crate-1', 7.5)
  const merged = merge(base, mine, move(base, 'room-2', 'door-in', 3.5))
  expect(merged.theirs).toEqual([{ kind: 'moved', level: 'room-2', thing: 'door-in' }])
  const clashed = merge(base, mine, move(base, 'room-1', 'crate-1', 6.5))
  expect(clashed.theirs).toEqual([{ kind: 'moved', level: 'room-1', thing: 'crate-1' }])
  expect(keep(clashed, mine, clash(clashed, 'thing'), 'mine').theirs).toEqual([])
})

test("the project text is the game's own when nobody made or took away a level", () => {
  const merged = merge(base, move(base, 'room-1', 'crate-1', 7.5), move(base, 'room-2', 'door-in', 3.5))
  expect(merged.now.project).toBe(base.project)
})
