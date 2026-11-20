# World plan PR 19 (Editors #128, first half): implementation audit, cycle 2

Range examined: `e3a8dce..bcf2fa6b132b86bacd5c757c343c03a900b2b0c7` on `claude/project-thread-c709zh` (fixes at `f3470a90`,
R5 at `a081175b`, main merged at `bcf2fa6b`). Cycle 1: `2026-11-20-world-19-1-implementation-audit.md` (`742638d`).
Lane 2. Reviewer: a fresh session, Sonnet 5.5, medium. Chromium only (WebKit and Firefox are not installed here).

**Verdict: one red (C2-1, low). Everything else of cycle 1 is fixed or honestly answered.**

## What ran on `bcf2fa6`

`pnpm typecheck`, `pnpm knip`: exit 0. `pnpm lint`: exit 0 (1 warning, 3 infos, the same untouched files as cycle 1).
`pnpm test:node`: pass. All journeys (`vitest --project journeys`): 26 files, 590 of 590, with both builds. `pnpm test:engine
chromium`: 23 files, 199 of 199 (the cycle 1 failure was the missing #130 fix; main is merged now). By hand at phone
sideways, iPad sideways, phone, iPad upright and computer, by mouse and by touch: Play from here in Links Room 1, five
taps each (below). Nothing in `.github/`, `CLAUDE.md` or the shared skills differs from main (`git diff 016ab6f HEAD --
.github CLAUDE.md .claude` shows only the repo's own `this-repo` skill, named in the body).

## Per item

| Item | Verdict | Evidence |
| --- | --- | --- |
| R-1 item 1 | **partly: C2-1** | The lead's call is applied: scene `level-settings-pulled-up`, a rule for the named way back (the pulled-up sheet's Done must have words and be on screen) and the overlap rule's exemption. I saw the resting height at phone and iPad upright: tools, Undo and Show in sight; pulled up, "Done" named and in sight. The tools half of the rule checks nothing (C2-1). The body states the answer under item 1. |
| R-2 / R5 | **pass** | Fixed, and the cycle 1 table now holds. Tap-to-hero error (px, tap at hero x plus 60, 120, 200): phone sideways -7, 0, 7; iPad sideways 0, -9, 0; phone -6, -1, -10; iPad upright 0, -7, 0; computer 0, -13, 0. Identical by mouse and by touch. A tap left of the hero where there is no level (phone sizes) keeps waiting (`levelAt` undefined), as the body says; on the larger windows the same taps start the hero at its own start. The journey fails on the old `PlayPart`/`spot.ts` (kept the new pin): "the hero is at tile 10.6, the mouse was at tile 12.0", mouse and touch. The pin range `b10ffe6..2cbd6d0` in the framework is only #222 (`c00e8fd` Game.levelAt with its browser test and api report, `3dbcbfa` live state removed, the merge): `game.ts`, `render.ts`, `stage.ts`, `framework.api.md`, README, one test file. `spotOf` and its three tests are gone with the helper (nothing uses them). |
| R-3 item 14 | pass | The body claims no fix, calls the cause "likely", says Chromium does not reload, and leaves the flake open. The `goto` removal is a harmless tidy-up. The lead puts the text in `history.md`. |
| R-4 | pass, with a deviation (N1) | The forward drag now leaves the thumb with the game (`oninput` puts it back to `strip.at`); the journey drags back, back further, and forward, and asserts the thumb and hero do not move. |
| R-5 item 10 | pass | No line of `this-repo/SKILL.md` is over 125 characters (was 2). |
| R-6 sleeps | pass | `git diff e3a8dce HEAD -- tests` adds no `waitForTimeout`; the 8 are replaced by `settled()` (fonts ready plus two frames), polls with 5 and 10 second bounds, and a stable-rectangle poll. What remains are the key holds (2200 and 2500 ms), the map's and games' older sleeps, and the 500 ms I did not touch. No `.skip`, no retry. |
| Notes: issue 4 | pass | The picture shows "Where it is" in sight on iPad upright with a list used in the settings, and the journey asserts it. |
| Notes: issue 1 | not fixed, said | The Move card still sits over Room 1; the body says why. See N3. |
| Notes: body numbering, item 7 | pass | The body follows the brief's numbers, and says language has a test, rename and font none. |
| The door journey | correct change (N2) | It runs at iPad sideways only, where the level fills the canvas width, so the new tap lands on the same tile as before. It is not looser. |
| The merge | pass | `World.svelte` keeps main's `checking` layout and the builder's `playSpeed`, `onspeed` and the tool and played guide events (`guide?.happen` is skipped while someone's change is open, which main's early return implies). `approve.journey` ("1 to check", the sheet, ask for a change, put in, turn down) passes at its sizes in the 590. |

## Findings

UNIT: `tests/journeys/screens.journey.test.ts`, the settings rule (item 1).
VERDICT: red (C2-1), low.
REQUIREMENT: the lead's call on item 1: at resting height the tools and Undo are in sight; the body: "a screens rule checks exactly that".
REASON: the resting-height half of the rule can never fail.
EVIDENCE: the tools are picked with `[data-tour] button, nav.rail button`. I ran that selector at phone and iPad upright with Crate 1 picked and the settings folded: it finds no element (`tools: []`), and the Move bar (`[role="toolbar"][aria-label]`, "What to do with it") is present, so the guard `toolbar === null && tools.length === 0` is false and the loop has nothing to check. Only the Done half works (the body shows it fails with Done unnamed).
EXPECTED: the rule finds the tool buttons (Select, Place, Paint, Erase, Join, Undo) by their names and fails when one is out of sight or covered at rest.
FIX: select by role and name (`getByRole`-equivalent: `button[aria-label="Undo"]`, `"Select"` and the others inside the tool row) in the rule, and show it fail once by hiding the row. File: `tests/journeys/screens.journey.test.ts` only.

## Notes

- N1: the lead's call for R-4 was that a forward drag inside the kept range moves the hero forward. The builder pinned the thumb to the game instead (my cycle 1 FIX allowed either). It holds, and the body says why (the framework forgets what came after a put-back). The journey's "the hero did not move" uses `toBeCloseTo(x, -1)`, a 5 px tolerance. Say if the lead wants the other behaviour.
- N2: `whereIs`'s `wide` is the canvas box's width, not the ground's extent as the comments and the body say. At phone sideways the level is half the canvas (350 of 700 px), so the R5 journeys' "tiles" are twice too large and their 0.75 tolerance is about 33 px of picture, against the 13 px I measured. They still fail on the old code (10.6 against 12.0), so they guard the fault; a tighter, true scale would be better (the ground's real pixel extent).
- N3: the issue-1 card over Room 1 is a design call for the lead and the owner: no place beside the level exists on iPad sideways.
