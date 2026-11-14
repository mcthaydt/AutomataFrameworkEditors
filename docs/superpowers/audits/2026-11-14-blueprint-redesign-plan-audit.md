# Plan audit: the editors' Blueprint redesign

Written 2026-11-14. Stage 3 (Plan audit) of Cycle 3, for
[`plans/2026-11-14-editors-blueprint-redesign.md`](../plans/2026-11-14-editors-blueprint-redesign.md) as merged in pull
request 16 (`22c48a4`). It was read against the spec
([`specs/2026-11-14-editors-blueprint-redesign-design.md`](../specs/2026-11-14-editors-blueprint-redesign-design.md)),
the mockup's "Notes on" screen (the moodboard in the private notes: its markup and its CSS were read, not just its
picture), `CLAUDE.md`, [`progress.md`](../progress.md), the code on `main`, pull request 12's head `e0648b0`, and
AutomataFramework's `main` at `4b18418`: the renderer (`render/stage.ts`, `render.ts`, `fit.ts`, `art.ts`), the content
art (`content/art.ts`), the full game fixture, the language spec, and the built-in hero spec merged in its pull request
91 (`docs/superpowers/specs/2026-11-14-content-hero-controls-design.md`).

## The answer first

The plan is sound and close to the mockup. Its core holds: the framework draws the game, the editors lay page
elements over it, one frame is shared by every screen, and every word and action has one home. Every framework name
Task 2 consumes exists on the framework's `main`; every file Task 3 copies from the full game exists; the language
order matches the framework's spec; `fitInRoom`'s expected numbers in Task 2 recompute exactly.

It had **no blocking findings** and **eleven important ones**, each written into the plan in this pull request and
marked `(audit I<n>)`. They fall in four groups:

- **Layouts that cannot hold in every language** (I1, I2): the fixed room numbers and the phone's single bottom row
  overflow once German or Russian tool words arrive, and the four-line title block is taller than the room kept for it.
- **The first visit** (I3, I4, I5): the spec's crate ring on arrival is missing, the card's sheet would pop up over a
  phone during the very first drag, and a visitor on a phone or tablet never sees "Sign in to save with your team".
- **The framework parts** (I6, I7, I8): the still picture frees the art it is given (so one art shared by two pictures
  breaks the second), the renderer's half-height limit must survive the four-sided room, and the picture answers need
  caching before a crowd of visitors spends the App's GitHub allowance.
- **Rules and Play** (I9, I10, I11): Task 4's skipped scenes, Task 17's marker rule that forces a name into every
  language's first tip, and Task 19's tests, which press touch buttons the built-in hero's thumb scheme replaces.

