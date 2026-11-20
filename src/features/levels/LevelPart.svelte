<script lang="ts">
  // The level on screen: the picture, the marks a hand touches, the tool in hand and its floating parts (the bar over what is
  // picked, the pad of arrows, the tray, the menus and the notes). It decides nothing about the game: every hand movement
  // becomes one of the pure edits (`things.ts`, `ground.ts`, `clipboard.ts`) and the new level goes up through `onedit`.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import type { Pointers } from '../device/device.ts'
  import type { Tool } from '../shell/shell.ts'
  import type { OpenPicture } from '../wire/wire.ts'
  import { type Lang, nameOf, type Row, idOf, wordsIn } from '../words/words.ts'
  import { copyNear, isStart, movePicked, nudgePicked, playerOf, refusalWord } from './acts.ts'
  import { type Clip, copyToClip, pasteClip } from './clipboard.ts'
  import type { Done } from './done.ts'
  import { outlines } from './float.ts'
  import Edges from './Edges.svelte'
  import type { Edge } from './edges.ts'
  import Floats from './Floats.svelte'
import Frames from './Frames.svelte'
  import { type Act, createGestures, HOLD_MS, type PointerLike, pointerLike } from './gestures.ts'
  import { type Cell, type Kind, kindsOf } from './ground.ts'
import Hover from './Hover.svelte'
  import { createStage, type Stage } from './level-canvas.ts'
  import Join from './Join.svelte'
  import Marks from './Marks.svelte'
  import { type Extra, extraMarks, marksFor, type Rect, unionBox } from './marks.ts'
  import MiniMap from './MiniMap.svelte'
import Paint from './Paint.svelte'
  import Popups from './Popups.svelte'
  import { type Brush, NO_BRUSH, SHOW, type Show } from './show.ts'
