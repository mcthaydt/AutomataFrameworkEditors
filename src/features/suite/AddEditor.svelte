<script lang="ts">
  import { Button } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'

  // What a person with no games sees: what to do next, as one big button, and what to do if they were sent a link.
  interface Props {
    onadd: () => void
  }
  let { onadd }: Props = $props()
</script>

<div class="empty">
  <p>{WORDS.pickEmpty}</p>
  <p class="link">{WORDS.pickEmptyLink}</p>
  <div><Button label={WORDS.pickAdd} icon="add" kind="primary" onpress={onadd} /></div>
</div>

<style>
  .empty {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  p {
    margin: 0;
  }
  .link {
    color: var(--quiet);
  }
</style>
