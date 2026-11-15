// The shared frame every mockup page borrows: the pill, the parts, the cluster, the tools, the notes' switch, the
// zoom, the title block and undo and redo, built from the page's `window.MOCK`. It also fills in the Phosphor icons
// (`data-i`), the flags (`data-flag`) and the sketched pixel figures (`data-pixel`). Static pictures only: no button
// here does anything.

const ICONS = '../../node_modules/@phosphor-icons/core/assets/regular/'

const EDITORS = [
  ['World', 'map-trifold'],
  ['Characters', 'person'],
  ['Feel', 'sliders-horizontal'],
  ['Sound', 'music-notes'],
  ['Story', 'book-open'],
]

// The six game languages' flags (and the editors' three more), drawn plainly; the product uses the framework's.
const FLAGS = {
  us:
    '<rect width="30" height="20" fill="#fff"/>' +
    [0, 2, 4, 6, 8, 10, 12].map((i) => `<rect y="${i * 1.54}" width="30" height="1.54" fill="#b22234"/>`).join('') +
    '<rect width="13" height="10.8" fill="#3c3b6e"/>',
  mx: '<rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce1126"/><circle cx="15" cy="10" r="2.6" fill="#8c5a2b"/>',
  br: '<rect width="30" height="20" fill="#009c3b"/><path d="M15 2 28 10 15 18 2 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/>',
  cn: '<rect width="30" height="20" fill="#de2910"/><path d="M6 3l1.2 3.6H11L8 8.8l1.1 3.6L6 10.2l-3.1 2.2L4 8.8 1 6.6h3.8z" fill="#ffde00"/>',
  kr: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5" fill="#0047a0"/><path d="M10 10a5 5 0 0 1 10 0a2.5 2.5 0 0 1-5 0a2.5 2.5 0 0 0-5 0z" fill="#cd2e3a"/>',
  jp: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
}

// A hooded keeper with a lantern, side view, as a sketch of what the figure builder paints. The demo game's real
// characters are still boxes; its figures will come from the builder, in the game's own palette.
const PAL = {
  k: '#111314',
  s: '#fdd4bd',
  S: '#e0a98d',
  h: '#afd472',
  H: '#7fa84a',
  t: '#f37f94',
  T: '#c4566c',
  p: '#587382',
  P: '#35434b',
  b: '#b5651d',
  B: '#7a4010',
  l: '#ffe58a',
  L: '#8a6d12',
}
const KEEPER = [
  '.....kkkkk......',
  '....khhhhhk.....',
  '...khhhhhhhk....',
  '..khhHHsssshk...',
  '..khHssssksk....',
  '..khHsssssSk....',
  '...kHHsssSk.....',
  '....kkSSSk......',
  '...kttttttk.....',
  '..kttttttttk....',
  '..ktTttttTtk....',
  '..ktTtttksTk....',
  '..ktTtttkLLLk...',
  '..kTTtttklllk...',
  '...kTTTTklllk...',
  '...kppppPkLk....',
  '...kppkPPk......',
  '...kppkPPk......',
  '...kppkPPk......',
  '...kbbkBBk......',
  '..kbbbkBBBk.....',
  '..kkkkkkkkk.....',
]
// The same figure mid-step, for walk strips and clips.
const KEEPER_STEP = KEEPER.slice(0, 15).concat([
  '...kppppPkLk....',
  '..kppk.kPPk.....',
  '.kppk...kPPk....',
  'kbbk.....kBBk...',
  'kbbbk....kBBBk..',
  'kkkkk....kkkkk..',
  '................',
])
const PIXELS = { keeper: KEEPER, step: KEEPER_STEP, head: KEEPER.slice(0, 8) }

