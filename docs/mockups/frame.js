// The shared frame every mockup page borrows, built from the page's `window.MOCK`: the pill, the parts and the tool's
// own settings row, the cluster, the tools (each with its key), the "Everything here" list, the values panel, the
// Library drawer, the play controls, the selection bar, the notes' switch, the zoom, the title block and undo and
// redo. It also fills in the Phosphor icons (`data-i`), the flags (`data-flag`) and the sketched pixel figures
// (`data-pixel`). Static pictures only: no button here does anything.

const ICONS = '../../node_modules/@phosphor-icons/core/assets/regular/'

const EDITORS = [
  ['World', 'map-trifold'],
  ['Characters', 'person'],
  ['Feel', 'sliders-horizontal'],
  ['Sound', 'music-notes'],
  ['Story', 'book-open'],
]

// The six game languages' flags, drawn plainly; the product uses the framework's.
const FLAGS = {
  us:
    '<rect width="30" height="20" fill="#fff"/>' +
    [0, 2, 4, 6, 8, 10, 12].map((i) => `<rect y="${i * 1.54}" width="30" height="1.54" fill="#b22234"/>`).join('') +
    '<rect width="13" height="10.8" fill="#3c3b6e"/>',
  mx: '<rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce1126"/><circle cx="15" cy="10" r="2.6" fill="#8c5a2b"/>',
  br: '<rect width="30" height="20" fill="#009c3b"/><path d="M15 2 28 10 15 18 2 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/>',
  cn: '<rect width="30" height="20" fill="#de2910"/><path d="M6 3l1.2 3.6H11L8 8.8l1.1 3.6L6 10.2l-3.1 2.2L4 8.8 1 6.6h3.8z" fill="#ffde00"/>',
  kr: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5" fill="#0047a0"/><path d="M10 10a5 5 0 0 1 10 0z" fill="#cd2e3a"/>',
  jp: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
}

// A hooded keeper with a lantern, as a sketch of what the figure builder paints, from the side, the front and the
// back. The demo game's real characters are still boxes; its figures will come from the builder.
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
const KEEPER_FRONT = [
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khHssssHhk...',
  '...khskssksHk...',
  '...khssssssHk...',
  '....kHsSSsHk....',
  '.....kkSSkk.....',
  '...kkttttttkk...',
  '..kttttttttttk..',
  '..ktTttttttTtk..',
  '..kskTttttTksk..',
  '..kLkTttttTkLk..',
  '.klllkTTTTklllk.',
  '.klllkTTTTklllk.',
  '..kLkppppppkLk..',
  '....kpppPPPk....',
  '....kppkkPPk....',
  '....kppk.kPk....',
  '....kbbk.kBk....',
  '...kbbbk.kBBk...',
  '...kkkkk.kkkk...',
]
const KEEPER_BACK = [
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khHhhhhHhk...',
  '...khHHhhHHhk...',
  '....kHHHHHHk....',
  '.....kkSSkk.....',
  '...kkTTTTTTkk...',
  '..kTTTTTTTTTTk..',
  '..kTTttttttTTk..',
  '..kskTttttTksk..',
  '..kLkTttttTkLk..',
  '.klllkTTTTklllk.',
  '.klllkTTTTklllk.',
  '..kLkPPPPPPkLk..',
  '....kPPPPPPk....',
  '....kPPkkPPk....',
  '....kPPk.kPk....',
  '....kBBk.kBk....',
  '...kBBBk.kBBk...',
  '...kkkkk.kkkk...',
]
// The same figure mid-step, for walk strips, clips and the ghost of a pose.
const KEEPER_STEP = KEEPER.slice(0, 15).concat([
  '...kppppPkLk....',
  '..kppk.kPPk.....',
  '.kppk...kPPk....',
  'kbbk.....kBBk...',
  'kbbbk....kBBBk..',
  'kkkkk....kkkkk..',
  '................',
])
const PIXELS = {
  keeper: KEEPER,
  front: KEEPER_FRONT,
  back: KEEPER_BACK,
  step: KEEPER_STEP,
  head: KEEPER.slice(0, 8),
}

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
const pic = (r) =>
  r.img
    ? `<img class="pic" src="${r.img}" alt="">`
    : r.px
      ? `<span class="pic" data-pixel="${r.px}" data-scale="1"></span>`
      : r.sw
        ? `<i class="pic swatch" style="background:${r.sw}"></i>`
        : `<span class="pic">${icon(r.i || 'cube')}</span>`

