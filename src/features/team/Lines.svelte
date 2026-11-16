<script lang="ts">
  // What a person changed, one line each: what was done, and the level it was in.
  import type { ChangeLine } from '../game/game.ts'
  import type { Words } from '../words/words.ts'
  import { sayLine } from './lines.ts'

  interface Props {
    words: Words
    lines: readonly ChangeLine[]
  }
  let { words, lines }: Props = $props()
</script>

<ul class="lines">
  {#each lines as line, at (at)}
    {@const said = sayLine(words, line)}
    <li><span>{said.words}</span>{#if said.level !== undefined}<small>{said.level}</small>{/if}</li>
  {/each}
</ul>

<style>
  .lines {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  small {
    flex: none;
    color: var(--g-quiet);
  }
</style>
