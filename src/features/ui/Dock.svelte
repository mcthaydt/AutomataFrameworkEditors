<script lang="ts">
  // Glass that floats 8 points in from the window's edge, clear of the notch and the home bar, over the canvas. It is a
  // plain box: where it sits is its `side`, what is in it is the caller's. Anything drawn inside is solid (never glass
  // inside glass). The glass turns solid by itself when the browser, the device or the person says so (ui.css).
  import type { Snippet } from 'svelte'

  interface Props {
    /** What a screen reader calls it ("Top bar"). */
    label: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    /** No padding: the controls inside fill its height, which is then exactly what the caller sets. */
    tight?: boolean
    /** As big as what is in it, in the middle of its edge, instead of the whole edge. */
    fit?: boolean
    children: Snippet
  }
  let { label, side = 'top', tight = false, fit = false, children }: Props = $props()
</script>

<div class="dock glass-1 {side}" class:tight class:fit role="group" aria-label={label}>
  {@render children()}
</div>

<style>
  .dock {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 4px;
    border-radius: 14px;
    color: var(--words);
    --quiet: var(--g-quiet);
  }
  .tight {
    padding: 0;
    border: 0;
    outline: 1px solid var(--g-edge);
    outline-offset: -1px;
    gap: 0;
  }
  .top {
    top: max(8px, env(safe-area-inset-top));
    left: max(8px, env(safe-area-inset-left));
    right: max(8px, env(safe-area-inset-right));
    min-height: var(--bar);
  }
  .bottom {
    bottom: max(8px, env(safe-area-inset-bottom));
    left: max(8px, env(safe-area-inset-left));
    right: max(8px, env(safe-area-inset-right));
  }
  .left {
    left: max(8px, env(safe-area-inset-left));
    top: calc(var(--bar) + 16px);
    bottom: max(8px, env(safe-area-inset-bottom));
    flex-direction: column;
    align-items: stretch;
  }
  .right {
    right: max(8px, env(safe-area-inset-right));
    top: calc(var(--bar) + 16px);
    bottom: max(8px, env(safe-area-inset-bottom));
    flex-direction: column;
    align-items: stretch;
  }
  .bottom.fit {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 16px);
  }
  .left.fit,
  .right.fit {
    top: 50%;
    bottom: auto;
    transform: translateY(-50%);
  }
</style>
