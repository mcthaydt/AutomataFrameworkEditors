<script lang="ts">
  // One person: an initial on a colour made from their login. The colour is always the same for one login, so a face is
  // the same person everywhere it is drawn (the top bar, the list of who can change the game, what changed).
  interface Props {
    login: string
    /** Pixels across; the default fits the top bar. */
    size?: number
  }
  let { login, size = 28 }: Props = $props()

  /** A number from 0 to 359 that is always the same for one login. */
  const hue = (name: string): number => {
    let sum = 0
    for (const char of name) sum = (sum * 31 + char.charCodeAt(0)) % 360
    return sum
  }
</script>

<span class="face face-colour" style:--hue={hue(login)} style:--across="{size}px" aria-hidden="true">
  {login.charAt(0).toUpperCase()}
</span>

<style>
  .face {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--across);
    height: var(--across);
    border: 2px solid var(--g-edge);
    border-radius: 50%;
    font-size: calc(var(--across) * 0.46);
    font-weight: 600;
  }
</style>
