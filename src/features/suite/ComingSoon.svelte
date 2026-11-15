<script lang="ts">
  import { onMount } from 'svelte'
  import { Button, Icon, Panel } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { EDITOR_ICON, type EditorId, editorName, editorSoon } from './editors.ts'

  // The card an editor that is not built yet opens: its icon and name, one sentence on what it will let a person do,
  // and one button. It links nowhere. Enter on the button or Escape closes it, and the screen puts focus back where it
  // was.
  interface Props {
    editor: EditorId
    onclose: () => void
  }
  let { editor, onclose }: Props = $props()

  let ok: HTMLElement | undefined = $state()
  onMount(() => {
    ok?.querySelector('button')?.focus()
  })
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div class="card" role="dialog" aria-label={editorName(editor)}>
  <Panel part="soon" edge="mark">
    <div class="body">
      <div class="head">
        <Icon name={EDITOR_ICON[editor]} />
        <strong class="name">{editorName(editor)}</strong>
        <span class="label">{WORDS.comingSoon}</span>
      </div>
      <p class="line">{editorSoon(editor)}</p>
      <div bind:this={ok}><Button label={WORDS.ok} kind="primary" onpress={onclose} /></div>
    </div>
  </Panel>
</div>

<style>
  .card {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--margin, 16px);
    pointer-events: none;
  }
  .card > :global(.panel) {
    width: min(420px, 100%);
    pointer-events: auto;
  }
  .body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
  .head :global(.icon) {
    width: 28px;
    height: 28px;
  }
  .name {
    font-family: var(--title);
    font-size: var(--font-size-big);
    font-weight: 500;
  }
  .line {
    margin: 0;
  }
</style>
