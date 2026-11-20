# World 18, cycle 1: implementation audit

Change: PR #124, head `1b8208eda04530239830722deda1d4669790da09` (`1b8208e`), plan PR 18 (Task 42a, "Drawn behind, with
the hero, in front"), lane 2. Read by a fresh reviewer; nothing was fixed here.
Method: `review` prompt followed. Read the diff of the three PR commits (11 files), the plan's Task 42a, the builder's
brief and the framework renderer's layer order in the pinned build (`node_modules/@automataframework/framework`, the
`draw` containers). Ran: `pnpm lint` (one warning, in `tests/…ci-workflow…`, not this PR), `pnpm typecheck` (0 errors, 0
warnings), `pnpm knip` (clean), `pnpm test:node` (96 files, 1160 tests pass), `test:engine chromium` on
`draw.browser.test.ts` (6 pass), `build:journeys` and the draw-order journey in Chromium (6 pass). WebKit and Firefox
could not be installed in this container, so they did not run here. Then drove the built page at the five sizes and
looked at the pictures (scratch scripts, not committed).
CI on `1b8208e`: quick gate, quick check, quick engines (Chromium), Chromium 1 to 6, screens, mockups, commit-authors
green. The draft runs no WebKit or Firefox, so the brief's "passes in Chromium, WebKit and Firefox" has no evidence yet.

## Changed or deleted tests
Read first. Nothing existing was changed or deleted (the diff against the base adds `draw.test.ts`,
`draw.browser.test.ts`, `draw-order.journey.test.ts`; no golden or `verify` step touched). The last commit edited the
builder's own new test from "With the hero" to "With hero" to match its new words. Nothing was loosened.

## Acceptance, one by one
- `draw.ts` `Draw`, `DRAWS`, `drawOf`, `setDraw` as the plan's block says; `with-hero` takes the key out; `things` keeps
  its order; result passes `LevelSchema`; `toPut` lists things in the opened order: PASS (`draw.test.ts`, 7 tests).
- "Drawn" is a `Segment` of three in "Look", each with its line; works for several picked things, none ticked where they
  differ: PASS (`draw.browser.test.ts`, 2 tests; shot at five sizes).
- One undoable step: PASS (steps() is 1; undo restores; journey).
- Menu rows "Bring to the front", "Send to the back", a row that cannot act says why: rows and "Already in front" PASS in
  the component test; reachable on screen: FAIL, red 1.
- Layers in the framework renderer's order so the level view and Play agree: PARTIAL. Behind and in front agree (tested
  by pixels, and the test fails if either layer is swapped). With the hero over the ground disagrees: FAIL, red 2.
- Marks stay above every layer: PASS (`Marks.svelte` untouched; the marks are an SVG layer above the canvas).
- Nine languages: PASS (nine rows in `words/thing.ts`; `words.test.ts` passes; Russian and the other seven shot).
- Design instructions: glass (no colour or blur of its own: `Menu`, `Segment`, `Popups` use the kit; `tokens` and `glass`
  architecture tests pass) PASS; icons (`arrow-line-up`, `arrow-line-down`) on menu rows with words PASS; the segment is
  words only, where an icon alone would be unclear PASS; drunk-grandma words, see N1.
- WebKit and Firefox pass: NOT YET SHOWN (draft CI is Chromium only).

## Red findings

### Red 1: "Send to the back" is cut off and cannot be tapped on four of five sizes
UNIT: `src/features/levels/Popups.svelte` calling `menuPlace` in `src/features/levels/float.ts`.
VERDICT: red.
REQUIREMENT: brief: "Bring to the front" and "Send to the back" in the thing's menu; the menu is "kept inside the stage";
the screens rule "no text off the side or cut short".
REASON: `menuPlace` keeps the menu inside the stage by assuming it is 260 px tall (its default `size`). The menu now has
six rows plus its heading and is 312 px tall, so the clamp lets it run about 52 px past the level box, which clips it
and does not scroll. The last row, "Send to the back", is hidden.
EVIDENCE: opened the menu with the crate picked, through the three dots, at each size: the last row's centre is not the
element hit (`elementFromPoint`) at computer (row at 719 to 763 of 800, stage ends 716), iPad sideways (753 to 797),
phone (647 to 691, level box ends about 645) and phone sideways (335 to 379, box ends about 325); only iPad upright
(1023 to 1067 of 1210) is clear. Pictures show the menu ending at "Bring to the front" with the next row gone. The menu
element is not scrollable (scrollHeight 312, clientHeight 312). The draw-order journey still passes because Playwright's
`click` scrolls a clipped element into view by itself, which a finger cannot.
EXPECTED: all six rows whole and tappable at every size (iPad upright, iPad sideways, phone, phone sideways, computer).
FIX: give `menuPlace` the menu's real height (rows times 44 plus the heading, or measure it) in `Popups.svelte`; add a
browser or journey check that the last row is the element at its own centre (`elementFromPoint`) and lies inside the
level box at all five sizes, with the thing picked low in the level (the crate). Files: `float.ts`, `Popups.svelte`, the
new check in `draw-order.journey.test.ts` or `draw.browser.test.ts`.