// One row of the values panel. Every row shows the plain words, and under them, small, the name the file uses, so a
// person and their agent can name the same value. A changed value has a dot and "put back".
function valueRow(r) {
  const file = r.f ? `<code>${r.f}</code>` : ''
  const label = `<span class="vl">${r.ch ? '<i class="chg"></i>' : ''}${r.l}${file}</span>`
  const back = r.ch ? `<button class="iconbtn back" aria-label="Put back">${icon('arrow-u-up-left')}</button>` : ''
  switch (r.t) {
    case 'num':
      return `<div class="vrow">${label}<span class="vin">${r.v}${r.u ? `<small>${r.u}</small>` : ''}</span><span class="pm"><button class="sq">${icon('minus')}</button><button class="sq">${icon('plus')}</button></span>${back}</div>`
    case 'slider':
      return `<div class="vrow slide">${label}<span class="vin">${r.v}</span>${back}<span class="rail2"><i style="--at:${r.at}%"></i></span><span class="ends"><span>${r.lo}</span><span>${r.hi}</span></span></div>`
    case 'choice':
      return `<div class="vrow">${label}<span class="seg">${r.opts.map((o, i) => `<button class="${i === r.on ? 'on' : ''}">${o}</button>`).join('')}</span>${back}</div>`
    case 'sw':
      return `<div class="vrow">${label}<span class="knob2${r.on ? ' on' : ''}"></span>${back}</div>`
    case 'pick':
      return `<div class="vrow">${label}<span class="vpick">${pic(r)}${r.v}${icon('caret-down')}</span>${back}</div>`
    case 'text':
      return `<div class="vrow text">${label}<span class="vtext">${r.v}</span></div>`
    case 'btns':
      return `<div class="vbtns">${r.b.map(([w, ic, main]) => `<button class="btn small${main ? ' main' : ''}">${icon(ic)}${w}</button>`).join('')}</div>`
    case 'html':
      return r.h
    default:
      return `<p class="vnote">${r.l}</p>`
  }
}

function valuesPanel(v, tabs) {
  const groups = v.groups
    .map(
      (g) =>
        `<div class="group${g.open ? ' open' : ''}"><button class="ghead">${icon(g.open ? 'caret-down' : 'caret-right')}<span class="label">${g.name}</span>${g.count ? `<span class="gcount">${g.count}</span>` : ''}</button>${g.open ? `<div class="grows">${g.rows.map(valueRow).join('')}</div>` : ''}</div>`,
    )
    .join('')
  return `<section class="float panel values">
    <header class="panel-head">
      <nav class="tabs">${tabs.map((t, i) => `<button class="${i === 0 ? 'on' : ''}">${t}</button>`).join('')}</nav>
      <span class="ptitle">${v.pic ? pic(v.pic) : ''}<span><b>${v.title}</b><small>${v.sub || ''}</small></span></span>
      <button class="iconbtn" aria-label="Close">${icon('x')}</button>
    </header>
    ${v.search === false ? '' : `<div class="vsearch">${icon('magnifying-glass')}<span>${v.searchText || 'Find a value'}</span></div>`}
    <div class="vbody">${v.top || ''}${groups}</div>
  </section>`
}

