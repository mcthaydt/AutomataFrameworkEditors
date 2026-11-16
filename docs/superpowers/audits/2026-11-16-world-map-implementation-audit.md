# Implementation audit: Editors PR #96, the world map on screen (plan PR 11, Tasks 29 and 30), cycle 1

- Commit examined: `83c727487a2aa2d1c0be4058549c7bf7793567df` (merge of `main` into `claude/project-thread-uv6r44`).
- Written: 2026-11-16 18:25 UTC (from `date`). Lane 2 (touches `src/features/words/`). Fresh session, `review` skill.
- Brief: `/mnt/project-files/handoff/source/editors/2026-11-16-world-editor.md`, Tasks 29 and 30 (plus Task 18's
  interfaces), the design `2026-11-16-world-editor-design.md` ("The world map", "Known layout issues"), the mockups
  `docs/mockups/world-map*.html`, CLAUDE.md (drunk-grandma test, touch first, 600-line cap).
- Prompt: Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative
  to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete
  implementations or incomplete integrations. Do your best work.

## What ran here, at 83c7274

- `pnpm lint`, `pnpm typecheck`, `pnpm knip`: pass.
- `pnpm test:node`: 83 files, 1085 tests, pass.
- `pnpm test:engine chromium` on `tests/features/map`, `tests/features/world`, `pinch-to-map`, `topbar`: 5 files, 31
  tests, pass.
- `pnpm build:journeys` then `tests/journeys/map.journey.test.ts` in Chromium: 6 tests (3 sizes), pass. The pictures
  were looked at (map, wall, joined, apart, overlap, new; phone and iPad sideways in full).
- Two throwaway probe tests (not committed, deleted after) on `MapHolder`: see R1.
- Not run here: WebKit, Firefox. CI's full run `43928020067` for this commit was still running at 18:25 UTC (the earlier
  run `43925736127`, on the commit before the merge of `main`, passed).

## Verdict

Not ready. Five red findings (R1 to R5); R1 and R2 are the ones a person would hit. The disclosed departures are judged
below; one of them (no pan, zoom or "Whole world") is a follow-up for the owner, not a fix here.

## The known departures

