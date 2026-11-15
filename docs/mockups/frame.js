// The shared frame every mockup page borrows, built from the page's `window.MOCK`. Round three draws one shell
// own settings row, the cluster, the tools (each with its key), the "What's in it" list, the values panel, the
// Library drawer, the play controls, the selection bar, the notes' switch, the zoom, the title block and undo and
// redo. It also fills in the Phosphor icons (`data-i`), the flags (`data-flag`) and the sketched pixel figures
// (`data-pixel`). Static pictures only: no button here does anything.

// The Phosphor icons the pages use, copied into assets/icons/ (the package left with the slice cut, Editors #54).
const ICONS = 'assets/icons/'

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
  // The editors' own three extra languages (the language card, before the welcome): Russian, German, French.
  ru: '<rect width="60" height="13.4" fill="#ffffff"/><rect y="13.3" width="60" height="13.4" fill="#0039a6"/><rect y="26.6" width="60" height="13.4" fill="#d52b1e"/>',
  de: '<rect width="60" height="13.4" fill="#000000"/><rect y="13.3" width="60" height="13.4" fill="#dd0000"/><rect y="26.6" width="60" height="13.4" fill="#ffce00"/>',
  fr: '<rect width="20" height="40" fill="#0055a4"/><rect x="20" width="20" height="40" fill="#ffffff"/><rect x="40" width="20" height="40" fill="#ef4135"/>',
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
// notes in Sound; Join links cards in Story), so learning one workspace teaches all five. The toolbar holds tools
// and nothing else: Play, Undo and Redo are in the top bar (the Owner, 2026-11-15).
const TOOLS = [
  // "Pick", not "Move": every hint says pick, and moving the view is "Slide the view" (plain-words audit, W3).
  ['Pick', 'cursor', 'V'],
  ['Place', 'plus-square', 'A'],
  ['Paint', 'paint-brush', 'B'],
  ['Erase', 'eraser', 'E'],
  // "Join", not "Draw path": it joins a button to its door, or draws where someone walks (the Owner, 2026-11-15).
  ['Join', 'link', 'L'],
]
// Pages name tools by round two's numbers (0 Pick, 1 Place, 2 Paint, 3 Join, 4 Play); this turns one into its
// place in the toolbar. Play is no longer a tool (-1).
const toolAt = (i) => (i === 3 ? 4 : i === 4 ? -1 : i)
// Round two's tools, mapped onto the five.
const TOOL_OF = {
  pick: 0, hand: 0, pose: 0, mirror: 0, select: 0, find: 0,
  add: 1, 'add a key': 1, 'add a card': 1, 'add a loop': 1, 'add a part': 1, note: 1, camera: 1, record: 1,
  paint: 2, pencil: 2, scatter: 2, fill: 2, box: 2, light: 2, 'pick a color': 2,
  link: 3, zone: 3, measure: 3, line: 3, trim: 3, cut: 3, 'onion skin': 3,
  play: 4, 'try it': 4,
  // erase is the toolbar's own Erase, set apart below
}

// What each editor's own changes are, for the Share button.
const changesOf = (m) => m.changes || Number((/(\d+) change/.exec(m.saved || '') || [])[1] || 0)

