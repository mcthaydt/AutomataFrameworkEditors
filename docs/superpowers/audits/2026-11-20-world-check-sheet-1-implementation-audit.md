# Implementation audit: "1 to check" as a sheet over the level (Editors #129), cycle 1

Examined: pull request #129, branch `claude/project-thread-gva08e`, head `0303b2c2d3cbc09c016a5e10fe3591e0d0bcfa4d` (code last changed in `9d6f8fb`), against main `beb379b`. Reviewer: fresh session, Sonnet 5.5, medium. Nothing on the pull request branch was touched.

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete integrations. Do your best work.

## Verdict

No red that blocks the merge by the brief's own criteria; one red on a leftover card (R1) that the owner will see at three sizes; four notes. Every action of checking a change works from the sheet at all five sizes.

## What ran, on 0303b2c

- `pnpm lint`, `pnpm knip`, `pnpm typecheck`: clean.
- Journeys, Chromium, whole files: `approve` 22 of 22 pass; `screens` + `visitor` 320 pass, 6 fail, all six are the "no sample game" Welcome check (`welcome-no-example` at 5 sizes, and the visitor test). See criterion 5.
- The new step on main `beb379b` (worktree, the branch's `approve.journey.test.ts` copied in): both new tests fail at "dialog named Waiting changes to be visible", because main shows the old full page. The right reason.
- A scratch walk (not committed) of grandpa with kid's suggestion waiting, at phone, phone sideways, iPad upright, iPad sideways and computer: made an own edit, opened "1 to check", Not now, reopened, opened the change, measured, Play them, Stop playing, Ask for a change, Don't put them in, Undo, Put them in, opened by address. Pictures in my scratchpad only; the builder's five-size pictures in `/mnt/project-files/screens/walk-check-sheet/` agree with what I saw.

## Criteria, one by one

1. **Sheet over the level, spec "Checking someone's changes".** PASS. List sheet (`dialog` "Waiting changes", glass over a blurred level and top bar) and one-change sheet ("kid sent 1 change to check") with Play, Put them in, Ask for a change, Don't put them in; the changed things are ringed (`data-marked` = ""), the changed level (`data-x` 8.5) is drawn, the top bar stays. "The game's problems first" and "several waiting are listed first": the list is first; problems are Check's own and were not changed by this diff (not re-walked, see N4).
2. **Every action still works.** PASS at all five sizes: Play (sheet gives way to the level and a "Stop playing" button; after stop the sheet is back, level 8.5), Ask (words, Send to kid, Back), Don't put them in (turned-down sheet, pull `closed`), the sheet's Undo (pull `open` again, buttons back), Put them in (heading "In the game", pull `merged`), open by address (`#/game/grandma/crate-game/waiting/1` and `.../level/level-1/waiting/1` both open the sheet). No console or page problems (`problems()` empty).
3. **The sheet never covers the ringed change.** PASS at five sizes, measured: phone crate y 272 to 316, sheet from y 431; phone sideways crate x 256 to 300, sheet from x 532; iPad upright crate x 253 to 297, sheet from x 526; iPad sideways crate x 605 to 680, sheet from x 802; computer crate x 640 to 719, sheet from x 872. The page does not scroll (scrollHeight = innerHeight at all five).
4. **Glass, layers, icons.** PASS with notes. Both sheets are `glass-2` (`rgba(30,30,30,.76)`, `blur(24px) brightness(.4) saturate(1.3)`), the list sits on `scrim dim-2`; no own panel colour in the diff (`Waiting.svelte` row uses `--line`, `--hover`, `--words`, `--g-quiet`). Close button: `aria-label` and `title` "Not now", 44 to 46 by 44. Action buttons 44 to 48 high. Plain words. It reads as glass over the level at iPad and computer; at phone sideways and iPad upright the part of the sheet over the empty page reads as a solid dark panel, which is what glass over nothing is (N3).
5. **Changed assertions.** PASS, each is explained by the spec's sheet: `openFirstChange`/`openWaiting` heading level 1 becomes dialog named the same, plus waiting for the list to detach; the Undo click moves to the dialog because the top bar now has its own Undo on screen. Nothing loosened: the old reads of the crate and of the change's line are kept and the new step is stricter (dialog, top bar, ringed, not covered).
6. **`World.svelte` 579 to 574, `route.ts` working, address works.** PASS (574 lines, measured).

## Red

UNIT: `src/features/world/World.svelte` (Events card under the check sheet), `src/features/team/Check.svelte`.
VERDICT: red.
REQUIREMENT: brief 3 and the drunk-grandma test: the sheet must read as clear glass with plain words; nothing half-hidden bleeds through.
REASON: the "Someone made a change for you to look at. Open it to approve it or turn it down. Got it" card is still up when a change is checked, and it shows as cut-off text beside and through the sheet.
EVIDENCE: grandpa opens the game with a change waiting, does not press "Got it", then opens the change. At iPad upright the strip "n i" shows at x 510 to 525, y 98, with a faint card edge at y 190; at phone sideways the same "n i" at x 517, y 88, right beside the sheet's first lines (builder's own pictures `ipadUpright-check-sheet.png` and `phoneSideways-check-sheet.png` show it too). After closing the sheet the card is still there (`events` count 1), so it is the same card, not a new one. At computer and phone it is hidden behind the level.
EXPECTED: no part of that card is visible while the change's sheet is open (it is about this very change), and it does not come back after the person has opened the change.
FIX: in `World.svelte` hold the events back while `checking` (the `Events` component already takes `low`; or pass an empty list, or end the card when its change is opened). Journey: the card's text is not visible while the dialog is open. Only `World.svelte`, `Events.svelte` if needed, and the journey file may change. World.svelte must stay under 600 lines.

