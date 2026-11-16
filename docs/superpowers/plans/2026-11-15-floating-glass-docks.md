# Floating Glass Docks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (the Owner's rule).

**Goal:** In the shell and World mockups, every panel floats at all five sizes as frosted glass, in two strengths,
with a "See-through panels" setting, a contrast check in CI, a speed test page for the Owner's iPad, and the Editor
Mockups board republished.

**Architecture:** One new last section in `docs/mockups/shell.css` holds the tokens, the two glass recipes, the
solid fallbacks and the floating layout for each size; it wins because it is last and every rule starts with
`html body.sh`. `frame.js` gains one body class for the setting. Two checks guard it: a Node test that reads the
tokens and works out WCAG contrast, and a pass in `shoot.mjs` that fails on glass inside glass.

**Tech Stack:** Plain CSS and HTML in `docs/mockups/`, Vitest (Node project) for the check, Playwright Chromium in
the `mockups` CI job for the pictures. No new package.

**Spec:** [`../specs/2026-11-15-floating-glass-docks-design.md`](../specs/2026-11-15-floating-glass-docks-design.md).
Read it whole before Task 1; this plan argues from it and does not repeat its reasons.

## Global Constraints

- **Mockups only.** Nothing under `src/`, `functions/` or `package.json` changes. No editor code until the Owner
  approves the mockups.
- **Nothing runs locally:** no `pnpm`, no browser, no probe script. Push, then read the pull request's CI (`check`
  for the test, `mockups` for the pictures). Pictures are read from the `ci-screens` branch:
  `git fetch -q origin ci-screens && git show origin/ci-screens:pr-57/mockups/<page>-<size>.png > <scratchpad>/x.png`.
- **Branch:** `claude/project-thread-95sweh` (pull request 57). `git pull --ff-only` before every commit; never
  force-push. If the pull is refused, stop and report.
- **Author:** before every commit, `git config user.name "McThayDT" && git config user.email
  "107786093+mcthaydt@users.noreply.github.com"`. No Claude credit in a commit, the pull request or a doc.
- **All new CSS** goes in one new last section of `shell.css`, headed
  `/* ---------- Floating glass docks (the Owner, 2026-11-15) ---------- */`, every selector starting
  `html body.sh`. `mockup.css` does not change. No earlier rule is edited or deleted.
- **Sizes:** `ipadSideways` 1210 × 834, `desktop` 1280 × 800, `ipadUpright` 834 × 1210, `phone` 390 × 844,
  `phoneSideways` 844 × 390. The media queries already in the file for them: wide
  `(min-width: 1001px) and (min-height: 601px)`; upright iPad
  `(min-width: 501px) and (max-width: 1000px) and (min-height: 601px)`; upright phone `(max-width: 500px)`; phone
  sideways `(max-height: 600px) and (min-width: 600px)`.
- **Numbers from the spec, verbatim:** gap 8; corners 12 for docks, 14 for sheets, 28 for the two lower corners of an
  upright phone's open sheet; touch sizes 44 and 48 never shrink; the open phone sheet is at most 60% of the height.
- **Tokens, verbatim:** `--glass: rgb(30 30 30 / 0.72)`; `--glass-filter: blur(24px) brightness(0.45) saturate(1.4)`;
  `--glass-edge: rgb(255 255 255 / 0.10)`; `--glass-shine: inset 0 1px 0 rgb(255 255 255 / 0.06)`;
  `--glass-quiet: #a8a8a8`; `--glass-soft: rgb(37 37 37 / 0.92)`;
  `--glass-soft-filter: blur(12px) brightness(0.5) saturate(1.2)`.
- **Words** on any page pass the drunk-grandma test. The new words are given in this plan; use them as written.
- **Never name a body class `playing`-like or one that `mockup.css` already uses.** The new classes are `glass-on`,
  `glass-off` and `moved`; grep both stylesheets for each before using it.
- **Reporting:** one line to the coordinator per task (commit, the test count from `check`, surprises); stop and
  report at once on a failing check you cannot explain, a refused push, or anything this plan did not foresee.
