# World design round 1 fixes: lane 2 implementation audit, cycle 2

**a4dd115 PASS**

Pull request #145 (draft), branch `claude/project-thread-c709zh`, head `a4dd115` examined: the commits since `2b49c2c`
(cycle 1's commit, now stale), `cdec475` to `a4dd115`. Lane 2: it touches `src/features/words/` and
`src/features/game/`. What they fix: the two reds of `2026-11-21-world-round-1-fixes-1-implementation-audit.md` and
the seven reds of `2026-11-21-slice-3-design-review-round-2.md` (A1, A2/R1, A10/R14, A18, R3, N1, N2). Rules:
`CLAUDE.md`, `review`, `build`, `this-repo` as merged on `main`. The look itself is left to the owner's first look; this
audit flags only code-level look problems. Written 2026-11-21 12:27 UTC.

> Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the
> spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or
> incomplete integrations. Do your best work.

## What ran (Chromium, in a cloud container, Node 24)

| Check | Commit | Result |
| --- | --- | --- |
| R3 and N1 journey checks (`approve.journey`, the head's file, filtered to "quicker" and "asks kid for a change") | `2b49c2c` with the head's test file | 2 of 2 fail at the new lines: `expected 1 to be +0` (the "waiting for approval" note, the waiting tip) |
| The same two | `a4dd115` | pass (in the run below) |
| `approve`, `problems`, `open-game` journeys whole | `a4dd115` | 51 of 51 |
| The strict top-bar rule (the screens journey of `44a1dac`, at iPad upright and phone sideways) | `1d4e4db` (the commit before the A2/R1 fix) | 32 of 130 fail: "the bar cuts "Crate Game"", "Levels · Level 1", "Levels · Map", "Links Game", in `level-unsaved`, `problem-strip`, `waiting-change-as-approver`, the put and send sheets and 13 more scenes |
| The screens journey at iPad upright and phone sideways | `a4dd115` | 130 of 130 |
| `pnpm vitest run --project chromium` (every browser test) | `a4dd115` | 199 of 199 |
| `pnpm test:node` | `a4dd115` | 1198 of 1198 |
| `pnpm typecheck`, `pnpm lint`, `pnpm knip` | `a4dd115` | clean (lint's one warning is `main`'s) |
| CI, newest full run on the head | `a4dd115` | run 44902325846: `gate` success; `check`, `mockups`, `screens`, all 18 `browsers` shards (Chromium, WebKit, Firefox 1 to 6 of 6) and the three `engines` success. The draft run 44902302578 on the same commit was cancelled by the full run (its red `quick engines` and `quick gate` are the cancel, as `project-state` notes) |
| A18's tag, measured from the head's `ipadUpright-world-with-changes-waiting` picture | `a4dd115` | "How heavy 1" unpicked: (168,168,168) on (37,32,25), 6.80:1 (round 2 measured 3.70:1) |

Not run here: the screens journey at phone, iPad sideways and computer, the other journeys, WebKit and Firefox (CI's full
run ran all of them, green), and `verify` (see note 1).

## Each red, in the code

| Red | Fix | Holds |
| --- | --- | --- |
| Cycle 1, red 1 (topbar test) | `cdec475`: the test presses "Level 1" on a phone and still checks the one menu | yes; 199 of 199 |
| Cycle 1, red 2 (body) | the body's "Tests changed" now names `issue-pictures.journey` and `topbar.browser.test.ts` with their reasons | yes |
| A1 fix card on the rooms | `MapFloats.svelte`: while a problem is shown the card keeps off the strip and every room's rect; on a short screen (`max-height: 500px`) it folds and `ProblemStrip.svelte`'s "Ways to fix it" (wrench, nine languages) opens it from the foot (`fold.svelte.ts`). The card drops its sentence while the strip says it (`WallCard.svelte` `said`) | yes; new `problems.journey` test at phone sideways (card folded, opened, Clear mends the wall) passes |
| A2/R1 top bar cuts names | `TopBar.svelte`: at squeeze 2 every word beside an icon goes (main button, "N to check", "N problems", each keeping its spoken name and tooltip), at 3 the part drops "Levels · "; `cut` measures against `.look`, not the window (`a4dd115`). The screens rule is now strict for every status | yes; red on `1d4e4db`, green on head (table above) |
| A10/R14 ids in problems | `problems.ts` `withNames` writes each of the game's level ids, and any quoted id, as `nameOf` says it; a wall problem carries its two levels and `sayProblem` gives the map card's own `wallBody`. Used in `Problems`, `ProblemStrip` (via `Changes`), `PutSheet`, `Check` and Play's cannot-play lines (`PlayPart`) | yes; unit tests for both, `problems.test`, `world-play.browser` and `open-game.journey` now expect "Room 2" / "Room 9" |
| A18 unpicked tag faint | `Tags.svelte`: no opacity; the unpicked tag uses `--quiet`, which on `glass-1` is `--glass-quiet` #a8a8a8 | yes; 6.80:1 measured |
| R3 two notes | `begin.ts`: no "waiting for approval" note while the change is asked about | yes; red on `2b49c2c`, green on head |
| N1 tip under "Not waiting any more" | `World.svelte`: the `tip-approve` tip shows only while `toCheck > 0` | yes; red on `2b49c2c`, green on head |
| N2 folded strip's words in the time | `PlayBar.svelte`: folded, the strip hides its name and keeps slider and time | yes in code; the look is the owner's |

## What else was checked and holds

- **Scope.** 27 code and test files changed since `2b49c2c` (plus the two audit files); each traces to one of the nine
  reds. No workflow, rules file, shared skill, `package.json` or lock file changed. Lane 2 is right.
- **Changed tests.** `topbar.browser`, `problems.test`, `world-play.browser`, `approve.journey`, `open-game.journey`,
  `problems.journey` and `screens.journey` changed; none is weaker. The screens rule is stricter (the old "only while
  other words show" escape is gone). Each is named in the body with its reason (see note 2 for one placement).
- **Code.** No file over 600 lines (`TopBar.svelte` 571). `game` imports `nameOf` from `words`, and `team` imports
  `wallFold` from `map`: both point down `LAYERS`, and the architecture test passes in `test:node`. The new word is in all
  nine languages. Comments say why. Commits authored and committed by McThayDT, no Claude trailers. The body starts with
  the project attribution and ends with "Requested by **McThayDT**".

## Notes (not blocking; for the coordinator, not fixed here)

1. `verify` was last run for round 1 (at `881275f`); the body says so. Round 2 changes the product (the bar, the fold,
   problem words), so `CLAUDE.md`'s "run like a person through `verify` before it is called done" still applies before
   merge. The journeys drive every changed screen, so this is a step to run, not a defect found.
2. `open-game.journey`'s change ("room-9" to "Room 9") is named with its reason under "What ran", not under "Tests
   changed"; `world-play.browser`'s round 2 change ("Room 2") is covered only by the round 1 line "follow the new words".
   A one-line body edit would keep the list whole.
3. `withNames` also renames any quoted lower-case hyphenated word that is not a level ("cave-tiles" would read
   "Cave Tiles"). Right for a missing level, as `"room-9"` shows; for a missing tileset or thing it is a guess at a
   name. The framework's current sentences only quote level ids, so nothing wrong shows today.
4. `WALL` reads the framework's English sentence by pattern. If the framework rewords it, the wall problem falls back
   to the named framework sentence (still with names), so it degrades safely; `problems.test` would catch the change.
5. `Changes.svelte` words the wall with its own `typeof said === 'function'` check, where `Check`, `Problems` and
   `PutSheet` use their `text` helper: same result, two styles.
6. While the folded card is open it sits over the strip, and the card drops its sentence (`said` is false whenever the
   strip shows), so on a sideways phone the open sheet shows the title "Players would walk into a wall" and the ways,
   not the sentence naming the two rooms. The ways name the room, so it reads; the owner's look may want the sentence.
7. `wallFold`, like `ui/noted.svelte.ts`, is module-level state shared by every suite on a page (cycle 1's note 3).
8. `World.svelte` drops one blank line unrelated to N1.

## Verdict

a4dd115 PASS
