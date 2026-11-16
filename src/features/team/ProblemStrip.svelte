<script lang="ts">
  // The problem being looked at, over the level or the map: which one of how many, what it says, and the way on and the
  // way back. It sits at the bottom, above the tools, so it covers neither the top bar nor the card the map draws by a wall.
  import { Action } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** Which problem, from 1, and how many there are. */
    at: number
    of: number
    words: string
    /** Where "Back" goes: the sheet that was open, or nowhere in particular. */
    back: 'put' | 'send' | undefined
    onnext: () => void
    onback: () => void
  }
  let { lang, at, of, words: said, back, onnext, onback }: Props = $props()

  const w = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
</script>

<div class="strip" role="status">
  <b>{text(w.kept.problemOf, at, of)}</b>
  <p>{said}</p>
  <div class="buttons">
    {#if of > 1}<Action label={text(w.kept.nextProblem)} onpress={onnext} />{/if}
    <Action
      label={back === 'put' ? text(w.kept.backToPut) : back === 'send' ? text(w.kept.backToSend) : text(w.kept.back)}
      kind="main"
      onpress={onback}
    />
  </div>
</div>

<style>
  .strip {
    position: absolute;
    bottom: 96px;
    left: 50%;
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(520px, calc(100% - 16px));
    padding: 12px 14px;
    border: 1px solid var(--problem);
    border-radius: 12px;
    background: var(--s-bg);
    -webkit-backdrop-filter: var(--s-filter);
    backdrop-filter: var(--s-filter);
    box-shadow: var(--g-shine), var(--shadow);
    color: var(--words);
    transform: translateX(-50%);
  }
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  /* A phone on its side has little height, and its tools stand at the side: the strip lies low and flat. */
  @media (max-height: 500px) {
    .strip {
      bottom: 12px;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      width: min(640px, calc(100% - 180px));
    }
    .strip p {
      flex: 1 1 240px;
    }
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
