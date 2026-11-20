<script lang="ts">
  // What floats over the map: the bar beside the picked level, the one card beside it (the pad of arrows, a wall's ways
  // out, a level just made, the rename), and the note that says what just happened. It also does what the bar and the
  // cards ask: a level moved, made, copied, renamed or taken away is one step up through `onchange`.
  import type { GameContent, LevelPoint } from '@automataframework/framework/headless'
  import { untrack } from 'svelte'
  import type { Working } from '../game/game.ts'
  import {
    copyLevel,
    type Done,
    deleteLevel,
    newLevel,
    RenameCard,
    refusalWord,
    renameLevel,
    type Way,
  } from '../levels/levels.ts'
  import { Note } from '../ui/ui.ts'
  import { idOf, type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { marksOf, neighbours, nextJoin, nudgeLevel, pullApart, touchChange } from './arrange.ts'
  import LevelBar from './LevelBar.svelte'
  import NewLevelCard from './NewLevelCard.svelte'
  import PadCard from './PadCard.svelte'
  import { fits, freeSpot, placeCard, type Rect } from './placing.ts'
  import { KEY_ROOM, KEY_WIDTH, TOP_ROOM } from './shapes.ts'
  import { clearWalls, meetOpenings, tilesToClear } from './walls.ts'
  import WallCard from './WallCard.svelte'

  interface Props {
    content: GameContent
    working: Working
    lang: Lang
    picked: string | undefined
    onpick: (level: string | undefined) => void
    ongo: (level: string) => void
    onchange: (next: Working) => void
    onundo: () => void
    all: readonly { level: string; x: number; y: number; w: number; h: number }[]
    marks: ReturnType<typeof marksOf>
    size: { w: number; h: number }
    rectFor: (id: string) => Rect | undefined
    /** A level is being dragged: its bar waits. */
    dragging: boolean
    /** A problem is being shown: the room's bar and the fix card give way to it. */
    quiet?: boolean
  }
  let { content, working, lang, picked, onpick, ongo, onchange, onundo, all, marks, size, rectFor, dragging, quiet = false }: Props =
    $props()

  const everything = $derived(wordsIn(lang))
  const ways = $derived(everything.arrange)
  const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)

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
  let barEl = $state<HTMLElement | null | undefined>()
  // The bar's size is read again in the same update its buttons change (another level, a Pull apart that comes or
  // goes, the menu), before the page is drawn, so a wider bar is never placed by the narrower one's size first. The
  // bound size below still follows any later resize (the words' font arriving, a bigger text setting).
  $effect(() => {
    void [picked, touching[0], menu, open?.kind, lang]
    if (barEl === undefined || barEl === null) return
    const w = barEl.clientWidth
    const h = barEl.clientHeight
    untrack(() => {
      if (w !== barSize.w || h !== barSize.h) barSize = { w, h }
    })
  })
  let cardSize = $state({ w: 0, h: 0 })
  const screen = $derived({ x: 0, y: 0, w: size.w, h: size.h })
  // The key's own place: centred at the foot, as wide as its words, so a card may sit in the band beside it.
  const keyRect = $derived({ x: Math.max(0, size.w / 2 - KEY_WIDTH / 2), y: size.h - KEY_ROOM, w: Math.min(size.w, KEY_WIDTH), h: KEY_ROOM })
  /** The top strip holds "Whole world" and "New level": nothing floats over them. */
  const topRect = $derived({ x: 0, y: 0, w: size.w, h: TOP_ROOM })
  const pickedRect = $derived(picked === undefined ? undefined : rectFor(picked))
  const barAt = $derived(
    pickedRect === undefined || dragging ? undefined : placeCard(whole(barSize), pickedRect, [keyRect, topRect], screen),
  )
  const cardAt = $derived.by(() => {
    if (open === undefined) return undefined
    const mine = open.kind === 'wall' ? (picked === open.b ? open.b : open.a) : open.level
    const anchor = rectFor(mine)
    if (anchor === undefined) return undefined
    const others = open.kind === 'wall' ? [open.a, open.b].filter((id) => id !== mine) : touching
    const clear = others.flatMap((id) => rectFor(id) ?? [])
    return placeCard(whole(cardSize), anchor, [keyRect, topRect, ...(barAt === undefined ? [] : [barAt]), ...clear], screen)
  })

  /** A level moved: one step, and a card for the wall when it now meets one and joins nothing. */
  export function moved(id: string, done: Done<Working>): void {
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

  export function make(at: LevelPoint | undefined): void {
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

  /** Said when a level is let go on another: it goes back. */
  export const overlapped = (): void => say(text(ways.overlapped))
  /** A wall's card, for the pair that meets there. */
  export const wall = (a: string, b: string): void => void (card = { kind: 'wall', a, b })
  /** The three dots of a level, opened. */
  export const menuOf = (level: string): void => void (menu = level)
</script>

{#if picked !== undefined && barAt !== undefined && !quiet}
  <div class="float" data-ui bind:this={barEl} bind:clientWidth={barSize.w} bind:clientHeight={barSize.h} style:left="{barAt.x}px" style:top="{barAt.y}px">
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
{#if open !== undefined && cardAt !== undefined && !quiet && (open.kind !== 'wall' || pairWalls[0] !== undefined)}
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
    <Note floats words={note.words} {...(note.button === undefined ? {} : { button: note.button })} onpress={() => { note?.press?.(); note = undefined }} />
  </div>
{/if}

<style>
  .float {
    position: absolute;
    z-index: 30;
    width: max-content;
  }
  .notes {
    position: absolute;
    top: 8px;
    left: 50%;
    z-index: 35;
    transform: translateX(-50%);
    max-width: calc(100% - 16px);
  }
</style>
