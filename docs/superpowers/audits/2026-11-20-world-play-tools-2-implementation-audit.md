# World play tools (Task 42, PR #123): implementation audit, cycle 2

Fix commit examined: `ff6b24557f401808e4116299e05129fc7a19e501`, range `870feae..ff6b245` (3 test files, no source). Cycle 1 audit: `2026-11-20-world-play-tools-1-implementation-audit.md`.

**Verdict: pass. No red.**

| Finding | Result | Evidence |
| --- | --- | --- |
| R1 | fixed | `world-play` asserts `There is no tileset called "nowhere"` (the sentence measured in cycle 1). The door test asserts no `.json` or `[n]` in the lines and no canvas. |
| R2 | fixed | The door journey waits for `Levels · Room 2` inside `[data-bar]` (the top bar, `TopBar.svelte:205`); the text matches the cycle 1 screenshot. |
| N1 | fixed | Bound is `light * 0.7` (measured 0.674) and the title says what it asserts. |

Ran on `ff6b245` (Chromium): 190 browser tests pass, `play` journeys 8 of 8 pass, lint has 1 warning and 3 infos in `scripts/screens-touched.ts` that are also on `870feae` (not this range). WebKit and Firefox still not run here.

Small remainder (note): the `[0]` check in the `world-play` test is still vacuous for a missing tileset (it has no `[0]`); the full sentence is asserted now, so it is harmless. The door test's no-`.json` check reads `lines`, which are the framework's messages only, so it holds by construction; it guards a future change, not a present leak.

Notes N2 to N7 left to the builder: unchanged and still notes. For routing to PR 19: N3 (speed back to Normal after a door) is something a person can trip on only if they chose Slow and then walk through a door; low. N4 (the game runs while "Play from here" waits for a tap) is unlikely to trip anyone, since the tap restarts the level anyway; low.
