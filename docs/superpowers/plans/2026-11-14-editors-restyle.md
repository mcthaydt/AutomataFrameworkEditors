# The Editors Wear Blueprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (project rule).

**Goal:** Every screen of the editors wears the look the spec calls Blueprint, in palette No. 310 and in Fraunces,
Onest and JetBrains Mono: the level fills the screen with its tools floating over it, the picked thing's place is
written beside it as drawing notes over the game's real art, saving lands as a stamp, and a first-time person still
learns what to do, how to do it and that they did it.

**Architecture:** One stylesheet (`src/features/ui/ui.css`) names the six colours, the three fonts, the corner and the
one shadow, and no other file names a colour. Icons are Phosphor's regular SVG files, imported as text by one file
(`ui/icons.ts`) and drawn by one component (`Icon.svelte`), so they are the site's own bytes and take the colour of
the words beside them. The level's picture (the one Pixi canvas) draws only the game's art; everything the editor
adds to a level (the ring round the picked thing, the grid, the measure lines, the notes) is a separate layer of
ordinary page elements laid over the canvas, so a test can prove the art is never touched. The floating panels sit in
a grid with fixed tracks over the stage, and the level is fitted into the cell they leave clear.

**Tech Stack:** Svelte 5, Vite 8, plain CSS, strict TypeScript, PixiJS 8 (the canvas only),
`@fontsource-variable/fraunces`, `@fontsource-variable/onest`, `@fontsource/jetbrains-mono`, `@phosphor-icons/core`,
Vitest (Node tests, browser tests in Chromium, WebKit and Firefox, journeys driving the built page with Playwright),
Cloudflare Pages' `_headers`.

