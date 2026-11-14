<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Button, Icon, Stamp, Tool } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import type { NotesMode } from './notes-mode.ts'
  import { nextNotesMode } from './notes-mode.ts'
  import ThingCard from './ThingCard.svelte'

  // The tools that float over the level: the title, Save and the status on top, the copy tools and the notes' switch at
  // the side, the picked thing's card, Undo and Redo, and what was just said and the stamp, over the clear cell. They are
  // a grid with fixed tracks, so picking a thing never refits the level under a finger. Nothing here knows about the
  // level: it is told what to show and what each press does.
  interface Props {
    back?: { label: string; onpress: () => void } | undefined
    title: string
    canSave: boolean
    saveKind: 'primary' | 'plain'
    status: 'clean' | 'dirty' | 'saving' | 'saved'
    statusText: string
    standing: Snippet | undefined
    said: Snippet | undefined
    stamp: string | undefined
    notes: NotesMode
    onnotes: (mode: NotesMode) => void
    oncopytext: (() => void) | undefined
    oncopyfile: (() => void) | undefined
    /** The pair of arrows a pressed note points at. */
    asked: 'x' | 'y' | undefined
    thing: { readonly id: string; readonly x: number; readonly y: number } | undefined
    solid: boolean
    onnudge: (way: 'left' | 'right' | 'up' | 'down') => void
    canUndo: boolean
    canRedo: boolean
    onundo: () => void
    onredo: () => void
    onsave: () => void
    /** The cell the tools leave clear: the level is fitted into it. */
    clearBox?: HTMLElement | undefined
    /** The picked thing's card, which a pressed note reaches into. */
    card?: HTMLElement | undefined
  }
  let {
    back,
    title,
    canSave,
    saveKind,
    status,
    statusText,
    standing,
    said,
    stamp,
    notes,
    onnotes,
    oncopytext,
    oncopyfile,
    asked,
    thing,
    solid,
    onnudge,
    canUndo,
    canRedo,
    onundo,
    onredo,
    onsave,
    clearBox = $bindable(),
    card = $bindable(),
  }: Props = $props()
</script>

<div class="floats">
  <div class="clear" data-clear bind:this={clearBox}></div>
  <section class="panel top" data-panel>
    <div class="row">
      {#if back !== undefined}<Button label={back.label} icon="back" onpress={back.onpress} />{/if}
      <div class="heading">
        <span class="label"><Icon name="world" /> {WORDS.editorWorld}</span>
        <h1 class="title">{title}</h1>
      </div>
      <div class="save">
        <Button
          label={WORDS.save}
          icon="save"
          kind={saveKind}
          disabled={!canSave || status === 'clean' || status === 'saving' || status === 'saved'}
          onpress={onsave}
        />
      </div>
    </div>
    <div class="status" role="status">{statusText}</div>
    {#if standing !== undefined}{@render standing()}{/if}
  </section>
  <div class="tools" data-panel>
    <Tool
      label={{ on: WORDS.notesOn, faded: WORDS.notesFaded, hidden: WORDS.notesHidden }[notes]}
      icon="notes"
      onpress={() => onnotes(nextNotesMode(notes))}
    />
    {#if oncopytext !== undefined}<Tool label={WORDS.copyLevel} icon="copy" onpress={oncopytext} />{/if}
    {#if oncopyfile !== undefined}<Tool label={WORDS.copyKeep} icon="file" onpress={oncopyfile} />{/if}
  </div>
  <section class="panel card" data-panel data-asked={asked} bind:this={card}>
    <ThingCard {thing} {solid} {onnudge} />
  </section>
  <div class="turns" data-panel>
    <Tool label={WORDS.undo} icon="undo" disabled={!canUndo} onpress={onundo} />
    <Tool label={WORDS.redo} icon="redo" disabled={!canRedo} onpress={onredo} />
  </div>
  <!-- What just happened, and the stamp. Both lie over the clear cell and out of the grid's flow, so their coming
       and going never changes a track and the level never refits under a finger. -->
  <div class="over">
    {#if said !== undefined}<div class="said" data-said>{@render said()}</div>{/if}
    {#if stamp !== undefined}<div class="stamp-place"><Stamp text={stamp} /></div>{/if}
  </div>
</div>

<style>
/* The floating panels are a grid with fixed tracks, so picking a thing never refits the level under a finger. */
  .floats {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto 11rem;
    grid-template-areas:
      'top top'
      'clear clear'
      'tools turns'
      'card card';
    pointer-events: none;
  }
  @container (min-aspect-ratio: 1/1) and (min-width: 36rem) {
    .floats {
      grid-template-columns: 5.5rem minmax(0, 1fr) 17rem;
      grid-template-rows: auto minmax(0, 1fr) auto;
      grid-template-areas:
        'top top top'
        'tools clear card'
        'tools clear turns';
    }
  }
  .clear {
    grid-area: clear;
    min-width: 0;
    min-height: 0;
  }
  .panel {
    margin: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    box-shadow: var(--float-shadow);
    pointer-events: auto;
  }
  .top {
    grid-area: top;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    align-items: center;
    justify-content: space-between;
  }
  .heading {
    display: flex;
    flex: 1 1 8ch;
    flex-direction: column;
    min-width: 0;
  }
  .heading .label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--quiet);
  }
  .title {
    margin: 0;
    font-size: var(--font-size-big);
    overflow-wrap: anywhere;
  }
  /* Save never shrinks: it is the one thing the screen is for. */
  .save {
    flex: none;
    /* On its own line when the row wraps, it is still at the right. */
    margin-left: auto;
  }
  /* Always two lines tall, so the words coming and going never change the height of the panel. */
  .status {
    min-height: 2.8em;
    color: var(--quiet);
  }
  /* A pressed note points at its pair of arrows with the words-coloured ring, since after a touch no browser draws the
     focus ring on a button that script focused. */
  .card[data-asked='x'] :global([data-move='left']),
  .card[data-asked='x'] :global([data-move='right']),
  .card[data-asked='y'] :global([data-move='up']),
  .card[data-asked='y'] :global([data-move='down']) {
    outline: 3px solid var(--words);
    outline-offset: 3px;
  }
  .tools,
  .turns {
    display: flex;
    gap: var(--space-2);
    margin: var(--space-2);
    pointer-events: none;
  }
  .tools :global(.tool),
  .turns :global(.tool) {
    pointer-events: auto;
  }
  .tools {
    grid-area: tools;
    flex-wrap: wrap;
    align-self: end;
    align-items: flex-end;
  }
  .turns {
    grid-area: turns;
    align-self: end;
    justify-self: end;
  }
  .card {
    grid-area: card;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-height: 0;
    overflow: auto;
  }
  @container (min-aspect-ratio: 1/1) and (min-width: 36rem) {
    .tools {
      flex-direction: column;
      flex-wrap: nowrap;
      align-self: start;
      align-items: stretch;
    }
    .card {
      align-self: start;
      max-height: calc(100% - 2 * var(--space-2));
    }
  }

  /* What just happened lies over the clear cell, never over a panel, and scrolls inside itself beyond the cell. */
  .over {
    grid-area: clear;
    position: relative;
    min-width: 0;
    min-height: 0;
    pointer-events: none;
  }
  .said {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    left: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-height: calc(100% - 2 * var(--space-2));
    padding: var(--space-2);
    overflow: auto;
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--ground);
    box-shadow: var(--float-shadow);
    pointer-events: auto;
  }
  .stamp-place {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    max-width: calc(100% - 2 * var(--space-2));
    pointer-events: none;
  }
</style>
