<script lang="ts">
  // The first time anyone opens a game in the editors: one card over the level, in plain words. What this is, the
  // three things you do, and two ways on. The card asks nothing else: the language was picked before it, and signing
  // in waits until it is needed.
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** The game's name. */
    game: string
    onshow: () => void
    onself: () => void
  }
  let { lang, game, onshow, onself }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const steps = $derived([
    { title: words.first.welcome1Title, body: words.first.welcome1Body },
    { title: words.first.welcome2Title, body: words.first.welcome2Body },
    { title: words.first.welcome3Title, body: words.first.welcome3Body },
  ])
</script>

<div class="scrim">
  <Sheet title={text(words.first.welcomeTitle)} close={text(words.shell.close)} onclose={onself}>
    <p class="lead">{text(words.first.welcomeBody, game)}</p>
    <ol>
      {#each steps as step, at (at)}
        <li>
          <span class="n" aria-hidden="true">{at + 1}</span>
          <span><b>{text(step.title)}</b>{text(step.body)}</span>
        </li>
      {/each}
    </ol>
    <p class="small">{text(words.first.welcomeSmall)}</p>
    {#snippet foot()}
      <Action kind="plain" label={text(words.first.welcomeSelf)} onpress={onself} />
      <Action kind="main" icon="play" label={text(words.first.welcomeShow)} onpress={onshow} />
    {/snippet}
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: var(--dim);
  }
  .lead {
    margin: 0 0 12px;
  }
  ol {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .n {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }
  b {
    display: block;
  }
  .small {
    margin: 12px 0 0;
    color: var(--quiet);
  }
</style>
