<script lang="ts">
  // Everything that helps a person: the first run (a welcome, then a tour that waits for them at each step) and the
  // sheets Settings, Help and the keys. The screen tells it what the person did (`happen`) and asks it to open a
  // sheet (`open`); what it keeps on the device is only that the first run is finished and a tick for each step done.
  import { untrack } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { Me } from '../device/device.ts'
  import type { OpenGame } from '../game/game.ts'
  import {
    finishGuide,
    guideWanted,
    type Happened,
    Help,
    Keys,
    keepTick,
    readTicks,
    Settings,
    type Step,
    stepsIn,
    Tour,
    type TourState,
    tourFrom,
    tourNext,
    Welcome,
  } from '../shell/shell.ts'
  import { type Lang, nameOf } from '../words/words.ts'

  interface Props {
    lang: Lang
    me: Me
    game: OpenGame
    api: Api
    /** May this person change what is for everyone on the game? */
    owner: boolean
    /** Where the first run's end and the steps done are kept. */
    remembered: Storage
    /** The ids of the things in the open level, and the one that is picked. */
    things: readonly { readonly id: string; readonly character: string }[]
    picked: readonly string[]
    onme: (next: Me) => void
    /** The game's settings changed: the screen holds the newest. */
    onsettings: (settings: Pick<OpenGame, 'editors' | 'editorsVersion'>) => void
    onsignedout: () => void
    /** "Keep a copy of this level", from Help. */
    onkeep: (() => void) | undefined
  }
  let { lang, me, game, api, owner, remembered, things, picked, onme, onsettings, onsignedout, onkeep }: Props =
    $props()

  // Only the steps whose job is on the screen are in the tour; the pull request that draws another adds it here.
  const steps = stepsIn(new Set<Step>(['tap-the-crate', 'drag-a-value']))
  let intro = $state<'welcome' | 'tour' | undefined>(
    untrack(() => (guideWanted(remembered) ? 'welcome' : undefined)),
  )
  let tour = $state<TourState>(tourFrom(steps))
  let ticks = $state<ReadonlySet<Step>>(untrack(() => readTicks(remembered)))
  let panel = $state<'settings' | 'help' | 'keys' | undefined>(undefined)

  /** The one thing that is picked, when one is. */
  const placed = $derived(picked.length === 1 ? things.find((thing) => thing.id === picked[0]) : undefined)
  /** Step 3 asks to change a number when the picked thing has one (by its name, "How heavy"), else to move the thing. */
  const number = $derived(
    game.content.characters[placed?.character ?? '']?.values?.find((value) => value.type === 'number'),
  )
  const three = $derived(
    number === undefined
      ? { asks: 'arrows' as const, name: placed === undefined ? '' : nameOf(placed.id) }
      : { asks: 'value' as const, name: number.name },
  )

  const owners = $derived(game.people.filter((one) => one.level === 'owner').map((one) => one.login))
  /** What the tour rings: the crate (or the first thing) for step 1, the settings for step 3. */
  const target = $derived.by(() => {
    if (tour.step === 'tap-the-crate') {
      const one = things.find((thing) => thing.character === 'crate') ?? things[0]
      return one === undefined ? undefined : `[data-thing="${one.id}"]`
    }
    return tour.step === 'drag-a-value' ? '[data-tour="settings"]' : undefined
  })

  /** What the person did, told to the tour: a step it was waiting for is done. */
  export function happen(happened: Happened): void {
    if (intro !== 'tour') return
    const next = tourNext(tour, happened, steps)
    if (next === tour) return
    if (next.step === 'skipped' || next.step === 'done') {
      tour = next
      if (next.step === 'skipped') endTour()
      return
    }
    if (next.did && !tour.did) {
      keepTick(remembered, next.step)
      ticks = new Set([...ticks, next.step])
    }
    tour = next
  }
  /** Opens a sheet. */
  export function open(which: 'settings' | 'help'): void {
    panel = which
  }
  /** True while a sheet is open: a key then belongs to the sheet. */
  export const sheetOpen = (): boolean => panel !== undefined

  function endTour(): void {
    finishGuide(remembered)
    intro = undefined
  }
  function startTour(at?: Step): void {
    panel = undefined
    tour = tourFrom(steps, at)
    intro = tour.step === 'done' ? undefined : 'tour'
  }

  /** An Owner's change for everyone on the game: whether it went in. The newest version of the file is asked for next. */
  async function setProblems(problems: 'warn' | 'stop'): Promise<boolean> {
    const answer = await api.settings({
      game: game.ref,
      editors: { ...game.editors, problems },
      version: game.editorsVersion,
    })
    if (!answer.ok) {
      if (answer.problem === 'signed-out') onsignedout()
      return false
    }
    const fresh = await api.open(game.ref)
    onsettings({ editors: answer.value, editorsVersion: fresh.ok ? fresh.value.editorsVersion : undefined })
    return true
  }
</script>

{#if intro === 'welcome'}
  <Welcome {lang} game={game.content.project.name} onshow={() => startTour()} onself={endTour} />
{:else if intro === 'tour' && panel === undefined}
  <Tour
    {lang}
    now={tour}
    {steps}
    {three}
    {target}
    onnext={() => happen({ kind: 'next' })}
    onskip={() => happen({ kind: 'skip' })}
    onend={endTour}
  />
{/if}

{#if panel === 'settings'}
  <Settings
    {lang}
    {me}
    game={game.content.project.name}
    problems={game.editors.problems}
    {owner}
    {owners}
    {onme}
    onproblems={setProblems}
    ontour={() => startTour()}
    onclose={() => (panel = undefined)}
  />
{:else if panel === 'help'}
  <Help
    {lang}
    {steps}
    done={ticks}
    onshow={(step) => startTour(step)}
    ontour={() => startTour()}
    onkeys={() => (panel = 'keys')}
    oncopy={onkeep === undefined
      ? undefined
      : () => {
          panel = undefined
          onkeep()
        }}
    onclose={() => (panel = undefined)}
  />
{:else if panel === 'keys'}
  <Keys {lang} onclose={() => (panel = 'help')} />
{/if}
