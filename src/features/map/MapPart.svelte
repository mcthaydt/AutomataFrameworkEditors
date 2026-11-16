<script lang="ts">
  // The world map: every level on one sheet at its true size where the world file puts it, each drawn in the game's own
  // art by the page's Pixi Application, with the marks over it and a key at the foot. It opens fitted to every level
  // ("Whole world"). A level is a real button: a tap picks it, Enter or a second tap goes in. It is also where levels
  // are arranged: dragged (or pushed a tile at a time) they land where they would join or meet a wall, and a level can
  // be made, renamed, copied and taken away. Every change goes up through `onchange` as one step.
  import type { GameContent, LevelPoint } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import type { Working } from '../game/game.ts'
  import {
    copyLevel,
    createStage,
    type Done,
    deleteLevel,
    HOLD_MS,
    type LevelStage,
    newLevel,
    RenameCard,
    refusalWord,
    renameLevel,
    toTiles,
    type Way,
  } from '../levels/levels.ts'
  import { Note } from '../ui/ui.ts'
  import type { OpenPicture } from '../wire/wire.ts'
  import { idOf, type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { boxes, landing, marksOf, moveLevel, neighbours, nextJoin, nudgeLevel, pullApart, touchChange } from './arrange.ts'
  import LevelBar from './LevelBar.svelte'
  import { mapCanvas } from './map-canvas.ts'
  import MapKey from './MapKey.svelte'
  import MapMarks from './MapMarks.svelte'
  import NewLevelCard from './NewLevelCard.svelte'
  import PadCard from './PadCard.svelte'
  import { fits, freeSpot, landingWords, placeCard, type Rect } from './placing.ts'
  import { arrowsOf, KEY_ROOM, linesOf, mapCamera, rectOf } from './shapes.ts'
  import { clearWalls, meetOpenings, tilesToClear } from './walls.ts'
  import WallCard from './WallCard.svelte'

  interface Props {
    content: GameContent
    pictures: readonly OpenPicture[]
    working: Working
    lang: Lang
    /** The level that is picked, if one is. */
    picked: string | undefined
    onpick: (level: string | undefined) => void
    /** Open the level. */
    ongo: (level: string) => void
    /** What the game is now: one step of the history. */
    onchange: (next: Working) => void
    onundo: () => void
  }
  let { content, pictures, working, lang, picked, onpick, ongo, onchange, onundo }: Props = $props()

  const everything = $derived(wordsIn(lang))
  const words = $derived(everything.map)
  const ways = $derived(everything.arrange)
  const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)

  let holder: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let engine = $state.raw<LevelStage | undefined>()

  const order = $derived(content.project.levels ?? Object.keys(working.levels))
  const all = $derived(boxes(working, order))
  const camera = $derived(mapCamera(all, size))
  const marks = $derived(marksOf(working, content))

  // A level being dragged: how far the hand has taken it, in pixels; where letting go would put it is `landing`.
  let drag = $state.raw<{ level: string; dx: number; dy: number } | undefined>()
  const origin = (id: string) => all.find((box) => box.level === id)
  const dragAt = (d: { level: string; dx: number; dy: number }): LevelPoint => {
    const box = origin(d.level)
    return { x: (box?.x ?? 0) + d.dx / camera.scale, y: (box?.y ?? 0) + d.dy / camera.scale }
  }
  const dropping = $derived(drag === undefined ? undefined : landing(working, content.tilesets, drag.level, dragAt(drag)))
  // Every level where it is shown: the dragged one under the hand.
  const shown = $derived(
    drag === undefined ? all : all.map((box) => (box.level === drag?.level ? { ...box, ...dragAt(drag) } : box)),
  )
  const placed = $derived(shown.map((box) => ({ id: box.level, rect: rectOf(box, camera, size) })))
  // What the dragged level touches is shown where it would land, not where it was.
  const apart = (one: { a: string; b: string }): boolean => drag === undefined || (one.a !== drag.level && one.b !== drag.level)
  const there = $derived(
    dropping?.kind === 'touch' && drag !== undefined
      ? all.map((box) => (box.level === drag?.level ? { ...box, ...dropping.at } : box))
      : all,
  )
  const lines = (stretches: Parameters<typeof linesOf>[0], at = all) => linesOf(stretches, at, camera, size)
  const joins = $derived(lines(marks.joins.filter(apart)))
  const soon = $derived(dropping?.kind === 'touch' ? lines(dropping.joins, there) : [])
  const walls = $derived([
    ...lines(marks.walls.filter(apart)),
    ...(dropping?.kind === 'touch' ? lines(dropping.walls, there) : []),
  ])
  const doors = $derived(arrowsOf(marks.doors, shown, working.levels, camera, size))
  const start = $derived.by(() => {
    const at = placed.find((one) => one.id === marks.start)
    return at === undefined ? undefined : { level: at.id, rect: at.rect }
  })
  const rectFor = (id: string): Rect | undefined => placed.find((one) => one.id === id)?.rect

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (holder !== undefined) size = { w: holder.clientWidth, h: holder.clientHeight }
    })
    if (holder !== undefined) {
      watcher.observe(holder)
      size = { w: holder.clientWidth, h: holder.clientHeight }
    }
    void createStage().then((made) => {
      if (!alive) return made.destroy()
      holder?.prepend(made.canvas)
      engine = made
    })
    return () => {
      alive = false
      clearTimeout(press?.timer)
      clearTimeout(noteTimer)
      watcher.disconnect()
      engine?.destroy()
    }
  })

  const sheet = $derived(engine === undefined ? undefined : mapCanvas(engine))
  $effect(() => {
    const drawn = engine
    const canvas = sheet
    const now = { content, pictures, levels: working.levels, boxes: all, camera, size }
    if (drawn === undefined || canvas === undefined) return
    drawn.levels.resize(now.size.w, now.size.h)
    canvas.show(now)
  })

  // What just happened, in a few words, with Undo when there is something to undo.
  let note = $state.raw<{ words: string; button?: string; press?: () => void } | undefined>()
  let noteTimer: ReturnType<typeof setTimeout> | undefined
  function say(said: string, button?: string, press?: () => void): void {
    note = { words: said, ...(button === undefined ? {} : { button }), ...(press === undefined ? {} : { press }) }
    clearTimeout(noteTimer)
    noteTimer = setTimeout(() => (note = undefined), button === undefined ? 4000 : 9000)
  }
  const undoable = (said: string): void => say(said, text(everything.shell.undo), onundo)
  function refuse(done: Done<unknown>): void {
    if (done.ok) return
    const row = refusalWord(done.why)
    if (row !== undefined) say(text(everything.levels[row]))
  }

  // The floating parts: the bar beside the picked level, and one card beside it (the pad of arrows, a wall's ways out,
  // a level just made, the rename). `card` belongs to the level it was opened for; a wall's to the pair that meets.
  type Card =
    | { kind: 'pad'; level: string }
    | { kind: 'wall'; a: string; b: string }
    | { kind: 'new'; level: string }
    | { kind: 'rename'; level: string }
  let card = $state.raw<Card | undefined>()
  /** The level whose three dots are open. */
  let menu = $state<string | undefined>()
  const open = $derived(card === undefined || card.kind === 'wall' || card.level === picked ? card : undefined)
  const touching = $derived(picked === undefined ? [] : neighbours(working, picked))
  const pairWalls = $derived(open?.kind === 'wall' ? marks.walls.filter((one) => one.a === open.a && one.b === open.b) : [])

  // `clientWidth` rounds down, so a float is taken a pixel wider: it never runs a hair past the edge.
  const whole = (size: { w: number; h: number }) => ({ w: size.w + 1, h: size.h + 1 })
  let barSize = $state({ w: 0, h: 0 })
  let cardSize = $state({ w: 0, h: 0 })
  const screen = $derived({ x: 0, y: 0, w: size.w, h: size.h })
  const keyRect = $derived({ x: 0, y: size.h - KEY_ROOM, w: size.w, h: KEY_ROOM })
  const pickedRect = $derived(picked === undefined ? undefined : rectFor(picked))
  const barAt = $derived(
    pickedRect === undefined || drag !== undefined ? undefined : placeCard(whole(barSize), pickedRect, [keyRect], screen),
  )
  const cardAt = $derived.by(() => {
    if (open === undefined) return undefined
    const mine = open.kind === 'wall' ? (picked === open.b ? open.b : open.a) : open.level
    const anchor = rectFor(mine)
    if (anchor === undefined) return undefined
    const others = open.kind === 'wall' ? [open.a, open.b].filter((id) => id !== mine) : touching
    const clear = others.flatMap((id) => rectFor(id) ?? [])
    return placeCard(whole(cardSize), anchor, [keyRect, ...(barAt === undefined ? [] : [barAt]), ...clear], screen)
  })

  /** A level moved: one step, and a card for the wall when it now meets one and joins nothing. */
  function moved(id: string, done: Done<Working>): void {
    if (!done.ok) return done.why === 'occupied' ? say(text(ways.overlapped)) : refuse(done)
    const before = working
    onchange(done.value)
    const now = marksOf(done.value, content)
    const wall = now.walls.find((one) => one.a === id || one.b === id)
    if (wall !== undefined && !now.joins.some((one) => one.a === id || one.b === id)) {
      card = { kind: 'wall', a: wall.a, b: wall.b }
    } else announce(id, before, done.value)
  }
  /** Said after a level joins or leaves another, with Undo. */
  function announce(id: string, before: Working, next: Working): void {
    const change = touchChange(before, next, content, id)
    if (change === undefined) return
    const [title, body] = change.kind === 'touch' ? [ways.touchTitle, ways.touchBody] : [ways.apartTitle, ways.apartBody]
    undoable(`${text(title, nameOf(change.a), nameOf(change.b))} ${text(body)}`)
  }
  const nudge = (way: Way): void => {
    if (picked !== undefined) moved(picked, nudgeLevel(working, content.tilesets, picked, way))
  }

  // One more tap and the pad's level joins another: said under the arrows.
  const soonJoin = $derived(picked === undefined || open?.kind !== 'pad' ? undefined : nextJoin(working, content, picked))
  const padNote = $derived(
    soonJoin === undefined || picked === undefined
      ? text(ways.padKeys)
      : text(ways.padNext, nameOf(picked), nameOf(soonJoin.a === picked ? soonJoin.b : soonJoin.a)),
  )

  // The wall card's four ways out. The level that slides or moves apart is the picked one when it is in the pair.
  const mover = $derived(open?.kind === 'wall' ? (picked === open.a ? open.a : open.b) : undefined)
  const slide = $derived.by(() => {
    const wall = pairWalls[0]
    if (wall === undefined || mover === undefined) return undefined
    return meetOpenings(working, content, wall, mover)
  })
  function clear(): void {
    const done = clearWalls(working, content, pairWalls)
    if (done.ok) onchange(done.value)
    else refuse(done)
  }
  const wallApart = (): void => {
    if (mover !== undefined) moved(mover, pullApart(working, content.tilesets, mover))
  }

  function make(at: LevelPoint | undefined): void {
    const spot = at !== undefined && fits(all, at, { w: 16, h: 9 }) ? at : freeSpot(all)
    const made = newLevel(working, content, spot, picked)
    onchange(made.working)
    onpick(made.id)
    card = { kind: 'new', level: made.id }
  }
  function copy(id: string): void {
    const made = copyLevel(working, id, freeSpot(all))
    if (made.id === '') return
    menu = undefined
    onchange(made.working)
    onpick(made.id)
    undoable(text(ways.copyMade, nameOf(made.id)))
  }
  function remove(id: string): void {
    menu = undefined
    const done = deleteLevel(working, id)
    if (!done.ok) return say(text(id === marks.start ? ways.cantDeleteStart : ways.cantDeleteLast))
    onchange(done.value)
    onpick(undefined)
    undoable(`${text(ways.goneTitle, nameOf(id))} ${text(ways.goneBody)}`)
  }
  function rename(id: string, name: string): void {
    const done = renameLevel(working, id, name)
    if (!done.ok) return refuse(done)
    card = undefined
    onchange(done.value)
    onpick(idOf(name))
    undoable(text(everything.levels.noteRenamed, nameOf(id), nameOf(idOf(name) ?? id)))
  }

  // A second tap on the same level soon after the first goes in; so does Enter.
  let lastTap: { level: string; at: number } | undefined
  let skip = false
  function tap(level: string): void {
    if (skip) return void (skip = false)
    const now = performance.now()
    if (lastTap?.level === level && now - lastTap.at < 450) {
      lastTap = undefined
      ongo(level)
      return
    }
    lastTap = { level, at: now }
    onpick(level)
  }
  const ARROWS: Readonly<Record<string, Way>> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
  function key(e: KeyboardEvent, level: string): void {
    const way = ARROWS[e.key]
    if (e.key === 'Enter') {
      e.preventDefault()
      ongo(level)
    } else if (e.key === 'Escape') {
      onpick(undefined)
    } else if (way !== undefined) {
      e.preventDefault()
      onpick(level)
      moved(level, nudgeLevel(working, content.tilesets, level, way))
    }
  }

  // A hand down on a level drags it once it has moved a little, or opens the three dots when it stays still; on empty
  // ground, staying still makes a level there.
  const LITTLE = 8
  // A hold is one finger staying put: a second finger, or a slide past LITTLE, is something else and makes nothing.
  let press:
    | { level: string | undefined; x: number; y: number; at: LevelPoint; held: boolean; moved: boolean; timer?: ReturnType<typeof setTimeout> }
    | undefined
  const fingers = new Set<number>()
  function still(): void {
    if (press === undefined) return
    clearTimeout(press.timer)
    press.moved = true
  }
  function touched(e: PointerEvent): void {
    fingers.add(e.pointerId)
    if (fingers.size > 1) still()
  }
  function sweep(e: PointerEvent): void {
    if (press === undefined || press.level !== undefined || press.moved) return
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) >= LITTLE) still()
  }
  function down(e: PointerEvent, level: string | undefined): void {
    if (e.button !== 0 || holder === undefined || fingers.size > 1) return
    skip = false
    clearTimeout(press?.timer)
    const box = holder.getBoundingClientRect()
    const at = toTiles(camera, size, { x: e.clientX - box.left, y: e.clientY - box.top })
    const now = { level, x: e.clientX, y: e.clientY, at, held: false, moved: false }
    press = { ...now, timer: setTimeout(() => hold(now), HOLD_MS) }
    try {
      if (level !== undefined) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // A pointer that is not there to hold (a pretend one) is followed where it goes, as any other.
    }
  }
  function hold(now: { level: string | undefined; at: LevelPoint }): void {
    if (press === undefined || press.moved || drag !== undefined) return
    press.held = true
    skip = true
    if (now.level === undefined) make({ x: Math.round(now.at.x - 8), y: Math.round(now.at.y - 4.5) })
    else {
      onpick(now.level)
      menu = now.level
    }
  }
  function move(e: PointerEvent): void {
    const hand = press
    if (hand?.level === undefined || hand.held) return
    const dx = e.clientX - hand.x
    const dy = e.clientY - hand.y
    if (drag === undefined && Math.hypot(dx, dy) < LITTLE) return
    clearTimeout(hand.timer)
    hand.moved = true
    if (picked !== hand.level) onpick(hand.level)
    drag = { level: hand.level, dx, dy }
    const box = origin(hand.level)
    if (box !== undefined) {
      const from = rectOf(box, camera, size)
      sheet?.lift(hand.level, { x: from.x + dx, y: from.y + dy })
    }
  }
  function up(e: PointerEvent): void {
    fingers.delete(e.pointerId)
    const hand = press
    press = undefined
    clearTimeout(hand?.timer)
    const d = drag
    drag = undefined
    if (d === undefined) {
      if (hand?.level === undefined && hand?.held === false && !hand.moved) onpick(undefined)
      return
    }
    skip = true
    const land = landing(working, content.tilesets, d.level, dragAt(d))
    if (land.kind === 'overlap') say(text(ways.overlapped))
    else moved(d.level, moveLevel(working, d.level, land.at))
    // Where it was, until the new place is drawn (and for good when nothing changed).
    const box = origin(d.level)
    if (box !== undefined) sheet?.lift(d.level, rectOf(box, camera, size))
  }
