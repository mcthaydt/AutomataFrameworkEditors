# World plan PR 19 (Editors #128, first half): implementation audit, cycle 3

Range examined: `bcf2fa6b..2b3e79582b79ac3fe4eeeb3da890847808c92adc` on `claude/project-thread-c709zh` (the C2-1 fix at
`2b3e795` and a merge of main, `8a5ec44`). Cycles 1 and 2: `...-19-1-...` (`742638d`) and `...-19-2-...` (`fa07920`).
Reviewer: a fresh session, Sonnet 5.5, medium. Chromium only.

**Verdict: one red (C3-1, low): the R5 journeys' scale is still the canvas width, which the builder's reply denies.**

| Check | Verdict | Evidence |
| --- | --- | --- |
| 1. C2-1: the settings rule can fail on its tools half | pass | The rule now takes `button.tool` and fails when none is in sight, with the old toolbar-present escape and the name regex removed (the only other change in the test file: nothing). I ran the scene `level-thing-picked` (the resting height) on `2b3e795`: passes at five sizes. With `button.tool{display:none}` put in `Toolbar.svelte`: 3 of 5 sizes (the ones that fold) fail with "the tools are not in sight with the settings folded". Restored afterwards. A note: `opacity:0` on the tools does not fail it (`seen` does not read opacity); the covered-by-something half (the `elementFromPoint` loop) is unchanged, and I could not exercise it with a page-wide cover, which blocks the scene's own clicks. No tolerance, skip or sleep added. |
| 2. "tile" from the canvas width or the ground's extent | **RED (C3-1)** | `play.journey.test.ts` line 76: `wide: box.width`, where `box` is the game canvas's bounding box (line 44). The R5 journeys read `ground.wide / 16` for the scale, and the door journey the same. So it is the canvas width. The builder's "ground's extent" is not what the helper returns: at phone sideways the canvas is 700 px and the level 350, so a "tile" is 43.75 px where the picture's is about 22. |
| 3. The merge of main is clean | pass | `git diff origin/main 2b3e795 -- .github CLAUDE.md .claude` shows only `.claude/skills/this-repo/SKILL.md`, the pull request's own wrap, named in the body. `.github/workflows/ci.yml` equals main (the `ci.yml` and `ci.test.ts` lines in the range are main's #135). Besides the fix, the range is main's commits (#135, #136) only; it also carries my cycle 1 audit file from #136. |

## Finding

UNIT: `tests/journeys/play.journey.test.ts`, `whereIs` and the R5 and door journeys.
VERDICT: red (C3-1), low (the lead's rule: "if it is the canvas width, that is a red").
REQUIREMENT: the cycle 2 note N2; the journey's own comments ("the ground's extent is the picture's scale").
REASON: `wide` is the canvas width, so "tile" and the 0.75 tolerance are in the wrong unit at any size where the level is narrower than the canvas.
EVIDENCE: line 76 above; at phone sideways 700 against 350 px; the 0.75 "tile" tolerance is then about 33 px, against 13 px measured in cycle 2. It still fails on the old code (tile 10.6 against 12.0), so the fault is guarded, only loosely. At iPad sideways (the door journey's size) the level fills the canvas, so the two agree there.
EXPECTED: `wide` is the ground's own pixel width (from the first to the last ground pixel of the row), or the comments and body say canvas width and the tolerance is set in pixels.
FIX: return the ground's extent from `whereIs` (min and max x of the matched pixels) and use it for `scale` and `left` in the two R5 journeys and the door journey; or measure in pixels. File: `tests/journeys/play.journey.test.ts` only.