function insRow(r) {
  const dot = r.ch ? '<i class="dot"></i>' : ''
  const label = r.l ? `<span class="il">${dot}${r.l}</span>` : ''
  switch (r.t) {
    // A value that is words, not a number ("Not the same"), is set in the words font, not the numbers' (W12).
    case 'num':
      return `<div class="ir">${label}<span class="scrub${/\d/.test(r.v) ? '' : ' wd'}">${r.v}${r.u ? `<small>${r.u}</small>` : ''}</span></div>`
    case 'read':
      return `<div class="ir">${label}<span class="rd">${r.v}</span></div>`
    // A slider says what its two ends mean in words, and its number sits at the right of its label: a tap opens the
    // number pad, so a value can be matched exactly.
    case 'slider':
      // `w` is a plain word for where the slider sits ("Quite heavy"); the number stays beside it, small (W22).
      return `<div class="ir sl">${label}<span class="scrub${r.w || !/\d/.test(r.v) || /[a-z]/.test(r.v) ? ' wd' : ''}">${r.w ? `${r.w}<small>${r.v}</small>` : r.v}</span><span class="track"><i style="--at:${r.at}%"></i></span><span class="ends"><span>${r.lo}</span><span>${r.hi}</span></span></div>`
    // Choices that do not fit the panel as segments become a dropdown.
    case 'choice':
      if (r.opts.length >= 4 || r.opts.join('').length > 30) return insRow({ ...r, t: 'pick', v: r.opts[r.on] })
      return `<div class="ir${r.opts.join('').length + (r.l || '').length > 24 || r.opts.join('').length > 18 || !r.l ? ' wide' : ''}">${label}<span class="segs">${r.opts.map((o, i) => `<button class="${i === r.on ? 'on' : ''}">${o}</button>`).join('')}</span></div>`
    case 'sw':
      // A long label wraps; the switch stays at the right of its row, like every other switch (Fable pass, F37).
      return `<div class="ir${(r.l || '').length > 26 ? ' sww' : ''}">${label}<span class="tog${r.on ? ' on' : ''}"></span></div>`
    case 'pick':
      return `<div class="ir${!r.l || (r.l || '').length + String(r.v).length > 30 ? ' wide' : ''}">${label}<span class="drop">${pic(r)}<span>${r.v}</span>${icon('caret-down')}</span></div>`
    case 'text':
      return `<div class="ir tx">${label}<span class="tbox">${r.v}</span></div>`
    case 'btns':
      const words = r.b.reduce((s, [w]) => s + w.length, 0)
      const cols = r.b.length === 1 ? 1 : r.b.length === 4 ? 2 : words > 26 || r.b.some(([w]) => w.length > 14) ? 1 : r.b.length
      return `<div class="ibtns${cols === 3 ? ' three' : ''}" style="--n:${cols}">${r.b.map(([w, ic, main]) => `<button class="sbtn${main ? ' main' : ''}">${icon(ic)}${w}</button>`).join('')}</div>`
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
// The kind under a name only when it says something the name does not: "Crate 1" needs no "Crate" (F37).
const kindLine = (v) => {
  const kind = (v.sub || '').split(' · ')[0]
  const name = String(v.title).replace(/<[^>]+>/g, '')
  return kind && !name.toLowerCase().startsWith(kind.toLowerCase()) ? `<small>${kind}</small>` : ''
}

// One order for every thing (Fable pass, F17 and F18): what it does first, then how it looks, then where it is, which
// dragging already sets, so its numbers are needed least. "Place" is the tool's name, so the group is "Where it is",
// and "Drawn" (in front of or behind the hero) is part of the look. Both "From the top" and "Drawn" are rows the 2D
// World adds, not rows the shell owns (F35): the shell lays "Where it is" out as a list, so 3D adds a third number.
const FIRST = ['What it does', 'Painted', 'Standing on it']
const LOOKS = ['Look', 'Shape']
function inOrder(groups) {
  const gs = groups.map((g) => ({ ...g, name: g.name === 'Place' ? 'Where it is' : g.name.replace('Colors', 'Colours'), rows: [...g.rows] }))
  const where = gs.find((g) => g.name === 'Where it is')
  const look = gs.find((g) => LOOKS.includes(g.name))
  if (where && look) {
    const drawn = where.rows.filter((r) => r.f === 'layer')
    where.rows = where.rows.filter((r) => r.f !== 'layer')
    look.rows.push(...drawn)
  }
  const rank = (g) => (FIRST.includes(g.name) ? 0 : LOOKS.includes(g.name) ? 1 : g.name === 'Where it is' ? 3 : 2)
  return gs.map((g, i) => [g, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([g]) => g)
}

function inspector(v, keep) {
  let shown = 0
  let hidden = 0
  let changed = false
  const parts = []
  for (const g of inOrder(v.groups)) {
    const rows = g.open ? g.rows : []
    const take = []
    // A group shows whole or folds into "more settings": never one number of two (F18).
    const counted = rows.filter((r) => r.t !== 'btns' && r.t !== 'html' && r.t !== 'note' && r.t !== undefined).length
    const fits = shown + counted <= keep || shown === 0
    for (const r of rows) {
      const counts = r.t !== 'btns' && r.t !== 'html' && r.t !== 'note' && r.t !== undefined
      if (!fits && rows.length) {
        if (counts) hidden++
        continue
      }
      if (shown < keep || !counts) {
        if (counts) shown++
        if (r.ch) changed = true
        take.push(r)
      } else hidden++
    }
    if (!g.open) hidden += g.count || 1
    // A changed value's dot, tapped, says what it means and offers to put it back (F19).
    const row = (r) => insRow(r) + (r.ch === 'open' ? `<div class="dotpop"><i class="dot"></i><span>Changed, only on this iPad so far.</span><button class="sbtn">Put it back</button></div>` : '')
    if (take.length) parts.push(`<div class="igroup"><h4>${g.name.replace(soon, '')}</h4>${take.map(row).join('')}</div>`)
  }
  // Hiding the settings says where they go: a tab at the right edge, named for the thing, brings them back (the
  // end-to-end actions check, H1). On a phone the sheet closes with Done instead (H2); only one of the two shows.
  const named = String(v.title).replace(/<[^>]+>/g, '')
  return `<header class="ihead">${v.pic ? pic(v.pic) : ''}<span class="it" title="${(v.sub || '').replace(/"/g, '')}"><b>${changed ? v.title.replace(/(\S+)$/, '<span class="nw">$1<i class="dot" title="Changed, only on this device so far"></i></span>') : v.title}</b>${kindLine(v)}</span><button class="ib imore" title="More to do with ${named}: rename it, lock it, hide it, copy it, add a note">${icon('dots-three')}</button><button class="ib ihide" title="Hide the settings. Tap ${named} at the right edge to bring them back">${icon('sidebar-simple')}</button><button class="sbtn idone" title="Close the settings">Done</button></header>
    <div class="ibody">${v.top || ''}${parts.join('')}
      ${hidden ? `<button class="more">${icon('caret-right')}${hidden} more setting${hidden > 1 ? 's' : ''}</button>` : ''}</div>`
}

function layers(l) {
  return l.rows
    .map((r) =>
      r.head
        ? r.fold === undefined
          ? `<div class="lh">${r.head}</div>`
          : // A group that folds: its caret, its name and how many are in it, so a list of hundreds stays short.
            `<div class="lh fold${r.on ? ' on' : ''}${r.faint ? ' faint' : ''}" style="--d:${r.d || 0}">${r.sw ? `<i class="pic swatch" style="background:${r.sw}"></i>` : ''}${icon(r.fold ? 'caret-right' : 'caret-down')}<span>${r.head}</span><span class="n">${r.count}</span></div>`
        : r.rest
          ? `<div class="lr rest" style="--d:${r.d || 0}">${r.rest}</div>`
          : `<div class="lr${r.on ? ' on' : ''}${r.hid ? ' hid' : ''}" style="--d:${r.d || 0}"${r.title ? ` title="${r.title}"` : ''}>${pic(r)}<span class="ln">${r.n}</span>${r.warn ? icon('warning') : ''}${r.hid ? icon('eye-slash') : ''}${r.lock ? `<span class="lk" title="Locked so it can't move by mistake. Tap to unlock.">${icon('lock-simple')}</span>` : ''}</div>`,
    )
    .join('')
}

function assets(lib) {
  return `<div class="afil">${(lib.filters || ['All']).map((f, i) => `<button class="${i === (lib.on || 0) ? 'on' : ''}">${f}</button>`).join('')}</div>
    <div class="agrid">${lib.items.map((it) => `<div class="ai${it.on ? ' on' : ''}">${pic(it)}<span>${it.n}</span></div>`).join('')}</div>`
}

// One name for the list everywhere: the rail, the tab, the phone's button (Fable pass, F16).
const listNameOf = (m) => m.list?.tab || (m.mapOn ? 'All levels' : { Levels: 'In this level', Scenes: 'In this scene', Tiles: 'Tiles' }[(m.parts || [])[m.part]?.[0]] || 'In this level')

// The left panel: everything in what is open, and the game's things to add. Both tabs show on every page, so a
// new person learns the second one is there.
function leftPanel(m) {
  const hasAssets = true
  // The list's name says what it lists (W4): this level, this scene, the tiles, or every level on the map.
  const here = (m.parts || [])[m.part]?.[0]
  const listName = listNameOf(m)
  if (!m.library?.items?.length) m.library = null
  const onAssets = !m.list && m.library
  const body = m.list ? layers(m.list) : m.library ? assets(m.library) : '<p class="empty">Nothing here yet. Press Place, or drag something in from Add things.</p>'
  // Closed, on an iPad, the panel is a thin rail: one tap on either opens it (the Owner, 2026-11-15). The top bar's
  // Find filters this list as you type, so the list has no Find of its own.
  return `<aside class="sh-left">
    <nav class="lrail"><button class="ib on" title="${listName}: open the list">${icon('list-bullets')}<span>List</span></button>${m.mapOn ? '' : `<button class="ib" title="Add things: open the things to add">${icon('shapes')}<span>Add</span></button>`}<i class="rdiv"></i></nav>
    <nav class="ltabs"><button class="${onAssets ? '' : 'on'}">${listName}</button>${hasAssets ? `<button class="${onAssets ? 'on' : ''}">Add things</button>` : ''}<button class="ib" aria-label="Hide" title="Close to the rail">${icon('sidebar-simple')}</button><button class="sbtn lclose" title="Close the list">Close</button></nav>
    <div class="lbody">${body}</div>
  </aside>`
}

// Play in place: the level runs where it is drawn. Pause, one step, slow, start again, play from here, and the
// last 30 seconds to drag back through. Every control says what it does.
function playbar(p, tryIt) {
  return `<div class="sh-play">
    <button class="ib w" title="${p.paused ? 'Go on' : 'Pause'}">${icon(p.paused ? 'play' : 'pause')}<span>${p.paused ? 'Go on' : 'Pause'}</span></button>
    <button class="ib w" title="One step">${icon('skip-forward')}<span>One step</span></button>
    <span class="segs">${['Normal', 'Slow', 'Slower'].map((s, i) => `<button class="${i === (p.speed || 0) ? 'on' : ''}">${s}</button>`).join('')}</span>
    <button class="ib w" title="From the start">${icon('skip-back')}<span>From the start</span></button>
    <button class="ib w${p.pick ? ' on' : ''}" title="Play from here: tap the level where the hero should start">${icon('map-pin')}<span>Play from here</span></button>
    <span class="rew" title="Drag back to see it again"><i style="--at:${p.at || 100}%"></i></span><span class="t">${p.time || '0:12'}<button class="spd" title="How fast">${['Normal', 'Slow', 'Slower'][p.speed || 0]}${icon('caret-down')}</button></span>
    ${tryIt ? `<button class="ib w try${tryIt.open ? ' on' : ''}" title="Try a change while it plays">${icon('sliders-horizontal')}<span>Try a change</span></button>` : ''}
    ${p.big ? `<button class="ib w big on" title="Smaller: bring the panels back">${icon('arrows-in')}<span>Smaller</span></button>` : `<button class="ib w big" title="Bigger: hide the panels while playing">${icon('arrows-out')}<span>Bigger</span></button>`}
    ${p.hint ? `<span class="phint">${p.hint}</span>` : ''}
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
  const here = (m.parts || [])[m.part]?.[0] || ''
  const was = (m.tools?.[m.tool]?.[0] || 'pick').toLowerCase()
  const tool = m.play ? -1 : m.t != null ? toolAt(m.t) : was === 'erase' ? 3 : toolAt(TOOL_OF[was] ?? 0)
  // A tool with no job on this page is left out; Erase goes with Paint. `jobs` names each tool's job here.
  const off = (m.off || []).map(toolAt)
  if (off.includes(2) && !m.erase) off.push(3)
  const jobs = []
  for (const [i, j] of (m.jobs || []).entries()) if (j) jobs[toolAt(i)] = j
  const tools = TOOLS.map(([word, ic, key], i) => {
    const job = jobs[i] || word
    return `<button class="tl2${i === tool ? ' on' : ''}${off.includes(i) ? ' off' : ''}" title="${job}${fine ? ` (${key})` : ''}">${icon(ic)}<span>${word}</span></button>`
  }).join('')
  const problems = (m.closed || []).find(([w]) => w === 'Problems')?.[2]
  // The device's own word: a computer, a phone (small or on its side), or an iPad.
  const small = window.innerWidth <= 500 || window.innerHeight <= 600
  const device = fine || (m.hand === 'pencil' && !(navigator.maxTouchPoints > 0)) ? 'computer' : small ? 'phone' : 'iPad'
  // An iPad held sideways (or any touch screen that wide) keeps its tools down the left edge, as a phone on its side
  // does, so the bottom is free for one tray (the Owner, 2026-11-15: F2).
  const side = !fine && window.innerWidth > 1000 && window.innerHeight > 600
  // Where the changes are, in words that cannot be read as "done" (W2): only on this device until they are put in
  // the game, then everyone has them. It is the button's second line, so the top bar holds one thing fewer (S6).
  // "Share" is kept for the people screen (who may do what); this button puts changes in the game (W1). Someone
  // who may only suggest sends them to be checked instead.
  const put = m.signedOut ? 'Keep a copy' : m.suggest ? 'Send to check' : 'Put in game'
  // Sent to be checked, the button says who has them (`m.waiting`) until they are put in or sent back (E8).
  // Someone who has not signed in (`m.signedOut`) is alone in the demo game: nobody else's face shows (E9).
  // The same words at every size that has room ("3 only on this iPad"); short of room the line goes and the number
  // stays (F14).
  const where = n ? `<small class="long">${n} only on this ${device}</small>` : ''
  // View holds what the canvas shows; the picked tool's own two or three settings sit beside the toolbar
  // (`toolopts`). "All levels" is the level's menu.
  // The free hand's strip, on a touch screen only: buttons held with the thumb that isn't drawing, where a computer
  // holds a key. It belongs to the shell, not to World: each workspace names its own (3D will add "Turn the view").
  // World's three are on now, on Levels and Scenes only, where they do something (S3); the other workspaces join
  // when they are drawn.
  const holds = m.holds === false ? null : m.holds || (m.editor === 'world' && ((here === 'Levels' && !m.mapOn) || here === 'Scenes') && !m.compare ? [['Pick several', 'selection-plus'], ['Drag a copy', 'copy'], ['Straight lines', 'ruler']] : null)
  // The zoom says how near you are in words (W8); the number is only in Show.
  const pc = /^(\d+)%$/.exec(m.zoom || '100%')
  // Always how near you are now, never a thing to do: "Whole level" is where it rests (F20).
  const zoomWord = pc ? (Number(pc[1]) === 100 ? 'Whole level' : Number(pc[1]) > 100 ? 'Close up' : 'Far away') : m.zoom
  const opts = [...(m.settings || []).filter((o) => !/All levels/.test(o)), `<span>Zoom</span><span class="seg"><button class="on">Whole level</button><button>${/%$/.test(m.zoom || '100%') ? m.zoom || '100%' : '100%'}</button></span>`]
  // Nothing changed yet means nothing to undo: Undo and Redo are drawn faint (F15).
  const faint = n ? '' : ' faint'
  const listName = listNameOf(m)
  // Undo and Redo are a pair on an upright phone, where the top bar has no room for them (the end-to-end actions check,
  // M5): both at the toolbar's end, Redo faint until something has been undone. On the world map, which has no
  // toolbar of tools, a phone keeps just this pair and Play.
  const undoPair = `<button class="tl2 u${faint}" title="Undo · or tap with two fingers">${icon('arrow-counter-clockwise')}<span>Undo</span></button><button class="tl2 u rd${m.redo ? '' : ' faint'}" title="Redo · or tap with three fingers">${icon('arrow-clockwise')}<span>Redo</span></button>`
  const html = `
  <header class="sh-top">
    <button class="game" title="Crate Game: open another game, keep a copy, settings"><i class="logo"></i><span>Crate Game</span>${icon('caret-down')}</button>
    <button class="wsn" title="The five editors: World, Characters, Feel, Sound, Story"><b>${editor[0]}</b>${icon('caret-down')}</button>
    ${m.back ? `<button class="ib backb" title="Back to ${m.back}">${icon('arrow-left')}<span>Back to ${m.back}</span></button>` : ''}
    <button class="partn" title="Other parts, other editors and the game's own menu"><span class="pt">${here}${m.place && m.place !== here ? `<span class="pp"> · ${m.place}</span>` : ''}${m.with ? `<span class="pw2">, shown with ${m.with}</span>` : ''}</span>${icon('caret-down')}</button>
    ${m.editor === 'world' && here === 'Levels' ? `<button class="ib mapb${m.mapOn ? ' on' : ''}" title="Every level on one map. Or pinch out past the whole level">${icon('map-trifold')}<span>Map</span></button>` : ''}
    <span class="fill"></span>
    <button class="ib tu${faint}" title="${fine ? 'Undo (⌘Z)' : 'Undo · or tap with two fingers'}">${icon('arrow-counter-clockwise')}</button><button class="ib tu${faint}" title="${fine ? 'Redo (⇧⌘Z)' : 'Redo · or tap with three fingers'}">${icon('arrow-clockwise')}</button>
    ${problems ? `<button class="ib warn" title="Open the list of problems">${icon('warning')}<span>${problems}<span class="pw"> problem${problems > 1 ? 's' : ''}</span></span></button>` : ''}
    ${m.checks ? `<button class="ib checks" title="Changes people sent you to check">${icon('list-checks')}<span>${m.checks}<span class="cw"> to check</span></span></button>` : ''}
    ${m.offline ? `<span class="offl" title="This device can't reach the internet. Your changes stay on it until it can.">${icon('cloud')}<span>No internet</span></span>` : ''}
    <button class="ib cmdk" title="Find or do anything">${icon('magnifying-glass')}<span>Find</span>${fine ? '<kbd>⌘K</kbd>' : ''}</button>
    ${m.signedOut ? '' : '<span class="faces" title="Sam and Mia are here"><span class="face">S</span><span class="face b">M</span></span>'}
    <button class="tplay${m.play ? ' on' : ''}" title="${m.play ? 'Stop playing and go back to building' : 'Play the level here'}${fine ? ' (P)' : ''}">${icon(m.play ? 'stop' : 'play')}<span>${m.play ? 'Stop' : 'Play'}</span></button>
    ${m.waiting && m.more ? `<button class="share put waiting more" title="You made ${m.more} more change${m.more > 1 ? 's' : ''} since you sent your changes to ${m.waiting}. Send ${m.more > 1 ? 'them' : 'it'} too">${icon('paper-plane-tilt')}<span class="w"><b>Send ${m.more} more to ${m.waiting}</b><small class="long">The rest are with ${m.waiting}</small></span><span class="n">${m.more}</span></button>` : m.waiting ? `<button class="share put quiet waiting" title="Your changes are with ${m.waiting} to check. Tap to see them, or take them back">${icon('paper-plane-tilt')}<span class="w"><b>Waiting for ${m.waiting}</b></span></button>` : `<button class="share put${n ? '' : ' quiet'}" title="${n ? (m.suggest ? 'Send your changes to be checked before they go in the game' : 'Put your changes in the game, so your team sees them') : 'Everyone on the team has your changes'}${fine ? ' (⌘S)' : ''}">${icon(n ? (m.signedOut ? 'download-simple' : m.suggest ? 'paper-plane-tilt' : 'arrow-circle-up') : 'check')}<span class="w"><b>${n ? put : 'Up to date'}</b>${n ? where : ''}</span>${n ? `<span class="n">${n}</span>` : ''}</button>`}
  </header>
  ${leftPanel(m)}
  ${m.values ? `<aside class="sh-right">${inspector(m.values, m.keep || 5)}<button class="itab" title="Show ${m.values.title.replace(/<[^>]+>/g, '')}'s settings">${icon('sidebar-simple')}<span>${m.values.title.replace(/<[^>]+>/g, '')}</span></button><button class="peek" title="Open the settings">${m.values.pic ? pic(m.values.pic) : ''}<span><b>${m.values.title.replace(/<[^>]+>/g, '')}</b> · settings</span>${icon('caret-up')}</button></aside>` : ''}
  ${m.bottom ? `<section class="dockbottom sh-bottom"><header class="bh"><b>${m.bottom.title}</b>${m.bottom.head || ''}</header><div class="bbody">${m.bottom.tl ? timeline(m.bottom.tl) : ''}${m.bottom.html || ''}</div></section>` : ''}
  ${m.play ? playbar(m.play, m.trycard && { open: true }) : ''}
  ${m.trycard ? `<aside class="float trycard"><header><b>${m.trycard.title}</b><button class="ib" title="Close this card">${icon('x')}</button></header>${m.trycard.rows.map(insRow).join('')}<button class="more">${icon('caret-right')}${m.trycard.more}</button></aside>` : ''}
  <div class="sh-tools">
    <nav class="tbar">${m.noTools ? `${undoPair}<button class="tl2 u pl" title="Play the level here">${icon('play')}<span>Play</span></button>` : `<button class="tl2 lay" title="${listName}, and things to add">${icon('stack')}<span>${listName}</span></button>${tools}<i class="div u"></i>${undoPair}<button class="tl2 u pl" title="Play the level here">${icon('play')}<span>Play</span></button><i class="div o"></i><button class="tl2 ob${m.optsOpen ? ' on' : ''}" title="What the level shows: grid, zoom, frames">${icon('eye')}<span>Show</span></button>`}<button class="tz" title="How near you are: pinch, or press to pick">${zoomWord}</button></nav>
    ${m.toolopts && !m.tray ? `<div class="topts">${m.toolopts}</div>` : ''}
    ${m.optsOpen ? `<div class="opop"><b>Show</b>${opts.map((o) => `<div class="orow">${o}</div>`).join('')}</div>` : ''}
  </div>
  ${m.tray ? `<div class="tray">${m.tray.first ? `<p>${m.tray.tip}</p>` : ''}<div class="trow"><div class="titems">${m.tray.items.map((it) => `<button class="ti${it.on ? ' on' : ''}">${pic(it)}<span>${it.n}</span></button>`).join('')}${m.tray.more === false ? '' : `<button class="ti more2">${icon('squares-four')}<span>${m.tray.more || 'All things'}</span></button>`}</div>${m.toolopts ? `<div class="tset">${m.toolopts}</div>` : ''}</div></div>` : ''}
  ${!fine && !m.play && holds ? `<div class="holds${m.holdOpen ? ' open' : ''}" title="Hold with your free thumb, or tap to keep on"><button class="hb hfold" title="${m.holdOpen ? 'Fold the buttons away' : 'Buttons to hold with your free thumb'}">${icon('hand')}<span>Hold</span>${icon(m.holdOpen ? 'caret-left' : 'caret-right')}</button>${holds.map(([w, ic], i) => `<button class="hb${m.holdOn === i ? ' on' : ''}">${icon(ic)}<span>${w}</span></button>`).join('')}</div>` : ''}`
  document.body.insertAdjacentHTML('beforeend', html)
  // Every "this iPad" on the page says the device it is on: a sheet, a toast, a tour card or a settings row
  // (second visual look, M7). The body says which device it is, so a line that only one device needs (the
  // Pencil's) can be left out of the others (`.only-ipad`, `.only-computer`, `.no-phone`).
  document.body.dataset.device = device
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let t = walk.nextNode(); t; t = walk.nextNode())
    if (/[Tt]his iPad/.test(t.data)) t.data = t.data.replace(/([Tt])his iPad/g, `$1his ${device}`)
  const cls = ['sh', m.list || m.library ? 'has-left' : 'no-left', m.values ? 'has-right' : 'no-right']
  // The end-to-end actions check: the settings hidden (a tab at the right edge brings them back, H1), the settings
  // open as a sheet on a phone (H2), a level playing bigger (M7), the free thumb's strip unfolded (L8), "to check" in
  // the top bar (L9), and a computer's list closed to its rail (M1).
  if (m.values && m.hiddenRight) cls.push('values-hidden')
  if (m.values && m.sheetOpen) cls.push('sheet-open')
  if (m.play?.big) cls.push('play-big')
  if (m.holdOpen) cls.push('hold-open')
  if (m.checks) cls.push('has-checks')
  if (m.back) cls.push('has-back')
  // "See-through panels" in Settings (the Owner, 2026-11-15): 'on' or 'off'; absent means "Choose for me", which
  // follows the device. The stylesheet turns the glass solid for `glass-off` and for a device that asks for less.
  if (m.glass) cls.push(`glass-${m.glass}`)
  // An iPad held sideways starts with the left panel closed to its rail; a computer starts with it open.
  if ((m.list || m.library) && !fine && window.innerWidth > 1000 && !m.leftOpen && !m.leftOver) cls.push('left-closed')
  // A computer shows the list open; `leftClosed` draws it closed to the same rail an iPad has (M1). A phone and an
  // upright iPad open the list over the level (`listSheet`, M2).
  else if ((m.list || m.library) && m.leftClosed && window.innerWidth > 1000) cls.push('left-closed')
  if ((m.list || m.library) && m.listSheet && (window.innerWidth <= 1000 || window.innerHeight <= 600)) cls.push('list-sheet')
  if (m.tray) cls.push('has-tray')
  if (m.play) cls.push('playing')
  if (m.bottom) cls.push('has-bottom2')
  if (opts.length) cls.push('has-opts')
  // A hovering Pencil gets the small rows a mouse gets (the Owner, 2026-11-15), and keeps the touch screen's
  // hold-buttons. Rows change size only when a panel next opens, never under a moving hand.
  cls.push(fine || m.hand === 'pencil' ? 'fine' : 'touch')
  if (side) cls.push('tools-left')
  if (m.toolopts && !m.tray) cls.push('has-topts-only')
  // The big level's list opens over the level instead of pushing it (F1).
  if (m.leftOver) cls.push('left-over')
  if (m.noTools) cls.push('no-tools')
  if (m.hand === 'pencil') cls.push('pencil')
  document.body.classList.add(...cls, ...(m.body || []))
  // An agent's change waits on the canvas as a ghost: where the thing would go, what the agent says, Keep or Undo.
  // Its card sits beside the ghost with a pointer; a teammate's note folds to a pin while it is open.
  const stage = document.querySelector('.stage')
  if (m.ghost && stage) {
    const g = m.ghost
    document.body.classList.add('has-ghost')
    const card = `<div class="agent" style="--ax:${g.card[0]}%;--ay:${g.card[1]}%;left:${g.card[0]}%;top:${g.card[1]}%"><b title="The AI you're chatting with">${icon('sparkle')}${g.who || 'Your helper'}</b><p>${g.text}</p><span><button class="sbtn main">Keep</button><button class="sbtn">Undo</button></span></div>`
    stage.insertAdjacentHTML('beforeend', `<img class="ghost2" src="${g.img}" alt="" style="left:${g.at[0]}%;top:${g.at[1]}%;width:${g.w || 6.25}%">`)
    // On a phone the card is a strip held to the screen, not to the level: the level moves (and can be wider than
    // the screen), so a card inside it ran off the edge with Keep and Undo out of reach (second visual look, H2).
    ;(small ? document.body : stage).insertAdjacentHTML('beforeend', card)
  }
  // What is picked gets a small bar just above it: the everyday acts, where the finger already is. At most four things
  // at any size (Fable pass, F8): several picked get "Line up" (which opens Line up, Space out and Stack); one gets
  // "Nudge", which opens a four-way pad of finger-sized arrows instead of four small ones (F6); "…" holds the rest.
  // A thing the level has only one of has no "Make another", and its Delete says why it can't (F5).
  if (m.act && stage) {
    const a = m.act
    const b = (w, ic, more) => `<button class="ab${more ? ' dd' : ''}" title="${w}">${icon(ic)}<span>${w}</span>${more ? icon('caret-down') : ''}</button>`
    const more = `<button class="ab" title="More things to do">${icon('dots-three')}</button>`
    // A join (a line from a button to its door) is picked by tapping its line: its bar takes it away (M16).
    const items = a.join
      ? `<button class="ab" title="Take away this join">${icon('trash')}<span>Take away this join</span></button>${more}`
      : a.only
      ? `${b('Nudge', 'arrows-out-cardinal')}<button class="ab no" title="${a.only}">${icon('trash')}<span>Delete<small>${a.only}</small></span></button>${more}`
      : a.several
        ? `${b('Line up', 'align-bottom', true)}${b('Make another', 'copy-simple')}${b('Delete', 'trash')}${more}`
        : `${b('Make another', 'copy-simple')}${b('Delete', 'trash')}${b('Nudge', 'arrows-out-cardinal')}${more}`
    const menu = a.menu ? `<div class="amenu"><b>Line them up along</b><span>${[['align-top', 'The top'], ['align-bottom', 'The bottom'], ['align-left', 'The left'], ['align-right', 'The right']].map(([ic, w], i) => `<button class="${i === 1 ? 'on' : ''}">${icon(ic)}<span>${w}</span></button>`).join('')}</span></div>` : ''
    const pad = a.pad ? `<div class="npad"><b>Nudge one tile</b><span>${[['', ''], ['caret-up', 'Up'], ['', ''], ['caret-left', 'Left'], ['', ''], ['caret-right', 'Right'], ['', ''], ['caret-down', 'Down'], ['', '']].map(([ic, w]) => (ic ? `<button title="Nudge ${w.toLowerCase()}">${icon(ic)}</button>` : w === '' ? '<i></i>' : '')).join('')}</span><button class="sbtn">Done</button></div>` : ''
    // The "…" opened (M6): the rest of what can be done to a thing, with its key on a computer. Press and hold on the
    // thing opens the same list. Locking and hiding have their opposite in the same place (Unlock, Show).
    const rest = [['pencil-simple', 'Rename', 'F2'], [a.locked ? 'lock-simple' : 'lock-simple', a.locked ? 'Unlock it' : 'Lock it', '⌘L'], ['eye-slash', a.hidden ? 'Show it' : 'Hide it', '⌘H'], ['copy', 'Copy', '⌘C'], ['arrow-line-up', 'Bring to front', ']'], ['arrow-fat-line-down', 'Send to back', '['], ['note', 'Add a note', '']]
    const restMenu = a.rest ? `<div class="amenu moremenu"><b>${a.rest}</b><span class="mrows">${rest.map(([ic, w, k]) => `<button>${icon(ic)}<span>${w}</span>${fine && k ? `<kbd>${k}</kbd>` : ''}</button>`).join('')}</span></div>` : ''
    // An open menu or pad takes the bar's place, so no more than two things float over the level (S2).
    const inner = menu || restMenu || pad
    stage.insertAdjacentHTML('beforeend', inner ? `<div class="actbar menuonly" style="left:${a.at[0]}%;top:${a.at[1]}%">${inner}</div>` : `<div class="actbar${a.below ? ' below' : ''}" style="left:${a.at[0]}%;top:${a.at[1]}%">${items}</div>`)
    // The bar never leaves the screen and never sits on what is picked: it goes above, below if there is no room
    // above, and slides sideways to stay inside the level's space (F8, F12).
    const bar = stage.lastElementChild
    const room = document.querySelector('.canvas').getBoundingClientRect()
    let r = bar.getBoundingClientRect()
    if (!a.below && r.top < room.top + 8) {
      bar.classList.add('below')
      bar.style.top = `${a.at[1] + (a.h || 11)}%`
      r = bar.getBoundingClientRect()
    }
    // Neither above nor below has room (a tall pad on a phone on its side): it stands beside the thing, on the side
    // with room, and slides up or down to stay on the screen (second visual look, H3).
    if (r.bottom > room.bottom - 8 || r.top < room.top + 8) {
      const w = a.w || 7
      bar.classList.remove('below')
      bar.classList.add('beside')
      bar.style.top = `${a.at[1] + (a.h || 11) / 2}%`
      bar.style.left = `${a.at[0] + w / 2}%`
      r = bar.getBoundingClientRect()
      if (r.right > room.right - 8) {
        bar.classList.add('l')
        bar.style.left = `${a.at[0] - w / 2}%`
        r = bar.getBoundingClientRect()
      }
      const dy = Math.max(room.top + 8 - r.top, 0) + Math.min(room.bottom - 8 - r.bottom, 0)
      if (dy) bar.style.marginTop = `${dy}px`
    }
  }
}

// A tip, a note or the bar over what is picked never runs off the screen: one that would is slid back inside it
// (Fable pass, F33). It runs once the fonts are in, since a line's width changes with its font (second visual look,
// M12); the level can be wider than a phone's screen, so the screen's own edges count too (E15).
function keepInside() {
  // A menu or a note that belongs to a button in the top bar (`data-under="<selector>"`) hangs just under it, as far
  // left as the button, and never past the screen's right edge (the end-to-end actions check: menus drawn open).
  for (const el of document.querySelectorAll('[data-under]')) {
    // The first of the named buttons that is on the screen at this size (a phone has no workspace button).
    const anchor = [...document.querySelectorAll(el.dataset.under)].find((a) => getComputedStyle(a).display !== 'none')
    if (!anchor) continue
    const a = anchor.getBoundingClientRect()
    const w = el.getBoundingClientRect().width
    el.style.top = `${a.bottom + 6}px`
    el.style.left = `${Math.max(8, Math.min(a.left, innerWidth - w - 8))}px`
  }
  const room = document.querySelector('.canvas')?.getBoundingClientRect()
  if (!room) return
  for (const el of document.querySelectorAll('.stage .tip, .stage .lockpop, .stage .actbar')) {
    el.style.marginLeft = ''
    const r = el.getBoundingClientRect()
    const dx = Math.max(Math.max(room.left, 0) + 8 - r.left, 0) + Math.min(Math.min(room.right, innerWidth) - 8 - r.right, 0)
    if (!dx) continue
    // Its width is held first: near the level's right edge a tip is as wide as the room left to it, and sliding it
    // left would only let it grow back to the edge (CI's pictures of the second visual look).
    el.style.width = `${r.width}px`
    el.style.boxSizing = 'border-box'
    el.style.marginLeft = `${dx}px`
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
// A timeline ends on a whole row: rows that would be cut are left out, and the band's header says how many more.
for (const tl of document.querySelectorAll('.tl')) {
  let hidden = 0
  for (const tn of tl.querySelectorAll(':scope > .tn')) {
    if (tn.offsetTop + tn.offsetHeight > tl.clientHeight + 1) {
      tn.style.display = 'none'
      tn.nextElementSibling.style.display = 'none'
      hidden++
    }
  }
  const head = tl.closest('.sh-bottom')?.querySelector('.bh')
  if (hidden && head) head.insertAdjacentHTML('beforeend', `<span class="morerows">${hidden} more row${hidden > 1 ? 's' : ''} below</span>`)
}
// The page is ready for its picture once the fonts are in and everything is slid inside the screen.
document.fonts.ready.then(() => {
  keepInside()
  document.documentElement.dataset.ready = 'yes'
})
