<script lang="ts">
  // Show: what the level shows beyond the level itself (the grid, what the tiles are, how near you are, the part each
  // screen sees), whether things line up with the tiles, and the two choices about the drawing hand. It floats over the
  // level and changes it as each choice is made, so what a choice does can be seen at once.
  import type { Me } from '../device/device.ts'
  import { Icon, Knob, Segment } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import type { Show } from './show.ts'

  interface Props {
    lang: Lang
    show: Show
    me: Me
    onshow: (next: Partial<Show>) => void
    onnear: (near: Show['near']) => void
    onme: (next: Me) => void
    onclose: () => void
  }
  let { lang, show, me, onshow, onnear, onme, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row): string => (typeof row === 'function' ? row() : row)
  const g = $derived(words.ground)
  const grids = $derived([
    { id: 'off', words: text(g.gridOff) },
    { id: 'tiles', words: text(g.gridTiles) },
    { id: 'finer', words: text(g.gridFiner) },
  ])
  const nears = $derived([
    { id: 'whole', words: text(g.nearWhole) },
    { id: 'close', words: text(g.nearClose) },
  ])
  const grid = (id: string): Show['grid'] => (id === 'tiles' ? 'tiles' : id === 'finer' ? 'finer' : 'off')
</script>

<div class="show glass-2" data-ui role="dialog" aria-label={text(g.showTitle)}>
  <header>
    <b>{text(g.showTitle)}</b>
    <button type="button" class="done" aria-label={text(words.shell.close)} title={text(words.shell.close)} onclick={onclose}><Icon name="x" size={22} /></button>
  </header>
  <div class="row">
    <span>{text(g.showGrid)}</span>
    <Segment label={text(g.showGrid)} options={grids} value={show.grid} onchange={(id) => onshow({ grid: grid(id) })} />
  </div>
  <div class="row">
    <span>{text(g.showLineUp)}</span>
    <Knob on={show.lineUp} label={text(g.showLineUp)} onchange={(on) => onshow({ lineUp: on })} />
  </div>
  <div class="row">
    <span>{text(g.showWhatItIs)}</span>
    <Knob on={show.whatItIs} label={text(g.showWhatItIs)} onchange={(on) => onshow({ whatItIs: on })} />
  </div>
  <div class="row">
    <span>{text(g.showNear)}</span>
    <Segment label={text(g.showNear)} options={nears} value={show.near} onchange={(id) => onnear(id === 'close' ? 'close' : 'whole')} />
  </div>
  <div class="row">
    <span>{text(g.showFrames)}</span>
    <Knob on={show.frames} label={text(g.showFrames)} onchange={(on) => onshow({ frames: on })} />
  </div>
  <div class="row">
    <span>{text(g.showDoneNotes)}</span>
    <Knob on={show.doneNotes} label={text(g.showDoneNotes)} onchange={(on) => onshow({ doneNotes: on })} />
  </div>
  <div class="row">
    <span>{text(g.showFinger)}</span>
    <Knob on={me.fingerDraws} label={text(g.showFinger)} onchange={(on) => onme({ ...me, fingerDraws: on })} />
  </div>
  <div class="row">
    <span>{text(g.showLeft)}</span>
    <Knob on={me.leftHand} label={text(g.showLeft)} onchange={(on) => onme({ ...me, leftHand: on })} />
  </div>
</div>

<style>
  .show {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: min(340px, calc(100vw - 16px));
    max-height: min(70vh, 560px);
    overflow-y: auto;
    padding: 8px 12px 12px;
    border-radius: 14px;
    color: var(--words);
    --quiet: var(--g-quiet);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
  }
  .done {
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
  }
</style>
