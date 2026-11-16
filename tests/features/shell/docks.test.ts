import { expect, test } from 'vitest'
import type { SizeClass } from '#src/features/device/device.ts'
import { type Docks, floating, layout } from '#src/features/shell/shell.ts'

type Device = 'ipad' | 'phone' | 'computer'
const docks = (list: Docks['list'], settings: Docks['settings']): Docks => ({ list, settings, hold: false })

// The design language's layouts, one row each: where the toolbar goes, what the list is, what the settings are.
// [device, size, list, settings, picked] -> [toolbar, list, settings]
type Row = [Device, SizeClass, Docks['list'], Docks['settings'], boolean, string, string, string]
const TABLE: readonly Row[] = [
  // An iPad sideways: the tools down the left edge, the list shut to a rail, the settings a panel or a tab.
  ['ipad', 'wide', 'closed', 'shown', false, 'left', 'rail', 'none'],
  ['ipad', 'wide', 'list', 'shown', false, 'left', 'beside', 'none'],
  ['ipad', 'wide', 'closed', 'shown', true, 'left', 'rail', 'side'],
  ['ipad', 'wide', 'closed', 'hidden', true, 'left', 'rail', 'tab'],
  ['ipad', 'wide', 'add', 'shown', true, 'left', 'beside', 'side'],
  ['ipad', 'wide', 'list', 'hidden', true, 'left', 'beside', 'tab'],
  // A computer: the tools along the bottom, the list open, the same settings.
  ['computer', 'wide', 'closed', 'shown', false, 'bottom', 'rail', 'none'],
  ['computer', 'wide', 'list', 'shown', false, 'bottom', 'beside', 'none'],
  ['computer', 'wide', 'list', 'shown', true, 'bottom', 'beside', 'side'],
  ['computer', 'wide', 'list', 'hidden', true, 'bottom', 'beside', 'tab'],
  ['computer', 'wide', 'closed', 'shown', true, 'bottom', 'rail', 'side'],
  ['computer', 'wide', 'closed', 'hidden', true, 'bottom', 'rail', 'tab'],
  // An iPad upright: the list opens over the level, the settings are a bar that pulls up into a sheet.
  ['ipad', 'tablet-upright', 'closed', 'hidden', false, 'bottom', 'hidden', 'none'],
  ['ipad', 'tablet-upright', 'list', 'hidden', false, 'bottom', 'over', 'none'],
  ['ipad', 'tablet-upright', 'closed', 'hidden', true, 'bottom', 'hidden', 'bar'],
  ['ipad', 'tablet-upright', 'closed', 'shown', true, 'bottom', 'hidden', 'sheet'],
  ['ipad', 'tablet-upright', 'add', 'hidden', true, 'bottom', 'over', 'bar'],
  // A phone upright: the same.
  ['phone', 'phone', 'closed', 'hidden', false, 'bottom', 'hidden', 'none'],
  ['phone', 'phone', 'list', 'hidden', false, 'bottom', 'over', 'none'],
  ['phone', 'phone', 'closed', 'hidden', true, 'bottom', 'hidden', 'bar'],
  ['phone', 'phone', 'closed', 'shown', true, 'bottom', 'hidden', 'sheet'],
  // A phone on its side keeps its tools down the left edge, like an iPad sideways.
  ['phone', 'phone-sideways', 'closed', 'hidden', false, 'left', 'hidden', 'none'],
  ['phone', 'phone-sideways', 'list', 'hidden', false, 'left', 'over', 'none'],
  ['phone', 'phone-sideways', 'closed', 'hidden', true, 'left', 'hidden', 'bar'],
  ['phone', 'phone-sideways', 'closed', 'shown', true, 'left', 'hidden', 'sheet'],
  ['phone', 'phone-sideways', 'list', 'shown', true, 'left', 'over', 'sheet'],
]

test.each(TABLE)('%s at %s, list %s, settings %s, picked %s', (...row) => {
  const [device, size, list, settings, picked, toolbar, shelf, panel] = row
  const found = layout(device, size, docks(list, settings), picked, false)
  expect([found.toolbar, found.list, found.settings]).toEqual([toolbar, shelf, panel])
  expect(found.mirror).toBe(false)
})

test('a left hand turns the panels and the hold buttons round, and changes nothing else', () => {
  const right = layout('ipad', 'wide', docks('closed', 'shown'), true, false)
  const left = layout('ipad', 'wide', docks('closed', 'shown'), true, true)
  expect(left.mirror).toBe(true)
  expect({ ...left, mirror: false }).toEqual(right)
})

test('at most two things float over the level: opening a third closes the oldest', () => {
  expect(floating(['bar', 'pad'], 'menu')).toEqual(['pad', 'menu'])
  expect(floating([], 'bar')).toEqual(['bar'])
  expect(floating(['bar'], 'pad')).toEqual(['bar', 'pad'])
})

test('opening something that is already open moves it to the end and never doubles it', () => {
  expect(floating(['bar', 'pad'], 'bar')).toEqual(['pad', 'bar'])
  expect(floating(['bar', 'pad'], 'pad')).toEqual(['bar', 'pad'])
})
