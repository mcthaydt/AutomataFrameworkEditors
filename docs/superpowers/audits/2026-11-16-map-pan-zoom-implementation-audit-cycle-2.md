# Map slide, zoom and "Whole world": review, cycle 2

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete integrations. Do your best work.

- Pull request #98 at `6a6e6fb`, on top of the cycle 1 review (`2026-11-16-map-pan-zoom-implementation-audit.md`,
  commit `04639d9`). One commit since then, touching `MapPart.svelte`, `viewing.ts`, `words/map.ts` and the three tests.
- CI on `6a6e6fb`: the `ci` run was pending (queued) at review time.
- Reviewed 2026-11-16 19:51 UTC.

## Verdict

0 red, 3 notes. All three cycle 1 reds are fixed. It's clean to merge once the full CI run is green.

## Cycle 1 findings

| # | Verdict | Status at `6a6e6fb` | Evidence |
|---|---|---|---|
| 1 | red | Fixed | The level button has `onfocus`, which calls `reveal` when the map is zoomed and the focus came from the keyboard (`:focus-visible`). The sheet is `overflow: clip` (with `hidden` as the fallback), so focus can't scroll it. New browser test: "tabbing to a level that is out of sight brings it into sight, without the sheet scrolling away". |
| 2 | red | Fixed | The new tests have no sleeps. The journey's `waitForTimeout(300)` became a wait on the level's position plus two animation frames before the picture; `wait(110)` became `tick()`; `wait(30)` became `vi.waitFor`. The `wait` helper is gone. |
| 3 | red | Fixed | Spanish `wholeWorld: 'El mundo entero'`. |
| 4 | note | Open, the Owner's | "Whole world" still sits at the top left, not under List. |
| 5 | note | Fixed | A plain wheel or trackpad scroll slides (and does nothing on the fitted map); Ctrl+wheel or a trackpad pinch zooms; `deltaMode` lines are scaled. Covered by a new browser test and the journey. |
| 6 | note | Left, with a reason | No CDP pinch in the journey, for portability across the three engines. Pinch stays covered in the component test. |
| 7 | note | Open | The pull request body still says the map code "moved", not that the hand handling was rewritten. |
| 8 | note | Fixed | `reveal` keeps clear of `TOP_ROOM` as well as `KEY_ROOM`, with a new `viewing.test.ts` case. |
| 9 | note | Open | CI not finished (see above). |

## New findings

### 1

UNIT: `tests/features/map/map-view.browser.test.ts`, the new tabbing test.
VERDICT: note
REQUIREMENT: cycle 1, red 1 (the keyboard path).
REASON: The test calls `element.focus()` from script instead of pressing Tab, and the fix depends on `:focus-visible`.
Whether script focus matches `:focus-visible` is up to each browser's own rules, which differ between Chromium, WebKit
and Firefox. So the test may not show the keyboard path in every engine, and could fail in one for that reason alone.
EXPECTED: The focus comes from a real Tab (`userEvent.keyboard('{Tab}')` from `vitest/browser`) until the
off-screen level has focus. Or, if the engines agree in CI, the test says why script focus is enough.
FIX: the test only.

### 2

UNIT: `MapPart.svelte`, `wheel`.
VERDICT: note
REASON: On the fitted map, a plain wheel now does nothing. A mouse user's only ways to zoom are Ctrl+wheel and the `+`
key on a focused level, and the screen shows neither.
EXPECTED: Nothing more for now: the keys sheet in the design is where these belong. This is noted so the shell's keys
sheet lists "Ctrl + wheel: zoom" and "+ / -: zoom" when it's built.
FIX: none here.

### 3

UNIT: `tests/journeys/map.journey.test.ts` (tests from #96, outside this change).
VERDICT: note
REASON: Six `waitForTimeout` calls remain in the older map journeys (lines 69 to 128), the same count as on `main`.
They predate this pull request.
EXPECTED: A follow-up replaces them with readiness waits, as `CLAUDE.md:183` asks.
FIX: not in this pull request. Recorded as a follow-up.
