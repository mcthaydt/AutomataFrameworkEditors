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

## Cycle 2: fix diff `a2f6f14..d6a2e690cfd50a7744b7edbf436c959a7f715bc2` (`d6a2e69`)

Read only the fix diff (5 files). Ran at `d6a2e69`: `pnpm lint` (the same one warning as before, not this PR),
`typecheck` (0 errors, 0 warnings), `knip` clean, `test:node` (96 files, 1160 tests pass), Chromium `draw.browser.test.ts`
(7 pass), `build:journeys` and the draw-order journey in Chromium (11 pass). WebKit and Firefox were not run here (not
installable in this container); they still wait for the full run on the ready commit. Shot the open menu at all five
sizes (picture files in this review's scratch folder, not committed).

- Red 1, the menu cut off: FIXED. `Popups.svelte` now places the menu by its measured size and caps it at the level
  box's height with its own scroll. Measured with the crate picked, menu opened through the three dots: iPad upright, iPad
  sideways, phone and computer show all six rows whole (menu 314 px tall, nothing scrolls, last row "Send to the back"
  inside the level box and in the pictures). Phone sideways (level box 262 px) shows five rows and a half, and scrolls.
- The new check is honest: it opens the real menu, does not scroll a row into view, tests each row with `elementFromPoint`
  and against the stage box, and asserts the menu scrolls only at phone sideways (`scrolls === (size === 'phoneSideways')`),
  so a menu that starts to scroll anywhere else, or that clips without scrolling, fails it. The swipe by `scrollTop` is
  done only where the menu scrolls, which is what a finger does there. Not a let-out.
- Red 2, with the hero over the ground: FIXED. `level-canvas.ts` draws behind, with-the-hero boxes and the hero's start boxes,
  the ground, with-the-hero pictures and the start pictures, then in front: the framework's order. The pixel test now
  compares the level view with Play for a with-the-hero box (the ground's `#6b4f2a`, under the ground) and for a thing with
  a picture (the picture's `#112233`, over it); both pass in Chromium, so Play and the level view agree for the cases the
  first cycle disagreed on.
- The replaced assertion is a correction, not a loosening: the first cycle's "with the hero is over the ground" read only
  the level view and was wrong against the framework (cycle 1 evidence: Play `#6b4f2a`). It is replaced by a stricter pair:
  an exact colour in the level view, equal to Play's own pixel, for both a box and a picture. The "behind is under the
  ground" test also now asserts the exact ground colour. Nothing else in the file loosened.
- Notes taken: label "With the hero" (N1 closed; Russian and the English now wrap to two lines at 86 px, nothing cut);
  locked things behave as for the other settings (N4 closed, no code change).

### New notes (not blocking)
- N9, phone sideways: nothing says "more" except the sixth-row half peeking at the foot ("Bring to the front" is cut
  across its middle, no scrollbar, no fade). A cut row is a common sign that a list goes on, and a finger finds it, but it is
  weak. Suggest a fade or a visible scrollbar at the menu's foot where it scrolls. Optional; the row is reachable.
- N10, the menu's first frame uses 260 px until its size is measured (and the size of the last menu stays until the next
  one is measured), so on a screen where it matters the menu may move one frame. Not seen in the pictures.
- N11, the check does not assert the "more" cue exists; it only proves reach.

Cycle 2 verdict: both reds closed; no new reds. Still open for the ready commit: WebKit and Firefox results from the full
run, and the PR body (N5).

## Cycle 2 addendum: test diff `a9b0b46..c6bcdef` (`c6bcdef8147a32b32a60000e25ee9dda1d66e815`)

Only `tests/journeys/draw-order.journey.test.ts` (+26, -5): the Play pixel read hides the play bar for the one screenshot,
polls up to 5 s, and says what it read.
- True that the bar covers the crate: shot Play at phone (390 by 844, crate put on the hero start, "In front") with the bar
  shown and hidden. The game box is 374 by 246 px; the bar is 266 by 132 px at its top left, over the hero start, and the
  bar-shown picture has no crate colour (only the bar), while the hidden picture shows the gold crate next to the red hero.
  So the 0-pixel failure was the bar, not the draw.
- Honest enough: only the bar is hidden (`visibility`, put back at once), the same canvas is read, the same colour
  assertion stands, and the crate is still read in Play after Play started. The poll only waits for a first frame.
- Weakness, a note (N12): this journey only proves the crate's colour is somewhere in Play's picture (the crate and the hero
  start end up side by side, the hero being pushed); "over the hero start in Play" is proved by the pixel test in
  `draw.browser.test.ts` (in front over the start and equal to the level view), not by this journey.
- Not a product fault of PR 18: nothing in PR 18's source touches the play bar or the Play canvas; the bar over the hero
  start at phone is PR 17's, routed to PR 19. Pass.

## Cycle 2 addendum 2: merge `838beff0741b71b6bcd55422280f77ac2efc5472` (main `4381d37` into `c6bcdef`)

Read `git show --cc 838beff`: the three conflicts (`ThingMenu.svelte`, `Popups.svelte`, `LevelPart.svelte`) keep both
sides: the props (`draws` and `canNote`), the measured, scrolling `menu-float` wrapper, both `chosen()` branches, the note
row first and the two draw rows last. Nothing of either side was lost.
- FAULT (red, at this commit): `pnpm typecheck` fails: `tests/features/levels/draw.browser.test.ts` 293:7, "Property
  'canNote' is missing ... but required in type 'Props'". The test's `ThingMenu` mount (props at line 299) has no `canNote`;
  the hand-off said it was added, but it is not in `838beff`. Fix: add `canNote: false` to that mount. (CI's typecheck, and
  the "quick check", will fail on it.)
- Known, not this PR: `tests/architecture.test.ts` fails on `World.svelte` at 605 lines (main's, fixed by #126). That is the
  only node failure (1182 of 1183 pass), lint is the same one old warning, `draw.browser.test.ts` 7 pass in Chromium, the
  draw-order journey 11 pass in Chromium, built from `838beff`.
- The menu with a note-capable thing (signed in; seven rows: Add a note, Rename, Lock, Hide, Copy to paste, Bring to the
  front, Send to the back; 358 px tall): "every row is whole, inside the level, and what a finger would touch" passes at all
  five sizes. Shot: iPad both ways, phone and computer show all seven rows whole, nothing scrolls; phone sideways (box
  262 px, menu 246 px) scrolls, as the check asserts.
- N9 gets worse, still a note: at phone sideways four and a half rows show; the last two rows, which are this PR's
  "Bring to the front" and "Send to the back", are out of sight, hinted only by the cut "Copy to paste" row. A fade or a
  visible scrollbar at the foot would make that clear; or put the two draw rows nearer the top. Reachable, so not red.
