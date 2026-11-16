# Implementation audit: Editors PR #95, play in place (plan PR 14, Task 35)

- Written: 2026-11-16T18:04:07Z (from `date`). Lane 2 fresh review, `review` skill.
- **Commit examined:** `ccbab6a2ca9c45bd15acbca1b9eb7719c7ba360d` (the PR head: `69572a5`, `2e65665`, then main `24b136d` merged in).
- Brief: the plan's Task 35 (`handoff/source/editors/2026-11-16-world-editor.md`), the repo's CLAUDE.md (quality bar,
  drunk-grandma test), the screens artifact https://claude.ai/artifact/4YZMLMU7KY72bgj3sjWsaU.
- Not committed (the coordinator asked for the file here only).

## What ran

| Check | Result |
|---|---|
| `pnpm lint` (Biome) | pass; 1 warning, in `tests/workflows/gate.test.ts`, not this PR |
| `pnpm typecheck` | pass, 0 errors, 0 warnings |
| `pnpm knip` | pass |
| `pnpm test:node` | 84 files, 1,078 tests pass |
| Chromium browser tests `tests/features/play`, `tests/features/world` | pass (12 play tests). The first run failed to import `play.browser.test.ts` ("Failed to fetch dynamically imported module", Vite's first dependency pass); the second run passed with no change. Reported as seen, not a defect of this PR. |
| Journeys, WebKit, Firefox | not run here (only Chromium is installed); the full CI run on `ccbab6a` was in progress at 18:04Z: 15 browser shards green, 5 shards plus `mockups` and `check` still running, none failed. The earlier draft run's `quick engines`/`quick gate` "failures" are cancelled shards superseded by the ready-for-review run. |
| Scratch probes (Chromium, deleted after) | Space on a focused editor button; the wording of a level that cannot play; what shows while the game loads; touch halves on a mouse screen. Results are in the findings. |

## What meets the brief

The play box replaces the canvas and marks, panels go quiet (`inert`, dimmed), Bigger/Smaller, Stop in the top bar and on
Escape, keys belong to the game while it plays, nothing is written (edits identity and `localStorage.length === 0`
tested), the game's language falls back to its source language (journey), the first-Play tip shows once and is in Help,
step / slow / 30 s / Play from here are absent (not dimmed), `World.svelte` is 592 lines. The touch halves are hidden
on a mouse screen (probe: width 0) and shown on a touch one (test). The PR body names its differences from the plan
and the mockups.

## Findings (red)

### R1. A level that can't play shows a file path and a JSON pointer

UNIT: `src/features/play/run.ts` (`play`, the `CannotPlay` lines), `src/features/world/events.ts` (`cantPlay`)
VERDICT: red
REQUIREMENT: The drunk-grandma test (CLAUDE.md, "Rules that never bend"); Task 35: "`play` rejects with the framework's
first sentence"; the plan's words rule (no jargon on a screen).
REASON: Each line is `formatDiagnostic(...)`, which puts the file and the field path before the sentence.
EVIDENCE: Probe at `ccbab6a`, a thing whose character is `ghost`: the card reads "This level can't be played yet. Here is
what needs mending: content/levels/level-1.json: things[0].character: There is no character called "ghost". This game
has: crate, hero."
EXPECTED: The person reads only the framework's plain sentence: "There is no character called "ghost". This game has:
crate, hero." No path, no `things[0].character`.
FIX: Build the `CannotPlay` lines from each diagnostic's own message, not `formatDiagnostic`; extend the "cannot be
built" browser test in `tests/features/play/world-play.browser.test.ts` to assert the text has no `.json` and no `[0]`.
Files: `src/features/play/run.ts`, `tests/features/play/world-play.browser.test.ts`
(and `tests/features/play/play.browser.test.ts` if its assertion needs it).

### R2. Space on a focused button starts Play and the button is not pressed

UNIT: `src/features/world/World.svelte` (the `key` handler, the `command === 'play'` branch added in `2e65665`)
VERDICT: red
REQUIREMENT: Quality bar: "Everything works with the keyboard alone"; Space presses a focused button.
REASON: `typing()` excuses only fields, so Space on a focused button is taken as Play and `preventDefault` cancels the
button's own press.
EVIDENCE: Probe: focus the toolbar's "Place" button (`aria-pressed=false`), press Space with real input: play starts and
"Place" stays unpressed.
EXPECTED: Space on a focused button, link or other control presses that control; Space starts Play only when focus is on
the page or the level.
FIX: Skip the `play` command when the key's target is a button, link or `[role=button]`/`[role=tab]` (a small guard
beside `typing` in `world/listen.ts`); add a browser test in `tests/features/play/world-play.browser.test.ts` that
focuses a toolbar button, presses Space with `userEvent`, and sees the button pressed and no play box.
Files: `src/features/world/World.svelte`, `src/features/world/listen.ts`, `tests/features/world/` or
`tests/features/play/world-play.browser.test.ts`.

