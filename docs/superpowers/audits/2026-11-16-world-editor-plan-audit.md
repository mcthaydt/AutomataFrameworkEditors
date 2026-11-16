# The World editor plan: plan audit

Stage 3 of the World editor cycle, written 2026-11-16 (Opus, medium), find-only: nothing in the plan is changed here; a
separate fix thread fixes every finding. Audited: [`plans/2026-11-16-world-editor.md`](../plans/2026-11-16-world-editor.md)
(pull request 75, branch `claude/project-thread-si8y9z` at `35825fe`) against the spec
([`specs/2026-11-16-world-editor-design.md`](../specs/2026-11-16-world-editor-design.md)), `docs/design-language.md`, the
approved mockups (`docs/mockups/`, board v17, pull request 70), Plan W (AutomataFramework
`docs/superpowers/plans/2026-11-15-level-links-and-world-map.md`), AutomataFramework `docs/rules.md`, and the code: Editors
`main` at `7efb826`, AutomataFramework `main` at `7ff5795`, AutomataFrameworkExamples `main` at `45e7d00`. Code was found
with Graphify (Editors, indexed at `7efb826`) and read in the real files.

## Verdict

The plan is thorough and close to the spec: every goal has a task, every named mockup exists, all four known layout
issues are covered (issue 1 in Task 30, 2 and 4 in Task 31, 3 in Task 29, each proved by a named picture in Task 43),
and nothing is planned beyond the current slice (no Tiles, no Scenes, no other editor; F1 to F3 serve play in place and
problems). It is **not ready to execute as written**: four findings are high (the lanes' order breaks in three places, the
"ask for a change" review is one GitHub refuses, the tour's third step has nothing to drag, and the journeys have no
game that can play or join). 26 findings: 4 high, 11 medium, 11 low. Two need the Owner (H3, and the three plan calls
below); the rest are the fix thread's.

## High

**H1. The lanes' order breaks in three places, and the "Needs" column is short.**
- Pull request 5 (Task 12) uses `PutFile`, `PutAnswer` (wire, Task 10) and `ProjectChange` (files, Task 8), all made in
  pull request 4, yet both run side by side after pull request 2.
- Pull requests 4 and 6 create new feature folders (`files`, `map`) and `files` imports `smol-toml`. On `main`,
  `tests/architecture/rules.ts` fails a folder not in `LAYERS` (`unknown-feature`) and confines `smol-toml` to `access`
  (`package-confined`). `LAYERS` changes only in Task 4 (pull request 3, running beside 4), and no task widens the
  `smol-toml` rule. Task 4 also has to add the new page features to `PAGE_SIDE` and `files` to the no-page set.
- Pull request 7 (Task 22: "a drag still moves a thing through `moveThings`") needs pull request 6, but they are in the
  same group (7, 8 and 6).
- Pull request 11 (Task 29) draws each level with `LevelCanvas.picture` from Task 24 (pull request 9), and they run
  side by side.
- Missing from "Needs" though the groups happen to cover them: 10 needs 8 (`api.settings`, `OpenAnswer.editors`); 12
  needs 10 and 11 (Tour step 3, `placeCard`); 13 needs 8, 9 and 11 (the `stop` setting, the levels and the map its
  journey changes); 15 needs 14 (playing the change).

**H2. "Ask for a change" as a review that requests changes will be refused by GitHub.** Task 11's `askForChange` is "a
review that asks for changes". Every waiting change is a pull request the App opened (`createPull` with the
installation token), so the App is its author, and GitHub refuses a review that requests changes on the reviewer's own
pull request (422, "Can not request changes on your own pull request"). The pretend GitHub will accept it unless it is
taught the rule. The words should go as a comment the App writes (or a plain comment review), with who asked inside it,
and `asked()` should read that; the pretend GitHub should refuse a changes-requested review by a pull request's author.

**H3. The tour's third step has nothing to drag.** Step 3 is "drag How heavy" on the crate (`shell-tour-change`), and
Task 31 switches the tour to the slider. No crate has a number value: not the test game's
(`automataframeworkexamples/content/characters/crate.json`), not the editors' fixture, not the links game, and the
framework has no weight a value could set (a declared value does nothing until game code reads it). The demo game is the
one a first-time person tours, so the onboarding the rules put first cannot be finished as drawn. **Needs the Owner:**
options are (a) step 3 drags the first number value the picked thing has and the test game gets one with a rule that
reads it (framework and Examples work in this slice), (b) step 3 becomes "move the crate with the arrows" for good (the
interim the plan already has), (c) the tour picks a thing that has a value. Recommended: (b), which needs no new
framework work and keeps the step's lesson (a picked thing has settings), with the mockup difference named.

