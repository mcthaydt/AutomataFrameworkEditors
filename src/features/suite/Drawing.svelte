<script lang="ts">
  import { WORDS } from '../words/words.ts'

  // A small drawing of what the editor does, for the first screen: a level on a grid, a crate with its dashed ring, and
  // the drawing note that says where it is. It is made of the page's own six colours, so it is the editor and not a
  // picture of one, and it says nothing a screen reader needs: the words beside it say it all.
</script>

<div class="drawing" aria-hidden="true">
  <div class="ground"></div>
  <div class="crate"></div>
  <div class="leader"></div>
  <div class="note">
    <span class="label">{WORDS.noteAcross}</span>
    <span class="measure">{WORDS.noteTiles(6.5)}</span>
  </div>
  <div class="note second">
    <span class="label">{WORDS.noteDown}</span>
    <span class="measure">{WORDS.noteTiles(7.5)}</span>
  </div>
</div>

<style>
  .drawing {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 11;
    overflow: hidden;
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background-color: var(--raised);
    background-image:
      linear-gradient(var(--gridline) 1px, transparent 1px),
      linear-gradient(90deg, var(--gridline) 1px, transparent 1px);
    background-size: 12.5% 18.2%;
    box-shadow: var(--float-shadow);
    /* Mixed here, in custom properties, since a mix is not one of the six colours written in a colour property. */
    --gridline: color-mix(in srgb, var(--words) 22%, transparent);
    --slab: color-mix(in srgb, var(--words) 18%, var(--ground));
  }
  .ground {
    position: absolute;
    inset: auto 0 0;
    height: 18.2%;
    border-top: 1px solid var(--words);
    background: var(--slab);
  }
  .crate {
    position: absolute;
    bottom: 18.2%;
    left: 37.5%;
    width: 12.5%;
    height: 18.2%;
    border: 1px solid var(--ground);
    background: var(--touch);
    outline: 2px dashed var(--words);
    outline-offset: 6px;
  }
  .leader {
    position: absolute;
    bottom: calc(18.2% + 9.1%);
    left: 50%;
    width: 8%;
    height: 2px;
    background: var(--words);
  }
  .note {
    position: absolute;
    bottom: calc(18.2% + 14%);
    left: 58%;
    display: flex;
    flex-direction: column;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--ground);
    color: var(--words);
  }
  .second {
    bottom: calc(18.2% + 1%);
    left: 62%;
  }
  .note .measure {
    color: var(--touch);
  }
</style>
