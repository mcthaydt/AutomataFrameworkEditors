<script lang="ts">
  // The team's notes on the open level: read when the game opens and again every minute while the page is in view, drawn as
  // pins over the level (`extras()`), opened as a card on a tap, and written from "Add a note". Nothing about a note waits
  // for "Put in game": each one is its own small save on a branch of its own.
  import type { Level } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { NotesFile } from '../files/files.ts'
  import type { Characters, Extra, Point } from '../levels/levels.ts'
  import type { OpenGame } from '../game/game.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import NewNote from './NewNote.svelte'
  import NoteCard from './NoteCard.svelte'
  import { noteExtras, noteIdOf } from './notes.ts'

  interface Props {
    lang: Lang
    api: Api
    game: OpenGame
    levelId: string
    level: Level | undefined
    characters: Characters
    /** "Show done notes" is on: finished notes are drawn again, faint. */
    showDone: boolean
    /** How often the notes are read again while the page is in view. */
    every?: number
    onsignedout: () => void
  }
  let { lang, api, game, levelId, level, characters, showDone, every = 60_000, onsignedout }: Props = $props()

  type Act<T> = T extends unknown ? Omit<T, 'game'> : never
  const NONE: NotesFile = { format: 1, notes: [] }
  const words = $derived(wordsIn(lang))
  const n = $derived(words.notes)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  let file = $state.raw<NotesFile>(NONE)
  let view = $state.raw<
    | { kind: 'new'; thing?: string; at?: Point; start: string }
    | { kind: 'card'; id: string }
    | undefined
  >(undefined)
  let sending = $state(false)
  let problem = $state<string | undefined>(undefined)

  const pins = $derived(
    noteExtras(file, level, levelId, showDone, (note) => text(n.notePinName, note.by, note.words), (character) => characters[character]?.size ?? { w: 1, h: 1 }),
  )
  const card = $derived.by(() => {
    const one = view
    return one?.kind === 'card' ? file.notes.find((note) => note.id === one.id) : undefined
  })

  /** What the level draws for the notes. */
  export const extras = (): readonly Extra[] => pins

  /** A new note on a thing or a spot of the open level. */
  export function add(where: { thing?: string; at?: Point }): void {
    problem = undefined
    view = { kind: 'new', ...where, start: '' }
  }
  /** A note to the owner, about the level as a whole, that starts with a greeting. */
  export function ask(owner: string): void {
    problem = undefined
    view = { kind: 'new', start: text(n.noteAskStart, owner) }
  }
  /** A pin was pressed. */
  export function open(extraId: string): void {
    const id = noteIdOf(extraId)
    if (id === undefined) return
    problem = undefined
    view = { kind: 'card', id }
  }

  let reading = false
  /** Asked for again while a reading was on its way: it may have missed something, so read once more. */
  let again = false
  async function read(): Promise<void> {
    if (game.login === undefined) return
    if (reading || sending) {
      again = true
      return
    }
    reading = true
    const answer = await api.notes(game.ref)
    reading = false
    if (answer.ok && !sending) file = answer.value
    if (again) {
      again = false
      void read()
    }
  }
  onMount(() => {
    void read()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void read()
    }, every)
    const seen = (): void => {
      if (document.visibilityState === 'visible') void read()
    }
    document.addEventListener('visibilitychange', seen)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', seen)
    }
  })

  /** Sends one act; what comes back is the file as it is now. `then` runs when it went. */
  async function send(act: Act<Parameters<Api['note']>[0]>, then: () => void): Promise<void> {
    if (sending) return
    sending = true
    problem = undefined
    const answer = await api.note({ game: game.ref, ...act } as Parameters<Api['note']>[0])
    sending = false
    if (answer.ok) {
      file = answer.value
      then()
      return
    }
    switch (answer.problem) {
      case 'signed-out':
        return onsignedout()
      case 'offline':
        problem = text(n.noteOffline)
        return
      case 'busy':
        problem = text(n.noteBusy)
        return
      default:
        problem = text(n.noteFail)
    }
  }

  /** Where a new note says it goes, in words. */
  const aboutNew = (one: { thing?: string }): string => (one.thing === undefined ? text(n.noteOnSpot) : nameOf(one.thing))
  const shut = (): void => {
    view = undefined
    problem = undefined
  }
</script>

{#if view?.kind === 'new'}
  {@const one = view}
  <NewNote
    {lang}
    about={aboutNew(one)}
    start={one.start}
    {problem}
    {sending}
    onclose={shut}
    onsend={(said) =>
      void send(
        {
          add: {
            level: levelId,
            words: said,
            ...(one.thing === undefined ? {} : { thing: one.thing }),
            ...(one.at === undefined ? {} : { at: one.at }),
          },
        },
        shut,
      )}
  />
{:else if card !== undefined}
  <NoteCard
    {lang}
    note={card}
    gone={card.thing !== undefined && !(level?.things.some((thing) => thing.id === card.thing) ?? false)}
    {problem}
    {sending}
    onclose={shut}
    onanswer={(said) => void send({ answer: { id: card.id, words: said } }, () => {})}
    ondone={(done) => void send({ done: { id: card.id, done } }, shut)}
  />
{/if}
