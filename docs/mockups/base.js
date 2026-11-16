// The pieces the World pages share, so a page that only shows one more screen over the same level stays short. A page
// copies what it needs into its own `window.MOCK` (`{ ...BASE.levels, values: BASE.crate }`) and changes only what it
// is about. Static pictures only, like frame.js: nothing here does anything.
window.BASE = {
  parts: [['Levels', 'squares-four'], ['Tiles', 'grid-four'], ['Scenes', 'mountains']],
  tools: [
    ['Pick', 'cursor', 'V'], ['Hand', 'hand', 'H'], ['Add', 'plus', 'A', true], ['Link', 'link', 'L'],
    ['Zone', 'selection', 'Z'], ['Measure', 'ruler', 'M'], ['Erase', 'eraser', 'E'], ['Play', 'play', 'P'],
  ],
  settings: [
    '<span>Line up with tiles</span><span class="knob2 on"></span>',
    '<span>Grid</span><span class="seg"><button>Off</button><button class="on">Tiles</button><button>Finer</button></span>',
    '<button class="btn small"><span class="ic" data-i="squares-four"></span>All levels</button>',
  ],
  // The list of Level 1, the crate picked.
  list: {
    count: 7,
    rows: [
      { head: 'Things', count: 3 },
      { n: 'Hero', k: 'hero', img: 'art/hero.png', lock: true },
      { n: 'Crate 1', k: 'crate', img: 'art/crate.png', on: true },
      { n: 'Goal', k: 'flag', i: 'flag-pennant' },
      { head: 'Zones', count: 2 },
      { n: 'Start', i: 'map-pin' },
      { n: 'Fall off', i: 'arrow-fat-line-down' },
      { head: 'Ground and scene', count: 2 },
      { n: 'Ground tiles', k: 'meadow', i: 'grid-four', lock: true },
      { n: 'Meadow', k: 'scene', i: 'mountains', lock: true },
    ],
    foot: '<button class="btn small"><span class="ic" data-i="plus"></span>Add a thing</button>',
  },
  // The game's things to add: what the Place tray's "All things" opens.
  library: {
    open: true,
    filters: ['Everything', 'Things', 'Scenery', 'Tiles'],
    on: 0,
    items: [
      { n: 'Crate', note: 'used once', img: 'art/crate.png', on: true },
      { n: 'Hero', note: 'used once', img: 'art/hero.png' },
      { n: 'Button', note: 'not used yet', i: 'radio-button' },
      { n: 'Gate', note: 'not used yet', i: 'gate' },
      { n: 'Door', note: 'not used yet', i: 'door' },
      { n: 'Spring', note: 'not used yet', i: 'arrow-line-up' },
      { n: 'Coin', note: 'not used yet', i: 'coin' },
      { n: 'Moving floor', note: 'not used yet', i: 'arrows-left-right' },
      { n: 'Sign', note: 'not used yet', i: 'signpost' },
      { n: 'Keeper', note: 'from Characters', px: 'keeper' },
    ],
  },
  closed: [['Changes', 'clock-counter-clockwise'], ['Problems', 'warning']],
}

// Crate 1's settings, the way every World page shows them.
window.BASE.crate = {
  title: 'Crate 1', sub: 'Crate · a box to push and stand on', pic: { img: 'art/crate.png' }, tab: 'Crate 1',
  groups: [
    { name: 'Place', open: true, rows: [
      { t: 'num', l: 'From the left', f: 'x', v: '6', u: 'tiles' },
      { t: 'num', l: 'From the top', f: 'y', v: '7', u: 'tiles' },
    ] },
    { name: 'Look', open: true, rows: [
      { t: 'pick', l: 'Looks like', f: 'look', v: 'Crate', img: 'art/crate.png' },
      { t: 'choice', l: 'Drawn', f: 'layer', opts: ['Behind', 'With hero', 'In front'], on: 1 },
    ] },
    { name: 'What it does', open: true, rows: [
      { l: 'Every crate starts like this. A change here is for this crate only.' },
      { t: 'slider', l: 'How heavy', f: 'mass', v: '1.0', w: 'In the middle', lo: 'Light as a leaf', hi: 'Heavy as a rock', at: 40 },
      { t: 'sw', l: 'The hero can push it', f: 'pushable', on: true },
      { t: 'btns', b: [['Change every crate, in Characters', 'arrow-square-out']] },
    ] },
    { name: 'Your own values', count: 0, rows: [] },
    { name: 'Notes for the team', count: 0, rows: [] },
  ],
}

