<script lang="ts">
  import { Icon } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { CURRENT, EDITOR_ICON, EDITORS, type EditorId, editorName } from './editors.ts'

  // The five editors in a row, in the pill of a wide screen. The one the person is in is marked current; each of the
  // others is a real button that opens its Coming soon card, with a mark-colored edge under it as its quiet sign.
  interface Props {
    /** An editor that is not built yet was pressed; `from` is the button, so focus can come back to it. */
    onsoon: (id: EditorId, from: HTMLElement) => void
  }
  let { onsoon }: Props = $props()
</script>

<nav class="switcher" aria-label={WORDS.appName}>
  {#each EDITORS as id (id)}
    {@const here = id === CURRENT}
    <button
      type="button"
      class="editor"
      class:here
      class:soon={!here}
      data-editor={id}
      aria-current={here ? 'page' : undefined}
      aria-description={here ? undefined : WORDS.comingSoon}
      onclick={(e) => {
        if (!here) onsoon(id, e.currentTarget)
      }}
    >
      <Icon name={EDITOR_ICON[id]} />
      <span class="label">{editorName(id)}</span>
    </button>
  {/each}
</nav>

<style>
  .switcher {
    display: flex;
    gap: var(--space-1);
  }
  .editor {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-2);
    border: 0;
    border-bottom: 3px solid transparent;
    border-radius: var(--corner);
    background: transparent;
    color: var(--touch);
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  .editor .label {
    font-size: var(--font-size-small);
  }
  .here {
    background: var(--touch);
    color: var(--ground);
  }
  /* Not built yet: the olive edge says so without a word. */
  .soon {
    border-bottom-color: var(--mark);
  }
</style>
