// The links game's files and one big change to them, as a person's Put sends it: a level changed, a new level, the world
// file, and the project file's line for the new level. Several test files make their waiting changes from it.
import { PROJECT_FILE } from '@automataframework/framework/headless'
import type { PutAsk } from '#src/features/wire/wire.ts'
import { blobSha } from './fake-github/repos.ts'
import { linksFiles } from './links-game/links.ts'

export const GAME = { owner: 'grandma', name: 'links-game' }
export const FILES = linksFiles()
export const text = (path: string): string => FILES[path] ?? ''
export const data = (path: string): Record<string, any> => JSON.parse(text(path))
export const ROOM_3 = 'content/levels/room-3.json'
export const ROOM_4 = 'content/levels/room-4.json'
export const WORLD = 'content/worlds/world.json'
export const version = (path: string): string => blobSha(text(path))

const goal = data(ROOM_3).things[0]
export const room3 = { ...data(ROOM_3), things: [{ ...goal, x: 12.5 }, data(ROOM_3).things[1]] }
export const room4 = { ...data(ROOM_3), id: 'room-4' }
const placed = { level: 'room-4', at: { x: 100, y: 0 } }
export const world = { ...data(WORLD), levels: [...data(WORLD).levels, placed] }
export const PROJECT_CHANGE = { add: [{ type: 'level' as const, path: ROOM_4 }] }

/** A level, a new level, the world file and the project file's line for the new level, in one ask. */
export const ask = (over: Partial<PutAsk> = {}): PutAsk => ({
  game: GAME,
  files: [
    { path: ROOM_3, value: room3, version: version(ROOM_3) },
    { path: ROOM_4, value: room4, version: undefined },
    { path: WORLD, value: world, version: version(WORLD) },
  ],
  project: PROJECT_CHANGE,
  projectVersion: version(PROJECT_FILE),
  message: 'A fourth room',
  ...over,
})
/** Only these files, and no change to the project file. */
export const only = (files: PutAsk['files']): PutAsk => ask({ files, project: undefined })
export const room3As = (value: unknown) => ({ path: ROOM_3, value, version: version(ROOM_3) })
