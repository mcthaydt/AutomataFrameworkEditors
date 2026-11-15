// The world map, drawn from one description, so every map page shows the same game and only says what it is about.
// Static pictures, like frame.js: nothing here does anything.
//
// The level links spec (AutomataFramework, specs/2026-11-15-level-links-and-world-map-design.md) decides what the map
// shows: each level at its true size, where the world file's `at` puts it (in tiles); levels whose edges touch along a
// stretch both are open on make one place, where the hero walks straight across, and the map draws that stretch as a
// short bar; a door's way into another level is an arrow from the door to where you come out; the game's start is
// marked. A page sets `window.MAP` and loads this after frame.js:
//
//   levels: [{ n, x, y, w, h, hue, here, picked, lift, bad, held, from, gone, add }]   (places and sizes in tiles)
//   edges:  [{ a, b, at: [from, to], state }]   a stretch along the edge two levels share, in the map's tiles;
//            state: '' (open both sides), 'wall' (open on one side only), 'soon' (will be, when the level is let go)
//   doors:  [{ from: [x, y], to: [x, y] }]     a door and where you come out, in the map's tiles
//   focus:  the level a small screen keeps in sight when the map is wider than it
//   bar:    { on: <level>, items: [[word, icon, main]] }   the picked level's own bar of acts
//   hint:   { on: <level>, text, side }                     a short line beside a level that is being moved
//   card:   { on: <level>, html }                           a card beside a level (what the check says)
//   pad:    { on: <level> }                                 move a level with buttons, a tile a tap
//   tip:    the line along the top on a big screen