- **Tracker:** each task ends by updating the first section of `docs/superpowers/progress.md` with what was done and a
  percentage (Task 1: 20, 2: 45, 3: 60, 4: 75, 5: 90, 6: 100).

## Review Focus

Things the spec implies that are easy to miss; each is pinned by the step named.

1. **A bright level under a panel.** Quiet words on glass over pure white must still be readable. Task 1's test
   works it out from the tokens for both strengths.
2. **Glass inside glass.** A drop-down inside Settings, the changed-dot's note inside the inspector, the peek line
   inside the sheet. Task 2's pass in `shoot.mjs` fails the run and names the element.
3. **A browser or a person without glass.** No `backdrop-filter`, "Reduce Transparency", more contrast, or the
   setting Off must give today's solid panel, not a see-through panel with no blur. Task 1's test reads the four
   fallbacks; Task 4's `world-levels-solid` picture shows one.
4. **A phone on its side with a notch.** The left dock must sit inside the safe area. Task 3 uses
   `env(safe-area-inset-*)` in every inset; Task 1's test counts them.
5. **Too much glass on a small screen.** An upright phone with its sheet open may blur over a third of the screen.
   Task 2's pass prints each page's share; Task 5 lists the pages over 40% in the tracker for the Owner's speed test.

## File Structure

| File | Job |
| --- | --- |
| `docs/mockups/shell.css` | Modify: one new last section (tokens, recipes, fallbacks, floating layout). |
| `docs/mockups/frame.js` | Modify: `MOCK.glass` becomes a body class. |
| `docs/mockups/shoot.mjs` | Modify: the glass-inside-glass pass and the printed share of glass. |
| `docs/mockups/world-levels-glass.html` | Create: the level moved under the panels. |
| `docs/mockups/world-levels-solid.html` | Create: the same scene, "See-through panels" Off. |
| `docs/mockups/shell-glass-speed.html` | Create: the speed test, one file that needs nothing else. |
| `docs/mockups/shell-settings.html` | Modify: the "See-through panels" row. |
| `tests/docs/glass.test.ts` | Create: contrast, fallbacks, safe areas, the speed page's tokens. |
| `CLAUDE.md` | Modify: the device key `af.me.glass`. |
| `docs/superpowers/progress.md` | Modify: the tracker, each task. |

---

### Task 1: The tokens, the two recipes, the fallbacks and the contrast check

**Files:**
- Create: `tests/docs/glass.test.ts`
- Modify: `docs/mockups/shell.css` (append the new section)

**Interfaces:**
- Produces (CSS custom properties on `html body.sh`, used by every later task): the seven tokens above, and the
  switchable set a surface actually reads: `--g-bg`, `--g-filter`, `--g-edge`, `--g-shine`, `--g-quiet` (glass) and
  `--s-bg`, `--s-filter` (soft glass; it shares `--g-edge` and `--g-shine`). By default each points at its token.
- Produces two selector lists, each written once as an `:is(...)` list:
  - **GLASS:** `.sh-top`, `.sh-left`, `.sh-right:not(.inline)`, `.sh-tools .tbar`, `.sh-tools .topts`, `.opop`,
    `.share-pop`, `.sh-play`, `.minimap`, `.holds .hb`, `.tray`, `.actbar`, `.float:not(.keysheet)`.
  - **SOFT:** `.sh-bottom`, `.pop`, `.coach`, `.keysheet`, `.numpad`.

- [ ] **Step 1: Write the failing test** `tests/docs/glass.test.ts`, in the style of `tests/docs/docs.test.ts`
  (reads files with `readFileSync`, no imports from `src`). Helpers in the file: `token(name: string): string` (the
  last value of `--name:` in `shell.css`), `rgb(value: string): [number, number, number, number]` (hex or
  `rgb(r g b / a)`), `filter(value: string): { blur: number; brightness: number; saturate: number }`,
  `behind(tint, f, backdrop): [number, number, number]` and `contrast(a, b): number` (WCAG 2.2 relative luminance).
  `behind` is: each channel of the backdrop times `brightness`, then `tint.a * tint + (1 - tint.a) * that` (the
  blur and the saturation do not change a flat grey or white). Tests:

```ts
const WHITE = [255, 255, 255], CANVAS = [30, 30, 30]
test.each([
  ['--words', 4.5], ['--glass-quiet', 4.5], ['--touch', 4.5], ['--agent', 4.5], ['--mark', 4.5], ['--faint', 3],
])('%s on glass over pure white is at least %d to 1', (name, least) => {
  expect(contrast(rgb(token(name)), behind(rgb(token('--glass')), filter(token('--glass-filter')), WHITE))).toBeGreaterThanOrEqual(least)
})
test.each([['--words', 4.5], ['--quiet', 4.5], ['--touch', 4.5], ['--agent', 4.5], ['--mark', 4.5]])(
  '%s on soft glass over pure white is at least %d to 1', /* the same, with --glass-soft and --glass-soft-filter */)
test('the same colours pass over the dark canvas, on both strengths', /* CANVAS for WHITE, all rows above */)
test("today's quiet grey fails on glass over white, which is why --glass-quiet exists", () => {
  expect(/* --quiet on glass over WHITE */).toBeLessThan(4.5)
})
test('the tokens are the spec\'s', () => {
  expect(token('--glass')).toBe('rgb(30 30 30 / 0.72)') // and one line for each of the other six, verbatim
})
test('every backdrop-filter is written both ways, from a token, and never animated', () => {
  // in the new section: as many `-webkit-backdrop-filter:` as `backdrop-filter:` (not counting @supports lines);
  // every value is var(--g-filter), var(--s-filter) or none; no `transition` or `animation` anywhere in the section
})
test('glass turns solid in the four cases', () => {
  // the section contains each of these, and inside each block --g-bg and --s-bg are var(--panel), --g-filter and
  // --s-filter are none, --g-quiet is var(--quiet):
  //   '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))'
  //   '@media (prefers-reduced-transparency: reduce)' with the selector 'html body.sh:not(.glass-on)'
  //   'html body.sh.glass-off'
  //   '@media (prefers-contrast: more)' where --g-edge is var(--quiet)
})
```

  "The new section" is everything in `shell.css` after the heading line in Global Constraints.

- [ ] **Step 2: Push and confirm `check` fails** on these tests only ("token --glass not found").

- [ ] **Step 3: Append the section to `shell.css`.** In order: the seven tokens and the switchable set on
  `html body.sh`; the four fallback blocks (each only re-points the switchable set; in the solid cases `--g-edge` is
  `var(--line)` and `--g-shine` is `0 0 #0000`); then the two recipes:

```css
html body.sh :is(/* GLASS */) {
  --quiet: var(--g-quiet);
  background: var(--g-bg);
  -webkit-backdrop-filter: var(--g-filter);
  backdrop-filter: var(--g-filter);
  border: 1px solid var(--g-edge);
  box-shadow: var(--g-shine), var(--shadow);
}
html body.sh :is(/* SOFT */) {
  background: var(--s-bg);
  -webkit-backdrop-filter: var(--s-filter);
  backdrop-filter: var(--s-filter);
  border: 1px solid var(--g-edge);
}
```

  Soft surfaces keep their own shadow (`.pop` has a deeper one), with `var(--g-shine)` put in front of it where the
  rule sets `box-shadow`. Setting `--quiet` on a glass surface is how every quiet word inside it becomes
  `--glass-quiet`. Then grep the section's GLASS surfaces for words coloured `var(--faint)` (a `color:` on text, not
  an icon or an edge) and give each `color: var(--quiet)` in this section, listing them in the commit message.

- [ ] **Step 4: Push; `check` passes.** Report the test count.

- [ ] **Step 5: Commit** as `docs(mockups): two strengths of glass as tokens, with a contrast check` (this step and
  step 2 are each a commit and a push).

### Task 2: Glass on today's floating cards, the moved-level page, and CI proves the blur draws