There are twelve minor findings, also applied, and **two questions for the Owner** (Q1 blocks Task 7 only; Q2 blocks
nothing until Task 19's amendment), and **one question for the coordinator** (C1). None is defaulted.

## Method

- Every file the plan names under `src/`, `tests/fixtures/`, `tests/journeys/` and `tests/architecture/` was listed on
  `main` and at `e0648b0`; the ones that exist do, and the ones the plan creates do not yet.
- The framework was read at `4b18418`. `createStage`'s `destroy` calls `art.destroy()`; `room()` holds the bottom inset
  to half the height; `fitWorld` centres and answers zero for no room; `createImageBitmap` makes the textures (no
  `blob:` address, so the strict header holds); `figureSheet` and `paintFigure` are exported from the content entry.
- The mockup's template and CSS were read: tools 64 × 58 in a left column, the card 250 px under the cluster, the
  "Drawing notes" switch with a knob beside the tools at the bottom, the stamp turned −8° with a 3 px edge, undo and
  redo bottom right, no title block (the spec adds it).
- Widths were estimated, not measured (nothing was run): Onest at 13 px in capitals with 0.07em letter-spacing is about
  9.5 px a letter, so "HINZUFÜGEN" is about 95 px and "ПЕРЕМЕСТИТЬ" about 105 px.
- Nothing was run. This stage wrote documents.

## Important findings (applied)

**I1. Ruling 2's fixed room cannot hold long tool words.** The room on the left of `wide` (96 px) fits a 64 px tool
column; a German or Russian tool word at 13 px is 70 to 105 px, so the column grows past the room and covers the
level's left edge, and nothing refits. *Applied:* `roomFor(shape)` is the least room; `Levels` measures the tools and
the bottom row (a `ResizeObserver`) and keeps `max(least, measured + 16)` on each side. It changes only when the
language or the panels change, never when a thing is picked, a stamp lands or a notice shows, so ruling 2's promise
holds. Task 17's limit on tool words drops from 12 characters to 9, and its journey "each of the nine" proves the
tools fit at every shape. Task 7 gains a browser test with a "long" test table (every English string 40% longer,
injected through Task 5's test-only `TABLES`), so the frame is proven against long words in PR 5, not first in PR 8.

**I2. Phone upright's one bottom row is full in English, and the title block is too tall for its room.** On `narrow`,
four tools (with Play) and undo and redo need 4 × 56 + 2 × 44 + gaps and padding = 354 px of the 358 the frame leaves:
any wider tool word overflows. Separately, the title block's four lines of labels are about 90 px tall, more than the
72 px the bottom room keeps on `wide` and `mid`. *Applied:* on `narrow`, undo and redo leave the tools' row for their
own small panel just above its right end, and `narrow`'s bottom room becomes 144 (the phone upright has height to
spare: its level is fitted by width). `TitleBlock` is a drawing's title block in fact, a 2 × 2 grid of cells (game |
level, editor | saved), at most 72 px tall; on `mid`, if the bottom row does not fit in a language, the block shows
its level and saved cells only (the pill already names the game and the editor). Both are rulings of this audit.

**I3. The crate's ring on arrival is missing.** The spec's step 2: "The crate's ring gently draws itself in." The
plan's ring belongs to a picked thing, and nothing is picked on arrival. *Applied (Task 12):* the tip's target thing
gets the same dashed ring with `animation-name: draw`, as a hint (`data-hinted`), without being picked, so the card
does not open. The first-visit journey checks it.

**I4. The first drag on a phone or a tablet upright opens a bottom sheet over the level.** Dragging picks the crate,
and on `mid` and `narrow` a picked thing's card is a sheet over the tools. During the first run that is a second
thing asking for attention, against the spec's "Nothing else asks for attention". *Applied (Task 12):* while the tip
is at `drag` or `keep`, a pick on `mid` and `narrow` brings the sheet up pulled down to its title only; a press on the
title opens it as usual.

**I5. A visitor on a phone or tablet upright never sees the collaboration line.** The spec's step 5: after Export,
"Save beside it reads 'Sign in to save with your team'". On `mid` and `narrow` the plan puts Save in the pill's menu,
so the line the Owner cares about (saving is for working with your team) is hidden. *Applied (Task 11, 12):* under a
visitor's "EXPORTED" stamp, on every shape, a quiet link `saveTeam` sits beside "Save it as a file" and opens the
sign-in panel.

**I6. The still picture frees the art it is given.** `createStage`'s `destroy` calls `art.destroy()`, so
`createLevelPicture`, built on it, does too. The plan hands one `Art` to more than one picture: the game's page draws
its first level behind the panel (a `Stage`) and the same level as a card (`drawThumb`), and the shared hidden
picture of Task 15 is remade for each game. When one is destroyed the other's textures are gone. *Applied:* Task 2's
doc comment says the picture owns its art and frees it; Task 3's `loadLevelArt` makes a new `Art` on every call (the
picture bytes stay cached, so it costs no fetch); `drawThumb` takes a loader, not an `Art`; the hidden picture is made
again whenever the next ask's size, tileset or backdrop differs (one at a time, so still at most two contexts), and
is laid out off screen at the thumb's own size (a `display: none` mount has no size, and the framework draws nothing
until it has one).

**I7. The four-sided room must keep the half-height limit.** Today `room()` holds the bottom inset to half the height;
the plan's `fitInRoom` has no such limit. If `setInset` goes through it unchanged, a game whose touch strip is more
than half a short screen fits differently and its pictures move. *Applied (Task 2):* `setInset(px)` keeps
`Math.min(px, h / 2)`, as today; only `setRoom` takes a room as given; a Node test holds it.

