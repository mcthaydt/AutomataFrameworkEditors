<script lang="ts">
  // The four arrows that move the picked level a tile a tap, with what the next tap would do said under them.
  import { MovePad, type Way } from '../levels/levels.ts'
  import { type Lang, nameOf, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    level: string
    /** What one more tap would do ("…touches Room 3"), or how the keys do the same. */
    hint: string
    onnudge: (way: Way) => void
    ondone: () => void
  }
  let { lang, level, hint, onnudge, ondone }: Props = $props()

  const words = $derived(wordsIn(lang).arrange)
</script>

<div class="pad">
  <p>{typeof words.padFor === 'function' ? words.padFor(nameOf(level)) : words.padFor}</p>
  <MovePad {lang} {onnudge} {ondone} />
  <p class="hint">{hint}</p>
</div>

<style>
  .pad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    max-width: 260px;
    padding: 8px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  p {
    margin: 0;
    font-size: 13px;
  }
  .hint {
    color: var(--quiet);
  }
</style>
