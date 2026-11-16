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

test('the level keeps clear of the toolbar and the list on one side and the settings on the other', () => {
  expect(insetsOf(lay({}), 'side', false)).toEqual({ left: 76 + 68, right: 296, bottom: 0 })
  expect(insetsOf(lay({ list: 'beside' }), 'tab', false)).toEqual({ left: 76 + 288, right: 44, bottom: 0 })
})

test('a toolbar along the bottom and a settings bar take room at the foot', () => {
  expect(insetsOf(lay({ toolbar: 'bottom', list: 'hidden', settings: 'bar' }), 'bar', false)).toEqual({
    left: 0,
    right: 0,
    bottom: 76 + 56,
  })
})

test('a left hand has the panels the other way round', () => {
  expect(insetsOf(lay({ mirror: true }), 'side', false)).toEqual({ left: 296, right: 76 + 68, bottom: 0 })
})

test('with the panels put away the game has all the room', () => {
  expect(insetsOf(lay({}), 'side', true)).toEqual({ left: 0, right: 0, bottom: 0 })
})

test('on the map the settings side is free, the toolbar and the list still take theirs', () => {
  expect(insetsOf(lay({}), 'side', false, true)).toEqual({ left: 76 + 68, right: 0, bottom: 0 })
})