function paintPixels(el) {
  const rows = PIXELS[el.dataset.pixel]
  const scale = Number(el.dataset.scale || 6)
  const canvas = document.createElement('canvas')
  canvas.width = rows[0].length * scale
  canvas.height = rows.length * scale
  const g = canvas.getContext('2d')
  rows.forEach((row, y) => {
    ;[...row].forEach((c, x) => {
      if (c === '.') return
      g.fillStyle = PAL[c]
      g.fillRect(x * scale, y * scale, scale, scale)
    })
  })
  if (el.dataset.flip) canvas.style.transform = 'scaleX(-1)'
  el.append(canvas)
}

const icon = (name) => `<span class="ic" data-i="${name}"></span>`
const flag = (code) => `<span class="flag" data-flag="${code}"></span>`

function frame(m) {
  const editor = EDITORS.find(([word]) => word.toLowerCase() === m.editor)
  const parts = (m.parts || [])
    .map(
      ([word, ic, soon], i) =>
        `<button class="${i === m.part ? 'on' : ''}">${icon(ic)}${word}${soon ? ' <span class="soon">Soon</span>' : ''}</button>`,
    )
    .join('')
  const tools = m.tools
    .map(
      ([word, ic, soon], i) =>
        `<button class="tool${i === m.tool ? ' on' : ''}">${icon(ic)}<span class="label">${word}</span>${soon ? '<span class="soon">Soon</span>' : ''}</button>`,
    )
    .join('')
  const switcher = EDITORS.map(
    ([word, ic]) => `<button class="${word === editor[0] ? 'on' : ''}">${icon(ic)}<span class="label">${word}</span></button>`,
  ).join('')
  const html = `
  <div class="float pill">
    <button class="where"><span class="long">Crate Game · ${m.place}</span><span class="short">${m.place} · ${editor[0]}</span>${icon('caret-down')}</button>
    <span class="sep"></span>
    <nav class="switcher">${switcher}</nav>
  </div>
  ${parts ? `<nav class="float parts">${parts}</nav>` : ''}
  <div class="float cluster">
    <span class="find">${icon('magnifying-glass')}<span class="long">Find or do anything</span><span class="key">⌘K</span><span class="short label">Find</span></span>
    <button class="flagbtn" aria-label="English">${flag('us')}</button>
    <button class="btn small hide-narrow">${icon('export')}Export</button>
    <button class="btn small hide-narrow">${icon('share-network')}Share</button>
    <button class="btn main">${icon('floppy-disk')}<span class="hide-phone">Save</span><span class="faces"><span class="face">S</span><span class="face b">M</span></span></button>
  </div>
  <nav class="float tools">${tools}</nav>
  <div class="float notes-switch"><span class="dot"></span><span class="label">Drawing notes</span><span class="label touch">On</span></div>
  <div class="float zoom"><button class="iconbtn">${icon('magnifying-glass-minus')}</button><button class="iconbtn">${icon('magnifying-glass-plus')}</button><button class="iconbtn">${icon('corners-out')}</button></div>
  <div class="float titleblock">
    <div><b>Game</b>Crate Game</div><div class="keep"><b>${m.what || 'Level'}</b>${m.place}</div>
    <div><b>Editor</b>${editor[0]}</div><div class="keep"><b>Saved</b>${m.saved || 'Not saved yet'}</div>
  </div>
  <div class="float undo"><button class="iconbtn">${icon('arrow-counter-clockwise')}</button><button class="iconbtn">${icon('arrow-clockwise')}</button></div>
  <div class="mock-tag">Mockup · not the build</div>`
  document.body.insertAdjacentHTML('beforeend', html)
}

frame(window.MOCK)
for (const el of document.querySelectorAll('[data-i]')) el.style.setProperty('--icon', `url("${ICONS}${el.dataset.i}.svg")`)
for (const el of document.querySelectorAll('[data-flag]'))
  el.innerHTML = `<svg viewBox="0 0 30 20" aria-hidden="true">${FLAGS[el.dataset.flag]}</svg>`
for (const el of document.querySelectorAll('[data-pixel]')) paintPixels(el)
document.documentElement.dataset.ready = 'yes'
