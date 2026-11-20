# World plan PR 19 (Editors #128, first half): implementation audit, cycle 4

Range examined: `2b3e7958..34c63a533f86e4d6812d1db6b67b981822799b0f` (`2304cf0`, `6ecf8e1`, then a merge of main `ffa5fa2`).
Cycles 1 to 3: `742638d`, `fa07920`, `747f898`. Reviewer: a fresh session, Sonnet 5.5, medium. Chromium only.

**Verdict: pass. C3-1 is fixed.**

| Check | Verdict | Evidence |
| --- | --- | --- |
| The level file says 2.5 and 5.5 | pass | `tests/fixtures/links-game/links.ts`: the player start is `x: 2.5, y: 7.5` (line 28) and room 1's `crate-1` is `x: 5.5, y: 7.5` (line 102). |
| The scale is read as said, the bound is 0.75 of it | pass | `tilesOf` returns `(crate.x - hero.x) / 3` before any tap; the R5 journeys tap 10 tiles right of the hero and the poll accepts `abs(got - wanted) < 0.75` in tiles of that scale; the door journey taps `(12 - 5.5)` tiles from the crate with the same scale. I logged the scale: 22.0 px at phone sideways (canvas 700), 49.3 px at iPad sideways (canvas 818), as claimed. 0.75 tile is about 16 px at phone sideways; the true bound now. |
| It fails on the old `PlayPart` for the right reason | pass | With `PlayPart.svelte` and `spot.ts` from `e3a8dce` (levelAt pin kept) and the new journeys: 2 fail ("the hero is at tile 10.6, the mouse was at tile 12.5", the same by touch), 3 of the 5 pass (iPad sideways, where the old mapping was right). With the fix: 18 of 18 in `play.journey`. |
| Nothing else in the file is loosened | pass | The diff of `play.journey.test.ts` only: `whereIs` returns `left`, `right`, `canvas` instead of `wide`; the two crate checks read `canvas` (same value as the old `wide`, so same bound); the door and R5 journeys take their scale from the hero and crate. No sleep, skip, retry or wider bound added. |
| The merge is only main's commits | pass | The range's other files are main's #137 (the approve journey's wait) only; the pull request's own diff against main in `.github`, `CLAUDE.md` and `.claude` is still the this-repo skill wrap alone. |

Note: the hero and the crate are read by the centre of their colour's pixels; a hero partly hidden or a crate pushed before the read would skew the scale. Both are read before any tap with the bar hidden, and the journeys pass.
