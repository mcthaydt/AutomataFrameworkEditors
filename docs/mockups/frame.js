// The shared frame every mockup page borrows, built from the page's `window.MOCK`. Round three draws one shell
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

// ---------- round three: one shell, the canvas is the app ----------
// The Owner (2026-11-15): Figma-simple. One shell with the five editors as workspaces; the canvas in the middle;
// Layers and Assets on the left; an inspector on the right that shows the few values that matter and keeps the rest
// under More; one small toolbar; play in place; edits kept on the device as a draft until Share; a plain dark look
// with palette No. 310 only for accents.

// The five tools every workspace shares. Each workspace gives them its own meaning (Paint paints tiles in World and
// notes in Sound; Draw path links cards in Story), so learning one workspace teaches all five.
const TOOLS = [
  ['Move', 'cursor', 'V'],
  ['Place', 'plus-square', 'A'],
  ['Paint', 'paint-brush', 'B'],
  ['Draw path', 'path', 'L'],
  ['Play', 'play', 'P'],
]
// Round two's tools, mapped onto the five.
const TOOL_OF = {
  pick: 0, hand: 0, pose: 0, erase: 0, mirror: 0, select: 0, find: 0,
  add: 1, 'add a key': 1, 'add a card': 1, 'add a loop': 1, 'add a part': 1, note: 1, camera: 1, record: 1,
  paint: 2, pencil: 2, scatter: 2, fill: 2, box: 2, light: 2, 'pick a color': 2,
  link: 3, zone: 3, measure: 3, line: 3, trim: 3, cut: 3, 'onion skin': 3,
  play: 4, 'try it': 4,
}

// What each editor's own changes are, for the Share button.
const changesOf = (m) => m.changes || Number((/(\d+) change/.exec(m.saved || '') || [])[1] || 0)

function insRow(r) {
  const tip = r.f ? ` title="${r.f}"` : ''
  const dot = r.ch ? '<i class="dot"></i>' : ''
  const label = `<span class="il"${tip}>${dot}${r.l}${r.f ? `<code>${r.f}</code>` : ''}</span>`
  switch (r.t) {
    case 'num':
      return `<div class="ir">${label}<span class="scrub">${r.v}${r.u ? `<small>${r.u}</small>` : ''}</span></div>`
    case 'slider':
      return `<div class="ir sl">${label}<span class="scrub">${r.v}</span><span class="track"><i style="--at:${r.at}%"></i></span><span class="ends"><span>${r.lo}</span><span>${r.hi}</span></span></div>`
    case 'choice':
      return `<div class="ir${r.opts.join('').length > 18 ? ' wide' : ''}">${label}<span class="segs">${r.opts.map((o, i) => `<button class="${i === r.on ? 'on' : ''}">${o}</button>`).join('')}</span></div>`
    case 'sw':
      return `<div class="ir">${label}<span class="tog${r.on ? ' on' : ''}"></span></div>`
    case 'pick':
      return `<div class="ir">${label}<span class="drop">${pic(r)}<span>${r.v}</span>${icon('caret-down')}</span></div>`
    case 'text':
      return `<div class="ir tx">${label}<span class="tbox">${r.v}</span></div>`
    case 'btns':
      return `<div class="ibtns">${r.b.map(([w, ic, main]) => `<button class="sbtn${main ? ' main' : ''}">${icon(ic)}${w}</button>`).join('')}</div>`
    case 'html':
      return r.h
    default:
      return `<p class="inote">${r.l}</p>`
  }
}

// The inspector shows the few values that matter for what is picked (at most `keep`), under the group they belong to;
// everything else is one "More" line. A group still says "Soon" when it is not built yet.
function inspector(v, keep) {
  let shown = 0
  let hidden = 0
  const parts = []
  for (const g of v.groups) {
    const rows = g.open ? g.rows : []
    const take = []
    for (const r of rows) {
      const counts = r.t !== 'btns' && r.t !== 'html' && r.t !== 'note' && r.t !== undefined
      if (shown < keep || !counts) {
        if (counts) shown++
        take.push(r)
      } else hidden++
    }
    if (!g.open) hidden += g.count || 1
    if (take.length) parts.push(`<div class="igroup"><h4>${g.name}</h4>${take.map(insRow).join('')}</div>`)
  }
  return `<header class="ihead">${v.pic ? pic(v.pic) : ''}<span class="it"><b>${v.title}</b><small>${v.sub || ''}</small></span>
      <button class="ib" aria-label="Show the file's names" title="Show the file's names">${icon('brackets-curly')}</button></header>
    <div class="ibody">${v.top || ''}${parts.join('')}
      ${hidden ? `<button class="more">${icon('caret-right')}More<span class="n">${hidden}</span></button>` : ''}</div>`
}