import { tagFacts } from './tags.ts'
  import Tags from './Tags.svelte'
  import type { Way } from './nudge.ts'
  import { deleteThings, moveStart, onlyOne, placeThing, renameThing } from './things.ts'
  import { countsOf, START } from './tray.ts'
  import { type Camera, closeUp, pastWhole, slideBy, toScreen, toTiles, wholeLevel, zoomBy } from './view.ts'
  import type { Point } from './place.ts'

  interface Props {
    content: GameContent
    pictures: readonly OpenPicture[]
    level: Level
    levelId: string
    lang: Lang
    tool: Tool
    /** What is picked: thing ids, and `start-1` for a start. */
    picked: readonly string[]
    /** Held for this visit only. */
    locked: ReadonlySet<string>
    hidden: ReadonlySet<string>
    /** The character the Place tool is holding, or `START`. */
    placing: string | undefined
    clip: Clip | undefined
    pointers: Pointers
    /** A finger draws with the tool (and does not slide the view) even after a Pencil has been seen. */
    fingerDraws?: boolean
    readOnly?: boolean
    /** A question is on screen: the floating bars and notes keep out of its way. */
    paused?: boolean
    onpick: (ids: readonly string[]) => void
    onplacing: (id: string | undefined) => void
    /** A hand took hold of something: whoever holds the history keeps the level as it was. */
    ongrab: () => void
    /** The level is wanted like this. During a grab it is always worked out from the level as it was. */
    onedit: (next: Level) => void
    /** The hand let go (false), or the grab was given up (true). */
    ondrop: (gaveUp: boolean) => void
    onlock: (id: string, on: boolean) => void
    onhide: (id: string, on: boolean) => void
    onclip: (clip: Clip) => void
    onundo: () => void
    /** Two fingers pinched out past the whole level: the map opens on this one. */
    onmap?: (() => void) | undefined
    /** The edges that touch another level and are open there, and the way to go and look at it. */
    edges?: readonly Edge[]
    ongo?: ((level: string) => void) | undefined
    show?: Show
    /** How near the view is, said whenever it changes. */
    onnear?: (near: Show['near']) => void
    /** The ground being painted and the free thumb's buttons held. */
    brush?: Brush
    onbrush?: (letter: string) => void
    /** The edges of a level that touch another, as that level would have them: how a stroke knows a way across changed. */
    edgesFor?: ((next: Level) => readonly Edge[]) | undefined
    /** What is laid over the level (ghosts, note pins), a pin pressed, and "Add a note" on a thing or a spot. */
    extras?: readonly Extra[]
    onextra?: (id: string) => void
    onnote?: ((where: { thing?: string; at: Point }) => void) | undefined
  }
  let {
    content, pictures, level, levelId, lang, tool, picked, locked, hidden, placing, clip, pointers,
    fingerDraws = false, readOnly = false, paused = false,
    onpick, onplacing, ongrab, onedit, ondrop, onlock, onhide, onclip, onundo, onmap, edges = [], ongo,
    show = SHOW, brush = NO_BRUSH, onbrush = () => {}, onnear = () => {}, edgesFor, extras = [], onextra = () => {}, onnote,
  }: Props = $props()

  const NONE = { top: 0, right: 0, bottom: 0, left: 0 }
  const words = $derived(wordsIn(lang).levels)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const characters = $derived(content.characters)
  const hero = $derived(content.project.hero)
  let holder: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let engine = $state.raw<Stage | undefined>()
  /** Where a person slid or zoomed to; undefined while the whole level is shown. */
  let custom = $state.raw<Camera | undefined>()
  const camera = $derived(custom ?? wholeLevel(level, size, NONE))
  $effect(() => {
    levelId
    untrack(() => (custom = undefined))
  })
  $effect(() => {
    const near = custom !== undefined && custom.scale > wholeLevel(level, size, NONE).scale * 1.05 ? 'close' : 'whole'
    untrack(() => onnear(near))
  })

  const nameFor = (id: string): string => {
    if (isStart(id)) return text(words.markStart, playerOf(id))
    return locked.has(id) ? text(words.markLocked, nameOf(id)) : nameOf(id)
  }
  const marks = $derived(
    marksFor(
      level,
      characters,
      { tool, picked, locked, hidden, camera, ground: tool === 'paint' },
      size,
      nameFor,
    ),
  )
  const overMarks = $derived(extraMarks(extras, camera, size))
  const tags = $derived(tagFacts(level, characters))
  let join: Join | undefined = $state()
  let paintHand: Paint | undefined = $state()
  const kinds = $derived(kindsOf(level, content.tilesets))
  const kindNow = $derived(kinds.find((k) => k.letter === brush.letter) ?? kinds.find((k) => k.solid) ?? (kinds[0] as Kind))
  const thingsPicked = $derived(picked.filter((id) => !isStart(id)))
  const pickedBox = $derived(unionBox(marks, picked))

  let note = $state.raw<{ words: string; button?: string; press?: () => void } | undefined>()
  let noteTimer: ReturnType<typeof setTimeout> | undefined
  function say(said: string, button?: string, press?: () => void): void {
    note = { words: said, ...(button === undefined ? {} : { button }), ...(press === undefined ? {} : { press }) }
    clearTimeout(noteTimer)
    noteTimer = setTimeout(() => (note = undefined), button === undefined ? 4000 : 9000)
  }
  const sayUndoable = (said: string): void => say(said, text(wordsIn(lang).shell.undo), onundo)
  const names = (ids: readonly string[]): string =>
    ids.slice(0, 3).map((id) => (isStart(id) ? text(words.markStart, playerOf(id)) : nameOf(id))).join(', ') +
    (ids.length > 3 ? '…' : '')
  /** True (and says so, with the way to unlock) when any of these is locked. */
  function isLocked(ids: readonly string[]): boolean {
    if (!ids.some((id) => locked.has(id))) return false
    say(text(words.lockedNote), text(words.menuUnlock), () => ids.forEach((id) => onlock(id, false)))
    return true
  }
  function refuse(done: Done<unknown>): void {
    if (done.ok) return
    const row = refusalWord(done.why)
    if (row !== undefined) say(text(words[row]))
  }
  /** Gives the edit to whoever holds the history, or says why not. */
  function apply(done: Done): boolean {
    if (done.ok) onedit(done.value)
    else refuse(done)
    return done.ok
  }

  onMount(() => {
    let alive = true
    // Taken a frame later, outside the observer's turn: changing what is watched inside it is an error in WebKit.
    let frame = 0
    const watcher = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (holder !== undefined) size = { w: holder.clientWidth, h: holder.clientHeight }
      })
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
      watcher.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(noteTimer)
      clearTimeout(holdTimer)
      engine?.destroy()
    }
  })
  $effect(() => {
    const drawn = engine
    const { w, h } = size
    const shown = { content, pictures, level, camera, hidden }
    const faint = tool === 'paint' ? new Set(level.things.map((thing) => thing.id)) : new Set<string>()
    if (drawn === undefined) return
    drawn.levels.resize(w, h)
    drawn.levels.show(shown.content, shown.pictures, shown.level, shown.camera, {
      faint,
      hidden: shown.hidden,
      whatItIs: show.whatItIs,
      grid: show.grid,
    })
  })

  const gestures = createGestures({
    pointers: () => pointers,
    fingerDraws: () => fingerDraws,
    tool: () => tool,
  })
  let holdTimer: ReturnType<typeof setTimeout> | undefined
  let downRect: { left: number; top: number } | undefined
  let shiftDown = false
  let altDown = false
  const keys = (): { shift: boolean; alt: boolean } => ({ shift: shiftDown, alt: altDown })
  const tilesAt = (px: Point): Point => toTiles(camera, size, px)
  const cellAt = (px: Point): Cell => {
    const at = tilesAt(px)
    return { col: Math.floor(at.x), row: Math.floor(at.y) }
  }

  function feed(type: PointerLike['type'], e: PointerEvent): void {
    if (holder === undefined) return
    const box = type === 'down' || downRect === undefined ? holder.getBoundingClientRect() : downRect
    if (type === 'down') {
      if ((e.target as HTMLElement).closest('[data-ui]') !== null) return
      downRect = { left: box.left, top: box.top }
      shiftDown = e.shiftKey
      altDown = e.altKey
      try {
        holder.setPointerCapture(e.pointerId)
      } catch {
        // A pointer that is already gone cannot be captured; the gesture still works from the events it gets.
      }
      clearTimeout(holdTimer)
      holdTimer = setTimeout(() => handle(gestures.tick(performance.now())), HOLD_MS + 20)
    }
    const on = type === 'down' ? (e.target as HTMLElement).closest<HTMLElement>('[data-thing]')?.dataset.thing : undefined
    if (on !== undefined) holdView()
    handle(gestures.feed(pointerLike(type, e, box, on)))
    if (type === 'move' && e.buttons === 0 && e.pointerType === 'mouse') hover({ x: e.clientX - box.left, y: e.clientY - box.top })
    if (type === 'up' || type === 'cancel') {
      clearTimeout(holdTimer)
      letGoView()
    }
  }

  function handle(acts: readonly Act[]): void {
    for (const act of acts) {
      if (act.kind === 'view' && onmap !== undefined && pastWhole(camera, act.zoom, level, size)) {
        custom = undefined
        return onmap()
      }
      if (act.kind === 'view') custom = zoomBy(slideBy(camera, act.slide), act.zoom, act.about, size)
      else if (act.kind === 'hover') hover(act.at)
      else if (readOnly) continue
      else if (act.kind === 'tap') tap(act.at, act.on)
      else if (act.kind === 'hold') hold(act.at, act.on)
      else drag(act)
    }
  }

  // Where the Pencil or the pointer is over the stage, for what it shows before it touches.
  let hoverAt = $state.raw<Point | undefined>()
  const hover = (px: Point): void => void (hoverAt = px)

  function tap(at: Point, on: string | undefined): void {
    menu = undefined
    pad = false
    join?.clear()
    if (tool === 'pick' || tool === 'join') {
      if (on === undefined) onpick([])
      else if (shiftDown) onpick(picked.includes(on) ? picked.filter((id) => id !== on) : [...picked, on])
      else onpick([on])
    } else if (tool === 'place') {
      put(tilesAt(at))
    } else if (tool === 'paint' || (tool === 'erase' && (on === undefined || isStart(on)))) {
      paintHand?.tap(at, keys())
    } else if (tool === 'erase' && on !== undefined) {
      remove([on])
    }
  }

  function hold(at: Point, on: string | undefined): void {
    if (tool === 'paint') return paintHand?.hold(at)
    if (on !== undefined && !picked.includes(on)) onpick([on])
    menu = { on, at, tile: tilesAt(at) }
  }

  // A grab: everything is worked out from the level as it was when the hand took hold.
  let grabbed: { base: Level; ids: readonly string[] } | undefined
  // Touching a thing picks it, and picking can change the room the level has (a bar comes up on a phone). The picture must
  // not rescale under the finger, so a hand that went down on a thing holds the camera until it comes up.
  let heldView = false
  const holdView = (): void => {
    if (custom !== undefined) return
    custom = camera
    heldView = true
  }
  const letGoView = (): void => {
    if (heldView) custom = undefined
    heldView = false
  }
  let grabIgnored = false
  function drag(act: Extract<Act, { kind: 'drag' }>): void {
    if (act.phase === 'cancel') {
      if (grabbed !== undefined) ondrop(true)
      grabbed = undefined
      hoverAt = undefined
      paintHand?.drag(act, keys())
      return
    }
    if (tool === 'pick') dragPick(act)
    else if (tool === 'place') {
      if (act.phase === 'end') put(tilesAt(act.to))
      else hover(act.to)
    } else if (tool === 'paint' || tool === 'erase') paintHand?.drag(act, keys())
    else if (tool === 'join') join?.drag(act)
  }
  function dragPick(act: Extract<Act, { kind: 'drag' }>): void {
    if (act.phase === 'start') {
      grabIgnored = true
      if (act.on === undefined) return
      const ids = picked.includes(act.on) ? picked : [act.on]
      if (ids !== picked) onpick(ids)
      if (isLocked(ids)) return
      grabIgnored = false
      grabbed = { base: level, ids }
      return ongrab()
    }
    if (grabIgnored || grabbed === undefined) return
    if (act.phase === 'move') {
      const by = { x: (act.to.x - act.from.x) / camera.scale, y: (act.to.y - act.from.y) / camera.scale }
      const done = movePicked(grabbed.base, characters, hero, grabbed.ids, by, show.lineUp)
      if (done.ok) onedit(done.value)
      else if (done.why === 'same') onedit(grabbed.base)
      else refuse(done)
      return
    }
    const was = grabbed
    grabbed = undefined
    ondrop(false)
    if (level !== was.base) sayUndoable(text(words.noteMoved, names(was.ids)))
  }
  let pad = $state(false)
  let menu = $state.raw<{ on: string | undefined; at: Point; tile: Point; more?: boolean } | undefined>()
  let renaming = $state<string | undefined>()
  let asking = $state.raw<{ character: string; at: Point } | undefined>()
  let tray = $state.raw<Point | undefined>()

  function nudge(way: Way): void {
    if (picked.length === 0 || isLocked(picked)) return
    apply(nudgePicked(level, characters, hero, picked, way))
  }
  function copySelected(): void {
    if (thingsPicked.length === 0) return refuse({ ok: false, why: 'not-allowed' })
    const done = copyNear(level, characters, thingsPicked)
    if (!done.ok) return refuse(done)
    onedit(done.value.level)
    onpick(done.value.ids)
    sayUndoable(text(words.noteCopied, names(thingsPicked), names(done.value.ids)))
  }
  function remove(ids: readonly string[]): void {
    const things = ids.filter((id) => !isStart(id))
    if (things.length === 0) return refuse({ ok: false, why: 'not-allowed' })
    if (isLocked(things)) return
    if (apply(deleteThings(level, things))) {
      onpick(picked.filter((id) => !things.includes(id)))
      sayUndoable(text(words.noteDeleted, names(things)))
    }
  }
  function copyToClipboard(ids: readonly string[]): void {
    const done = copyToClip(level, characters, ids.filter((id) => !isStart(id)))
    if (!done.ok) return refuse(done)
    onclip(done.value)
    say(text(words.noteClip, names(done.value.things.map((t) => t.id))))
  }
  function paste(at: Point): void {
    if (clip === undefined) return say(text(words.holdNothing))
    const done = pasteClip(level, characters, clip, at)
    if (!done.ok) return refuse(done)
    onedit(done.value.level)
    onpick(done.value.ids)
    sayUndoable(text(words.notePasted, names(done.value.ids)))
  }

  /** Puts the character in hand (or the start) at `at`. A character that may be in a level once asks first. */
  function put(at: Point, character: string | undefined = placing): void {
    if (character === undefined) return
    if (character === START) {
      const done = moveStart(level, characters, hero, 1, { x: Math.round(at.x * 2) / 2, y: Math.round(at.y * 2) / 2 })
      if (apply(done)) sayUndoable(text(words.noteStart))
      return
    }
    if (onlyOne(level, characters, character) !== undefined) {
      asking = { character, at }
      return
    }
    place(character, at)
  }
  function place(character: string, at: Point): void {
    const done = placeThing(level, characters, character, at)
    if (!done.ok) return refuse(done)
    onedit(done.value.level)
    onpick([done.value.id])
    sayUndoable(text(words.notePlaced, nameOf(done.value.id)))
  }

  function openMore(): void {
    if (pickedBox === undefined) return
    const at = { x: pickedBox.x, y: pickedBox.y + pickedBox.h + 8 }
    menu = { on: picked[0], at, tile: tilesAt(at) }
  }
  function chosen(id: string): void {
    const at = menu
    menu = undefined
    const one = at?.on
    if (id === 'rename' && one !== undefined) renaming = one
    else if (id === 'lock' && one !== undefined) {
      onlock(one, true)
      say(text(words.noteLocked, nameOf(one)), text(words.menuUnlock), () => onlock(one, false))
    } else if (id === 'unlock' && one !== undefined) onlock(one, false)
    else if (id === 'hide' && one !== undefined) {
      onhide(one, true)
      say(text(words.noteHid, nameOf(one)), text(words.menuShow), () => onhide(one, false))
    } else if (id === 'show' && one !== undefined) onhide(one, false)
    else if (id === 'copy') copyToClipboard(picked)
    else if (id === 'paste' && at !== undefined) paste(at.tile)
    else if (id === 'put' && at !== undefined) tray = at.at
    else if (id === 'note' && at !== undefined) onnote?.(one !== undefined && !isStart(one) ? { thing: one, at: at.tile } : { at: at.tile })
  }
  function rename(name: string): void {
    const id = renaming
    renaming = undefined
    if (id === undefined) return
    const done = renameThing(level, id, name)
    if (!done.ok) return refuse(done)
    onedit(done.value)
    const next = idOf(name)
    if (next !== undefined) onpick(picked.map((one) => (one === id ? next : one)))
    sayUndoable(text(words.noteRenamed, nameOf(id), nameOf(next ?? id)))
  }

  /** Keys that mean a thing done to what is picked; the World screen passes them in. */
  export function command(which: string): void {
    if (readOnly) return
    if (which === 'delete') remove(picked)
    else if (which === 'duplicate') copySelected()
    else if (which === 'copy') copyToClipboard(picked)
    else if (which === 'paste') paste({ x: camera.x, y: camera.y })
    else if (which === 'whole') custom = undefined
    else if (which === 'close') custom = closeUp(level, camera, size)
  }

  const was = $derived(
    grabbed === undefined ? [] : outlines(camera, size, characters, grabbed.base.things.filter((t) => grabbed?.ids.includes(t.id))),
  )
  const counts = $derived(countsOf(level))