**Files:**
- Create: `docs/mockups/world-levels-glass.html`
- Modify: `docs/mockups/frame.js`, `docs/mockups/shoot.mjs`, `docs/mockups/shell.css`

**Interfaces:**
- Consumes: GLASS, SOFT and the switchable set from Task 1.
- Produces: `window.MOCK.glass` (`'on' | 'off'`, absent means "Choose for me") becomes the body class `glass-on` or
  `glass-off`; the body class `moved` (through the existing `MOCK.body` array) draws the level slid under the panels.

- [ ] **Step 1: `frame.js`.** Where the body's classes are gathered (`const cls = ['sh', ...]`), add
  `if (m.glass) cls.push('glass-' + m.glass)`.

- [ ] **Step 2: `world-levels-glass.html`.** A copy of `world-levels-mid.html` (list open on a computer, a thing
  picked, the inspector showing) without the helper's card (`ghost`) and without a tip, with `body: ['moved']` and
  `leftOpen: true` in its `MOCK`, and the title `World · Levels, under the glass (mockup)`. Its opening comment says
  what the page shows, in the other pages' style. In `shell.css`, `html body.sh.moved` makes the canvas run under
  every panel and enlarges and shifts the stage so that, at each of the five sizes, sky and hills are behind the top
  bar, the list (or the tools) and the inspector (or the sheet). The picked thing's ring stays in the clear room.

- [ ] **Step 3: `shoot.mjs`, the glass pass.** After a page is ready and before its picture, evaluate in the page:

```js
// Every element that blurs what is behind it; one inside another is a defect (the spec's "never glass inside glass").
const glass = [...document.querySelectorAll('body *')].filter((el) => {
  const s = getComputedStyle(el)
  return s.display !== 'none' && s.visibility !== 'hidden' && (s.backdropFilter || s.webkitBackdropFilter || 'none') !== 'none'
})
```

  Return `{ nested: string[], share: number }`: `nested` names (tag, classes) each glass element that has a glass
  ancestor; `share` is the summed area of the glass elements whose filter has `blur(24px)`, clipped to the window,
  over the window's area. Collect across pages and sizes. At the end print one line per page and size with a share
  over 0.40 (`world-levels-share phone 0.47`), and if any `nested` is not empty, print them all and
  `process.exit(1)` after the pictures are written (so the pictures still upload: set `process.exitCode = 1` and let
  the script finish).

- [ ] **Step 4: Push; read the pictures** `world-levels-glass-ipadSideways.png` and `-desktop.png`. The level must be
  seen blurred through the list and the inspector, and sharp between them. If the panels show the level sharp or
  flat grey, headless Chromium did not draw the filter: change the launch in `shoot.mjs` to
  `chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })`,
  push and look again. If it still does not draw, stop and report.

