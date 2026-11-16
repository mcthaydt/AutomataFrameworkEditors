# Map slide, zoom and "Whole world": review

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete integrations. Do your best work.

- Pull request #98, commit `555b6f7` (branch `claude/project-thread-uv6r44`, on `main` at `e8693a7`). Lane 2: one fresh
  review.
- Read against: the pull request's own criteria; the World editor design (`2026-11-16-world-editor-design.md`, "The
  level" and "The world map"); `CLAUDE.md` (quality bar, "How code is written", the 600-line cap); the Owner's choice
  of 2026-11-16 to build pan, zoom and "Whole world" as a follow-up to #96.
- Graphify (graph at `857f3d7`): `createGestures` has one caller, `LevelPart.svelte`. This change only exports it
  from the levels barrel, so the level view is unaffected. `MapPart.svelte` isn't in the graph yet, so the map side
  was read directly.
- CI on `555b6f7` was still running at review time (`check` and `mockups` in progress).
- Reviewed 2026-11-16 19:39 UTC.

## Verdict

3 red, 6 notes. The view math (`viewing.ts`) is sound and well tested. The reds are keyboard reach, sleeps in tests
and one wrong translation.

## Findings

### 1

UNIT: `src/features/map/MapPart.svelte` (the reveal effect, lines 264-271; the level buttons).
VERDICT: red
REQUIREMENT: `CLAUDE.md` quality bar: "Everything works with the keyboard alone, and focus is always visible";
`viewing.ts`'s own claim that `reveal` runs for a level "picked from the list, or tabbed to".
REASON: Once the map is zoomed, Tab moves focus to level buttons that are off screen (the sheet clips them with
`overflow: hidden`), and nothing brings them into view. Only a change of `picked` calls `reveal`.
EVIDENCE: the `$effect` reads only `picked`; the level `<button>` has no `onfocus`. A keyboard user who zooms with `+`
and tabs on loses sight of the focused level, and the arrow keys then move a level they can't see.
EXPECTED: Focusing a level that is out of sight brings it into sight, as picking it does.
FIX: an `onfocus` on the level button that sets `custom = reveal(camera, rect, all, size)` when `custom` is set, plus
a browser test: zoom in, focus an off-screen level, and it is inside the sheet. Files: `MapPart.svelte`,
`tests/features/map/map-view.browser.test.ts`.

### 2

UNIT: `tests/journeys/map.journey.test.ts` (the new test), `tests/features/map/map-view.browser.test.ts`.
VERDICT: red
REQUIREMENT: `CLAUDE.md:183`: "Use injected clocks and fixed seeds. Browser tests wait on readiness, never on a sleep."
REASON: The new tests sleep.
EVIDENCE: the journey: `await page.waitForTimeout(300)` before `picture(...)`. The browser test: `wait(110)` on each of
six one-finger steps, and `wait(30)` after each wheel step.
EXPECTED: Each test waits for a condition. Before the picture, wait for the drawn state, for example the canvas showing
the new scale or a ready attribute. For the one-finger slide, the gesture reader's timing comes from an injected clock
or fake timers, not real time.
FIX: replace the three sleeps. Files: those two tests, plus a clock option on `createGestures` if the slide needs one
(`src/features/levels/gestures.ts`).

### 3

UNIT: `src/features/words/map.ts`, Spanish `wholeWorld`.
VERDICT: red
REQUIREMENT: `CLAUDE.md` drunk-grandma test (plain words that mean the thing); the design's nine languages, each in
its own words.
REASON: "Todo el mundo" is the everyday Spanish for "everybody", so the button reads as "Everyone".
EVIDENCE: `wholeWorld: 'Todo el mundo'`.
EXPECTED: "El mundo entero" (or "Mundo entero"). The other eight read as "whole world".
FIX: one string. File: `src/features/words/map.ts`.

### 4

UNIT: the "Whole world" button's place (top left of the sheet).
VERDICT: note
REQUIREMENT: the World design, "The world map": "'Whole world' sits under List."
REASON: The pull request moves it and says so under "Decisions to check". It's a disclosed change from an approved
design, so it's the Owner's to confirm, not a defect here.
EXPECTED: The coordinator shows it to the Owner with the map pictures, or it moves under List when that row exists.
FIX: none in this pull request.

### 5

UNIT: `MapPart.svelte`, `wheel`.
VERDICT: note
REASON: A plain wheel zooms. On a Mac trackpad, a two-finger scroll arrives as a plain wheel, so it zooms when people
expect it to slide. A trackpad pinch already arrives as `ctrlKey` wheel events.
EXPECTED: A plain wheel or trackpad scroll slides, and `ctrlKey` (pinch, or Ctrl+wheel) zooms. Or keep it as it is
and say why.
FIX: optional. `MapPart.svelte` and the wheel tests.

### 6

UNIT: `tests/journeys/map.journey.test.ts`.
VERDICT: note
REASON: The journey checks zooming only with the mouse wheel, at all three sizes, phone included. Touch is the main
path, but pinch and one-finger slide are covered only by synthetic events in the component test.
EXPECTED: At the phone and tablet sizes, the journey pinches (two touches through CDP `Input.dispatchTouchEvent`), or
the pull request says why it doesn't.
FIX: optional. The journey only.

### 7

UNIT: `MapPart.svelte` / `MapFloats.svelte` ("Code moved first").
VERDICT: note
REASON: The pull request says the bar, cards and actions "moved" to `MapFloats.svelte`, but the map's own pointer
handling was also rewritten onto `createGestures`. The old `LITTLE = 8` slide threshold, the
"a second finger makes nothing" rule and the separate press and hold timers are gone, replaced by the gesture reader's
rules.
EVIDENCE: lines removed from `MapPart.svelte` with no copy in `MapFloats.svelte`: `const LITTLE = 8`, `fingers`,
`down`/`move`/`up`/`still`/`hold`. The pull request reports #96's map tests green on Chromium.
EXPECTED: The body says this is a behaviour change to the map's hand handling, so the WebKit and Firefox runs are read
with that in mind.
FIX: wording in the pull request body.

### 8

UNIT: `src/features/map/viewing.ts`, `reveal`.
VERDICT: note
REASON: "In sight" counts the top strip under "Whole world" and "New level" (`TOP_ROOM`) as visible, so a picked level
sitting under those buttons is left there.
EXPECTED: The free area starts below `TOP_ROOM`, as it already ends above `KEY_ROOM`.
FIX: one line in `reveal` and a case in `viewing.test.ts`.

### 9

UNIT: CI on `555b6f7`.
VERDICT: note
REASON: Not finished at review time. WebKit and Firefox run only in CI.
EXPECTED: Merge after the full run is green, as the coordinator's plan already says.
FIX: none.

## Checked, no finding

- `viewing.ts`: zoom keeps the tile under the pointer, clamps between fitted and `MAP_MAX_SCALE`, and returns to
  "Whole world" at or past fitted. A slide can't take the view's middle off the levels. All of this is covered by
  `viewing.test.ts`.
- The other eight translations of "Whole world" read correctly.
- File sizes: `MapPart.svelte` 457, `MapFloats.svelte` 257, `World.svelte` unchanged, all under 600.
- `touch-action: none` on the sheet and the level buttons, and `preventDefault` on a non-passive wheel listener that
  is removed on unmount.
