<script lang="ts">
  // What a helper changed, brought to the person as something to keep or undo. The game is read again when the page
  // comes back into view and every minute: what it says that the person's own copy does not is laid on the level as a
  // ghost, with Keep (one undoable step) and Undo (the person's own stays, and the same change is not offered twice). A
  // level pasted in from a helper is offered the same way.
  import { onMount, untrack } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { change, type Edits, laidOver, type OpenGame, openGame, startEdits, type Working } from '../game/game.ts'
  import type { Characters, Extra } from '../levels/levels.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import Ghost from './Ghost.svelte'
  import { type Ghost as Seen, ghostOf, ghostOfPasted } from './ghost.ts'
  import Paste from './Paste.svelte'

  interface Props {
    lang: Lang
    api: Api
    game: OpenGame
    edits: Edits
    levelId: string
    characters: Characters
    /** How often the game is read again while the page is in view. */
    every?: number
    /** Keep: the game as it is now (when it was read again) and what the person has on screen. */
    onchanged: (game: OpenGame | undefined, next: Edits) => void
  }
  let { lang, api, game, edits, levelId, characters, every = 60_000, onchanged }: Props = $props()

  const words = $derived(wordsIn(lang))
  const h = $derived(words.helper)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  /** The game as it was last read. */
  let seen = $state.raw<{ game: OpenGame; theirs: Working } | undefined>(undefined)
  /** The change the person undid: it is not offered again until the game says something else. */
  let undone = $state<string | undefined>(undefined)
  let pasting = $state(false)
  let pasteProblem = $state<string | undefined>(undefined)
  let pasted = $state<{ text: string; level: string } | undefined>(undefined)

  const signature = (ghost: Seen): string => JSON.stringify(ghost.lines)
  const fromGame = $derived(seen === undefined ? undefined : ghostOf(edits.base, edits.now, seen.theirs))
  const offered = $derived(fromGame !== undefined && signature(fromGame) !== undone ? fromGame : undefined)
  const fromPaste = $derived.by(() => {
    if (pasted === undefined) return undefined
    const result = ghostOfPasted(pasted.text, edits.base, edits.now, pasted.level)
    return 'problem' in result ? undefined : result
  })
  const ghost = $derived(fromPaste ?? offered)

  /** The helper's ghosts on the open level: the things it moved, added or set, where it put them. */
  const marks = $derived.by((): readonly Extra[] => {
    if (ghost === undefined) return []
    const theirs = ghost.merged.their.levels[levelId]
    const out: Extra[] = []
    for (const line of ghost.lines) {
      if (line.level !== levelId || !('thing' in line)) continue
      if (line.kind !== 'moved' && line.kind !== 'added' && line.kind !== 'settings') continue
      const thing = theirs?.things.find((one) => one.id === line.thing)
      if (thing === undefined) continue
      const size = characters[thing.character]?.size ?? { w: 1, h: 1 }
      out.push({
        id: `ghost:${thing.id}`,
        kind: 'ghost',
        at: { x: thing.x, y: thing.y },
        size,
        name: text(h.ghostMark, nameOf(thing.id)),
      })
    }
    return out
  })

  /** What the level draws for the helper's change. */
  export const extras = (): readonly Extra[] => marks
  /** Opens the box where a level from a helper is pasted. */
  export function paste(): void {
    pasteProblem = undefined
    pasting = true
  }

  let reading = false
  /** Asked for again while a reading was on its way: it may have missed what was asked about, so read once more. */
  let again = false
  async function read(): Promise<void> {
    if (game.login === undefined) return
    if (reading) {
      again = true
      return
    }
    reading = true
    const asked = game
    const opened = await openGame(api, game.ref)
    reading = false
    if (again) {
      again = false
      void read()
    }
    // What was read is only said of the game the person has now: one they put a change into since is another game.
    if (opened.ok && asked === game) seen = { game: opened.game, theirs: startEdits(opened.game).now }
  }
  // A game the person has changed (a put, a keep, a reopen) starts the reading over.
  $effect(() => {
    game
    untrack(() => {
      seen = undefined
      undone = undefined
      reading = false
      void read()
    })
  })
  onMount(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void read()
    }, every)
    const back = (): void => {
      if (document.visibilityState === 'visible') void read()
    }
    document.addEventListener('visibilitychange', back)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', back)
    }
  })

  function show(said: string): void {
    const result = ghostOfPasted(said, edits.base, edits.now, levelId)
    if ('problem' in result) {
      pasteProblem = text(h.pasteBad)
      return
    }
    if (result.lines.length === 0) {
      pasteProblem = text(h.pasteSame)
      return
    }
    pasted = { text: said, level: levelId }
    pasting = false
  }
  function keepIt(): void {
    if (fromPaste !== undefined) {
      onchanged(undefined, change(edits, fromPaste.merged.now))
      pasted = undefined
    } else if (offered !== undefined && seen !== undefined) {
      onchanged(seen.game, laidOver(edits, seen.game, offered.merged))
      undone = undefined
    }
  }
  function undoIt(): void {
    if (fromPaste !== undefined) pasted = undefined
    else if (offered !== undefined) undone = signature(offered)
  }
</script>

{#if ghost !== undefined}
  <Ghost {lang} lines={ghost.lines} about={fromPaste === undefined ? undefined : text(h.pasteTitle)} onkeep={keepIt} onundo={undoIt} />
{/if}
{#if pasting}
  <Paste {lang} problem={pasteProblem} onshow={show} onclose={() => (pasting = false)} />
{/if}
