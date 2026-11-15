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
// The framework's own flags (src/features/web/library/flags), so a mockup shows exactly what the product will.
const FLAGS = {
  us: '<rect width="60" height="40" fill="#ffffff"/><rect y="0.00" width="60" height="3.08" fill="#b22234"/><rect y="6.15" width="60" height="3.08" fill="#b22234"/><rect y="12.31" width="60" height="3.08" fill="#b22234"/><rect y="18.46" width="60" height="3.08" fill="#b22234"/><rect y="24.62" width="60" height="3.08" fill="#b22234"/><rect y="30.77" width="60" height="3.08" fill="#b22234"/><rect y="36.92" width="60" height="3.08" fill="#b22234"/><rect width="26" height="21.54" fill="#3c3b6e"/><path d="M3 2.4H23" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="1.2 2.6" fill="none"/><path d="M4.3 6.0H21.7" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="1.2 2.6" fill="none"/><path d="M3 9.6H23" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="1.2 2.6" fill="none"/><path d="M4.3 13.2H21.7" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="1.2 2.6" fill="none"/><path d="M3 16.8H23" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="1.2 2.6" fill="none"/>',
  mx: '<rect width="20" height="40" fill="#006847"/><rect x="20" width="20" height="40" fill="#ffffff"/><rect x="40" width="20" height="40" fill="#ce1126"/><circle cx="30" cy="20" r="5.5" fill="#9c6b3c"/><circle cx="30" cy="20" r="3.2" fill="#4f8a3a"/>',
  br: '<rect width="60" height="40" fill="#009c3b"/><polygon points="30,4 56,20 30,36 4,20" fill="#ffdf00"/><circle cx="30" cy="20" r="9.5" fill="#002776"/><path d="M21 18.5Q30 14.5 39 20.5L38.6 23Q30 17.5 21.5 21.2Z" fill="#ffffff"/>',
  cn: '<rect width="60" height="40" fill="#de2910"/><polygon points="11.0,4.0 12.6,8.8 17.7,8.8 13.5,11.8 15.1,16.7 11.0,13.7 6.9,16.7 8.5,11.8 4.3,8.8 9.4,8.8" fill="#ffde00"/><polygon points="20.2,2.3 21.2,3.7 22.8,3.1 21.9,4.5 22.9,5.8 21.3,5.3 20.4,6.7 20.3,5.0 18.7,4.6 20.3,4.0" fill="#ffde00"/><polygon points="25.4,7.7 25.6,9.4 27.3,9.7 25.8,10.4 26.0,12.1 24.8,10.9 23.3,11.6 24.1,10.1 23.0,8.9 24.6,9.2" fill="#ffde00"/><polygon points="24.8,14.7 25.5,16.2 27.1,16.1 25.9,17.2 26.5,18.7 25.1,17.9 23.8,19.0 24.2,17.3 22.8,16.5 24.4,16.3" fill="#ffde00"/><polygon points="20.2,20.8 21.2,22.2 22.8,21.6 21.9,23.0 22.9,24.3 21.3,23.8 20.4,25.2 20.3,23.5 18.7,23.1 20.3,22.5" fill="#ffde00"/>',
  kr: '<rect width="60" height="40" fill="#ffffff"/><path d="M21 20a9 9 0 0 1 18 0z" fill="#cd2e3a"/><path d="M39 20a9 9 0 0 1-18 0z" fill="#0047a0"/><circle cx="34.5" cy="20" r="4.5" fill="#cd2e3a"/><circle cx="25.5" cy="20" r="4.5" fill="#0047a0"/><path d="M-4.5 -2.4H4.5M-4.5 0H4.5M-4.5 2.4H4.5" transform="translate(8 7) rotate(-34)" stroke="#000000" stroke-width="1.3" fill="none"/><path d="M-4.5 -2.4H4.5M-4.5 0H4.5M-4.5 2.4H4.5" transform="translate(52 7) rotate(34)" stroke="#000000" stroke-width="1.3" fill="none"/><path d="M-4.5 -2.4H4.5M-4.5 0H4.5M-4.5 2.4H4.5" transform="translate(8 33) rotate(34)" stroke="#000000" stroke-width="1.3" fill="none"/><path d="M-4.5 -2.4H4.5M-4.5 0H4.5M-4.5 2.4H4.5" transform="translate(52 33) rotate(-34)" stroke="#000000" stroke-width="1.3" fill="none"/>',
  jp: '<rect width="60" height="40" fill="#ffffff"/><circle cx="30" cy="20" r="12" fill="#bc002d"/>',
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
  // `data-fit` (a share of the canvas's height) picks the largest whole-number scale that fits, so pixels stay crisp.
  const box = el.dataset.fit ? el.closest('.fit') : null
  const scale = box
    ? Math.max(1, Math.floor(Math.min((box.clientHeight * Number(el.dataset.fit)) / rows.length, (box.clientWidth * 0.28) / rows[0].length)))
    : Number(el.dataset.scale || 6)
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
  const dot = r.ch ? '<i class="dot"></i>' : ''
  const label = r.l ? `<span class="il">${dot}${r.l}</span>` : ''
  switch (r.t) {
    case 'num':
      return `<div class="ir">${label}<span class="scrub">${r.v}${r.u ? `<small>${r.u}</small>` : ''}</span></div>`
    case 'read':
      return `<div class="ir">${label}<span class="rd">${r.v}</span></div>`
    // A slider says what its two ends mean; its number is in More (a page can ask for it with `num`).
    case 'slider':
      return `<div class="ir sl">${label}${r.num ? `<span class="scrub">${r.v}</span>` : '<span></span>'}<span class="track"><i style="--at:${r.at}%"></i></span><span class="ends"><span>${r.lo}</span><span>${r.hi}</span></span></div>`
    // Choices that do not fit the panel as segments become a dropdown.
    case 'choice':
      if (r.opts.join('').length > 30) return insRow({ ...r, t: 'pick', v: r.opts[r.on] })
      return `<div class="ir${r.opts.join('').length + (r.l || '').length > 24 || r.opts.join('').length > 18 || !r.l ? ' wide' : ''}">${label}<span class="segs">${r.opts.map((o, i) => `<button class="${i === r.on ? 'on' : ''}">${o}</button>`).join('')}</span></div>`
    case 'sw':
      return `<div class="ir">${label}<span class="tog${r.on ? ' on' : ''}"></span></div>`
    case 'pick':
      return `<div class="ir">${label}<span class="drop">${pic(r)}<span>${r.v}</span>${icon('caret-down')}</span></div>`
    case 'text':
      return `<div class="ir tx">${label}<span class="tbox">${r.v}</span></div>`
    case 'btns':
      return `<div class="ibtns" style="--n:${r.b.length === 4 ? 2 : r.b.length}">${r.b.map(([w, ic, main]) => `<button class="sbtn${main ? ' main' : ''}">${icon(ic)}${w}</button>`).join('')}</div>`
    case 'html':
      return r.h
    default:
      return `<p class="inote">${r.l}</p>`
  }
}

