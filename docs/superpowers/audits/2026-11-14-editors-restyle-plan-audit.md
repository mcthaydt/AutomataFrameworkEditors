# Plan audit: the editors wear Blueprint

Written 2026-11-14. Stage 3 (Plan audit) of Cycle 2, for
[`plans/2026-11-14-editors-restyle.md`](../plans/2026-11-14-editors-restyle.md) as merged in pull request 10
(`18a0c3a`), read against the spec's "Visual direction" (AutomataFramework `main` at `13fb0a3`), `CLAUDE.md`,
[`progress.md`](../progress.md), every file under `src/` and `tests/` the plan names, the framework at the pinned
commit `9109fa3`, the four packages as npm serves them, and the Owner's decisions for this cycle (palette No. 310;
Fraunces, Onest and JetBrains Mono; Phosphor regular; the Blueprint layout; "Automata Framework editors" on screen and
"Automata Framework Editors" for the App).

## The answer first

The plan is sound and close to ready. Its architecture is right: one stylesheet names the colours, the canvas draws
only the game's art, and everything the editor adds is a layer of page elements over it, which is what lets a test
prove the art is never touched. Every figure it gives was recomputed and holds, every file it names exists, and it
has end-to-end tests for every task.

It had **four blocking findings**, each of which would either stop a task on its first push or ship a screen that
fails the drunk-grandma test by design: two words used a task before they exist (B1), sentences that would lie over
the level for good (B2), a grid nobody can see on the demo game's own sky (B3), and a note that does nothing a finger
can see when it is pressed (B4). There are eleven should-fix findings, eleven notes, and **one question for the
Owner** (Q1: Share on the level screen), which blocks nothing before Task 7.

**How the findings are applied.** Every B and S finding has been written into the plan in this pull request, marked
with its number, so stage 4 executes the plan as it now reads. Where a fix is a design choice of mine, it is listed
under "Rulings made by this audit" with its cost, for the implementation audit to challenge. Q1 is not defaulted.

## Method

- **The code was read, not assumed.** `ui.css`, the four shared pieces, `Levels.svelte`, `LevelScreen.svelte`,
  `WaitingChange.svelte`, `App.svelte`, `Guide.svelte`, `edit.ts`, `place.ts`, `level-canvas.ts`, `words.ts`, the
  architecture rules, `ci.yml`, `journey.ts`, the screens journey and every test that reads a ring, a colour, the old
  name or a selector.
- **The colours were recomputed** (WCAG, a script, not a test): the two mixed shades are `#313c2c` and `#b7b492`, and
  all eleven ratios in the plan's "Measured while planning" are right to two places. New figures are in B3 and N4.
- **The packages were listed from npm's own tarballs** (read, not installed): `wght.css`, `400.css`, a `LICENSE` in
  each of the four, and all 28 icon files the plan names exist at the versions given. Fraunces has Latin, Latin
  Extended and Vietnamese only (S10).
- **The framework was read at `9109fa3`:** `fitWorld` centres the world and answers `{ scale: 0, left: 0, top: 0 }` for
  no room, which is what `fitInside` builds on; the sky is `#9fd3f0` and a tile `#3b4a5a`.
- **The page's header was read:** it has no `style-src`, so `default-src 'self'` governs styles (N2).
- Pull request 10's own run was read: `check` and the three `engines` jobs are green, each engine in about five
  minutes of its thirty.
- No test, lint or build was run (project rule; this pull request changes docs only).

## Blocking (fixed in the plan)

**B1. Two words are used a task before they exist, and one exists a task before it is used.**
`tests/features/suite/words-used.test.ts` fails on any `WORDS` key no file under `src/` reads, and on any sentence
typed into a `.svelte` file. Task 3 adds `WORDS.redo`, but the Redo tool arrives in Task 4, so Task 3's `check` would
be red. Task 4's `ThingCard` shows "Across" and "Down", but `noteAcross` and `noteDown` arrive in Task 5, so Task 4
could only type them into markup, which the same test refuses. *Fix:* `redo`, `noteAcross` and `noteDown`, with their
rows in the words test, are added in Task 4.