</script>

<div
  class="stage"
  role="group"
  aria-label={nameOf(levelId)}
  bind:this={holder}
  data-scale={camera.scale}
  onpointerdown={(e) => feed('down', e)}
  onpointermove={(e) => feed('move', e)}
  onpointerup={(e) => feed('up', e)}
  onpointercancel={(e) => feed('cancel', e)}
>
  {#each was as old (old.id)}
    <div class="was" style:left="{old.x}px" style:top="{old.y}px" style:width="{old.w}px" style:height="{old.h}px"></div>
  {/each}
  <Hover {tool} at={hoverAt} {camera} {size} {characters} {hero} {placing} {marks} />
  {#if show.frames}<Frames {level} {camera} {size} />{/if}
  <Marks
    {marks} extras={overMarks} {onextra}
    {picked}
    {readOnly}
    faint={tool === 'paint'}
    onpick={(id) => onpick([id])}
    onnudge={(id, way) => {
      if (picked.includes(id)) nudge(way)
      else apply(nudgePicked(level, characters, hero, [id], way))
    }}
    onclear={() => {
      onpick([])
      onplacing(undefined)
    }}
  />
  <Paint
    bind:this={paintHand} {lang} {level} {characters} {kinds} chosen={kindNow} tool={tool === 'erase' ? 'erase' : 'paint'}
    held={brush.held} {cellAt} {edgesFor} {ongrab} {onedit} {ondrop} say={sayUndoable} {refuse} {onbrush}
  />
  <Tags {lang} facts={tags} {marks} {picked} />
  <Join
    bind:this={join}
    {lang}
    {level}
    {characters}
    {marks}
    {picked}
    joining={tool === 'join'}
    noted={note !== undefined}
    {readOnly}
    {size}
    {onpick}
    {apply}
    {sayUndoable}
  />
  {#if ongo !== undefined}
    <Edges {lang} {level} {levelId} {edges} {camera} {marks} {size} cards={!readOnly && !paused && picked.length === 0 && tool === 'pick'} {ongo} />
  {/if}
  <MiniMap {level} {camera} screen={size} {lang} onmove={(next) => (custom = next)} />

  <Floats
    {lang}
    {characters}
    {counts}
    size={size}
    {tool}
    {readOnly}
    {paused}
    {pickedBox}
    {picked}
    {placing}
    {pad}
    {note}
    {kinds}
    letter={kindNow.letter}
    onkind={onbrush}
    onpad={() => (pad = !pad)}
    oncopy={copySelected}
    ondelete={() => remove(picked)}
    onmore={openMore}
    onnudge={nudge}
    onchoose={onplacing}
    onnote={() => {
      note?.press?.()
      note = undefined
    }}
  />
  <Popups
    {lang}
    size={size}
    {characters}
    {counts}
    {menu}
    locked={menu?.on !== undefined && locked.has(menu.on)}
    hidden={menu?.on !== undefined && hidden.has(menu.on)}
    canPaste={clip !== undefined} canNote={onnote !== undefined}
    {tray}
    {renaming}
    {asking}
    onmenu={chosen}
    onclosemenu={() => (menu = undefined)}
    onput={(id) => {
      const spot = tray
      tray = undefined
      if (spot !== undefined) put(tilesAt(spot), id)
    }}
    onrename={rename}
    oncancelrename={() => (renaming = undefined)}
    onyes={() => {
      const was = asking
      asking = undefined
      if (was !== undefined) place(was.character, was.at)
    }}
    onno={() => (asking = undefined)}
  />
</div>

<style>
  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius);
    touch-action: none;
  }
  .stage :global(canvas) {
    position: absolute;
    inset: 0;
  }
  .was {
    position: absolute;
    box-sizing: border-box;
    border-radius: 3px;
    pointer-events: none;
    border: 2px dashed var(--faint);
  }
</style>
