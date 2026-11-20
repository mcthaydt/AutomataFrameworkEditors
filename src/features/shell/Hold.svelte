<script lang="ts">
  // The free thumb's buttons: on a touch screen, the keys a computer holds (Shift, Alt) are buttons held with the thumb
  // that is not drawing. Holding keeps one on; a quick tap keeps it on until it is tapped again. A computer is drawn
  // none of this, since it has the keys. They fold away behind one button, and "I draw with my left hand" turns them round.
  import { onDestroy } from 'svelte'
  import { Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import type { HoldButton } from './docks.ts'

  interface Props {
    lang: Lang
    buttons: readonly HoldButton[]
    /** True on a touch screen only. */
    touch: boolean
    open: boolean
    mirror?: boolean
    /** How far in from the screen's side it sits, clear of a toolbar or the list there. */
    inset?: number
    /** One is held (true) or let go (false). */
    onhold: (id: string, held: boolean) => void
    ontoggle: () => void
  }
  let { lang, buttons, touch, open, mirror = false, inset = 0, onhold, ontoggle }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (one: Row): string => (typeof one === 'string' ? one : one())
  let kept = $state<readonly string[]>([])
  const downAt: Record<string, number> = {}
  const TAP = 300
  // Taken away (another tool is picked): what was kept on is let go, so nothing stays held that cannot be seen.
  onDestroy(() => kept.forEach((id) => onhold(id, false)))

  function down(id: string): void {
    downAt[id] = Date.now()
    if (!kept.includes(id)) onhold(id, true)
  }
  function up(id: string): void {
    const tapped = Date.now() - (downAt[id] ?? 0) < TAP
    if (kept.includes(id)) {
      if (tapped) {
        kept = kept.filter((one) => one !== id)
        onhold(id, false)
      }
    } else if (tapped) {
      kept = [...kept, id]
    } else {
      onhold(id, false)
    }
  }
  /** A key press on the button: Space or Enter keeps it on, and again lets go. */
  function key(event: KeyboardEvent, id: string): void {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    if (kept.includes(id)) {
      kept = kept.filter((one) => one !== id)
      onhold(id, false)
    } else {
      kept = [...kept, id]
      onhold(id, true)
    }
  }
</script>

{#if touch}
  <div class="hold glass-1" class:mirror style:--inset="{inset}px" role="group" aria-label={text(words.panels.holdLabel)}>
    <button
      type="button"
      class="fold"
      aria-expanded={open}
      aria-label={`${text(words.panels.holdLabel)}: ${text(open ? words.panels.holdFold : words.panels.holdHow)}`}
      onclick={ontoggle}
    >
      <Icon name={open ? 'caret-left' : 'caret-right'} /><span>{text(words.panels.holdLabel)}</span>
    </button>
    {#if open}
      {#each buttons as button (button.id)}
        <button
          type="button"
          class="button"
          aria-pressed={kept.includes(button.id)}
          onpointerdown={() => down(button.id)}
          onpointerup={() => up(button.id)}
          onpointercancel={() => up(button.id)}
          onkeydown={(event) => key(event, button.id)}
        >
          <Icon name={button.icon} /><span>{text(words.panels[button.words])}</span>
        </button>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .hold {
    position: absolute;
    left: calc(max(8px, env(safe-area-inset-left)) + var(--inset));
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    color: var(--words);
    --quiet: var(--g-quiet);
  }
  .mirror {
    left: auto;
    right: calc(max(8px, env(safe-area-inset-right)) + var(--inset));
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    touch-action: none;
  }
  .button[aria-pressed='true'] {
    background: var(--picked);
    color: var(--bright);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
</style>