**B2. Sentences would lie over the level and never leave.** Task 4 floats everything `LevelScreen` says (`said`) over
the top of the clear cell. That block includes the standing sentence (`visitorCan`, `lookOnly`, `mineWaiting`), which
is there for as long as the level is open, and notices such as `draftBack` and `copyCopied`, which stay until the next
save. On a phone the clear cell is about 180 px tall for a visitor (N1): the first thing a person who pressed "Try it
now" would see is half the level behind a note, and a thing under it could not be touched. Level-1 keeps its crate at
the bottom, so no test in the plan would notice. The "at most half its height, scrolling" rule also means an ask's
buttons ("Sign in", "Stay", "Leave without saving") can be scrolled out of sight inside a box about 90 px tall.
*Fix:* the standing sentence goes in the `top` panel, under the status line, in the flow. Only what just happened
floats over the clear cell. A floating notice with no ask carries a plain "Got it" Button (`WORDS.tipGotIt`, a word
that already exists) and also leaves at the next move; one with an ask stays until it is answered and may take the
whole clear cell. New rules in `broken()` and a browser test hold it: an ask's buttons are in view without scrolling
at every size, and with nothing just said no words lie over the clear cell.

**B3. The tile grid cannot be seen on the demo game's sky.** The grid is "words colour at 25%". Over the framework's
sky (`#9fd3f0`) that is 1.07 to 1, and at full strength the words colour is still only 1.35 to 1. The demo game is
what every visitor sees first, so the grid would be missing from the first screen. Review Focus 2 covers the ring and
the notes on light art, but not the grid. *Fix:* each grid line is two 1 px strokes side by side, one in the words
colour and one in the ground colour, both at 25%, so one of the two shows on any art. A Node test holds the better of
the pair to 1.5 to 1 or more against the sky, a tile, white and black (measured: 1.54, 1.87, 1.62, 1.87). Task 9's
reading gains "can the grid be seen on the sky?".

**B4. Pressing a note does nothing a finger can see.** The spec says tapping a note "opens the same − and + as the
card". The plan moves the keyboard's focus to the card's left or up arrow. After a touch, a browser does not draw the
focus ring on a button focused by script, and on an iPad held sideways the arrows are already in view, so a person
taps a touch-coloured number and nothing happens. *Fix:* pressing a note also marks the card's pair of arrows for
that direction (`data-asked="x"` or `"y"` on the card) and the pair is drawn with the words-coloured ring until the
next press anywhere; the card scrolls the pair into view. The browser test and the journey press the note by touch
and read the mark, not only the focus.

## Should fix (fixed in the plan)

**S1. The level can still move under a finger.** The plan fixes the card's and tools' tracks so that picking a thing
never refits the level, but the `top` row is `auto` and holds the status line and the stamp. The first move after a
save removes the stamp and changes the status sentence, in the middle of a drag, so the clear cell grows and the
level is fitted again under the finger. *Fix:* the stamp is laid over the top right of the clear cell, out of the
grid's flow, and the status line keeps the height of two lines. A browser test: with `status` going from `saved` to
`dirty` and the stamp going away, `data-scale` and the crate's box do not change.

**S2. The clear cell has to be watched itself.** The plan measures `[data-clear]` "by the `ResizeObserver` that
watches the stage". The stage does not change size when the `top` row wraps, but the clear cell does. *Fix:* the same
observer also observes `[data-clear]`.

**S3. Between Task 3 and Task 5 a waiting change has no ring.** Task 3 takes the ring out of the canvas and says the
picked thing "keeps its dashed border from `.thing[aria-pressed='true']` for now". That border is solid, and a level
shown read only has no `aria-pressed`: `[data-marked]` has no style at all today, while the screen says "The ring
shows where it is now". *Fix:* Task 3 gives `.thing[aria-pressed='true']` and `.thing[data-marked]` the same border,
with a browser test (`read only, a marked thing is ringed by its button`). Task 5 turns it into the dashed ring.

**S4. Three tests could pass without proving anything.**
- `document.fonts.check('18px "Onest Variable"')` is true in some engines for a family the page does not have at
  all. *Fix:* the journey asks for a `FontFace` in `document.fonts` whose family is the font's and whose `status` is
  `loaded`, and for a `.woff2` in `j.requests` from `j.site`.
- "Every running animation has `opacity` as its only property" reads `getAnimations()`, which is empty once a 200 ms
  animation has ended, as it will have on a slow runner. *Fix:* the keyframes are named (`draw`, `land`, `fade`) and
  the tests read the computed `animation-name`: it ends in `fade` with reduced motion and never otherwise.
- "The built page inlines no font" is skipped when `dist/` is absent. *Fix:* skipped only when `CI` is not set; in CI
  a missing `dist/` fails.

