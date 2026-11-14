<script lang="ts">
  import { onMount } from 'svelte'
  import { type AccessFile, type AccessLevel, checkAccess, LEVELS } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import { openGame } from '../game/game.ts'
  import { Button, Choice, Notice, Screen } from '../ui/ui.ts'
  import type { GameRef, SharingAnswer } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'
  import { routeHash } from './route.ts'

  // The Share screen: who may do what in this game. Only an Owner sees it. Nothing is written until Save sharing, and
  // the list on the screen is exactly the file the game keeps.
  interface Props {
    api: Api
    game: GameRef
    onsignedout: () => void
    /** To the game's page: where anyone but an Owner lands, and where Back goes. */
    onhome: () => void
  }
  let { api, game: ref, onsignedout, onhome }: Props = $props()

  type Person = AccessFile['people'][number]
  type Given = Exclude<AccessLevel, 'nothing'>
  const GIVEN: readonly Given[] = LEVELS.filter((l): l is Given => l !== 'nothing')
  const NAMES: Readonly<Record<Given, { label: string; hint: string }>> = {
    look: { label: WORDS.levelLook, hint: WORDS.levelLookHint },
    suggest: { label: WORDS.levelSuggest, hint: WORDS.levelSuggestHint },
    approve: { label: WORDS.levelApprove, hint: WORDS.levelApproveHint },
    edit: { label: WORDS.levelEdit, hint: WORDS.levelEditHint },
    owner: { label: WORDS.levelOwner, hint: WORDS.levelOwnerHint },
  }

  /** The game's own name, once it has opened; `owner/name` only until then. */
  let gameName = $state<string | undefined>(undefined)
  let loaded = $state.raw<SharingAnswer | undefined>(undefined)
  let everyone = $state<AccessFile['everyone']>('look')
  let people = $state.raw<readonly Person[]>([])
  let ready = $state(false)
  let said = $state.raw<readonly { kind: 'good' | 'info' | 'problem'; text: string }[]>([])
  let saving = $state(false)
  let leaving = $state(false)
  let copied = $state(false)
  let newName = $state('')
  let newLevel = $state<Given>('suggest')
  let nameProblem = $state<string | undefined>(undefined)
  let link: HTMLInputElement | undefined = $state()

  const here = (r: GameRef): string => new URL(routeHash({ screen: 'game', ...r }), location.href).href
  const linkText = $derived(here(ref))
  const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

  function take(answer: SharingAnswer): void {
    loaded = answer
    everyone = answer.access.everyone
    people = answer.access.people
  }
  const current = $derived<AccessFile>({ format: 1, everyone, people })
  const dirty = $derived(loaded !== undefined && JSON.stringify(current) !== JSON.stringify(loaded.access))

  async function load(): Promise<void> {
    const opened = await openGame(api, ref)
    if (!opened.ok && opened.problem === 'signed-out') return onsignedout()
    // Anyone but an Owner has nothing to do here.
    if (!opened.ok || opened.game.level !== 'owner') return onhome()
    gameName = opened.game.content.project.name
    const answer = await api.sharing(ref)
    if (!answer.ok) {
      if (answer.problem === 'signed-out') return onsignedout()
      if (answer.problem === 'not-allowed' || answer.problem === 'not-found') return onhome()
      said = [{ kind: 'problem', text: WORDS.cantReach }]
      return
    }
    take(answer.value)
    if (answer.value.broken) said = [{ kind: 'problem', text: WORDS.sharingBroken }]
    ready = true
  }
  onMount(() => {
    void load()
    const warn = (e: BeforeUnloadEvent): void => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  })

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(linkText)
      copied = true
    } catch {
      // Where the clipboard is not allowed, the link is selected so the person can copy it themselves.
      link?.focus()
      link?.select()
    }
  }

  function add(): void {
    const name = newName.trim()
    nameProblem = undefined
    const shape = checkAccess({ format: 1, everyone: 'look', people: [{ github: name, level: 'look' }] })
    if (!shape.ok) {
      nameProblem = WORDS.nameBad
      return
    }
    if (loaded !== undefined && same(name, loaded.owner)) {
      nameProblem = WORDS.nameTwice(name)
      return
    }
    if (people.some((p) => same(p.github, name))) {
      nameProblem = WORDS.nameTwice(name)
      return
    }
    people = [...people, { github: name, level: newLevel }]
    newName = ''
  }
  const remove = (name: string): void => {
    people = people.filter((p) => p.github !== name)
  }
  const setLevel = (name: string, level: Given): void => {
    people = people.map((p) => (p.github === name ? { ...p, level } : p))
  }

  async function save(): Promise<void> {
    if (loaded === undefined || saving) return
    saving = true
    said = []
    const answer = await api.share({ game: ref, access: current, version: loaded.version })
    saving = false
    if (answer.ok) {
      take(answer.value)
      said = [{ kind: 'good', text: WORDS.sharingSaved }]
      return
    }
    switch (answer.problem) {
      case 'signed-out':
        return onsignedout()
      case 'changed-elsewhere': {
        const newest = await api.sharing(ref)
        if (newest.ok) take(newest.value)
        said = [{ kind: 'info', text: WORDS.sharingChanged }]
        return
      }
      case 'not-found':
        said = (answer.details ?? []).map((name) => ({ kind: 'problem' as const, text: WORDS.nameUnknown(name) }))
        return
      case 'blocked':
        said = [{ kind: 'problem', text: WORDS.blockedOwner }]
        return
      case 'offline':
        said = [{ kind: 'problem', text: WORDS.offline }]
        return
      case 'busy':
        said = [{ kind: 'problem', text: WORDS.busy }]
        return
      default:
        said = [{ kind: 'problem', text: WORDS.saveFailed }]
    }
  }

  function leave(): void {
    if (dirty) leaving = true
    else onhome()
  }
  const back = $derived({ label: WORDS.back, onpress: leave })
  const everyoneOptions = [
    { value: 'nothing', label: WORDS.everyoneNothing, hint: WORDS.everyoneNothingHint },
    { value: 'look', label: WORDS.levelLook, hint: WORDS.levelLookHint },
    { value: 'suggest', label: WORDS.levelSuggest, hint: WORDS.levelSuggestHint },
  ]
  const needsSave = $derived(dirty || (loaded?.broken ?? false))
