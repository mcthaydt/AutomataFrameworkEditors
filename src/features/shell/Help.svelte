<script lang="ts">
  // Help: the basics as a short list, each ticked once the person has done it (with "Show me" to be walked through it),
  // then three more places to go: the tour again, the keys, and how to ask a helper (an AI) to change the game.
  import { Action, Icon, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import type { Step } from './tour.ts'

  interface Props {
    lang: Lang
    /** The basics this editor can teach now, in order. */
    steps: readonly Step[]
    /** The ones this device has seen done. */
    done: ReadonlySet<Step>
    onshow: (step: Step) => void
    ontour: () => void
    onkeys: () => void
    /** Keeps a copy of the open level, for the helper to be handed. */
    oncopy: (() => void) | undefined
    /** Opens the box where what the helper gave back is pasted; left out where there is no game to paste into. */
    onpaste?: (() => void) | undefined
    onclose: () => void
  }
  let { lang, steps, done, onshow, ontour, onkeys, oncopy, onpaste, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const h = $derived(words.help)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const LABELS = {
    'tap-the-crate': 'helpStepPick',
    'tap-place': 'helpStepTool',
    'drag-a-value': 'helpStepValue',
    'play-then-put': 'helpStepPut',
  } as const
  const count = $derived(steps.filter((step) => done.has(step)).length)
  let helper = $state(false)
</script>

<div class="scrim dim-3">
  <Sheet title={text(h.helpTitle)} close={text(words.shell.close)} {onclose}>
    <section aria-labelledby="help-basics">
      <h3 id="help-basics">{text(h.helpBasics)}</h3>
      <p class="count" role="status">{text(h.helpDone, count, steps.length)}</p>
      <ul>
        {#each steps as step (step)}
          <li class:done={done.has(step)}>
            <span class="tick" aria-hidden="true">{#if done.has(step)}<Icon name="check" />{/if}</span>
            <span class="what">{text(h[LABELS[step]])}</span>
            {#if !done.has(step)}
              <Action label={text(h.helpShow)} icon="play" onpress={() => onshow(step)} />
            {/if}
          </li>
        {/each}
      </ul>
    </section>
    <section aria-labelledby="help-more">
      <h3 id="help-more">{text(h.helpMore)}</h3>
      <button type="button" class="go" onclick={ontour}>
        <span><b>{text(h.helpTourRow)}</b><small>{text(h.helpTourAbout)}</small></span>
      </button>
      <button type="button" class="go" onclick={onkeys}>
        <span><b>{text(h.helpKeysRow)}</b><small>{text(h.helpKeysAbout)}</small></span>
      </button>
      <button type="button" class="go" aria-expanded={helper} onclick={() => (helper = !helper)}>
        <span><b>{text(h.helpHelperRow)}</b><small>{text(h.helpHelperAbout)}</small></span>
      </button>
      {#if helper}
        <div class="helper">
          <p>{text(h.helperWhat)}</p>
          <p>{text(h.helperTell)}</p>
          {#if oncopy !== undefined}<Action label={text(h.helperCopy)} icon="copy" onpress={oncopy} />{/if}
          {#if onpaste !== undefined}<Action label={text(words.helper.pasteRow)} icon="clipboard-text" onpress={onpaste} />{/if}
        </div>
      {/if}
      <p class="play">{text(words.play.tipCode)}</p>
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
  .count {
    margin: 0 0 8px;
    color: var(--g-quiet);
  }
  ul {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
  }
  .tick {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line);
    border-radius: 50%;
  }
  li.done .tick {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .what {
    flex: 1;
  }
  li.done .what {
    color: var(--g-quiet);
  }
  .go {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 56px;
    padding: 6px 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .go:hover {
    background: var(--hover);
  }
  b,
  small {
    display: block;
  }
  small {
    color: var(--g-quiet);
    font-size: 13px;
  }
  .helper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    padding: 4px 10px 8px;
  }
  .helper p {
    margin: 0;
  }
  .play {
    margin: 0;
    padding: 4px 10px 8px;
    color: var(--g-quiet);
    font-size: 13px;
  }
</style>
