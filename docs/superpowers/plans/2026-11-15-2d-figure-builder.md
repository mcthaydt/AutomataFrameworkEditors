# Plan G: The 2D Figure Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, in
> one session at a time, with no subagents (project rule). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the Characters editor's Figures part, a person makes a person, a four-legged animal or a free shape by
touch (its body and face, what it wears, its colours, its walk and stand, its poses, its views and its players'
colours), sees it at every step exactly as the game paints it, and saves the framework's own bytes into the game.

**Architecture:** A new page-side feature, `figures`, between `levels` and `find`. Every action is a pure function
from one **work** (the figure and the few files beside it that an action may touch) to the next, so undo, the find
bar, the tests and an agent's hand edit all meet in one place. The picture on screen is the framework's `paintFrame`
drawn one-to-one into a canvas and made bigger by a whole number, with handles and notes as page elements over it,
never on it. The screen is the Blueprint frame's own parts (pill, cluster, tools, panels, sheet, title block, notes,
find bar, tips, words) re-used, not copied. Saving widens the API's one-level save into one change of several files.

**Tech Stack:** Svelte 5 (runes), TypeScript strict, `@automataframework/framework` pinned by commit (its `headless`
entry on the API side), Cloudflare Pages Functions, Vitest (browser mode and journeys on Playwright), Biome, knip,
pnpm. **No new dependency.**

**Spec:** [`docs/superpowers/specs/2026-11-15-2d-figure-builder-design.md`](../specs/2026-11-15-2d-figure-builder-design.md).
Read it first; this plan argues from it. The file and painter it edits are the framework's plan R
(`docs/superpowers/plans/2026-11-15-rigged-figures.md` in AutomataFramework); the names this plan takes from it are
listed there under "For the editors" and here under each task's Consumes. Principles served: 5, 2 and 1.

## Before starting (three gates; nothing here is built until all three are open)

1. **The Owner has approved the mockups of all editors** (the Owner, 2026-11-15: "Do a mockup for all editors first
   before we do any code"). No task of this plan starts before that. Where the approved Characters mockup differs
   from the spec's drawings or from a layout in this plan, the mockup wins: amend this plan first, in its own small
   pull request with its own audit, as the zoom amendment was, and only then build.
2. **The Blueprint redesign's frame is on `main`**: its plan's Tasks 7 to 13, 15, 16 and 17 (the frame, panels that
   close and open, the notes, Save and Export, the first-visit tips, the find bar, the game's page, the problems
   shown in place, nine languages; 15 and 16 added by the audit, G-I7, since Task 4 here changes `GameHome` and every
   panel shows problems the way Task 16 does). This plan names those parts
   as that plan does (`Frame`, `Pill`, `Cluster`, `Switcher`, `ComingSoon`, `Panel`, `Sheet`, `TitleBlock`, `Tip`,
   `FindBar`, `commands.ts`, `layout.ts`'s `shapeOf` and `roomFor`, the pinch and two-finger helpers of the zoom
   amendment, `WORDS`). Before Task 1, read `main` and write into the tracker any part whose name or place differs;
   use the real one. Play (Task 17 here) also needs that plan's Task 19.
3. **The framework's plan R is on its `main`** as far as each pull request below says, and the pin has moved to it in
   a pull request of its own. Plan R's audit made its `automata.toml` writer (`listContent`, `automata add`) a Part 0
   built before its Part 1, because this plan's first pull request needs it (G-I1), and renamed two of its names
   that clashed on the public surface: a body plan is `BodyPlan` and a view is `FigureView`.

## Global Constraints

Every constraint of the Blueprint redesign plan's "Global Constraints" holds here unchanged (identity and the author
hook, nothing run locally, branches, the header, sizes, touch, colours, type, panels, motion, words, the languages'
order, "the canvas draws the game and nothing else", stop rules). In addition:

- **The picture is the framework's.** Every pixel of a figure on any screen comes from `paintFrame` or `paintFigure`.
  Nothing is smoothed, tinted, recoloured or redrawn. A view the file does not paint is never shown as if it were.
- **Whole-number zoom.** The figure's canvas holds one pose at its own size and is shown `s` times bigger, `s` a
  whole number from 1 to 32, with `image-rendering: pixelated`.
- **Every change has three ways in:** touch (a drag or a tap), buttons (each 44 px or more), and keys. A journey does
  each action once each way.