**I8. Pictures for a crowd of visitors.** Every first visit already reads the demo's files through the App; Task 3
adds one GitHub read per picture (five for the fixture game), and Task 11 adds one commit read per level file. An
installation's allowance is about 5,000 calls an hour, so a few hundred first visits in an hour (a launch day) would
use it up and the demo would stop opening. *Applied (Task 3):* a picture answer carries `Cache-Control: private,
max-age=300` (the browser keeps it); a visitor's answer for the demo game on its default branch is also kept in
Cloudflare's own cache (`caches.default`, when the runtime has it; the journeys' server does not, so the code tolerates
its absence) keyed by the request's address, for five minutes. The service test proves the headers. *Reported, not
fixed here:* `open` and `lastChange` have no cache either; that is older than this cycle and goes to the coordinator.

**I9. Task 4 skipped scenes to get green.** Its Step 5 let an old screen's scene be skipped at `phoneSideways` until a
later task replaced it. A skipped test is a test switched off. *Applied:* Task 4 adds the two new sizes to `SIZES` but
does not widen the old screens' journey; each later task adds its own screens at all five sizes; Task 18's check that
every scene runs at five sizes is unchanged.

**I10. Task 17's marker rule forces a name into every language's first tip.** The table test requires every function
to keep every marker, so `tipDrag(name)` must say the character's name in all nine. A character's name is its id as
words (ruling 4), an English word in the game's files ("crate"), so a Korean visitor's very first sentence would be
half English, and languages with gender or cases cannot put an unknown noun in "Drag the {name}". *Applied:* the
marker rule has one named exception list, `MAY_DROP = ['tipDrag', 'cmdAdd']`; those tables may say "Drag this
anywhere" with the tip's pointer doing the naming. English keeps "Drag the crate anywhere", as the spec says.

**I11. Task 19's tests press buttons the built-in hero does not have.** The hero spec (AutomataFramework PR 91,
merged) replaces per-action touch buttons with the **thumb scheme** for a hero with `moves`: slide on the left half to
walk, tap the right half to jump, flick to dash. Task 19's "a press on the framework's right button moves the hero"
cannot pass. *Applied (Task 19):* the journey walks by sliding a thumb on the left half and jumps by tapping the right
half, at the touch sizes; the keyboard at desktop. G1 is narrowed now, since the spec decides it: a game can play when
its project's `hero` character has `moves` (the amendment checks plan H kept that name). Stop sits over the left
half on a sideways phone and a tablet, where the halves cover the game, so the amendment must say how a touch on Stop
never starts a walk (the framework's halves leaving room, or Stop outside the play area). The hero spec's own editors
journey ("Play on the demo level by thumbs at iPad size") is in the list.

## Minor findings (applied)

- **M1. `data:` faces are a spec deviation.** The spec's constraints say "no `data:` address"; the header today allows
  `img-src data:`, and ruling 7 uses it for faces. It is now listed under "Where this plan differs from the spec".
- **M2. The notes' switch has the mockup's knob.** The mockup draws "Drawing notes" with a small switch whose knob
  shows the state; the plan's switch was words only. Task 9 adds a three-position knob (on right, faded middle, hidden
  left) beside the words.
- **M3. "Undo rubs the last note out"** (the spec's motion) had no step. Task 9 gives the notes layer
  `animation-name: rub` on an undo (`fade` under reduced motion).
- **M4. The stamp's angle follows the mockup:** turned −8° with a 3 px edge (Task 11 said 4° and 2 px).
- **M5. "Who saved last" names the person.** Saves are committed with the person's login as the author's name;
  `lastChange` reads `author.login`, else `commit.author.name` (Task 11).
- **M6. The Owner's first card has its picture.** The spec's "Add the editor to your game" card comes "with a picture
  of what will happen"; Task 15 now draws a `Thumb` of the demo level with a "SAVED" stamp on it.
- **M7. Notes have no "block".** Task 9 drew chips on the measure lines but its test still spoke of "the block of
  notes"; `notesFor`'s block is now where the name chip goes, and the test reads "every chip".
- **M8. The first visit loads no physics.** Play is the only file that starts a sim, but the framework's browser entry
  re-exports everything. The real-art journey (Task 3) and the first-visit journey (Task 12) check that no `.wasm` file
  is fetched before Play.
- **M9. Language tags and tag hygiene.** `matchLanguage` reads tags as the framework's does (`ko_KR.UTF-8` is `ko`;
  bad tags find nothing). `LANGUAGE_TAGS` gives `en-US` and `es-MX` where the framework gives `en` and `es`; that
  follows the flags and is kept, and the plan says so.
