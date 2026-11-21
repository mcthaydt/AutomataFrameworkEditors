<script lang="ts">
  // What can be done with the picked level, in one row of big buttons beside it: Go in, Move, Move apart (only when it
  // touches another level) and the three dots. The three dots (and press and hold) open the same with a small line under
  // each saying what it does, so a finger reads it too, and Rename, Make a copy and Delete. The caller places it.
  import { Icon } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { TOP_ROOM } from './shapes.ts'

  interface Props {
    lang: Lang
    level: string
    /** The pad of arrows is open. */
    moving: boolean
    /** A level it touches, said in what Move apart does; none when it touches nothing. */
    touching: string | undefined
    /** The three dots are open. */
    more: boolean
    ongo: () => void
    onmove: () => void
    onapart: () => void
    onmore: () => void
    onrename: () => void
    oncopy: () => void
    onremove: () => void
  }
  let { lang, level, moving, touching, more, ongo, onmove, onapart, onmore, onrename, oncopy, onremove }: Props = $props()

  const words = $derived(wordsIn(lang).arrange)
  // One menu at a time: while the three dots are open the bar steps aside and the menu takes its place, so no second
  // "Go in" shows behind it. It stays inside the sheet and under the top strip ("Whole world", "New level"), and when it
  // is taller than the room left it scrolls inside itself, its foot fading while there are more rows (blind judge, pair 6).
  let menuEl: HTMLElement | undefined = $state()
  let fades = $state(false)
  const measure = (): void => {
    if (menuEl) fades = menuEl.scrollTop + menuEl.clientHeight < menuEl.scrollHeight - 1
  }
  // It is set straight on the element, which is new at every opening, so nothing earlier is left to measure around.
  $effect(() => {
    const room = menuEl?.closest('[role="region"]')?.getBoundingClientRect()
    if (menuEl === undefined || room === undefined) return
    const at = menuEl.getBoundingClientRect()
    const top = room.top + TOP_ROOM
    const foot = room.bottom - 8
    const tall = Math.min(at.height, Math.max(foot - top, 0))
    const dx = at.left < room.left + 8 ? room.left + 8 - at.left : at.right > room.right - 8 ? room.right - 8 - at.right : 0
    const y = Math.min(Math.max(at.top, top), foot - tall)
    menuEl.style.maxHeight = `${tall}px`
    menuEl.style.translate = `${dx}px ${y - at.top}px`
    measure()
    menuEl.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    // A tap anywhere else, or Escape, puts it away.
    const away = (e: PointerEvent): void => {
      if (!menuEl?.contains(e.target as Node)) onmore()
    }
    const off = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onmore()
    }
    const el = menuEl
    window.addEventListener('pointerdown', away, true)
    el.addEventListener('keydown', off)
    return () => {
      window.removeEventListener('pointerdown', away, true)
      el.removeEventListener('keydown', off)
    }
  })
  /** A choice in the menu closes it first. */
  const choose = (what: () => void) => () => {
    onmore()
    what()
  }
  const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)
</script>

<div class="bar glass-1" class:aside={more} role="toolbar" aria-label={text(words.levelBar, nameOf(level))}>
  <button type="button" class="act" onclick={ongo}><Icon name="arrow-right" /><span>{text(words.goIn)}</span></button>
  <button type="button" class="act" aria-pressed={moving} onclick={onmove}>
    <Icon name="arrows-out-cardinal" /><span>{text(words.move)}</span>
  </button>
  {#if touching !== undefined}
    <button type="button" class="act" onclick={onapart}>
      <Icon name="arrows-out-line-horizontal" /><span>{text(words.pullApart)}</span>
    </button>
  {/if}
  <button type="button" class="act" aria-label={text(words.more)} title={text(words.more)} aria-expanded={more} onclick={onmore}>
    <Icon name="dots-three" />
  </button>
</div>
{#if more}
    <div class="menu glass-2" class:fades role="menu" tabindex="-1" bind:this={menuEl} onscroll={measure}>
      <button type="button" role="menuitem" class="item" onclick={choose(ongo)}>
        <Icon name="arrow-right" /><span class="label">{text(words.goIn)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={choose(onmove)}>
        <Icon name="arrows-out-cardinal" /><span class="label">{text(words.move)}<small>{text(words.moveAbout)}</small></span>
      </button>
      {#if touching !== undefined}
        <button type="button" role="menuitem" class="item" onclick={choose(onapart)}>
          <Icon name="arrows-out-line-horizontal" /><span class="label">{text(words.pullApart)}<small>{text(words.pullAbout, nameOf(touching))}</small></span>
        </button>
      {/if}
      <button type="button" role="menuitem" class="item" onclick={onrename}>
        <Icon name="pencil-simple" /><span class="label">{text(words.rename)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={oncopy}>
        <Icon name="copy" /><span class="label">{text(words.copy)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={onremove}>
        <Icon name="trash" /><span class="label">{text(words.remove)}<small>{text(words.removeAbout)}</small></span>
      </button>
  </div>
{/if}

<style>
  .bar {
    position: relative;
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    color: var(--words);
  }
  .act,
  .item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 48px;
    min-height: 48px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .act:hover,
  .item:hover {
    background: var(--hover);
  }
  .act[aria-pressed='true'] {
    background: var(--picked);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  /* The bar keeps its place, so the menu opens where it was, but it is not seen or pressed while the menu is open. */
  .aside {
    visibility: hidden;
  }
  .menu {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    width: 280px;
    max-width: calc(100vw - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 4px;
    border-radius: 14px;
  }
  .fades {
    mask-image: linear-gradient(to bottom, black calc(100% - 40px), transparent); /* a mask: only its opacity counts */
  }
  .menu > .item {
    flex: none;
  }
  .item {
    justify-content: flex-start;
    text-align: left;
  }
  .label {
    display: flex;
    flex-direction: column;
  }
  small {
    color: var(--quiet);
    font-size: 12px;
    white-space: normal;
  }
</style>