**Spec:** AutomataFramework's
[`docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
the section "Visual direction" (and "The editors", "CI and testing", "Constraints"). The research behind the look is
in the private notes and nothing from it is copied here. The implementation audit of Cycle 1
([`audits/2026-11-13-m1-editors-implementation-audit.md`](../audits/2026-11-13-m1-editors-implementation-audit.md))
left three minors for this cycle: M4, M5 and M9. Each is placed below.

**Principles served:** 2 (iPad-first editors: the canvas-first layout, touch sizes, every screen pictured at iPad and
phone size) and 1 (agent-first: the drawing notes write the very numbers that are in the level's file, `x` and `y`,
beside the thing they place; a colour is one named value in one file). It breaks none: no 3D, no monorepo, no new
dependency beyond the four packages the spec names for the editors.

## The Owner's answer (2026-11-14): nothing is open

**Q1 (the audit's M9). What do the editors call themselves?** The Owner chose **(a)**: "Automata Framework editors"
on screen (the Welcome title and the browser tab), the wordmark `automata` in the top bar, and the GitHub App named
"Automata Framework Editors". Whether the App has already been made under another name is not known yet, so the App's
name is one constant (`WORDS.appOnGitHub`, Task 8) and every sentence and doc that names the App reads it from there
or is held to it by a test.

## Depends on

- `main` at `13915a0` or later (Cycle 1's fixes, pull request 9). Task 1's first step checks it and stops if not.
- Nothing in another repo. The framework pin does not move.

## Global Constraints

- **The four colours, exactly** (No. 310, the spec's table): ground `#253122` (Deep Slate Olive), words `#f5ecc2`
  (Sulphur Yellow), touch `#eeb480` (Pinkish Cinnamon), mark `#837e31` (Olive). **Two mixed shades**, each the words
  colour let into the ground, channel by channel, rounded: raised `#313c2c` (6% words: floating panels, rows, fields)
  and quiet `#b7b492` (70% words: hints and quieter words). These six are the only colours the editor's styles name,
  and `ui.css` is the only file that names them.
- **Touch means "you can touch this"** and is used for nothing else: the ground of the main button, the words and
  icon of every other button, link and tool, the ring round the picked thing, the values in notes.
- **Mark never carries words and never lies on raised.** Olive on the ground is 3.24 to 1 (enough for an edge or an
  icon, 3 to 1) and on raised 2.75 to 1 (not enough for anything). A stamp's edge, a problem's edge and the edge of a
  button that removes something are mark, on the ground colour; their words are the words or touch colour.
- **Contrast:** every word 4.5 to 1 or more against what is behind it; every edge, icon and focus ring 3 to 1 or
  more. Words never lie straight on the game's art: anything written over the stage has its own ground.
- **Type:** Fraunces for screen titles (`h1`) and the wordmark, in sentence case; Onest for words and buttons;
  JetBrains Mono (tabular) only for numbers and measures. **Labels are in capitals, in Onest, made by CSS, never
  typed:** the word under a tool's icon, a note, a stamp, the small heading over a group (`h2`, a field's label, the
  title block's "World"), a notice's kind word and the first-run strip's count. Buttons and sentences are never in
  capitals. A label is known by the class `label`, a number by the class `measure` (both defined once, in `ui.css`).
  **Sentences and buttons are at least 18 px; labels at least 13 px; numbers at least 15 px.**
- **Fonts shipped:** the packages' own CSS, whose `unicode-range` rules let a browser fetch only the files a page's
  characters need (Latin and Cyrillic are covered). The Korean, Japanese and Chinese packages the spec names join with
  the first translation (M3), as in the demo game; until then those scripts show in the device's own font.
- **Dark is the only theme.** The page ignores the device's light or dark setting.
- **Square corners of 2 px, 1 px lines in the words colour, one soft shadow, only on what floats** over the stage.
- **The game's art is never restyled.** The canvas draws the level exactly as the framework draws it and nothing
  else: no ring, no grid, no tint. No filter, opacity, blend or rounded corner is put on the canvas. Everything the
  editor adds is in the notes layer above it. The stylesheet names no colour of a game.
- **Every icon is Phosphor regular and has its words beside it or under it.** No icon stands alone.
- **The strict header stays byte for byte.** `public/_headers` is not edited. No font, icon, style or script comes
  from another address or a `data:` address; no inline script; no `transition:` or `animate:` directive (motion is CSS
  in a component's `<style>`).
- **Motion:** 200 ms, ease-out, on opacity, `stroke-dashoffset` and `transform` only, never on a size or a place a
  test measures. Under `prefers-reduced-motion: reduce` every moment is a plain 200 ms fade.
- **Touch:** targets at least 44 px, primary actions at least 48 px, a tool at least 56 px each way. Anything that can
  be dragged can also be moved with buttons and with the keyboard (unchanged).
- **Words:** every word a person reads is in `src/features/words/words.ts`, and the words test pins each new row.
  No word but the ones this plan lists is added or changed. No banned word (`tests/fixtures/banned.ts`).
- **What a journey holds on to stays:** `.status`, `a.row`, `.content`, `.button.primary`, `[data-thing]` with
  `data-x` and `data-y`, `[data-scale]`, `.stage canvas`, `#share-name`, `#share-link`, one `h1` a screen, and every
  role and name the journeys use. A journey of Cycle 1 changes only where this plan says so.
- **The device keeps one new thing:** `af.notes` (the drawing notes' switch). It never reaches a game's files or the
  API. `CLAUDE.md`'s list of what the device may keep gains it (Task 9).
- **Drunk-grandma test** on every screen; Task 9 reads the pictures against a written list.
- **Tests run only in GitHub-hosted CI**, in Chromium, WebKit and Firefox, at iPad upright (820 by 1180), iPad
  sideways (1180 by 820) and phone (390 by 844). `pnpm lint`, `pnpm typecheck`, `pnpm knip` and `pnpm build` may be
  run before a push; `pnpm test:node`, `pnpm test:engine` and `pnpm test:journeys` may not. Each task writes its
  tests first, in the same commit as the code; the task's push is the run, and the task is done when `check` and the
  three `engines` jobs are green.
- **No workflow file changes.** `ci.yml` already uploads every picture a journey writes and copies it to `ci-screens`.
  If an `engines` job comes near its 30 minutes, stop and report; do not raise the limit.
- **Dependencies:** exactly `@fontsource-variable/fraunces` 5.3.0, `@fontsource-variable/onest` 5.3.1,
  `@fontsource/jetbrains-mono` 5.3.0 and `@phosphor-icons/core` 2.1.1 (the versions the site ships; the spec's yes
  names all four for the editors), exact, as `devDependencies`. Nothing else.
- **No AI attribution** in commits, the pull request or docs. Before every commit, check `git config user.name` is
  `McThayDT` and `git config user.email` is `107786093+mcthaydt@users.noreply.github.com`.
- **Conventional Commits**, one commit per task at least; a source or test file has at most 600 lines.
- **Privacy:** nothing from the private notes; no other product's name.

## Not in this plan

- **The find bar and Play.** Neither exists in M1. The spec's "Hide notes" command in the find bar and "Play always
  hides the notes" arrive with them (M3); the switch built here is the one they will call.
- **An editor switcher.** M1 has one editor. The level's title block says "World" with World's icon, which is the
  seam; the switcher arrives with the second editor.
- **Share on the level screen** (see "Rulings made while planning").
- **A light theme** (the spec: later), **translations** and the Korean, Japanese and Chinese fonts (M3).
- **New settings in a note.** In M1 a thing's file has only its place, so the notes are "Across" and "Down". "HOW
  HEAVY" and the like arrive with Feel.

## Rulings made while planning

For the plan audit to challenge. Each has what it costs if wrong.

- **M5: Share stays a row on the game's page**, with Share's icon, and is not added to the level screen's top right.
  A level may hold a change that is not saved, and leaving it for Share would ask "Leave anyway?". Cost: one more
  press (Back) to reach Share from a level.
- **The bar with the wordmark and Sign in or Sign out stays above every screen, the level included,** 56 px tall.
  Fourteen journeys press its button from a level, and on a phone it cannot share a row with Back, the level's name
  and Save. Everything else on a level floats. Cost: 56 px of a level's height.
- **The first-run strip stays above the level, in the flow,** until it is hidden. Cost: about 100 px on a first run.
- **Redo is added** (`edit.ts` has only undo), because the layout puts "undo and redo" bottom right.
- **A save that waits for approval also stamps "Saved by Sam".** The sentence beside it says it is waiting. The spec
  names two stamps and this keeps to two.
- **The notes' switch is one tool that steps on, faded, hidden,** with its state as the word under its icon. Cost: a
  person presses twice to hide.
- **The panels' tracks are fixed sizes** whether or not a thing is picked, so picking a thing never refits the level
  under the finger. Cost: the card's place shows a one-line hint when nothing is picked.

## Measured while planning

Tried in a throwaway copy of `main` (installed and built, never committed, no test run):

- `import save from '@phosphor-icons/core/assets/regular/floppy-disk.svg?raw'` in a `.ts` file under `src/` passes
  `pnpm typecheck` (`vite/client` types `?raw`) and `pnpm build`. Each file is one line:
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="…"/></svg>`.
- Every icon file this plan names exists in 2.1.1 (the list in Task 2).
- `pnpm knip` sees `@phosphor-icons/core` (it is imported from TypeScript) and reports the three font packages as
  unused, because it does not read CSS imports. Those three go in `knip.json`'s `ignoreDependencies`.
- With the three `@import` lines at the top of `ui.css`, `vite build` writes the fonts to `dist/assets/`. **It inlines
  three small `.woff` files as `data:` addresses, which the header would refuse.** `build.assetsInlineLimit: 0` in
  `vite.config.ts` stops that; a test holds the built CSS to no `data:` address.
- Biome skips `.svelte` files; it checks `ui.css` and every `.ts` file (imports must be sorted).
- Contrast (WCAG) between the six: words on ground 11.46, words on raised 9.74, quiet on ground 6.46, quiet on raised
  5.49, touch on ground 7.45, touch on raised 6.33, ground on touch 7.45, mark on ground 3.24, mark on raised 2.75,
  raised on ground 1.18. Words on touch is 1.54, so the main button's words are the ground colour.
- `tests/journeys/screens.journey.test.ts` is 593 lines. Nothing more fits in it: Task 4 moves its measuring function
  to `tests/fixtures/measure.ts`.

## Review Focus

What the spec implies and a person will meet, most likely first. Each has its test in the task named.

1. **The fonts do not arrive** (a slow line, a blocker). Every screen must read in the device's own font and still
   pass every measure. Task 1, "with the fonts blocked".
2. **A game whose art is the editor's own colours, or very light.** The ring and the notes must still be seen. The
   ring is touch dashes over a ground band, and a note has its own ground and a words-coloured edge. Task 5, "a crate
   the colour of the ring".
3. **A thing in a corner, or a window too small to leave any clear space.** The notes stay inside the clear cell and
   off the thing; nothing is `NaN` and nothing throws. Task 3 (`fitInside` with no room) and Task 5 (`notesFor` in
   each corner and with a scale of zero).
4. **The device's memory refuses, or holds rubbish under `af.notes`** (a private window, an old value). The notes are
   on, and pressing the switch still works for this visit. Task 5, `notes-mode`.
5. **Very long names**: a level id of 60 characters, a sign-in name of 39. The top row wraps, Save stays whole and
   48 px, the stamp wraps inside a phone's width, and nothing is cut with an ellipsis. Task 4 and Task 2.

## File structure

```
src/features/ui/ui.css            the six colours, fonts, corner, shadow, `.label`, `.measure`: the only place a colour is named
src/features/ui/icons.ts          NEW  the icons the editor uses, by job, as SVG text
src/features/ui/Icon.svelte       NEW  draws one icon as decoration
src/features/ui/Tool.svelte       NEW  an icon with its word under it, as a button (a floating tool)
src/features/ui/Stamp.svelte      NEW  a rubber stamp
src/features/ui/{Button,Choice,Notice,Screen}.svelte   restyled; Button takes an icon; Choice gets a stable group name (M4)
src/features/levels/edit.ts       gains `future` and `redo`
src/features/levels/place.ts      gains `Inset` and `fitInside`
src/features/levels/level-canvas.ts   draws the art only: the ring leaves; gains `fitTo`
src/features/levels/notes.ts      NEW  where the grid, the measure lines and the notes go: plain functions
src/features/levels/notes-mode.ts NEW  the switch's three states and its place on the device
src/features/levels/Notes.svelte  NEW  the layer over the canvas
src/features/levels/ThingCard.svelte  NEW  the picked thing's card (a bottom sheet when upright)
src/features/levels/Levels.svelte the stage edge to edge, the floating grid, the tools, undo and redo
src/features/suite/*.svelte       restyled; LevelScreen owns the notes' switch and the Saved stamp
public/licences.txt               NEW  the fonts' and icons' licence notices
tests/styles/tokens.test.ts       NEW  the colours, read as text
tests/fixtures/contrast.ts        NEW  WCAG contrast of two hex colours
tests/fixtures/measure.ts         NEW  `broken()`, moved out of the screens journey, with the new rules
tests/journeys/look.journey.test.ts   NEW  colours, fonts, the light setting, the level's layout, the stamps
tests/journeys/notes.journey.test.ts  NEW  the drawing notes, end to end
tests/workflows/licences.test.ts  NEW  the notices match the packages
```

---

### Task 1: The six colours, the fonts, dark only

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`, `knip.json`, `vite.config.ts`, `index.html`, `src/features/ui/ui.css`,
  every `<style>` block under `src/features/` (token names only), `tests/fixtures/journey.ts`
- Create: `public/licences.txt`, `tests/fixtures/contrast.ts`, `tests/styles/tokens.test.ts`,
  `tests/workflows/licences.test.ts`, `tests/journeys/look.journey.test.ts`

**Interfaces:**
- Produces: the custom properties `--ground --raised --words --quiet --touch --mark --title --label --measure
  --corner --float-shadow` and the global classes `.label` and `.measure`;
  `contrast(a: string, b: string): number` (two `#rrggbb` values, WCAG ratio) from `tests/fixtures/contrast.ts`;
  `openPage(size, person?, keep?, look?: { colorScheme?: 'light' | 'dark'; reducedMotion?: 'reduce'; blockFonts?: boolean })`.

- [ ] **Step 1: Check where `main` is.** `git fetch origin main && git merge-base --is-ancestor 13915a0 origin/main`
  must succeed. If not, stop and report.

- [ ] **Step 2: Add the packages.**
  `pnpm add -D -E @fontsource-variable/fraunces@5.3.0 @fontsource-variable/onest@5.3.1 @fontsource/jetbrains-mono@5.3.0 @phosphor-icons/core@2.1.1`.
  In `knip.json` add `"ignoreDependencies": ["@fontsource-variable/fraunces", "@fontsource-variable/onest", "@fontsource/jetbrains-mono"]`.
  In `vite.config.ts` set `build.assetsInlineLimit: 0`, with a comment that says why (the header refuses `data:` fonts).

- [ ] **Step 3: Write `tests/fixtures/contrast.ts` and `tests/styles/tokens.test.ts`.** The CSS under test is
  `ui.css` plus the text of every `<style>…</style>` block in `src/**/*.svelte`. Tests, by name:
  - `the six colours are named in ui.css and nowhere else`: `ui.css` holds exactly six hex values; every Svelte style
    block holds none.
  - `each is the spec's colour`: ground `#253122`, words `#F5ECC2`, touch `#EEB480`, mark `#837E31`, raised `#313C2C`,
    quiet `#B7B492` (compared in upper case).
  - `the two mixed shades are the words let into the ground`: mixing 6% and 70%, channel by channel, rounded, gives
    raised and quiet.
  - `no colour is written any other way`: no `rgb(`, `rgba(`, `hsl(`, `hsla(`; no colour keyword in a colour property
    but `transparent`, `currentColor`, `none`; no `prefers-color-scheme`; none of the old names (`--bg`, `--fg`,
    `--muted`, `--line`, `--surface`, `--primary`, `--primary-fg`, `--danger`, `--danger-fg`, `--info`, `--good`,
    `--problem`, `--focus`, `--radius`).
  - `dark is the only theme`: `color-scheme: dark;` is there.
  - `the pairs the screens put together can be read`: with `contrast`, words on ground, words on raised, quiet on
    ground, quiet on raised, touch on ground, touch on raised and ground on touch are each 4.5 or more; mark on ground
    is 3 or more; mark on raised is under 3 (so the rule "mark never lies on raised" stays written down).
  - `corners are 2 px`: `--corner: 2px;`, and every `border-radius` is `var(--corner)`.
  - `one shadow, named once`: every `box-shadow` is `var(--float-shadow)` or `none`.
  - `no colour in a style attribute`: no `style="` and no `style:color`, `style:background` or `style:border` in a
    `.svelte` file.
  - `index.html tells the browser the ground colour, and names no other`: it holds
    `<meta name="theme-color" content="#253122" />` and `<meta name="color-scheme" content="dark" />`, and its only
    hex value is that one.
  - `the header is as it was`: `public/_headers` holds, character for character, the `Content-Security-Policy` line
    that is on `main` today (paste the line into the test).
  - `the built page inlines no font`: skipped when `dist/` is absent; otherwise no file in `dist/assets/*.css` holds
    `data:`. (CI builds before `pnpm test:node`.)

- [ ] **Step 4: Rewrite `ui.css`.** The three imports first (`@fontsource-variable/fraunces/wght.css`,
  `@fontsource-variable/onest/wght.css`, `@fontsource/jetbrains-mono/400.css`), then `:root` with the six colours and:

  ```css
  --title: "Fraunces Variable", Georgia, "Times New Roman", serif;
  --label: "Onest Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --measure: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
  --corner: 2px;
  --float-shadow: 0 6px 20px color-mix(in srgb, var(--ground) 70%, transparent);
  ```

  Keep `--font-size` (18 px), `--font-size-big` (24 px) and the four spaces; `--font-size-small` becomes 13 px and is
  for labels only. The body is `var(--label)`, words on ground, `font-variant-numeric: tabular-nums`. `h1` is
  `var(--title)`, weight 500. `.label` is Onest, 13 px or more, weight 600, `text-transform: uppercase`,
  `letter-spacing: 0.08em`. `.measure` is `var(--measure)`, 15 px or more. Links are the touch colour with a 1 px
  underline. The focus ring is `3px solid var(--words)` with `outline-offset: 3px`. `::selection` is ground on words.
  The light colours and the `prefers-color-scheme` block go.

- [ ] **Step 5: Rename the tokens in every Svelte style block,** by this table and nothing more (the shapes change in
  Tasks 2, 4 and 7): `--bg` to `--ground`; `--fg` to `--words`; `--muted` to `--quiet`; `--surface`, `--info`,
  `--good` to `--raised`; `--line` to `--words`, and every `2px solid` line becomes `1px solid`; `--primary` to
  `--touch`; `--primary-fg` to `--ground`; `--focus` to `--touch`; `--radius` to `--corner`; `--problem` to `--ground`
  and `--danger` to `--mark` as an edge (a `color: var(--danger)` becomes `color: var(--touch)`). Any sentence set at
  `--font-size-small` goes to `--font-size`.

- [ ] **Step 6: `index.html` and the licences.** Add the two metas of Step 3. Write `public/licences.txt`: a first
  line saying what the file is, then each package's name, version and its `LICENSE` file, whole, in the order
  Fraunces, Onest, JetBrains Mono, Phosphor. `tests/workflows/licences.test.ts`, `the notices are the packages' own`:
  for each of the four, `licences.txt` contains the text of `node_modules/<package>/LICENSE` and the version in
  `package.json`.

- [ ] **Step 7: `openPage` takes a look.** The fourth parameter of the Interfaces block: `colorScheme` and
  `reducedMotion` go to `browser.newContext`; `blockFonts` adds `context.route('**/*.woff*', (route) => route.abort())`
  and takes the aborted requests off what `problems()` reports.

- [ ] **Step 8: Write `tests/journeys/look.journey.test.ts`** (it calls `setupJourneys()`; its helpers follow
  `screens.journey.test.ts`). At every size:
  - `the page is the editors' colours`: on Welcome, `body`'s background is `rgb(37, 49, 34)` and its colour
    `rgb(245, 236, 194)`; the primary button's background is `rgb(238, 180, 128)` and its colour `rgb(37, 49, 34)`.
  - `a device set to light sees the same page`: with `colorScheme: 'light'`, the same four values.
  - `the fonts are the site's own files`: after `document.fonts.ready`, `document.fonts.check('18px "Onest Variable"')`
    and `document.fonts.check('24px "Fraunces Variable"')` are true; the `h1`'s `font-family` starts with
    `"Fraunces Variable"`; every address in `j.requests` starts with `j.site`.
  - `with the fonts blocked, the screens still read`: with `blockFonts`, Welcome, the demo game's page and its level
    each show their `h1`, and (from Task 4 on) pass `broken()`.

- [ ] **Step 9:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass, and
  `grep -c "data:" dist/assets/*.css` prints `0`.

- [ ] **Step 10: Commit and push.** `feat: the editors' six colours and three fonts, dark only`. Read the run; it is
  green before Task 2 starts. One Cycle 1 test will need its colour moved: `levels.browser.test.ts` and the journeys
  read only the canvas's colours, which do not change here; a test that reads a button's colour is updated to the
  token's new value and the commit says so.

### Task 2: Icons, and the pieces every screen shares

**Files:**
- Create: `src/features/ui/icons.ts`, `src/features/ui/Icon.svelte`, `src/features/ui/Tool.svelte`,
  `src/features/ui/Stamp.svelte`
- Modify: `src/features/ui/Button.svelte`, `Choice.svelte`, `Notice.svelte`, `Screen.svelte`, `ui.ts`
- Test: `tests/features/ui/ui.browser.test.ts`, `tests/features/ui/choice.browser.test.ts`,
  `tests/features/ui/icons.test.ts` (new)

**Interfaces:**
- Produces, all exported from `ui.ts`:
  - `ICONS` and `type IconName = keyof typeof ICONS` from `icons.ts`. The names and their files (in
    `@phosphor-icons/core/assets/regular/`): `back` arrow-left, `save` floppy-disk, `undo` arrow-counter-clockwise,
    `redo` arrow-clockwise, `moveLeft` arrow-left, `moveRight` arrow-right, `moveUp` arrow-up, `moveDown` arrow-down,
    `notes` note, `copy` copy, `file` download-simple, `share` share-network, `waiting` hourglass-medium, `approve`
    seal-check, `turnDown` x-circle, `add` plus, `addPerson` user-plus, `remove` trash, `signIn` sign-in, `signOut`
    sign-out, `tryIt` play, `find` magnifying-glass, `world` map-trifold, `info` info, `good` check-circle, `problem`
    warning, `link` link, `open` caret-right, `again` arrow-clockwise, `hide` x.
  - `Icon`: props `{ name: IconName }`. A `<span class="icon" aria-hidden="true">` holding the SVG (`{@html}` of a
    constant from `icons.ts`, never of anything a person typed), 1.25em square, `flex: none`.
  - `Button`: props `{ label: string; kind?: 'primary' | 'plain' | 'danger'; icon?: IconName; disabled?: boolean; onpress: () => void }`.
    Classes stay `button` and the kind.
  - `Tool`: props `{ label: string; icon: IconName; disabled?: boolean; onpress: () => void }`. A
    `<button type="button" class="tool">`: the icon at 24 px over the label as `<span class="label">`.
  - `Stamp`: props `{ text: string }`. A `<div class="stamp" data-stamp aria-hidden="true">` with the `approve` icon
    and the text as a `.label`. (The sentence beside it is what a screen reader hears.)

- [ ] **Step 1: Write the tests first.**
  - `icons.test.ts` (Node), `every icon is a Phosphor regular file that fills with the colour of its words`: each
    value of `ICONS` starts with `<svg xmlns="http://www.w3.org/2000/svg"` and contains `fill="currentColor"`.
  - `ui.browser.test.ts`, added: `a Button with an icon shows the icon before its words, and is named by its words
    alone` (the accessible name is the label; the `.icon` is `aria-hidden`); `a primary Button is touch with ground
    words` (computed colours `rgb(238, 180, 128)` and `rgb(37, 49, 34)`); `a plain Button's words are touch on raised`;
    `a danger Button has a mark edge on the ground`; `a Tool is at least 56 by 56 and its word is at least 13 px, in
    capitals` (`text-transform` is `uppercase`); `a Notice's icon is an svg and its kind is still a word`; `a Stamp
    with a 39-letter name stays inside 390 px and is hidden from a screen reader`; `every corner is 2 px` (Button,
    Tool, Notice, Stamp, Choice's row). The existing size, keyboard, role and focus tests stay as they are.
  - `choice.browser.test.ts`, added (M4): `two Choices on a page do not share a group` (their radios' `name`s differ)
    and `a Choice mounted twice with the same props gets a name without Math.random` (spy on `Math.random`: not
    called).

- [ ] **Step 2: Write `icons.ts`, `Icon.svelte`, `Tool.svelte`, `Stamp.svelte`,** and restyle the four pieces:
  - `Button`: plain is raised with a 1 px words line and touch words, weight 600; primary is touch with ground words
    and no line; danger is ground with a 2 px mark line and touch words. Sentence case. Sizes as now.
  - `Tool`: raised, 1 px words line, touch icon and word, `var(--float-shadow)`.
  - `Notice`: raised, 1 px words line, the icon by kind (`info`, `good`, `problem`) in the words colour, the kind word
    as a `.label`. A problem is ground with a 2 px mark line. Roles as now.
  - `Screen`: the `h1` in Fraunces; Back takes the `back` icon.
  - `Choice`: `const group = $props.id()` in place of `Math.random` (M4); the radio's `accent-color` is touch; the
    group's own label is a `.label`.
  - `Stamp`: ground, a 2 px mark line, words-coloured text, turned 4 degrees (`transform: rotate(-4deg)`), `max-width:
    100%`, `overflow-wrap: anywhere`. It lands by a 200 ms keyframe from `opacity: 0; transform: rotate(-4deg)
    scale(1.3)` and then rests fully opaque; with reduced motion the keyframe is opacity only.

- [ ] **Step 3:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass (`Tool`
  and `Stamp` are exported from `ui.ts`, which knip follows from `src/index.ts`; if knip calls either unused until
  Task 4 uses it, leave it and say so in the commit: Task 4 clears it, and the run to read is Task 4's).

- [ ] **Step 4: Commit and push.** `feat: Phosphor icons, and the shared pieces in the editors' look`.

### Task 3: Redo, a level fitted inside the clear space, and a canvas that draws only the art

**Files:**
- Modify: `src/features/levels/edit.ts`, `place.ts`, `level-canvas.ts`, `levels.ts`, `Levels.svelte` (the calls only),
  `src/features/suite/LevelScreen.svelte` (the `describeChange` call), `src/features/words/words.ts`
- Test: `tests/features/levels/edit.test.ts`, `place.test.ts`, `level-canvas.browser.test.ts`,
  `levels.browser.test.ts`, `tests/features/words/words.test.ts`

**Interfaces:**
- Produces:
  - `LevelEdit` gains `readonly future: readonly Level[]` (levels an undo stepped back from, the nearest last).
    `startEdit` gives `[]`; a move that moves empties it; `undo` puts `now` on it;
    `redo(edit: LevelEdit): LevelEdit` takes the last one back (with none, the same edit).
  - `interface Inset { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number }`
    and `fitInside(box: Size, inset: Inset, world: Size): Fit` in `place.ts`: the framework's `fitWorld` of the box
    less its inset, moved right by `inset.left` and down by `inset.top`. No room is `{ scale: 0, left: 0, top: 0 }`.
  - `LevelCanvas.show(level: Level, characters: Characters, hero?: string): void` (the ring parameter goes) and
    `LevelCanvas.fitTo(inset: Inset): void` (redraws; the sky still fills the whole canvas).
  - `WORDS.redo: 'Redo'`.

- [ ] **Step 1: Write the tests first.**
  - `edit.test.ts`: `redo after undo puts the move back`; `redo with nothing to redo is the same edit`; `a new move
    after an undo forgets what could be redone`; `undo, redo, undo ends where one undo ends`.
  - `place.test.ts`: `fitInside with no inset is fitWorld`; `fitInside moves the level by the inset` (box 1000 by 600,
    inset `{ top: 100, right: 200, bottom: 100, left: 0 }`, world 16 by 9: scale 44.44…, left 44.44…, top 100, to four
    places); `fitInside with an inset bigger than the box is scale 0, left 0, top 0, never NaN`.
  - `level-canvas.browser.test.ts`: `fitTo draws the level inside the inset and the sky outside it` (a pixel inside
    the inset's left band is the sky's colour; a pixel at the fitted ground row is the tile colour).
  - `levels.browser.test.ts`: the test `a selected thing is ringed in white, and unselecting takes the ring away`
    becomes `picking a thing changes nothing in the picture`: the canvas's pixels (read whole, as a data address) are
    the same before and after the crate is picked, and no pixel at the crate's edge is `#ffffff`. The other pixel
    tests stay.
  - `words.test.ts`: the row `redo: 'Redo'`.

- [ ] **Step 2: Implement** the Interfaces block. In `level-canvas.ts` the constant `RING` and the `ring` branch go;
  `redraw` uses `fitInside(box, inset, levelSize(level))`. `Levels.svelte` calls `show` without the ring and derives
  `fit` with `fitInside(size, inset, …)`, with `inset` all zeros until Task 4; the picked thing keeps its dashed
  border from `.thing[aria-pressed='true']` for now. `LevelScreen`'s literal for `describeChange` gains `future: []`.

- [ ] **Step 3:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass.

- [ ] **Step 4: Commit and push.** `feat: redo, a level fitted inside its clear space, and a picture of the art alone`.

### Task 4: The level fills the screen and its tools float

**Files:**
- Create: `src/features/levels/ThingCard.svelte`, `tests/fixtures/measure.ts`
- Modify: `src/features/levels/Levels.svelte`, `levels.ts`, `src/features/suite/LevelScreen.svelte`,
  `WaitingChange.svelte`, `src/features/words/words.ts`, `tests/journeys/screens.journey.test.ts`,
  `tests/journeys/look.journey.test.ts`
- Test: `tests/features/levels/levels.browser.test.ts`, `tests/features/words/words.test.ts`

**Interfaces:**
- Consumes: `Tool`, `Stamp`, `Icon`, `Button` with `icon` (Task 2); `redo`, `fitInside`, `fitTo` (Task 3).
- Produces:
  - `ThingCard`: props `{ thing: { readonly id: string; readonly x: number; readonly y: number } | undefined; solid: boolean; onnudge: (way: 'left' | 'right' | 'up' | 'down') => void }`.
    With no thing: the one line `WORDS.hintIdle`. With one: its id, `WORDS.hintSelected(id)`, "Across" and "Down" as
    `.label`s each with its number as a `.measure`, the four arrow Buttons (each with its icon and
    `data-move="left|right|up|down"`), and the `solid` Notice.
  - `Levels` gains `said?: Snippet` (what the screen has to say, floated over the top of the clear cell) and
    `stamp?: string | undefined` (drawn under Save). Its other props stay.
  - `WORDS.editorWorld: 'World'`.
  - `broken(page: Page, stage: boolean): Promise<string[]>` from `tests/fixtures/measure.ts`.

**The layout.** `.editor` has no padding; `.stage` fills it and the canvas fills the stage, so the sky reaches every
edge. Over the stage lies `.floats`, a grid with `pointer-events: none` (its panels turn them back on):

| The box `.area` is | Columns | Rows | Areas |
|---|---|---|---|
| wide (`min-aspect-ratio: 1/1` and `min-width: 36rem`, as now) | `5.5rem 1fr 17rem` | `auto 1fr auto` | `top top top` / `tools clear card` / `tools clear turns` |
| anything else | `1fr auto` | `auto 1fr auto 11rem` | `top top` / `clear clear` / `tools turns` / `card card` |

- `top`: Back (with its icon); the title block (a `.label` with World's icon and `WORDS.editorWorld`, over the
  level's id as the `h1`); Save (primary, with its icon) at the right. Under it, at the right, the `.status` line
  (`role="status"`, on raised) and the stamp. The row wraps; Save never shrinks.
- `tools`: `Tool`s for "Copy this level" (`copy`) and "Save it as a file" (`file`), a column when wide and a row
  otherwise. Task 5 adds the notes' switch first in it.
- `card`: `ThingCard`, raised, scrolling inside its fixed track (the "bottom sheet" when not wide).
- `turns`: Undo and Redo as `Tool`s, bottom right. Redo is disabled with nothing to redo.
- `clear`: an empty `<div data-clear>` that only measures. Its box, against the stage's, is the `inset` given to
  `fitInside` and `fitTo`, watched by the `ResizeObserver` that watches the stage. `said` shares the cell, at its top,
  at most half its height, scrolling inside itself.
- Each panel has an 8 px margin, `var(--float-shadow)` and a 1 px words line. Read only (a waiting change), there are
  no floats and the inset is zero, as now.

- [ ] **Step 1: Move `broken()` to `tests/fixtures/measure.ts`** unchanged, import it in the screens journey, and add
  these rules to it:
  - on a stage screen that is not read only: the stage is as wide as the window (within 1 px); `[data-clear]` is at
    least half the window's shorter side wide and at least 160 px tall (this replaces the old stage-width rule); every
    `[data-thing]` lies inside `[data-clear]` or within 24 px of it; no two panels of `.floats` overlap.
  - on every screen: every text node's `font-size` is at least 18 px, or at least 13 px inside `.label`, or at least
    15 px inside `.measure`; every text node's colour against the nearest ancestor's opaque background is 4.5 to 1 or
    more (the WCAG sum written out in the page function), and a text node over the stage with no ground of its own is
    reported as `words lie on the art`.
  Add the scenes `level-undone-and-redone` (move, Undo, Redo) and `level-picked` (the crate picked) to `SCENES`.

- [ ] **Step 2: Write the browser tests first,** in `levels.browser.test.ts`:
  - `the stage reaches every edge and the level sits in the clear cell`: at 1180 by 820 and at 390 by 844, the
    stage's box is its container's, and the crate's button lies inside `[data-clear]`.
  - `picking a thing does not move the level`: `data-scale` and the hero's start are the same before and after the
    crate is picked, at both sizes.
  - `Redo puts back what Undo took, by the button`: move right, Undo, Redo; `data-x` is 6.5, 7, 6.5, 7 in turn; Redo
    is disabled before the Undo and after the Redo.
  - `the card says where the picked thing is, and its arrows move it`: "Across" 6.5 and "Down" 7.5; pressing
    `[data-move="right"]` makes it 7.
  - `a level with a 60-letter name keeps Save whole`: at 390 wide, Save is inside the window, at least 48 px tall,
    and the name is not cut with an ellipsis (Review Focus 5).
  - `read only, nothing floats`: no `.floats`, no `[data-clear]`, and the level is fitted to the whole stage.
  The existing drag, arrow, undo, solid-ground and pixel tests keep passing; where one reads the hint or an arrow by
  its place in the page, it now finds it in the card, by role and name.

- [ ] **Step 3: In `look.journey.test.ts`, at every size:** `a level fills the screen`: signed in on level-1, the
  canvas's box is the stage's box and the stage's width is the window's; Save's right edge is within 24 px of the
  window's; Undo and Redo are in the bottom right quarter of the stage when wide, and above the card otherwise.

- [ ] **Step 4: Build it.** `ThingCard.svelte`; `Levels.svelte` as "The layout" says (the pointer and keyboard code
  does not change; the drag still counts from the stage's place and the fit at the finger's first touch);
  `LevelScreen.svelte` passes its notices and their buttons as the `said` snippet, in place of the `.notices` block
  above the editor; `WaitingChange.svelte` only loses styles the tokens replaced. Keep `Levels.svelte` under 600 lines
  (the card is its own file for that).

- [ ] **Step 5:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass.

- [ ] **Step 6: Commit and push.** `feat: the level fills the screen and its tools float over it`. Every Cycle 1
  journey must stay green; a journey that fails because a panel now covers what it clicked is reported, not edited
  round, unless the fix is to find the same button by its role and name.

### Task 5: The drawing notes

**Files:**
- Create: `src/features/levels/notes.ts`, `notes-mode.ts`, `Notes.svelte`, `tests/features/levels/notes.test.ts`,
  `notes-mode.test.ts`, `notes.browser.test.ts`, `tests/journeys/notes.journey.test.ts`
- Modify: `src/features/levels/Levels.svelte`, `levels.ts`, `src/features/suite/LevelScreen.svelte`,
  `WaitingChange.svelte`, `src/features/words/words.ts`, `tests/features/words/words.test.ts`,
  `tests/journeys/screens.journey.test.ts`

**Interfaces:**
- Consumes: `Fit`, `Point`, `Size`, `toScreen` (`place.ts`); `Tool` (Task 2); the clear cell (Task 4).
- Produces:
  - `notes-mode.ts`: `type NotesMode = 'on' | 'faded' | 'hidden'`; `const NOTES_KEY = 'af.notes'`;
    `readNotesMode(store: Storage): NotesMode` (anything but the three words, or a store that throws, is `'on'`);
    `keepNotesMode(store: Storage, mode: NotesMode): void` (a store that throws is ignored);
    `nextNotesMode(mode: NotesMode): NotesMode` (on, faded, hidden, on).
  - `notes.ts`:

    ```ts
    export interface Box { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
    export interface Line { readonly from: Point; readonly to: Point }
    export interface Notes {
      /** The level's own area in the stage, and one tile's side, in CSS pixels. */
      readonly grid: Box & { readonly tile: number }
      /** From the level's left edge to the thing's middle, then from its top edge to the thing's middle. */
      readonly measures: readonly Line[]
      /** Where the block of notes goes (its top left corner), and the line that joins it to the thing. */
      readonly block: { readonly side: 'right' | 'left' | 'above' | 'below'; readonly at: Point; readonly leader: Line } | undefined
    }
    export function notesFor(input: {
      readonly level: Level
      readonly fit: Fit
      /** The picked thing's button in the stage; undefined when nothing is picked. */
      readonly thing: Box | undefined
      /** The clear cell in the stage. */
      readonly clear: Box
      /** The block of notes as measured on the page. */
      readonly block: Size
    }): Notes
    ```

    The block takes the first side of right, left, above, below on which it fits inside `clear` with a 16 px gap from
    the thing's button; if none fits it goes below, pushed back inside `clear`. It never overlaps the button when
    any side fits. A scale of zero gives an empty grid, no measures and no block.
  - `Notes.svelte`: props `{ notes: Notes; mode: NotesMode; picked: { readonly x: number; readonly y: number } | undefined; joined: boolean; onnote: (axis: 'x' | 'y') => void; onblock: (size: Size) => void }`.
    A `<div class="notes" data-notes={mode}>` over the canvas and under the things' buttons, `pointer-events: none`
    but for its notes. The grid and the lines are one `<svg>`; a line is a 1 px ground stroke over a 3 px words
    stroke, so it reads on light and dark art. Each note is a `<button class="note" data-note="x|y">`: ground, 1 px
    words line, the name as a `.label`, the number and unit as a `.measure` in the touch colour, at least 44 px tall.
    `joined` (the clear cell is under 30rem wide) draws one note with both, `data-note="x"`.
  - `Levels` gains `notes: NotesMode` and `onnotes: (mode: NotesMode) => void`.
  - Words: `notesOn: 'Notes on'`, `notesFaded: 'Notes faded'`, `notesHidden: 'Notes hidden'`, `noteAcross: 'Across'`,
    `noteDown: 'Down'`, `noteTiles: (n: number) => (n === 1 ? '1 tile' : \`${n} tiles\`)`,
    `noteChange: (name: string, amount: string) => \`${name} ${amount}. Press to change it.\``.

**What a person sees.** With the notes on: the tile grid over the level's area (words colour at 25%), always. With a
thing picked: the two measure lines, and beside the thing the notes "ACROSS 6.5 TILES" and "DOWN 7.5 TILES", joined
to it by a leader line. The numbers are the file's `x` and `y`. Pressing a note puts the keyboard's focus on the
card's left arrow (Across) or up arrow (Down), which are the same buttons the card has. Faded: the whole layer at
35%. Hidden: the layer is not drawn. In every mode the picked thing keeps its ring, which is the thing's own button:
`2px dashed var(--touch)` over a 2 px solid ground band, so it shows on any art. A thing marked in a waiting change
has the same ring; read only, the layer draws the grid and nothing else. The switch is the first `Tool` in `tools`,
with the `notes` icon and its state as its word (`notesOn`, `notesFaded`, `notesHidden`); a press steps it.

**Motion.** When a thing is picked the leader and measure lines draw in (`stroke-dashoffset`, 200 ms) and the notes
fade in (200 ms); when it is let go they are removed. Undo and Redo play the same draw-in again at the new place
(the last note is rubbed out and written again). With reduced motion: the fade only.

- [ ] **Step 1: Write the Node tests first.**
  - `notes-mode.test.ts`: `nothing kept is on`; `each of the three words is read back`; `rubbish is on`; `a store that
    throws on reading is on, and on writing is ignored` (Review Focus 4); `on, faded, hidden, on`.
  - `notes.test.ts`, with level-1 (16 by 9), a fit of `{ scale: 40, left: 100, top: 50 }`, a clear cell of
    `{ x: 100, y: 50, w: 640, h: 360 }` and a block of 180 by 96: `the grid is the level's area` (`{ x: 100, y: 50,
    w: 640, h: 360, tile: 40 }`); `the measures run from the left edge and the top edge to the thing's middle` (for a
    button at the crate, middle 360, 350: `{100,350}→{360,350}` and `{360,50}→{360,350}`); `the block goes to the
    right when it fits`; `at the right edge it goes left`; `in a corner with no room either side it goes above`; `with
    no room anywhere it goes below, inside the clear cell`; `it never overlaps the thing when a side fits` (the crate
    in each of the four corners); `nothing picked has a grid and no notes`; `a scale of zero has nothing, and no NaN`
    (Review Focus 3).

- [ ] **Step 2: Write `notes.browser.test.ts` first.** `picking the crate writes Across 6.5 tiles and Down 7.5 tiles
  beside it`; `the numbers follow the arrows` (right: 7); `pressing the Across note puts the focus on Move left, and
  Down on Move up`; `a note is named for a screen reader` ("Across 6.5 tiles. Press to change it."); `faded is 35%
  and hidden is not drawn, and the ring stays in both`; `the notes change nothing in the picture` (the canvas's
  pixels are the same with a thing picked in each of the three modes and with nothing picked); `a crate the colour of
  the ring is still ringed` (a character coloured `#eeb480`: the button's outline is dashed touch and its border is
  the ground colour; Review Focus 2); `in a clear cell under 30rem there is one note with both numbers`; `read only,
  there is a grid and a ring on the marked thing and no note`; `with reduced motion nothing animates but opacity`
  (every running animation of the layer has `opacity` as its only property).

- [ ] **Step 3: Write `tests/journeys/notes.journey.test.ts` first** (end to end, at every size, in every engine):
  - `a visitor picks the crate and reads where it is`: Try it now, level-1, tap the crate: "Across" with 6.5 and
    "Down" with 7.5 are on screen, and equal the crate's `data-x` and `data-y`; drag it two tiles right: 8.5.
  - `the notes never touch the picture`: the canvas read as a data address is the same with the notes on, faded and
    hidden.
  - `the switch is remembered by the device, and by nothing else`: press it twice (the tool now says "Notes hidden"),
    reload, open the level: still hidden; `localStorage.getItem('af.notes')` is `hidden`; `j.requests` holds no
    `PUT`, `POST`, `PATCH` or `DELETE` from those presses.
  - `pressing a note takes a keyboard to its arrows`: Tab to the Across note, Enter; the focused button is "Move
    left"; ArrowRight on the crate still moves it.
  - `the notes stay clear of the crate at the far right`: move the crate right until it stops; the notes' block lies
    inside `[data-clear]` and does not overlap the crate's button.
  - `a waiting change shows its ring and no notes`: grandpa opens kid's change: the crate's button has
    `data-marked`, a dashed outline, and there is no `.note`.
  Add the scenes `level-notes-faded` and `level-notes-hidden` to the screens journey.

- [ ] **Step 4: Build it.** `notes-mode.ts`, `notes.ts`, `Notes.svelte`; `Levels.svelte` mounts the layer between the
  canvas and the buttons, gives it `notesFor(…)`, moves the ring to the button's CSS as above, adds the switch, and
  on `onnote` focuses `[data-move="left"]` or `[data-move="up"]` in the card; `LevelScreen.svelte` reads the mode from
  `remembered` with `readNotesMode`, keeps it with `keepNotesMode`, and passes both props; `WaitingChange.svelte`
  passes `notes="on"` and an empty `onnotes`. Export the new names from `levels.ts`. Add the seven words and their
  rows in the words test.

- [ ] **Step 5:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass.

- [ ] **Step 6: Commit and push.** `feat: drawing notes over the level's real art`.

### Task 6: The stamps

**Files:**
- Modify: `src/features/suite/LevelScreen.svelte`, `WaitingChange.svelte`, `src/features/words/words.ts`,
  `tests/features/words/words.test.ts`, `tests/journeys/look.journey.test.ts`, `tests/journeys/screens.journey.test.ts`

**Interfaces:**
- Consumes: `Stamp` (Task 2); `Levels`' `stamp` prop (Task 4).
- Produces: `WORDS.stampSaved: (name: string) => \`Saved by ${name}\``, `WORDS.stampApproved: 'Approved'`.

- [ ] **Step 1: Write the journeys first,** in `look.journey.test.ts`, at every size:
  - `saving lands as a stamp with the person's name`: grandma moves the crate and saves; `[data-stamp]` holds "Saved
    by grandma", lies inside the window, is fully opaque once its animation ends, and `.status` still says
    `WORDS.savedDirect`. She moves the crate again: the stamp is gone.
  - `a change that waits is stamped too, and the sentence says it waits`: kid (Suggest) saves: "Saved by kid", and
    `.status` says `WORDS.savedSuggestion`.
  - `approving stamps Approved`: grandpa approves kid's change: `[data-stamp]` holds "Approved" beside
    `WORDS.approved`. Turning one down shows no stamp.
  - `with reduced motion the stamp fades in and does not move`: with `reducedMotion: 'reduce'`, the stamp's running
    animation has `opacity` as its only property.
  - `a visitor never sees a stamp`: a visitor presses Save and is asked to sign in; there is no `[data-stamp]`.
  Add the scenes `level-saved-stamp` and `change-approved-stamp` to the screens journey, and the two rows to the
  words test.

- [ ] **Step 2: Build it.** `LevelScreen` passes `stamp={saved !== undefined && game.login !== undefined ?
  WORDS.stampSaved(game.login) : undefined}` to `Levels`. `WaitingChange`'s done screen shows
  `<Stamp text={WORDS.stampApproved} />` after its good Notice when `done === 'approved'`.

- [ ] **Step 3:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass.

- [ ] **Step 4: Commit and push.** `feat: saving and approving land as stamps`.

### Task 7: The list screens wear it

**Files:**
- Modify: `src/features/suite/App.svelte`, `Welcome.svelte`, `Guide.svelte`, `PickGame.svelte`, `AddEditor.svelte`,
  `GameHome.svelte`, `Waiting.svelte`, `WaitingChange.svelte`, `Share.svelte`, `src/features/words/words.ts`,
  `tests/features/words/words.test.ts`, `tests/journeys/look.journey.test.ts`

**Interfaces:**
- Consumes: `Icon`, `Button` with `icon` (Task 2).
- Produces: `WORDS.wordmark: 'automata'`.

No screen gains or loses a control here, and no sentence changes. What changes, screen by screen:

- **`App`:** the bar is 56 px, on the ground, on every screen but Welcome: the wordmark at the left (a `<span
  class="wordmark">` in Fraunces, lower case as typed, 24 px, words colour, not a link and not a heading) and Sign in
  (`signIn`) or Sign out (`signOut`) at the right, as now.
- **`Welcome`:** the wordmark over the `h1`; "Try it now" takes `tryIt`, Sign in takes `signIn`.
- **`Guide`:** raised with a 1 px words line; the count is a `.label`; the dots are 12 px squares, filled in touch;
  "Hide these tips" takes `hide`.
- **Rows** (`a.row` in `PickGame`, `GameHome`, `Waiting`): raised, 1 px words line, the name in touch at weight 600,
  the second line quiet, and the `open` icon at the right end. In `GameHome` the Share row starts with `share` and
  the waiting row with `waiting` (M5: Share stays a row).
- **`GameHome`:** "Levels" is an `h2.label` with World's icon before it.
- **`PickGame`:** the field's label is a `.label`; the field is raised with a 1 px words line and has `find` before
  it; "Add the editor to a game of mine" takes `add`.
- **`Share`:** the fields as in `PickGame`; "Copy the link" takes `link`, "Add" takes `addPerson`, each "Remove …"
  is the danger Button with `remove`; a person's name is weight 600 and their level's hint quiet.
- **`WaitingChange`:** Approve takes `approve`, "Turn it down" and "Take my change back" take `turnDown`; the
  picture's box has a 1 px words line and no rounded corner.
- **Try again** everywhere takes `again`.

- [ ] **Step 1: Write the journeys first,** in `look.journey.test.ts`, at every size: `the wordmark is on every
  screen but a first-time Welcome's bar` (the text `automata` in `.wordmark` on the list, a game's page, a level,
  Waiting, one change and Share; on Welcome it is over the title); `every icon has words beside it` (on each of those
  screens, every `.icon` has a parent whose text is not empty); `every button and row a finger can press shows the
  touch colour` (each `button:not([data-thing])` and `a[href]` has `rgb(238, 180, 128)` as its colour or its
  background). Add the `wordmark` row to the words test.

- [ ] **Step 2: Restyle the nine files** as the list says.

- [ ] **Step 3:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass.

- [ ] **Step 4: Commit and push.** `feat: the list screens in the editors' look`. The screens journey measures all
  of them again at three sizes; a broken rule is fixed in the screen, never in the rule.

### Task 8: The name (M9)

**Files:**
- Modify: `src/features/words/words.ts`, `src/features/service/save.ts`, `index.html`, `docs/teams.md`,
  `docs/deploy.md`, `README.md`, `tests/features/words/words.test.ts`, `tests/docs/docs.test.ts`
- Test: also whichever test pins the suggestion's body (`grep -rn "Made with" tests`)

**Interfaces:**
- Produces: `WORDS.appName: 'Automata Framework editors'`; `WORDS.appOnGitHub: 'Automata Framework Editors'` (the
  GitHub App's name, the one constant); `WORDS.blockedOwner` built from it.

- [ ] **Step 1: Write the tests first.** Words test: `appName` is `Automata Framework editors`; `appOnGitHub` is
  `Automata Framework Editors`; `blockedOwner` is "GitHub is set to stop the editor changing this game. The game's
  owner needs to let Automata Framework Editors past that rule." Docs test, `the docs call the App by its one name`:
  `docs/teams.md` and `docs/deploy.md` contain `WORDS.appOnGitHub` and neither contains `Automata Editors`. A Node
  test beside it, `nothing calls the product by its old name`: no file under `src/`, `functions/`, `docs/` (but
  `docs/superpowers/`), `index.html` or `README.md` contains `Automata Editors`.

- [ ] **Step 2: Change the name.** `words.ts` as the Interfaces block; `index.html`'s `<title>` is `Automata
  Framework editors`; `save.ts` writes `Made with ${WORDS.appOnGitHub} by ${who.login}.` (`words` is
  the lowest feature, so `service` may import it), and the test that pins the body follows;
  `docs/teams.md`, `docs/deploy.md` and `README.md` say "Automata Framework Editors" for the App and "the Automata
  Framework editors" for the product. `docs/deploy.md` gains one line: if the App was already made under another
  name, rename it on GitHub or change `appOnGitHub`, and nothing else.

- [ ] **Step 3:** `pnpm format && pnpm lint && pnpm typecheck && pnpm knip && pnpm build`. Expected: all pass.

- [ ] **Step 4: Commit and push.** `feat: the editors are called Automata Framework editors`.

### Task 9: The docs, and reading every picture

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `docs/superpowers/progress.md`, `tests/docs/docs.test.ts`

- [ ] **Step 1: `CLAUDE.md`.** Under "Particular to this repo" add **The look**: the six colours and where they are
  named, the three fonts, Phosphor regular, dark only, the art never restyled, the notes layer over the canvas, the
  four packages and why knip is told to ignore three, `public/licences.txt` and its rule (move a package's version,
  copy its `LICENSE` again). Add `af.notes` to the list of what the device may keep. Add `tests/styles/` to the
  structure list. A docs test, `CLAUDE.md names everything the device may keep`, gains `af.notes`.

- [ ] **Step 2: Read the pictures.** After the last green run, read every picture under `pr-<number>/chromium/`,
  `webkit/` and `firefox/` on the `ci-screens` branch (about 48 scenes at three sizes) and answer, for each scene,
  in one line in the pull request:
  1. Can a drunk grandma tell what this screen is for from its title alone?
  2. Is there one thing that most wants pressing, and is it the touch-coloured button (or, on a list, a row)?
  3. Does every icon have its word?
  4. On a level: does the level reach the edges, and is the whole level visible between the panels?
  5. On a level with the crate picked: can she read where the crate is, and is no note over the crate?
  6. Is the game's art exactly as the game draws it (compare the level's picture with Cycle 1's `main/` picture)?
  7. After Save: does the stamp sit fully on screen, at rest, and say who saved?
  8. On a phone: is anything cut off, squeezed under 44 px or hidden behind a panel?
  9. First run: does the strip say what to do next, and after the first save, that it worked?
  10. Does it look finished: one voice in type and colour from Welcome to Share?
  A "no" is fixed and pictured again before this step is ticked, or reported as a stop.

- [ ] **Step 3: The tracker.** Update `docs/superpowers/progress.md`: stage 4 done, the percentage, the rulings made
  and any deferred minor, and the README's one paragraph on the look if it describes a screen.

- [ ] **Step 4: Commit and push.** `docs: the editors' look in CLAUDE.md, the README and the tracker`. Report the
  summary to the coordinator.

---

## Self-review

- **Spec coverage ("Visual direction").** The look and its corners, lines and shadow: Tasks 1 and 2. Colours No. 310
  and the two shades, with the contrast test: Task 1. The name and wordmark: Tasks 7 and 8. Type: Task 1 (the three
  families, capitals for labels) and Task 4 (sizes measured on every screen). Dark by default: Task 1. Canvas first,
  Save top right, undo and redo bottom right, the card as a bottom sheet upright and on a phone: Task 4. The art
  never restyled: Tasks 3 and 5 (pixel for pixel). The drawing notes, each a control, on, faded and hidden, a device
  setting: Task 5. Moments: Tasks 5 (notes draw in, undo rubs out) and 6 (stamps), with reduced motion in both.
  Icons with a word: Tasks 2 and 7. Still true (44 and 48 px, the drunk-grandma test): Task 4's measures and Task 9.
  Not covered, and said so under "Not in this plan": the find bar's command, Play hiding the notes, the editor
  switcher, the light theme, the Korean, Japanese and Chinese fonts.
- **The audit's minors.** M4: Task 2. M5: Task 7, as a ruling. M9: Task 8.
- **End-to-end tests.** `look.journey.test.ts` (Tasks 1, 4, 6, 7), `notes.journey.test.ts` (Task 5) and the screens
  journey's six new scenes and new measures (Tasks 4, 5, 6), each at three sizes in three engines.
- **Onboarding.** The first-run strip, its steps and its words do not change; the first-run journeys of Cycle 1 must
  stay green through every task, and Task 9's question 9 reads the result.