- **M10. The pick hint and the "long" table need Task 5's test-only `TABLES`** to exist from Task 5; it is named there.
- **M11. Ruling 14 (English only on `main` until Task 17)** holds only while the editors are not deployed from `main`.
  It is now conditional: if a deploy from `main` exists, stop and report before PR 5 merges.
- **M12. The full game's `level-1` has a `view` (a camera).** Task 3 copies its tiles, not its `view`, so the
  editors' fixture level is fitted whole; said in the step.

## Rulings made by this audit

1. The room is the least room plus what the tools and the bottom row measure (I1).
2. On `narrow`, undo and redo float in their own panel above the tools' right end; bottom room 144 (I2).
3. The title block is a 2 × 2 grid, at most 72 px tall; on `mid` it may drop to two cells (I2).
4. Tool words are at most 9 characters in every language (I1).
5. The first-run hint ring, and the sheet held at its title during the first run (I3, I4).
6. A visitor's stamp carries the `saveTeam` link on every shape (I5).
7. `tipDrag` and `cmdAdd` may leave the name out in a language (I10).
8. Picture answers are cached for five minutes, at the browser and, for the demo, at Cloudflare (I8).

## Questions for the Owner (not defaulted)

**Q1. On a phone held upright, how big is the level?** Blocks Task 7 only; PRs 1 to 4 go ahead. A level is wider
than it is tall (the demo's is 16 × 9 tiles). On a phone held upright, the whole level fitted to the width is about
210 px tall, and a crate is about 23 px across (its touch area stays 48 px). The spec says phones keep "a minimum height
for the level"; the plan read that as the stage's height, not the level's.

- **A. Keep the plan:** the whole level, fitted to the width, sky above and below; the page scrolls below it.
- **B. A taller level that slides:** the level is at least 320 px tall, so it is wider than the phone, and two
  fingers slide it sideways.
- **C. Pinch to zoom and two fingers to move, at every size** (as drawing apps do), starting from the whole level; a
  "Fit" button and the find bar's "Show the whole level" bring it back. About one more task in PR 5.

*Recommended: C.* It is what touch-first creative tools do, it fixes the phone and helps every size with a big level,
and the plan already cancels a drag on a second finger, so one finger keeps meaning "move this".

**Q2. When the editors are in French, Russian or German, which language does Play's game speak?** Blocks nothing
until Task 19's amendment. A game ships at most six languages; the editors have nine. The built-in hero shows hints
("Slide to walk", "Tap to jump") in the game's language, and the framework's game start refuses to begin before a
language is chosen (plan W).

- **A. The editors' language if the game has it; otherwise Play first shows the game's own flags, once per game on
  this device.**
- **B. The editors' language if the game has it; otherwise the game's own source language, without asking.**
- **C. Always the game's own flags first, once per game on this device.**

*Recommended: A.* It never assumes a language (B would show many people the source language, often English, by
default) and asks only when it must.

## Question for the coordinator

**C1. What may a stage run locally in this cycle?** The plan's Global Constraints let `pnpm install`, `format`,
`lint`, `typecheck`, `knip` and `build` run locally, and several steps make files with a command (`pnpm commands:write`,
`pnpm api-report --update` in AutomataFramework, the fixture files written by `writeContent`). The coordinator's rule
of 2026-11-14 (in the project's notes) says to run nothing locally, not even `pnpm typecheck`. Either the plan's line
stands for this cycle, or each made file comes from CI (for example, a check that prints the file it expects, which is
then committed). The plan is unchanged on this until the coordinator answers.