| Departure | Allowed? | Why |
|---|---|---|
| "Move apart" on screen where the mockups say "Pull apart" | **Yes**, as a disclosed word change | The design says the mockups' words are the build's words "(they passed the plain-words checks of 2026-11-15)", but `pull` has been on `tests/fixtures/banned.ts` since 2026-11-14 (merge `74213f4`), so "Pull apart" never passed that check. The check wins over the mockup; "Move apart" is plain and is used the same way on the bar, the wall card ("Move them apart") and in all nine languages. It should be named in `progress.md`'s decisions so the owner sees it (CLAUDE.md "Expose decisions"). |
| Files split to stay under 600 lines (`words/arrange.ts`, `WorldList`, `Sheets`, `keeping.ts`, `insets.ts`) | **Yes** | "No file over 600 lines" is a standing rule; the plan's file lists say what to create, not what may not exist. The splits change nothing on screen (World's moved code reads the same). `MapPart.svelte` is at 583 lines and `World.svelte` at 591: the next change to either has to move code out first. |
| No map pan or zoom, no "Whole world" button | **Allowed by the plan, not by the design: owner follow-up** | Tasks 29 and 30 never ask for them, Task 29 only says the map *opens* at `wholeWorld`, and no mockup draws them. But the design says "'Whole world' sits under List", and no later plan PR builds it, so as things stand it is never built. Consequence today: with many levels the map stays fitted, so each level is tiny (64 levels in a row on a phone is about 5 px a level), below the 44 px touch rule; names vanish (shown only at 84 by 40 px and up); dragging is impossible. Picking from the list and the Move pad still work, so nothing is unreachable. Recommendation: a small follow-up PR (two fingers slide and zoom the map with the level view's `feed` rules, "Whole world" as a row under List), recorded as a follow-up, not added to this PR. |

## Red findings

### R1. A slow swipe or a pinch on empty ground makes new levels

- UNIT: `src/features/map/MapPart.svelte` (`down`, `hold`, `move`, the sheet's pointer handlers).
- VERDICT: red.
- REQUIREMENT: Task 30 "press and hold on empty ground uses `newLevel`" (a hold, not a drag); CLAUDE.md drunk-grandma
  test and touch first; the design's "Pinch and two fingers zoom" habit that a person brings from the level view.
- REASON: the hold timer on empty ground is only cleared on pointer up. The sheet has no `onpointermove`, and `move()`
  returns before `clearTimeout` when `press.level` is undefined; a second finger overwrites `press` without clearing the
  first finger's timer.
- EVIDENCE: probe on the links game in Chromium: a touch swipe of 160 px over 720 ms on empty ground took the map from
  3 levels to 4 (one history step); a two-finger pinch of the same length took it from 3 to 5 (two steps). Anyone who
  tries to slide or pinch the map (which they will, since the level view slides and zooms) gets one or two "New level"
  cards and new files.
- EXPECTED: a hold on empty ground makes a level only when the finger stays within `LITTLE` (8 px) for `HOLD_MS`, and
  only with one finger down; any movement past `LITTLE`, a second pointer, or a cancel clears the timer and makes
  nothing.
- FIX: in `MapPart.svelte`, follow the pointer on the sheet too (an `onpointermove` on the holder that clears the empty
  ground timer past `LITTLE`), clear the old timer when a second pointer comes down and treat two pointers as "not a
  hold". Add browser tests in `tests/features/map/map-arrange.browser.test.ts`: a slow swipe and a two-finger pinch on
  empty ground make no level; a still hold does (its opposite). Files: those two only.

### R2. What "Move apart" does is only in a hover tooltip, which a finger never sees

- UNIT: `src/features/map/LevelBar.svelte`.
- VERDICT: red.
- REQUIREMENT: Task 30 and the design: "Pull apart (only when it touches another, **with what that does**)"; mockup
  `world-map-menu.html` shows it as a small line under the item ("Move it away from Level 3, so players can't walk
  across"), as it does for Move ("A tile at a time, with arrows"). Touch first (iPad first).
- REASON: `pullAbout` and `moveAbout` are only `title=` attributes, shown on mouse hover after a delay and never on an
  iPad or phone; nothing on screen says that moving apart stops players walking across.
- EVIDENCE: `LevelBar.svelte`, the Move and Move apart buttons carry `title={text(words.moveAbout)}` and
  `title={text(words.pullAbout, …)}`; the journey pictures `map-wall-*`, `map-apart-*` show only the bare labels.
- EXPECTED: the sentence is visible on touch, where the mockup puts it: Go in, Move and Move apart with their small
  lines in the menu that press and hold (and the three dots) open, as `world-map-menu` draws, with the bar's buttons
  staying short. Moving the explanation into the menu also makes press and hold "open the same" as the mockup.
- FIX: `LevelBar.svelte` only (plus its rows in `words/arrange.ts` if a new row is needed), and an assertion in
  `map-arrange.browser.test.ts` that the "Move apart" sentence is in the page, not in a `title`, when room-3 is picked
  and absent for room-1.

### R3. Several Task 30 bullets have no browser test

- UNIT: `tests/features/map/map-arrange.browser.test.ts` (and `map-part.browser.test.ts` for the double tap).
- VERDICT: red.
- REQUIREMENT: Task 30 Step 1, "in the browser each bullet with its opposite"; Task 29, "'Go in', Enter or a double tap
  on a level opens it".
- REASON: these behaviours are built but no test fails if they break: press and hold on a level opens its menu (and a
  short press does not); press and hold on empty ground makes a level (and a tap clears the pick); a double tap goes in
  (and two taps far apart only pick); "Make a copy" adds a level with a note and Undo; the wall card's "Move <level> so
  the openings meet" and "Move them apart" ways (only `walls.test.ts` covers `meetOpenings` as a function; the card's
  buttons are never pressed in a browser).
- EVIDENCE: `grep -n -i "copy\|hold\|double\|data-way=\"move\"\|data-way=\"apart\"\|dblclick"` over the map browser
  tests and the journey finds none of these driven.
- EXPECTED: one browser test per bullet, each with its opposite, on the links game.
- FIX: tests only, in the two files named. If a test exposes a defect, fix it in the file it names, as its own finding.

### R4. The journey skips "push it back (joined), undo"

- UNIT: `tests/journeys/map.journey.test.ts`.
- VERDICT: red (low).
- REQUIREMENT: Task 30 Step 1's journey: "pull room-3 apart from room-2 (no join), push it back (joined), undo".
- REASON: the journey moves room-3 apart and then undoes the move apart; it never pushes room-3 back by dragging, so the
  drag that rejoins two levels is never driven in a real build at three sizes (only the browser test does it).
- EVIDENCE: lines 101 to 108: "Move apart", picture, `Control+z`, expect join.
- EXPECTED: after "Move apart", drag room-3 back against room-2 (joined, one more join), then Undo (apart again).
- FIX: that file only.

### R5. The pad test says it checks "one more tap would join" but does not

- UNIT: `tests/features/map/map-arrange.browser.test.ts`, "the pad moves the picked level a tile a tap, and says when one
  more tap would join".
- VERDICT: red (low).
- REQUIREMENT: Task 30, Move "the pad says in words when the next tap makes it touch" (design and `world-map-move`).
- REASON: the test only asserts the text "arrow keys", which both `padKeys` and `padNext` contain, so the "One more tap
  and Room 3 touches Room 2" line could vanish and the test still pass.
- EVIDENCE: the test body, `expect(box.textContent).toContain('arrow keys')`.
- EXPECTED: after Move apart then Move, nudge room-3 back until one tap is left and assert the `padNext` sentence names
  Room 3 and Room 2; one tap further it is gone (they join).
- FIX: that test only.

## Notes (recorded, not fixed here)

- N1. On a phone the wall card sits over the "New level" button (`placeCard` keeps clear the key, the bar and the two
  levels, not the button). Harmless while the card is open, since "Leave it for now" closes it.
- N2. The mockups `world-map-joined` and `world-map-apart` show a note with Undo after a join or a move apart; the build
  shows none after a drag, a nudge, Move apart or a wall's way out (Undo is in the top bar or toolbar). Delete, copy and
  rename do get the note.
- N3. Level names show only when the level is at least 84 by 40 px; with many levels none are named (see the pan and
  zoom follow-up above).
- N4. Arrow keys on a focused level move it at once, with no spoken line; a screen-reader user tabbing through the map
  can move a level without hearing it. Consider saying the landing words in the status line on a key nudge.
- N5. `World.svelte` import list has a stray indent (`        keepDrafts,`). Cosmetic.
- N6. After a wall's way out joins the pair, `card` stays `{ kind: 'wall' }` and an empty `.float` stays mounted until
  the next card; after Undo of a new level, `pickedLevel` can name a level that no longer exists. Neither shows.
- N7. The way back from the map to the level is "Go in", the pressed "Map" chip (iPad and computer) or the part menu's
  "Levels" row (phone). A pressed toggle as the way back is not obvious; a plain "Back to <level>" may read better. A
  product call, not a defect.
- N8. The wall card shows three ways when no slide can make the openings meet (`map-wall-*` pictures). That matches the
  rule "each one a single step" better than a dead button; the mockup always draws four.

## Drunk-grandma pass

The words are plain throughout (no banned word, the wall card says what is wrong and what each way does), buttons are 48
px, the key explains every mark, and the map opens with every level in sight at all three sizes (issue 3 fixed; the
Move card clears Room 2 and Room 3 at iPad sideways, issue 1 fixed). It fails in two places: sliding or pinching the map
silently makes levels (R1), and "Move apart" never says what it does on a touch screen (R2).