</script>

<Screen title={WORDS.shareTitle(gameName ?? `${ref.owner}/${ref.name}`)} {back}>
  {#if !ready}
    {#each said as line (line.text)}<Notice kind={line.kind} text={line.text} />{/each}
    {#if said.length === 0}<p>{WORDS.loading}</p>{/if}
  {:else if loaded !== undefined}
    <div class="block">
      <label for="share-link">{WORDS.shareLinkLabel}</label>
      <div class="linkrow">
        <input id="share-link" class="link" readonly value={linkText} bind:this={link} />
        <Button label={WORDS.copyLink} onpress={() => void copy()} />
      </div>
      {#if copied}<Notice kind="good" text={WORDS.linkCopied} />{/if}
    </div>

    <Choice
      label={WORDS.everyoneLabel}
      options={everyoneOptions}
      value={everyone}
      onchange={(v) => (everyone = v as AccessFile['everyone'])}
    />

    <div class="block">
      <h2>{WORDS.peopleLabel}</h2>
      <p class="owner">{WORDS.peopleOwner(loaded.owner)}</p>
      {#if people.length === 0}
        <p>{WORDS.peopleNone}</p>
      {:else}
        <ul class="people">
          {#each people as person (person.github)}
            <li class="person">
              <span class="who">{person.github}</span>
              <select
                aria-label={person.github}
                value={person.level}
                onchange={(e) => setLevel(person.github, e.currentTarget.value as Given)}
              >
                {#each GIVEN as level (level)}<option value={level}>{NAMES[level].label}</option>{/each}
              </select>
              <span class="hint">{NAMES[person.level].hint}</span>
              <Button label={WORDS.remove(person.github)} kind="danger" onpress={() => remove(person.github)} />
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <form
      class="block add"
      onsubmit={(e) => {
        e.preventDefault()
        add()
      }}
    >
      <label for="share-name">{WORDS.addName}</label>
      <input id="share-name" class="name" autocomplete="off" autocapitalize="off" spellcheck="false" bind:value={newName} />
      <p class="hint">{WORDS.addNameHint}</p>
      <select aria-label={WORDS.addName} bind:value={newLevel}>
        {#each GIVEN as level (level)}<option value={level}>{NAMES[level].label}</option>{/each}
      </select>
      {#if nameProblem !== undefined}<Notice kind="problem" text={nameProblem} />{/if}
      <div><Button label={WORDS.addPerson} onpress={add} /></div>
    </form>

    {#each said as line (line.text)}<Notice kind={line.kind} text={line.text} />{/each}
    {#if dirty}<p class="dirty" role="status">{WORDS.sharingDirty}</p>{/if}
    {#if leaving}
      <Notice kind="info" text={WORDS.leaveAsk} />
      <div class="actions">
        <Button label={WORDS.leaveNo} kind="primary" onpress={() => (leaving = false)} />
        <Button label={WORDS.leaveYes} onpress={onhome} />
      </div>
    {/if}
    <div>
      <Button
        label={WORDS.saveSharing}
        kind={leaving ? 'plain' : 'primary'}
        disabled={saving || !needsSave}
        onpress={() => void save()}
      />
    </div>
  {/if}
</Screen>

<style>
  .block {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  h2,
  .owner,
  .hint,
  .dirty {
    margin: 0;
  }
  h2 {
    font-size: var(--font-size);
  }
  .hint {
    color: var(--quiet);
  }
  .linkrow {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .link,
  .name,
  select {
    min-height: 44px;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
  .link {
    flex: 1 1 14rem;
    min-width: 0;
  }
  .people {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .person {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
  }
  .who {
    flex: 1 1 8rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .person .hint {
    flex-basis: 100%;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
</style>
