# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first.

## Task 6 and Task 7 part 1 reverted (2026-11-15)

The Owner said (2026-11-15) that the editors were built before their mockups were shown, and chose to revert what had
already merged on that path: Task 6 (pull request 28) and Task 7 part 1 (pull request 45). This pull request reverts
both merge commits and nothing else; pull request 47 (Task 7 parts 2 and 3) was closed unmerged. Tasks 1 to 5, the
framework pin and every document stay. No editor is built until the Owner approves the revised mockups. Nothing was
run; the pull request's checks are the test.

## The mockups of all five editors: design audit

The Owner asked (2026-11-15) for mockups of every editor before any editor code, and then for an audit of them against
the tools professional developers use. The audit is
[`audits/2026-11-15-editor-mockups-design-audit.md`](audits/2026-11-15-editor-mockups-design-audit.md): written, 100%.
Its verdict: the mockups show the first minute of a game and the frame has no list of what is here, no library and no
full values panel. It lists 27 changes in three ranks, judged on a sideways iPad Pro 11-inch first (the Owner, 2026-11-15), and
records the Owner's two answers of the same day: panels attach to the edges on a sideways iPad and a computer, with
drawers only on a phone; touch keeps 44-point targets and small rows apply with a trackpad, mouse or hovering Pencil.
Both change the redesign spec, which still needs its amendment. The mockups (pull request 34) are revised from it; no editor is built from a
mockup until the Owner approves the revised set. Nothing was run.

## Cycle 6: the 2D figure builder

Spec: [`specs/2026-11-15-2d-figure-builder-design.md`](specs/2026-11-15-2d-figure-builder-design.md). The Owner asked
(2026-11-15) that every editor part get its own pipeline; this is the first. The demo game's art comes from the
builders (the Owner, 2026-11-15), so this is on the path to Release 1. It starts building after Cycle 3's frame and
level screen are on `main`, and after the framework's rigged-figures cycle (its spec,
`2026-11-15-rigged-figures-design.md` in AutomataFramework), since the builder can change only what the file holds.

