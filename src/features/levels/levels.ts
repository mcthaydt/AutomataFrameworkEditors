// The levels editor: a level on screen, and the edits of its things, ground and values as plain functions.

export type { Clip } from './clipboard.ts'
export { compareLevels, type ThingMove } from './compare.ts'
export { type Done, no, ok } from './done.ts'
export type { Characters } from './edit.ts'
export { default as LevelPart } from './LevelPart.svelte'
export { type MapBox, mapBoxes, placeOn, startOf } from './on-map.ts'
export type { Point, Size } from './place.ts'
export { default as Stage } from './Stage.svelte'
export { default as Tray } from './Tray.svelte'
export { nudgeThings } from './things.ts'
export { countsOf } from './tray.ts'