// "Everything here": every thing in what is open, with its picture, its name, an eye and a lock.
function listPanel(l) {
  const rows = l.rows
    .map((r) =>
      r.head
        ? `<div class="lhead label">${icon('caret-down')}${r.head}${r.count ? `<span class="gcount">${r.count}</span>` : ''}</div>`
        : `<div class="lrow${r.on ? ' on' : ''}${r.hid ? ' hid' : ''}" style="--d:${r.d || 0}">${pic(r)}<span class="ln">${r.n}${r.k ? `<small>${r.k}</small>` : ''}</span><span class="lic">${r.warn ? `<span class="ic warn" data-i="warning"></span>` : ''}${icon(r.hid ? 'eye-slash' : 'eye')}${icon(r.lock ? 'lock-simple' : 'lock-simple-open')}</span></div>`,
    )
    .join('')
  return `<section class="float panel listpanel">
    <header class="panel-head"><span class="label">${l.title || 'Everything here'}</span>${l.count ? `<span class="gcount">${l.count}</span>` : ''}<button class="iconbtn" aria-label="Close">${icon('x')}</button></header>
    <div class="vsearch">${icon('magnifying-glass')}<span>${l.search || 'Find by name'}</span></div>
    <div class="lbody">${rows}</div>
    ${l.foot ? `<div class="lfoot">${l.foot}</div>` : ''}
  </section>`
}

// The Library: everything the game owns, as pictures, with kinds to filter by. Closed, it is one button.
function library(lib) {
  if (!lib.open)
    return `<button class="float libtab">${icon('books')}<span>Library</span><kbd>L</kbd></button>`
  const items = lib.items
    .map((it) => `<div class="litem${it.on ? ' on' : ''}">${pic(it)}<span>${it.n}</span>${it.note ? `<small>${it.note}</small>` : ''}</div>`)
    .join('')
  return `<section class="float library">
    <header class="panel-head"><span class="label">${icon('books')} Library</span>
      <span class="vsearch inline">${icon('magnifying-glass')}<span>Find in the game</span></span>
      <nav class="kinds">${lib.filters.map((f, i) => `<button class="${i === (lib.on || 0) ? 'on' : ''}">${f}</button>`).join('')}</nav>
      <button class="iconbtn on" aria-label="Pinned open">${icon('push-pin')}</button><button class="iconbtn" aria-label="Close">${icon('x')}</button></header>
    <div class="litems">${items}</div>
  </section>`
}