function layers(l) {
  return l.rows
    .map((r) =>
      r.head
        ? `<div class="lh">${r.head}</div>`
        : `<div class="lr${r.on ? ' on' : ''}${r.hid ? ' hid' : ''}" style="--d:${r.d || 0}">${pic(r)}<span class="ln">${r.n}</span>${r.warn ? icon('warning') : ''}${r.hid ? icon('eye-slash') : ''}${r.lock ? icon('lock-simple') : ''}</div>`,
    )
    .join('')
}

function assets(lib) {
  return `<div class="afil">${(lib.filters || ['All']).map((f, i) => `<button class="${i === (lib.on || 0) ? 'on' : ''}">${f}</button>`).join('')}</div>
    <div class="agrid">${lib.items.map((it) => `<div class="ai${it.on ? ' on' : ''}">${pic(it)}<span>${it.n}</span></div>`).join('')}</div>`
}

function leftPanel(m) {
  const onAssets = !m.list && m.library
  const body = m.list ? layers(m.list) : m.library ? assets(m.library) : '<p class="empty">Nothing here yet. Press Place, or drag something in from Assets.</p>'
  return `<aside class="sh-left">
    <nav class="ltabs"><button class="${onAssets ? '' : 'on'}">Layers</button><button class="${onAssets ? 'on' : ''}">Assets</button><button class="ib" aria-label="Hide">${icon('sidebar-simple')}</button></nav>
    <div class="lsearch">${icon('magnifying-glass')}<span>Find</span></div>
    <div class="lbody">${body}</div>
  </aside>`
}

// Play in place: the level runs where it is drawn. Pause, one step, slow, start again, play from here, and the
// last 30 seconds to drag back through.
function playbar(p) {
  return `<div class="sh-play">
    <button class="ib">${icon(p.paused ? 'play' : 'pause')}</button>
    <button class="ib" title="One step">${icon('skip-forward')}</button>
    <span class="segs">${['1×', '½', '¼'].map((s, i) => `<button class="${i === (p.speed || 0) ? 'on' : ''}">${s}</button>`).join('')}</span>
    <button class="ib" title="Start again">${icon('arrow-counter-clockwise')}</button>
    <button class="ib" title="Play from here">${icon('map-pin')}</button>
    <span class="rew"><i style="--at:${p.at || 100}%"></i></span><span class="t">${p.time || '0:12'}</span>
    <button class="ib stop" title="Stop">${icon('stop')}</button>
  </div>`
}