**H4. The journeys have no game that can play, join or match their names.**
- Play in place (Task 35) runs `startGame` on the opened game. The editors' fixture hero
  (`tests/fixtures/game/content/characters/hero.json`) has no `moves`, so `startGame` throws "This game has no
  controls"; the play journey cannot pass on it.
- Task 30's journey "push room-1 to room-2, see them joined" uses the links game, where `room-1`'s right edge and
  `room-2`'s left edge are both solid, so they can only touch, never join. Pulling `room-3` apart and pushing it back
  would show a join.
- The plan never says which games the pretend GitHub serves to journeys: the links game is to be copied in Task 17 for
  unit tests only, and the journey fixtures (`tests/fixtures/journey.ts`, `fake-github/repos.ts`) are not in any task
  that adds it. Task 43's pictures name "Level 1" to "Level 3", which neither fixture has (the links game's are Room 1
  to 3).

## Medium

**M1. A tileset's picture is a file to fetch, not something painted in the page.** The plan's facts table and Task 24's
`readPictureOf` say figures, tilesets and backdrops paint in the page through `artFiles`. `artFiles` paints figures and
backdrops only; a tileset names a PNG (`TilesetFile.image`) that `loadArt` reads with `readPicture`. The API sends files
as text (`WireFile.text`), so there is no way to get that picture to the page, and no task makes one. Neither fixture has
a tileset, so the tests would not notice.

**M2. Approving still refuses on any problem.** Call 8 and Goal 6 say a problem warns and never blocks, unless the game
says `stop`; Task 10 does this for Put. Task 11 changes `approve.ts`'s paths only: it still runs `wholeGameLoads`, so a
suggestion with a problem (or any suggestion while `main` has one) can be sent but never put in. It also loads the game
with the default branch's `automata.toml`, not the change's own, so a waiting new level is not listed when it is checked.

**M3. F3 leaves two things open.** `readGame` gives `content` "even with problems between files", but `load()` works out
`places` only when there are no problems, and content with a dangling reference (a thing whose character is gone, a door
into a missing level) then reaches the canvas, the map and `startGame`. F3 should say what `places` is when the world
file has a problem, and Task 42 should say what Play does when a problem is in the level being played (refuse with "Show
me the problem", as Task 35 does for a level that cannot be built).

**M4. The schedule passes the thread and branch limits.** Three editor lanes, the F1 to F3 thread and Plan W's two
working threads (pull requests 172 and 173) are six working threads; the rules allow four. In Editors, `main`,
`ci-screens` and three lane branches are already five, leaving no branch for this audit's fix pull request or any docs
pull request. The plan should say how many lanes run while Plan W is still building, and when.

**M5. "Bring to the front" and "Send to the back" change the play.** Call 4 makes draw order the order of `things`, but
`spawn-level.ts` spawns things in that order, so reordering changes the sim's bodies and can move a recording's hash. A
person tidying what is drawn on top would change how the game plays, and the test game's replay check would report "the
content changed". See the Owner's calls below.

**M6. The reason for holding "Don't put them in" for 8 seconds is not quite true.** Task 36 says the App cannot bring a
turned-down change back in its author's name. The App opened the pull request, so it can reopen it; what stops that today
is that `turnDownChange` deletes the branch at once, and a branch can be made again at the same commit, or deleted
later. The hold also has a hole: if the page closes or goes offline within the 8 seconds, the "no" is never sent and the
change still waits, with nothing said. See the Owner's calls below.

**M7. "What changed" needs more GitHub calls than the plan says.** Task 7's `history(branch, paths, limit)` lists commits
that touched any of several paths; GitHub's list of commits filters by one path, and does not say which files each commit
touched. Naming the levels (Task 23) needs one more call per commit: 50 calls each time the sheet opens. The plan should
say how (one call with `path` set to the content folder, then the files of only the shown page of commits, and a cap).

**M8. Spec items with no task.** The faces of the people in the top bar (spec, top bar); what the small map does (Task
24 names `MiniMap.svelte` only: drag the box, tap to go there, shown only for a big level); "Every crate starts like
this" under a thing's settings; the "Try a change" card while playing and its phone button; focus, picks and open sheets
surviving a turn of the device and the on-screen keyboard (spec, "Every size"), which no test checks. "Back to Level 1" is
for later slices and should be said to be left out.

**M9. What plays is the content, not the whole game.** The spec says "what plays is what the game would play". The
editor has only the content files, so a game's own code (the test game passes `gamePlugins` to `startGame`, empty
today) never runs in the editor. The plan and the spec should say so, and what the screen says for a game whose code
does matter. Play also takes the editor's language (nine) while a game has six: Task 35 should say a game without the
person's language plays in its source language.