- **Words.** A person never reads "variant", "effector", "IK", "ramp", "atlas", "frame", "format", "bone", "rig",
  "kit" or "sheet" (add them to `tests/fixtures/banned.ts` for this feature's words). A variant is "colours for
  player 2"; a ramp is "a colour and its shades"; a place is "a hand"; a gait is "how it walks"; a stand is "how it
  stands". A slider's label is the framework's own sentence for it, translated. Every word added is added in all
  nine languages in the same task. Every name the framework gives that reaches a screen (each slider, face style,
  piece, gait, stand, the library palette's colours, bone and place) has its words by id, and a test walks the
  framework's own tables (`PERSON_SLIDERS`, `FACE_STYLES`, `LIBRARY_KIT`, `BONES`, `PLACES` and, from Task 14, the
  animal's) so a name a later pin adds fails CI until it has all nine (audit G-M1).
- **The editors' own rule widens, in writing** (audit G-I5). `CLAUDE.md` says an editor "opens, writes and exports
  only the content files (JSON) a game's `automata.toml` lists". This builder also writes the painted picture and
  atlas beside a figure (the Owner's earlier decision: pictures are committed and written by the editor's save) and
  one `[[content]]` block in `automata.toml` (the Owner's Q5: the builder makes new figures), written only by the
  framework's `listContent`. Task 2 changes that line of `CLAUDE.md` to say so, and nothing else in `automata.toml`
  is ever written.
- **A slider at its normal is not written.** "Back to normal" removes the key from the file.
- **What is saved is the framework's bytes:** content files by `writeContent`, pictures and atlases by `artFiles`,
  the `automata.toml` block by `listContent`. A test compares each.
- **The device keeps** nothing new but the unsaved work as a draft (`af.draft:…`, already allowed) and the tips'
  counts (`af.tip.*`).
- **Nothing assumes this project's repos.** The journeys use the fixture game and the pretend GitHub.
- **Tracker:** after each task, update `docs/superpowers/progress.md` (Cycle 4). Tasks 1 to 18 are 5% of stage 4
  each; the last 10% is the final green run and the review artifact.

## Rulings made by this plan (for the audit)

- **Who paints at save.** The page paints the pictures and sends them with the files; the API does not paint (a
  Pages Function's time is short, and a big figure's whole picture is the slowest thing the framework does). The API
  still trusts nothing: it writes every content file itself with `writeContent`, checks each picture's size against
  `figureSheet` and each atlas byte for byte against `atlasOf`, and checks that the whole game loads. A picture whose
  pixels are wrong is caught by the game's own `automata check` in its CI, as a hand-made one would be.
  **Audited and held** (G-I4), with three conditions written into Task 2: the API also checks each picture's colour
  table (PNG `PLTE` and `tRNS`) equals the one the painter would write for that figure and kit, which needs no
  painting and catches a picture recoloured outside its file; a change that alters other figures' pictures carries
  those pictures too (G-I3); and the ruling leans on the game's CI running `automata check`, which every game made by
  `automata create` does (`npm run check`) but Examples does not yet (plan D's Task 9.1 adds `artProblems` to its CI
  before any figure lands there).
- **Changing a walk's or a stand's numbers** changes a file of its own. For one of the framework's own, the builder
  first makes the game's copy, named `<figure>-walk` or `<figure>-stand`, points the figure at it and lists it; for
  the game's own it changes that file, and the save says which other figures use it. The same rule as the palette.
  Those other figures' pictures change too, so the save repaints them and carries them (G-I3).
- **Painting stays on the page's main thread.** One pose is painted on a change (`paintFrame`); strips paint one
  picture at a time when the page is idle; the whole picture is painted only to save or export. Moving it off the
  thread is a follow-up only if the Owner's review finds a lag that is felt.
- **Outfits** are not named sets (the spec): Copy this figure is how a second look is made.
- **First visit** follows the spec's own call ("Tap the hero's hat"); the Owner may change it at review.

## Review Focus

1. **A figure an agent wrote by hand** with keys in another order, sliders written at their normals, a piece the
   game no longer lists, or a pose past a limit: it opens, shows every field, shows the framework's sentence in the
   panel that holds the thing at fault, and saves back byte for byte when nothing is changed. (Task 3)
2. **A drag that ends outside the figure's reach or outside the canvas, or is cancelled** (a second finger lands, the
   page loses the pointer): the hand stops at its reach, no half-made change is kept, and undo has one step, not
   one a pixel. (Task 11)
3. **Two people changing the same figure or the shared palette:** the save answers `changed-elsewhere` for the file
   that moved, the person's work is kept as a draft, and nothing is half saved. (Task 2)
4. **A long name or a long translated label** (German, Russian) on a slider, a chip, a mode's word or a tab: nothing
   overlaps, shrinks or is cut at any of the five sizes. (Task 4, and each panel's task)
5. **A tiny figure and a huge one** (8 by 8 and 128 by 128, a 120-tall person): the canvas fits, handles are still
   44 px to hit and do not sit on top of each other (crowded handles fan out with a line to their joint), and the
   panels still open. (Tasks 4 and 11)

## File structure

Layers, lowest first: `words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`,
`levels`, `figures`, `find`, `suite`. Add `figures` to `LAYERS` and `PAGE_SIDE` in `tests/architecture/rules.ts` in
Task 3.

```
src/features/wire/wire.ts          (modify) ChangeAsk, ChangeFile, ChangeAnswer
src/features/service/change.ts     one change of several files, checked; save.ts's saveLevel calls it
src/features/game/change.ts        the page's side of it; work.ts: what a builder has open, its draft
src/features/figures/
  figures.ts            the entry
  work.ts               FigureWork, openWork, filesOf, picturesOf
  history.ts            startEdit, change, undo, redo, isDirty, describeChange
  edit-look.ts          sliders, face, paints, palette, outline, frame and tile
  edit-wear.ts          pieces, their colours and choices, order, a figure's own shapes
  edit-move.ts          gait and stand, and their numbers (the game's own copy)
  edit-pose.ts          poses: new, rename, erase, mirror, clear; a place moved; a joint nudged
  edit-views.ts         views; colours for players 2 to 4
  edit-free.ts          a free figure's blocks, rounds, paints and poses
  new-figure.ts         a new work from a starter, a copy or blank; an id from a name; give a character a picture
  shades.ts             a picked colour to a ramp of shades
  paint.ts              the framework's painter behind a small cache
  layout.ts             the whole-number zoom and where the figure sits at each shape
  handles.ts            where each handle is, which one a touch hits, and how crowded ones fan out
  FigureStage.svelte    the canvas, the ground strip, the handles and the notes layer
  Figures.svelte        the editor: modes, stage, panels, views, undo
  BodyPanel, FacePanel, ColoursPanel, WearPanel, PieceCard, LibraryTray, ShapesPanel,
  WalkPanel, StandPanel, ClipsStrip, PosesPanel, JointCard, PlayersPanel, ViewSwitch, NewFigure   (.svelte)
src/features/find/commands.ts      (modify) the builder's actions
src/features/suite/                (modify) CharactersScreen.svelte (new), Switcher, GameHome, route.ts, guide.ts, App.svelte
src/features/levels/ThingCard.svelte   (modify) "Change how it looks"
docs/commands.md                   (modify)
tests/fixtures/game/               (modify) rigged figures: a person, an animal; a palette; a piece of its own
tests/features/figures/, tests/features/service/change.test.ts, tests/journeys/figure-*.journey.test.ts
```

Test hooks: `[data-mode="look|move|pose|players|play"]` with `aria-pressed`; `[data-panel="body|wear|face|colours|walk|stand|poses|players|shapes"]`;
`[data-slider="<id>"]` holding `[data-less]`, `[data-more]`, `[data-normal]` and an `<input type="range">`;
`[data-piece="<id>"]`; `[data-swatch="<ramp>"]`; `[data-view="side|front|back"]`, `[data-turn]`;
`[data-figure]` on the canvas with `data-scale`, `data-pose`, `data-view`; `[data-place="<name>"]` on a handle with
`data-x`, `data-y`; `[data-joint="<bone>"]`; `[data-pose-pick="<id>"]`; `[data-player="1|2|3|4"]`.

## How the work is cut

| Pull request | Tasks | Needs of the framework's plan R | A person can |
|---|---|---|---|
| 1. The pin and one change of many files | 1, 2 | Parts 0 to 3 on `main` (Part 0 is `listContent`, which Task 2's `list` and Task 10's game copy of a walk need) | (nothing new on screen) |
| 2. Characters, a figure on screen, Body and Colours | 3 to 6 | the same | open a figure, change its body and colours, undo, save, export |
| 3. Wear and Face | 7 to 9 | the same | dress it, add a shape of its own, change its face |
| 4. Move and Pose | 10 to 12 | the same | set its walk and stand, make and mirror poses by handles and joint by joint |
| 5. Views, Players, animals and free shapes | 13 to 15 | Parts 4 and 5 (a second pin) | add front and back, set players' colours, make an animal or a free shape |
| 6. New figure, Play, the find bar, the first visit, every screen pictured | 16 to 18 | Part 6 (a third pin: `STARTERS`) | make a new figure, give a character a picture, play it, and be led in on a first visit |

Each pull request is one branch, opened as a draft, green in every job, with its review artifact published (the
redesign plan's "Review pictures", the five sizes) before it is reported finished.

---

## Pull request 1: the pin and one change of many files

### Task 1: Move the framework pin to plan R's Part 3

**Files:** `package.json` (the dependency and `pnpm.onlyBuiltDependencies`), `pnpm-lock.yaml`, `tests/fixtures/game/`
(a rigged `keeper` figure with pieces, a gait and a stand; `content/palettes/meadow.json`; `content/pieces/sash.json`;
their `automata.toml` blocks; the pretend GitHub's pictures made by `artFiles`, as the fixture's are today).

- [ ] **Step 1:** Write `tests/fixtures/game.test.ts`'s new lines first: the fixture loads, has a rigged figure, and
  its committed-by-`artFiles` pictures match.
- [ ] **Step 2:** Move the pin the way the redesign plan's Task 1 and 7b did (the three places; the lockfile's
  checksum by the one allowed `pnpm install --lockfile-only`). Push; every existing journey still passes.
- [ ] **Step 3: Commit** `chore: pin the framework to rigged figures (plan R, part 3)`

### Task 2: One change of several files

**Files:** Create `src/features/service/change.ts`, `src/features/service/changed.ts`, `src/features/game/change.ts`;
modify `wire/wire.ts`, `service/save.ts` (`saveLevel` becomes a caller), `service/approve.ts`, `service/waiting.ts`,
`service/service.ts` (the route), `github/repo.ts`, `api/api.ts`,
the pretend GitHub under `tests/fixtures/fake-github/`, and `CLAUDE.md` (the one line on what an editor writes; see
Global Constraints). Tests: `tests/features/service/change.test.ts`, `tests/features/game/change.test.ts`,
`tests/features/github/repo.test.ts`, `tests/features/service/changed.test.ts`, `tests/features/service/approve.test.ts`,
`tests/features/service/waiting.test.ts`, `tests/journeys/save-problems.journey.test.ts`.

**One rule for which files a change may touch** (audit G-I8, from the scenes audit's E1, Editors pull request 42).
Today `approve.ts` (step 2) and `waiting.ts` (`here`) allow a waiting change only when every path it touches is a
listed content file, so a Suggest-level save that carries a picture, an atlas or a new `[[content]]` block could be
sent but never approved. Make the rule once, in `service/changed.ts`, and have the save route, `approve.ts` and
`waiting.ts` all call it; the scenes builder and Feel take the same function, not copies:
```ts
/** Which of a change's paths an editor may write, judged against the game as it would be with the change in place. */
function allowedPaths(input: {
  before: { project: string; listed: readonly ContentRef[] } // the default branch's automata.toml and its list
  after: { project: string; listed: readonly ContentRef[] }  // the same, read from the change's head
  paths: readonly string[]
}): { ok: true } | { ok: false; refused: readonly string[] }
```
A path is allowed when it is a content file `after` lists; or a picture or atlas whose name is that of a figure or
backdrop `after` lists, beside it (`<id>.png`, `<id>.atlas.json`); or `automata.toml`, only when `after.project` is
exactly `listContent(before.project, added)` for the blocks `after` lists and `before` does not (nothing else in the
file changes, and nothing is taken away). `automata.access.toml` and every other path are refused, by name. An empty
change is refused. `approve.ts` then loads the whole game with the head's `automata.toml` and list when the change
writes it (step 4 today passes the default branch's), and `waiting.ts` shows a picture or atlas as a changed file
with no text diff. Tests: each kind allowed; a picture beside a file that is not listed, an `automata.toml` with one
other line changed, a block taken away and the sharing file each refused by name; a Suggest-level figure save with
its picture, atlas and new block is approved end to end against the pretend GitHub; every existing approve and
waiting test still passes.

**`repo.ts` has no way to do this today** (audit G-I2). Its one writer, `saveFile`, is GitHub's contents route: one
text file a commit. A figure's save is at least three files and one is a PNG. Add
`saveFiles(save: { branch; files: readonly { path; text?: string; base64?: string; version?: string }[]; message; author })`
on GitHub's git data routes: a blob for each file (`POST git/blobs`, the PNG as base64), one tree over the branch
head's tree (`POST git/trees` with `base_tree`), one commit (`POST git/commits`), and the branch moved to it without
force (`PATCH git/refs/heads/<branch>`, `force: false`). Before the tree, compare each given `version` with the
file's blob at the head (`changed-elsewhere` naming the paths); a ref move GitHub refuses because the branch moved
meanwhile is `changed-elsewhere` too, and nothing is half written, since nothing is on the branch until the ref moves.
The pretend GitHub serves those four routes. `saveLevel` keeps `saveFile`.

**Count GitHub calls** (audit G-I2). `wholeGameLoads` reads every listed file with one call each, and this change adds
a blob for each file written. A Cloudflare Pages Function on the free plan may make 50 calls out per request. The
pretend GitHub counts calls, and a test saves a figure into a game of 40 listed files and fails above 45; if it is
over, read the listed files through one `GET git/trees/<head>?recursive=1` and the blobs it names only for the files
the load needs, and say in the tracker which plan the editors' Pages project is on.

**Interfaces:**
- Produces, in `wire.ts`:
  ```ts
  type ChangeFile =
    | { kind: 'content'; type: ContentType; path: string; value: unknown; version?: string } // version left out: a new file
    | { kind: 'picture'; path: string; base64: string }
    | { kind: 'atlas'; path: string; text: string }
  interface ChangeAsk { game: GameRef; message: string; files: readonly ChangeFile[]; list?: readonly { type: ContentType; path: string; about?: string }[] }
  type ChangeAnswer = SaveAnswer & { changed?: readonly string[] }
  ```
  and on the page, `saveChange(api, game: OpenGame, ask: Omit<ChangeAsk, 'game'>): Promise<SaveResult>`.

The API, in order, refusing with the first that fails and writing nothing: the person may save (as `saveLevel`);
every `content` path is listed in the game's `automata.toml` as that type or is in `list`; `list` is added with the
framework's `listContent`; every content file's text is `writeContent(type, value)` and its id is its file's name;
every `version` given is still the file's on the default branch (`changed-elsewhere`, with the paths in `details`);
every `picture` and `atlas` sits beside a figure or backdrop in this change or in the game, the picture's PNG header
says the size `figureSheet` or `backdropSheet` gives, its colour table (`PLTE`, `tRNS`) is the one the painter writes
for that figure and kit (worked out from the file and kit, with no painting), and the atlas is byte for byte
`atlasOf`'s; every figure whose sheet the change alters (one that names a gait, stand, piece or palette the change
writes) has its picture and atlas in the change too, else `broken` naming the figure (G-I3); the whole game, with
the change laid over it, loads (`broken`, with the framework's sentences). Then one commit to `main` (Edit, Owner) or
one waiting change (Suggest, Approve), exactly as a level's save goes today. At most 24 files and 6 MB a change:
`bad-request` beyond.

- [ ] **Step 1: Write the failing tests** against the pretend GitHub: a figure, its picture, atlas and palette in one
  commit; a new figure with its `automata.toml` block; each refusal above writes nothing; Review Focus 3 (the palette
  moved under a save: `changed-elsewhere` naming it); the branch moved between the check and the ref (the pretend
  GitHub refuses the ref) is `changed-elsewhere` and the branch is as it was; a picture of the right size with one
  colour changed in its table is refused; a game gait changed without the other figure that walks with it is
  refused naming that figure; the call count above; a Suggest-level person gets one waiting change holding all the
  files; `saveLevel` still passes every test it has.
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green.**
- [ ] **Step 5: Commit** `feat(service): one change of several files, each checked`

---

## Pull request 2: Characters, a figure on screen, Body and Colours

### Task 3: The work, its history, and the Look edits

**Files:** Create `figures/figures.ts`, `work.ts`, `history.ts`, `edit-look.ts`, `shades.ts`; modify
`tests/architecture/rules.ts`. Tests: `tests/features/figures/work.test.ts`, `history.test.ts`, `edit-look.test.ts`,
`shades.test.ts`, `agent-parity.test.ts`.

**Interfaces:**
- Consumes (framework): `FigureFile`, `RiggedFigure`, `FreeFigure`, `isRigged`, `PaletteFile`, `GaitFile`,
  `StandFile`, `Character`, `GameContent`, `FigureKit`, `figureKit`, `PERSON_SLIDERS`, `FACE_SLIDERS`,
  `FACE_STYLES`, `lightness`, `writeContent`, `artFiles`, `parseContent` (not `ANIMAL_SLIDERS`, which is plan R's
  Part 5 and this plan's second pin: Task 14 takes it; audit G-I1).
- Produces:
  ```ts
  interface FigureWork {
    readonly figure: FigureFile
    readonly palette?: PaletteFile      // only once a change touched it
    readonly gait?: GaitFile            // the game's own copy, once a number changed
    readonly stand?: StandFile
    readonly character?: Character      // only when "Give a character this picture" set it
    readonly isNew: boolean             // not yet in automata.toml
  }
  openWork(content: GameContent, figureId: string): FigureWork
  kitFor(content: GameContent, work: FigureWork): FigureKit            // the game's kit with the work's files over it
  filesOf(content: GameContent, opened: FigureWork, now: FigureWork): Omit<ChangeAsk, 'game' | 'message'>
  problemsOf(content: GameContent, work: FigureWork): readonly { panel: string; message: string }[]
  interface Edit { readonly opened: FigureWork; readonly now: FigureWork; readonly past: readonly FigureWork[]; readonly future: readonly FigureWork[] }
  startEdit(work): Edit;  change(edit, next: FigureWork, merge?: string): Edit;  undo(edit): Edit;  redo(edit): Edit
  isDirty(edit): boolean;  describeChange(edit): string
  type Done = { ok: true; work: FigureWork } | { ok: false; why: string }   // `why` is a key of WORDS
  setSlider(work, id: string, value: number | undefined): Done
  surprise(work, random: () => number): Done
  setFace(work, key: string, value: string | number | undefined): Done
  setPaint(work, name: string, ramp: string): Done
  setOutline(work, outline: 'dark' | 'ink' | undefined): Done
  addColour(content, work, name: string, colour: string): Done
  shadesOf(colour: string): readonly string[]
  ```

`change` with the same `merge` word as the step before it replaces that step, so a slider dragged across is one undo
(`merge` is `slider:<id>`, `place:<pose>:<name>` and so on; a `pointerup` ends it). `filesOf` gives only what differs
from `opened`, each content file with the version it was opened at, the figure's picture and atlas from `artFiles`,
and `list` for a new file. When the work changes a file other figures use (the game's palette, gait or stand), the
picture and atlas of **every** figure whose `artFiles` bytes change go in too (audit G-I3): `filesOf` paints the game
with the work laid over it and keeps each picture that differs from the one the game has, so the save never leaves
another figure's picture older than its file (which `automata check` would fail). Over the API's 24 files or 6 MB,
`filesOf` says so before anything is sent (`problemsOf` gives "This change repaints too many pictures to save at
once"). `problemsOf` runs the framework's own reading and checks on the work laid over the game
and files each sentence under the panel whose field it names. `shadesOf` makes five shades from one colour: the
colour itself the middle one, two darker and two lighter by fixed steps of lightness with the hue turned a little
toward blue in the dark and toward yellow in the light (as the framework's own ramps go), each strictly lighter than
the last by the framework's `lightness`; `addColour` writes them to the palette (the game's own copy of the
framework's palette, named for the game, when it had none). `describeChange` is the one line a save's message
starts from ("Keeper: longer legs, a new hood").

- [ ] **Step 1: Write the failing tests:** each edit's file change, written as the JSON before and after; a slider
  set to its normal or to `undefined` leaves no key; `surprise` with a fixed `random` stays inside every range and is
  one undo; `setPaint` refuses a ramp the palette lacks; `addColour` gives a palette `PaletteSchema` reads; undo and
  redo through twenty mixed changes return to the same bytes; Review Focus 1 (`agent-parity`: four hand-written
  figures open, `filesOf` with no change is empty, and `writeContent` of the opened figure is the file's bytes);
  `filesOf` after one slider holds exactly the figure, its picture and its atlas, equal to `writeContent` and
  `artFiles`.
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green.**
- [ ] **Step 5: Commit** `feat(figures): a figure's work, its history, and every change to how it looks`

### Task 4: The figure on screen, in the Characters frame

**Files:** Create `figures/paint.ts`, `layout.ts`, `FigureStage.svelte`, `Figures.svelte`, `ViewSwitch.svelte`,
`suite/CharactersScreen.svelte`; modify `suite/Switcher`, `suite/route.ts`, `suite/App.svelte`, `suite/GameHome`,
`levels/ThingCard.svelte`, `words/*`. Tests: `tests/features/figures/layout.test.ts`, `paint.test.ts`,
`stage.browser.test.ts`, `tests/journeys/figure-open.journey.test.ts`, `screens.journey.test.ts`.

**Interfaces:**
- Consumes: `paintFrame`, `paintFigure`, `figurePoses`, `frameName`; the frame's parts (gate 2).
- Produces:
  - `framePixels(work, kit, pose: string, view: FigureView, player: number): ImageData` (cached by the work's identity,
    pose, view and player; the cache holds 64),
  - `fitFigure(room: { w: number; h: number }, frame: { w: number; h: number }): { scale: number; x: number; y: number }`
    (the biggest whole `scale` from 1 to 32 that leaves 24 px round the figure; never under 1), `stepZoom(scale, by)`,
  - the route `#/<owner>/<name>/characters/<figure>`; `CharactersScreen` (the frame with Characters chosen, the
    second row of tabs: Figures working, "Clips and kinds" and "Schematic" as `ComingSoon`); the pill reading the
    game's and the figure's names; a Characters list on the game's page (each figure with its `idle-1` picture);
    "Change how it looks" on a picked thing's card, and Back returning to the level with the thing still picked.

The stage, by shape (`shapeOf`): `wide` and `mid` put the modes on the left edge, the panels on the right, the views
bottom left; `narrow` puts the modes along the bottom, the panels in one `Sheet` with a tab a panel that covers at
most the lower third, and the views in the pill's row. The figure keeps at least 160 px of height at every size.
Under its feet is a strip of the level's own ground at the game's tile size (from the start level's art, through
`loadLevelArt`), and beside it, at `wide` only, the figure at the size it has in that level. The pixel grid and the
dashed edge of the picture are drawn in the notes layer and go with Drawing notes. Pinch changes the zoom by whole
steps and two fingers move the figure, with the zoom amendment's helpers; `+`, `-` and `0` do the same.

- [ ] **Step 1: Write the failing tests:** `fitFigure` at the five sizes for 8 by 8, 32 by 40 and 128 by 128 frames
  (Review Focus 5's first half); the canvas's pixels equal `paintFrame`'s, read back in a real browser at scale 1 and
  shown at a whole `data-scale`; the journey: open the demo game as a visitor, press Characters, see the keeper, turn
  it, pinch and step the zoom, close and open each panel's shell, go back to World; from World, pick the keeper,
  "Change how it looks", Back, and the keeper is still picked; a view the file does not paint is not offered;
  nothing scrolls on a phone held upright; Review Focus 4 for the modes and tabs in German and Russian.
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green; pictures on `ci-screens`.**
- [ ] **Step 5: Commit** `feat(figures): a figure on screen in the Characters frame, as the game paints it`

### Task 5: Body

**Files:** Create `figures/BodyPanel.svelte`, `handles.ts` (the body's four handles only); modify `Figures.svelte`,
`FigureStage.svelte`, `words/*`. Tests: `tests/features/figures/body.browser.test.ts`,
`tests/journeys/figure-body.journey.test.ts`.

**Interfaces:**
- Consumes: Task 3's edits; `PERSON_SLIDERS` (`group`, `normal`, `min`, `max`, `about`); `placeBones`.
- Produces: `BodyPanel` (props `work`, `onchange(done: Done, merge: string)`); `bodyHandles(work, kit, view): readonly { slider: string; x: number; y: number; axis: 'x' | 'y' }[]`.

The first three sliders show (`group` "body": height, build, legs); **More** opens the other groups folded, in the
table's order, each group a row that opens. Each slider is its sentence as its label, the range, `-` and `+` (a step
of 0.05, 1 for `height` and `headTilt`), its number in the measure face, and "Back to normal" when it is not at its
normal. Arrow keys step a focused slider. **Surprise me** sits at the panel's foot. With Body open the stage shows
four handles (top of the head: `height`; a shoulder: `shoulders`; a hip: `hips`; a foot: `legs`), each a 44 px
target with a note naming the slider and its number while it is dragged; a drag is one undo.

- [ ] **Step 1: Write the failing tests and the journey:** move `legs` by drag, by `+` and by the arrow key and read
  the same file change each way; the figure repaints (the canvas's pixels differ and equal `paintFrame` of the new
  work); "Back to normal" removes the key; More opens and folds; Surprise me then undo restores the bytes; the head
  handle changes `height` and stops at the frame's limit with the framework's sentence shown in the panel; forty
  sliders are never on screen at once (at most three before More, at most one group open on a phone).
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green.**
- [ ] **Step 5: Commit** `feat(figures): the Body panel and the body's handles`

### Task 6: Colours, undo, the draft, Save and Export

**Files:** Create `figures/ColoursPanel.svelte`, `game/work.ts` (the draft); modify `Figures.svelte`,
`CharactersScreen.svelte`, `game/draft.ts` if its key needs a kind, `words/*`. Tests:
`tests/features/figures/colours.browser.test.ts`, `tests/journeys/figure-save.journey.test.ts`.

**Interfaces:**
- Consumes: `saveChange` (Task 2), `filesOf`, `describeChange`, the frame's Save, Export, stamps and Leave.
- Produces: `ColoursPanel`; `keepWork(store, game, work)`, `takeWork(store, game, figureId)`, `dropWork(…)` under
  `af.draft:<owner>/<name>:<path>`, the figure file's path, the shape `game/draft.ts` already uses for a level (a
  new figure has its path from the start; audit G-M2), so `CLAUDE.md`'s list of what the device keeps needs no new
  shape; `figureCopy(work): { text: string; png: Blob }`.

Colours: each of the palette's colours is a row, its name and its shades together as one 48 px swatch. A person
touches a named colour of the figure (in a list at the panel's top: Skin, Hair, Eyes, then each piece's; or on the
figure itself, where the touched pixel's part says which) and then a swatch. **Add a colour** opens the page's own
colour input and a name; the panel shows the five shades it will make before it is added. **Edge round the figure**
is three choices. Save writes `filesOf` through `saveChange` with the frame's stamps and problems unchanged; a save
that changes the palette or a shared walk says first which other figures it changes and asks once. Export copies the
figure's file for the person's agent and offers the picture as a PNG to keep; the stamp says EXPORTED. Undo and redo
are the frame's two buttons and the keys the level screen uses.

- [ ] **Step 1: Write the failing tests and the journey:** set the skin by list and by touching the figure; add a
  colour and use it; as a visitor, Export and read the clipboard (the bytes are `writeContent`'s) and the PNG (the
  bytes are `artFiles`'s); as an Owner, Save, and the pretend GitHub holds one commit with the figure, its picture
  and atlas (and the palette when it changed); as a Suggest-level person, one waiting change; reload mid-change and
  the draft comes back; `changed-elsewhere` keeps the draft and says what to do; undo and redo by button and key.
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green; publish the review artifact.**
- [ ] **Step 5: Commit** `feat(figures): colours, the draft, Save and Export`

---

## Pull request 3: Wear and Face

### Task 7: What it wears

**Files:** Create `figures/edit-wear.ts`, `WearPanel.svelte`, `PieceCard.svelte`, `LibraryTray.svelte`. Tests:
`edit-wear.test.ts`, `wear.browser.test.ts`, `tests/journeys/figure-wear.journey.test.ts`.

**Interfaces:**
- Consumes: `FigureKit.pieces`, `PIECE_KINDS`, `PieceFile` (`about`, `kind`, `choices`), `paintFrame`.
- Produces: `wear(work, kit, piece: string, hand?: 'left' | 'right'): Done`, `takeOff(work, piece): Done`,
  `setPiece(work, piece, to: { paint?: string; trim?: string; hand?: 'left' | 'right'; choices?: Record<string, string> }): Done`,
  `bringForward(work, piece): Done`, `sendBack(work, piece): Done`,
  `pieceThumb(kit, work, piece: string): ImageData` (this figure wearing only that piece over what it has on).

The panel is a row of chips with pictures in the order they are drawn, and **Add**. A chip opens its card: its colour
and second colour (swatches), the piece's own choices as `Choice`s with the options' translated names, which hand
for a held thing, Bring forward, Send back, Take off. Add opens the tray: tabs by kind in `PIECE_KINDS`' order, the
game's own pieces first under "This game's", each piece a 96 px picture from `pieceThumb` with its translated name;
a search box filters by name; thumbs paint one at a time when the page is idle. Wearing a second piece of a kind that
holds one hand's thing in a taken hand asks which to keep. The library's names are in `words/` by id
(`piece.tunic`); a game's own piece shows its id as written.

- [ ] **Step 1: Write the failing tests and the journey:** each edit's file change; wear a hood from the tray by
  touch and by keys; change its colour; take it off; order two pieces and see the picture change; a held lantern
  moves hand; the tray's first tab lists the fixture game's `sash` under "This game's"; every library piece has a
  name in all nine languages (a test walks `LIBRARY_KIT.pieces`); Review Focus 4 on the chips.
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green.**
- [ ] **Step 5: Commit** `feat(figures): the Wear panel and the library's tray`

### Task 8: A shape of its own on the body

**Files:** Create `figures/ShapesPanel.svelte`; modify `edit-wear.ts`, `handles.ts`, `WearPanel.svelte`. Tests:
`edit-wear.test.ts`, `tests/journeys/figure-wear.journey.test.ts`.

**Interfaces:** Produces `addShape(work, on: string, shape: 'block' | 'round'): Done`,
`changeShape(work, id, to: Partial<{ x; y; w; h; turn; paint; on }>): Done`, `eraseShape(work, id): Done`,
`boneAt(work, kit, pose, view, x, y): string | undefined` (which part of the body a touch is on).

"Add your own shape" asks the person to touch a part of the body (the note says "On the chest"), then puts a 3 by 3
block there in the trim colour, picked, with handles to move, size and turn it, the same buttons and keys the level
screen's picked thing has, and Erase. The framework's limit is refused before it happens ("A figure can have 16
shapes of its own").

- [ ] **Step 1: Tests and journey:** add a badge on the chest, move it by drag, buttons and keys, size and turn it,
  colour it, erase it; the seventeenth is refused with the sentence. **Steps 2 to 4** as above.
- [ ] **Step 5: Commit** `feat(figures): a shape of your own on a part of the body`

### Task 9: Face

**Files:** Create `figures/FacePanel.svelte`; modify `Figures.svelte`. Tests: `face.browser.test.ts`,
`tests/journeys/figure-wear.journey.test.ts`.

**Interfaces:** Consumes `setFace`, `FACE_STYLES`, `FACE_SLIDERS`, `paintFrame`.

Eyes, brows and mouth are rows of pictures (each style painted on this figure's head, shown eight times bigger);
then the face's sliders, folded like the body's. The head is drawn big at the panel's top in the front view when the
figure paints it, else the side.

- [ ] **Step 1: Tests and journey:** pick each style by touch and keys; a slider; the big head's pixels are the
  framework's. **Steps 2 to 4** as above; **publish the review artifact.**
- [ ] **Step 5: Commit** `feat(figures): the Face panel`

---

## Pull request 4: Move and Pose

### Task 10: How it walks and stands

**Files:** Create `figures/edit-move.ts`, `WalkPanel.svelte`, `StandPanel.svelte`, `ClipsStrip.svelte`. Tests:
`edit-move.test.ts`, `move.browser.test.ts`, `tests/journeys/figure-move.journey.test.ts`.

**Interfaces:**
- Consumes: `FigureKit.gaits`, `FigureKit.stands`, `GAIT_NUMBERS`, `figurePoses`, `Character.clips`.
- Produces: `setGait(work, id: string | undefined): Done`, `setStand(work, id: string | undefined): Done`,
  `setGaitNumber(content, work, step: 'walk' | 'run' | 'trot', id: string, value: number): Done`,
  `setStandNumber(content, work, id: 'breath' | 'shift' | 'pictures', value: number): Done`,
  `clipsOf(content, figureId): readonly { character: string; clip: Clip }[]`.

Walk: the figure walks on the spot at 8 pictures a second (or along the ground strip with "Walk across"), a row of
the kit's gaits as choices with translated names, then the step's numbers as sliders labelled with the framework's
sentences; a number changed repaints the walk while it plays; the pictures it makes are a strip under it and a touch
on one stops there. A run or trot has its own tab when the gait has one. Stand: the kit's stands as pictures of this
figure standing each way, then "How much it breathes" and "How much it shifts". Changing a number follows the ruling
above (`setGaitNumber` makes and lists `<figure>-walk` the first time, through Task 2's `list`, which is plan R's
Part 0 `listContent`; a second change to the game's own gait repaints every figure that walks with it, Task 3's
`filesOf`, and the save names them first). Watch its clips: a strip of
`clipsOf`; a touch plays that clip on the figure at its own speed and changes nothing; "Change the clips" is a
`ComingSoon` link. Motion honours reduced motion: the walk does not start by itself, and Play walk is a button.

- [ ] **Step 1: Tests and journey:** choose Strut; make the steps longer and read a new `content/gaits/keeper-walk.json`
  in `filesOf` with its `list` entry; a second change edits the same file; choose a stand; watch the hero's `run`
  clip; the strip's pictures are the framework's `walk-1` to `walk-n`. **Steps 2 to 4** as above.
- [ ] **Step 5: Commit** `feat(figures): Move, how it walks and stands`

### Task 11: Poses by hands, feet, head and hips

**Files:** Create `figures/edit-pose.ts`, `PosesPanel.svelte`; modify `handles.ts`, `FigureStage.svelte`. Tests:
`edit-pose.test.ts`, `handles.test.ts`, `pose.browser.test.ts`, `tests/journeys/figure-pose.journey.test.ts`.

**Interfaces:**
- Consumes: `PLACES`, `placeBones`, `solvePose`, `reachOf`, `skeletonOf`, `posesOf`.
- Produces: `newPose(work, from: string, name: string): Done`, `renamePose(content, work, id, name): Done`,
  `erasePose(content, work, id): Done` (refused, naming the clips, when a character's clip plays it),
  `mirrorPose(work, id): Done`, `clearPose(work, id): Done`,
  `movePlace(work, kit, pose: string, place: string, to: { x: number; y: number }, view: FigureView): Done & { stopped?: boolean }`,
  `turnPlace(work, pose, place, by: number): Done`,
  `poseHandles(work, kit, pose, view, scale): readonly { place: string; x: number; y: number; at: { x: number; y: number } }[]`,
  `hitHandle(handles, x, y): string | undefined`.

`movePlace` in the side view writes the place's `x` and `y`; in the front or back view it writes `out` and `y`. Plan
R's audit made a place's numbers **units from the hips** (a unit is the figure's height ÷ 24), not frame pixels, so a
pose survives a change of height or legs in Look (audit G-I6): `movePlace` turns the touch's screen point into the
frame's pixels by the zoom, then into units from the hips' standing point, and writes those, rounded to one decimal.
A
point past the reach is brought back to the reach along the same line and `stopped` is true (the note says "RIGHT
HAND, as far as it goes"); a point the framework still refuses leaves the work as it was. `poseHandles` puts each
handle on its place; where two would be closer than 44 px on screen they fan out round their middle with a thin line
(in the notes layer) to the joint each belongs to (Review Focus 5). A drag is one undo; a second finger or a lost
pointer puts the place back where the drag began (Review Focus 2). Arrow keys move a focused handle one pixel of the
figure; `[` and `]` turn it. The Poses panel lists the figure's own poses with pictures, then the walk's and the
stand's (shown, marked "From Move", not changed here); the chosen pose is drawn with the figure standing faint under
it (two canvases, never a tint on one); the other views show beside it as small pictures. New pose, Mirror, Back to
standing, Rename, Erase.

- [ ] **Step 1: Tests and journey:** each edit's file change; a new pose, the right hand dragged up in Side then out
  in Front, the small pictures following; a drag past reach stops and writes the reach; a cancelled drag writes
  nothing; mirror swaps left and right in the file; erase is refused while the hero's clip plays it, naming the
  clip; a handle by keys; fanned handles on an 8 by 8 figure are all hittable; every handle is 44 px.
- [ ] **Step 2: Push; red.** **Step 3: Implement.** **Step 4: Push; green.**
- [ ] **Step 5: Commit** `feat(figures): poses made by moving hands, feet, head and hips`

### Task 12: Joint by joint

**Files:** Create `figures/JointCard.svelte`; modify `edit-pose.ts`, `PosesPanel.svelte`, `FigureStage.svelte`.
Tests: `edit-pose.test.ts`, `tests/journeys/figure-pose.journey.test.ts`.

**Interfaces:** Consumes `BONES`, `LIMITS`, `limitProblem`. Produces
`nudgeJoint(work, pose, bone: string, which: 'bend' | 'out', by: number): Done` (held to the limit; a joint a place
already moves is offered "Move it by hand instead", which takes the place away and keeps the joint's solved bends).

Touching a joint, or picking it from the panel's list of translated names ("Left elbow"), opens its card: "Bends
forward 20°" and "Bends out 5°", each with `-` and `+` (5 degrees; 1 with Shift or a long press) and the limit shown
as the slider's ends.

- [ ] **Step 1: Tests and journey:** nudge the left elbow by buttons and keys; the limit stops it; a placed hand's
  elbow offers the hand-over and the file then holds bends and no place for that arm; every bone has a name in nine
  languages. **Steps 2 to 4**; **publish the review artifact.**
- [ ] **Step 5: Commit** `feat(figures): poses joint by joint`

---

## Pull request 5: Views, Players, animals and free shapes

### Task 13: The second pin, front and back, and players' colours

**Files:** the pin (as Task 1) to plan R's Part 5; create `figures/edit-views.ts`, `PlayersPanel.svelte`; modify
`ViewSwitch.svelte`, `Figures.svelte`. Tests: `edit-views.test.ts`, `tests/journeys/figure-views.journey.test.ts`.

**Interfaces:** Produces `addViews(work): Done` (side, front and back), `removeView(work, view): Done`,
`setPlayerPaint(work, player: 2 | 3 | 4, name: string, ramp: string | undefined): Done`,
`setPlayerPiece(work, player, piece: string, to: { paint?: string; trim?: string } | undefined): Done`.

"Add front and back views" sits where the missing views would be. Players shows the figure four times, one a player;
touching a colour on player 2's figure and then a swatch sets it for player 2 only; only what differs is written;
"Same as player 1" removes it. A player's variant is made when first needed, named `two`, `three`, `four`, with the
ones before it.

- [ ] **Step 1: Tests and journey:** add the views and see three; a pose dragged in Front; player 2's hair; "Same as
  player 1" leaves no variant behind; the save's picture has the frames `two/front/idle-1`. **Steps 2 to 4.**
- [ ] **Step 5: Commit** `feat(figures): front and back views, and colours for players 2 to 4`

### Task 14: Animals

**Files:** Modify `BodyPanel`, `FacePanel`, `WearPanel`, `handles.ts`, `edit-pose.ts`, `words/*`,
`tests/fixtures/game/` (a `critter`). Tests: `tests/journeys/figure-animal.journey.test.ts`, the unit tests of each.

**Interfaces:** Consumes `ANIMAL_SLIDERS`, `ANIMAL_FACE_STYLES`, the animal's `PLACES`, `BONES`, pieces and gaits.

Everything is driven by the framework's tables, so this task is the animal's first three sliders (length, height,
legs), its body handles (the shoulder: `height`; the rump: `length`; a foot: `legs`; the tail's end: `tail`), its
face (eyes, nose, mouth), its places (four feet, head, hips, tail), its names in nine languages, and a walk through
every panel with the critter.

- [ ] **Step 1: Journey first:** the critter through Body, Wear (a collar), Face, Colours, Move (Trot), Pose (a paw
  lifted, sit) and Save. **Steps 2 to 4.**
- [ ] **Step 5: Commit** `feat(figures): four-legged animals in every panel`

### Task 15: Free shapes

**Files:** Create `figures/edit-free.ts`; modify `ShapesPanel.svelte`, `ColoursPanel.svelte`, `PosesPanel.svelte`,
`Figures.svelte`. Tests: `edit-free.test.ts`, `tests/journeys/figure-free.journey.test.ts`.

**Interfaces:** Produces `addPart`, `changePart`, `orderPart`, `erasePart`, `setFreePaint`, `addFreePaint`,
`moveInPose(work, pose, part, by: { dx?; dy?; turn? })`, `newFreePose`, `eraseFreePose`, each `(work, …): Done`.

A free figure has Look (its blocks and rounds in a list and on the figure, moved, sized, turned, ordered and
coloured like Task 8's shape; its paints are plain colours, picked with the page's colour input), Pose (a part moved
or turned in a pose) and Players. Move says "A free shape has no walk. Make its pictures in Pose." The demo's crate
and the template's hero open here.

- [ ] **Step 1: Tests and journey:** the fixture's crate: add a round, move it three ways, a new pose, player 2's
  colour, save; the bytes are format 1 and the picture is `artFiles`'s. **Steps 2 to 4**; **publish the review
  artifact.**
- [ ] **Step 5: Commit** `feat(figures): free shapes`

---

## Pull request 6: New figure, Play, the find bar, the first visit, every screen pictured

### Task 16: The third pin, New figure, and a character's picture

**Files:** the pin to plan R's Part 6; create `figures/new-figure.ts`, `NewFigure.svelte`; modify `GameHome`,
`ThingCard.svelte`, `work.ts`. Tests: `new-figure.test.ts`, `tests/journeys/figure-new.journey.test.ts`.

**Interfaces:** Consumes `STARTERS`, `listContent` (through the API's `list`). Produces
`idFrom(name: string, taken: readonly string[]): string`, `newWork(content, what: 'person' | 'animal' | 'free', from: { starter: string } | { copy: string } | 'blank', name: string): FigureWork`,
`giveFigure(content, work, character: string): Done`.

New figure (the game's page, the Characters list, the find bar) asks what it is with three pictures, then where to
start (this game's figures, the framework's starters for that body, or blank), then its name. A character with no
figure has "Give it a picture" on its card and in the list, which does the same and sets its `figure`. Saving sends
the figure, its picture and atlas, the `list` entry (path `content/figures/<id>.json`, the folder the game's other
figures are in when it has any) and the character when it changed. Copy this figure is New figure from a copy.

- [ ] **Step 1: Tests and journey:** a person from a starter, an animal from blank, a shape from a copy; the saved
  `automata.toml` is `listContent`'s bytes and the game loads; a name already taken gets `-2`; a visitor may make one
  on the demo game and Export it; "Give it a picture" on a box character then shows it in the level. **Steps 2 to 4.**
- [ ] **Step 5: Commit** `feat(figures): New figure, and giving a character a picture`

### Task 17: Play, and every action in the find bar

**Files:** Modify `Figures.svelte` (the Play mode), `levels/play.ts` if it needs to take content with unsaved files
laid over it, `find/commands.ts`, `docs/commands.md`, `words/*`. Tests: `tests/features/find/commands.test.ts`,
`tests/journeys/figure-play.journey.test.ts`.

**Interfaces:** Consumes the redesign's Play (its Task 19) and `FindBar`. Produces the commands, each a plain name,
the same function a button calls, and a line in `docs/commands.md` with the file change it makes: New figure, Make
the legs longer, Make the legs shorter (and so for each of the first three sliders), Surprise me, Wear a …, Take off
the …, Change the skin colour, Add a colour, Walk like …, Make the steps longer, Stand with …, New pose, Move the
right hand up, Mirror this pose, Show the front, Turn to face left, Colours for player 2, Edge round the figure,
Play.

Play opens the game's first level that has a character drawn from this figure and plays it from the work laid over
the game, unsaved changes included; Stop returns. A figure no character uses says "No character uses this picture
yet" and offers "Give a character this picture".

- [ ] **Step 1: Tests and journey:** change the hood's colour, Play, and the level's canvas shows the new colour
  before any save; Stop; every command runs from the find bar by keys alone; the test that fails on a find-bar
  action missing from `docs/commands.md` passes. **Steps 2 to 4.**
- [ ] **Step 5: Commit** `feat(figures): Play, and every action by name`

### Task 18: The first visit, every screen pictured, and the docs

**Files:** Modify `suite/guide.ts`, `Tip`, `words/*`, `tests/journeys/screens.journey.test.ts`,
`tests/journeys/first-run.journey.test.ts`, `README.md`, `CLAUDE.md` (the device's list is unchanged; the feature
list gains `figures`), `docs/superpowers/progress.md`.

The first time Characters opens on the demo game: the hero, big, in Look, one tip, "Tap the hero's hat" (the piece
of kind `hat`, else the first piece it wears), then "Pick a colour"; the hero then walks on the spot in its new
colour, and the last tip is "Press Export" for a visitor or "Press Save" for someone signed in, as World's ends.
While the demo's hero has no figure, the visit starts one step earlier: "Give the hero a picture", A person, a
starter, then the same. The tips count as World's do. The journey holds the spec's "under a minute"
by counting: the change is made in four presses, with no wait longer than one repaint.

Every screen state of the builder joins the screens journey at the five sizes (each mode, each panel open, the tray,
a card, a handle mid-drag, the joint card, Players, New figure's three steps, a problem shown in a panel, the empty
"No character uses this picture yet"), and the review artifact for the Owner is published from them, saying plainly
whether they show the final look.

- [ ] **Step 1: Journeys first** (the first visit as a visitor and as an Owner, with and without a hero figure).
- [ ] **Step 2: Push; red.** **Step 3: Implement and write the docs.** **Step 4: Push; green in every job.**
- [ ] **Step 5: Commit** `feat(figures): the first visit, every screen pictured, and the docs`
- [ ] **Step 6:** Publish the artifact; report to the coordinator; update the tracker to stage 4 at 100%.

---

## After the build (stages 5 and 6)

As the redesign plan's: two audits of every screen (drunk-grandma UI and UX; visuals), then fixes, then the Owner's
review with the pictures.

## Self-review (done while writing)

- **Spec coverage:** the frame, tabs, pill, the Characters list and "Change how it looks" (Task 4); iPad and phone
  layouts (Task 4, each panel's journey at five sizes); Look's Body (5, 14, 15), Wear (7, 8), Face (9), Colours (6);
  Move (10); Pose (11, 12); Players and views (13); Play (17); New figure and "Give it a picture" (16); saving,
  exporting, problems, undo and the draft (2, 3, 6); the find bar and `docs/commands.md` (17); the first visit (18);
  words and nine languages (every task); unit tests, byte checks and agent parity (3 and each edit's task); journeys
  (every task); the Owner's pictures (each pull request's artifact, 18). The spec's "left to the builder": zoom steps
  (Task 4), first sliders and groups (Task 5, from the framework's table), handles (Tasks 5 and 11), the tray's order
  and search (Task 7), the main thread (rulings), the cut (the table).
- **Not here, by the spec:** clips, behaviour, the hero's move switches, movement numbers, 3D, importing a picture.

## Plan audit (2026-11-15)

Audited in [`audits/2026-11-15-2d-figure-builder-plan-audit.md`](../audits/2026-11-15-2d-figure-builder-plan-audit.md).
The fixes are in this page: the first pull request needs plan R's new Part 0 (`listContent`), and the names each
task takes are on plan R's parts that come before it (G-I1); a commit of several files is new GitHub work through the
git data routes, with the calls counted (G-I2); a save repaints and carries every figure a shared file changes
(G-I3); the API also checks each picture's colour table, and the ruling that the page paints is held (G-I4); the
editors' own rule on what they write is widened in `CLAUDE.md` (G-I5); one shared `allowedPaths` decides which
files a save, an approval and the waiting list accept, so a waiting figure save can be approved (G-I8); a pose's places are units from the hips
(G-I6); the redesign's Tasks 15 and 16 join gate 2 (G-I7); and the minor ones. The games' art is in Lospec's DUEL
palette (the Owner, 2026-11-15), so on the demo game "Add a colour" offers the library's DUEL ramps only (G-M3).