function frame(m) {
  const editor = EDITORS.find(([word]) => word.toLowerCase() === m.editor)
  const n = changesOf(m)
  const parts = (m.parts || [])
    .map(([word, , soon], i) => `<button class="${i === m.part ? 'on' : ''}${soon ? ' soon' : ''}">${word}</button>`)
    .join('')
  const ws = EDITORS.map(([word]) =>
    word === editor[0]
      ? `<span class="ws on"><b>${word}</b><span class="parts">${parts}</span></span>`
      : `<button class="ws">${word}</button>`,
  ).join('')
  const was = (m.tools?.[m.tool]?.[0] || 'pick').toLowerCase()
  const tool = m.t ?? (m.play ? 4 : TOOL_OF[was] ?? 0)
  const tools = TOOLS.map(
    ([word, ic, key], i) => `<button class="tl2${i === tool ? ' on' : ''}${i === 4 ? ' play' : ''}" title="${word} (${key})">${icon(i === 4 && m.play ? 'stop' : ic)}<span>${i === 4 && m.play ? 'Stop' : word}</span></button>`,
  ).join('')
  const problems = (m.closed || []).find(([w]) => w === 'Problems')?.[2]
  const html = `
  <header class="sh-top">
    <button class="game"><i class="logo"></i><span>Crate Game</span>${icon('caret-down')}</button>
    <nav class="sh-ws">${ws}</nav>
    <button class="wsn"><b>${editor[0]}</b>${icon('caret-down')}</button>
    <nav class="partsn">${parts}</nav>
    <span class="fill"></span>
    ${problems ? `<button class="ib warn" title="${problems} problem">${icon('warning')}<span>${problems}</span></button>` : ''}
    <button class="ib cmdk" title="Find or do anything (⌘K)">${icon('magnifying-glass')}<kbd>⌘K</kbd></button>
    <span class="faces"><span class="face">S</span><span class="face b">M</span></span>
    <span class="kept">${n ? 'Kept on this iPad' : `Shared · ${(m.saved || '').replace(/^Not saved.*/, 'just now')}`}</span>
    <button class="share">${icon('share-network')}<span>Share</span>${n ? `<span class="n">${n}</span>` : ''}</button>
  </header>
  ${leftPanel(m)}
  ${m.values ? `<aside class="sh-right">${inspector(m.values, m.keep || 5)}</aside>` : ''}
  ${m.bottom ? `<section class="dockbottom sh-bottom"><header class="bh"><b>${m.bottom.title}</b>${m.bottom.head || ''}</header><div class="bbody">${m.bottom.tl ? timeline(m.bottom.tl) : ''}${m.bottom.html || ''}</div></section>` : ''}
  ${m.play ? playbar(m.play) : ''}
  <div class="sh-tools">
    ${m.settings ? `<div class="opts">${m.settings.join('')}</div>` : ''}
    <nav class="bar"><button class="tl2 lay" title="Layers and Assets">${icon('stack')}<span>Layers</span></button>${tools}<i class="div"></i><button class="tl2 u" title="Undo">${icon('arrow-counter-clockwise')}<span>Undo</span></button><button class="tl2 u" title="Redo">${icon('arrow-clockwise')}<span>Redo</span></button></nav>
  </div>
  <span class="sh-zoom">${m.zoom || '100%'}</span>
  <div class="mock-tag">Mockup${m.state ? ` · ${m.state}` : ''}</div>`
  document.body.insertAdjacentHTML('beforeend', html)
  const cls = ['sh', m.list || m.library ? 'has-left' : 'no-left', m.values ? 'has-right' : 'no-right']
  if (m.play) cls.push('playing')
  if (m.bottom) cls.push('has-bottom2')
  if (m.settings) cls.push('has-opts')
  const fine = m.hand ? m.hand === 'fine' : !(navigator.maxTouchPoints > 0)
  cls.push(fine ? 'fine' : 'touch')
  document.body.classList.add(...cls, ...(m.body || []))
  // An agent's change waits on the canvas as a ghost: where the thing would go, what the agent says, Keep or Undo.
  const stage = document.querySelector('.stage')
  if (m.ghost && stage) {
    const g = m.ghost
    stage.insertAdjacentHTML(
      'beforeend',
      `<img class="ghost2" src="${g.img}" alt="" style="left:${g.at[0]}%;top:${g.at[1]}%;width:${g.w || 6.25}%">
      <div class="agent" style="left:${g.card[0]}%;top:${g.card[1]}%"><b>${icon('sparkle')}${g.who || 'Agent'}</b><p>${g.text}</p><span><button class="sbtn main">Keep</button><button class="sbtn">Undo</button></span></div>`,
    )
  }
}

frame(window.MOCK)
// Both row sizes of the same inspector, side by side: what a finger gets and what a mouse or a trackpad gets.
if (window.MOCK.compare) {
  const c = window.MOCK.compare
  const one = (hand, words) => `<figure class="${hand}"><figcaption>${words}</figcaption><div class="sh-right inline">${inspector(c, 6)}</div></figure>`
  document.querySelector('.fit').insertAdjacentHTML(
    'beforeend',
    `<div class="compare2">${one('touch', 'With a finger: 44 points a row')}${one('fine', 'With a mouse, a trackpad or a hovering Pencil: small rows')}</div>`,
  )
}
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