### Red 2: with the hero, a thing with no picture is over the ground in the level view and under it in Play
UNIT: `src/features/levels/level-canvas.ts` (`drawLevel`), and `draw.browser.test.ts` (its with-hero assertion).
VERDICT: red.
REQUIREMENT: brief: "the three layers in `level-canvas.ts` in the framework renderer's order so the level view and Play
agree"; acceptance: "the same pixels in the level view and in Play".
REASON: the framework renderer (pinned build) puts these in one stack, bottom to top: behind, with-the-hero things drawn
as boxes, the tileset's ground pictures, with-the-hero things drawn as pictures, in front. The level view draws behind,
ground, then every with-the-hero thing and the hero starts. For a game with a tileset, a with-the-hero box thing that
overlaps a ground tile shows over it in the level view and under it in Play. The test for "with the hero is over the
ground" (`expect(withHero).toBe(CRATE)`) reads only the level view, so it fixes the editor's order in place and never
compares it with Play.
EVIDENCE: a scratch test (not committed) using the PR's own `crateAt(FLOOR, 'with-hero')`, `levelView` and `inPlay` on
the fixture game with its tileset: level view `#c9a227` (the crate), Play `#6b4f2a` (the ground). Behind and in front
agree in the same run.
EXPECTED: the same colour at the same place in both, for every one of the three layers.
FIX: in `drawLevel`, draw the with-the-hero things that have no figure before the ground tiles, and those with a figure
after them, as the framework does (the hero starts follow their own figure or box the same way); extend the parity test
in `draw.browser.test.ts` to also compare with-the-hero at the floor, with and without a figure. Files: `level-canvas.ts`,
`draw.browser.test.ts`. If the owner prefers the editor's current order, the framework's renderer is the thing to
change and that is a framework decision; ask it as a card, not here.

## Notes (not blocking, kept apart)
- N1, the words: "With hero" is what the mockups (`world-levels-settings` and the rest) say; the plan's text says "With
  the hero". "With hero" is clipped English; "With the hero" is plainer for the drunk-grandma test. It fits: the
  Russian "Вместе с героем" (the longest of the other eight) already wraps to two lines in the 86 px buttons at computer
  and iPad sideways and fits in the 44 px height with nothing cut. The builder's tightening was not needed for this word.
  Choice for the lead: keep the mockups' words, or use the plan's and update the mockups.
- N2, the five sizes, English and the longest other language (Russian), shot at iPad upright, iPad sideways, phone, phone
  sideways and computer (and all nine languages at computer and phone): no sideways scroll; each of the three buttons 44
  px tall; nothing overlapping; English one line everywhere; the other seven languages one line; Russian "Вместе с
  героем" two lines at 86 and 111 px wide buttons, readable. The "about" line is one line in every language. At 1280 by 800
  the last slider ("From the top") ends about 7 px above the pinned arrows' edge at the first scroll position, so it
  clears them; the screens journey is green in CI.
- N3, phone upright (390 by 844), English and Russian: at the first scroll position the "Drawn like the hero is." line
  sits under the pinned arrows' edge and is half cut until the settings are scrolled one notch. Scrolling reaches it. The
  builder's `margin-top: -4px` and `line-height: 1.2` on `.about` fit this only by luck; fine to keep.
- N4, locks: moving and deleting a locked thing is refused with "Unlock" (`isLocked`), but "Bring to the front", "Send to
  the back" and "Drawn" change a locked thing. Locked means "can't move by mistake" and a draw is not a move, so this
  may be right; say which in the words or the rule.
- N5, the PR body still says "Browser tests, the journey, the run-like-a-person check, screenshots" are not done; the
  tests are in the branch. Update it before ready, with the lane, the red fixes and the checks that ran.
- N6, `words/thing.ts` is now 520 of 600 lines and the right home for the new words (the plan named `words/levels.ts`,
  at 585 of 600 lines, so it would have broken the limit). Fine; the plan's file list should say so.
- N7, `LevelPart.svelte` also reflows the `marksFor(...)` call and `drawPicked` has a long line; lint is clean, but the
  reflow is not part of this change.
- N8, things keep their order: confirmed by the unit tests, `toPut` in `draw.test.ts` and the journey's put-in check.
  `setDraw` never reorders and takes the key out for `with-hero`.

## Verdict
Two reds. A second cycle re-reads only the fix diff, and needs WebKit and Firefox from the full run on the ready commit.
