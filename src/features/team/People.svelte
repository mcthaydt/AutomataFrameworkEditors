<script lang="ts">
  // Who can change the game: its people, each with what they may do. An owner changes the list here and saves it; anyone
  // else reads it, with a line saying who to ask. Nothing is written until Save, and the list on the sheet is exactly the
  // file the game keeps.
  import { onMount } from 'svelte'
  import { type AccessFile, type AccessLevel, checkAccess, LEVELS } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { Face } from '../shell/shell.ts'
  import { Action, Icon, Segment, Sheet } from '../ui/ui.ts'
  import type { SharingAnswer } from '../wire/wire.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { routeHash } from './route.ts'

  interface Props {
    lang: Lang
    api: Api
    game: OpenGame
    /** The sign-in is gone. */
    onsignedout: () => void
    /** The way out, and the Escape key. */
    onclose: () => void
    /** "Ask the owner": left out when there is nobody to ask here. */
    onask?: ((owner: string) => void) | undefined
  }
  let { lang, api, game, onsignedout, onclose, onask }: Props = $props()

  type Person = AccessFile['people'][number]
  type Given = Exclude<AccessLevel, 'nothing'>
  const GIVEN: readonly Given[] = LEVELS.filter((l): l is Given => l !== 'nothing')

  const words = $derived(wordsIn(lang))
  const t = $derived(words.team)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const name = (level: Given): string => text(t[`${level}Name` as const])
  const about = (level: Given): string => text(t[`${level}About` as const])

  const owner = $derived(game.ref.owner)
  const mayChange = $derived(game.login !== undefined && game.level === 'owner')
  const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

  let loaded = $state.raw<SharingAnswer | undefined>(undefined)
  let everyone = $state<AccessFile['everyone']>('look')
  // What the game says now: an owner's changes start from it, and a person who may only look reads it as it is.
  // svelte-ignore state_referenced_locally
  let people = $state.raw<readonly Person[]>(
    game.people.flatMap((p) => (p.level === 'nothing' ? [] : [{ github: p.login, level: p.level }])),
  )
  let ready = $state(false)
  let said = $state.raw<readonly { kind: 'good' | 'problem' | 'info'; text: string }[]>([])
  let saving = $state(false)
  let copied = $state(false)
  let leaving = $state(false)
  let newName = $state('')
  let newLevel = $state<Given>('suggest')
  let nameProblem = $state<string | undefined>(undefined)
  let link: HTMLInputElement | undefined = $state()

  const linkText = $derived(
    new URL(routeHash({ screen: 'level', owner: game.ref.owner, name: game.ref.name }), location.href).href,
  )
  const current = $derived<AccessFile>({ format: 1, everyone, people })
  const dirty = $derived(loaded !== undefined && JSON.stringify(current) !== JSON.stringify(loaded.access))
  const needsSave = $derived(dirty || (loaded?.broken ?? false))

  function take(answer: SharingAnswer): void {
    loaded = answer
    everyone = answer.access.everyone
    people = answer.access.people
  }

  async function load(): Promise<void> {
    if (!mayChange) {
      ready = true
      return
    }
    const answer = await api.sharing(game.ref)
    if (!answer.ok) {
      if (answer.problem === 'signed-out') return onsignedout()
      said = [{ kind: 'problem', text: text(t.reachFail) }]
      ready = true
      return
    }
    take(answer.value)
    if (answer.value.broken) said = [{ kind: 'problem', text: text(t.listBroken) }]
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
      // Where the clipboard is not allowed the link is selected, so the person can copy it themselves.
      link?.focus()
      link?.select()
    }
  }

  function add(): void {
    const who = newName.trim()
    nameProblem = undefined
    const shape = checkAccess({ format: 1, everyone: 'look', people: [{ github: who, level: 'look' }] })
    if (!shape.ok) {
      nameProblem = text(t.nameBad)
      return
    }
    if (same(who, owner) || people.some((p) => same(p.github, who))) {
      nameProblem = text(t.nameTwice, who)
      return
    }
    people = [...people, { github: who, level: newLevel }]
    newName = ''
  }
  const remove = (who: string): void => {
    people = people.filter((p) => p.github !== who)
  }
  const setLevel = (who: string, level: Given): void => {
    people = people.map((p) => (p.github === who ? { ...p, level } : p))
  }

  async function save(): Promise<void> {
    if (loaded === undefined || saving) return
    saving = true
    said = []
    const answer = await api.share({ game: game.ref, access: current, version: loaded.version })
    saving = false
    if (answer.ok) {
      take(answer.value)
      said = [{ kind: 'good', text: text(t.savedList) }]
      return
    }
    switch (answer.problem) {
      case 'signed-out':
        return onsignedout()
      case 'changed-elsewhere': {
        const newest = await api.sharing(game.ref)
        if (newest.ok) take(newest.value)
        said = [{ kind: 'info', text: text(t.listChanged) }]
        return
      }
      case 'not-found':
        said = (answer.details ?? []).map((who) => ({ kind: 'problem' as const, text: text(t.nameUnknown, who) }))
        return
      case 'blocked':
        said = [{ kind: 'problem', text: text(t.blockedFail) }]
        return
      case 'offline':
        said = [{ kind: 'problem', text: text(t.reachFail) }]
        return
      case 'busy':
        said = [{ kind: 'problem', text: text(t.busyFail) }]
        return
      default:
        said = [{ kind: 'problem', text: text(t.elseFail) }]
    }
  }

  /** The way out asks first when the list has changes that are not saved. */
  function leave(): void {
    if (dirty) leaving = true
    else onclose()
  }
  const everyoneOptions = $derived([
    { id: 'nothing', words: text(t.everyoneNothing) },
    { id: 'look', words: name('look') },
    { id: 'suggest', words: name('suggest') },
  ])
  const asked = $derived(game.people.find((one) => one.level === 'owner')?.login ?? owner)
  const hasLogin = (who: string): boolean => game.login !== undefined && same(who, game.login)