// What is not built yet is drawn as it will be: no "Soon" on any screen.
const soon = /<span class="soon">Soon<\/span>|\s*Soon\b/

// The inspector shows the few values that matter for what is picked (at most `keep`), under the group they belong to;
// everything else is one "More" line, and under it the same values as the file's text, for an agent.
function inspector(v, keep) {
  let shown = 0
  let hidden = 0
  let changed = false
  const parts = []
  for (const g of v.groups) {
    const rows = g.open ? g.rows : []
    const take = []
    for (const r of rows) {
      const counts = r.t !== 'btns' && r.t !== 'html' && r.t !== 'note' && r.t !== undefined
      if (shown < keep || !counts) {
        if (counts) shown++
        if (r.ch) changed = true
        take.push(r)
      } else hidden++
    }
    if (!g.open) hidden += g.count || 1
    if (take.length) parts.push(`<div class="igroup"><h4>${g.name.replace(soon, '')}</h4>${take.map(insRow).join('')}</div>`)
  }
  return `<header class="ihead">${v.pic ? pic(v.pic) : ''}<span class="it"><b>${v.title}${changed ? '<i class="dot" title="Changed, not shared yet"></i>' : ''}</b><small>${v.sub || ''}</small></span><button class="ib ihide" title="Hide this panel">${icon('sidebar-simple')}</button></header>
    <div class="ibody">${v.top || ''}${parts.join('')}
      ${hidden ? `<button class="more">${icon('caret-right')}More<span class="n">${hidden}</span></button>` : ''}
      <button class="astext">${icon('file-text')}Show as text, for agents</button></div>`
}

