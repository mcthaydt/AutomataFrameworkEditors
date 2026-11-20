# World plan PR 19 (Editors #128, first half): implementation audit, cycle 1

Commit examined: `e3a8dce5d537a5a60fb721883e9b0287bd9b2f5c` (head of `claude/project-thread-c709zh`; base `beb379b`, 30
files, 923 insertions, 78 deletions). Lane 2. Reviewer: a fresh session, Sonnet 5.5, medium. Written 2026-11-20 08:56 UTC.
Nothing on the pull request branch was touched. The branch is behind main (`39e5c84`, #130 landed since); see N1.

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the
spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or
incomplete integrations. Do your best work.

**Verdict: red. Six reds (R-1 to R-6 below); R-2 is walk fault R5, which the builder has already confirmed.**

## What ran, on `e3a8dce`, Chromium only (WebKit and Firefox are not installed in this container; not run)

- `pnpm typecheck`, `pnpm knip`, `pnpm test:node` (105 files, 1190 tests): exit 0. `pnpm lint`: exit 0, 1 warning and 3
  infos, all in files the PR does not touch (see item 7).
- `pnpm build:journeys` and `build:journeys-plain`, then the journeys: `play` 16 of 16; `draw-order`, `issue-pictures`,
  `turn-and-limits`, `first-run`, `settings`, `open-game`, `map`, `paint-and-pencil`, `pick-place-erase` all pass;
  `screens` 320 of 320 (five sizes × 64 scenes; the first run had five failures that were mine: the plain build
  `welcome-no-example` needs was not built; with it they pass).
- `pnpm test:engine chromium`: 198 of 199. The one failure is `draw.browser.test.ts` "with the hero, a coloured box is
  under the ground…", the flake #130 fixed on main (`39e5c84`); this branch does not have that fix (N1).
- Failing-first, checked by putting `beb379b`'s `src/` under the PR's tests in a scratch worktree and running them: the
  checks for items 2, 3, 4, 5, 6, 7, 12, 13, R2 and R4 each fail on the old source (list under each row). Items 8 and 9 and
  R1 were not run against old source (see rows).
- By hand, as a person, with Playwright on the built page at 390×844, 844×390, 834×1210 and 1210×834 with touch: Play at
  phone and phone sideways with a thing picked and with none; the settings sheet pulled up at phone and iPad upright;
  Play from here at phone sideways in Links Game Room 1; dragging the strip back and forth at iPad sideways. Pictures
  are in my scratch folder and are named where they carry a finding; they are not committed.

## The table

| # | Item | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Pulled-up settings sheet covers the toolbar (phone, iPad upright) | **RED** (R-1) | No code, no check. The body's "answer" is about the team sheet, a different thing. Still there: the toolbar (tools, Undo, Redo, Show) is not on screen when "Crate 1 · settings" is pulled up, at 390×844 and 834×1210. |
| 2 | Top-bar menu lies under the Show panel (phone) | pass | Journey "a menu opened from the top bar lies over the Show panel" fails on the old source at phone (a row under another panel), passes now. z-index 20/21/22 to 50/51/52 in `TopBar.svelte`; the dialogs and sheets are at 30 to 45 and are not meant to be open with the bar's menu. |
| 3 | Top-bar words 1 to 3 px outside their buttons | pass | New screens rule "a button's words sit inside it" fails on the old source at phone ("1 to check" is 19.0 px outside its button) and passes at all five sizes now. Fix: `flex: none` on the buttons, and the count as icon and number at phone with the full words as the spoken name and tooltip. |
| 4 | More menu beside the bar, scene added | pass | Scene `map-level-more` fails on the old source at phone, passes at five sizes. `LevelBar.svelte` renders the menu as the bar's sibling. |
| 5 | Clash-only sheet title | pass | The scene asserts no "Put 0…" heading and the title `The game’s version is kept`; fails on the old source at phone. |
| 6 | Wall marker 44 by 44 | pass | `map.journey` asserts ≥ 43.5 × 43.5; fails on the old source at three sizes, passes now. |
| 7 | Level bar placed by its new size after a language change, a rename, a font load | **partly** (N2) | Language only: the browser test fails on the old source (fr/es/en) and passes now. A rename and a font load are neither covered nor answered. |
| 8 | Blur rule samples more than the middle | pass (not run against old source) | The rule reads the middle and four quarter points; `screens` passes at five sizes. The body files this work under "8 and 3" next to the top bar's counts (N3). |
| 9 | Exact-copy pins for `changes.ts` and `team.ts` | pass | `team-copy.test.ts` pins every English row; it is built from the code's own words, so it guards a later reword, not the original wording (N4). Node tests pass. |
| 10 | Wrap the long `this-repo` line; one `marks.find` | **RED** (R-5), `marks.find` pass | The skill file now has two lines over 125 characters (153 and 197) where it had one before the edit; the long line moved, it was not wrapped. `Marks.svelte` has the one `marks.find` (hoisted to `pickedX`). The skill edit is named in the body. |
| 11 | What CI pictures vs what the journeys cover | pass | Said in the body: five sizes in the journeys, three profiles in CI. No workflow touched. |
| 12 | Hero in sight at Play start, phone and phone sideways | pass | See R3 below. |
| 13 | Speed kept through a door; the game held while Play from here waits | pass | The door journey now fails on the old source and passes now. |
| 14 | WebKit flake in `open-game.journey` | **RED** (R-3) | The cause is not shown; see R-3. |

| Walk fault | Verdict | Evidence |
| --- | --- | --- |
| R1 the tour has four steps | pass | `first-run` and `settings` journeys walk "Place" and "Play" steps and count "of 4" (Help). Not run against old source; the old card said "1 of 2" in the walk. |
| R2 tray covers the floor at phone sideways | pass | New journey "the tray at <size>" (Place and Paint, five sizes) fails on the old source at phone sideways, passes now. |
| R3 the play bar over the hero (phone sideways) | pass | Measured by hand with the hero's pixels counted with and without the bar: phone sideways, thing picked, box 700×262, bar 467×58 at the top left, hero at y 182 below it, 130 of 130 hero pixels seen; none picked, box 700×318, 266 of 266. At phone (bar 266×132, strip open, box 374×568 or 374×624) the hero is at y 338 or 357, below the bar, 320 of 320 pixels. The folded strip's button: `data-play="rewind"`, 48×48, aria-label and title both "Drag back to see it again". The new journeys fail on the old source at phone sideways (two cases). The two phone cases pass on the old source too: they do not discriminate (N5). The bar-hiding is gone from `draw-order.journey` and it passes. Not built, and not needed on these cases: the lead's "move the bar if the fold does not clear the hero". |
| R4 strip dragged half way back, then again | **RED** (R-4) | Going back and then further back works (range kept, hero moves, strip stays; fails on the old source). Going forward again does not; see R-4. The play.browser test's changed assertion (`max === middle` to `max > middle` and `value === middle`) is what R4 asks for, not a loosening: the old line asserted the very shrink R4 calls a fault. |
| R5 Play from here lands left of the tap (phone sideways) | **RED** (R-2) | Reproduced; see R-2. |

## Findings

UNIT: `src/features/world/` and the settings sheet at phone and iPad upright (`Panels.svelte`, `World.svelte` layout), brief item 1.
VERDICT: red (R-1).
REQUIREMENT: `pr19.md` item 1 ("fixed test first, or, if it is not a fault, said so in the pull request with the evidence").
REASON: the answer in the body is about a different sheet, and the fault is still there.
EVIDENCE: the body says "The team sheet replaces the toolbar until Done by design". Item 1 is the pulled-up settings sheet. At 390×844 and 834×1210, with Crate 1 picked and "Crate 1 · settings" opened, the screen shows the top bar, the level, the sheet and the arrow pad; the tool row (Select, Place, Paint, Erase, Join, the menu, Undo, Redo, Show) is not on screen (it is there with the sheet folded). Only "Done" brings it back. No journey or rule mentions it.
EXPECTED: either a check that the tools stay reachable with the sheet pulled up, failing first, and the fix; or the answer "by design" about this sheet, with why and with how the person gets to the tools (Done), and the lead's call that this meets the spec.
FIX: the lead decides which. If fixed: `Panels.svelte` / `World.svelte` layout and one screens rule; if answered: the pull request body only.

UNIT: Play from here, `PlayPart.svelte` and the play box's coordinates at phone sideways.
VERDICT: red (R-2) (the slice lead has confirmed it from the builder; evidence is mine).
REQUIREMENT: walk R5; spec, the play bar: the hero starts where you tap.
REASON: "not reproduced, guard journey kept" is wrong: it reproduces, and the guard cannot see it.
EVIDENCE: Links Game Room 1, 844×390, Play, Pause, "Play from here", a tap on the floor row at hero x plus d. Tap x to hero x: 215 to 365, 285 to 360, 325 to 385, 405 to 435, 445 to 460, 485 to 485, 525 to 510, 565 to 534. The shortfall grows with distance (about 0.7 of the tap's distance from the start) and crosses zero at d = 120. The guard taps 20% of the canvas (140 px) to the right of the hero: an error of about 8 px, under its 12 px limit, so it passes beside the fault.
EXPECTED: the hero starts under the finger at every distance.
FIX: map the tap with the play box's own offset and scale (`PlayPart.svelte`, the tap's mapping) and change the guard in `play.journey.test.ts` to tap at two or three distances on both sides of the start, at phone sideways and iPad sideways. Fix test first (it fails today at d = -80, 40 and 200).

UNIT: `tests/journeys/open-game.journey.test.ts`, brief item 14.
VERDICT: red (R-3), low.
REQUIREMENT: `pr19.md` item 14: "find the cause… fix it at the cause, test first; do not widen the cut-off excuse without showing the product is not at fault."
REASON: the stated cause is not shown, and in Chromium it is not true. No check fails first, and the engine that flaked cannot be run here.
EVIDENCE: the body says a second `goto` to the address the page is already on reloads it. I tried it in Chromium: after `signIn` the page is at `http://127.0.0.1:4800/#/game/grandma/links-game`; with a marker set on `window`, `goto` to that same address left the marker in place (no reload) and fired one `framenavigated` (a same-document move). `cut-off.ts` only excuses a cut-off call after a move that `framenavigated` reported, so a reload that WebKit does not report that way would explain the flake, but nothing here shows that is what WebKit does. The change removes a `goto`, which cannot make the test fail first.
EXPECTED: a cause with evidence from the engine that flaked (WebKit, repeated runs before and after), or the flake kept open in `history.md` with the cause marked unproven. The product is not shown to be at fault or clear.
FIX: run `open-game.journey` in WebKit 20 times on the old and the new test (CI or a Mac) and report the counts; until then change the line in the body from "the cause" to "the likely cause", and leave the "Flaky tests" entry open. Files: the pull request body, `docs/superpowers/history.md` (the lead's step).

UNIT: Play's strip, `PlayPart.svelte` `back()`.
VERDICT: red (R-4).
REQUIREMENT: walk R4: "dragging part way back puts the hero where it was at that moment; the strip stays, so you can drag again."
REASON: after one drag back, a drag forward (still inside the range the strip shows) leaves the hero where the first drag put it, and the thumb moves on without it.
EVIDENCE: iPad sideways, walk right 2.5 s, Pause, click the strip at 30%: hero x 416, thumb 47. Click at 60%: hero x 416 (did not move), thumb 96. Click at 90%: hero x 416, thumb 146. The thumb says the game is at 96 or 146 of 159; the game is at 47. Cause: `Math.min(Math.max(tick, kept.from), kept.to)` clamps forward drags to `kept.to`, which went back to the first tick. The PR's journey only drags further back.
EXPECTED: the thumb and the hero never disagree. Either the strip clamps the thumb to where the game is, or going forward inside the kept range works.
FIX: if the framework cannot keep the future once going back, clamp the thumb's value to the game's tick in `PlayPart.svelte` (shown range keeps its length, the thumb stays at the game's tick) and make the journey's second drag also go forward and assert the hero and thumb agree. If the lead says the cut is the spec, downgrade to a note and say so in the body.

UNIT: `.claude/skills/this-repo/SKILL.md`, brief item 10.
VERDICT: red (R-5), low.
REQUIREMENT: `pr19.md` item 10: wrap the long line PR 15 added.
REASON: the line was re-broken in the wrong places: two lines over 125 characters now, 153 and 197 (one before).
EVIDENCE: `awk 'length($0)>125' .claude/skills/this-repo/SKILL.md` gives 2 lines on `e3a8dce`, 1 on `beb379b`.
EXPECTED: no line of that list longer than the file's usual width (about 115).
FIX: reflow the "Nothing hidden from an agent" bullet only. File: `.claude/skills/this-repo/SKILL.md`. It is named in the body already.

UNIT: sleeps added to journeys.
VERDICT: red (R-6), low.
REQUIREMENT: the lead's brief point 5: no new sleep, no `waitForTimeout`; every wait on the level canvas's art or Play's first picture passes an explicit bound.
REASON: 10 `waitForTimeout` calls were added (the base has 13, the head has 23). Two are the time a key is held (`play.journey` 2200 and 2500 ms) and are the action, not a wait: fine. The other eight stand in for a readiness wait.
EVIDENCE: `play.journey` line 105 (300 ms, then the hero's pixels are read: if the picture is late, the read throws "shows no hero"; this is the "Flaky tests" pattern) and line 391 (800 ms after Play from here, then read); `turn-and-limits` lines 104 and 117 (300 ms after a resize and a viewport change, then asserts); `pick-place-erase` 102 (300 ms, then measures the tray); `issue-pictures` 67, 87, 100 (300 ms before a picture; the same habit the other journeys have before `picture()`).
EXPECTED: each waits for the state it needs (the hero's pixels present, the layout settled, a `requestAnimationFrame` pair, the tray's rect stable) with an explicit bound.
FIX: replace the five in `play.journey`, `turn-and-limits` and `pick-place-erase` with waits on the thing itself (`expect.poll` or `waitForFunction` with `timeout`); the three before pictures are a note. Files: those three journey files.

## Notes (not blocking; kept apart)

- N1: the branch is behind main by #130 (`39e5c84`), which gave `draw.browser.test.ts` its 15-second picture bound; the Chromium run on `e3a8dce` fails that one test for the reason #130 fixed. Merge main into the branch before the final CI, and read the "explicit bound" rule again after it: new waits on Play's first picture in the PR's journeys go through the existing `started()` helper (the 10-second context default, no explicit bound), as the older journeys do.
- N2: item 7 covers a language change only. Neither a rename of the picked level nor a font arriving is tested or answered; the body's "fonts' arrival is not waited for" line is the nearest. Say so in the body.
- N3: the body's numbering is off: "8 and 3" is the top-bar counts (item 3); item 8 (blur rule, commit `3855866`) is not named; R3 and R2 appear as "12" and "R2". A reader cannot map the list to the brief.
- N4: `team-copy.test.ts` pins the words the code has today. It guards a later reword; it cannot show that PR 16's wording was kept.
- N5: R3's journeys at phone pass on the old source (the bar was never over the hero there), and look only at the hero, not at "what is in front of it" (the crate); nothing asserts the folded button's name, tooltip or 48×48 (I measured: pass). `play.browser` uses `button('rewind')?.click()` in the one-step test, which passes silently if the button is missing. The fold's limit is `boxHeight < 320`; phone sideways's box is 318 high, a 2 px margin, and a larger phone on its side (a box 330 or more) gets the open strip back. Opening the strip does not hold the game still, as the sketch said (it pauses at the first drag).
- N6: issue pictures. 1: the card clears Room 2 and Room 3 as the plan says but it now sits over Room 1, the third room, which the picture shows cut off by the card. 2 and 3 show what the plan says. 4: the plan says "iPad upright: 'Where it is' in sight"; the journey and the picture are of the thing's menu (More) inside the level, with the settings sheet folded. Either the plan's words or the picture is out of date: the lead should say which is the owner's picture.
- N7 (item 7 of the brief, "reported as not fixed"): `pnpm lint` exits 0 here with 1 warning and 3 infos in `tests/workflows/gate.test.ts` and `session.test.ts` and `scripts/screens-touched.ts`, none touched by the PR (it changes no file of those); the same files are on main, and the previous audit (cycle 2 of PR 17) names the same four. CI's lint step passes on a warning and infos, so it is green and does not block this PR; keep it as a note for a tidy PR. The German and Russian level bars: this PR's change to `LevelBar.svelte` only moves the menu out of the bar and its `MapFloats.svelte` change adds `lang` to an effect; the bar's content is unchanged, so the width is on main as well. A note, but it is a gap against "every size"; it needs its own item.
- N8: item 12's lead call "decided once when Play starts" is not what the code does (`short` follows the live box height); no fault seen from it.

## Other checks

- Nothing is touched in `.github/workflows/`, `CLAUDE.md` or the shared skills; the one skill edit is the repo's own `this-repo`, named in the body (lane 1 alone, here with the code).
- Glass and icons: the new strip button is an icon with the spoken name and tooltip and a Phosphor icon; the top-bar counts are icon and number at phone with the words as the name; the More menu is glass-2 beside glass-1. The screens rules (glass, blur on five points, 44 by 44, no overlaps, words inside buttons) pass at five sizes on 64 scenes in Chromium. WebKit and Firefox, and a real iPad, are not run.
- Task 43: journeys for the spec's end-to-end list exist in the files above (first open; place, move, erase, each undone; paint; join; value at limits; the tour's third step; draw order; a heavier crate; the map's list; door; touch controls; put in game; send, ask, turn down, undo; offline in `save-problems`; problems first; two people; the visitor; the Pencil; turning the device and the keyboard in `turn-and-limits`). I did not read each one for "checks the opposite of every action"; I read the ones this PR adds or changes and `play`'s. The four issue pictures are made by `issue-pictures` and I read them (N6).

## Hand back

Fix R-1 to R-6 in the order R-2, R-4, R-1, R-3, R-5, R-6 (R-1 and R-3 need the lead's call first). A second cycle re-reads only the fix diff.
