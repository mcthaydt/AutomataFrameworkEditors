// Which screens of the screens journey a pull request's change reaches, so a draft takes only those pictures.
//
// `plan` in `.github/workflows/ci.yml` pipes the changed file names in and reads one line back: a pattern for the
// journey's scene names (`-t "at <size> (<pattern>)"`), or `.*` for every scene. A file that is seen but is on no
// screen's own list (the kit in `ui/`, the words, a style sheet, the page, the journey itself) can change any screen,
// so it asks for all of them. This file has no dependencies on purpose: the workflow runs it with Node alone.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** The pattern that means every scene. */
export const EVERY_SCENE = '.*'

/**
 * The scenes (by name) each screen's own file draws, as a pattern. The scene names are in
 * `tests/journeys/screens.journey.test.ts`; a test there holds this list to them, so a new scene or a renamed one
 * cannot slip out of every list.
 */
export const SCREEN_FILES: Readonly<Record<string, string>> = {
  'src/features/suite/Welcome.svelte': 'welcome-|visitor-',
  'src/features/suite/AddEditor.svelte': 'add-the-editor',
  'src/features/suite/PickGame.svelte': 'pick-a-game|add-the-editor',
  'src/features/suite/GameHome.svelte': 'game-|not-a-game|visitor-',
  'src/features/suite/LevelScreen.svelte': 'level-|visitor-|waiting-change-',
  'src/features/levels/Levels.svelte': 'level-|visitor-|waiting-change-',
  'src/features/suite/Waiting.svelte': 'waiting-list',
  'src/features/suite/WaitingChange.svelte': 'waiting-change-',
  'src/features/suite/Share.svelte': 'share-',
}

/** A file whose change is seen on a screen: the plan's own test for "something seen changed". */
const seen = (file: string): boolean =>
  /(\.svelte|\.css)$|^(src\/features\/(ui|words)\/|index\.html|public\/|docs\/mockups\/|tests\/journeys\/screens)/.test(file)

/** The pattern of the scenes the changed files reach: every scene as soon as one seen file is on no screen's list. */
export function scenesFor(changed: readonly string[]): string {
  const patterns = new Set<string>()
  for (const file of changed.filter(seen)) {
    const own = SCREEN_FILES[file]
    if (own === undefined) return EVERY_SCENE
    patterns.add(own)
  }
  return patterns.size === 0 ? EVERY_SCENE : [...patterns].join('|')
}

// Run only when started from the command line, not when a test imports the lists above.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const changed = readFileSync(0, 'utf8').split('\n').filter(Boolean)
  console.log(scenesFor(changed))
}
