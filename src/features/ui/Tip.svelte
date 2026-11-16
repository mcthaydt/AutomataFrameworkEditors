<script lang="ts">
  // A first-run tip: solid and light (dark words on the accent), the one thing meant to stand out. It goes once the
  // thing it teaches is done, or when its button is pressed, and never covers what is picked.
  interface Props {
    words: string
    gotIt: string
    ongotit: () => void
  }
  let { words, gotIt, ongotit }: Props = $props()
</script>

<div class="tip" role="note">
  <span>{words}</span>
  <button type="button" onclick={ongotit}>{gotIt}</button>
</div>

<style>
  .tip {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 320px;
    padding: 6px 6px 6px 14px;
    border-radius: 8px;
    background: var(--accent);
    color: var(--on-accent);
    box-shadow: var(--shadow);
    font: 500 13px / 1.3 var(--label);
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: 600 13px var(--label);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