</script>

<div
  class="sheet stage"
  role="region"
  aria-label={text(words.mapName)}
  bind:this={holder}
  data-scale={camera.scale}
  oncontextmenu={(e) => e.preventDefault()}
  onpointerdown={(e) => {
    if (e.target === holder || e.target instanceof HTMLCanvasElement) down(e, undefined)
  }}
  onpointerdowncapture={touched}
  onpointermove={sweep}
  onpointerup={up}
  onpointercancel={up}
>
  {#if drag !== undefined}
    {@const from = rectFor(drag.level) === undefined ? undefined : origin(drag.level)}
    {#if from !== undefined}
      {@const was = rectOf(from, camera, size)}
      <div class="was" style:left="{was.x}px" style:top="{was.y}px" style:width="{was.w}px" style:height="{was.h}px"></div>
    {/if}
  {/if}
  {#each placed as one (one.id)}
    <button
      type="button"
      class="level"
      class:picked={picked === one.id}
      class:lifted={drag?.level === one.id}
      class:over={drag?.level === one.id && dropping?.kind === 'overlap'}
      data-level={one.id}
      aria-label={nameOf(one.id)}
      aria-pressed={picked === one.id}
      style:left="{one.rect.x}px"
      style:top="{one.rect.y}px"
      style:width="{one.rect.w}px"
      style:height="{one.rect.h}px"
      onclick={() => tap(one.id)}
      onkeydown={(e) => key(e, one.id)}
      onpointerdown={(e) => down(e, one.id)}
      onpointermove={move}
    >
      {#if one.rect.w >= 84 && one.rect.h >= 40}<span class="name">{nameOf(one.id)}</span>{/if}
    </button>
  {/each}
  <MapMarks
    {lang}
    {size}
    {joins}
    {walls}
    {doors}
    {start}
    {soon}
    onwall={(one) => (card = { kind: 'wall', a: one.a, b: one.b })}
  />
  <MapKey {lang} walls={walls.length > 0} />
  <button type="button" class="new" onclick={() => make(undefined)}>{text(ways.newLevel)}</button>

  {#if drag !== undefined && dropping !== undefined}
    <p class="landing" class:over={dropping.kind === 'overlap'} role="status">{landingWords(dropping, everything)}</p>
  {/if}

  {#if picked !== undefined && barAt !== undefined}
    <div class="float" data-ui bind:clientWidth={barSize.w} bind:clientHeight={barSize.h} style:left="{barAt.x}px" style:top="{barAt.y}px">
      <LevelBar
        {lang}
        level={picked}
        moving={open?.kind === 'pad'}
        touching={touching[0]}
        more={menu === picked}
        ongo={() => ongo(picked)}
        onmove={() => (card = open?.kind === 'pad' ? undefined : { kind: 'pad', level: picked })}
        onapart={() => moved(picked, pullApart(working, content.tilesets, picked))}
        onmore={() => (menu = menu === picked ? undefined : picked)}
        onrename={() => {
          menu = undefined
          card = { kind: 'rename', level: picked }
        }}
        oncopy={() => copy(picked)}
        onremove={() => remove(picked)}
      />
    </div>
  {/if}
  {#if open !== undefined && cardAt !== undefined && (open.kind !== 'wall' || pairWalls[0] !== undefined)}
    <div class="float" data-ui bind:clientWidth={cardSize.w} bind:clientHeight={cardSize.h} style:left="{cardAt.x}px" style:top="{cardAt.y}px">
      {#if open.kind === 'pad'}
        <PadCard {lang} level={open.level} hint={padNote} onnudge={nudge} ondone={() => (card = undefined)} />
      {:else if open.kind === 'wall' && pairWalls[0] !== undefined}
        <WallCard
          {lang}
          open={pairWalls[0].open === 'a' ? open.a : open.b}
          solid={pairWalls[0].open === 'a' ? open.b : open.a}
          tiles={tilesToClear(pairWalls)}
          slide={slide === undefined || mover === undefined ? undefined : { level: mover, way: slide.way, tiles: slide.tiles }}
          onclear={clear}
          onslide={() => {
            const next = slide?.working
            if (next === undefined || mover === undefined) return
            announce(mover, working, next)
            onchange(next)
          }}
          onapart={wallApart}
          onleave={() => (card = undefined)}
        />
      {:else if open.kind === 'new'}
        <NewLevelCard {lang} ongo={() => ongo(open.level)} ondone={() => (card = undefined)} />
      {:else if open.kind === 'rename'}
        <RenameCard {lang} id={open.level} onrename={(name) => rename(open.level, name)} oncancel={() => (card = undefined)} />
      {/if}
    </div>
  {/if}
  {#if note !== undefined}
    <div class="notes" data-ui>
      <Note words={note.words} {...(note.button === undefined ? {} : { button: note.button })} onpress={() => { note?.press?.(); note = undefined }} />
    </div>
  {/if}
</div>

<style>
  .sheet {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius);
  }
  .sheet :global(canvas) {
    position: absolute;
    inset: 0;
  }
  .level {
    position: absolute;
    box-sizing: border-box;
    z-index: 1;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 3px;
    background: transparent;
    color: var(--words);
    font: inherit;
    cursor: pointer;
    touch-action: none;
  }
  .level.lifted {
    z-index: 4;
    box-shadow: var(--shadow);
  }
  .level.picked {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent);
  }
  .level.over {
    border-color: var(--problem);
    box-shadow: 0 0 0 3px var(--problem);
  }
  .level:focus-visible {
    outline: 3px solid var(--focus, var(--accent));
    outline-offset: 2px;
  }
  .name {
    position: absolute;
    left: 6px;
    top: 6px;
    max-width: calc(100% - 12px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 2px 8px;
    border-radius: 8px;
    background: var(--glass-soft);
    font-size: 13px;
    pointer-events: none;
  }
  .was {
    position: absolute;
    box-sizing: border-box;
    border: 2px dashed var(--faint);
    border-radius: 3px;
    pointer-events: none;
  }
  .float {
    position: absolute;
    z-index: 30;
    width: max-content;
  }
  .landing {
    position: absolute;
    left: 50%;
    top: 8px;
    z-index: 35;
    transform: translateX(-50%);
    max-width: calc(100% - 16px);
    margin: 0;
    padding: 8px 14px;
    border-radius: 12px;
    border: 1px solid var(--g-edge);
    background: var(--s-bg);
    color: var(--words);
    font-size: 14px;
    pointer-events: none;
  }
  .landing.over {
    color: var(--problem);
  }
  .notes {
    position: absolute;
    top: 8px;
    left: 50%;
    z-index: 35;
    transform: translateX(-50%);
    max-width: calc(100% - 16px);
  }
  .new {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 20;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--glass-edge);
    border-radius: 12px;
    background: var(--panel);
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
</style>