function layers(l) {
  return l.rows
    .map((r) =>
      r.head
        ? `<div class="lh">${r.head}</div>`
        : `<div class="lr${r.on ? ' on' : ''}${r.hid ? ' hid' : ''}" style="--d:${r.d || 0}">${pic(r)}<span class="ln">${r.n}</span>${r.warn ? icon('warning') : ''}${r.hid ? icon('eye-slash') : ''}${r.lock ? `<span title="Locked so it can't move by mistake. Tap to unlock.">${icon('lock-simple')}</span>` : ''}</div>`,
    )
    .join('')
}

function assets(lib) {
  return `<div class="afil">${(lib.filters || ['All']).map((f, i) => `<button class="${i === (lib.on || 0) ? 'on' : ''}">${f}</button>`).join('')}</div>
    <div class="agrid">${lib.items.map((it) => `<div class="ai${it.on ? ' on' : ''}">${pic(it)}<span>${it.n}</span></div>`).join('')}</div>`
}

// The left panel: everything in what is open, and the game's things to add. A part with nothing to add has no
// Assets tab.
function leftPanel(m) {
  if (!m.library?.items?.length) m.library = null
  const onAssets = !m.list && m.library
  const body = m.list ? layers(m.list) : m.library ? assets(m.library) : '<p class="empty">Nothing here yet. Press Place, or drag something in from Assets.</p>'
  return `<aside class="sh-left">
    <nav class="ltabs"><button class="${onAssets ? '' : 'on'}">${m.list?.tab || 'Everything here'}</button>${m.library ? `<button class="${onAssets ? 'on' : ''}">Assets</button>` : ''}<button class="ib" aria-label="Hide" title="Hide this panel">${icon('sidebar-simple')}</button></nav>
    <div class="lsearch">${icon('magnifying-glass')}<span>Find</span></div>
    <div class="lbody">${body}</div>
  </aside>`
}

// Play in place: the level runs where it is drawn. Pause, one step, slow, start again, play from here, and the
// last 30 seconds to drag back through. Every control says what it does.
function playbar(p) {
  return `<div class="sh-play">
    <button class="ib" title="${p.paused ? 'Go on' : 'Pause'}">${icon(p.paused ? 'play' : 'pause')}</button>
    <button class="ib" title="One step">${icon('skip-forward')}</button>
    <span class="segs">${['Normal', 'Slow', 'Slower'].map((s, i) => `<button class="${i === (p.speed || 0) ? 'on' : ''}">${s}</button>`).join('')}</span>
    <button class="ib w" title="Start again">${icon('arrow-counter-clockwise')}<span>Start again</span></button>
    <button class="ib w" title="Play from here">${icon('map-pin')}<span>Play from here</span></button>
    <span class="rew" title="Drag back to see it again"><i style="--at:${p.at || 100}%"></i></span><span class="t">${p.time || '0:12'}<button class="spd" title="How fast">${['Normal', 'Slow', 'Slower'][p.speed || 0]}${icon('caret-down')}</button></span>
    <button class="ib w stop" title="Stop">${icon('stop')}<span>Stop</span></button>
  </div>`
}

