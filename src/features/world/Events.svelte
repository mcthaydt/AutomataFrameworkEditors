<script lang="ts">
  import { WORDS } from '../words/words.ts'
  import type { Answer, Saying } from './events.ts'

  // What the screen has to say, stacked under the top bar: each is soft glass with its words and the buttons it needs.
  interface Props {
    events: readonly Saying[]
    onanswer: (event: Saying, answer: Answer) => void
  }
  let { events, onanswer }: Props = $props()

  let box: HTMLTextAreaElement | undefined = $state()
  $effect(() => {
    box?.focus()
    box?.select()
  })
</script>

{#if events.length > 0}
  <div class="events">
    {#each events as event (event.id)}
      <div class="event {event.kind}" role={event.kind === 'problem' ? 'alert' : 'status'}>
        <p>{event.text}</p>
        {#if event.box !== undefined}
          <textarea class="box" readonly rows="6" bind:this={box} value={event.box}></textarea>
        {/if}
        {#if event.details !== undefined && event.details.length > 0}
          <ul>
            {#each event.details as line (line)}<li>{line}</li>{/each}
          </ul>
        {/if}
        <div class="buttons">
          {#if event.ask === 'sign-in'}
            <button type="button" class="main" onclick={() => onanswer(event, 'sign-in')}>{WORDS.signIn}</button>
          {:else if event.ask === 'changed-elsewhere'}
            <button type="button" onclick={() => onanswer(event, 'take-theirs')}>{WORDS.takeTheirs}</button>
            <button type="button" onclick={() => onanswer(event, 'keep-mine')}>{WORDS.keepMine}</button>
          {:else if event.ask === 'leave'}
            <button type="button" class="main" onclick={() => onanswer(event, 'stay')}>{WORDS.leaveNo}</button>
            <button type="button" onclick={() => onanswer(event, 'leave')}>{WORDS.leaveYes}</button>
          {:else if event.ask === 'keep'}
            <button type="button" onclick={() => onanswer(event, 'copy-file')}>{WORDS.copyKeep}</button>
            <button type="button" onclick={() => onanswer(event, 'copy-text')}>{WORDS.copyLevel}</button>
          {/if}
          {#if event.dismiss === true || event.ask === 'keep'}
            <button type="button" onclick={() => onanswer(event, 'dismiss')}>{WORDS.tipGotIt}</button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .events {
    position: absolute;
    top: calc(var(--bar) + 20px);
    left: 50%;
    z-index: 8;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(520px, calc(100% - 16px));
    max-height: calc(100% - var(--bar) - 32px);
    overflow-y: auto;
    transform: translateX(-50%);
  }
  .event {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--g-edge);
    border-radius: 12px;
    background: var(--s-bg);
    -webkit-backdrop-filter: var(--s-filter);
    backdrop-filter: var(--s-filter);
    box-shadow: var(--g-shine), var(--shadow);
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
  .box {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 12px / 1.4 var(--measure);
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
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