### R3. The first-Play tip covers the running game, and is spent even when the level can't play

UNIT: `src/features/world/World.svelte` (`startPlay`), `src/features/world/tips.ts` (`playTip`)
VERDICT: red
REQUIREMENT: Drunk-grandma test (one main thing on the screen, nothing that needs explaining); Task 35: "The first Play
on a device says so once".
REASON: The tip is said and marked seen before the game starts, and the game runs under it.
EVIDENCE: Screens artifact, "Phone sideways: Playing, first Play": the card covers nearly the whole level while the
game runs (iPad and phone upright similar). Probe with a level that cannot play: three cards stack, the "brought back"
note, the play tip and the problem, and `af.tip.play-code` is set though nothing played.
EXPECTED: The tip is shown only once the game has started, and the game waits (paused) until "Got it"; a Play that
fails does not use the tip up.
FIX: Give the tip from `PlayPart`'s start (a new `onstarted` call) instead of `startPlay`, pause the game while it
shows and resume on "Got it"; extend the tip tests in `tests/features/play/world-play.browser.test.ts` (the failed
Play leaves `af.tip.play-code` unset; while the tip shows, `paused()` is true).
Files: `src/features/world/World.svelte`, `src/features/play/PlayPart.svelte`, `src/features/world/tips.ts`,
`tests/features/play/world-play.browser.test.ts`, `tests/features/world/tips.test.ts`.

### R4. The journey never presses the game's touch control on the phone

UNIT: `tests/journeys/play.journey.test.ts`
VERDICT: red
REQUIREMENT: Task 35 Step 1: "on touch ... press the game's right button and the hero moves"; CLAUDE.md "Touch first".
REASON: At both sizes (iPad sideways, phone) the hero is moved with `keyboard.down('ArrowRight')`; no journey touches the
game's walk half, so a broken touch path would pass.
EVIDENCE: `play.journey.test.ts`, the first test, `page.keyboard.down('ArrowRight')`; the touch controls are checked only
for presence (`play.browser.test.ts`, mocked `matchMedia`).
EXPECTED: At the phone size the hero is moved by a touch slide on the game's walk half, and moves right.
FIX: In the phone case, slide on `[data-play="box"] [data-half="walk"]` with touch (the journey fixture already drives
touch, `dragByTouch`); keep the key case for iPad sideways. File: `tests/journeys/play.journey.test.ts`
(and a helper in `tests/fixtures/journey.ts` only if one is needed).

### R5. The "door into a deleted level" case has no test

UNIT: `tests/features/play/play.browser.test.ts` or `world-play.browser.test.ts`
VERDICT: red
REQUIREMENT: Task 35 Step 1: "delete a level a door leads to, press Play, and read" the reason.
REASON: The PR moved this case from a journey to a browser test (fair: the map UI is PR 11), but the browser test that
landed uses a missing character, a different refusal.
EVIDENCE: Both "cannot be built" tests set `character: 'ghost'`; no test removes a level a door names.
EXPECTED: A browser test builds edits where a door's target level is gone (the pure edits from Task 19 or a hand-edited
`Edits`), presses Play, sees no canvas and the framework's sentence about the missing level.
FIX: Add that one browser test. File: `tests/features/play/world-play.browser.test.ts`.