**S5. Nothing holds "nothing is put on the canvas".** The constraint (no filter, opacity, blend or rounded corner) has
no test, and today's `.stage` has a rounded corner and `overflow: hidden`. *Fix:* the look journey reads the computed
style of `.stage canvas` and each of its ancestors: opacity 1, no filter, normal blend, and a corner of 0 on the canvas
and the stage.

**S6. Task 9 adds to a test that does not exist.** No test reads `CLAUDE.md`'s list of what the device may keep.
*Fix:* Task 9 writes it: every `af.` key the code under `src/` names is named in `CLAUDE.md`, `af.notes` among them.

**S7. The order of the layers is not said, and as written a note can sit under another thing.** The notes layer is
"over the canvas and under the things' buttons", so a note beside the picked thing can be covered by the next thing's
48 px button and cannot be pressed. *Fix:* the order, lowest first: the canvas; the grid and lines; the things'
buttons; the notes; the floating panels; what was just said.

**S8. Two new scenes are already there.** `level-picked` is `level-crate-selected`, and `level-saved-stamp` is
`level-saved-straight-in` (with `level-saved-as-suggestion` beside it). *Fix:* the existing scenes are kept and show
the new look; only `level-undone-and-redone`, `level-notes-faded`, `level-notes-hidden` and `change-approved-stamp`
are added.

**S9. Two steps tell the build to expect a red or a change that will not come.** Task 2 says a `knip` failure may be
left for Task 4, which contradicts "a task is done when `check` is green"; it cannot happen, because knip's entries
include the tests and Task 2's tests import `Tool` and `Stamp`. Task 1 says one Cycle 1 test will need its colour
moved; no test reads a token's colour. *Fix:* both sentences now say so.