**M10. The size classes cannot tell an iPad from a computer.** `sizeClass` puts a sideways iPad (1210 by 834) and a
computer (1280 by 800) both in `'wide'`, and `layout(size, docks, picked, leftHand)` has no input kind, yet the design
language gives them different list defaults (a rail on the iPad, open on a computer) and top bars (56 and 48). Task 21's
20-row table cannot hold both. `sizeClass` also leaves windows 500 to 1000 wide and over 600 tall (other than upright)
unsaid.

**M11. A new level and `levels = [...]`.** Task 8's `add` lists a level file but never adds its id to `levels`, so in a
game that lists its play order a new level is out of it. Taking out the last id but one can leave `levels` empty, which
the schema refuses (at least one). Task 8's tests name `levels`, which the editors' fixture does not have.

## Low

- **L1.** The percentages add to 105 (100 in the table, plus 5 for F1 to F3), and pull request 18 is 0% though it holds
  two tasks.
- **L2.** "Newest 5.x the day Task 3 runs" for the Noto fonts against "exact versions": name them in the plan, or have
  Task 3 write the exact versions and report them.
- **L3.** Task 34 reads `things.2…`; the framework writes paths as `things[2].x` (`diagnostics.ts`).
- **L4.** `oneLine` lives in `service/save.ts`, which Task 33 deletes; Task 10's `put.ts` uses it. Move it first.
- **L5.** Task 11's `takeBack` repeats `turnDownChange`, which already lets an author take their own change back. Reuse it
  (or say why a second route).
- **L6.** The links game is built in memory (`tests/fixtures/links-game/read.ts`, importing the framework's `#src`), not
  kept as files; Task 17's "copy its files" must write them out from that builder at the pinned commit.
- **L7.** Task 43's `issue-1-move-card` names Level 2 and Level 3; the mockup (`world-map-move`) and the spec mean the
  picked Level 4 and Level 3.
- **L8.** "Comes later" on five editor rows: the approved `shell-editors` page has no such words, design language §8 says
  "no 'Soon'", and the World row there reads "Levels, tiles and scenes" while only Levels is built. Reconcile with the
  spec's call 1, and put new words through the drunk-grandma test.
- **L9.** The notes branch `automata/notes` sits in the save branches' `automata/<login>` names (a GitHub person called
  `notes` would collide); the test game's `CLAUDE.md` branch rule should name it as allowed.
- **L10.** Renaming changes ids: Plan W (audit L14) keeps `crate-1` first because the Site reads it, and a player's save
  keeps level ids. Task 15 and 19 should say what renaming the demo game's `crate-1` or a level does to those.
- **L11.** Two Pixi Applications: `LevelCanvas.picture` hands a container to `map-canvas.ts`, and `Games.svelte` (Task 38)
  shows each game's start level the same way. Say whether one Application is shared, and how the games list gets every
  game's content without opening each.

## The Owner's calls (flagged, not decided)

1. **Locked and hidden for the visit only (call 5).** No problem with the principles: nothing is kept where an agent
   cannot see it, because nothing is kept. One cost: a lock does not reach a teammate, which LDtk-style locking often
   means, and is gone on reload with no word. If it stands, the list's locked row could say "until you close the game".
2. **"Look" without draw order (call 4).** It leaves out the "Drawn behind, with the hero, in front" choice the approved
   mockups draw, which Task 31 must name as a screen that differs (the plan's own board rule). And the stand-in, order of
   `things`, changes the play (M5). A choice for the Owner: leave draw order out entirely for now, or keep "Bring to the
   front" knowing it moves recordings.
3. **8 seconds before turning a change down (Task 36).** The reason given is weaker than stated and the hold can drop a
   "no" (M6). The alternative is the spec's own: turn it down at once, keep the branch, and let Undo reopen it.

The map drawn without `paintWorld` (call 3) is also a difference from the spec's words; it keeps `layoutWorld` as the one
judge, which is the part that matters, so this audit finds no problem with it.

## Checked and fine

- Every mockup page the plan names exists; every World and shell page is named except Tiles and Scenes (not this slice).
- Plan W's fixture facts the plan leans on hold: `room-2` at (20, 0) and `room-3` at (36, 0) join on rows 5 to 7; the
  plate's `opens` has `most: 4`; the critter's `reach` is 1 to 8 by 0.5.
- `loadGame` already runs the world file's checks, walls and overlaps included, so Task 34's problems list works before F3.
- `Game` exposes `sim`, and the sim has `snapshot()` and `restore()`, so F1 and F2 are buildable as written; F1 and F2
  after Plan W's pull request 4 (which changes `game.ts`) is right.
- The Owner approved the seven font and icon packages (Blueprint redesign spec, Constraints).
- Draft keys keep today's form, `af.draft:<owner>/<name>:<path>`.
