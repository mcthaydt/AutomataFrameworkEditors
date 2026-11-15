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

// The middle of the work: four crates, a button and a door, three changes not yet in the game and one problem. The
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
    { n: 'Door', k: 'door', i: 'door' },
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
