<script lang="ts">
  import { type Shape } from '../levels/levels.ts'
  import { Button, Menu, Panel } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'

  // The person's own buttons, top right: who they are, Export and Save. A phone has room for Save alone; the rest of its
  // buttons are in the pill's menu. Save is the one main button on the screen, and Export never calls the game's host.
  interface Props {
    shape: Shape
    /** Someone who has not signed in: the cluster offers Sign in where it would show a name. */
    visitor: boolean
    /** The signed-in person's name. */
    login: string | undefined
    saveDisabled: boolean
    /** `plain` while another button on the screen is the one thing to press. */
    saveKind: 'primary' | 'plain'
    onsave: () => void
    onexport: () => void
    onsignin: () => void
    onsignout: () => void
  }
  let { shape, visitor, login, saveDisabled, saveKind, onsave, onexport, onsignin, onsignout }: Props = $props()
</script>

<Panel part="cluster">
  <div class="cluster">
    {#if shape !== 'narrow'}
      {#if visitor}
        <Button label={WORDS.signInShort} onpress={onsignin} />
      {:else if login !== undefined}
        <Menu
          label={login}
          icon="person"
          align="end"
          items={[{ id: 'sign-out', label: WORDS.signOut, icon: 'signOut', onpress: onsignout }]}
          attrs={{ 'data-person': '' }}
        />
      {/if}
      <Button label={WORDS.export} icon="export" onpress={onexport} />
    {/if}
    <Button label={WORDS.save} icon="save" kind={saveKind} disabled={saveDisabled} onpress={onsave} />
  </div>
</Panel>

<style>
  .cluster {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
  }
</style>
