# World canvas fix (blind judge), lane 2 implementation audit, cycle 1

**Verdict: 9ed5847 PASS.** No red findings; four notes, none blocking.

- Pull request: AutomataFrameworkEditors #146, branch `claude/world-blind-judge-fix`, head 9ed5847, base `main` 0ad6a63
  (the merge of #145, whose head was a4dd115).
- Brief: `/mnt/project-files/briefs/fix-world-blind-judge-gap.md` (six items drawn by the editor; no new art).
- Reviewer: a fresh session, which changed nothing but this file. Model: Opus 5.5 (the project's default for threads),
  not the brief's Sonnet 5.5, because the coordinator cannot set a thread's model. Effort: medium. The look itself was
  left to the design check running beside this review.

## What ran (this container, Node 24.22.3, Chromium)

| Check | Result |
| --- | --- |
| The three new canvas tests on head (`level-canvas.browser.test.ts`, `draw.browser.test.ts`, Chromium) | 20 of 20 pass |
| The same files with `level-canvas.ts` put back to 0ad6a63 | 3 fail, 17 pass. The 3 that fail are the 3 new tests ("beyond the level is the page ground", "the tile grid is faint", "a coloured box has a light top and a shaded foot") |
| The room-menu journey (head's `map.journey.test.ts`) on a suite built from 0ad6a63 | 3 of 3 fail (phoneSideways, phone, computer) at "the toolbar is hidden" |
| The same with that first assertion taken out, to see the pair-6 fault itself | 3 of 3 still fail, on "the menu covers New level" and on "the bar comes back after Escape" |
| The whole `map.journey.test.ts` on a suite built from head | 12 of 12 pass |
| How far a grid line is from the sky (a probe printed inside the canvas test, not committed) | `#99cae6` on `#9fd3f0`, at most 10 per channel |
| The newest full CI run on 9ed5847 (run 44910900038: check, mockups, 18 browser pieces over Chromium, WebKit and Firefox, engines x3, screens, gate) | all success; `gate` success at 13:59:18 UTC. The earlier red `gate` (run 44910894571) is the cancelled draft run, red by design |

Lint, knip, typecheck and `pnpm test:node` were not run again here: CI's `check` job on 9ed5847 passed them.

## The six items

1. **Room menu** (`map/LevelBar.svelte`): while the menu is open the bar is `visibility: hidden`, so there is one menu;
   the menu is placed under `TOP_ROOM` and inside the sheet, gets a `max-height` and its own scroll with a foot fade;
   a tap outside or Escape closes it. Journey red first and green after (above). Done.
2. **Dead strip** (`world/insets.ts`, `World.svelte`, `levels/LevelPart.svelte`, `Floats.svelte`, `MiniMap.svelte`):
   the box no longer reserves the settings side; the panel's room is `aside`, and `wholeLevel` fits the level in
   what is left, centred, with a 12 px frame. With nothing picked, `lay.settings` gives no side, so the level centres
   in the whole box. The floats and the small map move clear of a panel over the stage. Play keeps the old, steady box.
   Done.
3. **Faint grid** (`level-canvas.ts`, `show.ts`): `Tiles` is drawn before the things and the ground at alpha 0.1/0.12,
   dark on a light sky and light on a dark one; it is the new default; Off hides it; Play and the read-only previews
   (`Stage.svelte`, used by the team sheets) draw `grid: 'off'`. Done (see note 1 on the call).
4. **Outside the level**: the renderer's background is `--ground`, and the sky is drawn as its own box with a `--line`
   edge. Done.
5. **Labels**: the tags were already `glass-1`; they now have 8 px rounding, 13/18 px words and the map names' padding.
   Done.
6. **Stand-in boxes**: a light band on top and a shade at the foot (alpha 0.22 of the box), a firmer edge; the sprite
   path for a thing with a picture is unchanged and the new test checks a figure is drawn whole at top, middle and foot.
   Done.

## The changed tests, each justified

- `tests/features/world/insets.test.ts`: the contract changed on purpose (the box no longer takes the settings side;
  `aside` carries it). Every old case is kept with the new field, and a case for "nothing picked" is added. Not a
  loosening.
- `screens.journey` panel-distance rule: it now measures the level as drawn (`data-drawn`) instead of the stage box,
  which now runs under the panel by design. The rule still fails when a panel comes within 8 px of the level. Not a
  loosening.
- `pick-place-erase.journey`: the crate is measured after choosing Place, because the level now refits clear of the
  tray. Same assertions. Justified.
- `paint-and-pencil.journey`: the exact sky pixel became "within 12 per channel". The probe above shows a grid line
  sits at most 10 off a light sky, while painted ground is far off it, so the check still tells sky from ground.
  Justified.

## Scope and identity

The diff touches only `src/features/levels/`, `src/features/map/LevelBar.svelte`, `src/features/world/` and the tests
named above: no art, asset, dependency or word change. All 10 commits are authored and committed by McThayDT, with no
Claude trailers. The live-state file is gone at head. The pull request body names every changed test and ends
"Requested by **McThayDT**".

## Notes (not blocking, not fixed here)

1. UNIT: `levels/show.ts`, `level-canvas.ts`. VERDICT: note. REASON: the "Tiles" grid default call is sound (the brief
   wants the grid while editing and Off still hides it), but it changes what "Tiles" means: the old strong whole-tile
   lines over the ground are gone, and only "Finer" (half tiles) still draws over everything. EXPECTED: nothing now;
   if someone asks for whole-tile lines over the ground, that is a new choice for the Show menu.
2. UNIT: `world/World.svelte` (insets with `lay.settings`). VERDICT: note. REASON: picking a thing with a tap now
   refits the level beside the panel, so the level moves under the tap; a drag holds the view and it refits on let go.
   The brief asks for this ("with the side panel open, it fits the space that is left"); the builder named it. For
   the design check to judge by eye.
3. UNIT: `levels/LevelPart.svelte`, `world/World.svelte`. VERDICT: note. REASON: both files are at exactly 600 lines,
   the limit, and LevelPart reached it by putting `aside` beside `bind:this` and the `data-drawn` sum (which calls
   `levelSize` twice) on one long line. EXPECTED: the next change to either file splits it first; a `$derived` for the
   drawn corners would read better.
4. UNIT: `map/LevelBar.svelte`. VERDICT: note. REASON: Escape and a tap outside close the menu, but focus is not given
   back to the "More" button, so a keyboard user lands nowhere. EXPECTED: on close by Escape, focus returns to "More".
