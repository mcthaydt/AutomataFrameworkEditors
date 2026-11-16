# The World Editor (the shell, Levels and the world map) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (the shared rules). Tests are never run locally: a
> "push" step means push the draft pull request and wait for GitHub-hosted CI, once, without watching.

**Goal:** Build the approved shell and World's Levels part and world map in AutomataFrameworkEditors, so a person opens
a game on an iPad, changes its levels and its map by touch, plays them in place and puts the changes in the game.

**Architecture:** The approved mockups are rebuilt as Svelte 5 components over plain functions. Everything a person may
change is held as values (`Working`: the levels, the world file, the project file's text) with one undo history; every
action is a pure function from one `Working` to the next. The level is drawn by the editor's one Pixi canvas with the
framework's own art, the editor's marks are an SVG layer above it, and play is the framework's `startGame` in the same
box. Putting changes in is one API call that writes every changed file in one change.

**Tech stack:** Svelte 5, TypeScript 6 (strict), Pixi 8, `@automataframework/framework` (pinned to a commit), Zod,
smol-toml (already a dependency), Cloudflare Pages Functions, Vitest 5 (Node, three browser engines, journeys with Playwright).

**Spec:** [`docs/superpowers/specs/2026-11-16-world-editor-design.md`](../specs/2026-11-16-world-editor-design.md).
The look is [`docs/design-language.md`](../../design-language.md). The pictures are `docs/mockups/shell-*.html` and
`docs/mockups/world-levels*.html`, `world-map*.html` (board v17). The shared rules are AutomataFramework's
`docs/rules.md`. This is stage 2 of the World editor cycle, written 2026-11-16 (Fable 5.2, medium). It plans this slice
only: no Tiles part, no Scenes part, no other editor.

**Revised 2026-11-16 after the plan audit** ([`audits/2026-11-16-world-editor-plan-audit.md`](../audits/2026-11-16-world-editor-plan-audit.md),
pull request 76) and the Owner's two answers (below). All 26 of the audit's findings are
fixed in this page; the last section, "The audit's findings, and where each is fixed", says where. Tasks keep their
numbers; a task added by the revision has a letter (Tasks 2a, 2b and 42a, and the framework's F4 and F5 and the test
game's E4).

## What is on main (read on 2026-11-16)

Editors `main` at `7efb826`; the framework pinned at `9109fa3`; the framework's `main` at `596348d`.

| Fact | What the plan does about it |
|---|---|
| The framework's `main` already has Plan W pull request 1: a thing's `values`, `ValueDeclaration`, `withDefaults`, `shownOf`, `one-per-level`, `WorldFile`, `layoutWorld`, `openTile`. The pin is older. | **Pin 1** (Task 2) moves the pin now, so values, Join and the map's rules do not wait for the rest of Plan W. |
| Plan W pull requests 2 to 5 are being built (the sim chain, #173; the commands, #172): switches and gates, a place, doors (`doorTaken`, `GameOptions.arrive`), `paintLevel`. | Only play needs them: gates that open, a place played whole, doors followed, "play from here". They come with **Pin 2** (Task 41). |
| `Game` has `pause`, `resume` and `replay`; it has no one step, no slower speed and no going back. The sim has `snapshot()` and `restore()`. | **Framework tasks F1 and F2**, built in AutomataFramework after Plan W's pull request 4 (they change `game.ts`, which its Task 10 changes). |
| `loadGame` gives a game or its problems, never both. A game with one problem on `main` cannot be opened at all, but the spec says a problem warns and never stops anyone. | **Framework task F3** (`readGame`): the game and its problems together, and what `places` is when the world file has a problem. Until Pin 2 a game with a problem opens as it does today (the "this game has a problem" screen). |
| The framework's check is in its `cli` feature (Effect, Node only). | The editor's problems list is `loadGame`'s own sentences on the edited files, run in the page. No framework work. |
| There is no writer for `automata.toml`. | A line-exact edit in the editors (`files/project-lines.ts`, Task 8), used by the page and the API alike. No game or command in the framework would use one today, so it is not built there. |
| A level and a thing have no name of their own, only an id (`level-1`, `crate-1`). | The name on screen is the id said nicely ("Level 1", "Crate 1"); Rename changes the id, and for a level the file's name, and mends everything that points at it (Tasks 17 and 19). |
| A thing has no "drawn behind or in front" field (the Owner chose to add one, 2026-11-16) and no "locked" or "hidden" field. | Draw order is framework task **F5**, then the editor's Look row, menu rows and canvas order (Task 42a, after Pin 2). Locked and hidden stay for the visit only ("My calls" 5). |
| A character has no weight: every body's Rapier mass is its box's area (at density 1). The framework already runs its physics on Rapier, `@dimforge/rapier2d-deterministic` 0.21.0, the deterministic build. | **F4:** a character may name a number value as its weight, and the thing's Rapier mass is that number; **E4** gives the test game's crate a real "How heavy". Nothing new is installed, and a game that names no weight hashes as before. |
| `figures` and `backdrops` paint in the page (`artFiles` gives their PNG bytes; `loadArt` reads them with `createImageBitmap`). A **tileset** is different: it names a PNG that is a file of the game, and the API sends files as text. | Figures and backdrops are painted in the page, with no request and no `blob:` address, so `public/_headers` stays as it is. A tileset's picture comes from the API as bytes (`OpenAnswer.pictures`, Task 23) and is read from memory (Task 24). |
| `tests/architecture/rules.ts` fails a folder not in `LAYERS` (`unknown-feature`), confines `smol-toml` to `access` and Pixi to one file, and has no place for `files`, `device`, `shell`, `map`, `play`, `team` or `world`. | Task 2a changes the rules first, in pull request 2, so no other pull request can trip on them. `smol-toml` 1.9.0 is already a dependency (the sharing file), so nothing is installed. |
| The editors' fixture game has no hero `moves` (so `startGame` throws "This game has no controls"), no tileset and no `levels` line, and is the only game the pretend GitHub serves. The framework's links game is built in memory, in the framework's own tests. | Task 2b: the fixture hero moves, the fixture has a tileset with a picture and a crate that declares "How heavy", and the links game is built from data in the editors' tests and served beside it. |
| `approve.ts` and `waiting.ts` refuse a waiting change that touches `automata.toml` or a file the game does not list yet, and `approve.ts` refuses on any problem in the game. | Task 11 widens both to the same file set the new save writes, loads the game with the change's own `automata.toml`, and refuses on a problem only when the game says `problems = "stop"`. |
| The WebKit sign-in journey fails now and then (the tracker's must-fix). | Task 1, before anything else. |
| `suite`'s screens are the old look. | Replaced in pull request 7; the logic under them (`access`, `exchange`, `github`, `service`, `session`, `api`, `game/open.ts`, `levels/place.ts`) stays. |

## My calls, for the audit and the Owner to overrule

1. **One history for the whole game.** Undo and Redo in the top bar step through everything changed since the game
   was opened, in a level or on the map, 200 steps deep. A deleted level, which touches three files and other levels'
   doors, is one step.
2. **The marks are SVG, not Pixi.** Rings, handles, arrows, bars, tags and the faint thing under a Pencil are an SVG
   layer over the canvas. Each mark is a real element, so it has a 44-point hit area, a name a screen reader says and a
   journey can find, and nine languages' text is the page's own.
3. **The map draws each level with the editor's own level drawing,** small, not with `paintWorld`. `paintWorld` paints
   one finished sheet with its own numbered badges; the map needs each level as its own picture to drag, and the same
   art as the level view. `layoutWorld` still decides every join and every problem, so the map and `automata world`
   never disagree.
4. **"Look" holds "Looks like" and "Drawn" (behind, with the hero, in front).** The Owner chose (2026-11-16) to keep
   draw order in the level file and use it in play, so framework task **F5** adds a `draw` field to a thing and the
   renderer uses it. Until the pin that has it (Pin 2), "Drawn" is not drawn at all, never dimmed. Task 42a adds the row,
   the canvas order and the menu rows "Bring to the front" and "Send to the back"; they set `draw` and never reorder
   `things`, so the spawn order and every recording stay as they are.
5. **Locked and hidden are for this visit only.** They are kept in memory, nowhere on the device and in no file, and are
   gone on reload; a locked row says "Locked until you close the game". A lock does not reach a teammate. The
   alternative, keeping them in `automata.editors.toml` for the whole team, is an Owner's choice for a later round.
6. **A change is counted by what a person would say:** "Moved Crate 1", "Painted the ground in Level 1", "Level 4 moved
   on the map", "New level: Level 9". "3 changes, only on this iPad" is the number of those lines.
7. **Painting never buries a thing or a start:** a tile under a thing's box or a start is skipped, as `moveThing`
   already never rests a thing in solid ground.
8. **A problem never blocks a save in the API either.** The API always holds each file to its own format (the bytes are
   `writeContent`'s); it loads the whole game and refuses on a problem only when the game's `automata.editors.toml` says
   `problems = "stop"`.
9. **The helper's ghost** shows when the game changed under an open level, or a person pastes a level file back, and
   the change is in a thing or ground they have not changed themselves: it is the three-way merge of Task 14, shown
   before it is taken. Keep takes it; Undo leaves the person's own.
10. **The first pictures are five sizes,** the design language's own: iPad Pro 11 sideways (1210 by 834) and upright
    (834 by 1210), phone (390 by 844), phone sideways (844 by 390), computer (1280 by 800). The journeys' `SIZES`
    change to these. An iPad sideways and a computer are both `'wide'`; they differ by pointer and user agent
    (`deviceWord`), which `layout` takes (Task 21), because the design language gives them different defaults.
11. **The Pencil on a web page:** a page hears `pointerType === 'pen'` and a hovering tip (`pointermove` with no
    button), and handwriting goes into any real text box by itself (Scribble). A page does not hear double tap or
    squeeze. So the number box is a real `<input inputmode="decimal">` and nothing uses double tap, squeeze, pressure or
    barrel roll. CI can only pretend a pen; a real Pencil is the Owner's review.
12. **No "Try a change" card, and no "Back to Level 1".** The spec's card, and the phone's "Try a change" button, change
    a tuning number (the hero's jump height) and keep it or put it back. A tuning file is the Feel editor's file,
    `Working` holds only levels, the world file and the project file, and the spec's table of files World writes does
    not list it. So the card is left out here, never dimmed, and the Feel slice builds it; "Back to Level 1" is for
    later slices, where a person comes from another editor. Task 35 names the difference from the mockups
    (`world-levels-play`, `world-levels-bigger`, `world-levels-play-from`).
13. **What plays is the game's content, not its code.** The editor reads only content files, so a game's own code (the
    test game's `gamePlugins`, its page's rules) never runs in Play. Play shows the level, its things, the hero's moves,
    switches, doors, weights and draw order as the game's files make them. The first Play says so in a tip (Task 35)
    and Help repeats it. A game plays in the person's language when it has that language's words, else in its source
    language (a game has six languages, the editor nine).
14. **Turning a change down closes it at once and keeps its branch; Undo reopens it.** This is the spec's own words
    ("Undo brings them back under 1 to check"). The first draft held the "no" for 8 seconds; that is dropped: its reason
    was weaker than stated (the App opened the pull request, so it can reopen it) and the "no" was lost if the page
    closed in those 8 seconds.
15. **One Pixi Application for the page.** `levels/level-canvas.ts` makes it (`createStage`); the map's pictures are
    containers in it, and the games list draws each game's start level into a small 2D canvas from it. Two
    Applications would be two GPU contexts on an iPad.
16. **"Ask for a change" and "Don't put them in" are comments the App writes, never a review.** GitHub refuses a review
    that requests changes on the reviewer's own pull request, and the App is the author of every waiting change. Each
    comment starts with one fixed line that names who it is from (Task 11), so an agent reading the pull request sees
    the same words the person did.
17. **The editor reads, never writes, the pictures a game's tilesets name.** `CLAUDE.md` says an editor opens only the
    content files. A level drawn in the game's own art needs the tileset's PNG, and that picture is a file of the game, not
    a content file. So `open` also sends those PNGs (read only, each at most 1 MB, 4 MB in all, only under the game's own
    folder, only `.png`), the editor never writes one, and Task 44 adds the clause to `CLAUDE.md`. A picture that is
    missing or too big is left out, and its tiles are drawn as the level's ground colour.

## The Owner's answers (2026-11-16, after the audit)

1. **Tour step 3: the crate gets a real "How heavy" (answered b).** The framework gets a weight a character can name,
   which is the thing's Rapier mass (F4); the test game's crate declares "How heavy" and names it (E4); the tour's
   step 3 drags it. A game whose picked thing has no number value gets "Move the crate with the arrows" in that slot
   instead (Task 27), so the tour never asks for what is not there. Until the slider exists (pull request 12) the step
   is the arrows for every game.
2. **Drawn behind, with the hero, in front (answered b).** The level file keeps it (F5) and play uses it (F5's
   renderer); the editor's Look row and menu rows set it (Task 42a).

The Owner also said Rapier was always meant to be the physics. It already is: `@dimforge/rapier2d-deterministic`
0.21.0, the deterministic build, runs all of the framework's 2D physics, its state hash and its rewind, so nothing
changes for 2D. The 3D layer will need `@dimforge/rapier3d-deterministic`, a new dependency that asks for its own
yes then.

## Global Constraints

- **Dependencies:** only these may be added, exact versions, all development-only and already approved for the
  editors' look (the Blueprint redesign spec): `@fontsource-variable/fraunces` 5.3.0, `@fontsource-variable/onest`
  5.3.1, `@fontsource/jetbrains-mono` 5.3.0, `@phosphor-icons/core` 2.1.1, `@fontsource/noto-sans-kr` 5.3.1,
  `@fontsource/noto-sans-jp` 5.3.1, `@fontsource/noto-sans-sc` 5.3.1 (the newest 5.x on 2026-11-16, each published
  2026-10-11). `smol-toml` 1.9.0 is already a dependency (the sharing file reads it): it is not new, and only the
  architecture rule that confines it widens (Task 2a). Anything else: stop, tell the coordinator, wait.
- **Every word a person reads is in `src/features/words/`,** in nine languages (en, es, ko, ja, zh, pt, fr, ru, de),
  English the source. The mockups' words are the build's words. Never "repo", "commit", "branch", "pull request",
  "merge", "token" on a screen (`tests/features/words/words.test.ts`).
- **Every byte written is `writeContent`'s;** `automata.toml` changes only in the lines of the level added or removed.
- **Touch:** every control a finger uses has a 44-point hit area, measured; main actions 48. Every drag also has
  buttons and keys. No action is only a gesture.
- **Colours and sizes** come only from `src/features/ui/ui.css` tokens (the design language's table). `--accent` only
  for what is picked and the one main button; `--agent` only for what a helper did.
- **The header stays** (`public/_headers`): nothing from another address, no inline script, no `style="…"` in markup
  (Svelte `style:` is fine), no `blob:` picture.
- **The device keeps only** `af.draft:…`, `af.guide.done`, `af.tip.*`, `af.saved`, `af.tokens`, `af.signin.*`,
  `af.recent` and `af.me.*`. Task 4 adds any new `af.me.*` key to `CLAUDE.md`'s list.
- **No file over 600 lines.** Features import only from features below them; the page side never imports the API side.
- **Tests:** in `tests/`, mirroring `src/`; `*.test.ts` Node, `*.browser.test.ts` three engines, `*.journey.test.ts`
  the built suite. Verified only in CI. Batch pushes: each push cancels the running job.
- **Every pull request** is a draft until its last task is green, then ready for review and handed to the merge
  session. A screen-changing pull request carries the `screenshots` label once, at the end, and names the pictures it
  changed.
- **Commits:** author and committer McThayDT, no Claude credit anywhere; the pull request's first credit line reads
  "Requested by **McThayDT**".
- **Graphify first** for finding code and what a change reaches, then the real file for anything newer than its commit.

## Review Focus

The five things the spec implies and no happy-path test would meet, most likely first. Each has its test in the task
that owns the code.

1. **A level an agent wrote by hand:** a thing whose character the game lacks, a value its character does not declare,
   a tile letter its tileset lacks. The editor shows it (a plain box, a value shown and not edited, a "?" kind), never
   drops or rewrites it, and a save writes it back byte for byte. Tests in Tasks 15, 16 and 24.
2. **One of several files changed in the game while a person worked:** nothing is written, nothing is lost, the merge
   is offered. Tests in Tasks 10, 13 and 33.
3. **Garbage on the device:** a draft from an older build, half a draft (two files of three), a draft for a file the
   game no longer lists. Each is dropped or laid over without a broken screen. Tests in Task 13.
4. **A big game:** a level 256 by 256 with 1,024 things, a map of 64 levels. Fill stops at the level's edge, the list
   draws only the rows on screen, the map opens fitted. Tests in Tasks 16, 22 and 29.
5. **The sign-in runs out between pressing "Put in game" and the answer:** the changes stay on the device, the person is
   asked to sign in, and "Put in game" is one press again after. Test in Task 33.

## Features and where things go

`tests/architecture/rules.ts`'s `LAYERS`, lowest first, becomes the list below. **Task 2a, in pull request 2, makes the
change before any of these folders exists** (a folder not in `LAYERS` fails `unknown-feature`):

```
words  access  files  wire  |  exchange  github  service  |  device  ui  api  session  game  shell  levels  map  play  team  world  suite
        shared with the API        the API side                              the page side
```

| Feature | New or grown | What it holds |
|---|---|---|
| `words` | grown | one file per area, nine languages each: `shell.ts`, `levels.ts`, `map.ts`, `play.ts`, `changes.ts`, `team.ts`, `first.ts` (language, welcome, tour, help); `words.ts` joins them; `languages.ts` |
| `files` | new, shared (no page; `smol-toml` is allowed here and in `access`) | the files that are not game content, read and written one way: `project-lines.ts`, `editors-file.ts`, `notes-file.ts` |
| `wire` | grown | `PutFile`, `PutAsk`, `PutAnswer`, `HistoryLine`, `HistoryPage`, `OpenPicture`, `NoteAsk`, and what `Waiting` and `OpenAnswer` gain |
| `github`, `service` | grown | `commitFiles`, `readBytes`, `comment`, `reopenPull`; `/api/put`, `/api/ask`, `/api/reopen`, `/api/clear-turned-down`, `/api/history`, `/api/notes`, `/api/settings` (the author's own take-back stays `/api/turn-down`) |
| `device` | new | what kind of pointer and screen this is, and the "For me" settings: `pointer.ts`, `size.ts`, `me.ts`, `glass.ts` |
| `ui` | grown | tokens, fonts, icons and the kit: `Dock`, `Sheet`, `Menu`, `Segment`, `Slider`, `NumberPad`, `Knob`, `Note`, `Tip`, `Rows`, `Icon` |
| `game` | grown | `changes.ts` (`Working`, `Edits`), `drafts.ts`, `describe.ts`, `merge.ts`, `put.ts`, `problems.ts` |
| `shell` | new | the frame every editor shares: `TopBar`, `Faces`, `Toolbar`, `ListPanel`, `SettingsPanel`, the three menus, `Find`, `Settings`, `Help`, `Keys`, `Language`, `Welcome`, `Tour`, and `workspace.ts` (what a workspace tells the shell) |
| `levels` | grown | pure edits (`things.ts`, `ground.ts`, `values.ts`, `level-files.ts`), `view.ts` (what is picked, the tool, the camera), `level-canvas.ts` (Pixi, and the page's one Application), `Marks.svelte`, the level's own parts (`ActBar`, `MovePad`, `Tray`, `ThingSettings`, value controls, `Show`) |
| `map` | new | `arrange.ts` (pure), `map-canvas.ts` (Pixi), `MapMarks.svelte`, `LevelBar`, `WallCard` |
| `play` | new | `play.ts` (the framework's game in the level's box), `PlayBar.svelte` |
| `team` | new | `Check` (checking someone's changes), `Clash`, `People`, `History`, `Notes`, `Ghost`, `Games` |
| `world` | new | `World.svelte` puts the shell, a level or the map, play and the sheets together; `world-workspace.ts` |
| `suite` | shrunk | `App.svelte`, `route.ts`, `suite.ts`, `opened.ts` |

Only `levels/level-canvas.ts` and `map/map-canvas.ts` may import Pixi (the rule's `PIXI_FILE` becomes a list of two);
there is one Pixi Application for the page ("My calls" 15). Svelte is confined to the page side by the rule that
already holds (`PAGE_SIDE`), so there is no separate list of folders for `.svelte` files.

## Pull requests, order and lanes

Stage 4 is Sonnet at high effort. **A lane is a thread; no pull request belongs to a fixed lane.** A free thread takes
the lowest-numbered pull request whose "Needs" have all merged and that nobody has taken. Each pull request merges
before anything that needs it starts. `words` is one file per area and `World.svelte` takes one line per feature, so
pull requests that run side by side rarely meet; where they do, the later one merges `main` in before going ready.

| # | Pull request | Tasks | Needs | % |
|---|---|---|---|---|
| 1 | The WebKit sign-in journey | 1 | nothing | 1 |
| 2 | Pin 1, the rules for the new features, two test games | 2, 2a, 2b | the framework's `main` | 4 |
| 3 | The look and the kit | 3 to 6 | 2 | 8 |
| 4 | Several files in one change (the API) | 7 to 11 | 2 | 7 |
| 5 | What a person holds (pure) | 12 to 14 | 4 (its wire types and `ProjectChange`) | 6 |
| 6 | Level and map edits (pure) | 15 to 19 | 5 | 8 |
| 7 | The shell's frame | 20 to 22 | 3, 5 | 8 |
| 8 | The team's files (the API) | 23 | 4 | 4 |
| 9 | Levels on screen: Pick, Place, Erase | 24 to 26 | 6, 7 | 8 |
| 10 | First run, Settings, Help, the keys | 27, 28 | 7, 8 | 5 |
| 11 | The map on screen | 29, 30 | 6, 7, 9 | 6 |
| 12 | A thing's settings, Join, Paint, Show, the Pencil | 31, 32 | 9, 10, 11 | 8 |
| 13 | Putting changes in, problems, offline | 33, 34 | 4, 5, 7, 8, 9, 11 | 6 |
| 14 | Play in place | 35 | 9 | 3 |
| 15 | Checking, and two people on one thing | 36, 37 | 13, 14 | 4 |
| 16 | The team: people, history, notes, the helper, Find, your games | 38 to 40 | 8, 12, 13 | 5 |
| 17 | Pin 2 (its own pull request), then play's rest and a game with a problem | 41, 42 | 13, 14, and F1 to F5 and Plan W's pull request 5 merged | 2 |
| 18 | Drawn behind, with the hero, in front | 42a | 12, 17 | 1 |
| 19 | Every journey at every size, the four layout fixes proved, the close | 43, 44 | all | 1 |

The framework's five tasks (F1 to F5, below) and the test game's one (E4) are the other 5%: built in AutomataFramework
and AutomataFrameworkExamples, not here. The column and that 5 add to 100.

**Waves.** Everything in a wave can start once the wave before it has merged: 1 and 2; then 3 and 4; then 5 and 8; then
6 and 7; then 9 and 10; then 11 and 14; then 12 and 13; then 15 and 16; then 17; then 18; then 19. No wave holds more
than two pull requests, so **two lanes are enough and three are never needed**. Pull requests 9, 11 and 14 all add a
line to `World.svelte`, and so do 12 and 13: they merge `main` in before going ready. Pull request 6 adds functions
beside the old `levels/edit.ts` and removes nothing, which is why 7 does not wait for it (Task 15).

**Threads and branches (the shared rules).** The project allows four working threads at once, all in the current
slice, and three building in one repo. While Plan W's two threads are building (the sim chain, pull request 173, and
the commands, pull request 172), the Editors take two of the four and no more: two lanes, never three. The framework
thread (F1 to F5) takes the next slot Plan W frees: F3 is small and may be done by a lane thread in a gap; F1, F2, F4
and F5 start after Plan W's pull request 4 merges (they change the same files) and are merged before pull request 17,
the only one that waits for them. The coordinator says when a slot is free; this plan never starts a thread on its own.
Branches: Editors has `main` and `ci-screens`, and the rules allow five, so at most two lane branches and one docs or
audit branch are open at once. A docs pull request (an audit, a rules page) merges before a second lane starts, or
waits.

---

## The framework's part (AutomataFramework, built there, before Pin 2)

One pull request per task (F1 and F2 may share one), drafts, in AutomataFramework's own tracker. **F3** touches only
`content/load.ts` and `content.ts`, so it may start now beside Plan W (it merges `main` in after Plan W's pull request
5, which adds exports to the same list). **F1, F2, F4 and F5** start after Plan W's pull request 4 merges: they change
`game.ts`, `level/`, `physics/` and the renderer, which Plan W's chain changes. F4 and F5 are the Owner's answers of
2026-11-16 (a weight, a draw order). Each changes the API report: take the new one from the `package` job, as Plan W
does. **A game that uses none of the new parts must hash as it did:** F4 and F5 each say how, and each has a test that
says so.

### Task F1: One step, and a slower speed

**Files:** Modify `src/features/game/game.ts`, `game/loop.ts`. Test `tests/features/game/loop.test.ts`,
`tests/features/game/step.browser.test.ts`.

**Interfaces (produces), on `Game`:**

```ts
/** While paused: takes exactly one step with what the player holds now, and draws it. Does nothing while running. */
step(): void
/** How fast time passes: 1 is the game's own speed. One of 1, 0.5 and 0.25; anything else throws. */
setSpeed(rate: number): void
```

`createLoop` gains `rate?: () => number`; the time a frame adds to the pool is multiplied by it.

- [ ] **Step 1: Write the failing tests.** With hand-driven frames at 60 Hz: at speed 0.5, 120 frames of 1/60 s take 60
  steps; at 0.25, 30. Paused, `step()` three times moves `sim.tick` by 3 and `onStep` hears 3; running, `step()` moves
  nothing. `setSpeed(0.3)` throws. `replay()` after steps taken by hand verifies with `verifyReplay`.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(game): one step by hand and a slower speed`

### Task F2: Going back through what was just played

**Files:** Create `src/features/game/kept.ts`. Modify `game.ts`, `src/features/commands/recorder.ts`. Test
`tests/features/game/kept.test.ts`, `tests/features/commands/recorder.test.ts`,
`tests/features/game/back.browser.test.ts`.

**Interfaces (produces):**

```ts
// GameOptions gains
/** How many seconds of play can be gone back through, 0 to 60. Default 0: none is kept. */
readonly keepSeconds?: number
// Game gains
/** The ticks `backTo` can reach: `from` is the oldest kept, `to` is now. Equal when nothing is kept. */
kept(): { readonly from: number; readonly to: number }
/** While paused: the game as it was at `tick`, drawn. What was played after it is forgotten. Throws outside `kept()`. */
backTo(tick: number): void
// commands/recorder.ts: Recorder gains
/** Forgets everything recorded after `tick`. The sim must already be at `tick`. */
cutTo(tick: number): void
// game/kept.ts
export function createKept(sim: Sim, seconds: number): { note(tick: number): void; nearest(tick: number): { tick: number; bytes: Uint8Array } | undefined; from(): number }
```

A snapshot is taken every `tickHz` ticks and the newest `keepSeconds + 1` are kept. `backTo` restores the nearest
snapshot at or before `tick`, steps the recorded commands again up to `tick`, cuts the recorder, and gives the renderer
the whole picture again.

- [ ] **Step 1: Write the failing tests.** A game played 300 ticks with scripted controls, hashes noted at 120 and 300:
  after `backTo(120)` `sim.hash()` is the hash noted at 120; played on with the same controls to 300, the hash is the
  one noted at 300, and `verifyReplay(fresh sim, game.replay())` passes. With `keepSeconds: 2` at tick 300,
  `kept().from` is 180. `backTo` while running, or to a tick outside `kept()`, throws. In the three browsers, the hero's
  box after `backTo(120)` equals the box read at tick 120.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(game): go back through the last seconds of play`

### Task F3: A game and its problems together

**Files:** Modify `src/features/content/load.ts`, `content.ts`. Test `tests/features/content/read-game.test.ts`.

**Interfaces (produces):**

```ts
export interface GameRead {
  /** The game, whenever the project file and every listed file read as their own kind, even with problems between files. */
  readonly content: GameContent | undefined
  readonly diagnostics: readonly Diagnostic[]
}
export function readGame(read: (path: string) => Promise<string>): Promise<GameRead>
```

`loadGame` is `readGame` that answers `ok: false` when there is any diagnostic; its results do not change.

**What `content.places` is when there are problems.** `load()` works it out only when there are none. `readGame` works
it out whenever the world file and every level it names read (`layoutFor` does not give `undefined`), whatever problems
the layout itself has (an overlap, a wall); otherwise `places` is left out. So content with a dangling reference (a
door into a missing level, a thing whose character is gone, a world file naming a level that is not there) comes back
with no `places` and the diagnostic that says why. A caller that sees a diagnostic whose `file` is the world file
treats `places` as unreliable: the editor's map then draws every level in a row (Task 18's `boxes`), and Play of a
level that needs a place refuses (Task 42).

- [ ] **Step 1: Write the failing tests** on the links game: a clean game gives `content` and no diagnostics, equal to
  `loadGame`'s value; a door whose `to` names a missing level gives `content` and that one sentence; a level file that
  is not JSON gives `content: undefined`; a world file that names a level that is not there gives `content` with no
  `places` and that one sentence; two levels that overlap on the map give `content` with `places` and the overlap
  sentence; every existing `loadGame` test still passes.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(content): readGame gives a game and its problems together`

### Task F4: A character's weight, which is the thing's Rapier mass

The Owner's answer (2026-11-16): the crate gets a real "How heavy" with a rule the game uses, so the tour can drag it.
The framework already runs on Rapier (`@dimforge/rapier2d-deterministic` 0.21.0, the deterministic build), so the weight
is Rapier's own mass; nothing is installed.

**Files:** Modify `src/features/content/character.ts` (the `weight` field and its check), `src/features/physics/components.ts`
(a `Mass` component), `physics/spawn.ts` (a `mass(kilos)` spawn part), `physics/rapier.ts` (`colliderDesc` calls
`setMass` when the entity has `Mass`), `src/features/level/hero.ts` (`characterParts` adds `Mass` from the thing's
value), `level/uses.ts` (`usesWeights`), `src/headless.ts`, `src/index.ts`. Test `tests/features/content/character.test.ts`,
`tests/features/level/weight.test.ts`, `tests/features/level/weight.parity.test.ts`.

**Interfaces (produces):**

```ts
// Character gains
/** The `number` value that is this character's weight, in kilograms: the thing's mass in Rapier. Needs `body: 'dynamic'`.
 *  Left out, a body weighs what its box does (its area, at Rapier's density of 1). */
readonly weight?: string | undefined
// physics/spawn.ts
export function mass(kilos: number): SpawnPart
```

The check: `weight` names a declared value of this character that is a `number` whose `least` is above 0, and the
character's `body` is `dynamic` ("A fixed body does not move, so it has no weight."). The thing's mass is read at spawn
from its own value, or the character's default (`withDefaults`), so two crates in one level may weigh differently. It
does not change while the sim runs.

**It must not move any hash a game that names no weight has.** `Mass` is a component of its own, added only to a thing
whose character has a `weight` and registered in a sim only when some character does (as `Joint` is registered only
when a game asks for joints); no existing component gains a field. A snapshot taken mid-push and restored gives the
same hash as an uninterrupted run, since Rapier's world snapshot carries the mass.

- [ ] **Step 1: Write the failing tests:** on a small level (a floor, a hero with `moves`, a crate 1 by 1) with the
  crate's weight at its default of 1 and at 4, the same right-hand control held for 120 ticks: the 4 kilo crate has
  moved less than half as far; two crates in one level with different values weigh differently; a game with no
  `weight` ends every existing golden on the hash it had (all unmoved); the check refuses a weight that names a missing
  value, a `switch` value, a `least` of 0 or a fixed body, each with a plain sentence; `snapshot()` then `restore()`
  mid-push is hash-equal to an uninterrupted run; the hashes are equal in Node, Chromium, WebKit and Firefox.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(physics): a character's weight is its thing's Rapier mass`

### Task F5: Drawn behind, with the hero, or in front

The Owner's answer (2026-11-16): draw order is kept in the level and used in play.

**Files:** Modify `src/features/content/level.ts` (the thing's `draw`, in the type and the schema, with its sentence),
`src/features/level/spawn-level.ts` and `sprite.ts` or `src/features/render/stage.ts` (whichever hands the renderer what
a thing is), `src/features/render/stage.ts` (the order). Test `tests/features/content/level.test.ts`,
`tests/features/render/draw-order.browser.test.ts`, `tests/features/level/draw.test.ts`.

**Interfaces (produces):**

```ts
// LevelThing gains
/** How it is drawn: `behind` the ground and every other thing (over the backdrop), `with-hero` as things and heroes are
 *  drawn today, or `in-front` of everything the level draws, the hero included. Left out is `with-hero`. Drawing only:
 *  nothing in the sim reads it. */
readonly draw?: 'behind' | 'with-hero' | 'in-front' | undefined
```

`writeContent` writes `draw` only when it is `behind` or `in-front` (`with-hero` is the same as no key, so a written
file never holds the default). The renderer puts each thing in one of three layers; today's layers are the middle one.
Presentation observes and never decides: no sim state reads `draw`. The level's content is hashed whole into every
snapshot, so a level that sets `draw` hashes differently from one that does not and a level that does not hashes as it
did; a test says every entity's place after 300 ticks is the same with and without `draw` on a thing.

- [ ] **Step 1: Write the failing tests:** `draw: 'in-front'` on a crate that overlaps the hero's start paints the
  crate's colour on the overlap, `behind` paints the tile's, and no key paints the hero's (in the three browsers); a
  level with no `draw` anywhere is hash-equal to its recording in every golden (all unmoved); `draw: 'with-hero'` is
  refused by `writeContent`'s round trip as no key (the file does not hold the default); a bad value gets one plain
  sentence naming the three.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(level): a thing is drawn behind, with the hero or in front`

---

## The test game's part (AutomataFrameworkExamples, built there, after F4 and F5)

### Task E4: The crate has "How heavy"

Plan W's Examples tasks E1 to E3 are on Plan W's page; this one is added by this plan (the Owner's answer,
2026-11-16). **E1 waits for F4 and F5 to merge**, so the Examples pin moves once, to a commit that has Plan W's pull
request 5 and both. (If E1 has already merged, E4 is its own pull request with its own pin move and its own before and
after for the Owner.)

**Files:** `content/characters/crate.json` (`values`: `heavy`, named "How heavy", `number`, `least` 0.5, `step` 0.5,
`default` 1, `about` "How hard the crate is to push."; `most` below; `weight: "heavy"`), `tests/game/game-files.test.ts`,
`tests/journeys/` (one journey), `replays/level-1.json`. The crate is 1 by 1, so Rapier's default mass for it is 1: the
default keeps today's feel and the recorded moves stand. Written by `pnpm content:write`.

- **`most`** is the heaviest weight at which the journey's hero still pushes the crate onto the plate within ten
  seconds: the journey tries 4, then lower by 0.5 until it does, and the file keeps that number.
- **The recording moves.** The crate now carries a `Mass` component, so **`replays/level-1.json` is a golden that
  moves**, even at the default weight. It rides the same before-and-after the Owner already sees for Plan W's move of
  the same file (E3's step 2): one pull request, the old and new final hashes of both reasons, a `ci-screens` picture at
  390 by 844, and no merge until the Owner says yes. The template's crate (in the framework) gets no weight, so the
  template's `replays/level-1.json` does not move for this reason.
- **The Site** reads the crate's recording for its home page: its next cycle is told its numbers change.

- [ ] **Step 1: Tests:** the game loads with `weight` named; `automata check` is clean; the journey (three browsers, the
  real level): at the default the crate goes onto the plate; at `most` it still does and takes longer.
- [ ] **Step 2 to 4: push red, implement, push green** (CI says "the content changed" for `replays/level-1.json`:
  expected).
- [ ] **Step 5: Commit** `feat: the crate has How heavy`, naming the moved golden in the message.

---

## Pull request 1: the WebKit sign-in journey

### Task 1: Find why the sign-in journey fails now and then in WebKit

**Files:** `tests/journeys/open-game.journey.test.ts`, `tests/fixtures/serve.ts`, `tests/fixtures/journey.ts`,
`src/features/session/session.ts` or `src/features/api/api.ts`, whichever holds the fault.

The failing test is "when the sign-in is gone for good the person is on Welcome, told so", page error "/api/token due
to access control checks" (`engines (webkit)` at `3bda1c3`). That error is WebKit's words for a request cut off by a
navigation. Use superpowers:systematic-debugging; do not add a retry or a sleep.

- [ ] **Step 1:** Read the job's log for that run and the journey; write down which request is in flight when the page
  navigates.
- [ ] **Step 2: Write the failing test** that holds the fault still (a token request that is answered only after the
  page has moved on), in `tests/features/session/session.test.ts` or `api.test.ts`.
- [ ] **Step 3 to 4: push red, fix the cause, push green,** with the `full-tests` label so WebKit runs.
- [ ] **Step 5: Commit** `fix(session): <what it was>`, and take the must-fix section out of `progress.md`.

## Pull request 2: Pin 1, the rules for the new features, two test games

One pull request, three tasks, and everything runs (the lockfile and the rules change). It is small, and it comes first
so no later pull request trips on a rule, a missing feature folder or a game that cannot play.

### Task 2: Move the framework pin to its `main`

**Files:** `package.json` (the dependency and the matching `pnpm.onlyBuiltDependencies` line), `pnpm-lock.yaml`,
`tests/fixtures/game/` (only if the newer framework's checks ask for it).

- [ ] **Step 1:** Pin the newest commit on AutomataFramework's `main` whose checks all passed, at or after `596348d`.
- [ ] **Step 2: Push.** Everything runs (the lockfile changed). Fix only what the new pin breaks; a change of
  behaviour is reported to the coordinator, not worked around.
- [ ] **Step 3: Commit** `chore: pin the framework at <commit> (values, the world file, layoutWorld)`

### Task 2a: The architecture rules for the features to come

**Files:** Modify `tests/architecture/rules.ts`, `CLAUDE.md` (its list of features, lowest first, and the sentence on
what `smol-toml` and Pixi are for). Test `tests/architecture/rules.test.ts`.

A folder not in `LAYERS` fails `unknown-feature`, `smol-toml` is confined to `access` and Pixi to one file, and the
API side's "no page" set has no `files`. Pull requests 4 and 6 make the `files` and `map` folders, so the rules change
here, before either.

**Interfaces (produces):**

```ts
export const LAYERS = ['words', 'access', 'files', 'wire', 'exchange', 'github', 'service',
  'device', 'ui', 'api', 'session', 'game', 'shell', 'levels', 'map', 'play', 'team', 'world', 'suite'] as const
export const API_SIDE = ['exchange', 'github', 'service'] as const                       // unchanged
export const PAGE_SIDE = ['device', 'ui', 'api', 'session', 'game', 'shell', 'levels', 'map', 'play', 'team', 'world', 'suite'] as const
// NO_PAGE (what the API may run) gains 'files'. PIXI_FILE becomes PIXI_FILES: levels/level-canvas.ts and map/map-canvas.ts.
// smol-toml is allowed in `access` and `files`.
```

- [ ] **Step 1: Write the failing tests** on made-up file maps: a file in `src/features/files/` that imports
  `smol-toml` is clean and one in `service/` is `package-confined`; `files` using `window` is `api-side-has-no-page`;
  `files` importing `wire` is `imports-go-down` and `wire` importing `files` is clean; each of `device`, `shell`, `map`,
  `play`, `team` and `world` is accepted (no `unknown-feature`); `levels` importing `map` is `imports-go-down`; `map`
  importing `service` is `page-never-imports-api-side`; `map/map-canvas.ts` importing `pixi.js` is clean and
  `map/map.ts` doing so is `package-confined`; `shell` importing `levels` is `imports-go-down`.
- [ ] **Step 2 to 4: push red, implement, push green.** `tests/architecture.test.ts` still passes over the real tree
  (no new folder exists yet).
- [ ] **Step 5: Commit** `test(architecture): the rules for the World editor's features`

### Task 2b: Two games for the tests

The journeys need a game that can play, a game whose levels can join, and a game with a tileset and its picture. None
of the editors' fixtures is any of these today (audit H4 and M1). Later tasks name these games, so they are made once,
here.

**Files:** Modify `tests/fixtures/game/automata.toml`, `content/characters/hero.json`, `content/characters/crate.json`,
`content/levels/level-1.json`, `tests/fixtures/game/read.ts`, `tests/fixtures/fake-github/repos.ts`, `server.ts`,
`tests/fixtures/api.ts`, `tests/fixtures/journey.ts`. Create `tests/fixtures/game/content/tunings/hero-moves.json`,
`content/tilesets/ground.json`, `tests/fixtures/game/ground-picture.ts`, `tests/fixtures/links-game/links.ts`,
`links-game/read.ts`. Test `tests/fixtures/game.test.ts`, `tests/fixtures/links-game.test.ts`,
`tests/fixtures/fake-github/server.test.ts`.

**The Crate Game (`grandma/crate-game`, the demo, `DEMO`)** keeps its one level and gains:

- **A hero that moves.** `hero.json` gets `moves: { tuning: 'hero-moves', 'double-jump': false, 'wall-jump': false,
  dash: false }`, and `content/tunings/hero-moves.json` is listed in `automata.toml`, made as the framework's own links
  game makes it from `MOVE_NUMBERS` and `DEFAULT_HERO_CONTROLS` (both exported from the framework's `/headless` entry).
  Without it `startGame` throws "This game has no controls" and no play journey can pass.
- **A tileset and its picture.** `content/tilesets/ground.json` has two kinds, Ground (`#`, solid) and Water (`~`, not
  solid), 16 pixels a tile and two frames; `level-1.json` names `tileset: "ground"`. Its picture is 32 by 16 pixels and
  is made in `ground-picture.ts` with the framework's `encodePng` (no binary is committed); `read.ts` gains
  `fixtureBytes()` for it, as `fixtureFiles` is for the text.
- **A crate that says how heavy it is.** `crate.json` declares one value, `heavy`, named "How heavy": `number`, least
  0.5, most 4, step 0.5, default 1. It has no `weight` yet (the pinned framework's schema is strict and has no such
  field); Task 41 adds `weight: "heavy"` at Pin 2. The declaration is enough for the tour (Task 27) and the slider
  (Task 31).

**The links game (`grandma/links-game`, `LINKS`, exported from `api.ts`)** is built in the editors' tests from data,
never written out by a script: `tests/fixtures/links-game/links.ts` holds the data of the framework's own links game
(the framework's `tests/fixtures/links-game/read.ts` at the pinned commit: three levels 16 by 9, a plate and a gate, a
button, doors that lead back, a goal, a critter, the world file) and builds each file with `writeContent` and
`loadGame` from `@automataframework/framework/headless` instead of the framework's `#src`. `links-game.test.ts` loads it
with `loadGame` and checks every file equals `writeContent`'s bytes, as `game.test.ts` does for the Crate Game. Its
levels are called Room 1 to Room 3 (`nameOf`). **One change from the framework's copy,** noted at the top of `links.ts`:
rows 5 to 7 of room-1 are open on the right, as room-2's are, so room-1's right edge is open where room-2's left edge is
solid. Pushing room-1 against room-2 then makes a wall (the card of Task 30 mends it), while room-2 and room-3 still
join on rows 5 to 7. The world file still puts room-1 at (0, 0), clear of the others, so the game loads with no problem.

**Served by the pretend GitHub.** `repos.ts` learns to hold several games (`addGame(owner, name, files, bytes?)`), and
`reset()` puts back both, each owned by `grandma` with the same people and levels of access. A file's bytes are kept
beside its text (`putBytes`): the contents answer gives base64, the raw media type answers the bytes, and the blob sha
is of the bytes. `journey.ts`'s `openPage(size, person, keep, game = DEMO)` opens either. The pictures of Task 43 use
these games' own names: Room 1 to Room 3 on the map, Level 1 in the Crate Game.

- [ ] **Step 1: Write the failing tests:** both games load with `loadGame` and their files are `writeContent`'s bytes;
  in a browser test, `startGame` on the Crate Game builds and steps 60 ticks without throwing; the Crate Game's
  tileset reads, and in a browser test its picture is a PNG the framework's `loadArt` accepts; the pretend GitHub serves both games,
  answers a picture's bytes through the raw media type, and a test that changes one file of one game leaves the other
  as it was.
- [ ] **Step 2 to 4: push red, implement, push green.** Everything runs, as the fixtures changed.
- [ ] **Step 5: Commit** `test(fixtures): a hero that moves, a tileset, and the links game`

## Pull request 3: the look and the kit

### Task 3: Colours, fonts and icons

**Files:** Modify `package.json`, `knip.json` (`ignoreDependencies` for the font and icon packages, as the Site does),
`src/features/ui/ui.css`, `public/licences.txt` (new: each package's `LICENSE`). Create `src/features/ui/fonts.css`,
`src/features/ui/icons.ts`, `src/features/ui/Icon.svelte`. Test `tests/features/ui/tokens.test.ts`,
`tests/features/ui/icon.browser.test.ts`, `tests/workflows/package.test.ts`.

**Interfaces (produces):** the tokens of the design language's section 2 and the glass of section 4, by those names
(`--ground`, `--panel`, `--raised`, `--hover`, `--line`, `--words`, `--quiet`, `--faint`, `--accent`, `--agent`,
`--problem`), plus `--glass`, `--glass-soft`, `--row` (44px on touch, 30px with a mouse), `--bar` (56, 48, 44).

```ts
// ui/icons.ts: only the icons the screens use, read from @phosphor-icons/core's regular SVGs at build time
export type IconName = 'cursor' | 'plus-circle' | 'paint-brush' | 'eraser' | 'link' | 'play' | 'pause' | ...
export const ICONS: Readonly<Record<IconName, string>>   // the path data
```

- [ ] **Step 1: Write the failing tests:** every colour in any `.css` or `.svelte` under `src/` is a token from
  `ui.css` (a test that reads the files; hex values only in `ui.css`); the token values equal the design language's
  table; `--words` on `--panel` and `--quiet` on glass are at least 4.6 to 1; `Icon` draws an `<svg aria-hidden="true">`
  and an unknown name is a type error; `licences.txt` names each of the seven packages.
- [ ] **Step 2 to 4: push red, implement, push green.** Fonts: Fraunces for titles, Onest for the rest, JetBrains Mono
  for numbers; Russian titles fall back to Onest; Korean, Japanese and Chinese load their Noto partner only for that
  language (`import()` of its CSS).
- [ ] **Step 5: Commit** `feat(ui): the design language's colours, fonts and icons`

### Task 4: What kind of device this is, and the "For me" settings

**Files:** Create `src/features/device/pointer.ts`, `size.ts`, `me.ts`, `glass.ts`, `device.ts`. Modify `CLAUDE.md`
(the `af.me.*` keys; the rules themselves changed in Task 2a). Test `tests/features/device/*.test.ts`.

**Interfaces (produces):**

```ts
// device/size.ts
export type SizeClass = 'phone' | 'phone-sideways' | 'tablet-upright' | 'wide'
/** Total, in this order: 500 wide or less is 'phone'; under 500 tall is 'phone-sideways' (a short wide window); taller
 *  than wide is 'tablet-upright' (an upright iPad, or any tall window over 500 wide); every other window is 'wide': an
 *  iPad sideways, a computer, and the in-betweens such as 700 by 650. Read from the layout viewport, which the
 *  on-screen keyboard does not shrink (iPadOS, and Chrome's default for the keyboard), so opening the keyboard never
 *  changes the class. */
export function sizeClass(w: number, h: number): SizeClass
// device/pointer.ts
export type PointerKind = 'touch' | 'mouse' | 'pen'
export interface Pointers { readonly last: PointerKind; readonly penSeen: boolean; readonly hovering: boolean }
export function nextPointers(now: Pointers, event: { pointerType: string; buttons: number; type: string }): Pointers
/** 'small' for a mouse or a hovering Pencil, 'touch' otherwise. The caller reads it only when a panel opens. */
export function rowSize(pointers: Pointers, choice: Me['rows']): 'touch' | 'small'
/** The name the top bar uses: "iPad", "phone" or "computer". An iPad sideways and a computer are both 'wide'; this is
 *  what tells them apart, and `layout` (Task 21) takes it. */
export function deviceWord(userAgent: string, size: SizeClass, touch: boolean): 'ipad' | 'phone' | 'computer'
// device/me.ts
export interface Me {
  readonly glass: 'auto' | 'on' | 'off'; readonly rows: 'auto' | 'touch' | 'small'
  readonly fingerDraws: boolean; readonly leftHand: boolean; readonly tips: boolean; readonly language: string | undefined
}
export const ME_DEFAULT: Me
export function readMe(store: Storage): Me      // anything unreadable is the default
export function keepMe(store: Storage, me: Me): void   // keys af.me.glass, af.me.rows, af.me.finger, af.me.left, af.me.tips, af.me.language
// device/glass.ts
export function glassOn(me: Me, device: { blur: boolean; lessSeeThrough: boolean; moreContrast: boolean }): boolean
```

- [ ] **Step 1: Write the failing tests:** `sizeClass(1210, 834)` is `'wide'`, `(834, 1210)` `'tablet-upright'`,
  `(390, 844)` `'phone'`, `(844, 390)` `'phone-sideways'`, `(1280, 800)` `'wide'`, `(700, 650)` `'wide'`, `(600, 700)`
  `'tablet-upright'`, `(390, 400)` `'phone'` (a phone upright with its keyboard up); `deviceWord` tells an iPad sideways
  (an iPad user agent, or a Mac one with touch) from a computer at 1210 by 834 and 1280 by 800; a pen `pointerdown` sets `penSeen`
  for good; a pen `pointermove` with `buttons: 0` is hovering; `rowSize` is `'small'` for a mouse and a hovering pen;
  `readMe` of garbage is `ME_DEFAULT`; `glassOn` is false with no blur, with `lessSeeThrough`, and with `'off'`.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(device): pointer, size and the settings kept for me`

### Task 5: The kit

**Files:** Create in `src/features/ui/`: `Dock.svelte` (glass, floats 8 points in), `Sheet.svelte` (soft glass, a
heading, a way out, buttons at its foot; a bottom sheet on a phone), `Menu.svelte`, `Segment.svelte`, `Slider.svelte`,
`NumberPad.svelte`, `Knob.svelte` (on and off), `Note.svelte` (what just happened, one button), `Tip.svelte` (solid,
light), `Rows.svelte` (a list that draws only the rows on screen). Modify `Button.svelte`, `ui.ts`. Delete
`Screen.svelte`, `Choice.svelte`, `Notice.svelte` when pull request 7 removes their last user (not here). Test
`tests/features/ui/kit.browser.test.ts`.

**Interfaces (produces):** each component's props are plain values and callbacks, no stores:

```ts
Slider:    { value: number; least: number; most: number; step: number; label: string; onchange(n: number): void }
NumberPad: { value: number; least: number; most: number; step: number; onchange(n: number): void; onclose(): void }
Sheet:     { title: string; close: string; onclose(): void }   // children: the body; `foot` snippet: its buttons
Menu:      { items: readonly { id: string; words: string; icon?: IconName; key?: string; off?: string }[]; onpick(id: string): void; onclose(): void }
Note:      { words: string; button?: string; onpress?(): void }
```

`off` is why a row cannot act, shown under it ("A level has one Start").

- [ ] **Step 1: Write the failing browser tests:** every kit control is at least 44 by 44 with a touch pointer and a
  `Button` with `primary` at least 48 tall; `Slider` never gives a value outside `least` to `most` or off `step` (drag
  past both ends; arrow keys; Home and End); `NumberPad` plus and minus stop at the limits and its field is an
  `<input inputmode="decimal">`; `Sheet` closes on its button and on Escape, and gives focus back to what opened it;
  `Menu` moves with the arrow keys and a row with `off` cannot be picked and says why; glass turns solid when
  `glassOn` is false (computed `backdrop-filter` is `none`); `Rows` with 5,000 rows has fewer than 100 in the page.
- [ ] **Step 2 to 4: push red, implement from `docs/mockups/shell.css`'s final rules, push green.**
- [ ] **Step 5: Commit** `feat(ui): the kit every screen is made of`

### Task 6: Words in nine languages

**Files:** Create `src/features/words/languages.ts`, `shell.ts`, `levels.ts`, `map.ts`, `play.ts`, `changes.ts`,
`team.ts`, `first.ts`. Modify `words.ts`. Test `tests/features/words/words.test.ts`, `languages.test.ts`.

**Interfaces (produces):**

```ts
export const LANGUAGES = ['en', 'es', 'ko', 'ja', 'zh', 'pt', 'fr', 'ru', 'de'] as const
export type Lang = (typeof LANGUAGES)[number]
/** Each language in its own words, with its flag's icon name. */
export const LANGUAGE_NAMES: Readonly<Record<Lang, { readonly name: string; readonly flag: string }>>
/** A row: a string, or a function of what it names. English is the source; a row missing in a language is English. */
export type Row = string | ((...parts: readonly (string | number)[]) => string)
export function wordsIn(lang: Lang): Words
/** The id said nicely: "level-1" is "Level 1", "crate-2" is "Crate 2". */
export function nameOf(id: string): string
/** A name back to an id: "Big box" is "big-box"; undefined when no id can be made of it. */
export function idOf(name: string): string | undefined
/** Which rows a native speaker has read, per language (none yet). */
export const READ_BY_A_SPEAKER: Readonly<Record<Lang, readonly string[]>>
```

Each area file exports `{ en: {...}, es: {...}, ... }`. This task writes the rows the kit and Tasks 20 to 22 use
(`shell.ts`, `first.ts`'s language card); later tasks add their own area's rows in all nine languages.

- [ ] **Step 1: Write the failing tests:** every language has every row of English, with the same placeholders; no row
  in any language holds a banned word (the list grows per language: "repositorio", "commit", "rama", and so on, in
  `tests/fixtures/banned.ts`); `nameOf('level-12')` is `'Level 12'`; `idOf('Big box')` is `'big-box'`, `idOf('!!')`
  undefined; `wordsIn('ru')` differs from English on `shell.undo`.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(words): nine languages, one file per area`

## Pull request 4: several files in one change (the API)

### Task 7: One commit of several files

**Files:** Modify `src/features/github/repo.ts` (if it passes 550 lines, move the new call to `github/commit.ts`),
`tests/fixtures/fake-github/repos.ts`, `server.ts`. Test `tests/features/github/repo.test.ts`,
`tests/fixtures/fake-github/server.test.ts`.

**Interfaces (produces), on `Repo`:**

```ts
/** Every file in one commit, or nothing. `text` undefined takes the file away. `version` is the file's version the
 *  person started from (undefined for a new file); any that is no longer true is 'changed-elsewhere', with the paths
 *  in `details`, and nothing is written. */
commitFiles(change: {
  branch: string
  files: readonly { path: string; text: string | undefined; version: string | undefined }[]
  message: string
  author: Author
}): Promise<Answer<{ commit: string; versions: Readonly<Record<string, string>> }>>
/** The newest commits on `branch` that touched anything under `folder` (GitHub's list of commits filters by one path, and
 *  a folder matches every file inside it): ONE call, newest first, at most `limit` (at most 50). A row has who, when and
 *  the message, not its files. */
history(branch: string, folder: string, limit: number): Promise<Answer<readonly { commit: string; by: string; at: number; message: string }[]>>
/** The paths one commit touched: one call. Task 23 asks only for the rows it shows. */
commitPaths(commit: string): Promise<Answer<readonly string[]>>
```

Made with GitHub's blobs, trees, commits and a ref update that is never forced (the App's contents permission covers
all four). A ref that moved under it is `'changed-elsewhere'`. The pretend GitHub's `FakeCommit` holds one path today; it
becomes a list of files, and its old one-file answers keep working for the save that still exists.

- [ ] **Step 1: Write the failing tests** against the pretend GitHub: three files (one changed, one new, one taken
  away) land in one commit; a stale `version` on one writes nothing and names that path; a ref moved between reading
  and writing writes nothing; `history` lists newest first and only commits touching the folder, in one request (the
  pretend GitHub counts them); `commitPaths` gives a commit's paths.
- [ ] **Step 2 to 4: push red, implement (the pretend GitHub learns the four calls), push green.**
- [ ] **Step 5: Commit** `feat(github): several files in one commit, and a file's history`

### Task 8: The project file's lines

**Files:** Create `src/features/files/project-lines.ts`, `files.ts`. Test `tests/features/files/project-lines.test.ts`.

**Interfaces (produces):**

```ts
export interface ProjectChange {
  /** Level and world files to list. A path already listed is left alone. */
  readonly add?: readonly { readonly type: 'level' | 'world'; readonly path: string }[]
  /** Paths to take out of the list. */
  readonly remove?: readonly string[]
  /** Level ids to rename where `start` or `levels` name them. */
  readonly rename?: Readonly<Record<string, string>>
}
/** The same text with only those lines changed; undefined when the result would not read as a project file. */
export function changeProject(text: string, change: ProjectChange): string | undefined
```

An added file is a `[[content]]` block of three lines at the end, in the form the framework's template writes; a
removed one loses exactly its block and one blank line; `start = "…"` and the ids inside `levels = [ … ]` are changed
in place. When the text has a `levels = [ … ]` line, an added `level`'s id (its file's name without `.json`) is added
at the end of it, and a removed level's id leaves it; if that would leave `levels` empty the line is taken out (the
framework needs at least one, and a game with no `levels` line plays its `start` level alone). A text with no `levels`
line never gets one. Every other byte, comments included, stays.

- [ ] **Step 1: Write the failing tests** on the links game's project text (it has `levels`, `source`, `players` and
  `done`; the Crate Game's has no `levels` line) and on a hand-written text with a comment line, and with Windows line
  ends in a second copy: add then remove gives the first text back byte for byte; a comment between blocks survives
  both; adding `level-4` gives `levels = ["room-1", "room-2", "room-3", "level-4"]`, and adding to a text with no
  `levels` line adds none; removing `room-2` takes it out of `levels` as well as out of the `[[content]]` list;
  removing the only id left takes the `levels` line out; renaming `room-1` changes `start` and `levels` and nothing
  else; removing the `start` level gives `undefined`; the result of each reads with the framework's `parseProject`.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(files): change only a level's lines in automata.toml`

### Task 9: The editors' settings file

**Files:** Create `src/features/files/editors-file.ts`. Modify `docs/teams.md`. Test
`tests/features/files/editors-file.test.ts`, `tests/docs/docs.test.ts`.

**Interfaces (produces):**

```ts
export const EDITORS_FILE = 'automata.editors.toml'
export interface EditorsFile { readonly format: 1; readonly problems: 'warn' | 'stop' }
export const EDITORS_DEFAULT: EditorsFile            // problems: 'warn'
export function parseEditors(text: string | undefined): { ok: true; value: EditorsFile } | { ok: false; why: string }
export function writeEditors(file: EditorsFile): string   // 'format = 1\nproblems = "warn"\n'
```

- [ ] **Step 1: Write the failing tests:** no file is the default; write then parse is the same value; an unknown key or
  `problems = "maybe"` is `ok: false` with one plain sentence; `docs/teams.md` has a section naming the file and both
  choices.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(files): automata.editors.toml, the settings for everyone on a game`

### Task 10: Put: every changed file in one change

**Files:** Create `src/features/service/put.ts`, `service/allowed.ts`, `service/message.ts`. Modify `service/service.ts`
(the route `POST /api/put`), `service/save.ts`, `wire/wire.ts`, `api/api.ts`. `service/save.ts` and `/api/save` stay
until Task 33 removes their last caller. **First, move `oneLine` out of `save.ts`** (which Task 33 deletes) into
`service/message.ts`, and have `save.ts` import it from there; `put.ts` needs it. Test
`tests/features/service/put.test.ts`, `allowed.test.ts`, `tests/features/api/api.test.ts`.

**Interfaces (produces):**

```ts
// wire
export interface PutFile { readonly path: string; /** The content as data; the API writes the bytes. Undefined takes the file away. */ readonly value: unknown | undefined; readonly version: string | undefined }
export interface PutAsk { readonly game: GameRef; readonly files: readonly PutFile[]; readonly project?: ProjectChange; /** The project file's version the person started from; needed with `project`. */ readonly projectVersion?: string; readonly message: string }
export interface PutAnswer { readonly how: 'direct' | 'suggestion'; readonly versions: Readonly<Record<string, string>>; /** The project file's new text when it changed. */ readonly project?: WireFile; readonly mine: Waiting | undefined }
// These wire types are made here and used by pull request 5's `Edits` (Task 12): that pull request needs this one.
// api: Api gains  put(ask: PutAsk): Promise<Answer<PutAnswer>>
// service/allowed.ts
/** Which paths a person's change may touch: the level and world files the game lists, plus the ones `project.add` names (a level at content/levels/<id>.json, one world at content/worlds/<id>.json), never anything else. */
export function allowedPaths(listed: readonly ContentRef[], project: ProjectChange | undefined): ReadonlySet<string>
```

The API, in order: who the person is and their level (as `save.ts` does); every path is allowed; each `value` reads as
its own kind with the framework's `parseContent` and is written with `writeContent`; `project` is applied with
`changeProject` to the branch's own `automata.toml`; when the branch's `automata.editors.toml` says
`problems = "stop"`, the whole game with the change in place must load, else `'broken'` with the sentences; then one
`commitFiles` on the default branch (Edit, Owner) or on the person's waiting branch, opening the waiting change if
there is none (Suggest, Approve). The commit message is `oneLine(message, …)` as today.

- [ ] **Step 1: Write the failing tests:** a level, a new level, the world file and `project.add` land in one commit
  for an Owner and in one waiting change for a Suggest; a path outside `allowedPaths` (`automata.access.toml`,
  `src/main.ts`, `content/characters/crate.json`) is `'not-allowed'` and nothing is written; a `value` that is not a
  level is `'broken'` with the framework's sentence; one stale version is `'changed-elsewhere'` with that path and
  nothing is written (Review Focus 2); with `problems = "stop"` a door into a missing level is `'broken'`, and with the
  default the same ask is written; a visitor is `'signed-out'`; the bytes of every written file equal `writeContent`'s.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(service): put every changed file into the game in one change`

### Task 11: A waiting change of several files: look, approve, ask for a change, turn down, bring back

**Files:** Modify `src/features/service/approve.ts`, `waiting.ts`, `service.ts`, `service/open.ts` (`OpenAnswer.turnedDown`),
`github/repo.ts` (four calls), `wire/wire.ts`, `api/api.ts`, the pretend GitHub. Create `service/ask.ts`. Test
`tests/features/service/waiting.test.ts`, `approve.test.ts` (new), `ask.test.ts`, `tests/fixtures/fake-github/server.test.ts`.

**Interfaces (produces):**

```ts
// Repo gains
comment(number: number, text: string): Promise<Answer<true>>                              // a comment the App writes on the change
comments(number: number): Promise<Answer<readonly { at: number; text: string }[]>>         // newest first
reopenPull(number: number): Promise<Answer<true>>
/** The newest closed, unmerged pull whose head is `branch`; undefined when there is none. */
closedPull(branch: string): Promise<Answer<Pull | undefined>>
// service/ask.ts: the two fixed first lines the App writes, and the one place that reads them back
export const ASKED = 'Change asked for by '        // + the login, then a blank line, then the words
export const NOT_PUT_IN = 'Not put in by '           // + the login
// wire
// Waiting gains   readonly asked?: { readonly by: string; readonly words: string; readonly at: number }
// OpenAnswer gains   readonly turnedDown: { readonly by: string; readonly at: number } | undefined
// Api gains
askChange(ask: ChangeAsk & { readonly words: string }): Promise<Answer<true>>   // POST /api/ask
reopen(ask: ChangeAsk): Promise<Answer<true>>                                    // POST /api/reopen: the Undo of a turn-down
clearTurnedDown(game: GameRef): Promise<Answer<true>>                            // POST /api/clear-turned-down: "Got it"
```

**Why comments (audit H2, "My calls" 16).** Every waiting change is a pull request the App opened, so the App is its
author, and GitHub answers 422 ("Can not request changes on your own pull request") to a review that requests changes
on it. So "Ask for a change" is a comment the App writes: its first line is `ASKED` and the person's login (taken from
the session, never from the page), then a blank line, then the words (1 to 500 characters). `Waiting.asked` is the
newest such comment that is newer than the change's last commit: when its author sends again, it is answered and gone.
The pretend GitHub learns the same rule (it answers 422 to a changes-requested review by the pull request's author), so
no later task can bring a review back unseen. An agent reading the pull request sees the same words.

**Turning down.** `turnDownChange` keeps its route and its rules (someone who may approve may turn any down; anyone may
take their own back). For an approver turning down someone else's change it now closes the pull, **keeps the branch**,
and writes a comment whose first line is `NOT_PUT_IN` and the login. For an author taking their own back it closes the
pull and deletes the branch, as today; there is no second "take back" route (audit L5). `reopen` is the Undo: for
someone who may approve, when the newest closed unmerged pull from an `automata/` branch in this repo still has its
branch and no other pull is open from it; else `'not-found'`. `OpenAnswer.turnedDown` is the author's own: their branch
exists, nothing is open from it, and its newest closed pull has a `NOT_PUT_IN` comment. A Suggest person's next Put
starts the branch afresh (as `save.ts` already does for a leftover branch), which clears it; `clearTurnedDown` deletes
the leftover branch (their own only; nothing to delete is fine).

**Approving (audit M2).** `approveChange` and `showChange` use `allowedPaths` (Task 10) with the change's own added and
removed level files, so a new level and its lines in `automata.toml` can be looked at and approved. The game is loaded
for the check **with the change's own `automata.toml` and files in place** (so a level the change lists is there), and
**a problem no longer refuses**: it refuses with `'broken'` only when the default branch's `automata.editors.toml` says
`problems = "stop"`, as Put does. The editor's sheet shows the problems first (Task 36).

- [ ] **Step 1: Write the failing tests:** a waiting change with a new level, `automata.toml` and the world file has
  `here: true` and approves; one that touches `src/main.ts` still has `here: false`; an approval of a change whose game
  has a problem goes through by default and is `'broken'` with `problems = "stop"`; a change that lists a new level
  approves (the game is loaded with the change's own `automata.toml`); ask for a change shows in `Waiting.asked` for the
  author's next open and is gone after the author's next commit; asking on your own change is `'own-change'`; the pretend
  GitHub refuses a changes-requested review by a pull request's author (a test of the fake itself); an approver's turn
  down closes the pull, keeps the branch and writes the `NOT_PUT_IN` comment, `reopen` makes it wait again, and a second
  `reopen`, or one after the author sent again, is `'not-found'`; the author's `turnedDown` is set after a turn-down and
  cleared by a new Put and by `clearTurnedDown`; an author's own take-back deletes the branch and sets nothing.
- [ ] **Step 2 to 4: push red, implement (the pretend GitHub learns the four calls and the 422), push green.**
- [ ] **Step 5: Commit** `feat(service): waiting changes of several files, asked, turned down, brought back`

## Pull request 5: what a person holds (pure)

### Task 12: Everything changed, with one history

Needs pull request 4 (it merged): `PutFile` and `PutAnswer` are Task 10's wire types and `ProjectChange` is Task 8's.

**Files:** Create `src/features/game/changes.ts`. Modify `game/game.ts`, `game/open.ts` (`OpenGame` gains
`worldPath: string | undefined`). Test `tests/features/game/changes.test.ts`.

**Interfaces (produces):**

```ts
export interface Working {
  readonly levels: Readonly<Record<string, Level>>
  /** Undefined: the game has no world file (yet). */
  readonly world: WorldFile | undefined
  /** automata.toml's text. */
  readonly project: string
}
export interface Edits { readonly base: Working; readonly now: Working; readonly past: readonly Working[]; readonly future: readonly Working[] }
export const HISTORY = 200
export function startEdits(game: OpenGame): Edits
/** A new step. The same `Edits` when `next` equals `now` by value; drops the oldest step past HISTORY; empties `future`. */
export function change(edits: Edits, next: Working): Edits
export function undo(edits: Edits): Edits
export function redo(edits: Edits): Edits
export function isChanged(edits: Edits): boolean
/** One level changed by a pure function; the same `Edits` when the function gives the same level back. */
export function inLevel(edits: Edits, levelId: string, fn: (level: Level) => Level): Edits
/** What would be put in: each file that differs from `base`, as `PutFile`s, and the project's change. */
export function toPut(game: OpenGame, edits: Edits): { readonly files: readonly PutFile[]; readonly project: ProjectChange | undefined }
/** The game the page holds after a put: new versions, new texts, `base` moved up to `now`. */
export function afterPut(game: OpenGame, edits: Edits, answer: PutAnswer): { readonly game: OpenGame; readonly edits: Edits }
/** The edited game as texts, for `loadGame`, `readGame` and play. */
export function readerOf(game: OpenGame, edits: Edits): (path: string) => Promise<string>
```

- [ ] **Step 1: Write the failing tests:** a move and its undo leave `isChanged` false and `toPut` empty; undo then
  redo is the same `now`; a change after an undo empties `future`; 201 changes keep 200 steps; a new level gives
  `toPut` one new file with `version: undefined` and `project.add` with its path; a deleted level gives a `PutFile`
  with `value: undefined` and `project.remove`; `readerOf` gives `writeContent`'s text for a changed level and the
  opened text, byte for byte, for an unchanged one.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(game): everything a person changed, with one history`

### Task 13: Changes kept on the device, and what they are called

**Files:** Create `src/features/game/drafts.ts`, `game/describe.ts`. `game/draft.ts` and `levels/compare.ts` stay until
pull request 7 removes their last users. Test `tests/features/game/drafts.test.ts`, `describe.test.ts`.

**Interfaces (produces):**

```ts
// drafts.ts: one key per changed file, `af.draft:<owner>/<name>:<path>`, holding { version, text } (text undefined: taken away)
export function keepDrafts(store: Storage, game: OpenGame, edits: Edits): void     // writes changed files, removes the keys of files no longer changed
export type Taken = { readonly edits: Edits; readonly moved: readonly string[] }   // `moved`: paths whose file changed in the game since
export function takeDrafts(store: Storage, game: OpenGame): Taken | undefined       // undefined: nothing kept
export function dropDrafts(store: Storage, game: OpenGame): void
// describe.ts
export type ChangeLine =
  | { readonly kind: 'moved' | 'added' | 'deleted' | 'renamed' | 'settings' | 'order'; readonly level: string; readonly thing: string }
  | { readonly kind: 'ground' | 'start' | 'joined'; readonly level: string }
  | { readonly kind: 'level-new' | 'level-deleted' | 'level-moved' | 'level-renamed'; readonly level: string }
export function describe(base: Working, now: Working): readonly ChangeLine[]
/** A few words for the game's history: "Move Crate 1 in Level 1", "3 changes in Level 1", "5 changes in 2 levels". */
export function titleOf(lines: readonly ChangeLine[]): string
```

A draft whose `version` is not the file's any more is not dropped: it comes back in `moved`, with the kept text as
the person's side, for Task 14's merge (the draft also keeps `base`, the text it started from).

- [ ] **Step 1: Write the failing tests:** keep then take gives the same `now`; a key with text that is not JSON, a
  draft for a path the game no longer lists and a draft from the old single-level form (`{ version, level }`) are each
  removed and the rest still taken (Review Focus 3); a file that moved on comes back in `moved`; a full store throws
  nothing; `describe` of a crate moved and moved back is empty, of one crate moved is one `moved` line, of painted
  tiles one `ground` line however many tiles, of a new level one `level-new` line and no line for its things;
  `titleOf` gives the three forms above.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(game): every changed file kept on the device, and what a change is called`

### Task 14: Two people's changes, thing by thing

**Files:** Create `src/features/game/merge.ts`. Test `tests/features/game/merge.test.ts`.

**Interfaces (produces):**

```ts
export type Clash =
  | { readonly what: 'thing'; readonly level: string; readonly thing: string; readonly mine: LevelThing | undefined; readonly theirs: LevelThing | undefined }
  | { readonly what: 'ground' | 'starts' | 'look'; readonly level: string }
  | { readonly what: 'place'; readonly level: string; readonly mine: LevelPoint | undefined; readonly theirs: LevelPoint | undefined }
  | { readonly what: 'level'; readonly level: string; readonly gone: 'mine' | 'theirs' }
export interface Merged { readonly now: Working; readonly clashes: readonly Clash[]; /** What came in from the game that the person had not touched. */ readonly theirs: readonly ChangeLine[] }
/** Lays `mine` over `theirs`, both made from `base`. Where they clash, `now` holds theirs until `keep` says otherwise. */
export function merge(base: Working, mine: Working, theirs: Working): Merged
export function keep(merged: Merged, mine: Working, clash: Clash, whose: 'mine' | 'theirs'): Merged
```

The rules, each piece on its own: a piece only one side changed is that side's; changed the same way by both is
that; changed differently by both is a clash. The pieces of a level: each thing by its id (moved by one and deleted by
the other is a clash, whose choices are "keep it where I put it" and "it stays deleted"); the ground, tile by tile (two
different letters on one tile, or a size changed by either side, is one `ground` clash for the level); `starts`; and
`sky`, `ground`, `view`, `backdrop`, `tileset` and `joints` together as `look`. Two new things with one id: mine takes
the next free id, no clash. Things keep their order, mine's new ones last. The world file: each level's `at` is a
piece. A level one side deleted and the other changed is a `level` clash. The project text is not merged as text: my
`ProjectChange` is applied again to theirs.

- [ ] **Step 1: Write the failing tests,** one per rule above, plus: merging with `theirs === base` gives `mine`;
  with `mine === base` gives `theirs` and no clash; `keep(…, 'mine')` then `keep(…, 'theirs')` on the same clash ends
  as theirs; every merged level passes the framework's `LevelSchema`; `theirs` lists a crate they moved that I never
  touched.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(game): two people's changes laid together, thing by thing`

## Pull request 6: level and map edits (pure)

Every function here is `(level, …) => Done`, used through `inLevel`. They are new, in `levels/things.ts`, `ground.ts`,
`values.ts`, `level-files.ts` and `map/arrange.ts`; **this pull request removes nothing.** `levels/edit.ts` keeps today's
`moveThing`, `nudgeThing`, `LevelEdit`, `undo`, `isDirty` and `describeChange` for the old drawing: the last four go when
pull request 7 removes their last users, and `moveThing` and `nudgeThing` go when pull request 9 (Task 26) moves the
drag onto `moveThings`. That is why pull request 7 does not wait for this one.

```ts
// levels/done.ts
export type Why = 'solid' | 'same' | 'no-such-thing' | 'outside' | 'occupied' | 'limit' | 'not-allowed' | 'taken'
export type Done<T = Level> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly why: Why }
```

### Task 15: Things: move, place, copy, delete, rename

**Files:** Create `src/features/levels/done.ts`, `things.ts`. Modify `levels/levels.ts` (the exports). Test
`tests/features/levels/things.test.ts`. `levels/edit.ts` is left alone (see above).

**Interfaces (produces):**

```ts
export function moveThings(level: Level, characters: Characters, ids: readonly string[], by: Point, lineUp: boolean): Done   // all move or none; `lineUp` false snaps to STEP, true to whole tiles
export function nudgeThings(level: Level, characters: Characters, ids: readonly string[], way: 'left' | 'right' | 'up' | 'down'): Done   // one tile
/** The next free id: "crate-2" when "crate-1" is there; the lowest free number from 1. */
export function nextId(level: Level, character: string): string
export function placeThing(level: Level, characters: Characters, character: string, at: Point): Done<{ level: Level; id: string; replaced?: string }>
/** For a `one-per-level` character that is already there: the old one's id, which `placeThing` would move. */
export function onlyOne(level: Level, characters: Characters, character: string): string | undefined
export function copyThings(level: Level, characters: Characters, ids: readonly string[], by: Point): Done<{ level: Level; ids: readonly string[] }>
export function deleteThings(level: Level, ids: readonly string[]): Done      // also takes their ids out of every `thing` value and every joint that held them
export function renameThing(level: Level, id: string, name: string): Done     // `idOf(name)`; 'taken' when in use; mends `thing` values and joints in this level
export function moveStart(level: Level, characters: Characters, hero: string, player: number, at: Point): Done
```

A new thing has no `values`. A copy keeps its values but not links to itself. A placed `one-per-level` thing keeps the
old one's id and values and reports `replaced`. Drawing order (`draw`) is Task 42a's; this task never reorders `things`,
because the spawn order is the order of the file (Owner's answer 2).

**Rename changes the id the files use** (audit L10). The card that asks for the name says so first, in plain words
(`levels.renameCareful`: "This changes the name the game's files use. If the game's own code, a saved game or a
recording uses the old name, it will not find it. You can undo this."), because the editor never reads a game's code:
the test game's code reads `crate-1`, and the Site reads its first thing and its recording. The tour never renames, and
the demo game's `crate-1` is never renamed by a task in this plan. A rename is one undoable step.

- [ ] **Step 1: Write the failing tests** on the fixture level: each function's plain case and its refusals (`solid`,
  `outside`, `same`, `taken`); `nextId` with `crate-1` and `crate-3` gives `crate-2`; deleting a gate empties it from a
  plate's `opens`; renaming a gate mends the plate; a thing whose character the game lacks moves as a 1 by 1 box and
  is written back unchanged otherwise (Review Focus 1); two things moved together where one would hit solid: neither
  moves; `things` is in the same order after every function here; the rename card shows `levels.renameCareful`.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): place, copy, delete, order and rename things`

### Task 16: The ground: paint, box, fill, erase

**Files:** Create `src/features/levels/ground.ts`. Test `tests/features/levels/ground.test.ts`.

**Interfaces (produces):**

```ts
export interface Cell { readonly col: number; readonly row: number }
export interface Kind { readonly letter: string; /** The tileset's id for it, or 'solid' and 'empty'. */ readonly id: string; readonly solid: boolean }
/** What the ground can be: the level's tileset's kinds, or Solid ('#') and Empty ('.') without one. */
export function kindsOf(level: Level, tilesets: GameContent['tilesets']): readonly Kind[]
export function kindAt(level: Level, cell: Cell): string | undefined          // the letter; undefined outside
export function paint(level: Level, characters: Characters, cells: readonly Cell[], kind: Kind): Done   // skips cells outside and, for a solid kind, cells under a thing or a start; 'occupied' when all were skipped, 'same' when nothing changed
export function boxCells(a: Cell, b: Cell): readonly Cell[]
export function lineCells(a: Cell, b: Cell): readonly Cell[]                   // a finger's path between two moves, no gaps
/** Every cell joined to `from` by its sides with the same letter, inside the level. */
export function fillCells(level: Level, from: Cell): readonly Cell[]
```

Erase is `paint` with the empty kind (the tileset's first kind that is not solid, or `.`).

- [ ] **Step 1: Write the failing tests:** paint one cell and the row's other letters do not move; a letter the
  tileset lacks is `kindAt`'s letter and is left alone by painting elsewhere (Review Focus 1); solid over the crate
  skips its cell; `fillCells` on a 256 by 256 empty level gives 65,536 cells and returns (Review Focus 4), and on a
  walled pocket only the pocket; `lineCells` from (0, 0) to (5, 2) has no gap; a level without a tileset has exactly
  Solid and Empty.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): paint what the ground is`

### Task 17: A thing's values, and what a switch opens

**Files:** Create `src/features/levels/values.ts`. Test `tests/features/levels/values.test.ts`.

**Interfaces (produces):**

```ts
export interface ValueRow { readonly id: string; readonly declaration: ValueDeclaration | undefined; readonly value: ThingValue | undefined; /** True when the thing holds its own value, not the character's default. */ readonly own: boolean }
/** A thing's values in its character's order, then any the character does not declare (shown, never edited). */
export function rowsOf(thing: LevelThing, character: Character | undefined): readonly ValueRow[]
/** The nearest number the declaration allows: inside `least` to `most`, on `step`. */
export function hold(declaration: Extract<ValueDeclaration, { type: 'number' }>, n: number): number
/** Sets one value, held to its declaration. A value equal to the default is taken out of the file. */
export function setValue(level: Level, characters: Characters, thing: string, value: string, to: ThingValue | undefined): Done
/** Which things this value may link to: the declaration's `kinds`, never itself, never past `most`. */
export function mayOpen(level: Level, characters: Characters, thing: string, value: string): readonly string[]
export function link(level: Level, characters: Characters, from: string, value: string, to: string): Done      // 'limit' at `most`
export function unlink(level: Level, from: string, value: string, to: string): Done
/** What several picked things have in common: a value, or 'not-the-same'. */
export function shared(rows: readonly (readonly ValueRow[])[]): readonly (ValueRow | { readonly id: string; readonly mixed: true })[]
/** Where a door leads, as choices: every level but this one, and for a level, its start and each of its doors. */
export function waysOut(levels: Working['levels'], characters: Characters, from: string): readonly { readonly level: string; readonly things: readonly string[] }[]
```

- [ ] **Step 1: Write the failing tests** with the links game of Task 2b (built from data in
  `tests/fixtures/links-game/`, never written out): `hold` at `least: 1, most: 8, step: 0.5` gives 8 for 9, 1 for 0, 3.5 for 3.4;
  `setValue` of the default leaves no key, and no `values` object when it was the last; a `path` value is `'not-allowed'`;
  an undeclared value is listed with `declaration: undefined` and `setValue` on it is `'not-allowed'` (Review Focus 1);
  `mayOpen` for `plate-1` is exactly the gates; a fifth link is `'limit'`; every result passes `loadGame` on the links
  game with that level swapped in.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): a thing's values held to their limits, and what a switch opens`

### Task 18: The map: move, push together, pull apart

**Files:** Create `src/features/map/arrange.ts`, `map.ts`. Test `tests/features/map/arrange.test.ts`.

**Interfaces (produces):**

```ts
export interface Box { readonly level: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number }
/** Every level as a box: where the world file puts it, or, for a level it leaves out or a game with no world file, in a row along the top, two tiles apart, in the project's order. */
export function boxes(working: Working, order: readonly string[]): readonly Box[]
export type Landing =
  | { readonly kind: 'free'; readonly at: LevelPoint }
  | { readonly kind: 'touch'; readonly at: LevelPoint; readonly joins: readonly Join[]; /** Edges that touch with one side solid. */ readonly walls: readonly Wall[] }
  | { readonly kind: 'overlap'; readonly over: string }
export interface Wall { readonly a: string; readonly b: string; readonly along: 'x' | 'y'; readonly from: number; readonly to: number; readonly open: 'a' | 'b' }
/** What letting go at `at` would do. `at` is snapped to whole tiles; within one tile of another level it snaps to touch. */
export function landing(working: Working, tilesets: GameContent['tilesets'], level: string, at: LevelPoint): Landing
/** Puts the level there, writing the world file (made at this first arrangement, id "world", when the game has none). 'occupied' on an overlap. */
export function moveLevel(working: Working, level: string, at: LevelPoint): Done<Working>
/** One tile. */
export function nudgeLevel(working: Working, tilesets: GameContent['tilesets'], level: string, way: 'left' | 'right' | 'up' | 'down'): Done<Working>
/** Moves the level two tiles straight away from every level it touches. 'same' when it touches none. */
export function pullApart(working: Working, tilesets: GameContent['tilesets'], level: string): Done<Working>
/** Every join, wall and door on the map, from `layoutWorld` and the levels' `leads-to` values. */
export function marksOf(working: Working, content: GameContent): { readonly joins: readonly Join[]; readonly walls: readonly Wall[]; readonly doors: readonly { readonly from: { level: string; thing: string }; readonly to: { level: string; thing?: string } }[]; readonly start: string }
/** The view that shows every level, with a margin of two tiles: "Whole world". */
export function wholeWorld(all: readonly Box[], screen: { w: number; h: number }): { readonly x: number; readonly y: number; readonly scale: number }
```

Joins come only from the framework's `layoutWorld` with `openTile(tilesets)`; `Wall` is the part of a shared side
where exactly one level is open, worked out with the same `openTile`.

- [ ] **Step 1: Write the failing tests** on the links game (room-2 at 20, 0 and room-3 at 36, 0 touch on rows 5 to
  7): `marksOf` has that one join and three doors; `landing` of room-1 at (3.4, 0.2) snaps to (4, 0) and is `touch` with
  room-2; over room-2 it is `overlap`; `moveLevel` there is `'occupied'`; `pullApart('room-3')` leaves no join and its
  undo by `moveLevel` back restores it; a game with no world file gets one with every level on the first `moveLevel`,
  and `boxes` before that is a row in the project's order; closing rows 5 to 7 on room-3's side with `paint` turns the
  join into one `Wall` with `open: 'a'`; room-1, which Task 2b opens on rows 5 to 7 of its right edge, landed at (4, 0)
  against room-2's solid left edge is `touch` with no join and one `Wall` with `open: 'a'`; `wholeWorld` of 64 boxes holds every box inside the screen.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(map): push levels together and pull them apart`

### Task 19: A new level, a renamed level, a deleted level

**Files:** Create `src/features/levels/level-files.ts`. Test `tests/features/levels/level-files.test.ts`.

**Interfaces (produces):**

```ts
/** "level-9": the lowest free number from 1 after the highest level number in use. */
export function nextLevelId(working: Working): string
/** Never empty: 16 by 9, the bottom row solid, the hero's start at (2.5, 7.5), the game's `one-per-level` goal (when a character has one) at (13.5, 7.5). Listed in the project (and added to `levels` when the game has that line), placed on the map at `at`. */
export function newLevel(working: Working, content: GameContent, at: LevelPoint): { readonly working: Working; readonly id: string }
/** The file's name, the project's lines (`start` and `levels` too), the world file, and every door that led to it. 'taken' when in use. It warns as Task 15's rename does, and for a level adds that a player's saved game remembers the level by this id. */
export function renameLevel(working: Working, level: string, name: string): Done<Working>
/** Its file, its lines, its place on the map; every `leads-to` that named it is taken out of its door. 'not-allowed' for the `start` level and for the last level. */
export function deleteLevel(working: Working, level: string): Done<Working>
export function copyLevel(working: Working, level: string, at: LevelPoint): { readonly working: Working; readonly id: string }
```

A new level copies `tileset`, `sky`, `ground` and `backdrop` from the level it was made beside (the picked one, else
the start). The fall band of the spec's call 6 is added only when the pinned framework's `Project` has a `lost` rule;
it has none on `596348d`, so the task checks at Pin 1 and leaves the band out if it is still not there.

- [ ] **Step 1: Write the failing tests:** a new level in the links game is `level-1` (none numbered) and in the Crate
  Game is `level-2`; in the links game its id is added to `levels`, and the Crate Game (no `levels` line) gets none; the
  edited game loads with `loadGame` through `readerOf`; rename `room-2` to "Cellar" gives
  `cellar` in the project text, the world file and `room-1`'s `exit` door, and the old path is gone from `toPut`;
  deleting `room-2` leaves `exit` with no `to`, and one `undo` brings back the level, its place and the door's `to`;
  deleting the start level is `'not-allowed'`.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): a new level is never empty; rename and delete mend what pointed at it`

## Pull request 7: the shell's frame

From here, each screen task names its mockup pages. The component is built to the page at the five sizes, with the
page's own words, from `shell.css`'s final rules (later sections win). A journey takes its picture at the five sizes.

### Task 20: What a workspace tells the shell, and the top bar

**Files:** Create `src/features/shell/workspace.ts`, `TopBar.svelte`, `Faces.svelte`, `GameMenu.svelte`,
`EditorMenu.svelte`, `PartMenu.svelte`, `status.ts`, `shell.ts`. Test `tests/features/shell/status.test.ts`,
`topbar.browser.test.ts`. Mockups: `world-levels`, `shell-menu`, `shell-menu-out`, `shell-editors`, `world-levels-parts`.

**Interfaces (produces):**

```ts
// workspace.ts
export const TOOLS = ['pick', 'place', 'paint', 'erase', 'join'] as const
export type Tool = (typeof TOOLS)[number]
export interface Workspace {
  readonly id: 'world'
  readonly parts: readonly { readonly id: string; readonly words: string }[]
  /** The tools that have a job on this page; one left out is not drawn. */
  readonly tools: readonly Tool[]
}
export const EDITORS: readonly { readonly id: string; readonly icon: IconName; readonly built: boolean; readonly about: string /* a words key */ }[]   // world built; characters, feel, sound, story, screens not
// status.ts
export type Status =
  | { readonly kind: 'up-to-date' } | { readonly kind: 'changes'; readonly count: number } | { readonly kind: 'waiting'; readonly by: string }
  | { readonly kind: 'more'; readonly count: number; readonly by: string } | { readonly kind: 'to-check'; readonly count: number }
  | { readonly kind: 'offline' } | { readonly kind: 'problems'; readonly count: number }
/** What the top bar says: offline first, then problems, then the person's own changes, then what waits. */
export function statusOf(facts: { online: boolean; problems: number; changes: number; mine: Waiting | undefined; toCheck: number }): readonly Status[]
export type MainButton = 'put' | 'send' | 'keep' | undefined
export function mainButton(level: AccessLevel, signedIn: boolean, changes: number): MainButton
// Faces.svelte props: who is in the game (`OpenAnswer.people`, Task 23). Initials on a colour made from the login, at
// most four and "+2"; one 44 by 44 button that opens "Who can change it". Drawn only when `people` is not empty.
{ people: readonly { readonly login: string }[]; onopen(): void }
```

**The editors that are not built** are drawn exactly as the approved `shell-editors` page draws them: the name, its icon
and one line of what it is for, so no row is a dead end (spec call 1). A tap opens a `Note` in plain words ("Characters
is not in this version yet. It will be where you decide who is in the game and how they move.") with "Got it", and goes
nowhere. **Two differences from the words around it, named in the pull request:** the spec's call 1 says "Comes later" on
those rows, and design language section 8 says "no 'Soon'", so neither word is on a screen; and the page's World row
reads "Levels, tiles and scenes" while only levels and the map are built, so the built row reads "Levels and the world
map". Every sentence goes through the drunk-grandma test.

- [ ] **Step 1: Write the failing tests:** `mainButton` is `'put'` for Edit and Owner, `'send'` for Suggest and
  Approve, `'keep'` signed out, and `undefined` with no change; `statusOf` orders as above and says "Send 1 more" only
  when there is a waiting change and new changes; in the browser at each size the bar is 56, 48 or 44 high as the design
  language says, every control is 44 by 44, Undo is `aria-disabled` with nothing to undo, the game's menu signed out has
  no "Who can change it", and on a phone the part's name opens one menu holding the parts, the editors and the game's
  menu; every unbuilt editor's row is a 44-high button whose tap opens its `Note` with "Got it" and changes nothing, and
  no row in any language says "Comes later" or "Soon" (a test over the words); `Faces` with five people draws four and
  "+1", and with none draws nothing.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(shell): the top bar and its three menus`

### Task 21: The toolbar and the panels

**Files:** Create `src/features/shell/Toolbar.svelte`, `ListPanel.svelte`, `SettingsPanel.svelte`, `Hold.svelte`,
`docks.ts`, `keys.ts`. Test `tests/features/shell/docks.test.ts`, `keys.test.ts`, `panels.browser.test.ts`. Mockups:
`world-levels-rail`, `world-levels-list`, `world-levels-settings`, `world-levels-hidden`, `world-levels-thumb`,
`world-levels-hold`, `world-levels-rows`, `world-levels-glass`, `world-levels-solid`.

**Interfaces (produces):**

```ts
// docks.ts
export interface Docks { readonly list: 'closed' | 'list' | 'add'; readonly settings: 'shown' | 'hidden'; readonly hold: boolean }
/** Where each dock sits at a size: the toolbar down the left edge when wide, along the bottom otherwise; the settings a side panel, or a one-line bar that pulls up into a sheet. `device` (Task 4's `deviceWord`) is what tells an iPad sideways from a computer, which are both `'wide'` but have different defaults: the list a rail on the iPad and open on a computer, the bar 56 and 48 high. */
export function layout(device: 'ipad' | 'phone' | 'computer', size: SizeClass, docks: Docks, picked: boolean, leftHand: boolean): { readonly toolbar: 'left' | 'bottom'; readonly list: 'rail' | 'beside' | 'over'; readonly settings: 'side' | 'tab' | 'bar' | 'sheet' | 'none' }
/** At most two things float over the level: opening a third closes the oldest. */
export function floating(open: readonly string[], next: string): readonly string[]
// keys.ts
export interface Key { readonly id: string; readonly key: string; readonly words: string }
export const KEYS: readonly Key[]       // V A B E L, ⌘Z, ⇧⌘Z, ⌘K, Space (play), ?, Delete, the arrows, ⌘D, ⌘C, ⌘V, Escape
export function commandFor(event: { key: string; meta: boolean; ctrl: boolean; shift: boolean; inField: boolean }): string | undefined
```

The row size is read when a panel opens, never under a finger. The free thumb's buttons are drawn only on touch; a
computer uses Shift and Alt. "I draw with my left hand" mirrors the hold buttons and the panels.

- [ ] **Step 1: Write the failing tests:** `layout` for each of the five sizes and each `Docks` equals the mockups (a table
  of 24 rows in the test, an iPad sideways and a computer on rows of their own); `floating(['bar', 'pad'], 'menu')` is `['pad', 'menu']`; `commandFor` gives nothing while typing in
  a field, and `'undo'` for ⌘Z and Ctrl+Z; in the browser a picked thing shows the settings, Hide leaves the tab with
  the thing's name and a tap brings them back; with a mouse the rows are 30 high the next time the panel opens and never
  change while it is open; with `leftHand` the hold buttons are on the other side.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(shell): the toolbar, the list, the settings and the free thumb's buttons`

### Task 22: World takes over the page

**Files:** Create `src/features/world/World.svelte`, `world-workspace.ts`, `world.ts`,
`src/features/team/Games.svelte`, `team.ts`. Modify `src/features/suite/App.svelte`, `route.ts`, `suite.ts`,
`tests/fixtures/journey.ts` (`SIZES` becomes the five of "My calls" 10; the helpers find the new controls). Delete
`suite/LevelScreen.svelte`, `GameHome.svelte`, `AddEditor.svelte`, `PickGame.svelte`, `levels/Levels.svelte`,
`ui/Screen.svelte`, `Choice.svelte`, `Notice.svelte` and what only they used. Rewrite the nine journeys to the new
screens, keeping what each proves. Mockups: `shell-games`, `shell-signin`, `shell-signin-kept`, `world-levels`.

**Interfaces (produces):**

```ts
// suite/route.ts
export type Route =
  | { screen: 'games' }
  | { screen: 'level'; owner: string; name: string; level?: string }      // no level: the game's start
  | { screen: 'map'; owner: string; name: string }
// World.svelte props
{ game: OpenGame; api: Api; route: Route; me: Me; go(route: Route): void }
```

Old addresses (`#/o/n`, `#/o/n/share`, `#/o/n/waiting`, `#/o/n/waiting/3`) open the level with that sheet asked for,
so a kept link still works. In this pull request the level is still the old drawing (`level-canvas.ts` as it is), a
drag still moves a thing through today's `moveThing` (`levels/edit.ts`) wrapped in `inLevel`, so the history is already
`Edits` and `moveThings` arrives with Task 26, and the main button still calls today's one-file save (only the open level
can have changed here, since the map and level switching with changes come later); Share, Waiting and the waiting change
stay as they are, opened from the game's menu, until pull requests 13, 15 and 16 replace them. This pull request needs
pull requests 3 (the kit, the look) and 5 (`Edits`, `inLevel`) and nothing from 6. The
list panel shows the level's things with `Rows` (Review Focus 4).

- [ ] **Step 1: Write the failing tests:** `parseRoute` and `routeHash` round-trip the three routes and map the four
  old addresses; the nine journeys, rewritten, at the five sizes; a browser test that a level of 1,024 things has fewer
  than 100 rows in the list.
- [ ] **Step 2 to 4: push red, implement, push green,** with the `screenshots` label on the last push.
- [ ] **Step 5: Commit** `feat(world): the approved shell replaces the old screens`

## Pull request 8: the team's files (the API)

### Task 23: History, notes, pictures and the settings for everyone

**Files:** Create `src/features/files/notes-file.ts`, `src/features/service/history.ts`, `notes.ts`, `settings.ts`,
`pictures.ts`. Modify `github/repo.ts` (`readBytes`), `service/service.ts`, `service/open.ts` (`OpenAnswer` gains
`editors`, `people` and `pictures`), `service/enter.ts` (`suggestionBranch`), `wire/wire.ts`, `api/api.ts`, `game/open.ts`
(`OpenGame` carries the same three), the pretend GitHub (`readBytes`: the raw bytes), `docs/teams.md`. Test
`tests/features/files/notes-file.test.ts`, `tests/features/service/history.test.ts`, `notes.test.ts`, `settings.test.ts`,
`pictures.test.ts`, `tests/fixtures/fake-github/server.test.ts`.

**Interfaces (produces):**

```ts
// files/notes-file.ts
export const NOTES_FILE = 'automata.notes.toml'
export const NOTES_BRANCH = 'automata/notes'
export interface Note { readonly id: string; readonly level: string; readonly thing?: string; readonly at?: LevelPoint; readonly by: string; readonly when: string /* ISO */; readonly words: string; readonly answers: readonly { readonly by: string; readonly when: string; readonly words: string }[]; readonly done: boolean }
export interface NotesFile { readonly format: 1; readonly notes: readonly Note[] }
export function parseNotes(text: string | undefined): NotesFile          // no file, or one that does not read: no notes
export function writeNotes(file: NotesFile): string
export function addNote(file: NotesFile, note: Omit<Note, 'id' | 'answers' | 'done'>): NotesFile     // id "note-<n>", the next free
export function answer(file: NotesFile, id: string, a: { by: string; when: string; words: string }): NotesFile
export function setDone(file: NotesFile, id: string, done: boolean): NotesFile
// wire
export interface HistoryLine { readonly commit: string; readonly by: string; readonly at: number; readonly words: string; readonly levels: readonly string[]; /** The world file was touched. */ readonly map: boolean }
export interface HistoryPage { readonly lines: readonly HistoryLine[]; readonly more: boolean }
export interface OpenPicture { readonly path: string; readonly base64: string }
export interface Person { readonly login: string; readonly level: AccessLevel }
export type NoteAsk = { readonly game: GameRef } & ({ readonly add: Omit<Note, 'id' | 'answers' | 'done' | 'by' | 'when'> } | { readonly answer: { readonly id: string; readonly words: string } } | { readonly done: { readonly id: string; readonly done: boolean } })
// OpenAnswer gains   editors: EditorsFile; people: readonly Person[]; pictures: readonly OpenPicture[]
// Repo gains
readBytes(path: string, branch: string): Promise<Answer<{ bytes: Uint8Array; version: string }>>
// Api gains
history(game: GameRef, page: number): Promise<Answer<HistoryPage>>       // GET /api/history?page=0 to 4: ten commits a page
notes(game: GameRef): Promise<Answer<NotesFile>>                         // GET /api/notes
note(ask: NoteAsk): Promise<Answer<NotesFile>>                           // POST /api/notes: Look or above; `by` and `when` are the API's
settings(ask: { game: GameRef; editors: EditorsFile; version: string | undefined }): Promise<Answer<EditorsFile>>   // POST /api/settings: Owner only, on the default branch
```

**What changed, in few calls (audit M7).** A page is ten commits and there are at most five pages. For a page the API makes
one `history(branch, 'content', 50)` call (Task 7), takes that page's ten rows and makes one `commitPaths` call for each:
eleven calls a page, never fifty. A commit's `levels` are the listed level files it touched, named from their paths, and
`map` is whether it touched the world file; a commit that touched only other content has neither, and shows its own
words. `more` is true when the fifty held more rows than the page. The sheet asks for the next page only on "Show more".

**Pictures (audit M1, "My calls" 17).** `pictures.ts` reads each listed tileset file's `image`. A picture must be a `.png`
under the game's own folder (no `..`), at most 1 MB, and at most 4 MB in all; `open` sends the ones that pass, as base64,
and leaves out the rest without failing. The pretend GitHub answers a path's raw bytes (the contents answer gives them as
base64, and the raw media type gives the bytes), and a file's `version` is the blob's sha of those bytes.

**People.** `people` are the logins and levels in the game's `automata.access.toml`, read from the default branch on every
open (the API already reads it to work out the person's own level), so a Look person sees the faces too.

**The notes branch (audit L9).** Notes live on `automata/notes`, a branch no pull request is ever opened from, so it is
never listed as a waiting change. A person whose login is `notes` would save to the same name, so for that one login
`suggestionBranch` gives `automata/notes-` (GitHub never ends a login with a hyphen, so no one else can have that
name). The test game's `CLAUDE.md` says the editors' save branches do not count toward its five; it needs the words "and
`automata/notes`". That is a one-line docs pull request in AutomataFrameworkExamples, asked of the coordinator, never made
from here.

The notes branch is made from the default branch's head the first time a note is written and only ever holds a change
to the one file; a write that finds the file changed reads it again and applies the same act once more. `words` are 1
to 500 characters. A visitor may read the demo game's notes and write none.

- [ ] **Step 1: Write the failing tests:** each notes function; write then parse is the same; the first note makes the
  branch and the default branch's head does not move; two people adding at once both land; a Look person may add, a
  visitor is `'signed-out'`; a login called `notes` saves to `automata/notes-` and is not mistaken for the notes branch;
  settings by an Approve person is `'not-allowed'` and by an Owner is one commit of `automata.editors.toml`; `history`
  for page 0 makes one list call and ten `commitPaths` calls (the pretend GitHub counts), names levels from the paths,
  is newest first, and page 4's `more` is false; `open` sends the Crate Game's tileset picture as the same bytes as
  `fixtureBytes()`, leaves out a 2 MB picture and a path with `..`, and still opens; `people` lists the access file's
  logins; `docs/teams.md` names the notes file and its branch.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(service): what changed, notes on their own branch, the game's pictures, and the settings for everyone`

## Pull request 9: levels on screen

### Task 24: The level in the game's own art, and the view

**Files:** Modify `src/features/levels/level-canvas.ts`. Create `src/features/levels/view.ts`, `art.ts`,
`MiniMap.svelte`. Test `tests/features/levels/view.test.ts`, `level-canvas.browser.test.ts`, `mini-map.browser.test.ts`.
Mockups: `world-levels`, `world-levels-big`, `world-levels-edge`.

**Interfaces (produces):**

```ts
// view.ts
export interface Camera { readonly x: number; readonly y: number; readonly scale: number }     // tiles at the screen's middle; CSS pixels a tile
export function wholeLevel(level: Level, screen: { w: number; h: number }, insets: { top: number; right: number; bottom: number; left: number }): Camera
export function closeUp(level: Level, around: Point, screen: { w: number; h: number }): Camera   // 64 pixels a tile
export function zoomBy(camera: Camera, factor: number, about: Point /* screen */, screen: { w: number; h: number }): Camera   // held to 4 to 128 pixels a tile
export function slideBy(camera: Camera, px: Point): Camera
export function toScreen(camera: Camera, screen: { w: number; h: number }, at: Point): Point
export function toTiles(camera: Camera, screen: { w: number; h: number }, px: Point): Point
/** The small map's box: the part of the level on screen, in the small map's own pixels, and how many of them a tile is. */
export function miniMap(level: Level, camera: Camera, screen: { w: number; h: number }, mini: { w: number; h: number }): { readonly box: { x: number; y: number; w: number; h: number }; readonly scale: number }
/** A tap or a drag on the small map (a point in its pixels) as the camera that puts that spot at the screen's middle, scale kept. */
export function fromMini(level: Level, point: Point, camera: Camera, screen: { w: number; h: number }, mini: { w: number; h: number }): Camera
export interface LevelView { readonly tool: Tool; readonly picked: readonly string[]; readonly locked: ReadonlySet<string>; readonly hidden: ReadonlySet<string>; readonly camera: Camera; readonly ground: boolean /* the ground is picked */ }
// art.ts
/** What the framework's `loadArt` reads pictures with: a figure's and a backdrop's PNG painted in the page (`artFiles`), a tileset's PNG from `pictures` by its path (Task 23). Each goes through `createImageBitmap` on a `Blob`, never a `blob:` address, so `public/_headers` stays as it is. No request is made. */
export function readPictureOf(content: GameContent, pictures: readonly OpenPicture[]): ReadPicture
// level-canvas.ts: the page's one Pixi Application ("My calls" 15)
export interface Stage {
  /** The one canvas; the level view and the map draw into it, one at a time. */
  readonly canvas: HTMLCanvasElement
  readonly levels: LevelCanvas
  /** One level, small, as a copy on a 2D canvas: what the games list shows (Task 38). Calls wait their turn. */
  snapshot(content: GameContent, pictures: readonly OpenPicture[], level: Level, size: { w: number; h: number }): Promise<HTMLCanvasElement>
  destroy(): void
}
export function createStage(): Promise<Stage>
export interface LevelCanvas {
  show(content: GameContent, pictures: readonly OpenPicture[], level: Level, camera: Camera, look: { readonly faint: ReadonlySet<string>; readonly hidden: ReadonlySet<string>; readonly whatItIs: boolean; readonly grid: 'off' | 'tiles' | 'finer' }): void
  resize(w: number, h: number): void
  /** The same drawing as a container in the same Application, for the map: `map-canvas.ts` places it and keeps it. */
  picture(content: GameContent, pictures: readonly OpenPicture[], level: Level): unknown
}
```

Each thing is its figure's first pose (the framework's `Art.figure`), or its character's coloured box when it has no
figure or the character is missing; tiles are the tileset's pictures or the level's ground colour; the backdrop is
drawn behind. `whatItIs` tints each tile by its kind. `MiniMap.svelte` is shown only when part of the level is off the
screen: the level as a small picture at the top left with the part on screen boxed; dragging the box or tapping the map
goes there, and the box is a `role="slider"` that the arrow keys move one tile, so the drag has its buttons-and-keys way.

- [ ] **Step 1: Write the failing tests:** `toTiles(toScreen(p))` is `p`; `wholeLevel` keeps the whole level clear of
  the four insets; `zoomBy` keeps the tile under `about` under it and stops at both limits; in the three browsers, the
  pixel in the middle of the crate is the crate's colour at two zooms, a thing with a missing character is a box and
  nothing throws (Review Focus 1), a tile of the Crate Game's `ground` tileset is the picture's pixel (not the ground
  colour), a tileset with no picture draws the colour, and `readPictureOf` of a game with a figure and a tileset gives
  PNGs `loadArt` accepts with no request made and no `blob:` address; `miniMap` of a camera that shows the whole level
  is the whole small map, and `fromMini` of the box's own centre is the same camera; in the browser the small map is
  absent while the whole level is on screen, a drag of the box and a tap each move the camera, and the arrow keys move
  the box one tile; `Stage.snapshot` of the Crate Game's level is a 2D canvas of the size asked, and two calls at once
  both finish.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): the level in the game's own art, with a view that zooms and slides`

### Task 25: The marks, and the hand that touches them

**Files:** Create `src/features/levels/Marks.svelte`, `marks.ts`, `gestures.ts`. Test
`tests/features/levels/marks.test.ts`, `gestures.test.ts`, `marks.browser.test.ts`. Mockups: `world-levels`,
`world-levels-pencil`, `world-levels-more`.

**Interfaces (produces):**

```ts
// marks.ts
export interface Mark { readonly id: string; readonly kind: 'thing' | 'start' | 'handle' | 'arrow' | 'tag' | 'bar' | 'ghost' | 'note'; readonly box: { x: number; y: number; w: number; h: number } /* screen */; readonly hit: { x: number; y: number; w: number; h: number }; readonly name: string }
/** Every mark for the level at this camera. A hit area is the box grown to at least 44 by 44; where two would overlap, the smaller thing wins the shared part. */
export function marksFor(level: Level, characters: Characters, view: LevelView, screen: { w: number; h: number }, names: (id: string) => string): readonly Mark[]
// gestures.ts: what a stream of pointer events means, as plain data
export type Act =
  | { readonly kind: 'tap'; readonly at: Point; readonly on: string | undefined } | { readonly kind: 'hold'; readonly at: Point; readonly on: string | undefined }
  | { readonly kind: 'drag'; readonly phase: 'start' | 'move' | 'end' | 'cancel'; readonly from: Point; readonly to: Point; readonly on: string | undefined; readonly tool: boolean /* the tool acts, not the view */ }
  | { readonly kind: 'view'; readonly slide: Point; readonly zoom: number; readonly about: Point } | { readonly kind: 'hover'; readonly at: Point }
export function createGestures(options: { pointers(): Pointers; fingerDraws(): boolean; tool(): Tool }): { feed(event: PointerLike): readonly Act[] }
```

The rules `feed` holds: two fingers always slide and zoom the view; one finger on empty ground slides the view with
Pick, and with any tool once a Pencil has been seen and `fingerDraws` is off; a pen always does the tool; a finger tap
always taps; press and hold is 500 ms without moving 8 pixels; a pen moving with no button is `hover`; a second finger
landing mid-drag cancels the drag.

- [ ] **Step 1: Write the failing tests:** a 16-pixel thing has a 44 by 44 hit area; two crates side by side at 20
  pixels each split the shared part; each rule of `feed` above as a scripted event list; in the browser the picked
  crate has an accent ring with four handles, each mark is found by its name (`getByRole('button', { name: 'Crate 1' })`),
  and Tab reaches each thing in the list's order.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): the editor's marks over the level, and what a hand on them means`

### Task 26: Pick, Place and Erase

**Files:** Create `src/features/levels/ActBar.svelte`, `MovePad.svelte`, `Tray.svelte`, `ThingMenu.svelte`,
`LevelPart.svelte`, `clipboard.ts`. Modify `world/World.svelte`, `words/levels.ts`, `levels/edit.ts` (delete `moveThing`,
`nudgeThing` and what only they used: the drag and the pad now call `moveThings` and `nudgeThings` through `inLevel`) and
`tests/features/levels/edit.test.ts` (their tests go with them). Test `tests/features/levels/level-part.browser.test.ts`,
`tests/journeys/pick-place-erase.journey.test.ts`. Mockups:
`world-levels-settings`, `world-levels-exact`, `world-levels-more`, `world-levels-place`, `world-levels-add`,
`world-levels-one-start`, `world-levels-hold`.

`LevelPart.svelte` is the level on screen: the canvas, the marks, the tool in hand and the level's own floating parts.
It turns `Act`s into the pure edits of Tasks 15 to 17 through `inLevel`, and every refusal into a `Note` that says why.

- Pick: tap picks and opens the settings; drag moves (a faint outline where it came from); the bar over a picked thing
  is Move, Make a copy, Delete and the three dots, never on top of the thing; Move opens the pad of four arrows, a tile a
  tap; the three dots and press and hold open the same menu (Rename, Lock, Hide, Copy to paste, Add a note; "Bring to
  the front" and "Send to the back" are added by Task 42a, since they set `draw`, which needs the framework's F5); Rename
  first shows `levels.renameCareful` (Task 15); a locked thing says it is locked, with "Unlock it", and its row in the
  list says "Locked until you close the game" ("My calls" 5); a loop with the Pencil, the free
  thumb's "Pick several" or Shift picks several; press and hold on empty ground offers Put a thing here, Add a note
  here, Paste.
- Place: the tray and "Add things" hold the game's characters with how many this level uses; tap one then the level,
  or drag one in; the faint copy shows where it would go; a `one-per-level` character asks "Move the goal here?"; a
  second start moves the first with a note and Undo.
- Erase: tap a thing, or drag over ground (Task 16's erase); the free thumb's Box erases an area.
- "Line up with tiles" is on by default (`moveThings`' `lineUp`).

- [ ] **Step 1: Write the failing tests:** in the browser, each bullet above as one test with its opposite (move and
  Undo, lock and Unlock, hide and Show, delete and Undo, copy and Delete); the bar never overlaps the picked thing at
  the level's four corners; the journey, at iPad sideways, iPad upright and phone, with touch: place a crate, move it
  with the pad, copy it, delete the copy, erase the first, undo four times, and the level equals the opened one.
- [ ] **Step 2 to 4: push red, implement, push green,** with the `screenshots` label on the last push.
- [ ] **Step 5: Commit** `feat(levels): pick, place and erase by touch, each with its way back`

## Pull request 10: first run, Settings, Help, the keys

### Task 27: The language card, the welcome and the tour

**Files:** Create `src/features/shell/Language.svelte`, `Welcome.svelte`, `Tour.svelte`, `tour.ts`. Modify
`world/World.svelte`, `words/first.ts`. Delete `suite/Welcome.svelte`, `Guide.svelte`, `guide.ts`. Test
`tests/features/shell/tour.test.ts`, `tests/journeys/first-run.journey.test.ts`. Mockups: `shell-language`,
`shell-welcome`, `shell-tour`, `shell-tour-pick`, `shell-tour-change`, `shell-tour-done`.

**Interfaces (produces):**

```ts
export const STEPS = ['tap-the-crate', 'tap-place', 'drag-a-value', 'play-then-put'] as const
export type Step = (typeof STEPS)[number]
export interface TourState { readonly step: Step | 'done' | 'skipped'; readonly did: boolean }
/** Moves on only when the person did the step's own thing. */
export function tourNext(state: TourState, happened: { readonly kind: 'picked' | 'tool' | 'value' | 'moved' | 'played' | 'put' | 'skip'; readonly what?: string }): TourState
/** What step 3 asks for, from the thing that is picked: its first number value ("Drag How heavy"), or, when it has none, the arrows ("Move the crate with the arrows"). */
export function stepThree(picked: LevelThing | undefined, character: Character | undefined): { readonly asks: 'value'; readonly value: string } | { readonly asks: 'arrows' }
/** What the device keeps: `af.guide.done` and one `af.tip.<step>` per tick. */
export function readTicks(store: Storage): ReadonlySet<Step>
export function keepTick(store: Storage, step: Step): void
```

The language card comes first with the device's language chosen (`navigator.languages` against `LANGUAGES`, else
English), then the welcome ("Show me around" or "I'll look around myself"), then the tour: each card dims everything
but its part, waits for the person to do the thing, says when they have, and always has Skip.

**Step 3 (`drag-a-value`, the Owner's answer 1).** With the crate picked and its settings open, the card asks the person
to drag the first number value the thing has: "Drag How heavy". The test game's crate has one (E4), so the demo game's
tour ends with a crate that really is heavier or lighter. For a game whose picked thing has no number value, the card
says "Move the crate with the arrows" (the pad of Task 26) instead, so the tour never asks for what is not there; the id
and the tick are the same either way. The slider is Task 31's, so until pull request 12 merges the step is the arrows for
every game, and Task 31 switches it. Until then the card differs from `shell-tour-change`, which draws the slider; the
pull request names it. The tour never renames anything.

- [ ] **Step 1: Write the failing tests:** `tourNext` ignores the wrong thing and moves on the right one (at step 3 it
  ignores `picked` and moves on `value` or `moved`); `stepThree` for the Crate Game's crate is `value: 'heavy'` and for
  a thing with no number value is `arrows`; Skip at any step ends it and keeps the ticks so far; the journey: a first
  visit at phone and iPad sideways shows the language card with the browser's language chosen, picks Spanish and reads
  the welcome in Spanish, walks the four steps (step 3 by the arrows, until Task 31), and a second visit shows none of it.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(shell): the language, the welcome and a tour that waits for you`

### Task 28: Settings, Help and the keys

**Files:** Create `src/features/shell/Settings.svelte`, `Help.svelte`, `Keys.svelte`. Modify `world/World.svelte`,
`words/shell.ts`. Test `tests/features/shell/settings.browser.test.ts`, `tests/journeys/settings.journey.test.ts`.
Mockups: `shell-settings`, `shell-help`, `world-levels-keys`, `shell-glass-speed`.

Settings is one sheet with its sections down the left (one long page on a phone). "For me" is `Me` (Task 4):
language, see-through panels, row size, tips. "For everyone on <the game>" is the one choice of Task 9, through
`api.settings`; anyone but an Owner reads it as words with who to ask. Help lists the basics, each ticked once done
(`readTicks`), each with "Show me" that plays that tour step, the tour again, the keys, and "Ask your helper" (what a
helper is, what to tell it, and "Keep a copy of this level" to hand it) and "What Play shows" ("My calls" 13): the level,
its things, the hero's moves, switches, doors, weights and what is drawn in front, as the game's files make them, and not
the game's own code or rules; it plays in the person's language when the game has it, else in the game's own. The keys
sheet lists `KEYS` and the finger moves; with no keyboard seen it shows only the finger moves.

- [ ] **Step 1: Write the failing tests:** changing the language changes the open sheet's words at once and is kept;
  "See-through panels: Off" makes every dock solid; a non-owner cannot change "For everyone" and is told who can; an
  Owner's change calls `api.settings` once; the keys sheet on a touch-only window has no key column; Help has "What Play shows" and it says the game's own code
  does not run.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(shell): settings for me and for everyone, help that shows you, and the keys`

## Pull request 11: the map on screen

### Task 29: The map's picture and marks

**Files:** Create `src/features/map/map-canvas.ts`, `MapMarks.svelte`, `MapPart.svelte`, `MapKey.svelte`. Modify
`world/World.svelte`, `shell/TopBar.svelte` (the Map button), `words/map.ts`. Test
`tests/features/map/map-part.browser.test.ts`. Mockups: `world-map`.

`MapPart` shows `boxes` with each level's picture from the page's one Pixi Application (`Stage.levels.picture(content,
pictures, level)`, Task 24, so the map and the level view never make two), and over them (SVG): a dashed arrow for each door
from the door to where you come out, a bar across each join, a red dashed bar across each wall, the start's mark, each
level's name, and the key at the bottom. It opens at `wholeWorld` (known layout issue 3). The list shows the levels.
Pinching out past the whole level in `LevelPart` opens the map on that level; "Go in", Enter or a double tap on a
level opens it.

- [ ] **Step 1: Write the failing browser tests** on the links game: three levels, one bar, three arrows, the start
  mark and the key are in the page by name; at the phone size every level is fully inside the window on opening
  (issue 3); with 64 levels the same holds (Review Focus 4); each level is reached by Tab and opened by Enter.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(map): every level on one sheet, with its doors and where levels touch`

### Task 30: Arranging the map, and levels made and unmade there

**Files:** Create `src/features/map/LevelBar.svelte`, `WallCard.svelte`, `NewLevelCard.svelte`, `placing.ts`. Modify
`MapPart.svelte`, `words/map.ts`. Test `tests/features/map/placing.test.ts`, `map-arrange.browser.test.ts`,
`tests/journeys/map.journey.test.ts`. Mockups: `world-map-push`, `world-map-joined`, `world-map-apart`,
`world-map-move`, `world-map-overlap`, `world-map-menu`, `world-map-wall`, `world-map-deleted`, `world-levels-new`.

**Interfaces (produces):**

```ts
// placing.ts
/** Where a floating card may sit: the first of the candidates (below, above, right, left of `anchor`) that is inside `screen` and overlaps none of `keepClear`; else the one overlapping least. */
export function placeCard(card: { w: number; h: number }, anchor: Rect, keepClear: readonly Rect[], screen: Rect): Rect
/** The line under a drag or on the move pad: what the next step would do. */
export function landingWords(landing: Landing, words: Words): string
```

A picked level's bar: Go in, Move, Pull apart (only when it touches another, with what that does) and the three dots
(Rename, Make a copy, Delete); press and hold opens the same. Dragging shows where it came from as a dashed outline,
the stretch that would join as a dashed bar and `landingWords`; over another level it is red and goes back. Move opens
the four arrows, and its card is placed with `placeCard`, keeping clear the picked level and the level it would touch
(known layout issue 1). A wall has a card with four ways out, each one a single undoable step: clear the ground where
they meet (`paint` empty on the closed side), move the level so the openings meet, pull them apart, leave it for now.
"New level" (and press and hold on empty ground) uses `newLevel` and shows its card. Delete says it can be undone and
leaves a note with Undo.

- [ ] **Step 1: Write the failing tests:** `placeCard` with a level to the right of the anchor never covers either;
  `landingWords` for free, touch with a join, touch with a wall and overlap; in the browser each bullet with its
  opposite; the Move card never overlaps the picked level or its neighbour at iPad sideways (issue 1, with its picture:
  Room 3 picked and Room 2 beside it, as `world-map-move` draws Level 4 and Level 3); the journey at the three sizes on
  the links game (`openPage(size, person, keep, LINKS)`, Task 2b): push room-1 to room-2, where room-1's open right edge
  meets room-2's solid left edge, so the wall card appears (they touch and do not join); take its first way out
  (clear the ground), see them joined, undo (the wall is back), do it again; pull room-3 apart from room-2 (no join),
  push it back (joined), undo; drag onto another level and watch it go back (the overlap); make a new level, rename it
  (the care sentence is shown first), delete it, undo.
- [ ] **Step 2 to 4: push red, implement, push green,** with the `screenshots` label on the last push.
- [ ] **Step 5: Commit** `feat(map): push together, pull apart, new and deleted levels, the wall's ways out`

## Pull request 12: a thing's settings, Join, Paint, Show, the Pencil

### Task 31: A thing's settings and Join

**Files:** Create `src/features/levels/ThingSettings.svelte`, `ValueControl.svelte`, `LeadsTo.svelte`,
`JoinLine.svelte`, `Tags.svelte`. Modify `LevelPart.svelte`, `Marks.svelte`, `shell/Tour.svelte` (step 3,
`drag-a-value`, becomes the slider for a thing that has a number value; Task 27's `stepThree` already says which, and the
arrows stay for a thing that has none), `words/levels.ts`. Test `tests/features/levels/settings.browser.test.ts`,
`tests/journeys/settings-and-join.journey.test.ts`. Mockups: `world-levels-settings`, `world-levels-exact`,
`world-levels-links`, `world-levels-unjoin`, `world-levels-door`, `world-levels-edge`, `world-levels-mid`.

The groups, in order: the character's own values (`rowsOf`), then one line under them, "Every crate starts like this: a
change here is for this one only" (`levels.defaultsNote`, named from the character and shown only when the character
holds values), "Look" ("Looks like"), "Where it is" (from the left, from the top, in tiles); past the few that matter,
"N more settings"; under that the thing as the file's text, for an agent. **Until Task 42a,** "Look" holds "Looks like"
only: `world-levels-settings` also draws "Drawn", which needs the framework's `draw` (F5), so the row is left out, never
dimmed ("My calls" 4), and the pull request names it as a difference from the mockup.
The control per type is the spec's table: `number` a `Slider` with its number, the `NumberPad` on a tap; `switch` a
`Knob`; `choice` a `Segment`, or a list past four; `words` the source language's words and which message; `thing` the
"Opens" list with "Nothing" first; `leads-to` `LeadsTo` (the level, then where you come out, and "Go to Level 2");
`path` and an undeclared value shown, not edited. Under each, the declaration's `about`. Several picked show `shared`
with "Not the same". A dropdown opens over the sheet and never scrolls its own group out of sight (known layout
issue 4): the sheet scrolls only as far as keeps the group's heading in view.

Join: drag from a switch to a gate; things `mayOpen` light up as the tip nears; the arrow is an SVG mark that can be
picked, and "Take this line away" is `unlink`. Tags (`shownOf` is `tag`) sit faint beside things until picked. On a
phone the hint is placed with `placeCard`, keeping the gate and the switch clear (known layout issue 2). A door's tag
says "To Level 2"; an edge that touches another level is drawn as on the map, with its card and "Go to Level 3".

- [ ] **Step 1: Write the failing tests:** each control never passes its limits (slider, pad, typing 99 into `reach`
  gives 8); a value back at its default leaves no key in the level; an undeclared value is shown and has no control
  (Review Focus 1); on iPad upright with the "Opens" list open, the "Where it is" heading's box is inside the sheet
  (issue 4, with its picture); on a phone the hint overlaps neither the gate nor the plate (issue 2, with its
  picture); the journey: link the plate to the gate with a touch drag, see "Opens: Gate 1", take the line away, undo;
  set a door's "Leads to" and follow "Go to Room 2" (the links game's
  levels are Room 1 to Room 3); on the Crate Game the slider of "How heavy" holds 0.5 to 4 in
  halves, and the tour's step 3 is done by dragging it, while on a thing with no number value it is still done by the
  arrows; "Every crate starts like this" is under a crate's values and absent for a character with none.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): a thing's settings held to their limits, and what a switch opens`

### Task 32: Paint, Show and the Pencil

**Files:** Create `src/features/levels/GroundTray.svelte`, `Show.svelte`, `Hover.svelte`. Modify `LevelPart.svelte`,
`shell/Hold.svelte`, `words/levels.ts`. Test `tests/features/levels/paint.browser.test.ts`,
`tests/journeys/paint-and-pencil.journey.test.ts`. Mockups: `world-levels-paint`, `world-levels-show`,
`world-levels-pencil`, `world-levels-thumb`.

Picking "Ground" in the list picks Paint, fills the tray with `kindsOf` (a colour and a word each) and makes the things
faint. A drag paints `lineCells`; the free thumb's Box paints `boxCells`, Fill `fillCells`, Erase the empty kind (Shift
and Alt on a computer); press and hold picks the kind under the finger. One drag is one undo step. Painting an edge
that touches another level says in a `Note` that the way across opened or closed. Show: Grid (Off, Tiles, Finer), Line
up with tiles, Show what it is, How near you are, The frames each screen sees, Draw with a finger too, I draw with my
left hand. With a pen (`pointerType: 'pen'`): the pen does the tool and one finger slides the view; hovering shows the
faint thing under Place, the brush's outline under Paint, and a light on what a tap would pick.

- [ ] **Step 1: Write the failing tests:** one drag of 12 tiles is one undo; Box, Fill and Erase each with Undo; a
  thing's cell is skipped with a note; "Show what it is" tints solid tiles; with a pretend pen a pen drag paints and a
  finger drag slides the view and changes no tile; with "Draw with a finger too" on, the finger paints; a hovering pen
  shows the outline and changes nothing; the journey at iPad sideways and phone: paint a step, close and open an edge
  to the next level and read both notes, undo all.
- [ ] **Step 2 to 4: push red, implement, push green,** with the `screenshots` label on the last push.
- [ ] **Step 5: Commit** `feat(levels): paint what the ground is, Show, and the Pencil first-class`

## Pull request 13: putting changes in, problems, offline

### Task 33: Put in game, Send to check, Keep a copy

**Files:** Create `src/features/game/put.ts`, `src/features/team/PutSheet.svelte`, `WaitingSheet.svelte`,
`KeepCopy.svelte`. Modify `world/World.svelte` (the history is `Edits`; drafts are `keepDrafts` after every change),
`shell/TopBar.svelte`, `words/changes.ts`. Delete `game/save.ts`, `game/draft.ts`, `levels/compare.ts`,
`levels/edit.ts`'s old half, `service/save.ts` and `/api/save`, `suite/Waiting.svelte`. Test
`tests/features/game/put.test.ts`, `tests/journeys/put-in-game.journey.test.ts`, `send-to-check.journey.test.ts`,
`visitor.journey.test.ts`, `save-problems.journey.test.ts`. Mockups: `world-levels-share`, `world-levels-done`,
`world-levels-suggest`, `world-levels-sent`, `world-levels-waiting`, `world-levels-waiting-more`,
`world-levels-offline`, `world-levels-blocked`, `shell-signin`.

**Interfaces (produces):**

```ts
// game/put.ts
export type PutResult =
  | { readonly ok: true; readonly how: 'direct' | 'suggestion'; readonly game: OpenGame; readonly edits: Edits }
  | { readonly ok: false; readonly problem: 'changed-elsewhere'; readonly merged: Merged; readonly game: OpenGame }   // the game opened again, my changes laid over it
  | { readonly ok: false; readonly problem: Exclude<ProblemKind, 'changed-elsewhere'>; readonly details?: readonly string[] }
export async function put(api: Api, game: OpenGame, edits: Edits): Promise<PutResult>
```

On `'changed-elsewhere'`, `put` opens the game again and returns Task 14's `merge(base, mine, theirs)`; with no clash
the sheet says what came in from the game and the button is one more press; with clashes Task 37's sheet asks. The
sheet lists `describe`'s lines, a problem first when there is one (with Show me). When it fails it says what happened,
that nothing is lost, and "Try again"; `'signed-out'` keeps the changes, offers sign-in, and comes back to the same
sheet (Review Focus 5). With `editors.problems === 'stop'` and a problem, the button is there, switched off, with why.
Offline: the top bar says "No internet" from the browser's `offline` event or a failed call, until a call succeeds.
Signed out on the demo game: "Keep a copy" keeps the level as its file (`game/copy.ts`), then offers sign-in; "Not now"
closes it. "Take them back" calls `api.turnDown` (the author's own take-back and an approver's turn-down are the one route, Task 11) and the changes are the person's own on the device again.

- [ ] **Step 1: Write the failing tests:** `put` with a pretend API for each result; a stale file gives `merged` and
  writes nothing (Review Focus 2); the journeys, at the five sizes for the first and iPad sideways and phone for the
  rest: an Owner changes two levels and the map and one press makes one commit of the three files; a Suggest person
  sends, sees "Waiting for …", changes more, sends 1 more, takes them back; offline mid-put says so and Try again works
  once back; the sign-in gone mid-put (Review Focus 5); a visitor keeps a copy whose bytes equal `writeContent`'s; a
  reload before putting in loses nothing.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): put every change in the game in one press, or send it to be checked`

### Task 34: Problems, said in plain words

**Files:** Create `src/features/game/problems.ts`, `src/features/team/Problems.svelte`, `ProblemStrip.svelte`. Modify
`world/World.svelte`, `words/changes.ts`. Test `tests/features/game/problems.test.ts`,
`tests/journeys/problems.journey.test.ts`. Mockups: `world-levels-problems`, `world-levels-problem`, `world-map-wall`.

**Interfaces (produces):**

```ts
export interface Problem { readonly words: string; readonly file: string; readonly where: { readonly level?: string; readonly thing?: string; readonly map?: true } }
/** The framework's own sentences on the edited game, each with where to look. Run 300 ms after the last change. */
export async function problemsOf(game: OpenGame, edits: Edits): Promise<readonly Problem[]>
```

`problemsOf` is `loadGame(readerOf(game, edits))`'s diagnostics; `where` comes from the diagnostic's `file` and
`path`, which the framework writes as `things[2].x` (its `diagnostics.ts`), so `things[2]` is that level's third thing;
the world file is the map. The tests read a real diagnostic made by the framework, never a made-up path. "Show me" opens the level or the map
there, with a strip saying which problem it is, "Next problem" and "Back". The count is in the top bar.

- [ ] **Step 1: Write the failing tests:** a door into a deleted level is one problem at that door; a wall is one
  problem with `map: true`; a clean game has none; the journey: make a wall on the map, read "1 problem", Show me opens
  the map at it, fix it, the count goes; with the game set to stop, "Put in game" is switched off and says why.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): the game's own check, in the page, with Show me`

## Pull request 14: play in place

### Task 35: The level plays where it is drawn

**Files:** Create `src/features/play/play.ts`, `PlayBar.svelte`, `PlayPart.svelte`. Modify `world/World.svelte`,
`shell/TopBar.svelte` (Play becomes Stop), `words/play.ts`. Test `tests/features/play/play.browser.test.ts`,
`tests/journeys/play.journey.test.ts`. Mockups: `world-levels-play`, `world-levels-bigger`, `world-levels-play-from`.

**Interfaces (produces):**

```ts
export interface Playing {
  pause(): void; resume(): void; paused(): boolean
  again(): Promise<void>                       // stops and starts the same level from its start
  stop(): void
  /** Undefined until Pin 2: one step, the speed, the last 30 seconds (Task 42 fills them in). */
  readonly extras: { step(): void; setSpeed(rate: 1 | 0.5 | 0.25): void; kept(): { from: number; to: number }; backTo(tick: number): void } | undefined
}
/** Starts the framework's `startGame` on the edited content in `mount`, with the game's own touch controls on a touch screen. Rejects with one plain sentence when the level cannot be built. */
export async function play(options: { mount: HTMLElement; game: OpenGame; edits: Edits; level: string; lang: Lang; from?: Point }): Promise<Playing>
```

The canvas and the marks hide while it plays and the game fills the same box; the panels stay and go quiet. The play
bar has pause, start again and "Bigger" (which hides the panels; "Smaller" brings them back), each with its word; one
step, slow, "Play from here" and the 30-second strip are left out, never dimmed, until Task 42 adds them. Stop is in the
top bar and Escape. Playing changes no file. A level that cannot be built (`loadGame` of the edited game gives a
problem, such as a door into a level that was deleted) is not started: `play` rejects with the framework's first
sentence, and the bar says it with "Show me the problem" (Task 34's strip).

**What plays is the game's content ("My calls" 13).** `play` is given the edited content only, so the game's own code
never runs (the test game's `gamePlugins` are not loaded) and a rule written in code is not seen in Play. The first Play
on a device says so once in a `Tip` (`af.tip.play-code`, kept on the device with the other first-run tips), and Help
repeats it (Task 28). `lang` is the person's language when the game has that language's words, else the game's source
language, so a game with six languages never fails for the editor's other three. **Left out ("My calls" 12):** the
spec's "Try a change" card and the phone's "Try a change" button, which change a tuning number (a file of the Feel
slice). The pull request names the difference from `world-levels-play`, `world-levels-bigger` and `world-levels-play-from`.

- [ ] **Step 1: Write the failing tests:** in the three browsers, play starts a canvas in the level's box, pause holds
  `sim.tick`, again goes back to tick 0, stop removes the canvas and the marks are back, and `isChanged` is as before;
  on touch the game's own buttons are in the page; the journey: change the crate's place, play, see the crate there,
  press the game's right button and the hero moves, stop; Bigger then Smaller; a game with Spanish
  words opened with the editor in Portuguese plays in its source language and throws nothing; the first Play shows the
  tip once and a second Play does not; delete a level a door leads to, press Play, and read "Show me the problem".
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(play): the level plays where it is drawn`

## Pull request 15: checking, and two people on one thing

### Task 36: Checking someone's changes

**Files:** Create `src/features/team/Check.svelte`, `AskSheet.svelte`, `check.ts`. Modify `world/World.svelte`,
`levels/Marks.svelte` (a waiting change's things marked as `world-levels-check` draws them), `words/changes.ts`.
Delete `suite/WaitingChange.svelte`. Test `tests/features/team/check.test.ts`, `tests/journeys/approve.journey.test.ts`.
Mockups: `world-levels-check`, `world-levels-ask`, `world-levels-asked`, `world-levels-turned-down`,
`world-levels-turned-down-sam`.

**Interfaces (produces):**

```ts
/** A waiting change as a `Working` to look at and play, and its lines. Undefined when it holds a file that does not read. */
export function changeAsWorking(game: OpenGame, change: WaitingChange): { readonly working: Working; readonly lines: readonly ChangeLine[] } | undefined
```

"1 to check" opens the sheet over the level with the changes marked, and the game's problems first (a problem never
stops putting them in unless the game says `stop`, Task 11). "Not now" leaves it. Play them (Task 35 on the change's
`Working`); then "Put them in" (`api.approve`), "Ask for a change" (a box for words, "Send to Sam" or Back;
`api.askChange`, a comment the App writes, "My calls" 16) or "Don't put them in": `api.turnDown` is sent **at once**, the
change closes and its branch is kept ("My calls" 14), and a note says so with Undo, which is `api.reopen` and makes it
wait again. The author, on their next open, sees what was asked (`Waiting.asked`) or that it was turned down
(`OpenAnswer.turnedDown`, who and when), with their changes still on the device and "Send to check" again; their "Got it"
calls `api.clearTurnedDown`.

- [ ] **Step 1: Write the failing tests:** `changeAsWorking` for a moved crate and for a new level; the journey with
  two windows (Sam suggests, Mia may approve): Mia opens "1 to check", plays it, asks for a change with words; Sam sees
  the words, changes and sends again; Mia puts them in and the game has them; a second round turned down at once, undone (it waits again, by `reopen`),
  turned down again, and Sam is told who turned it down with his changes still there, and his "Got it" clears it for
  good; a change with a problem can be played, asked about and put in.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): check someone's changes: play, put in, ask in words, or say no`

### Task 37: Whose to keep

**Files:** Create `src/features/team/Clash.svelte`. Modify `PutSheet.svelte`, `levels/Marks.svelte` (both places shown,
mine and theirs, named), `words/changes.ts`. Test `tests/journeys/two-people.journey.test.ts`.

For each `Clash` the sheet asks whose to keep, in words ("You moved Crate 1. So did Mia."), with both places shown on
the level; `keep` answers; everything without a clash goes in without a question. "Put in game" is switched on when
every clash has an answer.

- [ ] **Step 1: Write the failing journey:** two windows as two Owners on Level 1: one moves the crate and the gate,
  the other moves the crate and puts it in first; the first presses "Put in game", is asked only about the crate, keeps
  their own, and the game ends with their crate and gate; the same again keeping the other's.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): when two people changed one thing, ask whose to keep`

## Pull request 16: the team

### Task 38: Who can change it, what changed, your games

**Files:** Create `src/features/team/People.svelte`, `History.svelte`. Modify `team/Games.svelte`,
`world/World.svelte` (passes `game.people` to the top bar's `Faces`, Task 20), `words/team.ts`. Delete `suite/Share.svelte`. Test `tests/journeys/share.journey.test.ts`,
`history.journey.test.ts`. Mockups: `shell-people`, `shell-people-look`, `shell-changes`, `shell-games`.

`People` is today's Share logic (`api.sharing`, `api.share`) in the new sheet, the levels in plain words; a non-owner
sees the list as words with one button that asks an owner (it opens a note to the owner, Task 39, or, before that
merges, shows who to ask). `History` is `api.history(game, page)`: ten a page, newest first, who, what, which level (or the map), when, and "Show
me", which opens it; "Show more" asks for the next page, to five. `Games` shows each game with its picture, its name
and what this person may do; a game missing from the list says to ask its owner; Sign out is here. **A game's picture**
is its start level drawn by the page's one Application (`Stage.snapshot`, Task 24), taken **lazily**: a row's game is
opened (`api.open`) only when its row comes into view, at most two at once, only its start level is drawn, and only the
small copy is kept for the visit, never the game; until then the row shows a plain tile, and a game that cannot be
opened keeps the tile.

- [ ] **Step 1: Write the failing journeys:** the share journey's cases on the new sheet; the faces in the top bar are
  the game's people and a tap opens "Who can change it"; an Owner puts a change in and "See what changed" lists it
  first, and Show me opens its level; "Show more" brings the next ten; with twenty games in the list the pretend GitHub
  sees an open only for the rows on screen, never more than two at once.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): who can change it, what changed, and your games`

### Task 39: Notes

**Files:** Create `src/features/team/Notes.svelte`, `NoteCard.svelte`, `notes.ts`. Modify `levels/Marks.svelte` (a note
is a mark), `levels/ThingMenu.svelte`, `world/World.svelte`, `words/team.ts`. Test `tests/features/team/notes.test.ts`,
`tests/journeys/notes.journey.test.ts`. Mockups: `world-levels-note`, `world-levels-note-new`.

A note is added from the three dots or press and hold, on a thing or a spot; tapping one opens what was said, by whom,
the answers, a box to answer, and "Done: hide this note" (with "Show done notes" in Show as its opposite). Notes are
read when a game opens and again every 60 seconds while the page is in view; a note on a thing that has gone shows at
its last spot. Nothing about a note waits for "Put in game".

- [ ] **Step 1: Write the failing journey:** two windows: a Look person adds a note on the crate; the Owner, without
  reloading, sees it within the next read, answers and marks it done; the first sees the answer; the game's default
  branch has no new commit.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): notes pinned on a level, seen by the team at once`

### Task 40: The helper's ghost, and Find

**Files:** Create `src/features/team/Ghost.svelte`, `ghost.ts`, `src/features/shell/Find.svelte`, `find.ts`. Modify
`world/World.svelte`, `levels/Marks.svelte` (a ghost mark in `--agent`), `shell/Help.svelte`, `words/team.ts`,
`words/shell.ts`. Test `tests/features/team/ghost.test.ts`, `tests/features/shell/find.test.ts`,
`tests/journeys/helper-and-find.journey.test.ts`. Mockups: `shell-helper`, `world-levels-find`.

**Interfaces (produces):**

```ts
// ghost.ts
export interface Ghost { readonly lines: readonly ChangeLine[]; readonly merged: Merged }
/** What changed in the game under the person since they opened it, as something to keep or undo. Undefined when nothing did. */
export function ghostOf(base: Working, mine: Working, theirs: Working): Ghost | undefined
/** A level file pasted back: 'not-a-level' with the framework's sentence, or the ghost of laying it over the open level. */
export function ghostOfPasted(text: string, base: Working, mine: Working, level: string): Ghost | { readonly problem: string }
// find.ts
export interface Found { readonly kind: 'thing' | 'level' | 'value' | 'command' | 'file'; readonly words: string; readonly hint: string; readonly key?: string; readonly go: string }
export function find(query: string, working: Working, content: GameContent, keys: readonly Key[], words: Words): readonly Found[]   // at most 20, things in the open level first
```

The game is read again when the page comes back into view and every 60 seconds; a change under an open level shows as
a ghost in the lavender with what it says and Keep or Undo. Keep takes `merged.now` as one undoable step; Undo leaves
the person's own (their next "Put in game" then meets Task 37 if it clashes). Help's "Ask your helper" has "Paste what
your helper gave you". Find opens with the magnifier or ⌘K; it also filters the list while it is open.

- [ ] **Step 1: Write the failing tests:** `ghostOf` with nothing changed is undefined, with a crate they moved one
  line; `ghostOfPasted` of garbage is the framework's sentence; `find('crate')` gives the crates then the command
  "Place a Crate"; `find('undo')` gives the command with its key; the journey: a second window puts a moved gate in,
  the first sees the ghost, keeps it, undoes; pastes a level file and undoes; finds "Gate 1" and lands on it picked.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(team): a helper's change comes back as a ghost; one box finds anything`

## Pull request 17: Pin 2, then play's rest and a game with a problem

### Task 41: Move the framework pin (its own pull request)

Waits for: Plan W's pull request 5 merged (its gated task G5), and F1 to F5 merged. As Task 2. The same pull request gives
the fixture crate (`tests/fixtures/game/content/characters/crate.json`) `weight: "heavy"`, the field F4 adds, which Task
2b left out because the pinned schema is strict, so the pin and the fixture move together and `game.test.ts` stays
green. Commit `chore: pin the framework at <commit> (places, doors, play's tools, readGame, weight, draw)`.

### Task 42: One step, slow, back 30 seconds, play from here, doors, and opening a game with a problem

**Files:** Modify `src/features/play/play.ts`, `PlayBar.svelte`, `PlayPart.svelte`, `src/features/game/open.ts`,
`game/problems.ts`, `suite/App.svelte`, `words/play.ts`. Test `tests/features/play/play.browser.test.ts`,
`tests/features/game/open.test.ts`, `tests/journeys/play.journey.test.ts`, `open-game.journey.test.ts`. Mockups:
`world-levels-play`, `world-levels-play-from`.

- `play` passes `keepSeconds: 30` and `Playing.extras` is the framework's `step`, `setSpeed`, `kept` and `backTo`; the
  30-second strip is a `Slider` over `kept()` that pauses, and dragging it calls `backTo`.
- "Play from here" waits for a tap, with a strip that says what a tap does and Cancel; the tap's spot goes to
  `startGame` as `arrive` (Plan W); "From the start" goes back.
- A level in a place plays the whole place (`startGame` does it from the pinned framework). A door: `Game.onStep`'s
  events through the framework's `doorTaken`; the editor opens that level, in the list and the top bar too, and plays
  on from where the door comes out.
- `openGame` uses `readGame`: a game whose files all read opens with its problems listed (Task 34's list) instead of
  the "this game has a problem" screen, which stays only for a file that does not read at all. `problemsOf` uses
  `readGame` too.
- **A problem in what plays (audit M3).** Content that has a problem plays only when the framework can still build the
  level: a thing whose character is gone is left out of the play and stays in the problems list; a door into a missing
  level, or any problem the build itself refuses, stops the play with the framework's sentence and "Show me the problem",
  as Task 35 does. When `content.places` is left out (the world file has a problem, F3), Play runs the level alone, with
  its doors shut, and the play bar says "No doors in this play: the map has a problem".
- **Weight in play (F4).** The play is the framework's, so a crate with `weight` is pushed as the physics makes it: the
  test asserts it (below), and nothing in the editor does it.

- [ ] **Step 1: Write the failing tests:** paused, step moves the tick by one; slow halves the ticks in a second;
  after 5 seconds of play, dragging the strip to its start shows the hero where it was then; play from a tapped spot
  starts the hero there; walking through `exit` in the links game opens room-2 in the editor and the top bar says so;
  a game with a door into a missing level opens with "1 problem" and Play of that level says why instead of
  starting; a level with a missing character plays with that thing left out and the problem still listed; with the world
  file naming a level that is not there, Play runs the level alone and says the doors are shut; on the Crate Game the
  crate at "How heavy" 4 goes less than half as far as at 0.5 under the same 120 ticks of the hero's right button.
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(play): one step, slow, back 30 seconds, from here, and doors followed`

## Pull request 18: Drawn behind, with the hero, in front

### Task 42a: "Drawn", and the order things are drawn in

Needs Pin 2 (Task 41, which brings F5's `draw`) and pull request 12 (the settings sheet and its "Look" group). The Owner
chose draw order (2026-11-16); this is where the editor offers it.

**Files:** Create `src/features/levels/draw.ts`. Modify `levels/ThingSettings.svelte` (the "Look" group gains "Drawn"),
`levels/ThingMenu.svelte` ("Bring to the front", "Send to the back"), `levels/level-canvas.ts` (the three layers, in the
order F5's renderer uses, so the level view and Play agree), `levels/Marks.svelte` (the marks stay above every layer),
`words/levels.ts`. Test `tests/features/levels/draw.test.ts`, `draw.browser.test.ts`,
`tests/journeys/draw-order.journey.test.ts`. Mockups: `world-levels-settings`, `world-levels-more`.

**Interfaces (produces):**

```ts
// draw.ts
export type Draw = 'behind' | 'with-hero' | 'in-front'        // F5's values for a thing's `draw`
export const DRAWS: readonly Draw[]                           // in that order: the "Drawn" control's three choices
/** How a thing is drawn: its own `draw`, else with the hero. */
export function drawOf(thing: LevelThing): Draw
/** Sets `draw` on each thing. `with-hero` takes the key out (a file never holds the default). `things` keeps its order, which is the spawn order, so the sim and every recording stay as they are. 'same' when nothing changes. */
export function setDraw(level: Level, ids: readonly string[], to: Draw): Done
```

"Drawn" is a `Segment` of three in the "Look" group (Behind, With the hero, In front), each with its line of what it
does. "Bring to the front" is `setDraw(…, 'in-front')` and "Send to the back" is `setDraw(…, 'behind')`; they move a
thing to the top or the bottom layer, never within one, and a row that cannot act says why ("It is already in front").
Within a layer, things stay in the file's order, as the framework draws them. It is one undoable step and several picked
things change together.

- [ ] **Step 1: Write the failing tests:** `setDraw` leaves `things` in the same order with the same ids and takes the
  key out for `with-hero`; the result passes the framework's `LevelSchema`; in the three browsers the level view paints a
  front crate over the hero's start and a back one under the ground colour, and the same level in Play (Task 35) paints
  the same pixels; the journey: pick the crate, choose "In front", see it over the hero's start, Play and see it still
  there, Undo; use the menu's two rows and read that each is switched off where it is already; `toPut` after the changes
  lists `things` in the opened order (the recording never moves for this).
- [ ] **Step 2 to 4: push red, implement, push green.**
- [ ] **Step 5: Commit** `feat(levels): choose what a thing is drawn behind or in front of`

## Pull request 19: every journey at every size, and the close

### Task 43: The end-to-end check's journeys, and the four layout fixes proved

**Files:** Modify `tests/journeys/screens.journey.test.ts`, `tests/fixtures/journey.ts`; add any journey of the list
below not yet there. Test: themselves.

The screens journey's rules hold on every World screen at the five sizes: no sideways scroll; every control 44 by 44
and the main action 48 tall; none overlapping; at most two things floating over the level; no text off the side or cut
short; every sheet with its way out. It takes a picture of each, and four named ones: `issue-1-move-card` (iPad
sideways, the links game: Room 3 picked and Room 2 beside it, as `world-map-move` draws Level 4 and Level 3, the card
clear of both), `issue-2-join-hint` (phone: the hint clear of the gate), `issue-3-map-whole` (phone: Room 1 whole),
`issue-4-dropdown` (iPad upright: "Where it is" in sight). Every picture uses the games' own names: Room 1 to Room 3 on
the map and Level 1 in the Crate Game. One journey for
each of the spec's list exists and checks the opposite of every action: first open to the first change in the game;
place, move, paint, erase and join, each undone; a value at its limits; the tour's third step by "How heavy" and by the
arrows; draw order set, played and undone; a heavier crate pushed less far in play; the map's push, pull apart, overlap,
wall and delete with undo; a door followed in play; play with touch controls; put in game; send, ask, turn down, undo;
offline; problems first; two people on one thing; signed out, keep a copy; the Pencil; and **turning the device** (spec,
"Every size"): with a thing picked, the number pad open and a field focused, the window turns from 1210 by 834 to 834 by
1210 and back, and the pick, the open sheet and the focused field survive each turn; the on-screen keyboard is stood in
for by a smaller visual viewport with the layout viewport unchanged (CI cannot open a real keyboard; a real iPad is the
Owner's review), and the same three things survive it.

- [ ] **Step 1:** Add what is missing; mark the pull request ready with the `screenshots` label so the full run takes
  every picture in three browsers.
- [ ] **Step 2:** Read the four issue pictures and one picture per screen from `ci-screens`; fix what the rules or the
  eye find; push once more.
- [ ] **Step 3: Commit** `test(journeys): every journey of the end-to-end check, and the four layout fixes`

### Task 44: The documents and the close

**Files:** `CLAUDE.md` (the features, lowest first; the structure; the device's keys; and one clause to "An editor changes
authorable content and nothing else": it also reads, and never writes, the pictures a game's tilesets name, "My calls" 17),
`README.md`, `docs/teams.md`
(the three files and the notes branch, in one place), `docs/superpowers/progress.md` and `history.md`.

- [ ] **Step 1:** Bring each document to what was built; `tests/docs/` passes.
- [ ] **Step 2:** Move this cycle's finished lines from `progress.md` to `history.md`; leave one line: "World editor
  build: done, waiting for the implementation audit (stage 5)".
- [ ] **Step 3: Commit** `docs: the World editor as built`

---

## Handoffs

- **Stage 3, the plan audit** (done): `docs/superpowers/audits/2026-11-16-world-editor-plan-audit.md`. Its fixes are
  this page; the table at the end says where each one went.
- **Stage 4, execution** (Sonnet, high), **two lanes** (a lane is a thread; never more than two while Plan W is
  building, "Pull requests, order and lanes"). Each thread reads: the spec, this plan's header through "Pull requests,
  order and lanes", its own pull request's tasks, `docs/design-language.md`, and the mockup pages its tasks name. It
  reports to the coordinator one line per task (commit, test count, surprises), at once at any stop, and each change
  from the plan with its reason.
- **The framework's F1 to F5** go to a thread in AutomataFramework with this plan's "The framework's part" only. F3 may
  start now; F1, F2, F4 and F5 after Plan W's pull request 4. They merge before pull request 17.
- **The test game's E4** goes to a thread in AutomataFrameworkExamples after F4 and F5 merge, with Plan W's E1 to E3 when
  those are not done. **`replays/level-1.json` moves twice over (Plan W's reason and this plan's): the Owner sees the
  before and after once, with the template's recording if it moves too, and nothing merges until the Owner says yes.**
  One docs line is asked of the coordinator, not made here: `automata/notes` in the test game's `CLAUDE.md` (Task 23).
- **The Site** is told, in its next cycle, that the crate's numbers change (E4).
- **The board:** this build draws no new mockup. A screen that must differ from its mockup is named in its pull
  request, with why (Tasks 20, 27, 31, 35 name theirs).

## Self-review

- **Spec coverage.** Goals 1 (Tasks 20 to 22, 27, 28, 40), 2 (15 to 17, 24 to 26, 31, 32, 42a), 3 (18, 19, 29, 30), 4
  (35, 42), 5 (7 to 14, 33, 36, 37), 6 (9, 34, 42), 7 (23, 38 to 40), 8 (6), 9 (27). The Pencil: 4, 25, 32. Every size
  and the four issues: 29, 30, 31, 43. The faces: 20 and 38; the small map: 24; "Every crate starts like this": 31; the
  turn of the device and the on-screen keyboard: 43. The files World writes: 8, 9, 10, 23. What World needs from the
  framework: Pin 1, F1 to F5, Pin 2.
- **Differences from the spec, each named above and again in the pull request that builds it:** "Look" holds "Looks
  like" alone until Task 42a adds "Drawn" ("My calls" 4); locked and hidden are for the visit, with "Locked until you
  close the game" ("My calls" 5); the map does not use `paintWorld` ("My calls" 3); the spec's "Try a change" card is
  left out, and "Back to Level 1" is for the slices that come from another editor ("My calls" 12); Play shows the
  game's content, not its code ("My calls" 13); the five unbuilt editors never say "Comes later" or "Soon" (Task 20);
  the fall band is left out while the framework has no fall-off rule (Task 19); the editor also reads, and never writes,
  the pictures a game's tilesets name ("My calls" 17). Turning a change down closes it at once and Undo brings it back,
  which is the spec's own wording; the first draft's 8-second hold is gone ("My calls" 14).
- **Names across tasks:** `Working`, `Edits`, `inLevel`, `Done`, `PutFile`, `PutAsk`, `ProjectChange`, `ChangeLine`,
  `Merged`, `Clash`, `LevelView`, `Camera`, `Mark`, `Act`, `Landing`, `Wall`, `Playing`, `Stage`, `OpenPicture`,
  `HistoryPage`, `Draw` are each defined once (Tasks 12, 15, 10, 8, 13, 14, 24, 25, 18, 35, 24, 23, 23, 42a) and used by
  those names after.
- **Review Focus:** each of the five has its tests in the tasks named beside it.

---

## The audit's findings, and where each is fixed

The audit found 26 (4 high, 11 medium, 11 low). Each is fixed in this page, in one round, low ones included. The
Owner's two answers are rows of their own.

| Finding | What the page does now | Where |
|---|---|---|
| **H1** lane order breaks; "Needs" short | The rules for the new features move to pull request 2 (before any new folder); pull request 5 needs 4, 7 needs 3 and 5 only (pull request 6 is additive), 10 needs 7 and 8, 11 needs 6, 7 and 9, 12 needs 9 to 11, 13 needs 4, 5, 7, 8, 9 and 11, 15 needs 13 and 14; waves of at most two | "Pull requests, order and lanes", Tasks 2a, 10, 12, 15, 22 |
| **H2** "ask for a change" as a review is refused | The App writes a comment with a fixed first line; the pretend GitHub refuses a changes-requested review by the author, so no task can bring one back | "My calls" 16, Tasks 11, 36 |
| **H3** the tour's step 3 has nothing to drag | The Owner chose a real "How heavy": F4 (a weight is the thing's Rapier mass), E4 (the crate declares and names it), `stepThree` (the arrows when a thing has no number) | Owner's answer 1, F4, E4, Tasks 27, 31 |
| **H4** no game that plays, joins or matches the names | The fixture hero moves; a links game built from data and served beside the demo; the pretend GitHub holds several games; journeys name Room 1 to 3 | Task 2b, Tasks 30, 43 |
| **M1** a tileset's picture cannot reach the page | `open` sends the PNGs a tileset names (read only, capped); `readPictureOf(content, pictures)` | "My calls" 17, Tasks 23, 24, 2b |
| **M2** approving refuses on any problem and uses the wrong project file | Approve loads the change's own `automata.toml`, and refuses only when the game says `stop` | Task 11, Task 36 |
| **M3** F3's `places` with a problem; Play with a problem | F3 says when `places` is left out; Play refuses with "Show me the problem" or runs the level with its doors shut | F3, Tasks 35, 42 |
| **M4** more threads and branches than allowed | Two lanes while Plan W builds, F-tasks take the next free slot, branches counted | "Pull requests, order and lanes" |
| **M5** "Bring to the front" changes the play | The Owner chose a stored `draw`: F5 adds it, `things` is never reordered, Task 42a sets it | Owner's answer 2, "My calls" 4, F5, Tasks 15, 26, 42a |
| **M6** the 8-second hold's reason and its hole | A turn-down closes at once and keeps its branch; Undo is `reopen`; the author is told | "My calls" 14, Tasks 11, 36 |
| **M7** "What changed" needs many calls | One list call and ten `commitPaths` per page, at most five pages | Tasks 7, 23, 38 |
| **M8** spec items with no task | Faces; the small map; "Every crate starts like this"; the turn of the device and the keyboard; "Try a change" and "Back to Level 1" left out on purpose | Tasks 20, 24, 31, 43; "My calls" 12 |
| **M9** what plays is content, not code | Said in a tip, in Help and in the calls; a game without the person's language plays in its own | "My calls" 13, Tasks 28, 35 |
| **M10** sizes cannot tell an iPad from a computer | `sizeClass` is total; `deviceWord`; `layout` takes the device; 24 rows | "My calls" 10, Tasks 4, 21 |
| **M11** `levels = [...]` | A new level is added to `levels` when the line exists; the last id never leaves it empty; tests use the links game's text | Task 8 |
| **L1** percentages | 19 pull requests add to 95, the framework and test game 5; pull request 18 is 1 | The table |
| **L2** Noto versions | Three exact versions named | Global Constraints |
| **L3** `things.2…` | `things[2].x`, from a real diagnostic | Task 34 |
| **L4** `oneLine` in a file that is deleted | Moved to `service/message.ts` first | Task 10 |
| **L5** a second take-back route | One route, `turnDownChange`, for the author's own too | Task 11, Task 33 |
| **L6** the links game is not files | Built from data in the editors' tests, never written out | Task 2b |
| **L7** names of the move-card picture | Room 3 picked and Room 2 beside it | Tasks 30, 43 |
| **L8** "Comes later" | Unbuilt editors are drawn as the mockup draws them, a tap opens a note with "Got it"; no "Soon" | Task 20 |
| **L9** the notes branch's name | `suggestionBranch('notes')` is `automata/notes-`; the test game's `CLAUDE.md` gets one line | Task 23 |
| **L10** renaming changes ids | A plain warning before every rename; the demo's `crate-1` is never renamed | Tasks 15, 19 |
| **L11** two Pixi Applications | One shared Application; the games list draws lazily | "My calls" 15, Tasks 24, 38 |

The audit's three calls for the Owner: **locked and hidden for the visit only** stands, with the words "Locked until you
close the game" ("My calls" 5; the Owner has not answered, and keeping them in the team's file is a choice for a later
round); **draw order** is the Owner's answer 2; **the 8 seconds** is gone for the spec's own wording ("My calls" 14; the
Owner has not answered, and the reason to change it is in the audit's M6).
