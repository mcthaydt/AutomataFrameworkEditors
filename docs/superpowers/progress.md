# Progress

Last updated: 2026-11-20 02:04 UTC (from `date`).

## Active milestone: the World slice (roadmap slice 3)

About two thirds built. The World editor plan has 19 pull requests; 1 to 10 and 14 are merged. The plan, its spec and its plan
audit were removed with the earlier workflow (#93) and are read from `8109888`:
`docs/superpowers/plans/2026-11-16-world-editor.md`, `docs/superpowers/specs/2026-11-16-world-editor-design.md` and
`docs/superpowers/audits/2026-11-16-world-editor-plan-audit.md`.

### Current work

- Owner instruction (2026-11-20 02:03 UTC, project chat): "Finish the slice, I'm going to sleep". The slice lead drives
  the open pull requests to merge and carries on down the list overnight, keeping sessions and screenshot runs lean
  (the Owner is watching usage). Held for the Owner: lane 3 steps, the website demo's recorded plays (the Owner sees
  them first), and the Owner's own looks and walk at the slice end.
- State at 2026-11-20 02:04 UTC: glass and icons (#119) passed its review at `d961ead` (cycle 2, audit `b026b9a`) with the Owner's
  three notes in; two small notes are being fixed, then the full run and the merge. PR 16 (#113) passed cycle 2 at
  `8831e91` (audit `4244205`) with one WebKit red only the full run can prove; it merges after #119. PR 15 (#118) had
  3 reds at `ab713d9` (audit `0f8dcfb`); the slice lead's call on the first: build the plan's version, both places named
  on the real level, not the two small pictures of the sketch (easy to change back: `team/Clash.svelte`).

- Glass and icons (#119), review cycle 1 at `1381e6a` (audit `e4f61b0`): 3 red, 5 notes. Red 1: the dim's own blur
  stops sheets and dialogs getting their layer's blur, and the dialog card is drawn lighter than a sheet (the reverse
  of the scale): being fixed with a browser test. Agent-selected calls by the slice lead, not the Owner's: the white
  waiting-change page is left (PR 15 deletes it); the approved mockups in `docs/mockups/` are not redrawn, and are read
  as out of date on glass strength, icon-only buttons and centred plain pages, by the Owner's instructions of
  2026-11-17 and 2026-11-20, in the slice-end design drift check. Found on main, not this change's: on a phone the
  Show panel covers the top bar menu's Help; it goes to PR 19's layout fixes.

- Owner instruction (2026-11-20 01:00 UTC, on the after shot of a picked thing's settings panel): "this needs some
  padding and margin, it's hugging the edges". The settings panel gets padding inside and a margin from the screen's
  edges; given to the glass builder (#119) with the Owner's picture. Not yet applied.

- Owner instruction (2026-11-20 00:59 UTC, on the glass before-and-after page, the "game that cannot open" page):
  "this should be centered", then (01:00 UTC) "actually all of those panels at the top of the page, should be at the
  middle of the page". Read by the slice lead as: every plain page whose card or panel sits at the top (the
  game-cannot-open pages, Welcome, Pick a game and the like) is centred in the page both ways; the editor's own bars
  and sheets stay. Given to the glass builder (#119) to land with its review fixes. Not yet applied.
- Glass and icons (#119, draft) is built at `1381e6a` and in its lane 2 review (fresh reviewer, Opus 5.5, medium). The
  Owner saw the layout sketch and a before-and-after page of twelve screens at three sizes
  (https://claude.ai/artifact/Qzm6Etuvghk3JBcyFiUzZR). Rules changed on main in #120 ("shoot only what changed"); every
  builder and the reviewer were told.

- Owner decision (2026-11-20 00:21 UTC, decision card): the World slice closes with the native-speaker reads planned,
  not done. The plan is Framework #219 (`docs/superpowers/specs/2026-11-20-native-speaker-reads-design.md`); the reads
  of ES, KO, JA, ZH and PT (478 rows a language, measured there) happen later, when the Owner has readers. Still the
  Owner's and not asked yet: who reads, any payment, the extra scope, and which commit is read.

- **Picked back up (2026-11-20 00:02 UTC, slice lead).** Every session hit the usage limit at 2026-11-17 06:53 UTC and stopped for
  three days; nothing merged in that time but rule and test-cleanup pull requests (#114 to #117). Owner instruction
  (2026-11-19 20:35 UTC): the project is halted until the Owner finishes another project; the only work allowed is
  updating the workflow, creating docs, and finishing the slice we are on. So: finish World, start nothing after it.
  State at pick-up: PR 16 is draft #113 at `8d3cae8` (Task 38 only); PR 15 and the glass and icons work were built in
  their containers and not pushed; all three builders were asked to push first, re-read the changed rules (`verify`,
  Verification in `build`) and carry on.

- **Where things stand (2026-11-17 06:41 UTC; written by the slice lead, thread "Coordinate the World slice", which now coordinates
  this slice; the "Complete all Automata slices" thread is the master coordinator).** Merged: plan PRs 1 to 11, 12a, 12b,
  13, 14. Building side by side from `bfc9b72`: PR 15 on `claude/project-thread-wouq77` (Sonnet 5.5, medium) and PR 16 on
  `claude/project-thread-2r8m50` (Sonnet 5.5, high: three tasks, four two-window journeys). Starting: the glass and icons
  pull request (Opus 5.5, medium, lane 2). Then 17, 18, 19, the website demo, the plan for native-speaker reads, and the
  slice end. Briefs: the project's shared folder, `handoff/world/`.
- Plan PR 12b (#110) merged with a merge commit (`fd1f3b1`) after a green full run on `ece2cc0` (27 checks). Reviewed at
  `d8a9579` (cycle 2, audit `6721ee1`); after it only `tests/fixtures/journey.ts` changed (Firefox and WebKit report no
  touch points under emulation, so the fixture says one), read by the slice lead before the merge. Builder choices the
  Owner has seen and not approved: Shift paints a box, Alt erases; a "More ways" tab for Box, Fill, Erase; Show choices
  last for the visit; a two-column toolbar on a phone on its side.
- Owner instructions, 2026-11-17: (06:19 UTC) the glass semi-transparent look on every surface, no solid panels, and
  icons over text as much as possible; (06:20) glass blur and dimming are z-layer based, from one shared set of tokens
  (bars and panels least, menus and sheets more, dialogs most); (06:21) every pull request that adds or changes a screen
  starts with a layout sketch, shown to the Owner as written, not a gate; (06:23) one coordinator per slice, with a
  master coordinator over all slices; the design loop runs at the slice end.
- Layout sketches shown to the Owner (2026-11-17, no notes yet): PR 15 (check, ask, turned down, whose to keep) and PR 16
  (people, what changed, games, notes, the helper's ghost, Find). Agent-selected, not approved: "1 to check" opens the
  list of waiting changes first; People and What changed open as glass sheets over the level, not pages; new World code
  goes in new files because `World.svelte` is at 589 of 600 lines.

- Restart (2026-11-17): this repo's setup pull request puts back the apps kit (CLAUDE.md, skills, compaction hook) and the
  CI, gate and commit-authors check saved in AutomataPrivate `docs/superpowers/handoffs/2026-11-17-restart/`. The
  owner's brief (2026-11-17 03:54 UTC): "all slices complete", run by the apps CLAUDE.md and the restart handoff.
- Owner decision (2026-11-17 04:00 UTC, decision card): the cloud tool's forced "Generated by Claude Code" pull request
  footer is taken off by the `commit-authors` check itself (it may now write the pull request for that one edit).
- Owner instruction (2026-11-17 04:00 UTC): a Remote Control session on the Owner's computer may run
  `owner-commands.sh` once, after the setup pull requests merge: a one-off exception to "nothing runs on the Owner's
  computer" for the public repos, for that script only.
- Plan pull request 13 (lane B, #103), putting changes in: merged with a merge commit (`78e6f09`) after a green full run on
  `833d47e`, which had main's PR 12a and the Firefox fix (#106) merged in. One press of the main button shows what would go;
  the sheet's own button puts it in as one commit of every file that changed, or sends it to be checked; failures (offline,
  busy, blocked, look-only, broken game) keep the changes and say what to do; a visitor keeps a copy; problems are counted in
  the top bar and shown on the level or the map. `/api/save` and the save sheet are gone. Changed from the plan: the put sheet
  is local to the World screen, not a route. Left for later: "See what changed" on the done sheet and notes (PR 16); the
  per-clash sheet (PR 15, so after a clash the game's version is kept and one Undo brings the person's back); "Show me on the
  level" on the waiting sheet. This record was written by the implementer, because the coordinator cannot write to the repo.
- **Where the next session picks up (the owner paused new World work after 12a and 13, 2026-11-17).** Both are merged. Start
  PR 16 (Tasks 38 to 40: People, History, Notes, the helper's Ghost, Find, Games, plus "See what changed" and "Show me on the
  level") from the latest main, then 12b, 15, 17 to 19 and the end-of-slice loop (visual check, blind judge, retro). Seen and
  not fixed: the 32 px map wall marker, and `--passWithNoTests` in the `test:journeys` script (each its own thread).
- Plan PR 12b (Task 32: Paint, Show and the Pencil, Editors #110, draft): built on `claude/project-thread-ik1on4`, resumed from
  the parked work. All 23 phone-sideways `screens` scenes failed because seven toolbar buttons did not fit one column; phone
  sideways now draws the toolbar two buttons wide. Locally in a cloud container: lint, typecheck, knip, node and Chromium
  engine tests, and all journeys in Chromium. Waits on: the fresh review, and the full CI run once the setup pull request
  (#109) has put CI back. Choices made, none the Owner's yet: Shift paints a box and Alt erases; the free thumb's Box, Fill
  and Erase fold out of a "Hold" tab; the Show choices last for the visit only (no new `af.me.*` key); an upright phone's
  toolbar is two rows with every name showing; a phone on its side is two columns wide; a stroke that opens or closes the way
  to another level says which. Pick up from `docs/superpowers/live/claude-project-thread-ik1on4.md`. Lane A then goes 15, 17
  (after framework F4 and F5), 18, 19. This note was written by the implementer for the coordinator.
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
| 12a | A thing's settings, Join, tags, Go to (merged, #101) | 31 | 9, 10, 11 |
| 12b | Paint, Show and the Pencil (merged, #110) | 32 | 12a |
| 13 | Putting changes in, problems in plain words, offline | 33, 34 | 4, 5, 7, 8, 9, 11 |
| 15 | Checking someone's changes; whose to keep (building) | 36, 37 | 13 |
| 16 | The team, notes, the helper's ghost and Find (building) | 38 to 40 | 8, 12, 13 |
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