// A level picked together with the world's own crates: the same stage every page that shows Level 1 draws.
window.BASE.levels = {
  editor: 'world', place: 'Level 1', saved: 'Sam, 2 minutes ago', zoom: '100%', part: 0,
  parts: window.BASE.parts, tools: window.BASE.tools, tool: 0, settings: window.BASE.settings,
  list: window.BASE.list, library: { open: false }, closed: window.BASE.closed,
}

// The middle of the work: four crates, a button and a gate, three changes not yet in the game and one problem. The
// pages about putting changes in, checking them and the problems share it.
window.BASE.midList = {
  count: 12,
  rows: [
    { head: 'Things', count: 8 },
    { n: 'Hero', k: 'hero', img: 'art/hero.png', lock: true },
    { n: 'Crate 1', k: 'crate', img: 'art/crate.png' },
    { n: 'Crate 2', k: 'crate', img: 'art/crate.png' },
    { n: 'Crate 3', k: 'crate', img: 'art/crate.png' },
    { n: 'Crate 4', k: 'crate', img: 'art/crate.png', warn: true },
    { n: 'Button', k: 'button', i: 'radio-button' },
    { n: 'Gate 1', k: 'gate', i: 'gate' },
    { n: 'Goal', k: 'flag', i: 'flag-pennant', hid: true },
    { head: 'Zones', count: 2 },
    { n: 'Start', i: 'map-pin' },
    { n: 'Fall off', i: 'arrow-fat-line-down' },
  ],
  foot: '<button class="btn small"><span class="ic" data-i="plus"></span>Add a thing</button>',
}
window.BASE.mid = {
  ...window.BASE.levels, saved: 'Not saved: 3 changes', changes: 3, list: window.BASE.midList,
  closed: [['Changes', 'clock-counter-clockwise', 3], ['Problems', 'warning', 1]],
}

// The world map's game, as the world file and the doors say (the level links spec, 2026-11-15). Places and sizes are
// in tiles. Level 2 and Level 3 touch along an open stretch, so they are one place: the hero walks straight across, as
// the test game's second and third levels do. Cave 1 hangs under Level 3, open where they meet, so you can drop in.
// Level 4 sits apart, reached through a door. A page copies this and changes only what it is about (map.js draws it).
window.BASE.world = () => ({
  levels: [
    { n: 'Level 1', x: 0, y: 2, w: 20, h: 12, hue: 0, start: true },
    { n: 'Level 2', x: 24, y: 0, w: 20, h: 12, hue: 25, here: true },
    { n: 'Level 3', x: 44, y: 0, w: 16, h: 12, hue: 50 },
    { n: 'Cave 1', x: 44, y: 12, w: 16, h: 8, hue: 250 },
    { n: 'Level 4', x: 64, y: 2, w: 20, h: 12, hue: 200 },
    { n: 'Secret room', x: 6, y: 18, w: 12, h: 8, hue: 140 },
    { n: 'The keep', x: 64, y: 18, w: 20, h: 12, hue: 180 },
    { n: 'New level', x: 26, y: 18, w: 14, h: 8, add: true },
  ],
  edges: [
    { a: 'Level 2', b: 'Level 3', at: [6, 10] },
    { a: 'Level 3', b: 'Cave 1', at: [50, 54] },
  ],
  doors: [
    { from: [18, 11], to: [26, 9] },
    { from: [3, 12], to: [9, 23] },
    { from: [58, 9], to: [66, 11] },
    { from: [57, 18], to: [67, 27] },
  ],
  tip: 'Tap a level to go in. Drag a level against another and players walk straight across. A dashed arrow is a door.',
})

// What every map page shows around the map: the top bar says "Levels · Map", Map is on, and there are no tools.
window.BASE.map = {
  editor: 'world', place: 'Map', saved: 'Sam, 2 minutes ago', zoom: '8%', holds: false, mapOn: true, state: 'world map',
  parts: window.BASE.parts, part: 0, tool: 0, noTools: true,
  list: {
    count: 7,
    rows: [
      { head: 'Levels', count: 7, fold: false },
      { n: 'Level 1', i: 'squares-four', d: 1 }, { n: 'Level 2', i: 'squares-four', d: 1, on: true }, { n: 'Level 3', i: 'squares-four', d: 1 },
      { n: 'Cave 1', i: 'squares-four', d: 1 }, { rest: 'and 3 more', d: 1 },
    ],
  },
  library: { open: false },
  closed: [['Changes', 'clock-counter-clockwise'], ['Problems', 'warning']],
}
