<script lang="ts">
  import { tick } from 'svelte'
  import Icon from './Icon.svelte'
  import type { IconName } from './icons.ts'
  import type { MenuItem } from './menu.ts'
  import Panel from './Panel.svelte'

  // A button that opens a short list of things to press. Real buttons all the way: the trigger says it opens a menu and
  // whether it is open, every row is at least 44 px, Escape or a press outside closes it, and focus goes back to the
  // trigger first, so whatever a row opens can take the focus back when it closes (the Coming soon card does).
  interface Props {
    /** What the trigger says, and what a screen reader calls the list. */
    label: string
    icon?: IconName
    items: readonly MenuItem[]
    /** Which edge of the trigger the list lines up with, so a list at the right of the screen never runs off it. */
    align?: 'start' | 'end'
    /** Plain attributes for the trigger, for a test or a script to find it by. */
    attrs?: Readonly<Record<string, string>>
  }
  let { label, icon, items, align = 'start', attrs = {} }: Props = $props()

  let open = $state(false)
  let trigger: HTMLButtonElement | undefined = $state()
  let list: HTMLDivElement | undefined = $state()

  async function show(): Promise<void> {
    open = true
    await tick()
    // Closed again before the list came (a quick Escape): nothing to focus, and focus stays where close put it.
    if (open) list?.querySelector<HTMLButtonElement>('button')?.focus()
  }
  function close(): void {
    open = false
    trigger?.focus()
    // The list goes on the next update; if it held the focus when it went, the focus comes back to the button.
    void tick().then(() => {
      if (!open && document.activeElement === document.body) trigger?.focus()
    })
  }
  function pick(item: MenuItem): void {
    close()
    if (item.current !== true) item.onpress()
  }
  function keys(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const rows = [...(list?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const at = rows.indexOf(document.activeElement as HTMLButtonElement)
    const next = rows[(at + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]
    if (next === undefined) return
    e.preventDefault()
    next.focus()
  }
  // A press anywhere else puts the list away. Listening on the window, not the list, so the level behind it is reached too.
  $effect(() => {
    if (!open) return
    const away = (e: PointerEvent): void => {
      const target = e.target as Node | null
      if (target !== null && (list?.contains(target) === true || trigger?.contains(target) === true)) return
      open = false
    }
    window.addEventListener('pointerdown', away, true)
    return () => window.removeEventListener('pointerdown', away, true)
  })
</script>

<div class="menu">
  <button
    type="button"
    class="trigger"
    bind:this={trigger}
    aria-haspopup="menu"
    aria-expanded={open}
    {...attrs}
    onclick={() => (open ? close() : void show())}
  >
    {#if icon !== undefined}<Icon name={icon} />{/if}
    <span class="words">{label}</span>
    <Icon name="menu" />
  </button>
  {#if open}
    <div class="list" class:end={align === 'end'} bind:this={list} role="menu" aria-label={label} tabindex="-1" onkeydown={keys}>
      <Panel part="menu">
        <div class="rows">
          {#each items as item (item.id)}
            <button
              type="button"
              class="row"
              role="menuitem"
              aria-current={item.current === true ? 'true' : undefined}
              data-item={item.id}
              onclick={() => pick(item)}
            >
              {#if item.icon !== undefined}<Icon name={item.icon} />{/if}
              <span class="words">{item.label}</span>
              {#if item.tag !== undefined}<span class="tag label">{item.tag}</span>{/if}
            </button>
          {/each}
        </div>
      </Panel>
    </div>
  {/if}
</div>

<style>
  .menu {
    position: relative;
    display: inline-flex;
  }
  .trigger,
  .row {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--corner);
    background: transparent;
    color: var(--touch);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
  }
  .words {
    min-width: 0;
    text-align: left;
    overflow-wrap: anywhere;
  }
  /* The list hangs under the trigger; the panel inside it is the one floating look. */
  .list {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    z-index: 5;
    min-width: 240px;
    max-width: min(360px, calc(100vw - 32px));
    /* The one place a menu may scroll: a long list in a short window. */
    max-height: calc(100vh - 96px);
    overflow-y: auto;
    touch-action: pan-y;
  }
  .list.end {
    right: 0;
    left: auto;
  }
  .rows {
    display: flex;
    flex-direction: column;
    padding: var(--space-1);
  }
  .row {
    justify-content: flex-start;
    width: 100%;
  }
  .row[aria-current='true'] {
    background: var(--touch);
    color: var(--ground);
  }
  /* The tag is a word on the ground's edge colour, never mark on words. */
  .tag {
    margin-left: auto;
    padding: 2px var(--space-2);
    border: 1px solid var(--mark);
    border-radius: var(--corner);
    color: var(--quiet);
  }
</style>