- [ ] **Step 5: Fix what the pass names.** For each `nested` element, the inner one goes solid in the new section:
  `background: var(--raised)` (or `transparent` where it is only a row of its parent, such as `.peek` and `.itab`
  inside `.sh-right`, or `.tbar` inside the rail's card), `backdrop-filter: none` both ways. Expect at least: `.drop`
  lists and `.segs` inside `.pop`, `.dotpop` and `.numpad` inside `.sh-right`, `.tbar` inside the closed rail. Push
  until the `mockups` job is green.

- [ ] **Step 6: Commit** as `docs(mockups): glass on the floating cards, a level moved under them, and a check for glass in glass`.

### Task 3: Every dock floats, at every size

**Files:**
- Modify: `docs/mockups/shell.css` (the new section)

**Interfaces:**
- Consumes: the recipes. Produces: `--dock-gap: 8px` and the safe-area tokens `--safe-t`, `--safe-r`, `--safe-b`,
  `--safe-l` (`env(safe-area-inset-top, 0px)` and so on) on `html body.sh`; every inset below is
  `calc(var(--dock-gap) + var(--safe-…))` on the sides that touch the window.

- [ ] **Step 1: Add to `tests/docs/glass.test.ts`:**

```ts
test('docks keep clear of the notch and the home bar', () => {
  for (const side of ['top', 'right', 'bottom', 'left']) expect(section).toContain(`env(safe-area-inset-${side}, 0px)`)
})
test('the corners are the spec\'s', () => {
  expect(section).toMatch(/border-radius: 14px 14px 28px 28px/) // the upright phone's open sheet
})
```

- [ ] **Step 2: The top bar, all sizes.** `.sh-top` gets `top`, `left`, `right` at the gap (plus safe areas), its
  height unchanged, `border-radius: 12px`, the glass recipe's full border (today it has only a bottom border). Its
  slot grows by the gap so everything measured from `--top-h` moves down with it: `--top-h` becomes 56px (was 48),
  64px for `body.sh.touch` at `(min-height: 601px)` (was 56), 52px for a phone on its side (was 44), and the bar's
  `height` is `calc(var(--top-h) - 8px)`. The wide block's panels (`top: calc(var(--top-h) + 8px)`) then start 8
  under the bar with no change.

- [ ] **Step 3: Wide (iPad sideways, computer).** Already floating; only confirm in the pictures that the list, rail,
  inspector, tools, Put in game sheet and band still fit under the lower top bar, and fix overflow in the section.

- [ ] **Step 4: Upright iPad.** The list (`.sh-left` when open over the level) is a card 8 in from the left, from
  under the top bar to 8 above the tools, corners 12. The closed sheet on a page with a band (`--sheet-h: 84px`)
  floats like the open one (8 in, corners 14).

- [ ] **Step 5: Upright phone.** The open sheet (`.sh-right:not(.inline)`): 8 in at the sides and the bottom (plus
  `--safe-b`), `border-radius: 14px 14px 28px 28px`, `max-height: 60vh`, full border. `--sheet-h` grows by 8 so the
  level's fit and everything stacked on the sheet (`bottom: calc(var(--sheet-h) + …)`) keeps its place. `.tray`
  floats the same way. The peek line and the tools are unchanged.

- [ ] **Step 6: Phone on its side.** The tools column: 8 in from the left (plus `--safe-l`), under the top bar, only
  as tall as its tools, corners 12. The closed inspector (`.itab`'s form): a floating tab on the right, 44 high at
  least, with the picked thing's name. Open: a card 300 wide (`--right-w: 308px`), from under the top bar to 8 from
  the bottom, 8 from the right (plus `--safe-r`), corners 12.

- [ ] **Step 7: The canvas behind.** At every size the page's dark canvas (and its grid or paper dots) runs edge to
  edge: move the wide block's `html body.sh { background: #181818 }` and its `:has(.canvas.paper)` dots out to all
  sizes in the new section.

- [ ] **Step 8: Push; read the pictures.** For `world-levels`, `world-levels-glass`, `world-levels-share`,
  `world-levels-play`, `world-levels-place`, `world-levels-big`, `shell-menu` at all five sizes, check against the
  spec's "Size by size" table: every dock 8 from the window and from its neighbours, nothing cut off, no control
  smaller than before, the level's starting fit inside the clear room on every page but `world-levels-glass`. Fix
  and push until right. Then one look at each remaining shell and World page at `ipadSideways` and `phone`.

- [ ] **Step 9: Commit** as `docs(mockups): every dock floats at all five sizes, inside the safe areas`.

### Task 4: The setting, the solid page and the device key

**Files:**
- Create: `docs/mockups/world-levels-solid.html`
- Modify: `docs/mockups/shell-settings.html`, `docs/mockups/shell.css`, `CLAUDE.md`, `tests/docs/glass.test.ts`

- [ ] **Step 1: Add to the test:**

```ts
test('Settings offers See-through panels, three ways, under For me', () => {
  const settings = read('docs/mockups/shell-settings.html')
  expect(settings.indexOf('See-through panels')).toBeGreaterThan(settings.indexOf('<h4>For me'))
  expect(settings).toMatch(/See-through panels[\s\S]*?Choose for me[\s\S]*?On[\s\S]*?Off/)
})
test('CLAUDE.md names the device key', () => {
  expect(read('CLAUDE.md')).toContain('`af.me.glass`')
})
```

- [ ] **Step 2: `shell-settings.html`.** Directly under the "Row size" row:

```html
<div class="setr"><span>See-through panels<small class="no-computer">Your level shows softly through the panels. "Choose for me" turns this off if this iPad is set to "Reduce Transparency".</small><small class="only-computer">Your level shows softly through the panels. "Choose for me" turns this off if this computer is set to show fewer see-through things.</small></span><span class="segs"><button class="on">Choose for me</button><button>On</button><button>Off</button></span></div>
```

  Add `html body.sh[data-device="computer"] .no-computer { display: none; }` to the new section. (`frame.js` already
  turns "this iPad" into "this phone" on a phone.) Update the page's opening comment and the "For me" list in it.

- [ ] **Step 3: `world-levels-solid.html`.** A copy of `world-levels-glass.html` with `glass: 'off'` in its `MOCK`
  and the title `World · Levels, see-through panels off (mockup)`.

- [ ] **Step 4: `CLAUDE.md`,** "Particular to this repo", the sentence listing what the device may keep: after the
  games this device has opened, add "and the person's own "For me" choices in Settings (`af.me.*`: row size, the
  Pencil and hand choices, tips, and `af.me.glass` for "See-through panels": `auto`, `on` or `off`)".

- [ ] **Step 5: Push; `check` green; read** `shell-settings` at five sizes (the row fits, three choices 44 high on
  touch, nothing cut) and `world-levels-solid-ipadSideways` beside `world-levels-glass-ipadSideways` (same layout;
  solid panels, `--line` edges, no level showing through).

- [ ] **Step 6: Commit** as `docs(mockups): a See-through panels setting, and the same level with it off`.

### Task 5: The speed test page

**Files:**
- Create: `docs/mockups/shell-glass-speed.html`
- Modify: `tests/docs/glass.test.ts`

One file with its own inline CSS and script and no link to any other file (it is published by itself in Task 6). It
does not load `frame.js` or `shell.css`; it sets `document.documentElement.dataset.ready = 'yes'` itself so
`shoot.mjs` can picture it.

- [ ] **Step 1: Add to the test:** the page contains each of the seven token values verbatim; it has no `src=` or
  `href=` to another file; it contains the words `Frames a second` and `Start`.

- [ ] **Step 2: Write the page.**
  - **Behind:** one `<canvas>` filling the window (sized by `devicePixelRatio`, as the real editor's is), drawing a
    long strip of flat shapes in the demo level's colours (sky `#9fd3f0`, sand `#fdd4bd`, pink `#f37f94`, grass
    `#afd472`, white clouds). While running, each `requestAnimationFrame` redraws it slid sideways, back and forth.
  - **In front:** stand-in panels with a few rows of words each, laid out as the shell is. At 1001 wide or more: a
    top bar, a list 240 wide and an inspector 280 wide in glass, and a band along the bottom (34% of the height)
    in soft glass, all 8 apart. Narrower: the top bar, a tools bar and a bottom sheet (36% of the height) in glass.
  - **A solid card in the middle**, never glass: the title "How smooth is it?"; the line "Press Start and watch the
    number. 60 or more is good."; `Frames a second` with the number in big figures; `Slowest so far`; a main button
    "Start" that becomes "Stop" (48 high); and five choices in a column (44 high), the first on:
    "Everything see-through", "Solid bottom band", "Lighter blur", "Only the top bar and small things",
    "Nothing see-through". They are the spec's fallback steps in order: the second makes the band solid; the third
    also sets the docks' blur to 16; the fourth also makes the list and the inspector (or the sheet) solid; the
    fifth makes everything solid.
  - **The numbers:** frames counted each second; "Slowest so far" is the lowest second seen since Start, skipping
    the first two seconds, and starts again when a choice changes.
  - `prefers-reduced-motion` does not stop it: the person pressed Start.

- [ ] **Step 3: Push; `check` green; read** `shell-glass-speed` at `ipadSideways`, `phone` and `phoneSideways`: the
  card is whole on screen, every button is in reach, and the words pass the drunk-grandma test.

- [ ] **Step 4: Tracker.** List the pages and sizes `shoot.mjs` printed as over 0.40 glass (Task 2), as things the
  Owner's speed test decides.

- [ ] **Step 5: Commit** as `docs(mockups): a page that measures how smooth the glass is on a real iPad`.

### Task 6: The other workspaces, the board and the handoff

**Files:**
- Modify: `docs/mockups/shell.css` (only if a page breaks), `docs/superpowers/progress.md`
- Publish: the Editor Mockups artifact and the speed test artifact (not files in the repo)

- [ ] **Step 1: The other workspaces must not break.** Read one picture of each Characters, Feel, Sound and Story
  page at `ipadSideways` and `phone`. Fix only what is broken (a panel off screen, words unreadable, a band not in
  soft glass, glass in glass), in the new section. Their polish is not this round's.

- [ ] **Step 2: Publish the speed page.** Publish `docs/mockups/shell-glass-speed.html` with the Artifact tool as a
  new artifact (title "Glass speed test", icon "gauge"). Keep its address for step 3 and the tracker.

- [ ] **Step 3: Republish the board** at `https://claude.ai/artifact/W5REbCVDUkABgoPY5Hxy2X` (the Owner reviews
  every design change there; the round is not done until this is).
  1. Read it with the Artifact tool (`action: "read"`); save the page it returns (the inner document, from its own
     `<!doctype html>`) as `<scratchpad>/board/index.html`.
  2. From `origin/ci-screens:pr-57/mockups/`, at the newest commit of this branch (the `screens` job's commit
     message names it; wait for the run if it is older), copy every `shell-*` and `world-*` picture into
     `<scratchpad>/board/shots/`.
  3. Edit the page: the label line and the paragraph under the title say the new commit and the new count of screens;
     add the Owner's lines as two `p.owner` quotes (the 18:24 one on floating docks and frosted glass, the 18:31 one
     on the softer glass); replace the "What your tweaks changed" list with **"What changed and why"**: every panel
     floats at every size, the top bar too (one look whichever way the iPad is held); the panels are frosted glass
     (the level feels close); menus, Help, Settings and the bottom band are a softer, nearly solid glass (easy to
     read); the level starts clear of every panel and can slide under them; "See-through panels" in Settings turns it
     off; tips stay solid so they stand out. Add a banner line with a link: "Try the glass on your iPad: open the
     speed test, press Start, and tell us the number." In `PARTS`, after `world-levels-mid`, add
     `['world-levels-glass', 'Under the glass', 'The level slid under the panels: you see it softly through them.', false, true]`
     and `['world-levels-solid', 'See-through panels off', 'The same level with the setting off: plain solid panels.', false, true]`;
     set every other screen's `isNew` to `false`. Do not add `shell-glass-speed` as a screen.
  4. Publish `<scratchpad>/board/index.html` with `url` set to the board's address and `files` mapping each
     `shots/<name>.png` to its file (about 185 files; one publish holds 255).
  5. Open the published board's first World picture and `world-levels-glass` to confirm they are the new ones.

- [ ] **Step 4: Tracker and handoff.** In `progress.md`: 100% for this plan; the board's version; the speed test's
  address; the pages over 0.40 glass; what is next: the Owner's speed test on the iPad Pro 11 and the visual review
  steps (plain words, design pass, end-to-end, second look), which the coordinator starts unless the Owner calls this
  a targeted change. Commit as `docs(progress): floating glass docks are drawn, pictured and on the board`, push,
  confirm every check on the pull request is green, and send the coordinator the summary with both addresses.

## What this plan leaves alone

- The review steps themselves, and any fix they find: separate threads, as the process says.
- The speed fallback: the Owner picks it after the test; nothing here switches it on.
- The editor design-language page: written after the Owner approves the mockups, from the spec's recipe and rule.
