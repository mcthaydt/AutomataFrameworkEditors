<script lang="ts">
  import { WORDS } from '../words/words.ts'

  // Four arrow buttons that move the picked thing a step: the same move as the arrow keys, for a finger.
  type Way = 'left' | 'right' | 'up' | 'down'
  interface Props {
    onnudge: (way: Way) => void
  }
  let { onnudge }: Props = $props()
</script>

<div class="pad">
  <button type="button" class="up" onclick={() => onnudge('up')}>{WORDS.moveUp}</button>
  <button type="button" class="left" onclick={() => onnudge('left')}>{WORDS.moveLeft}</button>
  <button type="button" class="right" onclick={() => onnudge('right')}>{WORDS.moveRight}</button>
  <button type="button" class="down" onclick={() => onnudge('down')}>{WORDS.moveDown}</button>
</div>

<style>
  .pad {
    display: grid;
    grid-template-areas:
      '. up .'
      'left . right'
      '. down .';
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 8px;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
  button:hover {
    background: var(--hover);
  }
  .up {
    grid-area: up;
  }
  .left {
    grid-area: left;
  }
  .right {
    grid-area: right;
  }
  .down {
    grid-area: down;
  }
</style>
