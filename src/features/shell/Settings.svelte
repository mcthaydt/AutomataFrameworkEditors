<script lang="ts">
  // Settings: one sheet, plain words, each choice saying what it does. "For everyone on <the game>" is kept with the
  // game, so a helper can read and change it too, and only an Owner may change it. "For me" is kept on this device and
  // is never something a helper needs.
  import { untrack } from 'svelte'
  import type { Me } from '../device/device.ts'
  import type { EditorsFile } from '../files/files.ts'
  import { Action, Knob, Segment, Sheet } from '../ui/ui.ts'
  import { LANGUAGE_NAMES, LANGUAGES, type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    me: Me
    /** The game's name. */
    game: string
    /** What the game says now about a level with a problem. */
    problems: EditorsFile['problems']
    /** May this person change what is for everyone? Only an Owner may. */
    owner: boolean
    /** Who to ask, when this person may not. */
    owners: readonly string[]
    /** Told when something "For me" is changed: kept on this device. */
    onme: (next: Me) => void
    /** An Owner's change for everyone: whether it went in. */
    onproblems: (next: EditorsFile['problems']) => Promise<boolean>
    ontour: () => void
    onclose: () => void
  }
  let { lang, me, game, problems, owner, owners, onme, onproblems, ontour, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const s = $derived(words.settings)

  let chosen = $state<EditorsFile['problems']>(untrack(() => problems))
  let said = $state<'changed' | 'failed' | undefined>(undefined)
  const groupId = $props.id()

  async function choose(next: EditorsFile['problems']): Promise<void> {
    if (!owner || next === chosen) return
    const was = chosen
    chosen = next
    said = undefined
    const went = await onproblems(next)
    if (!went) chosen = was
    said = went ? 'changed' : 'failed'
  }
  const options = $derived([
    { id: 'warn' as const, words: s.setWarn, about: s.setWarnAbout },
    { id: 'stop' as const, words: s.setStop, about: s.setStopAbout },
  ])
  const rowOptions = $derived([
    { id: 'auto', words: text(s.setAuto) },
    { id: 'touch', words: text(s.setBig) },
    { id: 'small', words: text(s.setSmall) },
  ])
  const glassOptions = $derived([
    { id: 'auto', words: text(s.setAuto) },
    { id: 'on', words: text(s.setOn) },
    { id: 'off', words: text(s.setOff) },
  ])
</script>

<div class="scrim dim-3">
  <Sheet title={text(s.settingsTitle)} close={text(words.shell.close)} {onclose}>
    <section aria-labelledby="{groupId}-all">
      <h3 id="{groupId}-all">{text(s.setEveryoneFor, game)}</h3>
      <p class="about">{text(s.setEveryoneAbout)}</p>
      <div role="radiogroup" aria-label={text(s.setProblems)}>
        <b class="q">{text(s.setProblems)}</b>
        {#each options as option (option.id)}
          <label class="opt" class:on={chosen === option.id} class:off={!owner}>
            <input
              type="radio"
              name="{groupId}-problems"
              value={option.id}
              checked={chosen === option.id}
              disabled={!owner}
              onchange={() => void choose(option.id)}
            />
            <span>{text(option.words)}<small>{text(option.about)}</small></span>
          </label>
        {/each}
      </div>
      {#if !owner}
        <p class="ask">{text(s.setAskWho, owners.join(', '))}</p>
      {/if}
      <p class="said" role="status">
        {said === 'changed' ? text(s.setChangedAll) : said === 'failed' ? text(s.setFailedAll) : ''}
      </p>
    </section>

    <section aria-labelledby="{groupId}-me">
      <h3 id="{groupId}-me">{text(s.setForMe)}</h3>
      <p class="about">{text(s.setForMeAbout)}</p>
      <h4>{text(s.setNavLook)}</h4>
      <div class="row">
        <span>{text(s.setRows)}<small>{text(s.setRowsAbout)}</small></span>
        <Segment
          label={text(s.setRows)}
          options={rowOptions}
          value={me.rows}
          onchange={(id) => onme({ ...me, rows: id === 'touch' ? 'touch' : id === 'small' ? 'small' : 'auto' })}
        />
      </div>
      <div class="row">
        <span>{text(s.setGlass)}<small>{text(s.setGlassAbout)}</small></span>
        <Segment
          label={text(s.setGlass)}
          options={glassOptions}
          value={me.glass}
          onchange={(id) => onme({ ...me, glass: id === 'on' ? 'on' : id === 'off' ? 'off' : 'auto' })}
        />
      </div>
      <h4>{text(s.setNavTips)}</h4>
      <div class="row">
        <span>{text(s.setTips)}</span>
        <Knob on={me.tips} label={text(s.setTips)} onchange={(on) => onme({ ...me, tips: on })} />
      </div>
      <div class="row">
        <span>{text(s.setTour)}</span>
        <Action label={text(s.setTourAgain)} icon="play" onpress={ontour} />
      </div>
      <h4>{text(s.setNavLanguage)}</h4>
      <div class="row">
        <label for="{groupId}-lang">{text(s.setLanguage)}</label>
        <select
          id="{groupId}-lang"
          value={lang}
          onchange={(event) => {
            const picked = LANGUAGES.find((one) => one === event.currentTarget.value)
            if (picked !== undefined) onme({ ...me, language: picked })
          }}
        >
          {#each LANGUAGES as one (one)}
            <option value={one} lang={one}>{LANGUAGE_NAMES[one].name}</option>
          {/each}
        </select>
      </div>
    </section>
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
  }
  h3 {
    margin: 12px 0 2px;
    font: 600 18px / 1.2 var(--title);
  }
  h4 {
    margin: 16px 0 4px;
    color: var(--g-quiet);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .about {
    margin: 0 0 8px;
    color: var(--g-quiet);
  }
  .q {
    display: block;
    margin: 8px 0 4px;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 6px 10px;
    border-radius: 10px;
    cursor: pointer;
  }
  .opt:hover {
    background: var(--hover);
  }
  .opt.on {
    background: var(--picked);
  }
  .opt.off {
    cursor: default;
  }
  .opt input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  small {
    display: block;
    color: var(--g-quiet);
    font-size: 13px;
  }
  .ask {
    margin: 8px 0 0;
    color: var(--accent);
  }
  .said {
    min-height: 1.35em;
    margin: 6px 0 0;
    color: var(--g-quiet);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 6px 0;
  }
  .row > :global(.segment) {
    flex: none;
  }
  /* A phone has no room beside a choice: the name and its helper line go above it, the full width. */
  @media (max-width: 500px) {
    .row:has(> :global(.segment)) {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
    }
  }
  select {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
</style>
