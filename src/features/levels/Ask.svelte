<script lang="ts">
  // A question with two answers, in the middle of the level: "This level has a Goal already. Move it here?"
  interface Props {
    question: string
    yes: string
    no: string
    onyes: () => void
    onno: () => void
  }
  let { question, yes, no, onyes, onno }: Props = $props()
</script>

<div class="ask glass-2" role="alertdialog" aria-label={question}>
  <p>{question}</p>
  <div class="row">
    <button type="button" onclick={onno}>{no}</button>
    <button type="button" class="go" onclick={onyes}>{yes}</button>
  </div>
</div>

<style>
  .ask {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: min(340px, calc(100vw - 32px));
    padding: 14px;
    border-radius: 14px;
    color: var(--words);
  }
  p {
    margin: 0;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  button {
    min-width: 48px;
    min-height: 48px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .go {
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
