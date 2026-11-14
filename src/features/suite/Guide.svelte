<script lang="ts">
  import { Button } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'

  // The strip at the top of every screen during the first run: where the person is in it, a row of dots, what to do
  // next, and a way to hide it for good. It is a status region so each new step is read out.
  interface Props {
    /** The step's number among the steps this person counts, and how many there are; none on Welcome and when done. */
    count: { n: number; of: number } | undefined
    text: string
    onhide: () => void
  }
  let { count, text, onhide }: Props = $props()
</script>

<div class="guide" role="status">
  {#if count !== undefined}
    <div class="count">
      <span>{WORDS.guideCount(count.n, count.of)}</span>
      <span class="dots" aria-hidden="true">
        {#each { length: count.of } as _, i (i)}
          <span class="dot" class:filled={i < count.n}></span>
        {/each}
      </span>
    </div>
  {/if}
  <p class="text">{text}</p>
  <Button label={WORDS.guideHide} onpress={onhide} />
</div>

<style>
  .guide {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    align-items: center;
    margin: var(--space-2) var(--space-3) 0;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
  }
  .count {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    font-weight: 700;
  }
  .dots {
    display: flex;
    gap: var(--space-1);
  }
  .dot {
    width: 12px;
    height: 12px;
    border: 1px solid var(--words);
    border-radius: var(--corner);
  }
  .filled {
    background: var(--touch);
    border-color: var(--touch);
  }
  .text {
    flex: 1 1 14rem;
    margin: 0;
  }
</style>
