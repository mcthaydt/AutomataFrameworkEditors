<script lang="ts">
  import { WORDS } from '../words/words.ts'

  // A sentence set apart from the rest. Its kind is an icon and a word as well as a colour, and a problem is an
  // alert so a screen reader says it at once.
  interface Props {
    kind: 'info' | 'good' | 'problem'
    text: string
  }
  let { kind, text }: Props = $props()
  const ICON = { info: 'ℹ', good: '✓', problem: '⚠' } as const
  const KIND_WORD = { info: WORDS.noticeInfo, good: WORDS.noticeGood, problem: WORDS.noticeProblem } as const
</script>

<div class="notice {kind}" role={kind === 'problem' ? 'alert' : 'status'}>
  <span class="icon" aria-hidden="true">{ICON[kind]}</span>
  <span class="kind">{KIND_WORD[kind]}.</span>
  <span class="text">{text}</span>
</div>

<style>
  .notice {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-2);
    align-items: baseline;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    overflow-wrap: anywhere;
  }
  .info {
    background: var(--raised);
  }
  .good {
    background: var(--raised);
  }
  .problem {
    background: var(--ground);
    border: 2px solid var(--mark);
  }
  .kind {
    font-weight: 700;
  }
  .text {
    flex: 1 1 12ch;
  }
</style>