// A timeline from data: a ruler, then rows each with keys (at % of the length), bars and marked moments.
function timeline(t) {
  const ruler = `<div class="ruler-n">${t.unit || 'seconds'}</div><div class="ruler-t">${t.ruler.map((r, i) => `<span style="left:${(i / (t.ruler.length - 1)) * 100}%">${r}</span>`).join('')}</div>`
  const rows = t.rows
    .map((r) => {
      const keys = (r.keys || []).map((k, i) => `<i class="key${r.onKey === i ? ' on' : ''}" style="left:${k}%"></i>`).join('')
      const bars = (r.bars || []).map(([a, b, w, c]) => `<span class="bar ${c || ''}" style="left:${a}%;width:${b - a}%">${w || ''}</span>`).join('')
      const evts = (r.evts || []).map(([a, w]) => `<span class="evt${a > 55 ? ' r' : ''}" style="left:${a}%"><span>${w}</span></span>`).join('')
      return `<div class="tn${r.on ? ' on' : ''}" style="--d:${r.d || 0}">${r.i ? icon(r.i) : ''}<span class="tnw">${r.n}</span></div><div class="tt">${bars}${keys}${evts}</div>`
    })
    .join('')
  return `<div class="tlwrap" style="--at:${t.at || 0}"><div class="tl" style="--cols:${t.cols || 16}">${ruler}${rows}</div><i class="playhead"></i></div>`
}

