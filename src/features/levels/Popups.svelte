<script lang="ts">
  // What opens over the level for a moment: the menu a press and hold makes, the tray a "Put a thing here" opens, the card
  // that renames, and the question asked when a character may be in a level only once. The level decides what each one
  // means; this only draws them where they were asked for.
  import type { Character } from '@automataframework/framework/headless'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import Ask from './Ask.svelte'
  import { menuPlace } from './float.ts'
  import type { Point } from './place.ts'
  import RenameCard from './RenameCard.svelte'
  import ThingMenu from './ThingMenu.svelte'
  import Tray from './Tray.svelte'
  import type { Screen } from './view.ts'

  interface Props {
    lang: Lang
    size: Screen
    characters: Readonly<Record<string, Character>>
    counts: Readonly<Record<string, number>>
    menu: { on: string | undefined; at: Point } | undefined
    locked: boolean
    hidden: boolean
    canPaste: boolean
    tray: Point | undefined
    renaming: string | undefined
    asking: { character: string } | undefined
    onmenu: (id: string) => void
    onclosemenu: () => void
    onput: (character: string) => void
    onrename: (name: string) => void
    oncancelrename: () => void
    onyes: () => void
    onno: () => void
  }
  let {
    lang,
    size,
    characters,
    counts,
    menu,
    locked,
    hidden,
    canPaste,
    tray,
    renaming,
    asking,
    onmenu,
    onclosemenu,
    onput,
    onrename,
    oncancelrename,
    onyes,
    onno,
  }: Props = $props()

  const words = $derived(wordsIn(lang).levels)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const menuAt = $derived(menu === undefined ? undefined : menuPlace(menu.at, size))
  const trayAt = $derived(tray === undefined ? undefined : menuPlace(tray, size, { w: 300, h: 200 }))
</script>

{#if tray !== undefined && trayAt !== undefined}
  <div class="float tray glass-2" data-ui style:left="{trayAt.x}px" style:top="{trayAt.y}px">
    <Tray {lang} {characters} {counts} chosen={undefined} onchoose={(id) => id !== undefined && onput(id)} />
  </div>
{/if}

{#if menu !== undefined && menuAt !== undefined}
  <button type="button" class="scrim" data-ui tabindex="-1" aria-hidden="true" onclick={onclosemenu}></button>
  <div class="float" data-ui style:left="{menuAt.x}px" style:top="{menuAt.y}px">
    <ThingMenu {lang} on={menu.on} {locked} {hidden} {canPaste} onpick={onmenu} onclose={onclosemenu} />
  </div>
{/if}

{#if renaming !== undefined}
  <div class="center dim-2" data-ui>
    <RenameCard {lang} id={renaming} {onrename} oncancel={oncancelrename} />
  </div>
{/if}

{#if asking !== undefined}
  <div class="center dim-2" data-ui>
    <Ask
      question={text(words.askOne, nameOf(asking.character))}
      yes={text(words.askOneYes)}
      no={text(words.askOneNo)}
      {onyes}
      {onno}
    />
  </div>
{/if}

<style>
  .float {
    position: absolute;
    z-index: 30;
  }
  .tray {
    max-width: calc(100% - 16px);
    border-radius: 14px;
  }
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 29;
    border: 0;
    background: transparent;
    cursor: default;
  }
  .center {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
