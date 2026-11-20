<script lang="ts">
  // Where two people changed one thing: for each, the words that say it, both places drawn (yours and theirs), and the
  // two answers. Everything nobody else touched is not here: it goes in unasked.
  import type { GameContent } from '@automataframework/framework/headless'
  import type { Clash, Working } from '../game/game.ts'
  import { Stage } from '../levels/levels.ts'
  import { Action } from '../ui/ui.ts'
  import type { OpenPicture } from '../wire/wire.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { sayClash, sidesOf } from './clash.ts'

  interface Props {
    lang: Lang
    clashes: readonly Clash[]
    /** What the person has, and what the game has now. */
    mine: Working
    theirs: Working
    /** The answer to each, by its place in `clashes`; undefined until it is given. */
    answers: Readonly<Record<number, 'mine' | 'theirs' | undefined>>
    /** Who changed it in the game, said by name. */
    by: string
    content: GameContent
    pictures: readonly OpenPicture[]
    onchoose: (at: number, whose: 'mine' | 'theirs') => void
  }
  let { lang, clashes, mine, theirs, answers, by, content, pictures, onchoose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const c = $derived(words.whose)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
</script>

{#each clashes as clash, at (at)}
  {@const sides = sidesOf(clash, mine, theirs)}
  <section class="clash" aria-label={text(c.whoseTitle, at + 1, clashes.length)}>
    <p class="said">{sayClash(words, clash, by)}</p>
    <div class="pair">
      {#each [{ name: text(c.yours), level: sides.mine }, { name: text(c.theirs, by), level: sides.theirs }] as side (side.name)}
        <figure>
          <figcaption>{side.name}</figcaption>
          <div class="picture">
            {#if side.level !== undefined}
              <Stage level={side.level} {content} {pictures} marked={sides.marked} label={`${side.name}: ${nameOf(clash.level)}`} />
            {:else}
              <span class="none">{text(c.nothingThere)}</span>
            {/if}
          </div>
        </figure>
      {/each}
    </div>
    <div class="choose">
      <Action
        label={text(c.keepMine)}
        icon="check"
        kind={answers[at] === 'mine' ? 'main' : 'plain'}
        onpress={() => onchoose(at, 'mine')}
      />
      <Action
        label={text(c.keepTheirs, by)}
        icon="check"
        kind={answers[at] === 'theirs' ? 'main' : 'plain'}
        onpress={() => onchoose(at, 'theirs')}
      />
    </div>
  </section>
{/each}

<style>
  p {
    margin: 0 0 12px;
  }
  .clash {
    margin-bottom: 12px;
    padding: 12px 0;
    border-top: 1px solid var(--line);
  }
  .said {
    font-weight: 600;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }
  figure {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    min-width: 0;
  }
  figcaption {
    color: var(--g-quiet);
    font-size: 13px;
  }
  /* The read-only picture needs a height of its own: it is made to fill what it is given. */
  .picture {
    display: flex;
    flex-direction: column;
    height: 120px;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
  }
  .none {
    margin: auto;
    color: var(--g-quiet);
    font-size: 13px;
  }
  .choose {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