Overall: **12%** (stage 1 counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5 is 10, stage 6 is 12,
stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Written; the Owner's Q1 to Q5 answered (2026-11-15); in review with the framework's rigged-figures spec | [`specs/2026-11-15-2d-figure-builder-design.md`](specs/2026-11-15-2d-figure-builder-design.md) |
| 2. Plan (plan G) | Written, in review, 100%. Eighteen tasks in six pull requests (each task is 5% of stage 4; the last 10% is the final green run and the review artifact). Three gates before any of it is built: the Owner's approval of the mockups of all editors (the Owner, 2026-11-15; where the Characters mockup differs, the plan is amended first), the Blueprint redesign's frame on `main`, and the framework's plan R on its `main` as far as each pull request needs. The pull requests: 1, the pin and one change of several files in the API; 2, the Characters frame, a figure on screen as the framework paints it, Body, Colours, the draft, Save and Export; 3, Wear with the library's tray, a shape of your own, Face; 4, Move (walk and stand) and Pose (by handles and joint by joint); 5, front and back views, players' colours, animals and free shapes; 6, New figure, giving a character a picture, Play, every action in the find bar, the first visit, every screen pictured. Rulings for the audit: the page paints the pictures at save and the API checks their size and atlas (it does not paint); a walk's or stand's numbers change the game's own copy of that file; painting stays on the main thread. No dependency is added. No Owner question is open | [`plans/2026-11-15-2d-figure-builder.md`](plans/2026-11-15-2d-figure-builder.md) |
| 3. Plan audit | Done, 100%: no critical finding, eight important, four minor, all fixed in the plan in the audit's pull request. The ruling that the page paints the pictures is held, with the API now also checking each picture's colour table and a save carrying every picture a shared file repaints; one commit of several files is new GitHub work on the git data routes, with the calls counted; the first pull request needs plan R's new Part 0 (`listContent`); `CLAUDE.md`'s rule on what an editor writes is widened in Task 2; a pose's places are units from the hips; the redesign's Tasks 15 and 16 join gate 2; one shared `allowedPaths` (`service/changed.ts`) decides which files a save, an approval and the waiting list accept, so a waiting figure save can be approved (G-I8, from the scenes audit). No Owner question opened here; the games' art is in Lospec's DUEL palette (256 colours; the Owner, 2026-11-15), so on the demo Add a colour offers the library's DUEL ramps only. The three gates still hold. Nothing was run | [`audits/2026-11-15-2d-figure-builder-plan-audit.md`](audits/2026-11-15-2d-figure-builder-plan-audit.md) |
| 4. Execution | Not started | |
| 5. Implementation audit | Not started | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

## The Sound editor cycle

Spec: [`specs/2026-11-15-sound-editor-design.md`](specs/2026-11-15-sound-editor-design.md). Its new file formats are
the framework's, in AutomataFramework's `docs/superpowers/specs/2026-11-15-sound-formats-design.md` (its Cycle 8).
Each of the five editors has its own cycle (the Owner, 2026-11-15).

Overall: **12%** (stage 1 counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5 is 10, stage 6 is 12,
stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Written, in review. The Owner answered Q1 to Q6 (2026-11-15): opens on the level with sound chips; a new sound starts from a kind with Try another and plain sliders; music as GarageBand-style loops, whole chords and motifs; recorded sounds in; new formats in the framework first, with MIDI to JSON and back; content folders listed once, with a one-time "Set up sounds". Flagged: Feel's cycle lists one line per effect, which differs from Q6 | [`specs/2026-11-15-sound-editor-design.md`](specs/2026-11-15-sound-editor-design.md) |
| 2. Plan | Written, in review, 100%. Twenty tasks in three parts and eight pull requests (3 points each of stage 4's 60). Part 1, sounds and what plays when: the pin and test games with sound; the API saves a change of several files in one saved change and lists a game's folders; a change held, drafted and saved on the page; what plays when, as edits with undo; the four sliders worked out from the file and a sound's picture; one speaker for everything Sound plays; Sound opens on the level with its chips; a sound's card; a new sound from a kind with Try another; "When…"; Save, "Set up sounds", Export and a waiting change; the first run in nine languages. Part 2, recordings: record or bring in a file; trim, keep and save it. Part 3, music and motifs: every edit of a song; the music screen; make your own loop; motifs; music files in and out; music's first runs and the whole of Sound end to end. It waits for the Owner's yes to the mockups, the redesign's build, and the framework's plan M (AutomataFramework). No new dependency. Settled in the plan: "MIDI" is not written on a screen (the spec bans the word), "Try another" is for this visit only (nothing may remember a kind), a song written as rows of notes is turned into loops, and the save of several files is one for every editor, shared with the Feel plan. No Owner question is open | [`plans/2026-11-15-sound-editor.md`](plans/2026-11-15-sound-editor.md) |
| 3. Plan audit | Written, in review, 100%. Sound, with one critical fault fixed (Task 1 gave the fixture game folder lines before the page and the API could list a folder, which would have broken every journey) and seven important and five minor, all fixed in the plan: Play makes the game's sound over Sound's one speaker; chips follow how the framework names events (`hero.*`, a touch event by `kind`); no framework English, "MIDI" or "event" on a screen (Sound words the framework's codes); one save shared with the Feel, Story and Scenes plans (the figure builder’s `saveChange` and its shared `allowedPaths`, widened for recordings, removals and `setUp`; folder lines only by the framework’s `withFolders`); a brought-in song may be one step of up to 200 files; `CLAUDE.md` widened for `.wav` files and folder lines; the hero's eighth event worded. The spec's MIDI buttons and chip rule amended to match. No Owner question | [`audits/2026-11-15-sound-editor-plan-audit.md`](audits/2026-11-15-sound-editor-plan-audit.md) |
| 4 to 7 | Not started | |

## Cycle 5: the Feel editor (2D)

Spec: [`specs/2026-11-15-feel-editor-design.md`](specs/2026-11-15-feel-editor-design.md). Its own cycle (the Owner,
2026-11-15: every editor tab gets its own pipeline). Feel tunes the built-in hero's move numbers by playing the real
level with a drawn jump (Q1 A), changes the controls, and after the framework's plan F the effects (Q2 A). Move
switches stay in Characters (Q3 B). Q4 changed after the spec (the Owner, 2026-11-15): Feel lists its effects folder
once in `automata.toml`, the way Sound does, and no longer adds a line per effect. The spec is amended to say so
(2026-11-15), and the plan is written that way.

Overall: **12%** (the same weights as Cycle 3: stage 1 counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60,
stage 5 is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done; Q1 to Q4 answered by the Owner | [`specs/2026-11-15-feel-editor-design.md`](specs/2026-11-15-feel-editor-design.md) |
| 2. Plan | Done (2026-11-15, in review): fifteen tasks in three parts, every one with its journeys. The framework's F1 to F3 are their own plan, plan G, in AutomataFramework (`docs/superpowers/plans/2026-11-15-live-tuning.md`) | [`plans/2026-11-15-feel-editor.md`](plans/2026-11-15-feel-editor.md) |
| 3. Plan audit | Done (2026-11-15): sound; three important fixes (two slider words over the 32-character limit, a panel no longer swallows a key's release, and the save follows the figure builder's `saveChange` instead of a second shape) and six small ones, made in the plan and two words in the spec. No Owner question; the order of the Feel and figure builder cycles is the coordinator's | [`audits/2026-11-15-feel-editor-plan-audit.md`](audits/2026-11-15-feel-editor-plan-audit.md) |
| 4. Execution | Not started; waits for the Owner's yes to the mockups of all the editors (the Owner, 2026-11-15: mockups before any code), Cycle 3's Tasks 1 to 19, the framework's plan H and plan G, and this plan's audit; Part 3 (effects) also waits for the framework's plan F, and its content folders | |
| 5. Implementation audit | Not started | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

Nothing was run: this stage wrote documents.

## The Story editor (its own cycle)

Spec: [`specs/2026-11-15-story-editor-design.md`](specs/2026-11-15-story-editor-design.md). The Owner asked that every
editor get its own full pipeline (2026-11-15). Story has three parts in World's frame: Conversations (a map of cards),
Cutscenes (a camera frame and actors on the level's real art, over a timeline) and Words (every word a player reads,
six languages side by side). Its build waits for the Owner's approval of the mockups of all editors, for framework
plan T on `main` and for the redesign's build.

Overall: **12%** (stage 1 counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5 is 10, stage 6 is 12,
stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Written, in review; Q1 (a map of cards), Q2 (a save missing words waits until all six languages are there) and Q2b (a native speaker may mark words read) answered by the Owner | [`specs/2026-11-15-story-editor-design.md`](specs/2026-11-15-story-editor-design.md) |
| 2. Plan | Written, in review (2026-11-15): 24 tasks in eight pull requests; amended with every finding of the plan audit (2026-11-15) | [`plans/2026-11-15-story-editor.md`](plans/2026-11-15-story-editor.md) |
| 3. Plan audit | Done (2026-11-15): 2 critical, 12 important, 11 minor; the plan is amended before the tasks each names | [`audits/2026-11-15-story-editor-plan-audit.md`](audits/2026-11-15-story-editor-plan-audit.md) |
| 4. Execution | Not started; the plan is amended, so it waits only for the mockups' approval (the Owner, 2026-11-15), plan T and the redesign's build | |
| 5. Implementation audit | Not started; two audits (drunk-grandma on Opus, visuals on Fable) | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

### The plan amended (2026-11-15)

Every finding of the plan audit is now written into the task it changes, tagged with its number. The gates gain
G3b (the framework's camera shot, plan T's Task 11, before Tasks 15 to 17), G6 (the framework's content folders and
`withFolders`, plan M) and G7 (the shared several-file save of the figure builder's plan, before Tasks 4 to 6). Story
writes no `automata.toml` byte of its own and has no save route of its own. The App finishes a complete words change
when GitHub says its checks passed (`/api/github-hook`), and a change that clashes with `main` is brought up to date
key by key. An approver reads a Story change in plain lines and can open it in Story; World's stamp says when a save
joined a change waiting for words (the one change to World). Made ids start with a letter and every key fits 96
characters; long choices wrap; typing beside the preview never presses it. Nothing was run: this read documents
only. The percentage stays at 12 until stage 4 starts.

### Stage 3 finished (2026-11-15)

The audit accepts the plan's two questions (Q-A: new lines start in the game's own words, which the framework forces;
Q-B: an organization's admin approves their own words change once it is complete) and finds two critical problems to
amend before any task: adding words to someone's waiting change let a Suggest-level person's words go in without
approval (C1), and ruling 6's one `automata.toml` line per new file contradicts the Owner's content-folders decision
(C2: Story uses a listed folder, an older game gets a one-time "Set up stories", and a new gate G6 waits for the
framework's folders). The important ones: three framework names to export (I1), the camera's frame to come from the
framework once plan T's Task 11 is in (I2), the key rule into the framework's content skill (I3), a blocked branch
move told from a changed one (I4), clashes with `main` (I6), what an approver sees (I7), an Owner's World saves joining
their words change (I8), the preview's keys (I9), ids that start with a digit (I10), and a missing language file
blocking every save (I11); and Story saves through the shared several-file save (`saveChange`, `allowedPaths`)
the figure builder, Feel and Scenes use, widened only where Story needs more (I12).

**The Owner's answer (I5, 2026-11-15): the App finishes it itself.** The spec says a complete words change goes in
once its checks pass; the plan only finished it when someone opened the game. Now the App hears GitHub's
`check_suite` event at one new route, `/api/github-hook` (signed with a webhook secret kept in Cloudflare, set at
deploy), and finishes the change itself. Task 21 is no longer held.

**Next:** the plan's amendment, then stage 4 once the gates open. Nothing was run: this stage read documents and code.

### Stage 2 finished (2026-11-15)

The plan has 24 tasks in eight pull requests: the speech box shown on its own (one small pull request in
AutomataFramework); the framework pin; several files saved as one change, a change that waits for its words and goes
in when they are there; Story in the frame with its own page; conversations (the changes, the map's layout, the map
on screen, changing it, the speech box and Try it); cutscenes (the changes, the stage, the timeline and Play, a new
cutscene and Try it in the game); Words (the table, writing a word, read marks, Save and Export); and the first run,
the find bar, and every screen pictured. Every task has end-to-end journeys at five sizes in three browsers.

**Gates.** No task in this repo starts before the Owner approves the mockups of all editors (if Story's mockup
differs from the plan's screens, the plan is amended first); the framework's task may start once plan T is on its
`main` and this plan is audited. "Try it in the game" also waits for the redesign's Play.

**Ruling 6, settled by the Owner's one rule across editors (2026-11-15):** each kind's folder is listed once in
`automata.toml` and new files in it just work, as for Feel and Sound. A new conversation or cutscene is a new file
in its folder; a game that does not list the folder yet has a one-press set-up that adds the one entry. The two Add
cards wait for the framework's content folders on the pin.

**For the plan audit:** Q-A, new lines start in the game's own language, because the framework refuses a line the
game's own language lacks; Q-B, a change started by someone who is an Owner only through GitHub (an organization's
admin) waits for approval once its words are there. Also new in the plan and flagged there: a language with no
words file never makes a save wait (ruling 9), and "Changed" and "who read it" come from the game's history
(ruling 13).

Nothing was run: this stage wrote documents.

## Cycle 4: the 2D environment builder (World's Scenes part)

Spec: [`specs/2026-11-15-2d-environment-builder-design.md`](specs/2026-11-15-2d-environment-builder-design.md). A full
scene builder, as powerful as the first attempt's 3D environment builder (the Owner, 2026-11-15); the scene owns the
ground and the level only places what plays (Q1); all of the 3D builder's powers come, built in six slices (Q2). It is
on the path to Release 1, because the demo's real art comes from the builders. It is built on Cycle 3's frame, after
Cycle 3's build and audits. Each slice has a framework plan (AutomataFramework) and a builder plan (here).

Overall: **12%** (stage 1 counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5 is 10, stage 6 is 12,
stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Merged (PR 31, 2026-11-15); Q1 and Q2 answered by the Owner | [`specs/2026-11-15-2d-environment-builder-design.md`](specs/2026-11-15-2d-environment-builder-design.md) |
| 2. Plan | Slice 1 (ground and materials) written, in review (2026-11-15). The builder's plan: thirteen tasks in five pull requests (Tasks 1 to 12 are 7% each, Task 13 is 6%, the last 10% is the final green run with the review pictures): the pin and the photos served; several files of a game saved in one change; saving a scene with its picture on the API; every change a scene's ground can take; the scene painted in the page by the framework's painter; the Scenes screen on the frame; Paint and Erase (a slope is drawn as a line and fills under itself); the Materials panel; scenes on the game's page, a first scene and "Edit this scene"; Save, Export and the waiting change; the first run; nine languages and every screen pictured; Play. **Its build waits on four gates:** the Owner's approval of the mockups of all editors (the Owner, 2026-11-15), Cycle 3's build and audits, the framework's slice 1 merged, and for Play the level editor's Play and the hero on slopes. Seventeen rulings for the audit; four depart from the spec (the first run until props exist, the empty state's second button, no size control, three tools shown). Slices 2 to 6 are outlined. The framework's plan is in AutomataFramework | [`plans/2026-11-15-scenes-1-ground-and-materials.md`](plans/2026-11-15-scenes-1-ground-and-materials.md); the framework's: [`2026-11-15-scenes-1-ground-and-materials.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/plans/2026-11-15-scenes-1-ground-and-materials.md) |
| 3. Plan audit | Done (2026-11-15), slice 1, both plans: ready once fixed, and the fixes are in the plans. One blocking finding (a Suggest-level scene save could never be approved: `approve.ts` and `waiting.ts` refuse pictures, atlases and `automata.toml`; one shared `allowedPaths` fixes it for every editor), six important (the save goes through the figure builder's `saveChange`, as Feel's does; ruling 8 kept with a palette check; `readBytes` reads a picture over 1 MB by its blob; the test game's pictures stay uncommitted; the live repaint uses the framework's new `showScene`; the flat scene takes its colours), five minor. **The Owner's four answers (2026-11-15, 01:02 UTC)** are rulings 1, 13, 14 and 15 as written: only working tools; two simple starts; "Paint ground, press Save"; a scene's size by agents only for now. The four gates still hold | [`audits/2026-11-15-scenes-1-plan-audit.md`](audits/2026-11-15-scenes-1-plan-audit.md); the framework's: [`2026-11-15-scenes-1-plan-audit.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/audits/2026-11-15-scenes-1-plan-audit.md) |
| 4. Execution | Not started: waits on the four gates | |
| 5. Implementation audit | Not started | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

## Cycle 3: the Blueprint redesign

Spec: [`specs/2026-11-14-editors-blueprint-redesign-design.md`](specs/2026-11-14-editors-blueprint-redesign-design.md).
It replaces Cycle 2's restyle: the Owner saw PR 12's screens and they did not match the agreed mockup. Cycle 2's plan
and audit stay for the record; PR 12 is not merged, and the new plan names the parts it takes from it.

Overall: **12%** (stage 1 counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5 is 10, stage 6 is 12,
stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (pull request 15); Q1 to Q4 answered by the Owner | [`specs/2026-11-14-editors-blueprint-redesign-design.md`](specs/2026-11-14-editors-blueprint-redesign-design.md) |
| 2. Plan | Done | [`plans/2026-11-14-editors-blueprint-redesign.md`](plans/2026-11-14-editors-blueprint-redesign.md) |
| 3. Plan audit | Done; 11 important and 12 minor findings applied to the plan; Owner Q1 blocks Task 7, Q2 blocks Task 19's amendment; coordinator C1 open | [`audits/2026-11-14-blueprint-redesign-plan-audit.md`](audits/2026-11-14-blueprint-redesign-plan-audit.md) |
| 4. Execution | In progress (Task 3 of 19); Play (Task 19) waits for a framework cycle | [Stage 4 log](#stage-4-log) |
| 5. Implementation audit | Not started; two audits after the build (drunk-grandma on Opus, visuals on Fable) | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

### Stage 4 log

Overall for this stage: Task 1 of 19 in review. Nothing is run on the building session's machine except
`pnpm install --lockfile-only` (the lockfile's checksum cannot be written by hand); every test and check is read from
the pull request's CI.

- Task 1 (pull request 1, the framework pin): pinned first to `4b18418`, whose git install failed (its build script was
  TypeScript, which Node will not run under `node_modules`), then to `b57d00a`, the merge of AutomataFramework pull
  request 95 (the fix, and the level picture Task 3 needs). The lockfile gained the framework's new Colyseus peer
  packages; the new tarball's checksum was worked out from the downloaded file, the same way that gave the old one.
- Task 3 (pull request 3, real art): the editors draw the level with the framework's `createLevelPicture`, in the game's
  own art. A new `GET /api/picture` hands a game's `.png` to the page as base64 (kept five minutes by the browser, and
  for a visitor at the demo game in Cloudflare's cache); the page loads a level's art through it before the picture is
  made, and a missing picture shows boxes with a notice. The test game has art (`G` tiles, a meadow tileset, a valley
  backdrop, figures for the hero and the crate); `plain-game` is the old boxes. `pixi.js` is out of `package.json`
  (the lockfile entry was removed by hand), and no file here imports it.

- Task 5 (words as a table): every word is in `src/features/words/en.ts` and read through one reactive `WORDS`
  (`words.svelte.ts`), so a screen follows the language when Task 17 adds the others. Ruling: `words.ts` stays as the
  feature's entry (the plan said delete it; the architecture rules need an entry). The API side does not read the
  words; the App's name in a waiting change's note is `APP_ON_GITHUB` in `wire.ts`, and a test holds the screen's
  words to it. Tests read the plain English table through `tests/fixtures/words.ts`, so Node never loads a rune file.
  `measure.ts` and `live.svelte.ts` from the plan's Task 4 are not copied yet: nothing imports them, so knip would
  flag them; they arrive with the first test that uses them.
- Task 7b (the framework pin, zoom plan): the pin moves from `b57d00a` to `504c278`, the merge of AutomataFramework pull
  request 102 (`LevelPicture.setView`, which the zoom needs). Same three places as Task 1: `package.json`, the
  `onlyBuiltDependencies` line and the lockfile, whose checksum was worked out from the downloaded tarball.

### Stage 3 finished (2026-11-14)

The plan audit found nothing blocking and eleven important findings, each now written into the plan and marked
`(audit I<n>)`: layouts that would overflow with German or Russian tool words, and a title block taller than its
room (the room is now measured, phone undo and redo float above the tools, the title block is a 2 × 2 grid); three
first-visit gaps (the crate's ring on arrival, the card's sheet held back during the first drag on a phone, and the
"Sign in to save with your team" line under a visitor's stamp at every size); the still picture freeing the art it
is given; the renderer's half-height limit; caching the pictures for a crowd of visitors; no skipped scenes in Task 4;
a first tip that need not name an English id in other languages; and Play's tests moved to the built-in hero's thumb
scheme. Twelve minor findings are applied too.

**Waiting:** the Owner's Q1 (how big a level is on a phone held upright; recommended pinch to zoom) before Task 7;
the Owner's Q2 (the game's language in Play when the editors are in French, Russian or German) before Task 19's
amendment; the coordinator's C1 (what a stage may run locally this cycle). PRs 1 to 4 can start now.

Nothing was run: this stage wrote documents.

### Task 7's amendment: pinch to zoom (2026-11-14, plan stage)

The Owner answered the plan audit's Q1 with C, so Task 7 has its amendment:
[`plans/2026-11-14-blueprint-redesign-task-7-zoom.md`](plans/2026-11-14-blueprint-redesign-task-7-zoom.md). At every
size a pinch zooms the level and two fingers move it; one finger still drags a thing; three buttons, three keys and
the find bar do the same. It adds one small call to the framework (`LevelPicture.setView`, its own pull request there,
Task 7a) and one more pin move (Task 7b), both before pull request 5, then four steps inside Task 7 and a few lines
each for Tasks 9, 10, 12, 13, 16, 18 and 19. The spec's "Phone upright", "Every size" and "Testing" say so now.

**The Owner's answer O1 (2026-11-14): A.** On a phone held upright nothing scrolls any more; the notes' switch and the
title block float in a row above the tools and close like the other panels.

**Next:** the plan audit reads the amendment; Task 7 starts when that audit is merged. The overall number does not
move for this. Nothing was run: this stage wrote documents.

### Task 7's amendment: plan audit (2026-11-14, stage 3)

[`audits/2026-11-14-blueprint-redesign-task-7-zoom-plan-audit.md`](audits/2026-11-14-blueprint-redesign-task-7-zoom-plan-audit.md):
no blocking findings, seven important and twelve minor, all written into the amendment. The main ones: the page itself
can no longer be zoomed or moved from the level screen (ruling 29), a press's focus never slides the level, a Ctrl
mouse wheel zooms one step a notch, the phone's new row is measured and fits in every language, the zoom buttons close
like the other panels, and Task 7 is built with the Owner's O1 from its first step. No question for the Owner.

**Next:** Task 7a in AutomataFramework, then the pin (Task 7b), before pull request 5. The overall number does not
move. Nothing was run.

### Stage 2 finished (2026-11-14)

The plan has 19 tasks in ten pull requests: the framework pin; a still picture of a level in the framework (one
pull request in AutomataFramework) and a second pin; real art in the editors; the look's parts and the words as a
table; the level screen (the frame, the card, the notes, Add and Erase, Save and Export, the first visit); the find
bar and faces; the other screens; nine languages with no default; every screen pictured and the docs; and, last,
Play. Every task has end-to-end journeys at five sizes (phone upright and sideways, tablet upright and sideways,
desktop) in three engines, and every pull request that changes a screen ends with its pictures in a review
artifact.

**The Owner's answer on Play (2026-11-14): B.** The framework alone cannot move a hero today (that is each game's
own code), so Play is real play, built as the last slice, after a framework cycle adds a built-in walk-and-jump a
game turns on in its files. Task 19 holds everything the editors decide and names the two things only that
framework cycle can (how a game's files say the hero is on, and the call that plays it). It does not start until
that cycle is merged and a short amendment to the task is too. Until then no screen shows a Play button.

**Found on the way, for the plan audit to check:**

- The framework's renderer draws only from a running sim and keeps room clear only at the bottom, so a still level
  between four floating panels needs a small addition to the framework (Task 2), then a second pin move. The
  coordinator said this is fine.
- The demo game has no art yet, so a visitor's first level shows boxes on sky until the demo game gets its art.
  The editors' own test game gets art in Task 3, so real art is proven here either way.
- A character has no name or description in the framework's formats, so the card shows the id as words and leaves
  the "what it is" line out.

**Rulings the plan makes** (16, each in the plan's "Rulings" for the audit to challenge): the three layouts and
their sizes; the room kept clear on each; names from ids; start points picked and moved like things; faces through
this site's API; translations written by the builder and read in full by the drunk-grandma audit, with no native
reader; the editors draw their own nine flags; a game that has not turned the built-in hero on gets a plain notice
from Play; the two audits do not wait for Play.

**Added by the Owner after the spec was merged (2026-11-14):** every panel can be closed and opened, to hide
things when overwhelmed and show everything as a power user. It is ruling 17 and part of Task 7: the tools, the
card, the title block and the notes' switch each close to a small handle, one control hides or shows them all, the
level never moves when they do, and what is closed is remembered on the device. It extends the spec; the spec's
page has not been changed.

Nothing was run: this stage wrote a document.

## Cycle 2: the editors wear Blueprint (replaced by Cycle 3)

Spec: the "Visual direction" section of
[`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo, and Cycle 1's implementation audit for the three minors it left (M4, M5, M9).

Overall: **12%** (stage 1 is the shared spec and counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5
is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework) | the section above |
| 2. Plan | Done (pull request 10) | [`plans/2026-11-14-editors-restyle.md`](plans/2026-11-14-editors-restyle.md) |
| 3. Plan audit | Done, in review: four blocking findings, all written into the plan; one question for the Owner | [`audits/2026-11-14-editors-restyle-plan-audit.md`](audits/2026-11-14-editors-restyle-plan-audit.md) |
| 4. Execution | Not started | |
| 5. Implementation audit | Not started | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

### Stage 3 finished (2026-11-14)

The plan audit read the plan against the spec's "Visual direction", the code on `main` and the four packages. The
plan is sound; every colour figure and file name in it was checked and holds. Nothing was run but a script that
recomputes the contrast figures.

**Four blocking findings, all fixed in the plan:** two words were used a task before they existed, which the words
test would have failed (B1); the screen's sentences would have lain over the level for good, on a phone over half of
a visitor's first level (B2); the tile grid could not be seen on the demo game's sky, at 1.07 to 1 (B3); pressing a
note did nothing a finger could see (B4). Eleven should-fix findings are in the plan too (the level could still move
under a finger when a stamp left; a waiting change lost its ring for two tasks; three tests could pass without
proving anything; and others), and eleven notes.

**Rulings the audit made** (each with its cost in the audit): the standing sentence sits in the top panel and only
what just happened floats, with "Got it" on a notice that asks nothing; the grid is a pair of strokes; a pressed note
marks the card's arrows; the stamp lies over the clear cell's corner.

**Waiting on the Owner, Q1:** should Share be on the level screen? The spec lists it among what floats over the
canvas; the plan keeps it on the game's page. Not defaulted. Tasks 1 to 6 do not depend on it; Task 7 waits.

### Stage 2 finished (2026-11-14)

The plan has nine tasks: the six colours and three fonts; icons and the shared pieces (with M4); redo and a canvas
that draws only the art; the level filling the screen with floating tools; the drawing notes; the stamps; the list
screens (with M5, kept as a ruling); the name (M9); the docs and a reading of every picture. Every task has
end-to-end journeys at iPad upright, iPad sideways and phone size in three engines.

**The Owner answered the one question (M9):** the editors are "Automata Framework editors" on screen, and the GitHub
App is "Automata Framework Editors". Whether the App already exists under another name is not known; the plan keeps
its name in one constant.

**Measured in a throwaway copy, never committed, no test run:** the four packages install and build; Vite inlines
three small font files as `data:` addresses unless `build.assetsInlineLimit` is `0`, which the header would refuse;
knip does not see the three font packages; every icon the plan names exists.

**Rulings made, for the plan audit to challenge** (the plan lists each with its cost): Share stays a row on the
game's page; the bar with the wordmark and Sign in stays above a level; the first-run strip stays above a level; Redo
is added; a waiting save is stamped "Saved by" too; the notes' switch is one tool that steps through three states;
the floating panels' tracks are fixed sizes.

**Not in the plan, and why:** the find bar and Play (neither exists until M3, so "Hide notes" there and "Play hides
the notes" wait for them); an editor switcher (one editor in M1); a light theme; the Korean, Japanese and Chinese
fonts (they join with the first translation).

## Cycle 1: the 2D first layer, the Editors' share of M1

Spec: [`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo (milestone M1, the Editors line).

Overall: **94%** (stage 1 is the shared spec and counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5
is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework, PR 1) | the spec above |
| 2. Plan | Done | [`plans/2026-11-13-m1-thin-thread-editors.md`](plans/2026-11-13-m1-thin-thread-editors.md) |
| 3. Plan audit | Done, in review | [`audits/2026-11-13-m1-editors-plan-audit.md`](audits/2026-11-13-m1-editors-plan-audit.md) |
| 4. Execution | Done: all 21 tasks, journeys green in three engines (pull request 4) | the plan, ticked |
| 5. Implementation audit | Done, in review: one blocking finding (the level's picture never redraws) | [`audits/2026-11-13-m1-editors-implementation-audit.md`](audits/2026-11-13-m1-editors-implementation-audit.md) |
| 6. Fixes | Done, in CI: B1, S1 to S10 and every minor the audit asked for (pull request 9) | the audit's "For stage 6", ticked below |
| 7. Owner review | Not started | |

### Stage 4 finished (2026-11-14)

Branch `claude/project-thread-wezbcp`, pull request 4. All 21 tasks are written and the plan's boxes are ticked.
The journeys (208 per engine) are green in Chromium and Firefox; the last WebKit failure was one Share-screen race,
fixed by waiting for the page to settle before a test reloads it. The new `commit-authors` check passes, and every
commit on the branch is McThayDT's. Task 20 (`tests/journeys/screens.journey.test.ts`) measures and pictures about 40
screens at three sizes, and CI copies the pictures to the `ci-screens` branch under `pr-4/<engine>/`.

The screens check found three real defects, all fixed: on a phone the stage shrank to a strip beside its tools; the
waiting-change screen had two top headings; the sign-up link on Welcome was under 44 px tall.

**Rulings I made:**
- Offline journey: the browser goes offline, instead of the pretend GitHub being down, because the API answers a down
  GitHub with a generic failure, not "offline". Cost if wrong: none for users; the test is a little less literal.
- A cancelled or failed sign-in returns the person to the screen they were on (a level stays on screen), instead of
  the list. Cost if wrong: a visitor lands on a level they did not open; low.
- After Approve or Turn it down the screen shows its good Notice with a Back button to the game's page, instead of
  going straight there, so the person reads the result. Cost if wrong: one extra press.
- The framework pin moved to 9109fa3 on this branch, not in its own pull request, because the repo's `main` had no
  `package.json` yet. Cost if wrong: none.
- `Levels` takes `oncopytext` and `oncopyfile` as optional props (the plan's single `oncopy`), for audit item B2's
  two buttons.
- The thing's button selects it on keyboard focus, so a keyboard-only person gets the arrow buttons.
- `VITE_DEMO_GAME` replaces `VITE_SAMPLE_GAME`; a second build, `dist-plain/`, serves the "no example game" journeys.
- Journeys of people who are not Owners open the game by its address, not from the list, because the list shows only
  games a person has opened or owns. Cost if wrong: none.
- A level shown read-only (a waiting change) has an `h2`, so a screen has one `h1`. Cost if wrong: none.
- The screens check leaves the things on the stage and the radio buttons out of the 44 px and overlap rules: a thing
  has its own 48 px floor and the arrow buttons. Cost if wrong: a very small thing could slip through.
- A drag counts from the stage's position when the finger went down, so a line above wrapping mid-drag cannot move it.
- CI stops the journeys after 15 failures and a browser job after 30 minutes, so one bad cause cannot hold the runners.
- The Firefox clipboard journey accepts either "copied" or the selected box (Firefox allows the write).

**Deferred minors:**
- The "game can't be opened" screen still shows the first-run strip (the plan says none).
- `Choice` radio groups get their group name from `Math.random`; harmless but not deterministic.
- The hide of the first-run strip is stored on the device only.
- The waiting-change screen has two Back buttons (the screen's and the level header's).
- The screens' pictures are of the window, not the whole scrolling area.

### Stage 6 finished (2026-11-14)

Branch `claude/project-thread-fyyxqk`, one pull request, with a small one in AutomataFramework for S7. Nothing was run
locally (project rule); CI is the check, and the level pictures on `ci-screens` are the thing to read afterwards: the
crate must be drawn inside its ring.

| Finding | What was done |
|---|---|
| B1 | `Levels.svelte`'s effect reads its state before the optional calls, so the picture redraws after every move, selection and resize. The canvas keeps its drawing buffer so a test can read it. Pixel checks in `levels.browser.test.ts` (after a drag, after arrows and Undo, after turning the box, the white ring) and in the move-the-crate journey (crate at the new place, sky where it was, in every engine). |
| S1 | `Repo.commitTime` (one call, only when checks say `none`); the two minutes run from the newest of the head commit and the pull. The pretend GitHub stamps each commit. Test: an old pull with a new commit is `not-ready`, with that commit three minutes old it goes in. |
| S2 | `swapTokens` answers the tokens or the problem; `renew()` says `renewed`, `refused`, `busy` or `offline`. Only `refused` forgets the sign-in; the call then answers `busy` or `offline`. Tests in `session`, `api`, and a journey (GitHub cannot be asked, then Try again). |
| S3 | The strip shows only on Welcome, the list, and a game or level that opened (or is still opening). Waiting changes, one change and Share carry no strip. `GameHome` and `LevelScreen` tell `App` whether the game opened. |
| S4 | A level shown read only has no header at all; the screens check fails a screen with two buttons named Back. |
| S5 | New words `changeGone`; a gone change (opening it or pressing Approve) says so with one Back to the game's page. A game that could not be opened follows `GameHome`'s words. |
| S6, M1, M8 | `docs/teams.md`: the branch rule as a setup step with merge commits on, organisations, own changes by level, check runs. `mergeable: null` is looked at once more (1.2 s), then `busy`. `CLAUDE.md` names everything the device may keep. A docs test reads each. |
| S7 | AutomataFramework pull request 27. |
| S8 | Both first-run checks restored (see rulings). |
| S9 | The approve tip counts waiting changes that are not yours. |
| S10 | A list that cannot be fetched says so with a primary Try again, never "add the editor". The guide hears nothing from it until it knows. |
| M2, M3, M6, M7 | One Sign in on a game a visitor cannot open; Share and the level's loading screen use the game's own name once known; a change with no level in it says `changeOther`; "saved once, and how" lives in `af.saved`, so a reload still says "You did it". |
| M4, M5, M9 | Left for the restyle, as the audit says. |
| M10 | The B1 pixel checks are the pixel check the screens check lacked. |

**Rulings I made:**
- The canvas keeps its drawing buffer (`preserveDrawingBuffer`), so a test or a screenshot can read what was drawn. Cost if wrong: a little memory on a small canvas.
- "At every step exactly one primary button, 48 px, strip on screen" is restored as: at most one primary at every step, exactly one where the next thing to press is a button (Welcome, Add the editor, Save), and the strip on screen without scrolling at every step. At the list and the game's page the next thing is a row to touch, so there is no primary button. Cost if wrong: none for users.
- `af.saved` now keeps `direct` or `suggestion` (an old `1` reads as direct), so the strip's last line is right after a reload. A returning person who saved once sees "You did it" on every screen until they hide the tips. Cost if wrong: the tips say "done" a little early.
- The Share screen and the level's loading screen use the game's own name only after it is known (Share opens the game itself; the level's loading screen uses what the game's page already learned).

### Waiting on the Owner

Nothing is waiting. The plan audit's Q1 and Q2 were answered: organisation admins count as Owners, and Edit and Owner
levels can approve their own changes. The visual direction (Blueprint, in the private notes) is not applied here yet;
no screen is restyled until the Owner says so. The accounts the real iPad check needs (Cloudflare, the GitHub App)
are in the plan's "Before starting".

### Log

- 2026-11-14: `commit-authors` (the plan W audit, AutomataFramework PR 100): the check also fails the "by" form of the credit line and its italic footer, and "created", "made", "written" or "authored" with or by it. The script and its test are the framework's, line for line. No Owner question.
- 2026-11-14: Cycle 2, Stage 3. The plan audit of the restyle plan: four blocking findings, eleven should-fix and
  eleven notes, all written into the plan; one question for the Owner (Share on the level screen). No tests run.
- 2026-11-14: Cycle 2, Stage 2. The restyle plan written: nine tasks, the Owner's answer on the name, the audit's M4,
  M5 and M9 placed. Nothing run but an install and a build in a throwaway copy.
- 2026-11-14: Stage 6. B1, S1 to S10 and the cheap minors applied, with the tests the audit asked for; S7 is AutomataFramework pull request 27. Nothing run locally.
- 2026-11-14: Stage 5. The implementation audit of pull request 4: one blocking finding, B1, the level's picture
  is drawn once and never again (the effect that redraws it records no dependencies), so a dragged crate's button moves
  but the crate on screen does not, in all three engines; the tests read only the buttons. Ten should-fix (checks timed
  from the pull, not the commit; a blip while renewing signs the person out; the first-run strip on seven screens it
  does not fit; two Back buttons; a gone change called a missing game; four gaps in `docs/teams.md`; the spec's "nobody
  approves their own"; two first-run journeys narrowed; the approve tip counting your own change; the games list
  offline), ten minors, and the build's rulings and deferred minors reviewed. No Owner questions. No tests run.
- 2026-11-13: Stage 3. The plan audit: not ready as written. Seven blocking findings: two from the Owner's answers
  the same day (visitors open only the demo game; "Keep a copy" gives the level's JSON to paste back, on the
  clipboard as well as a file), and five that would stop a task or fail on the real GitHub (the rule tests' double
  violation, the door refusing same-origin GETs, `userExists` with the App's JWT, journeys that cannot reach a
  pretend GitHub started in global setup, and the merge answers 405 and 409). Fourteen should-fix, twelve notes, two
  Owner questions. GitHub's calls were checked against GitHub's own API description, read from
  raw.githubusercontent.com; the Function bundle was measured at 181 KB (Vite) and 495 KB (esbuild), with no Rapier
  or Pixi. Execution applies the findings.
- 2026-11-13: Stage 2, added to after the first plan merged. The Owner: agents working on the code are the primary
  way a game is made, and the editors change authorable content only (the JSON files); anyone can use the editor
  freely without signing in and keep a copy, and saving or working with others needs a sign-in. The plan is now 21
  tasks: the API lets a visitor read a public game, the page asks for sign-in only when it is needed, and a new
  Task 18 adds "Try it now", "Keep a copy" and the visitor's journeys. The plan audit reads this version.
- 2026-11-13: Stage 2. The Editors' M1 plan written: 20 tasks. The Owner's decisions the same day widened M1 for this
  repo: the editors are for teams; every access level (Look, Suggest, Approve, Edit, Owner) with a Share screen;
  the editor's own GitHub App does the GitHub work through an API on Cloudflare Pages Functions, so people need
  GitHub only to sign in; levels live in `automata.access.toml` in the game's repo; onboarding is its own task.
  This pull request also adds `CLAUDE.md` and this tracker. The framework is pinned to `ec4fddd` (the commit that
  added its `prepare` script). Nothing is published to npm in M1. Not checked: the GitHub calls are written from
  memory, because the planning session's network refused GitHub's documentation; the plan audit should check them.
