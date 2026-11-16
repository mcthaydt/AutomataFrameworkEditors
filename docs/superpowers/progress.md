# Progress

Last updated: 2026-11-16 21:08 UTC (from `date`).

## Active milestone: the World slice (roadmap slice 3)

About two thirds built. The World editor plan has 19 pull requests; 1 to 10 and 14 are merged. The plan, its spec and its plan
audit were removed with the earlier workflow (#93) and are read from `8109888`:
`docs/superpowers/plans/2026-11-16-world-editor.md`, `docs/superpowers/specs/2026-11-16-world-editor-design.md` and
`docs/superpowers/audits/2026-11-16-world-editor-plan-audit.md`.

### Current work

- Plan pull request 13 (lane B), putting changes in: built on a branch, in review. One press of the main button shows what
  would go; the sheet's own button puts it in as one commit of every file that changed, or sends it to be checked; failures
  (offline, busy, blocked, look-only, broken game) keep the changes and say what to do; a visitor keeps a copy; problems are
  counted in the top bar and shown on the level or the map. `/api/save` and the save sheet are gone. Changed from the plan:
  the put sheet is local to the World screen, not a route, so after signing in again the person is back on the level with
  their changes and presses the main button once more. Left for later: "See what changed" on the done sheet and notes (PR 16);
  the per-clash sheet (PR 15, so after a clash the game's version is kept and one Undo brings the person's back); "Show me on
  the level" on the waiting sheet. This record was written by the implementer, because the coordinator cannot write to the repo.
- Plan pull request 14, play in place (Editors #95): two reviews passed (`ccbab6a`, then `f5233b3`); merged with a merge
  commit after a green full run on its last head. This record was written by the implementer, because the coordinator cannot write to the repo.
- Plan PR 11 (the map on screen, #96): merged (`e8693a7`) after three audits and a green full run.
- Map pan, zoom and "Whole world" (#98): two reviews (`555b6f7` three reds, then `6a6e6fb` none); merged (`7ab9d87`) with a
  merge commit after a green full run on `75ad807` in Chromium, WebKit and Firefox. This record was written by the
  implementer, because the coordinator cannot write to the repo.

### Completed outcomes

| Plan PR | What | Editors PR |
|---|---|---|
| 1 | The WebKit sign-in journey | #78 |
| 2 | Pin 1, the rules for the new features, two test games | #79 |
| 3 | The look, the device, the kit and nine languages | #80 |
| 4 | Several files in one change (the API) | #81 |
| 5 | What a person holds (pure) | #84 |
| 6 | Level and map edits (pure) | #88 |
| 7 | The shell's frame | #86 |
| 8 | The team's files (the API) | #85 |
| 9 | Levels on screen: Pick, Place, Erase | #91 (`8109888`) |
| 10 | First run, Settings, Help, the keys | #90 |
| 14 | Play in place: the level plays where it is drawn | #95 |

The framework pin here is `7ff5795`.

### Remaining

| # | Pull request | Tasks | Needs |
|---|---|---|---|
| 11 | The map on screen | 29, 30 | 6, 7, 9: ready |
| 12 | A thing's settings and Join; Paint, Show and the Pencil | 31, 32 | 9, 10, 11 |
| 13 | Putting changes in, problems in plain words, offline | 33, 34 | 4, 5, 7, 8, 9, 11 |
| 15 | Checking someone's changes; whose to keep | 36, 37 | 13 |
| 16 | The team, notes, the helper's ghost and Find | 38 to 40 | 8, 12, 13 |
| 17 | Pin 2 (its own PR), then one step, slow, back 30 seconds, play from here, doors, a game with a problem | 41, 42 | 13; framework F1, F2, F4, F5 |
| 18 | Drawn behind, with the hero, in front | 42a | 12, 17 |
| 19 | Every journey at every size, the four layout fixes proved, the documents and the close | 43, 44 | all |

Order: 11 (14 is done), then 12 and 13, then 15 and 16, then 17, then 18, then 19. 11 and 14 both add a line to
`World.svelte`, as do 12 and 13: the later one merges `main` in before it goes ready.

Not built inside plan PR 9, for later pull requests: drag-in from the tray; the Add-a-note menu rows; the Pick-several
loop; free-thumb Box erase; bring-to-front (Task 42a, PR 18); the ring handles (drawn, do nothing yet). Changed from the
plan: the Settings arrows and the pad move one tile per tap. A fix with no regression test yet: WebKit's ResizeObserver
needed a shrink-to-fit width plus a synchronous size update in `LevelPart`.

Left out of plan PR 14, for later pull requests: one step, slow, back 30 seconds and "Play from here" (PR 17, which also
puts `extras` and `from` back into `Playing`), and "Show me the problem" on a level that cannot play (PR 13 wires
`cantPlay` to its problems strip). Changed from the plan: the first Play's tip comes once the game has started and holds
the game still until "Got it"; a level that cannot play says only the framework's sentence.

Then the rest of the slice: test the editor at iPad, phone and computer sizes (mostly PR 19); the website demo uses
World (Site, with Examples); and the design drift check.

### Blockers

None.

### Previews

- CI's pictures: the `ci-screens` branch (`main/` and `pr-<n>/`).
- The approved mockups: `docs/mockups/` (board v17, #70).

### Material decisions

- The Owner's: mockups first, World's approved (2026-11-16); the slice exit gate (2026-11-16): the slice does not close
  and Characters does not start until every World screen has had a design drift check against the approved mockups
  (fix the drift, recheck), recorded with what it covered and that the recheck passed.
- Decided in the plan's fix round without an Owner answer: locked and hidden last only for the visit ("Locked until you
  close the game"); a turn-down closes at once, keeps the branch, and Undo reopens it; "Try a change" is left out;
  unbuilt editors never say "Comes later" or "Soon"; the editor reads, never writes, tileset PNGs.
- Agent-selected, 2026-11-16, in #95's fix rounds: the play journey reads the game's picture through one helper that
  drops WebKit's own inline style element from the refusals a journey fails on (Playwright adds it for a screenshot; the
  full run failed on it at `ccbab6a`), and the first World play tests wait up to 15 seconds for the first game and level
  to be there, because WebKit's full run failed `world-play.browser.test.ts` once at the default second (`52145af`). Both
  are test-only; no assertion was loosened.
- Agent-selected, 2026-11-16: the design drift check's record goes in
  `docs/superpowers/audits/<date>-slice-3-design-review.md`, with a `Scope:` line and `Recheck: passed`, and the
  approval under "Approved screens" in `history.md`.
- Agent-selected, 2026-11-16: "Move apart" is the word on screen, in nine languages, where the mockups say "Pull apart".
  The words test bans "pull" (`tests/fixtures/banned.ts`, since 2026-11-14), so the mockups' word never passed it. Easy
  to change: one row in `words/arrange.ts`.
- The Owner's, 2026-11-16: map pan, zoom and a "Whole world" button are a follow-up pull request after #96 merges, built
  from `main` (built in #98).
- The Owner's, 2026-11-16 19:57 UTC: "Whole world" stays in the map's top bar, to the right of List, where #98 puts it
  ("better UX"), not under List as the mockup draws it. It is the Owner's call, not a mismatch to fix: the design drift
  check reads the mockup as out of date on this one point.
- Agent-selected, 2026-11-16, in #98: a plain wheel or a trackpad's two-finger scroll slides the zoomed map, and Ctrl +
  wheel or a pinch zooms (a Mac trackpad's scroll arrives as a plain wheel); a Windows mouse wheel does not zoom on its
  own. The map's hands are read by the level view's gesture reader. Easy to change: `wheel` in `MapPart.svelte`.

### Open items

- A journey failed once and passed on its own straight after (a defect under the rules, so it is recorded here, not
  fixed in #96 unless it recurs in CI): `open-game.journey.test.ts`, "when the sign-in is gone for good the person is on
  Welcome, told so". Text: `locator.waitFor: Timeout 10000ms exceeded. waiting for getByRole('heading', { name:
  'Automata Editors', level: 1 }) to be visible`, at `title` (line 29) from line 91. It was one full local run of all 347
  journeys in Chromium on `abe0ee7`, at 18:34 UTC, under the load of the whole run; alone it passed (15 of 15).
- WebKit failed once in CI on `83c7274` (run 43928020067, shard `browsers (webkit 6/6)`): `approve.journey.test.ts`, "grandpa
  opens the game…" at iPad upright. Text: `TimeoutError: locator.click: Timeout 10000ms exceeded. waiting for
  locator('button.put:not(.quiet)')`, at `pressPut` from `kidHasSaved` (line 72): the kid's setup drag of the crate did not
  register as a change. The same test passed on the run before (43925736127) and in all 353 journeys in Chromium here.
  WebKit is not installed in this container, so it could not be run here. The likely place: `dragByTouch` reads the
  crate's box the moment `[data-thing]` exists and presses there, with no wait for the level to settle, so a late size
  change in WebKit moves the crate out from under the press. That is a guess, not a finding. The next full run's result
  for the pull request's head shows whether it recurs; the fix, if so, is to wait for the crate's box to hold still in
  `tests/fixtures/journey.ts` (lane 2), not here.
- Follow-up, from the cycle 2 review of #98: six `waitForTimeout` calls (400, 300, 300, 300, 200 and 200 ms before
  the pictures, in `tests/journeys/map.journey.test.ts`, the arranging journey from #96) predate #98 and break the rule
  "browser tests wait on readiness, never on a sleep". A follow-up replaces them with readiness waits. #98's own new
  tests have none. Also for the shell's keys sheet when it is built: "Ctrl + wheel: zoom" and "+ / -: zoom" on the map.
