<script lang="ts">
  import { WORDS } from '../words/words.ts'
  import Icon from './Icon.svelte'

  // A sentence set apart from the rest. Its kind is an icon and a word as well as a colour, and a problem is an
  // alert so a screen reader says it at once.
  interface Props {
    kind: 'info' | 'good' | 'problem'
    text: string
  }
  let { kind, text }: Props = $props()
  const KIND_WORD = { info: WORDS.noticeInfo, good: WORDS.noticeGood, problem: WORDS.noticeProblem } as const
</script>

<div class="notice {kind}" role={kind === 'problem' ? 'alert' : 'status'}>
  <Icon name={kind} />
  <span class="kind label">{KIND_WORD[kind]}.</span>
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
    background: var(--raised);
    overflow-wrap: anywhere;
  }
  .notice :global(.icon) {
    align-self: center;
  }
  /* A problem is the one kind with a mark edge, on the ground, because mark is not seen against raised. */
  .problem {
    border: 2px solid var(--mark);
    background: var(--ground);
  }
  .text {
    flex: 1 1 12ch;
  }
</style>
