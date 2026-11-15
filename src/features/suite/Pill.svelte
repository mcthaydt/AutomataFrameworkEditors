<script lang="ts">
  import { type Shape } from '../levels/levels.ts'
  import { Menu, type MenuItem, Panel } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { CURRENT, EDITOR_ICON, EDITORS, type EditorId, editorName } from './editors.ts'
  import Switcher from './Switcher.svelte'

  // The name of where the person is, top left. On a wide screen: the game (it opens the game's page), the level, then the
  // five editors in a row. On a narrower one: the level, and a menu named for the editor that holds the five editors and
  // what else the screen offers. Whatever the shape, there is exactly one heading: the level's name.
  interface Props {
    shape: Shape
    game: string
    /** The level's name in words. */
    level: string
    onhome: () => void
    /** What the menu holds after the editors (the game's page on a narrower screen, and the rest of the actions). */
    extra: readonly MenuItem[]
    onsoon: (id: EditorId, from: HTMLElement | undefined) => void
  }
  let { shape, game, level, onhome, extra, onsoon }: Props = $props()

  const items = $derived<readonly MenuItem[]>([
    ...EDITORS.map((id) => ({
      id: `editor-${id}`,
      label: editorName(id),
      icon: EDITOR_ICON[id],
      ...(id === CURRENT ? { current: true } : { tag: WORDS.comingSoon }),
      onpress: () => onsoon(id, undefined),
    })),
    ...extra,
  ])
</script>

<Panel part="pill">
  <div class="pill">
    {#if shape === 'wide'}
      <button type="button" class="game" data-home onclick={onhome}>{game}</button>
      <h1 class="name">{level}</h1>
      <Switcher onsoon={(id, from) => onsoon(id, from)} />
    {:else}
      <h1 class="name">{level}</h1>
      <Menu label={editorName(CURRENT)} icon="world" {items} attrs={{ 'data-pill-menu': '' }} />
    {/if}
  </div>
</Panel>

<style>
  .pill {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-1) var(--space-2);
  }
  .name {
    margin: 0;
    padding: 0 var(--space-2);
    font-size: var(--font-size-big);
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .game {
    min-height: 44px;
    padding: 0 var(--space-2);
    border: 0;
    border-radius: var(--corner);
    background: transparent;
    color: var(--touch);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
  }
</style>
