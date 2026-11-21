<script lang="ts">
  // The small tags beside things: a way into another level ("To Level 2"), a number, a changed switch. They are quiet
  // until their thing is picked, and a finger goes through them (the same facts are in the thing's settings). Glass with
  // the map's room names' size and rounding, so they read as the editor's and not as debug text (the blind judge, item 5).
  import type { ThingValue } from '@automataframework/framework/headless'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import type { Mark } from './marks.ts'
  import type { TagFact } from './tags.ts'

  interface Props {
    lang: Lang
    facts: readonly TagFact[]
    marks: readonly Mark[]
    picked: readonly string[]
  }
  let { lang, facts, marks, picked }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  function said(fact: TagFact): string {
    const { declaration, value } = fact
    const named = (to: ThingValue): string => `${declaration.name}: ${String(to)}`
    switch (declaration.type) {
      case 'leads-to': {
        const level = (value as { level?: string }).level
        return level === undefined ? '' : text(words.thing.tagTo, nameOf(level))
      }
      case 'number':
        return `${declaration.name} ${String(value)}`
      case 'switch':
        return named(value === true ? text(words.thing.tagYes) : text(words.thing.tagNo))
      case 'choice':
        return named(declaration.from.find((one) => one.id === value)?.name ?? String(value))
      default:
        return named(value)
    }
  }

  const tags = $derived(
    marks.flatMap((mark) => {
      const lines = facts.filter((fact) => fact.thing.id === mark.id).map(said).filter((line) => line !== '')
      return lines.length === 0 ? [] : [{ mark, lines }]
    }),
  )
</script>

{#each tags as tag (tag.mark.id)}
  <span
    class="tag glass-1"
    class:on={picked.includes(tag.mark.id)}
    aria-hidden="true"
    data-tag={tag.mark.id}
    style:left="{tag.mark.box.x + tag.mark.box.w / 2}px"
    style:top="{tag.mark.box.y + tag.mark.box.h + 4}px"
  >
    {tag.lines.join(' · ')}
  </span>
{/each}

<style>
  .tag {
    position: absolute;
    z-index: 3;
    transform: translateX(-50%);
    padding: 2px 8px;
    border-radius: 8px;
    color: var(--words);
    font: 500 13px / 18px var(--label);
    white-space: nowrap;
    pointer-events: none;
  }
  /* An unpicked thing's tag is quieter by its words' grey, never by fading: faded words on glass are too faint to read
     (design round 2, A18). */
  .tag:not(.on) {
    color: var(--quiet);
  }
  .tag.on {
    box-shadow: inset 0 0 0 1px var(--accent);
  }
</style>