**S10. Fraunces has no Cyrillic.** The plan says "Latin and Cyrillic are covered". Onest and JetBrains Mono cover
both; Fraunces does not, so a title in Russian (a game's name today, every title in M3) would fall to Georgia. *Fix:*
`--title` is `"Fraunces Variable", "Onest Variable", Georgia, …`, so such a title is in the words face.

**S11. A waiting change ignores the device's notes switch.** `WaitingChange` passes `notes="on"`, so a person who hid
the notes still gets the grid there. *Fix:* it reads the same `af.notes` (there is no switch on that screen; the
level's own is one press away).

## Notes

**N1. `rem` is 18 px here**, because `html` carries the 18 px type size. The plan's tracks are therefore 99 px (tools),
306 px (the card, wide), 198 px (the card, upright), and "wide" starts at 648 px. On a phone a visitor's clear cell
comes to about 180 px (844, less the bar 56, the strip about 130, the top row about 70, status 30, the standing
sentence about 90, tools about 90, the card 198), against the 160 px floor in `broken()`. It fits, with little to
spare. If the floor fails, that is a stop to report, not a number to lower.

**N2. The ban on `style="` is load-bearing.** With no `style-src`, the header refuses a style attribute parsed from
markup; Svelte's `style:` directives go through the style object and pass (today's journeys prove it). The notes'
places use `style:`; the draw-in should use `pathLength="1"` on each line so no line needs a length in a style.

**N3. Selectors the tests hold that the plan's list leaves out:** `.guide`, `textarea.box`, `.person`, `form` and
`select`. Added to the list.

**N4. Disabled buttons and faded notes are outside the contrast rule, and should say so.** A disabled primary Button
at half strength is 1.73 to 1, and a faded note over the sky 2.09 to 1. Both are meant (WCAG leaves disabled controls
out; faded is the person's own choice), and `broken()` reads computed colours, so it passes them. The rule now says
so, so a later audit does not call it a hole.

**N5. `textarea.box` is `0.85rem monospace`.** It is the level's text to copy by hand. It becomes `.measure` (15 px,
JetBrains Mono).

**N6. A picked thing's ring is also its focus sign.** The ring's rule is more specific than `:focus-visible`, so a
thing reached by keyboard shows the dashed ring, not the words-coloured outline. That is fine (picked and focused are
the same thing here) and is now written down.

**N7. Phosphor could be held to one file** the way Pixi is, by a `package-confined` rule in
`tests/architecture/rules.ts`. Optional.

**N8. CI has room.** An `engines` job takes about five minutes today; two more journey files and four more scenes are
well inside thirty.

**N9. A mark-coloured edge is judged against the box's own fill** (always the ground), since its far side may be
raised. The constraint now says so.

**N10. "Fourteen journeys press its button from a level" was not counted.** The ruling it supports (the bar stays)
stands on the phone's width alone.

**N11. Checked and right:** `$props.id()` exists in Svelte 5.57.1; the approve journey reads `data-marked`, not
pixels, so taking the ring out of the canvas breaks no journey; `service` may import `words` (it is the lowest
feature); the Function's bundle test allows it (no CSS rides along); every dependency version is exact and is what
the site ships; `assetsInlineLimit: 0` is what the site does too; the docs and words tests the name change touches
are the ones Task 8 lists; no workflow file needs to change.

## The plan's rulings, reviewed

| Ruling | Verdict |
|---|---|
| Share stays a row on the game's page (M5) | **Q1.** The Visual direction lists Share among what floats over the canvas; leaving it out is the Owner's call. The reason given is weak: Sign in already leaves a level and brings the change back. |
| The bar stays above a level, 56 px | Agreed for M1. It costs a phone 56 px; Owner review should look at the phone pictures with this in mind. |
| The first-run strip stays above the level | Agreed. Onboarding comes first, and it goes once hidden. |
| Redo is added | Agreed; the spec's layout names it. |
| A waiting save is also stamped "Saved by" | Agreed. It was saved; the sentence beside it says it waits, and "Approved" follows. |
| The notes' switch steps on, faded, hidden | Agreed. Its state is the word under its icon. |
| Fixed tracks for the panels | Agreed, and extended by S1 to the stamp and the status line. |

## Rulings made by this audit

- **The standing sentence is in the `top` panel; only what just happened floats; a floating notice with no ask has
  "Got it" (B2).** Cost if wrong: about 90 px of a visitor's phone, and one more button on a notice.
- **The grid is a pair of strokes at 25% (B3).** Cost if wrong: a slightly heavier grid on mid-toned art.
- **A pressed note marks the card's arrows (B4)** in place of opening a second pair of arrows beside the note. Cost if
  wrong: the spec's "opens the same − and +" is met by pointing at them, not by copying them.
- **The stamp lies over the clear cell's top right corner (S1).** Cost if wrong: it can cover a thing in that corner
  until the next move takes it away.

## Question for the Owner

**Q1. Should Share be on the level screen?** The Visual direction says Save and Share float over the canvas. The plan
keeps Share as a row on the game's page only.

- **(a) As planned.** Share stays on the game's page. One more press (Back) from a level; the level's top row stays
  short on a phone.
- **(b) Add it.** A Share tool beside Save, shown to an Owner only. It keeps an unsaved change on the device and
  brings it back, as Sign in does. Costs a new control and its journeys in Task 4, and room in a phone's top row.

My recommendation is (a) for M1, because Share is used rarely, only by Owners, and the phone's top row is already
full. It is not defaulted: Tasks 1 to 6 do not depend on it, and Task 7 (the Share row's look) waits for the answer.

## Against the spec

| The spec's "Visual direction" | Where | State |
|---|---|---|
| Blueprint: dark ground, 2 px corners, 1 px lines, shadow only on what floats | Tasks 1, 2 | Covered, tested |
| No. 310, two mixed shades, every read pair held to a contrast test | Task 1, Task 4's `broken()` | Covered; figures verified |
| The name and wordmark | Tasks 7, 8 | Covered |
| Fraunces, Onest, JetBrains Mono; labels in capitals | Task 1 | Covered; S10 |
| Noto Sans KR, JP, SC | Not in plan | Allowed ("which files are shipped is each plan's choice"); they join with M3 |
| Dark by default | Task 1 | Covered |
| Canvas first; tools, Save, card, undo and redo float | Task 4 | Covered; B2, S1, S2 |
| Share floats; the editor switcher | Not in plan | Q1; the switcher waits for a second editor |
| The art is never restyled | Tasks 3, 5 | Covered pixel for pixel; S5 |
| Drawing notes: leader, measures, grid, each a control, on, faded, hidden, a device setting | Task 5 | Covered; B3, B4, S7, S11 |
| "Hide notes" in the find bar; Play hides notes | Not in plan | Neither exists until M3 |
| Moments: stamps, notes draw in, reduced motion | Tasks 5, 6 | Covered; S4. The spec's "fade when it is let go" is now in Task 5 (it said "removed") |
| Phosphor regular, a word with every icon | Tasks 2, 7 | Covered, tested |
| 44 and 48 px, the drunk-grandma test | Task 4's measures, Task 9 | Covered |
| End-to-end tests | `look` and `notes` journeys, the screens journey | Covered, three sizes, three engines |
| Onboarding | The strip is unchanged; first-run journeys stay green | Covered; B2 keeps the visitor's first level clear |
