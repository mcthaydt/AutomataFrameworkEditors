import { expect, test } from 'vitest'
import type { Layout } from '#src/features/shell/shell.ts'
import { insetsOf } from '#src/features/world/insets.ts'

const lay = (over: Partial<Layout>): Layout => ({
  toolbar: 'left',
  list: 'rail',
  settings: 'side',
  mirror: false,
  ...over,
})
const NO_SIDE = { left: 0, right: 0 }

// The box keeps clear of the toolbar and the list; the settings panel floats over the box, and the level is fitted in
// what it leaves (`aside`), so there is no dead strip beside the level while nothing is picked (the blind judge, item 2).
test('the level keeps clear of the toolbar and the list on one side, and fits beside the settings on the other', () => {
  expect(insetsOf(lay({}), 'side', false)).toEqual({
    left: 76 + 68,
    right: 0,
    bottom: 0,
    sheet: false,
    aside: { left: 0, right: 308 },
  })
  expect(insetsOf(lay({ list: 'beside' }), 'tab', false)).toEqual({
    left: 76 + 288,
    right: 0,
    bottom: 0,
    sheet: false,
    aside: { left: 0, right: 52 },
  })
})

test('with nothing picked the level has the whole box', () => {
  expect(insetsOf(lay({ settings: 'none' }), 'none', false)).toEqual({
    left: 76 + 68,
    right: 0,
    bottom: 0,
    sheet: false,
    aside: NO_SIDE,
  })
})

test('a toolbar along the bottom and a settings bar take room at the foot', () => {
  expect(insetsOf(lay({ toolbar: 'bottom', list: 'hidden', settings: 'bar' }), 'bar', false)).toEqual({
    left: 0,
    right: 0,
    bottom: 76 + 56,
    sheet: false,
    aside: NO_SIDE,
  })
})

test('a left hand has the panels the other way round', () => {
  expect(insetsOf(lay({ mirror: true }), 'side', false)).toEqual({
    left: 0,
    right: 76 + 68,
    bottom: 0,
    sheet: false,
    aside: { left: 308, right: 0 },
  })
})

test('with the panels put away the game has all the room', () => {
  expect(insetsOf(lay({}), 'side', true)).toEqual({
    left: 0,
    right: 0,
    bottom: 0,
    sheet: false,
    aside: NO_SIDE,
  })
})

test('on the map the settings side is free, the toolbar and the list still take theirs', () => {
  expect(insetsOf(lay({}), 'side', false, true)).toEqual({
    left: 76 + 68,
    right: 0,
    bottom: 0,
    sheet: false,
    aside: NO_SIDE,
  })
})

test('a pulled-up sheet takes the foot for itself, so the level ends where it begins', () => {
  expect(insetsOf(lay({ toolbar: 'bottom', list: 'hidden', settings: 'sheet' }), 'sheet', false)).toEqual({
    left: 0,
    right: 0,
    bottom: 0,
    sheet: true,
    aside: NO_SIDE,
  })
})

test('a phone on its side draws the toolbar two buttons wide, and the level keeps clear of both', () => {
  expect(insetsOf(lay({ list: 'hidden' }), 'tab', false, false, false, true)).toEqual({
    left: 76 + 52,
    right: 0,
    bottom: 0,
    sheet: false,
    aside: { left: 0, right: 52 },
  })
})