</script>

<div class="scrim dim-2">
  <Sheet title={text(t.peopleTitle, game.content.project.name)} close={text(words.shell.close)} onclose={leave} side>
    <p class="lead">{text(mayChange ? t.peopleOwnerYou : t.peopleOnlyOwner)}</p>

    <ul class="people">
      <li class="person">
        <Face login={owner} size={36} />
        <span class="who">
          <b>{hasLogin(owner) ? text(t.peopleYou, owner) : owner}</b>
          <small>{text(t.peopleStarted)}</small>
        </span>
        <span class="level">{name('owner')}</span>
      </li>
      {#each people as person (person.github)}
        <li class="person">
          <Face login={person.github} size={36} />
          <span class="who">
            <b>{hasLogin(person.github) ? text(t.peopleYou, person.github) : person.github}</b>
            <small>{about(person.level)}</small>
          </span>
          {#if mayChange && ready}
            <span class="controls">
              <select
                aria-label={person.github}
                value={person.level}
                onchange={(e) => setLevel(person.github, e.currentTarget.value as Given)}
              >
                {#each GIVEN as level (level)}<option value={level}>{name(level)}</option>{/each}
              </select>
              <button type="button" class="icon" aria-label={text(t.removeName, person.github)} title={text(t.removeName, person.github)} onclick={() => remove(person.github)}>
                <Icon name="trash" />
              </button>
            </span>
          {:else}
            <span class="level">{name(person.level)}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if people.length === 0}<p class="quiet">{text(t.peopleNone)}</p>{/if}

    {#if mayChange && ready && loaded !== undefined}
      <div class="block">
        <span class="label">{text(t.everyoneLabel)}</span>
        <Segment
          label={text(t.everyoneLabel)}
          options={everyoneOptions}
          value={everyone}
          onchange={(id) => (everyone = id as AccessFile['everyone'])}
        />
      </div>
      <div class="block">
        <label class="label" for="people-link">{text(t.linkLabel)}</label>
        <div class="row">
          <input id="people-link" readonly value={linkText} bind:this={link} />
          <button type="button" class="icon" aria-label={text(t.copyLink)} title={text(t.copyLink)} onclick={() => void copy()}>
            <Icon name={copied ? 'check' : 'copy'} />
          </button>
        </div>
        {#if copied}<small class="good" role="status">{text(t.linkCopied)}</small>{/if}
      </div>
      <form
        class="block"
        onsubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label class="label" for="people-name">{text(t.addName)}</label>
        <div class="row">
          <input id="people-name" autocomplete="off" autocapitalize="off" spellcheck="false" bind:value={newName} />
          <select aria-label={text(t.addName)} bind:value={newLevel}>
            {#each GIVEN as level (level)}<option value={level}>{name(level)}</option>{/each}
          </select>
          <button type="submit" class="icon" aria-label={text(t.addPerson)} title={text(t.addPerson)}><Icon name="plus" /></button>
        </div>
        <small class="quiet">{text(t.addAbout)}</small>
        {#if nameProblem !== undefined}<small class="bad" role="alert">{nameProblem}</small>{/if}
      </form>
    {:else if !mayChange}
      <div class="block">
        <span class="label">{text(t.peopleTitle, game.content.project.name)}</span>
        <dl class="means">
          {#each GIVEN as level (level)}
            <dt>{name(level)}</dt>
            <dd>{about(level)}</dd>
          {/each}
        </dl>
      </div>
    {/if}
    {#each said as line (line.text)}
      <p class={line.kind} role={line.kind === 'problem' ? 'alert' : 'status'}>{line.text}</p>
    {/each}
    {#if dirty}<p class="quiet" role="status">{text(t.listUnsaved)}</p>{/if}
    {#if leaving}
      <p role="alert">{text(t.leaveAsk)}</p>
      <div class="row">
        <Action label={text(t.leaveNo)} kind="main" onpress={() => (leaving = false)} />
        <Action label={text(t.leaveYes)} onpress={onclose} />
      </div>
    {/if}

    {#snippet foot()}
      {#if mayChange}
        <Action
          label={text(t.saveList)}
          icon="check"
          kind="main"
          disabled={saving || !needsSave}
          onpress={() => void save()}
        />
      {:else if onask !== undefined}
        <Action label={text(t.askOwner, asked)} icon="chat-circle-text" onpress={() => onask(asked)} />
      {:else}
        <p class="ask">{text(t.askOwner, asked)}</p>
      {/if}
    {/snippet}
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
  }
  p {
    margin: 0 0 12px;
  }
  .lead,
  .quiet {
    color: var(--g-quiet);
  }
  .people {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  /* Where the sheet is narrow (a phone, the side panel) the picker and the bin drop under the name, never squeeze it. */
  .person {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-height: 48px;
    padding: 4px 0;
  }
  .who {
    display: flex;
    flex: 1 1 150px;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .controls {
    display: flex;
    flex: 0 1 auto;
    gap: 8px;
    margin-left: auto;
    max-width: 100%;
  }
  .controls select {
    max-width: 230px;
  }
  small {
    color: var(--g-quiet);
    font-size: 13px;
  }
  .level {
    flex: none;
    color: var(--g-quiet);
    font-size: 14px;
  }
  .block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0 0 14px;
  }
  .label {
    font-size: 14px;
    color: var(--g-quiet);
  }
  .row {
    display: flex;
    gap: 8px;
  }
  input,
  select {
    min-width: 0;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: transparent;
    color: var(--words);
    font: inherit;
  }
  input {
    flex: 1;
  }
  /* The name box keeps room to type in: the level beside it gives way first. */
  .row select {
    flex: 0 1 150px;
  }
  .icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: transparent;
    color: var(--words);
    cursor: pointer;
  }
  .icon:hover {
    background: var(--hover);
  }
  .means {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    margin: 0;
  }
  .means dt {
    font-weight: 600;
  }
  .means dd {
    margin: 0;
    color: var(--g-quiet);
  }
  .good {
    color: var(--words);
  }
  .bad,
  p.problem {
    color: var(--problem);
  }
  .ask {
    margin: 0;
    color: var(--g-quiet);
  }
</style>