(() => {
  const M = window.MAP
  const map = document.querySelector('.wmap')
  if (!M || !map) return
  const icon = (name) => `<span class="ic" data-i="${name}"></span>`
  const byName = (n) => M.levels.find((l) => l.n === n)

  // The levels, the bars and the arrows, drawn once; where they go is worked out after the fonts are in.
  map.insertAdjacentHTML('beforeend', `<svg class="mlinks" aria-hidden="true"><defs><marker id="mhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="rgb(255 255 255 / 0.7)"/></marker></defs><path class="mdoor" d="" marker-end="url(#mhead)"/></svg>`)
  for (const l of M.levels) {
    const cls = ['lv2', l.here && 'here', l.picked && 'picked', l.lift && 'lift', l.bad && 'bad', l.held && 'held', l.from && 'from', l.add && 'add'].filter(Boolean).join(' ')
    const inner = l.add
      ? `${icon('plus')}<span class="nm">${l.n}</span>`
      : l.from
        ? ''
        : `<i style="filter:hue-rotate(${l.hue || 0}deg)"></i><span class="nm">${l.n}${l.here ? '<b> · You are here</b>' : ''}</span>${l.start ? `<span class="st">${icon('flag-pennant')}Start</span>` : ''}`
    map.insertAdjacentHTML('beforeend', `<button class="${cls}" data-n="${l.from ? '' : l.n}" title="${l.add ? 'Make a new level' : l.from ? `Where ${l.was || 'it'} was` : `${l.n}: tap to go in`}">${inner}</button>`)
  }
  for (const e of M.edges || []) map.insertAdjacentHTML('beforeend', `<span class="ej ${e.state || ''}" data-a="${e.a}" data-b="${e.b}"><span class="ejc">${icon(e.state === 'wall' ? 'warning' : 'arrows-left-right')}</span></span>`)
  map.insertAdjacentHTML('beforeend', `<div class="mkey"><span><i class="kbar"></i><i class="kmark">${icon('arrows-left-right')}</i>Players walk straight across</span><span><i class="karrow"></i>Through a door</span><span>${icon('flag-pennant')}Where the game starts</span></div>`)
  // A note under the top bar says what just happened; the line along the top waits until it has gone.
  // On a phone held sideways there is no room for it: the key at the bottom says what each mark means.
  if (M.tip && !document.querySelector('.note2') && !matchMedia('(max-height: 500px)').matches) map.insertAdjacentHTML('beforeend', `<span class="tip free mtip">${M.tip}</span>`)
  if (M.bar) map.insertAdjacentHTML('beforeend', `<div class="mbar">${M.bar.items.map(([w, ic, main]) => `<button class="${main ? 'main' : ''}">${icon(ic)}<span>${w}</span></button>`).join('')}</div>`)
  if (M.hint) map.insertAdjacentHTML('beforeend', `<div class="mhint">${M.hint.text}</div>`)
  if (M.card) map.insertAdjacentHTML('beforeend', `<section class="mcard" role="dialog">${M.card.html}</section>`)
  if (M.pad) map.insertAdjacentHTML('beforeend', `<div class="mpad"><b>Move ${M.pad.on} one tile</b><span>${['', 'caret-up', '', 'caret-left', '', 'caret-right', '', 'caret-down', ''].map((ic, i) => (ic ? `<button title="Move ${['', 'up', '', 'left', '', 'right', '', 'down'][i]}">${icon(ic)}</button>` : '<i></i>')).join('')}</span>${M.pad.note ? `<p>${M.pad.note}</p>` : ''}<button class="sbtn">Done</button></div>`)

  // frame.js gives every icon its picture as the page loads; these were added after, so they get theirs here.
  for (const el of map.querySelectorAll('[data-i]')) el.style.setProperty('--icon', `url("${ICONS}${el.dataset.i}.svg")`)

  const draw = () => {
    const box = map.getBoundingClientRect()
    const small = box.width < 600 || box.height < 420
    // Room the map keeps clear: a line at the top on a big screen, a note under the top bar, the key at the bottom.
    const tip = map.querySelector('.mtip')
    const note = document.querySelector('.note2')
    const key = map.querySelector('.mkey')
    let top = box.top + 16
    if (tip && getComputedStyle(tip).display !== 'none') top = Math.max(top, tip.getBoundingClientRect().bottom + 20)
    if (note) top = Math.max(top, note.getBoundingClientRect().bottom + 16)
    let bottom = key.getBoundingClientRect().top - 16
    // On a phone the check's card and the move pad sit at the bottom of the map, so the levels keep above them.
    // On a phone held sideways they stand at the right instead, so the levels keep to the left of them.
    const sheet = matchMedia('(max-width: 600px), (max-height: 500px)').matches && map.querySelector('.mcard, .mpad')
    const sideways = matchMedia('(max-height: 500px) and (min-width: 600px)').matches
    let right = box.right
    if (sheet && sideways) right = sheet.getBoundingClientRect().left - 4
    else if (sheet) bottom = Math.min(bottom, sheet.getBoundingClientRect().top - 12)
    const width = right - box.left
    const pad = small ? 12 : 32
    const real = M.levels.filter((l) => !l.add)
    const x0 = Math.min(...M.levels.map((l) => l.x))
    const y0 = Math.min(...M.levels.map((l) => l.y))
    const x1 = Math.max(...M.levels.map((l) => l.x + l.w))
    const y1 = Math.max(...M.levels.map((l) => l.y + l.h))
    // As big as fits, but never so small that a level is less than a finger's width (a 20-tile level at least 130
    // points): then the map runs past the screen's edge, as a canvas does, and the level in focus stays in sight.
    const fit = Math.min((width - 2 * pad) / (x1 - x0), (bottom - top) / (y1 - y0))
    const s = Math.max(fit, 6.5)
    const focus = byName(M.focus) || real.find((l) => l.here) || real[0]
    let ox = box.left + pad + Math.max(0, (width - 2 * pad - (x1 - x0) * s) / 2) - x0 * s
    if ((x1 - x0) * s > width - 2 * pad) ox = Math.min(box.left + pad - x0 * s, box.left + width / 2 - (focus.x + focus.w / 2) * s)
    ox = Math.max(ox, Math.min(box.left + pad - x0 * s, right - pad - x1 * s))
    const oy = top + Math.max(0, (bottom - top - (y1 - y0) * s) / 2) - y0 * s
    const px = (x) => ox + x * s - box.left
    const py = (y) => oy + y * s - box.top
    const els = [...map.querySelectorAll('.lv2')]
    M.levels.forEach((l, i) => {
      Object.assign(els[i].style, { left: `${px(l.x)}px`, top: `${py(l.y)}px`, width: `${l.w * s}px`, height: `${l.h * s}px` })
    })
    // A shared stretch: on the edge where one level ends and the other begins.
    ;[...map.querySelectorAll('.ej')].forEach((el, i) => {
      const e = M.edges[i]
      const a = byName(e.a)
      const b = byName(e.b)
      // A stretch that will be (a level about to be let go) names its line itself, `x` or `y`.
      const side = e.x !== undefined || (e.y === undefined && (a.x + a.w === b.x || b.x + b.w === a.x))
      if (side) {
        const x = e.x ?? (a.x + a.w === b.x ? b.x : a.x)
        Object.assign(el.style, { left: `${px(x)}px`, top: `${py(e.at[0])}px`, height: `${(e.at[1] - e.at[0]) * s}px` })
        el.classList.add('up')
      } else {
        const y = e.y ?? (a.y + a.h === b.y ? b.y : a.y)
        Object.assign(el.style, { left: `${px(e.at[0])}px`, top: `${py(y)}px`, width: `${(e.at[1] - e.at[0]) * s}px` })
      }
    })
    // Doors: a gentle curve from the door to where you come out, with its head at the far end.
    const d = (M.doors || []).map(({ from, to }) => {
      const [ax, ay] = [px(from[0]), py(from[1])]
      const [bx, by] = [px(to[0]), py(to[1])]
      const lift = Math.min(60, Math.hypot(bx - ax, by - ay) / 3)
      return `M${ax} ${ay} Q${(ax + bx) / 2} ${Math.min(ay, by) - lift} ${bx} ${by}`
    })
    const svg = map.querySelector('.mlinks')
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`)
    svg.querySelector('.mdoor').setAttribute('d', d.join(' '))
    for (const { from } of M.doors || []) {
      svg.insertAdjacentHTML('beforeend', `<circle cx="${px(from[0])}" cy="${py(from[1])}" r="5" fill="#ededed" stroke="#111" stroke-width="2"/>`)
    }
    // Whatever floats beside a level sits above it, or below when there is no room above, and stays on the screen.
    const beside = (el, name, gap = 10) => {
      if (!el) return
      const l = byName(name)
      const r = el.getBoundingClientRect()
      const lt = py(l.y)
      const lb = py(l.y + l.h)
      let y = lt - r.height - gap
      if (y + box.top < top - 8) y = lb + gap
      let x = px(l.x + l.w / 2) - r.width / 2
      // Neither above nor below has room: it stands beside the level, on the side with more room, never over it.
      if (y + r.height + box.top > Math.min(innerHeight, box.bottom) - 8) {
        y = Math.max(8, Math.min(lt, box.height - r.height - 48))
        const leftRoom = px(l.x)
        const rightRoom = box.width - px(l.x + l.w)
        x = leftRoom > rightRoom ? px(l.x) - r.width - gap : px(l.x + l.w) + gap
      }
      x = Math.max(8, Math.min(x, Math.min(box.width, innerWidth - box.left) - r.width - 8))
      Object.assign(el.style, { left: `${x}px`, top: `${y}px` })
    }
    beside(map.querySelector('.mbar'), M.bar?.on)
    beside(map.querySelector('.mhint'), M.hint?.on)
    beside(map.querySelector('.mcard'), M.card?.on, 14)
    beside(map.querySelector('.mpad'), M.pad?.on, 12)
    // A menu that hangs under a level (`data-under`) is placed by frame.js; now the level has its place, place it again.
    if (typeof keepInside === 'function') keepInside()
  }
  document.fonts.ready.then(draw)
})()
