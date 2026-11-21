<script lang="ts">
  import type { Snippet } from 'svelte'
  import { stacked } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import type { Answer, Saying } from './events.ts'

  // What the screen has to say, stacked under the top bar: each is soft glass with its words and the buttons it needs.
  interface Props {
    events: readonly Saying[]
    onanswer: (event: Saying, answer: Answer) => void
    /** What else belongs in the stack (a note from someone, with its own button), above the tips. */
    children?: Snippet
  }
  let { events, onanswer, children }: Props = $props()

</script>

{#if events.length > 0 || children !== undefined}
  <div class="events" style:--stacked="{stacked.height}px">
    {@render children?.()}
    {#each events as event (event.id)}
      <div class="event glass-2 {event.kind}" role={event.kind === 'problem' ? 'alert' : 'status'}>
        <p>{event.text}</p>
        {#if event.details !== undefined && event.details.length > 0}
          <ul>
            {#each event.details as line (line)}<li>{line}</li>{/each}
          </ul>
        {/if}
        <div class="buttons">
          {#if event.ask === 'leave'}
            <button type="button" class="main" onclick={() => onanswer(event, 'stay')}>{WORDS.leaveNo}</button>
            <button type="button" onclick={() => onanswer(event, 'leave')}>{WORDS.leaveYes}</button>
          {/if}
          {#if event.show !== undefined}
            <button type="button" class="main" onclick={() => onanswer(event, 'show')}>{event.show}</button>
          {/if}
          {#if event.dismiss === true}
            <button type="button" onclick={() => onanswer(event, 'dismiss')}>{WORDS.tipGotIt}</button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  /* What floats at the top by itself (a note with Undo, the helper's card, the play bar) takes its own rows: the tips stand below, never under. */
  .events {
    position: absolute;
    top: calc(var(--bar) + 20px + var(--stacked, 0px));
    left: 50%;
    z-index: 8;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(568px, 100%);
    max-height: calc(100% - var(--bar));
    /* The rows scroll, and the box is the cards' width plus the room their shadows take: a scroller cuts what lies
       outside it, and a shadow cut square shows beside the round corners (design round 1, A17). The room lets presses
       through to the level. */
    padding: 0 24px 32px;
    box-sizing: border-box;
    overflow-y: auto;
    pointer-events: none;
    transform: translateX(-50%);
  }
  @media (max-width: 552px) {
    .events {
      padding-inline: 8px;
    }
  }
  .event {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    color: var(--words);
  }
  .event.problem {
    border-color: var(--problem);
  }
  p {
    margin: 0;
  }
  ul {
    margin: 0;
    padding-left: 18px;
    overflow-wrap: anywhere;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .buttons:empty {
    display: none;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 600 inherit;
    font-family: var(--label);
    cursor: pointer;
  }
  button:hover {
    background: var(--hover);
  }
  button.main {
    min-height: 48px;
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