function frame(m) {
  const editor = EDITORS.find(([word]) => word.toLowerCase() === m.editor)
  const n = changesOf(m)
  const fine = m.hand ? m.hand === 'fine' : !(navigator.maxTouchPoints > 0)
  const parts = (m.parts || [])
    .map(([word], i) => `<button class="${i === m.part ? 'on' : ''}">${word}</button>`)
    .join('')
  const here = (m.parts || [])[m.part]?.[0] || ''
  const ws = EDITORS.map(([word]) =>
    word === editor[0]
      ? `<span class="ws on"><b>${word}</b><span class="parts">${parts}</span></span>`
      : `<button class="ws">${word}</button>`,
  ).join('')
  const was = (m.tools?.[m.tool]?.[0] || 'pick').toLowerCase()
  const tool = m.t ?? (m.play ? 4 : TOOL_OF[was] ?? 0)
  // A tool with no job on this page is dimmed, and says why when pressed; `jobs` names each tool's job here.
  const off = m.off || []
  const tools = TOOLS.map(([word, ic, key], i) => {
    const job = m.jobs?.[i] || word
    const why = off.includes(i) ? ` · nothing to ${word.toLowerCase()} here` : ''
    return `<button class="tl2${i === tool ? ' on' : ''}${off.includes(i) || (m.play && i < 4) ? ' off' : ''}" title="${job}${why}${fine ? ` (${key})` : ''}">${icon(i === 4 && m.play ? 'stop' : ic)}<span>${i === 4 && m.play ? 'Stop' : word}</span></button>`
  }).join('')
  const problems = (m.closed || []).find(([w]) => w === 'Problems')?.[2]
  // The device's own word: a computer, a phone (small or on its side), or an iPad.
  const small = window.innerWidth <= 500 || window.innerHeight <= 600
  const device = fine ? 'computer' : small ? 'phone' : 'iPad'
  const status = n ? `${icon('check')}<span class="long">Saved on this ${device}</span><span class="short">Saved</span>` : `${icon('check')}<span class="long">Everyone has your changes</span><span class="short">Shared</span>`
  // The tool's own options sit inside the toolbar, beside the tool they belong to. "All levels" is the level's menu.
  const opts = (m.settings || []).filter((o) => !/All levels/.test(o))
  const html = `
  <header class="sh-top">
    <button class="game" title="Crate Game: open another game, keep a copy, settings"><i class="logo"></i><span>Crate Game</span>${icon('caret-down')}</button>
    <nav class="sh-ws">${ws}</nav>
    ${m.place && m.place !== here ? `<button class="place" title="All ${here.toLowerCase()}">${m.place}${icon('caret-down')}</button>` : ''}
    <button class="wsn"><b>${editor[0]}</b>${icon('caret-down')}</button>
    <button class="partn"><span class="pt">${here}${m.place && m.place !== here ? `<span class="pp"> · ${m.place}</span>` : ''}</span>${icon('caret-down')}</button>
    <span class="fill"></span>
    ${problems ? `<button class="ib warn" title="Open the list of problems">${icon('warning')}<span>${problems}<span class="pw"> problem${problems > 1 ? 's' : ''}</span></span></button>` : ''}
    <button class="ib cmdk" title="Find or do anything">${icon('magnifying-glass')}${fine ? '<kbd>⌘K</kbd>' : '<span>Find</span>'}</button>
    <span class="faces" title="Sam and Mia are here"><span class="face">S</span><span class="face b">M</span></span>
    <span class="kept">${status}</span>
    <button class="share">${icon('share-network')}<span class="w">Share</span>${n ? `<span class="n">${n}<span class="nw"> new</span></span>` : ''}</button>
  </header>
  ${leftPanel(m)}
  ${m.values ? `<aside class="sh-right">${inspector(m.values, m.keep || 5)}</aside>` : ''}
  ${m.bottom ? `<section class="dockbottom sh-bottom"><header class="bh"><b>${m.bottom.title}</b>${m.bottom.head || ''}</header><div class="bbody">${m.bottom.tl ? timeline(m.bottom.tl) : ''}${m.bottom.html || ''}</div></section>` : ''}
  ${m.play ? playbar(m.play) : ''}
  <div class="sh-tools">
    <nav class="tbar"><button class="tl2 lay" title="Everything here and Assets">${icon('stack')}<span>List</span></button>${tools}<i class="div"></i><button class="tl2 u" title="${fine ? 'Undo (⌘Z)' : 'Undo · press and hold for Redo'}">${icon('arrow-counter-clockwise')}<span>Undo</span></button><button class="tl2 u r" title="Redo">${icon('arrow-clockwise')}<span>Redo</span></button>${opts.length ? `<i class="div o"></i><button class="tl2 ob${m.optsOpen ? ' on' : ''}" title="How this tool works and what the canvas shows">${icon('sliders-horizontal')}<span>Options</span></button>` : ''}<button class="tz" title="Zoom: pinch, or press to pick">${m.zoom || '100%'}</button></nav>
    ${opts.length && m.optsOpen ? `<div class="opop"><b>Options</b>${opts.map((o) => `<div class="orow">${o}</div>`).join('')}</div>` : ''}
  </div>`
  document.body.insertAdjacentHTML('beforeend', html)
  for (const el of document.querySelectorAll('.pop')) el.innerHTML = el.innerHTML.replaceAll('this iPad', `this ${device}`)
  const cls = ['sh', m.list || m.library ? 'has-left' : 'no-left', m.values ? 'has-right' : 'no-right']
  if (m.play) cls.push('playing')
  if (m.bottom) cls.push('has-bottom2')
  if (opts.length) cls.push('has-opts')
  cls.push(fine ? 'fine' : 'touch')
  document.body.classList.add(...cls, ...(m.body || []))
  // An agent's change waits on the canvas as a ghost: where the thing would go, what the agent says, Keep or Undo.
  // Its card sits beside the ghost with a pointer; a teammate's note folds to a pin while it is open.
  const stage = document.querySelector('.stage')
  if (m.ghost && stage) {
    const g = m.ghost
    document.body.classList.add('has-ghost')
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
    `<div class="compare2">${one('touch', 'Rows big enough for a finger')}${one('fine', 'Small rows for a mouse, a trackpad or a hovering Pencil')}</div>`,
  )
}
Object.assign(PIXELS, window.MOCK.pixels || {})
Object.assign(PAL, window.MOCK.pal || {})
for (const el of document.querySelectorAll('[data-i]')) el.style.setProperty('--icon', `url("${ICONS}${el.dataset.i}.svg")`)
for (const el of document.querySelectorAll('[data-flag]'))
  el.innerHTML = `<svg viewBox="0 0 60 40" aria-hidden="true">${FLAGS[el.dataset.flag]}</svg>`
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