## Notes (not blocking, kept apart)

N1. Top bar "Send to check" / Undo / Redo stay live over someone else's change. Grandpa had an own unsaved edit (crate moved to 5.5); while he checks kid's change (crate at 8.5) the top bar still offers "Send to check, 1 change, only on this computer", and the top bar's Undo would undo his own edit that is not on screen. Two put-like buttons ("Send to check" and "Put them in the game") at once is easy to misread. Suggest the top bar's put and Undo/Redo are quiet or off while a change is open, or say so in a follow-up for the owner. The brief says the top bar stays, so this is a design question, not a defect.
N2. "Not now" on the one-change sheet goes to the list of waiting changes (`onclose={onback}` in `Check.svelte`, lines 234 to 235), not to the level; the list is then a second "Not now". The old page's Back did the same, and the spec's "Not now leaves it" can be read either way. With one change waiting it is two taps to leave. Owner's call; suggest closing to the level when only one is waiting.
N3. Phone sideways: the one-change sheet is 318 high in a 390 window; the text under the title is clipped and scrolls (title wraps to two lines). All four buttons stay reachable. Fine, but the owner may want the title shorter there.
N4. The game's problems on the change are Check's own and this diff did not touch them; I did not re-walk them (the fixture change has no problem). The existing journeys that cover them (`approve`, `screens`) pass.
N5. While a change is open, the editor's level is not drawn (`!checking` in `World.svelte`); it is drawn again after, with the own edit kept (x 5.5) and the tool and panels back, but the camera and the picked thing are the level's own at remount (the picked thing was not selected in my walk, so I could not prove it was kept). Worth a journey that picks a thing, opens a change, closes it and still has the thing picked. Not blocking: I could not make it fail.

## Criterion 5 of the brief: `visitor.journey` "no sample game > Welcome has one primary Button"

It fails locally on main `beb379b` and on the branch the same way ("heading Automata Editors level 1 not visible"), and `screens.journey` `welcome-no-example` fails with it. It passes in CI: CI on main commit `8dccec5` (run 44689384025), chromium 4/6 to 6/6, shows `tests/journeys/visitor.journey.test.ts (11 tests)` green. So it is a failure of this container only. The CI of `beb379b` (docs merge) is red on a different thing: `tests/features/levels/draw.browser.test.ts` "with the hero, a coloured box is under the ground" (expected `#3b4a5a` to be `#6b4f2a`) in chromium 1/6 and the chromium engine job; it is not in this pull request's files. CI for `0303b2c` had not started (queued) when I looked.

## Follow-ups

None for this pull request other than the notes above. Fix round: R1 only, by the original implementer; I re-read just that diff.