## Notes (not blocking, kept apart)

- N1. While the game loads, the level's box is empty: the marks are hidden, the play bar is not drawn yet (probe: box
  present, no bar, marks hidden right after Play). Fine if it is short; a quiet "Starting…" in the box would cover the
  quality bar's loading state. Not measured.
- N2. The paused bar draws "Go on" and "Smaller" both with the accent outline (`aria-pressed` style), so two buttons look
  picked; the design language keeps `--accent` for what is picked and one main button.
- N3. The top bar's Undo and Redo (iPad and computer) stay live while the game plays; pressing one changes the level
  under a running game that does not show it.
- N4. `Playing` drops `extras` and `from` and adds `tick()`, against the plan's interface (`extras` "undefined until
  Pin 2"). Named in the PR body; PR 17 (Task 42) should add them back as the plan types them.
- N5. "Show me the problem" waits for Task 34 (PR 13). The plan's order lets PR 14 merge first, so PR 13 must wire
  `cantPlay` to its strip. Recorded for PR 13.
- N6. The screens artifact's "Computer" row shows the touch halves because every journey context sets `hasTouch: true`
  (`tests/fixtures/journey.ts`). On a real mouse screen they are hidden (probe). A computer profile without touch would
  make that row truthful (a change to the fixture, outside this PR).

## Follow-ups outside this change

- F1. `package.json` `test:engine` and `test:journeys` use `--passWithNoTests`, which CLAUDE.md forbids in CI. On `main`,
  not this PR; its own thread.
- F2. Chromium's first browser run in a fresh checkout failed to import a test file once and passed on the rerun (see
  "What ran"). If CI shows the same, it is a defect to report with its text.

## Verdict

Not ready to merge at `ccbab6a`: five red findings (R1 to R5). The fixes stay inside `play/`, `world/` and the play
tests. R1 to R3 change what people see, so the visual check runs again on the play screens after them.

## Fix round (the implementer)

The audit file is committed with the fixes, written to the repo by the implementer because the reviewer's copy was kept
outside it. Each red has a test that failed first and passes now.

| Finding | Fix | Check |
|---|---|---|
| R1 | `CannotPlay` lines are each diagnostic's own sentence (`run.ts`), no file and no place | `world-play.browser.test.ts` (no `.json`, no `[0]`), `play.browser.test.ts` |
| R2 | `onControl` in `world/listen.ts`; Space on a button, link or tab is the control's, not Play | `world-play.browser.test.ts`, real `userEvent` Space on a toolbar button |
| R3 | The tip is given when the game has started (`PlayPart` `onstarted`), the game holds still once its first picture is drawn and goes on at "Got it"; a failed Play leaves `af.tip.play-code` unset | `world-play.browser.test.ts` (waits, goes on, failed Play), `tips.test.ts` |
| R4 | The phone case slides a finger on the game's walk half (`slideGameHalf` in `tests/fixtures/journey.ts`); the iPad case keeps the key | `play.journey.test.ts`; with a slide of 0 the phone case fails, so the touch is what moves the hero |
| R5 | A door into a deleted level (links game, `room-2` taken out of the levels and the world) is not played and says `There is no level called "room-2"` | `world-play.browser.test.ts` |
| N2 | Pause/Go on and Bigger/Smaller no longer carry `aria-pressed`: their words change with the state, so none is also drawn as picked | `play.browser.test.ts` |
| N3 | The top bar's Undo and Redo cannot act while a level plays | `topbar.browser.test.ts` |

Notes left open, outside this change: N1 (a "Starting…" line while the game loads: not measured, no word to add until it
is), N4 (PR 17 adds `extras` and `from` back to `Playing` as the plan types them), N5 (PR 13 wires `cantPlay` to its
problems strip), N6 (a touchless computer profile in the journey fixture), and F1, F2.