// Play as a tool: pause, one step, slow, start again, play from here, and the last 30 seconds to drag back through.
function transport(p) {
  return `<div class="float transport">
    <button class="iconbtn">${icon(p.paused ? 'play' : 'pause')}</button>
    <button class="iconbtn" aria-label="One step">${icon('skip-forward')}</button>
    <span class="seg">${['1×', '½', '¼'].map((s, i) => `<button class="${i === (p.speed || 0) ? 'on' : ''}">${s}</button>`).join('')}</span>
    <button class="btn small">${icon('arrow-counter-clockwise')}Start again</button>
    <button class="btn small">${icon('map-pin')}Play from here</button>
    <span class="rewind"><span class="label">Last 30 s</span><span class="rbar"><i style="--at:${p.at || 100}%"></i></span><span class="num">${p.time || '0:12'}</span></span>
  </div>`
}

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
      ([word, ic, key, more, soon], i) =>
        `<button class="tool${i === m.tool ? ' on' : ''}">${icon(ic)}<span class="label">${word}</span>${key ? `<kbd>${key}</kbd>` : ''}${more ? '<i class="more"></i>' : ''}${soon ? '<span class="soon">Soon</span>' : ''}</button>`,
    )
    .join('')
    // A phone has room for the first few tools; "More" opens the rest, each with its word.
    + (m.tools.length > 5 ? `<button class="tool more-tools">${icon('dots-three')}<span class="label">More</span></button>` : '')
  const switcher = EDITORS.map(
    ([word, ic]) => `<button class="${word === editor[0] ? 'on' : ''}">${icon(ic)}<span class="label">${word}</span></button>`,
  ).join('')
  const settings = m.settings ? `<div class="float settings">${m.settings.join('<span class="ssep"></span>')}</div>` : ''
  const html = `
  <div class="float pill">
    <button class="where"><span class="long"><span class="game">Crate Game · </span>${m.place}</span><span class="short">${m.place} · ${editor[0]}</span>${icon('caret-down')}</button>
    <span class="sep"></span>
    <nav class="switcher">${switcher}</nav>
  </div>
  ${parts ? `<nav class="float parts">${parts}</nav>` : ''}
  ${settings}
  <div class="float cluster">
    <span class="find hide-phone">${icon('magnifying-glass')}<span class="long">Find or do anything</span><span class="key">⌘K</span><span class="short label">Find</span></span>
    <button class="iconbtn keys hide-narrow" aria-label="Keys and gestures">${icon('keyboard')}</button>
    <button class="flagbtn" aria-label="English">${flag('us')}</button>
    <button class="btn small hide-narrow">${icon('export')}Export</button>
    <button class="btn small hide-narrow">${icon('share-network')}Share</button>
    <button class="btn main">${icon('floppy-disk')}<span>Save</span>${m.changes ? `<span class="count">${m.changes}</span>` : ''}<span class="faces"><span class="face">S</span><span class="face b">M</span></span></button>
  </div>
  <nav class="float tools">${tools}</nav>
  ${m.list ? listPanel(m.list) : ''}
  ${m.library ? library(m.library) : ''}
  ${m.play ? transport(m.play) : ''}
  <div class="float notes-switch"><span class="dot"></span><span class="label">Drawing notes</span><span class="label touch">On</span></div>
  <div class="float zoom"><button class="iconbtn">${icon('magnifying-glass-minus')}</button><span class="num zoomv">${m.zoom || '100%'}</span><button class="iconbtn">${icon('magnifying-glass-plus')}</button><button class="iconbtn">${icon('corners-out')}</button></div>
  <div class="float titleblock">
    <div><b>Game</b>Crate Game</div><div><b>${m.what || 'Level'}</b>${m.place}</div>
    <div><b>Editor</b>${editor[0]}</div><div class="keep"><b>Saved</b>${m.saved || 'Not saved yet'}</div>
  </div>
  <div class="float undo"><button class="iconbtn">${icon('arrow-counter-clockwise')}</button><button class="iconbtn">${icon('arrow-clockwise')}</button></div>
  <div class="mock-tag">Mockup · not the build${m.state ? ` · ${m.state}` : ''}</div>`
  document.body.insertAdjacentHTML('beforeend', html)

  // The right side: the values panel the frame builds, or the page's own panels; with the closed panels' row above.
  let panels = document.querySelector('.panels')
  if (!panels) {
    panels = document.createElement('div')
    panels.className = 'panels'
    document.body.append(panels)
  }
  const tabs = [m.values ? m.values.tab || m.values.title : null, m.list ? 'Everything here' : null, m.library ? 'Library' : null]
  if (m.values) panels.insertAdjacentHTML('afterbegin', valuesPanel(m.values, [...(m.tabs || []), ...tabs.filter(Boolean)]))
  const closed = (m.closed || [])
    .map(([w, ic, count]) => `<button class="chipbtn">${icon(ic)}${w}${count ? `<span class="gcount">${count}</span>` : ''}</button>`)
    .join('')
  if (closed) panels.insertAdjacentHTML('afterbegin', `<div class="closed">${closed}</div>`)
  if (m.libraryOpen) document.body.classList.add('lib-open')
  if (m.list) document.body.classList.add('has-list')
  if (m.play) document.body.classList.add('has-play')
  for (const c of m.body || []) document.body.classList.add(c)
}

frame(window.MOCK)
Object.assign(PIXELS, window.MOCK.pixels || {})
Object.assign(PAL, window.MOCK.pal || {})
for (const el of document.querySelectorAll('[data-i]')) el.style.setProperty('--icon', `url("${ICONS}${el.dataset.i}.svg")`)
for (const el of document.querySelectorAll('[data-flag]'))
  el.innerHTML = `<svg viewBox="0 0 30 20" aria-hidden="true">${FLAGS[el.dataset.flag]}</svg>`
for (const el of document.querySelectorAll('[data-pixel]')) paintPixels(el)
// A map drawn at a fixed size opens whole, as the editors' canvases do: scaled to the space the floating parts leave.
for (const el of document.querySelectorAll('[data-board]')) {
  const [w, h] = el.dataset.board.split('x').map(Number)
  const box = el.parentElement.getBoundingClientRect()
  const scale = Math.min(box.width / w, box.height / h, 1.25)
  Object.assign(el.style, {
    position: 'absolute',
    width: `${w}px`,
    height: `${h}px`,
    left: `${(box.width - w * scale) / 2}px`,
    top: `${(box.height - h * scale) / 2}px`,
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
  })
}
document.documentElement.dataset.ready = 'yes'
