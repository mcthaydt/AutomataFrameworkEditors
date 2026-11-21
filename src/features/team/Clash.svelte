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
    {#if clash.what === 'thing' && (sides.mine ?? sides.theirs) !== undefined}
      <!-- One level, with both places of the thing on it: where it is for you, and where it is for them. -->
      {@const here = sides.mine ?? sides.theirs}
      {@const both = sides.mine !== undefined && sides.theirs !== undefined}
      {@const apart = both && clash.mine !== undefined && clash.theirs !== undefined && (clash.mine.x !== clash.theirs.x || clash.mine.y !== clash.theirs.y)}
      <div class="picture one">
        {#if here !== undefined}
          <Stage
            level={here}
            {content}
            {pictures}
            marked={sides.marked}
            around={[clash.mine, clash.theirs].flatMap((t) => (t === undefined ? [] : [{ x: t.x, y: t.y }]))}
            tags={{ [clash.thing]: sides.mine !== undefined ? text(c.yours) : text(c.theirs, by) }}
            elsewhere={apart && sides.theirs !== undefined
              ? [{ level: sides.theirs, thing: clash.thing, name: text(c.theirs, by) }]
              : []}
            label={nameOf(clash.level)}
          />
        {/if}
      </div>
    {:else}
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
    {/if}
    <!-- A choice of two, never a main button: the picked one is marked and carries the tick; the sheet's own button goes on. -->
    <div class="choose">
      <span class="pick" class:on={answers[at] === 'mine'}>
        <Action
          label={text(c.keepMine)}
          {...answers[at] === 'mine' ? { icon: 'check' as const } : {}}
          onpress={() => onchoose(at, 'mine')}
        />
      </span>
      <span class="pick" class:on={answers[at] === 'theirs'}>
        <Action
          label={text(c.keepTheirs, by)}
          {...answers[at] === 'theirs' ? { icon: 'check' as const } : {}}
          onpress={() => onchoose(at, 'theirs')}
        />
      </span>
    </div>
  </section>
{/each}

<style>
  p {
    margin: 0 0 12px;
  }
  .pick {
    display: contents;
  }
  .pick.on :global(.action) {
    background: var(--picked);
    box-shadow: inset 0 0 0 2px var(--words);
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
  /* One level with both places on it is bigger than a pair: the two places must be told apart. */
  .one {
    height: 190px;
    margin-bottom: 28px;
  }
  /* A phone on its side has little height: the pictures give way so both answers stay in view. */
  @media (max-height: 500px) {
    .picture {
      height: 56px;
    }
    .one {
      height: 96px;
    }
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
