<script lang="ts">
  import Icon from './Icon.svelte'

  // A rubber stamp: a short word or two that says something was done, and by whom. It lands once, slightly turned,
  // and then rests. The sentence beside it is what a screen reader hears, so the stamp itself is hidden from one.
  interface Props {
    text: string
  }
  let { text }: Props = $props()
</script>

<div class="stamp" data-stamp aria-hidden="true">
  <Icon name="approve" />
  <span class="label">{text}</span>
</div>

<style>
  .stamp {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    /* Turned a little, a stamp's corners reach past its box; the margin keeps them inside a phone's width. */
    max-width: calc(100% - var(--space-3));
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--mark);
    border-radius: var(--corner);
    background: var(--ground);
    color: var(--words);
    overflow-wrap: anywhere;
    transform: rotate(-4deg);
    animation: land 200ms ease-out;
  }
  .label {
    min-width: 0;
  }
  /* The keyframes are named so a test can read which one is in use. */
  @keyframes land {
    from {
      opacity: 0;
      transform: rotate(-4deg) scale(1.3);
    }
    to {
      opacity: 1;
      transform: rotate(-4deg) scale(1);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .stamp {
      animation-name: fade;
    }
  }
</style>
