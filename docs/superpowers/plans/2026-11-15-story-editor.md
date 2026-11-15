# The Story Editor (2D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (project rule). Tests run only in GitHub-hosted CI:
> "run" in a step means push and read the pull request's checks with `gh pr checks <number> --watch`.

**Goal:** A team changes its game's story by touch: a conversation as a map of cards, a cutscene staged on the level's
real art over a timeline, and every word a player reads in the game's six languages, saved so the game's own checks
never go red.

**Architecture:** One new page feature, `story`, between `levels` and `find`. Everything a person changes is a pure
function over the framework's own files (`ConversationFile`, `CutsceneFile`, `MessagesFile`, `Character`, `ReadMarks`),
kept in one `StoryEdit` with undo, and written with `writeContent` and `writeReadMarks`. One save is one change of
several files, made through the editors' one shared save (the figure builder's `saveChange`); a save that leaves words missing becomes a waiting change that anyone
may add words to, and it goes in when every word is there. The screens sit in the redesign's `Frame` and reuse its
`Stage`, panels, find bar, stamps and tips. The framework draws the level and the speech box; the editor never
re-implements what the game does.

**Tech stack:** Svelte 5, strict TypeScript, Vite 8, Vitest 5 (Node, three browser engines, journeys with Playwright),
`@automataframework/framework` pinned by commit, Cloudflare Pages Functions for `/api`. **No new dependency.**

**Spec:** [`docs/superpowers/specs/2026-11-15-story-editor-design.md`](../specs/2026-11-15-story-editor-design.md)
(principles 1 and 2). It builds on
[`2026-11-14-editors-blueprint-redesign-design.md`](../specs/2026-11-14-editors-blueprint-redesign-design.md) and its
plan, [`2026-11-14-editors-blueprint-redesign.md`](2026-11-14-editors-blueprint-redesign.md) ("the redesign plan"
below, with its zoom amendment). The framework's story is plan T,
[`2026-11-14-m2-story.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/plans/2026-11-14-m2-story.md).

## Before anything is built (the gates)

> **Amended after the plan audit** ([`audits/2026-11-15-story-editor-plan-audit.md`](../audits/2026-11-15-story-editor-plan-audit.md)).
> Every finding of its last table is written in below, each where its task is, tagged with the audit's number (C1,
> I4, M5 and so on) so a builder can trace it. The Owner answered its one question (I5: the App finishes a complete
> words change itself). Where this plan and the audit differ, this plan holds.

No task below starts until its gate is open. A closed gate is reported to the coordinator, never worked round.

| Gate | What must be true | Holds |
|---|---|---|
| G1 | **The Owner has approved the mockups of all editors** (the Owner, 2026-11-15: mockups first). If the approved Story mockup differs from this plan's screens, this plan gets a short amendment and its audit first | Tasks 2 to 24 (everything in this repo) |
| G2 | This plan's audit (stage 3) is merged | every task |
| G3 | Framework plan T is on AutomataFramework's `main` (pull request 64) through its Task 10: `name` and `conversation` on a character, `cutscene` on a step, `opens` on a cutscene, `openAt`, `nextPlace`, `choosePlace`, `cameraAt`, `actorsAt`, `linesAt`, and the page's `story` feature; and its `wordsOf` falls back to the game's own language, never to English (plan W; audit M4), else Task 1 reports it | Task 1 on |
| G3b | Plan T's Task 11 (the cutscene's camera through `Renderer.look`, after plan A) is on `main`, so the shot a camera key gives is the framework's (audit I2) | Tasks 15 to 17 |
| G4 | The redesign's build is on this repo's `main` through its Task 18 (the frame, the find bar, faces, nine languages, zoom, the scenes) | Task 7 on (Tasks 2 to 6 touch no screen and need only G1 to G3) |
| G5 | The redesign's Task 19 (Play) is on `main` | Task 17's "Try it in the game" only |
| G6 | The framework's content folders (framework plan M, AutomataFramework pull request 118: `FolderRef`, `Project.folders` and `withFolders` in `content/project-write.ts`) are on `main` and on the pin | "Add a conversation", "Add a cutscene" and their set-up, and the folder rules of Tasks 5 and 6 (ruling 6; audit C2) |
| G7 | The figure builder's save of several files (its plan G's Task 2: `ChangeAsk`, `ChangeFile`, `ChangeAnswer`, `service/change.ts` and its route, `Repo.saveFiles`, the page's `saveChange`, and the shared `allowedPaths` in `service/changed.ts`) is on `main`, **or** Story is the first editor to build it, and then Tasks 4 to 6 build it under exactly those names and plan G's Task 2 widens it (audit I12; the coordinator, 2026-11-15: one save, whichever editor is first) | Tasks 4 to 6 |

The framework stays ahead of the editors (the Owner, 2026-11-14): Task 1 is framework work and may start when G2
and G3 are open, before G1.

## Global Constraints

- **Identity.** Before every commit: `git config --global user.name "McThayDT" && git config --global user.email
  "107786093+mcthaydt@users.noreply.github.com"`, and the local hook that refuses any other author or committer. No
  Claude attribution anywhere. Pull request bodies start with the project's two attribution lines and credit
  "Requested by **McThayDT**". Never force-push.
- **Nothing runs locally** (the Owner, 2026-11-14): no tests, format, lint, typecheck, knip, build or generator. A
  step that needs a generated file (`docs/commands.md`, the framework's API report) writes it by hand and the check
  says if it differs. That includes the lockfile: a pin's checksum is worked out from the downloaded tarball, as
  the redesign's Task 7b did (audit M1).
- **Branches.** `main` plus at most five with CI running. Each pull request below is one branch, a draft, merged by
  the merge session before the next starts.
- **Everything in the redesign plan's Global Constraints holds**: the header, the five sizes (`phone` 390 × 844,
  `phoneSideways` 844 × 390, `ipadUpright` 820 × 1180, `ipadSideways` 1180 × 820, `desktop` 1440 × 900), touch (44 px
  pressed, 48 a main button, 56 a tool), the six colors named only in `ui.css`, type sizes (sentences 18 px, labels
  13, numbers 15), panels, motion, and "the canvas draws the game and nothing else".
- **Words.** Every word a person reads is in `src/features/words/`, in all nine languages (`zh`, `es`, `en`, `pt`,
  `ru`, `ja`, `ko`, `de`, `fr`), plain, with no "repo", "commit", "branch", "pull request" or "token" (and the rest of
  `tests/fixtures/banned.ts`). A person never sees a message key as the way to do something, a tick count, or a
  step's id other than as a small label. Appendix A is the English.
- **The game's words are the game's six**, in the framework's order: `zh`, `es`, `en`, `pt`, `ja`, `ko`
  (`LANGUAGES`). Story never shows `ru`, `de` or `fr` as a game language, never adds a language, and never fills one
  language with another's words. `'en'` is never a fallback in code.
- **An editor changes only content files**, with two narrow exceptions, each written only as named here:
  `automata.translations.toml` through the framework's `markRead` and `writeReadMarks` (the Owner, Q2b); and the
  folder entries in `automata.toml`, written once with the framework's `withFolders`, when a game is set up for
  conversations or cutscenes (ruling 6). The editor writes no `automata.toml` byte of its own (audit C2).
- **Same bytes as an agent.** Every file is written by `writeContent` (or `writeReadMarks`). The page works the
  bytes out to show and export them; the API writes its own from the values and trusts nothing the page says.
- **The device keeps** only what `CLAUDE.md` lists: Story adds `af.tip.story` (under `af.tip.*`) and its draft
  `af.draft:<owner>/<name>:story` (under `af.draft:…`), and `timeline` to the names in `af.panels`.
- **The editors never run a game's code.** Try it, Play and the previews use only the framework's built-in play of
  the content.
- **Every task has end-to-end journeys**, at all five sizes in Chromium, WebKit and Firefox, against the pretend
  GitHub. A screen-changing pull request ends with the redesign plan's "Review pictures" (one artifact, five
  pictures a screen, in the order Phone landscape, Phone portrait, Tablet portrait, Tablet landscape, Desktop
  landscape, saying plainly whether they show the final look).
- **Reporting.** One line per task to the coordinator (the commit, the test count, surprises); each deviation with
  its reason; a handoff at 90 minutes.
- **Stop rules.** Stop and report at once on: a failing check you cannot explain in one sentence; the third fix for
  the same failure; a need for a dependency or a workflow change; an `engines` job over 25 minutes; a name this plan
  takes from the redesign or from plan T that is not on `main` as written here; any Owner question. Never default on
  an Owner question.

## Rulings made by this plan

The spec leaves these to the builder. The plan audit may challenge each.

1. **Where Story lives.** One feature, `story`, after `levels` and before `find` in `LAYERS` and `PAGE_SIDE`. `find`
   gains Story's commands; `suite` gains `StoryScreen`. Story imports `levels` for `Stage`, the level picture, the
   view functions, the notes and the character picture, and changes none of them (the spec: "does not change World").
2. **The framework asks are one small pull request** (Task 1): the speech box (`createBox`, `BoxState`, `BoxWords`,
   `StoryBox`) on the page entry, and the walk of a conversation (`TalkPlace`, `openAt`, `nextPlace`, `choosePlace`)
   on the headless entry, which plan T's Task 13 leaves private (audit I1), so the card's preview and Try it show
   the framework's own box and walk; the key rule in the framework's content skill (audit I3); and the box's keys
   heard only inside its mount (audit I9). The spec's other ask, a cutscene's state at a tick, is plan T's
   `cameraAt`, `actorsAt` and `linesAt`, and the part of the level a camera key shows is the framework's own shot
   function from plan T's Task 11 (gate G3b; audit I2): the editor never works out the frame itself. The stage
   draws through the level picture's `show(level)` with a copy of the level in which each actor stands where
   `actorsAt` says. An actor's clip and facing are shown as words on its chip (the spec's "fields only"), not drawn.
3. **The map is laid out by rule** (Task 10), from the file and the measured sizes of its cards and chips: columns
   by the fewest presses from the start, rows in the order steps are met, every line square-cornered in a lane of
   its own (the spec says a line going back "curves round"; either holds if no line crosses a card, and the approved
   mockup settles the corners under G1; audit M8). Nothing about a place is saved.
4. **Several files, one change, through the one shared save** (Tasks 4 and 5; audit I12): Story saves with the
   figure builder's `saveChange` and its route (gate G7), widened only where Story needs more (`into`, the words
   routing, the read marks, Story's character rule). One commit through GitHub's git data calls (a tree, a commit, a
   move of the branch that is refused if the branch moved). Each file's version is checked first, on the branch the
   change goes to.
5. **Waiting for words** (Tasks 5, 6, 21). Whether a change waits for words is never stored: it is worked out, each
   time, from the game's files as the change leaves them (`missingWords`). A waiting change lives on its starter's
   own branch, as every waiting change does; anyone who may save may add words to it, and only messages files and
   the read marks may be added that way. It **goes in by itself** when every word is there, the checks on its newest
   commit pass, and **everyone whose commit is on it may save straight in**: its starter and each later commit's
   author, each worked out afresh from the sharing file on the default branch (audit C1: otherwise a Suggest-level
   person could add words to an Owner's change and have them go in unapproved). A change with a commit by anyone
   else needs approval, and the page says so. For an organization's game a person who is an Owner only through
   GitHub counts as needing approval, because their own sign-in is not there to ask GitHub with; once the words are
   there they may approve it themselves (the audit's Q-B, accepted). **The App finishes it itself** (the Owner,
   2026-11-15, the audit's I5, answer A): GitHub's `check_suite` event reaches a new route, `POST /api/github-hook`,
   which runs `finish`'s rules for the waiting change whose head that is (Task 6). The page's `finish` after the
   save that completes the words (tried again at 5, 10, 20 and 40 seconds while the screen is open), and on the
   game's page and the waiting list, stays as the fallback for a lost delivery. An agent that fills the words
   through the ordinary pull request sees it go in when its checks pass. A change that needs approval then waits as
   today, and Approve refuses a change that still lacks words. **A change that clashes with `main`** (audit I6) is
   brought up to date by the words' own merge (Task 6): a messages file is key to text, so the change's keys are laid
   over `main`'s file and committed to its branch, and its checks run again; only a key both sides changed is shown
   to a person. **A person's one waiting change holds all their saves** (`saveLevel` puts every save of someone with a
   waiting change on it), so an Owner's World saves made while their words change waits join it; World's stamp then
   says so (Task 21; audit I8).
   **A waiting change for words has failing checks until the words are there**: that is the game's own check
   doing its job on a branch, and the editor says "Waiting for words", never "the checks failed", for it.
6. **Each kind's folder is listed once, and new files in it just work** (audit C2) (the Owner's one rule across editors,
   2026-11-15, as Feel and Sound do it through the framework's content folders: a `[[content]]` block with a `type`
   and a `folder`). A new conversation or cutscene is a new file in the game's folder for that kind, and the save
   writes nothing else. A game that does not list the folder yet shows `storySetUpTalks` or `storySetUpScenes` in
   place of the Add card: one press, and the next save also adds that one folder entry (`content/conversations` or
   `content/cutscenes`), its bytes the framework's `withFolders(text, refs)` and nothing else, so an agent's command
   writes the same file. If Sound's or Feel's build has put this set-up on `main` first (the shared save's `setUp`
   field), Story uses theirs and Task 5 adds only the two kinds. **Gate G6:** the framework's content folders are
   on the pin; until then the two Add cards and the set-up are not built (Tasks 12 and 17 say so), and nothing
   else waits. Story never removes a conversation or a cutscene file (an agent does; nothing in the spec asks for
   it).
7. **New lines start in the game's own words.** The framework refuses a line whose key the game's own language
   (`source`) lacks, and a game that will not load cannot be opened from its own waiting change. So "Add a line",
   "Add a step", a new choice and a new cutscene line are written in the game's own language: with the map showing
   another language, pressing one asks `storyOwnFirst` with one main button that shows the game's own words. Changing
   an existing line writes whichever language the map shows. (The audit's Q-A: accepted, since the framework forces
   it.)
8. **A word used in two places** is one row in Words, under the first group that uses it, with a chip
   `wordsUsedIn(n)` that lists the places. In a card, typing into a line whose key something else also uses first
   gives the line a key of its own (in every language that had the old one), so a change in one place never
   changes another unseen.
9. **A language the game has no file for** (or a game with no words at all) cannot be mended by an editor, which may
   not list a new file of words. Words shows that column as `wordsNoFile(language)`; such a language never makes a
   save wait (the game's check already fails for it and no word typed here can fix it), and never blocks one: the
   save checks only the problems a change adds (audit I11, Task 5). A game with no words at all opens Story's page
   with `storyNoWords`.
10. **Names.** A conversation or a cutscene has only an id; its name in words is the redesign's `nameOf(id)`. A new
    one asks for its name once and makes the id from it (`fileId`); the name cannot be changed afterwards.
11. **Export** copies one block of text for an agent: for each file the change touches, a line `=== <path> ===`
    then the file's bytes, in the order of Task 7's `touched`. "Save it as a file" gives that one file when there is
    one, else a zip of them at their paths (`src/lib/zip.ts`, stored without compression: no dependency).
12. **Words groups**, in this order: each conversation by name, each cutscene by name, `wordsNames` (characters'
    shown names), `wordsLevels` (`level.<id>.name`), `wordsButtons` (`controls.…`), `wordsRest`.
13. **"Changed" and "who read it" come from the game's history**, not from anything kept: one GitHub blame over the
    six messages files and the marks file (`GET /api/words-history`) says who last changed each line and when. A
    translated cell is Changed when the game's own line is newer than it (or was changed in this unsaved edit). A
    tick shows the face of whoever wrote its line in the marks file.
14. **The Words part scrolls, it does not pinch.** It is a table of text: one finger scrolls it inside the frame (a
    declared scroll region), and the device's own text size applies. The zoom buttons are not shown there.
15. **The timeline** is one more closable part (`PanelName` gains `timeline`). On `wide` it floats along the bottom;
    on `mid` and `narrow` it is a `Sheet` that rests pulled down to one line holding every key as a diamond, the
    playhead and Play, and pulls up to its rows, which scroll inside it (three rows show on `phoneSideways`).
16. **Two fingers on the cutscene's stage** zoom and move the level, as in World, except inside the camera's frame
    while the frame is picked: there they zoom the camera. The frame's own − and + always work.
17. **"The last thing opened"** is remembered for this visit only (the page's own state), so no new device setting:
    after a reload, Story opens the game's first conversation, else its first cutscene, else Story's page. **A
    deviation from the spec**, which said "on this device" (audit M6): the spec's own reason, no new device setting,
    holds, and the address keeps the part through a reload.
18. **Trying a cutscene in the game** plays a copy of the content, in memory only, in which this cutscene has
    `opens` and no other cutscene of its level does.
19. **Every Story word in nine languages is written by the building session** and read by the drunk-grandma audit,
    as the redesign's ruling 9 says. No native speaker has read them.

**The plan audit's answers:** **Q-A** (ruling 7, new lines in the game's own words only) and **Q-B** (ruling 5, an
Owner only through GitHub needs approval) are both accepted.

## Review Focus

Inputs the spec implies and a person will meet. Each has its test in the task named.

1. **A game with no words, or with a language's file missing:** Story opens, says so in one sentence, offers no
   dead button and throws nothing. Tasks 8 and 18 (`plain-game`; a game whose `ko.json` is not listed).
2. **Words the id rules cannot hold** (a first line in Japanese, an emoji, 200 characters, the same words twice):
   the step is `step-1`, the key is the next free one, nothing is longer than the format allows. Task 7
   (`keys.test.ts`).
3. **A conversation at the format's limits** (128 steps, 8 lines, 4 choices, a choice that points at its own card,
   two steps that point at each other): the map has no overlap, no line crosses a card, and the Add buttons say why
   at the limit. Tasks 9 and 10.
4. **Two people adding words to the same waiting change at once:** the second sees "changed elsewhere", keeps
   every word they typed, and after "Show the newest" theirs are laid over the new files. Tasks 6 and 21.
5. **Pasted and composed text:** a paste of 5,000 characters, a paste that deletes `{count}`, a Korean word typed
   through an input method, a text that is only spaces. The braces survive, the framework's sentence shows, Save is
   refused before anything is sent. Task 19.

---

## File structure

Layers, lowest first: `words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`,
`levels`, **`story`**, `find`, `suite`.

```
src/lib/blob-sha.ts          git's blob sha of a text (the version a new file will have)        Task 4
src/lib/zip.ts               a stored zip of a few text files                                   Task 7
src/features/wire/
  wire.ts                    plan G's ChangeAsk, ChangeFile, ChangeAnswer widened (into, setUp,
                             read-marks, how 'words', missing, goesIn); MissingWords, WordsHistory,
                             Waiting.words, Waiting.goesIn, 'words-missing'                     Task 5, 6
  missing.ts                 missingWords, otherWordProblems, addedProblems                     Task 5
  project-line.ts            folderOf, newFilePath, onlyListsFolders (bytes: the framework's withFolders) Task 5
src/features/github/repo.ts  plan G's saveFiles (with audit I4's rules), lineHistory, pullAuthors Task 4
src/features/service/
  change.ts, changed.ts      plan G's save and allowedPaths, widened for Story's kinds          Task 5
  words-left.ts              what a waiting change still lacks; whether it goes in              Task 6
  ready.ts                   the checks Approve and Finish share (lifted from approve.ts)       Task 6
  words-merge.ts             a words change brought up to date with main, key by key           Task 6
  finish.ts                  POST /api/finish                                                   Task 6
  hook.ts                    POST /api/github-hook: the App hears check_suite and finishes      Task 6
  words-history.ts           GET /api/words-history                                             Task 6
  open.ts, approve.ts, waiting.ts, pulls.ts, service.ts                                         changed
src/features/api/api.ts      the shared change call, finish, wordsHistory, open(ref, change?)   Task 5, 6
src/features/game/open.ts    OpenGame.marks, openGame(api, ref, change?)                        Task 5
src/features/game/change.ts  plan G's saveChange, used by Story                                 Task 7
src/features/story/
  story.ts                   the entry                                                          Task 7
  files.ts                   StoryFiles, storyFilesOf, contentWith                              Task 7
  change.ts                  StoryEdit, apply, undo, redo, touched, describeStory, checkStory   Task 7
  keys.ts                    slugOf, fileId, stepId, lineKey, choiceKey, cutsceneLineKey        Task 7
  game-words.ts              textOf, setText, removeKey, usesOf, shownLanguage                  Task 7
  save.ts, copy.ts, draft.ts saveStory, storyCopy, keepStoryDraft …                             Task 7
  StoryPage.svelte           Story's page: the cards                                            Task 8
  conversation-edit.ts       every change a conversation can take                               Task 9
  map.ts                     layoutMap: boxes and routes                                        Task 10
  map-view.ts                the map's zoom and place, over levels/view.ts                      Task 11
  ConversationMap.svelte, StepCard.svelte, MapLines.svelte                                      Task 11
  StepPanel.svelte, ConversationPanel.svelte, AddStep (in ConversationMap)                      Task 12
  SpeechPreview.svelte, TryIt.svelte, talk-play.ts                                              Task 13
  cutscene-edit.ts, timeline.ts                                                                 Task 14
  stage-level.ts, CutsceneStage.svelte, CameraFrame.svelte                                      Task 15
  Timeline.svelte, KeyCard.svelte, CutscenePanel.svelte, cutscene-play.ts                       Task 16
  NewCutscene.svelte, TryInGame.svelte                                                          Task 17
  words-table.ts             rows, groups, cell states, filters                                 Task 18
  WordsTable.svelte, WordCell.svelte, braces.ts                                                 Task 19
  marks.ts                   isRead, tick, untick, whoRead                                      Task 20
  change-words.ts            changeLines, onlyOldGaps: a Story change in plain lines            Task 21
  guide.ts                   Story's first run                                                  Task 22
src/features/find/commands.ts                Story's command kinds                              Task 23
src/features/suite/StoryScreen.svelte        the frame round Story; Save, Export, stamps        Task 8, 21
src/features/suite/route.ts, App.svelte, Switcher.svelte, WaitingChange.svelte, GameHome.svelte changed
src/features/suite/LevelScreen.svelte        World's stamp line for a change waiting for words (I8) Task 21
tests/fixtures/game/         a keeper, a conversation, a cutscene, six messages files, marks    Task 3
tests/fixtures/fake-github/  git data calls, blame, the `story-gaps` and `no-korean` games      Task 3, 4
tests/features/story/, tests/journeys/story-*.journey.test.ts, tests/fixtures/story-scenes.ts
```

Test hooks, added to the redesign's: `[data-step="<id>"]` on a card (with `data-start`, `data-end`, `data-faded`,
`data-problem`); `[data-line-to="<from>:<n>"]` on a line's chip and `[data-line-end]` on its draggable end;
`[data-map]` with `data-scale`; `[data-row="camera|words|<who>"]`, `[data-key="<row>:<n>"]` with `data-at` (ticks),
`[data-playhead]` with `data-at`; `[data-camera]` on the frame; `[data-cell="<key>:<language>"]` with
`data-state="missing|changed|read|unread"`; `[data-filter="missing|unread|changed|all"]`;
`[data-part="timeline|words|story-page|try"]`; `[data-tool="step|try|move|key|erase|play"]`.

---

## Pull request 1 (in AutomataFramework): the speech box on its own

### Task 1: The speech box and a conversation's walk on the public surface, and the key rule

**Files:**
- Modify: `src/features/story/story.ts` (re-export from `./box.ts`), `src/headless.ts` (or the entry that re-exports
  `level/talk.ts`), `skills/automata-content/SKILL.md` (the "conversation" and "cutscene" sections),
  `README.md` (one paragraph under "Story"), `docs/api/framework.api.md` (taken from the `package` job's log, as plan
  T's Task 13 does; audit M2), and a changeset, `.changeset/story-box.md`, `patch` (the repo has `.changeset/`, as
  pull request 102's `level-picture-view.md` shows; audit M2)
- Modify only if Step 1's key test fails: `src/features/story/box.ts` (its `keydown` listener on the mount, not the
  window; audit I9)
- Test: `tests/public-surface.test.ts`, `tests/features/story/box.browser.test.ts`, `tests/docs/readme.test.ts`,
  the skill's docs test

**Interfaces:**
- Produces, from `@automataframework/framework`: `createBox`, `type BoxState`, `type BoxWords`, `type StoryBox`,
  with plan T's Task 9 signature unchanged: `createBox(mount, on: { next(): void; choose(choice: number): void;
  skip(): void }, words: BoxWords, options?: { readonly watching?: boolean }): StoryBox` (`words` stays required; the
  editor passes the framework's own `BoxWords` for the shown language, else its defaults; audit M3).
- Produces, from `@automataframework/framework/headless` (audit I1): `type TalkPlace`, `openAt`, `nextPlace`,
  `choosePlace`, exactly as plan T's `level/talk.ts` made them.
- From plan T's Task 11 (gate G3b, audit I2): the pure function its `Renderer.look` uses to turn a camera key into
  the part of the level shown at a window's shape, on the headless entry under the name Task 11 gives it (written
  here as `shotOf(level, camera, window)`); if Task 11 kept it private, this task exports it. Task 15 consumes it.
- The skill states the key rule (audit I3), the same one `keys.ts` (Task 7) follows: a line is
  `<file>.<step>.<n>`, a choice `<file>.<step>.choice-<n>`, a cutscene's line `<cutscene>.line-<n>`, the next free
  number when one is taken; a step's id is made from its first words (at most 32 characters, starting with a
  letter, `step-<n>` when none); a key is at most 96 characters, the step's part cut to fit.

- [ ] **Step 1: Failing tests.** `public-surface.test.ts` lists the eight names (and the shot function, once G3b is
      open). `box.browser.test.ts`, imported from `#src/index.ts`: "the box shows a step with no sim: `show({
      speaker: 'Keeper', text: 'Hello there!', choices: [], next: true, skip: false })` then Enter calls `on.next`
      once"; "with `watching` there are no buttons"; **"keys pressed outside the mount reach nothing"**: with a
      text box beside the mount focused, typing Enter and `1` calls no `on` function, and with the mount `inert`
      a key event dispatched at the window calls none (audit I9). `readme.test.ts`: the "Story" section names
      `createBox`. The skill's docs test: the "conversation" section holds the key rule and its example uses
      `keeper.hello.1` and `keeper.hello.choice-1`.
- [ ] **Steps 2 to 4:** push, red; export, write the rule, and scope the box's keys if the test says so (a behaviour
      change, named in the commit); push, green in four engines; the API report from the log matches.
- [ ] **Step 5:** Commit `feat(story): the speech box and a conversation's walk on the public surface`. Report the
      merge commit (Task 2 pins it) and whether the box's keys had to move.

---

## Pull request 2: the pin

### Task 2: Move the framework pin to Task 1's merge commit

**Files:** `package.json` (the dependency and the matching `pnpm.onlyBuiltDependencies` line), `pnpm-lock.yaml`;
whatever no longer compiles, and nothing else. Test: `tests/workflows/package.test.ts`.

- [ ] **Step 1:** Change the three places; the lockfile's checksum worked out from the downloaded tarball, as the
      redesign's Task 7b did (nothing runs locally; audit M1). Check what G3 asks of plan T's `wordsOf` (audit M4)
      and the folder names G6 needs, and report any that differs. **Step 2:** Push; fix only what the new framework broke. **Step 3:** Commit
      `chore: pin the framework to <short sha> (story)`. Report what broke, if anything.

---

## Pull request 3: several files in one save

### Task 3: The test game gets a story

**Files:**
- Create in `tests/fixtures/game/`: `content/characters/keeper.json` (static body, `name: "keeper.name"`,
  `conversation: "keeper"`, the hero's figure unless the pin's checks want its own, then a copy named `keeper`),
  `content/conversations/keeper.json`, `content/cutscenes/door-opens.json`, `content/messages/{zh,es,en,pt,ja,ko}.json`,
  `automata.translations.toml`
- Modify: `tests/fixtures/game/automata.toml` (`source = "en"` and the new entries),
  `content/levels/level-1.json` (a thing `keeper-1`), `tests/fixtures/game/read.ts`,
  `tests/fixtures/fake-github/repos.ts`, `tests/fixtures/game.test.ts`

The conversation `keeper`, start `hello`:

| Step | Speaker | Lines | Then |
|---|---|---|---|
| `hello` | keeper | `keeper.hello.1` "Hello there!", `keeper.hello.2` "Lovely day." | choices `keeper.hello.choice-1` "What's that door?" to `door`; `keeper.hello.choice-2` "Bye!" to `bye` |
| `door` | keeper | `keeper.door.1` "The door opens if you push the crate onto the button." | `next: bye` |
| `bye` | keeper | `keeper.bye.1` "Good luck!" | ends, `cutscene: door-opens` |

The cutscene `door-opens`: level `level-1`, length 300; camera keys at 0 (the level's middle, zoom 1, `cut`) and 120
(over the crate, zoom 1.5, `smooth`); actors `keeper-1` at 0 (where the level has it) and `player-1` at 60 and 180
(two tiles apart); one line from 60 until 180, `door-opens.line-1` "The door is open!", speaker `keeper`. Other
words: `keeper.name` "Keeper", `level.level-1.name` "Level 1", `controls.jump` "Jump". Every language has every
key, in that language. The marks file has `keeper.hello.1` read in Korean, made with `markRead`.

Two more pretend games, built from the same files in `repos.ts`: **`story-gaps`** (Korean lacks `keeper.bye.1`;
Japanese lacks `keeper.door.1` and `door-opens.line-1`) and **`no-korean`** (no `ko.json` and no entry for it).
`plain-game` stays the game with no words.

- [ ] **Step 1: Failing test** in `game.test.ts`: the fixture loads; `translationProblems` is empty for it, names
      three words for `story-gaps` and one file for `no-korean`; every content file, read and written back with
      `writeContent`, is its own bytes (a file that is not fails here, before any editor writes one); the marks
      file equals `writeReadMarks(parseReadMarks(text).value)`.
- [ ] **Steps 2 to 4:** red, write the files, green. Existing journeys still pass with the keeper in the level
      (update a picture's expectation only where the keeper stands in it, and say so in the commit).
- [ ] **Step 5:** Commit `test: the test game has a keeper, a conversation, a cutscene and six languages`.

### Task 4: One commit of several files, and who changed each line

**This is the figure builder's `Repo.saveFiles`** (gate G7; audit I12). If plan G's Task 2 is on `main`, this task
adds only `lineHistory`, `pullAuthors` and the rules below that plan G's lacks; if Story is first, it builds
`saveFiles` under plan G's name and shape (plan G's files may also carry a PNG as `base64`; Story sends text only),
and plan G's Task 2 widens it. Either way there is one `saveFiles`.

**Files:**
- Create: `src/lib/blob-sha.ts` (only if `saveFiles` does not already give each new file's version)
- Modify: `src/features/github/repo.ts`, `tests/fixtures/fake-github/server.ts`, `repos.ts`
- Test: `tests/lib/blob-sha.test.ts`, `tests/features/github/repo.test.ts`, `tests/fixtures/fake-github/server.test.ts`

**Interfaces:**
- Produces:

```ts
// lib/blob-sha.ts: git's own sha of a file's bytes, by WebCrypto: sha1 of "blob <n>\0" then the bytes, where the
// text is UTF-8 and <n> is its length in bytes, not in characters (audit M5)
export function blobSha(text: string): Promise<string>
// repo.ts, on Repo
/** One commit that writes several files. Each `version` is checked against the branch first (undefined: the file
 *  must not be there). A file that moved on, or a branch that moved while this ran, is 'changed-elsewhere', and
 *  nothing is written. */
saveFiles(save: {
  branch: string
  files: readonly { path: string; text: string; version: string | undefined }[]
  message: string
  author: Author
}): Promise<Answer<{ commit: string; versions: Readonly<Record<string, string>> }>>
/** Who last changed each line of each file, and when (milliseconds): one GraphQL call with a `blame` per path.
 *  A path the branch does not have gives no ranges. Lines count from 1. */
lineHistory(branch: string, paths: readonly string[]):
  Promise<Answer<Readonly<Record<string, readonly { from: number; to: number; by: string; at: number }[]>>>>
/** The author login of each commit a pull has, oldest first (`GET pulls/<n>/commits`): who added to a change. */
pullAuthors(number: number): Promise<Answer<readonly string[]>>
```

`saveFiles`, as the installation: `GET git/ref/heads/<branch>` (the head), `GET git/commits/<head>` (its tree),
`GET git/trees/<tree>?recursive=1` (each path's sha, to check versions), `POST git/trees` with `base_tree` and one
`{ path, mode: '100644', type: 'blob', content }` each, `POST git/commits` (the message, the tree, the head as the
one parent, the author and **no committer**, as `saveFile` sends it, so GitHub signs the commit as the App and a
"signed commits" rule still passes; audit I4), `PATCH git/refs/heads/<branch>` with `force: false`. **A refusal of
the last is settled by looking, as `saveFile` does it** (audit I4): on a 422, 403 or 409, read the branch's head
again; if it moved, 'changed-elsewhere'; if not, a rule refused the App, 'blocked'. A tree answer with
`truncated: true` falls back to `readFile` for each path's version. Versions are checked **on the branch the change
goes to** (with `into`, the waiting change's branch, not the default branch). `versions` are `blobSha` of each
text. `by` in `lineHistory` is the commit author's login, else the commit's author name. The
pretend GitHub gains those six calls and `POST /graphql` for exactly this query; its blame gives each line the oldest
commit of the unbroken run of commits, newest first, whose text for that path holds the line.

- [ ] **Step 1: Failing tests.** `blobSha('hello\n')` is `ce013625030ba8dba906f756967f9e9ca394464a`, and of a
      Korean text it equals git's own (`git hash-object` of the same bytes, recorded in the test). `saveFiles`:
      three files in one commit, one commit in the log, each file's new version is its blob sha and `readFile`
      agrees; a stale version writes nothing and is 'changed-elsewhere'; a new file with `version: undefined` is
      made, and refused if it is already there; the branch moved between the read and the move is
      'changed-elsewhere'; a rule that blocks the App (the pretend GitHub answers the ref's move with a 422 and the
      head has not moved) is 'blocked', not 'changed-elsewhere'; the commit the pretend GitHub got has an author
      and no committer; a truncated tree still checks versions; the author is the person. `pullAuthors` lists
      each commit's login in order. `lineHistory`: after
      alice writes a file and bob changes its line 3, line 3 is bob's and the rest alice's; a missing path is `[]`.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(github): one commit of several files, and each line's history`.

### Task 5: Story's files through the shared save

**This widens the figure builder's save; it builds none of its own** (gate G7; audit I12; the coordinator,
2026-11-15). There is no `/api/save-many`, `SaveManyAsk`, `SaveManyAnswer`, `FileSave` or `api.saveMany`. The shapes
below are what Story adds to plan G's, under plan G's names: Story's `FileSave` is `ChangeFile`'s `content` kind
(`{ kind: 'content'; type; path; value; version? }`, for `conversation`, `cutscene`, `messages` and `character`) plus
one new kind, `{ kind: 'read-marks'; value; version? }` at `READ_MARKS_FILE`; `ChangeAsk` gains `into?` and the
`setUp?` field Sound adds too (whichever is built first names it, the other uses it); `ChangeAnswer` gains `how:
'words'`, `missing` and `goesIn`. Steps 2 to 5 below are Story's entries in the shared route
(`service/change.ts`) and in the shared `allowedPaths` (`service/changed.ts`), not a check of their own. The caps
are plan G's (24 files, 6 MB), so Story's own "1 to 40 files" goes: a change of a conversation, six messages files,
a character, the marks and the project file is 10. If Story is first, it builds plan G's route under plan G's names
and plan G's Task 2 widens it.

**Files:**
- Create: `src/features/wire/missing.ts`, `src/features/wire/project-line.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/service/change.ts`, `src/features/service/changed.ts`,
  `src/features/service/service.ts`, `open.ts`, `src/features/api/api.ts`, `src/features/game/open.ts`
- Test: `tests/features/wire/missing.test.ts`, `project-line.test.ts`, `tests/features/service/change.test.ts`
  (Story's cases), `changed.test.ts`, `open.test.ts`, `tests/features/api/api.test.ts`,
  `tests/features/game/open.test.ts`

**Interfaces:**
- Consumes: `saveFiles` and the shared route (Task 4, gate G7); the framework's `writeContent`, `parseContent`,
  `loadGame`, `translationProblems`, `parseReadMarks`, `writeReadMarks`, `readMark`, `READ_MARKS_FILE`, `LANGUAGES`,
  `withFolders`.
- Produces:

```ts
// wire.ts
export type StoryKind = 'conversation' | 'cutscene' | 'messages' | 'character' | 'read-marks'
// ChangeFile (plan G's) gains one kind; Story's other files are its `content` kind with `type` one of the first four
//   | { readonly kind: 'read-marks'; readonly value: ReadMarks; readonly version?: string }   // at READ_MARKS_FILE
/** How many words each language still lacks; a language with none has no entry. */
export type MissingWords = Readonly<Partial<Record<Language, number>>>
// ChangeAsk (plan G's: game, message, files) gains:
  /** Add to this waiting change (its number) instead of starting or using my own. */
  readonly into?: number
  /** List these kinds' folders in the project file in this same save (ruling 6); never with `into`. Shared with
   *  Sound's set-up: one field, whichever editor builds it first. */
  readonly setUp?: readonly FolderRef[]
// ChangeAnswer (plan G's: how, version, mine, changed?) gains:
  /** 'words': it waits for words, whatever the person's level. */
  readonly how: 'direct' | 'suggestion' | 'words'
  readonly versions: Readonly<Record<string, string>>
  readonly missing: MissingWords
  /** True when the change it is part of goes in by itself once nothing is missing (Task 6's rule). */
  readonly goesIn: boolean
// ProblemKind gains 'words-missing' (STATUS 409)
// wire/missing.ts (pure; both sides mean the same thing by "missing")
/** For each language the game has a messages file for, other than its own: how many of its own keys it lacks. */
export function missingWords(content: Pick<GameContent, 'project' | 'messages'>): MissingWords
/** `translationProblems` with every missing word filled from the game's own, in memory: what is wrong besides missing.
 *  It leaves out "This game has no words in <language>" (a file the game lacks; ruling 9, audit I11). */
export function otherWordProblems(content: GameContent): readonly Diagnostic[]
/** The problems in `after` that `before` does not have, matched by file, path and sentence (audit I11): a change is
 *  refused only for what it adds, so a game whose `main` already has a word problem can still be saved. */
export function addedProblems(before: readonly Diagnostic[], after: readonly Diagnostic[]): readonly Diagnostic[]
export const nothingMissing = (missing: MissingWords): boolean
// wire/project-line.ts (pure; ruling 6)
export type FolderKind = 'conversation' | 'cutscene'
export const SET_UP_FOLDER: Readonly<Record<FolderKind, string>>   // content/conversations, content/cutscenes
/** The folder the project lists for a kind, if it lists one. */
export function folderOf(project: Project, kind: FolderKind): string | undefined
/** `<folder>/<id>.json`; undefined when the game lists no folder for the kind. */
export function newFilePath(project: Project, kind: FolderKind, id: string): string | undefined
// No editor-side writer of automata.toml (plan audit C2): its bytes are always the framework's
// `withFolders(text, refs)`, so an agent's command and the editor write the same file.
/** True when `after` is exactly `withFolders(before, refs)` for refs of kinds in FolderKind at SET_UP_FOLDER. */
export function onlyListsFolders(before: string, after: string): boolean
// game/open.ts
export interface OpenGame { /* … */ readonly marks: ReadMarks | undefined; readonly marksProblem: readonly Diagnostic[] }
export function openGame(api: Api, ref: GameRef, change?: number): Promise<Opened>
```

`GET /api/game` also returns `automata.translations.toml` when the branch has it, and with `change=<number>` reads
from that waiting change's branch (it must be a waiting change, else 'not-found'; `mine` and `level` as always).

What the shared route does for Story's files, in order; any refusal writes nothing:

1. The door (`enter`, action `save`); signed out is 'signed-out'. Plan G's caps, no path twice, else 'bad-request'.
2. The target branch: `into` given: that waiting change's branch (`waitingPull`; then every file's kind must be
   `messages` or `read-marks`, else 'not-allowed'); else my own waiting change's branch if I have one; else the
   default branch, for now.
3. Each file, against the project file on the target branch: `messages`, `character` and an existing `conversation`
   or `cutscene` must be the project's (listed by path, or in a listed folder) with that type; a new one
   (`version` undefined) must be at `newFilePath` of the project as step 5 leaves it; `read-marks` must be
   `READ_MARKS_FILE`. Anything else is 'not-allowed'.
4. The bytes: `writeContent(kind, value)`, or for marks `writeReadMarks` of the value after it reads back through
   `parseReadMarks`; a throw is 'broken' with the framework's sentences. A file's `id` must match its file name. A
   `character` may differ from the branch's only in `name` and `conversation` ('not-allowed' otherwise). Each mark
   must equal `readMark` of the two texts as this save leaves them, or be a mark the branch's file already has.
5. `setUp` may hold only `{ type: 'conversation', folder: SET_UP_FOLDER.conversation }` and the cutscene's like it
   (else 'not-allowed'); the project file's text becomes the framework's `withFolders(text, setUp)` (the same text
   when both are listed) and joins the commit (ruling 6). A new file needs nothing more.
6. `wholeGameLoads` with every text in place: 'broken' with its sentences. Then `addedProblems(otherWordProblems`
   of the target branch's game, `otherWordProblems` of the game with the change`)`: any is 'broken' with its
   sentences (audit I11).
7. `missing = missingWords(…)`. Where it goes: `into`: that branch. My own waiting change: its branch. Else, if
   nothing is missing and I may `save-direct`: the default branch (`how: 'direct'`). Else my `automata/<login>`
   branch, made fresh as `saveLevel` makes it, with a pull whose title is the message.
8. `saveFiles`; on a refusal a branch made in step 7 is deleted. `how` is 'words' when anything is missing, else
   'direct' or 'suggestion'. `goesIn` is Task 6's rule for the change as this save leaves it (true for a
   'direct').

- [ ] **Step 1: Failing tests.** `missingWords`: none for the fixture; `{ ko: 1, ja: 2 }` for `story-gaps`; `{}` for
      `no-korean` and for a game with no words (ruling 9). `otherWordProblems`: none for `story-gaps`; names a
      Korean text that lost `{count}` and a `controls.jump` of 13 characters; none for `no-korean` (the missing file
      is left out). `addedProblems` keeps only the new ones. `withFolders` (the framework's) then
      `parseProject` lists the folder last and every earlier byte is unchanged; `newFilePath` is in the listed
      folder and undefined with none; `onlyListsFolders` is false when any other byte differs or the entry names
      another kind or folder. `change.test.ts` (Story's cases), each as its own test:
      an Owner changes `keeper.hello.1` in English only: direct, one commit, one file, and `main` still has no
      translation problem; an Owner adds a line (the conversation and `en.json`): 'words', `{ zh: 1, es: 1, pt: 1,
      ja: 1, ko: 1 }`, on `automata/<login>`, `main` untouched; a Suggest person's complete change: 'suggestion';
      `into` another person's waiting change with `ko.json`: one more commit on their branch by me, and `into`
      with a conversation is 'not-allowed'; a new conversation in a game that lists the folder is one new file and no change to `automata.toml`; in a game
      that does not, with `setUp`, the file and the folder entry in one commit, and without `setUp` 'not-allowed'; a path
      that is not listed, a level's path, the sharing file, `automata.toml` as a file: 'not-allowed'; a character
      whose `size` changed: 'not-allowed'; a mark that is not the texts' mark: 'broken'; a stale version:
      'changed-elsewhere' and no branch left behind; a visitor: 'signed-out'; Look level: 'not-allowed'; a line
      whose key the game's own language lacks: 'broken' with the framework's sentence; **a save in `no-korean` goes
      in** (ruling 9); **a save in a game whose `main` already has a 13-character button goes in, and one that
      makes a second is 'broken'** (audit I11); with `into`, a file's version is checked on that change's branch.
      `open.test.ts`: the marks
      file comes back; `change=` reads the other branch; `change=` for an ordinary pull is 'not-found'.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(api): Story's files in the shared save`.

### Task 6: Waiting for words, finishing by itself, and the words' history

**Files:**
- Create: `src/features/service/words-left.ts`, `ready.ts`, `words-merge.ts`, `finish.ts`, `hook.ts`,
  `words-history.ts`
- Modify: `src/features/service/pulls.ts` (`toWaiting`), `approve.ts`, `waiting.ts`, `changed.ts`, `service.ts`,
  `functions/` (the route list, if it names routes), `src/features/wire/wire.ts`, `src/features/api/api.ts`,
  `docs/deploy.md` (the App's webhook), `tests/fixtures/fake-github/server.ts` (it sends `check_suite` when a test
  sets a commit's checks to passing)
- Test: `tests/features/service/words-left.test.ts`, `words-merge.test.ts`, `finish.test.ts`, `hook.test.ts`,
  `words-history.test.ts`, `waiting.test.ts`, the approve cases in `service.test.ts` or where they live,
  `tests/docs/deploy.test.ts` (or where the deploy doc is read)

**Interfaces:**
- Produces:

```ts
// wire.ts
export interface Waiting { /* … */
  /** What it still lacks; `{}` when it changes words and lacks none; undefined when it changes no words file. */
  readonly words: MissingWords | undefined
  /** Its starter and every later commit's author may save straight in, so it goes in by itself once nothing is
   *  missing (ruling 5; audit C1). */
  readonly goesIn: boolean
}
export interface LineBy { readonly by: string; readonly at: number }
export interface WordsHistory {
  /** For each language, each key's line: who last changed it and when. */
  readonly words: Readonly<Partial<Record<Language, Readonly<Record<string, LineBy>>>>>
  /** For each language, each read key's line in the marks file. */
  readonly read: Readonly<Partial<Record<Language, Readonly<Record<string, LineBy>>>>>
}
// service/words-left.ts
export function wordsLeft(repo: Repo, pull: Pull): Promise<Answer<MissingWords | undefined>>   // at most 9 reads
/** True when the starter (`automata/<login>`) and each author `pullAuthors` names may `save-direct` by `access`, the
 *  sharing file on the default branch read afresh; a GitHub-only Owner counts as not (Q-B). One call. */
export function goesIn(repo: Repo, access: AccessFile, pull: Pull): Promise<Answer<boolean>>       // ruling 5
// service/words-merge.ts (audit I6)
/** A words change that clashes with `main`, brought up to date: for each messages file and the marks it touches,
 *  `main`'s file with every key the change made or changed (its first commit's parent against its head) laid over
 *  it, written by `writeContent` and committed to the change's branch with `saveFiles`, its author the App. A key
 *  both `main` and the change changed is 'changed-elsewhere' with both texts in `details`, and nothing is written.
 *  A clash in any other file is 'clashes', as Approve says it today. */
export function bringUpToDate(deps: ApiDeps, repo: Repo, change: Pull): Promise<Answer<{ commit: string }>>
// service/hook.ts (the Owner's answer to audit I5, A)
/** POST /api/github-hook: GitHub's `check_suite` event for the App. Checks `X-Hub-Signature-256` (HMAC-SHA256 of the
 *  raw body with `GITHUB_WEBHOOK_SECRET`, compared in constant time) before reading anything; 401 otherwise. Reads
 *  only the repo and `check_suite.head_sha` from the body; for an `action: "completed"`, finds the waiting change
 *  whose head is that commit and runs `finish`'s rules for it as the App. Any other event, or none found, is 200 and
 *  does nothing. */
export function githubHook(deps: ApiDeps, request: Request): Promise<Response>
// service/ready.ts, lifted from approve.ts and used by both
export function readyToGoIn(deps: ApiDeps, repo: Repo, change: Pull):
  Promise<Answer<{ paths: readonly string[]; listed: readonly ContentRef[] }>>
```

`readyToGoIn` is Approve's steps 2, 4 and 5 as they are today, with two changes: step 2's path rule is the shared
`allowedPaths` (`service/changed.ts`, gate G7), which Story widens with `READ_MARKS_FILE` (it must read back through
`parseReadMarks`), a new file directly in a folder the project lists for its kind (on the default branch or in the
change's own `automata.toml`), and `automata.toml` when `onlyListsFolders(before, after)`; and a change whose
`missingWords` is not empty is 'words-missing'. `approveChange` becomes: the door, its own "not your own" rule,
`readyToGoIn`, the merge. **`finish(deps, repo, change, by)`** is the rule both callers share: a waiting change;
`goesIn` else 'not-allowed'; `readyToGoIn`; merge that commit with the title `Words complete: <title>` and the
message `Finished by <by>.`; delete the branch. A merge that answers 'clashes' runs `bringUpToDate` once and
answers 'not-ready' (its new commit's checks must run); a second clash is 'clashes'. `POST /api/finish { game,
number }`: the door (`save`), then `finish` with the person's login. `POST /api/github-hook`: `githubHook`, then
`finish` with `the editor` as `by`. `showChange`'s `here` uses `allowedPaths` too. `GET /api/words-history` (the
door, `look`, visitors allowed): `lineHistory` over the listed messages files and the marks file of the default
branch, or of the waiting change's branch with `change=<number>` (so a starter's new words show as theirs; audit
M9), each line matched to its key by reading the file's own text (a JSON line `"<key>": "…"`, a TOML line
`"<key>" = "…"` under its `[read.<language>]`). The history is one GraphQL call, which GitHub counts apart from the
REST allowance `repo.allowance()` sees; a visitor gets history only while the REST allowance is above the visitor
reserve, and otherwise the Words part shows no faces or "Changed" from history (audit M9).

**The webhook, at deploy** (`docs/deploy.md`, as CLI steps where GitHub has them, else the one settings step named
plainly): the App's webhook address is `https://<site>/api/github-hook`, it subscribes to **Check suite**, and its
secret is set with `wrangler pages secret put GITHUB_WEBHOOK_SECRET`. The secret lives only in Cloudflare; the App
needs no new permission (Checks: read already covers the event).

- [ ] **Step 1: Failing tests.** `toWaiting` of the Owner's add-a-line change has `words` with five languages and
      `goesIn: true`; a Suggest person's has `goesIn: false`; a level-only change has `words: undefined`. **C1:** a
      Suggest person adds Korean (`into`) to an Owner's change: `goesIn` becomes false, its checks pass, `finish`
      is 'not-allowed', and Approve by an Approver puts it in; an Edit person's words keep `goesIn: true`. Finish:
      with words missing 'words-missing'; with all six written and checks running 'not-ready'; passing: merged,
      branch gone, `main` has no translation problem; a Suggest person's change 'not-allowed'; a change that also
      touches a level it lists goes in; one that touches `automata.access.toml` or changes another byte of
      `automata.toml` 'not-allowed'. Approve: refuses 'words-missing'; accepts a change with the marks file and
      one that sets up and adds a conversation. **The hook:** a signed `check_suite` `completed` for a ready change's
      head merges it with "Finished by the editor."; a missing or wrong signature is 401 and nothing changes; an
      event for a commit no waiting change has, or of another kind, is 200 and nothing changes; a change still
      missing words, or needing approval, is left as it was. **A clash** (audit I6): a waiting words change, then an
      Owner's save straight in that adds `keeper.hello.3` next to its key; `finish` brings it up to date (one
      commit by the App on its branch, both keys in `en.json`), answers 'not-ready', and after the checks pass goes
      in with both lines; the same key changed on both sides is 'changed-elsewhere' with both texts. History: after alice writes Korean `keeper.bye.1` and bob ticks
      it, `words.ko['keeper.bye.1'].by` is alice and `read.ko['keeper.bye.1'].by` is bob; a visitor at the demo
      game gets it; a visitor elsewhere 'not-found'.
- [ ] **Steps 2 to 4:** red, implement, green; every existing approve test still passes unchanged.
- [ ] **Step 5:** Commit `feat(api): a change waits for its words, and the App puts it in when they are there`.
      Report Tasks 3 to 6, and that the deploy needs the webhook's address and secret (the Owner's step, at deploy).

---

## Pull request 4: Story's frame

### Task 7: The change a person is in the middle of

**Files:**
- Create: `src/lib/zip.ts`; `src/features/story/story.ts`, `files.ts`, `change.ts`, `keys.ts`, `game-words.ts`,
  `save.ts`, `copy.ts`, `draft.ts`
- Modify: `tests/architecture/rules.ts` (`story` after `levels`, in `PAGE_SIDE`), `knip.json` only if it must
- Test: `tests/lib/zip.test.ts`, `tests/features/story/{files,change,keys,game-words,save,copy,draft}.test.ts`

**Interfaces:**
- Produces:

```ts
// files.ts
export interface StoryFiles {
  readonly conversations: Readonly<Record<string, ConversationFile>>
  readonly cutscenes: Readonly<Record<string, CutsceneFile>>
  readonly messages: Readonly<Partial<Record<Language, MessagesFile>>>
  readonly characters: Readonly<Record<string, Character>>
  readonly marks: ReadMarks | undefined
}
export function storyFilesOf(game: OpenGame): StoryFiles
/** The game as it would be with these files: what the previews, the checks and `missingWords` read. */
export function contentWith(content: GameContent, files: StoryFiles): GameContent
// change.ts: every function returns a new edit; nothing opened is ever changed
export interface StoryEdit { readonly opened: StoryFiles; readonly now: StoryFiles
  readonly past: readonly StoryFiles[]; readonly future: readonly StoryFiles[] }
export function startStory(files: StoryFiles): StoryEdit
/** One step: a change that touches two files is one undo. The same files again is the same edit. */
export function apply(edit: StoryEdit, next: StoryFiles): StoryEdit
export function undoStory(edit: StoryEdit): StoryEdit
export function redoStory(edit: StoryEdit): StoryEdit
export function isDirtyStory(edit: StoryEdit): boolean          // by value: a change undone by hand is not a change
export interface TouchedFile { readonly path: string; readonly kind: StoryKind; readonly value: unknown
  readonly text: string; readonly version: string | undefined }
/** Each file that differs from the opened one, in the project's order, new files next, the project file's new
 *  text never here (the API writes it), the marks last. `text` is `writeContent`'s or `writeReadMarks`'s. */
export function touched(game: OpenGame, edit: StoryEdit): readonly TouchedFile[]
export function describeStory(game: OpenGame, edit: StoryEdit): string
/** The framework's own problems for the game as edited: `loadGame` over the opened files with `touched` laid
 *  over them, then `otherWordProblems`. Each names its file and path. */
export function checkStory(game: OpenGame, edit: StoryEdit): Promise<readonly Diagnostic[]>
// keys.ts
export function slugOf(words: string, most?: number): string    // a-z and 0-9 words joined by dashes, starting with a letter; '' if none
export function fileId(name: string, taken: ReadonlySet<string>): string        // most 64; 'story-1' when the slug is ''
export function stepId(file: ConversationFile, firstWords: string): string      // most 32; 'step-<n>' when ''; '-2' up when taken
export function lineKey(fileId: string, step: string, taken: ReadonlySet<string>): string       // keeper.hello.1, next free number
export function choiceKey(fileId: string, step: string, taken: ReadonlySet<string>): string     // keeper.hello.choice-1, most 96
export function cutsceneLineKey(cutscene: string, taken: ReadonlySet<string>): string           // door-opens.line-1, most 96
// game-words.ts
export function textOf(files: StoryFiles, language: Language, key: string): string | undefined
export function setText(files: StoryFiles, language: Language, key: string, text: string): StoryFiles
export function removeKey(files: StoryFiles, key: string): StoryFiles            // from every language, and its marks
export type Use = { readonly kind: 'conversation' | 'cutscene' | 'character' | 'level' | 'button' | 'other'; readonly id: string }
export function usesOf(files: StoryFiles, key: string): readonly Use[]
/** The editor's language if the game has it, else the game's own; `picked` wins when the game has it. */
export function shownLanguage(source: Language | undefined, has: readonly Language[], editor: string,
  picked?: Language): Language | undefined
// save.ts, copy.ts, draft.ts
export function saveStory(api: Api, game: OpenGame, edit: StoryEdit, into?: number): Promise<StorySaved>
export type StorySaved =
  | { readonly ok: true; readonly how: ChangeAnswer['how']; readonly missing: MissingWords
      readonly goesIn: boolean; readonly game: OpenGame }
  | { readonly ok: false; readonly problem: ProblemKind; readonly details?: readonly string[] }
export function storyCopy(game: OpenGame, edit: StoryEdit): { readonly text: string
  readonly files: readonly { readonly path: string; readonly text: string }[] }   // ruling 11; a new file's entry: the whole new automata.toml
export function keepStoryDraft(store: Storage, game: OpenGame, edit: StoryEdit): void
export function takeStoryDraft(store: Storage, game: OpenGame): { edit: StoryEdit } | 'changed' | undefined
export function dropStoryDraft(store: Storage, game: OpenGame): void
// lib/zip.ts
export function zipOf(files: readonly { readonly path: string; readonly text: string }[]): Uint8Array
```

`describeStory`: one kind of change gives its own words (`Change what Keeper says`, `Add a step to Keeper`,
`Change Door opens`, `Write Korean words`, `Mark Korean words as read`); several give `Change the story`. These go
into the game's history, so they are English, like World's `Move crate-1 in level-1`. A key is at most 96
characters: `lineKey`, `choiceKey` and `cutsceneLineKey` each cut the step's (or the cutscene's) part to fit, the same
way (audit I10). An id must start with a letter (the framework's `ID_PATTERN`), so a slug drops its leading digits
and dashes, and one with nothing left is `''`, which gives the `step-<n>` or `story-<n>` fallback (audit I10). The draft keeps `touched`'s values and each file's version, and
is `'changed'` when any of those versions is no longer the opened file's.

- [ ] **Step 1: Failing tests.** `slugOf('What's that door?')` is `whats-that-door`; of `'こんにちは'`, `'🙂'` and `''`
      is `''`; of 200 letters is 32 long and ends on a whole word or a cut, never a dash; of `'3 apples, please'` is
      `apples-please` and of `'42'` is `''`, so `stepId` gives `step-1` (audit I10). `stepId` for the Japanese
      line is `step-1`, then `step-2`; for "Hello there!" twice is `hello-there` then `hello-there-2`. `lineKey`
      with `keeper.hello.1` and `.2` taken is `keeper.hello.3`; with a 64-letter file id and a 32-letter step it is
      96 or under and matches the framework's `MessageKey`; so do `choiceKey` (`.choice-4` on the same ids, which
      would be 107 uncut) and `cutsceneLineKey` on a 64-letter cutscene; every `fileId` and `stepId` the tests make
      parses as the framework's `Id` (audit I10). `apply` twice then `undoStory` twice is the start by
      value; `redoStory` after a new `apply` does nothing. `touched` after one new line lists the conversation then
      `en.json`, each `text` equal to `writeContent` of the value, and for the fixture untouched it is empty.
      `checkStory` names a choice that points at a step that is gone, in the framework's sentence. `shownLanguage`:
      `('en', all six, 'ko')` is `ko`; `('en', all six, 'de')` is `en`; `(undefined, [], 'en')` is undefined.
      `usesOf('keeper.hello.1')` is the conversation; of `level.level-1.name` a level; of `controls.jump` a button.
      `saveStory` sends one `saveChange` (plan G's call) and afterwards the game's files hold the new versions and `touched` is
      empty; a refusal leaves the edit as it was. `storyCopy` of a two-file change is two `=== path ===` blocks whose
      bytes are the files'. `zipOf` of two files unzips (read by the test's own few lines) to the same paths and
      bytes; its CRCs are right. The draft: kept, taken, `'changed'` after a version moves, dropped on garbage and
      on a store that throws.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): the change, its keys and its files`.

### Task 8: Story in the frame, and Story's page

**Files:**
- Create: `src/features/suite/StoryScreen.svelte`, `src/features/story/StoryPage.svelte`, `MiniMap.svelte`
- Modify: `src/features/suite/route.ts`, `App.svelte`, `Switcher.svelte` (Story is no longer "Coming soon"),
  `Pill.svelte`, `src/features/ui/panels.ts` (`timeline`), `src/features/words/*.ts` (Appendix A's `story…` words,
  nine languages), `CLAUDE.md` (the two exceptions of Global Constraints, the webhook route, and the device list)
- Test: `tests/features/suite/route.test.ts`, `tests/features/story/story-page.browser.test.ts`,
  `tests/journeys/story-open.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// route.ts: Route gains
| { screen: 'story'; owner: string; name: string
    part: 'page' | 'conversation' | 'cutscene' | 'words' | 'first'
    id?: string            // the conversation's or the cutscene's
    change?: number        // read from, and add words to, this waiting change
    show?: 'missing' | 'unread' | 'changed' }
// #/game/o/n/story (first), /story/page, /story/talk/<id>, /story/scene/<id>, /story/words,
// with ?change=<number> and ?show=<filter> on words
```

`StoryScreen` is to Story what `LevelScreen` is to World: it opens the game (`openGame(api, ref, change)`), holds
the one `StoryEdit` for the whole of Story (so a word changed in Words and a card changed on the map are one
unsaved change and one Save), takes a draft, and renders `Frame` with the pill (the game's name, then what is open
as the `h1`: the conversation's or cutscene's name, or `storyWords`; then the switcher with Story chosen), the
cluster (Find, the person, the language button, Export, Share, Save: wired in Task 21, until then Save and Export
show and say `storySoonSave` in a notice), and the part. `part: 'first'` resolves by ruling 17. The pill carries a
flag button (`data-lang`) when the game has more than one language: it lists the game's languages, each by its own
name and flag, and sets which the map, the stage and the previews show. Pressing the pill's "Story" opens
**Story's page**, a `Panel` over the canvas (`data-part="story-page"`): the conversations as cards (`MiniMap`: the
map's boxes and lines with no words, from `layoutMap` at fixed sizes once Task 10 is in, a plain row of dots until
then; and the speakers' faces by the redesign's `character-picture.ts`), the cutscenes as cards (the redesign's
`Thumb` of its level with a dashed rectangle element laid over it for the first camera key), the Words card
(`wordsCard(count, language, missing)` or `wordsCardFull(count)`), then `storyAddTalk` and `storyAddScene` (built in Tasks 12 and 17, when G6 is open; in a game that does not list
the kind's folder the card is `storySetUpTalks` or `storySetUpScenes` with `storySetUpWhy` under it, ruling 6).
The two Add cards open a small panel asking the name (and, for a cutscene, the level). A Look level sees everything and no Add card. A game with no words shows
one card, `storyNoWords`, and no Add card (ruling 9). A game with words and no conversation or cutscene shows the
two Add cards and the tip of Task 22.

- [ ] **Step 1: Failing tests.** Routes: each address above parses and writes back; `story/talk/` with odd
      characters is the games list. Browser: Story's page for the fixture has one conversation card named "Keeper"
      with the keeper's face, one cutscene card "Door opens", a Words card reading "10 words, all six languages";
      for `story-gaps` "10 words, 2 missing in Japanese" (the language that lacks most); for `plain-game` the one
      sentence and no Add card; at Look level no Add card. Journey (five sizes, three engines): from the level
      screen, the switcher's Story opens the keeper's conversation (a placeholder part until Task 11, with the
      `h1` "Keeper"); the pill's Story opens the page and a card opens its part; the address changes each time and
      a reload opens the same part; World still opens from the switcher; `broken(page, true)` is empty; no two
      `[data-part]` overlap; a visitor on the demo game gets the same with no Save.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): Story opens in the frame, with its own page`.
      Review pictures (not the final look). Report Tasks 7 and 8.

---

## Pull request 5: conversations

### Task 9: Every change a conversation can take

**Files:** Create `src/features/story/conversation-edit.ts`. Test `tests/features/story/conversation-edit.test.ts`.

**Interfaces:**
- Consumes: Task 7's `StoryFiles`, keys and game words.
- Produces (each takes and returns `StoryFiles`, or says why not):

```ts
export type Did = { readonly files: StoryFiles; readonly did: true; readonly id?: string }
                | { readonly files: StoryFiles; readonly did: false; readonly why: Why }
export type Why = 'most-lines' | 'most-choices' | 'most-steps' | 'last-line' | 'not-own-words' | 'no-such' | 'same' | 'too-long'
export const MOST = { lines: 8, choices: 4, leastChoices: 2, steps: 128, text: 2000 } as const
export function setLine(f, talk: string, step: string, line: number, language: Language, text: string): Did   // ruling 8 first
export function addLine(f, talk, step, own: Language, text?: string): Did
export function removeLine(f, talk, step, line: number): Did              // 'last-line' for the only one
export function setSpeaker(f, talk, step, character: string | undefined): Did
export type Then = { readonly kind: 'picks' } | { readonly kind: 'goes'; readonly to: string | 'new' }
                 | { readonly kind: 'ends'; readonly plays?: string }
export function setThen(f, talk, step, then: Then, own: Language): Did
export function addChoice(f, talk, step, own: Language, to: string | 'new'): Did
export function setChoiceWords(f, talk, step, choice: number, language: Language, text: string): Did
export function pointChoice(f, talk, step, choice: number, to: string | 'new'): Did
export function pointNext(f, talk, step, to: string | 'new'): Did
export function removeChoice(f, talk, step, choice: number): Did          // at two choices: becomes "It ends"
export function addStep(f, talk, own: Language, speaker: string | undefined): Did       // one line, the words `storyNewLine`'s
export function leadsTo(file: ConversationFile, step: string): readonly { from: string; choice?: number }[]
export function removeStep(f, talk, step, also: 'choices-too' | 'only-if-free'): Did
export function setStart(f, talk, step): Did
export function setStarters(f, talk, characters: readonly string[]): Did  // each character's `conversation`
export function newConversation(f, name: string, own: Language, speaker: string | undefined): Did
```

Rules the signatures do not settle. A text is trimmed; an empty one is refused ('same'), and one over 2,000
characters 'too-long'. Every function that makes a key refuses with 'not-own-words' unless `own` is the game's
`source` (ruling 7); `setLine` and `setChoiceWords` write any language the game has. `removeLine`, `removeChoice`
and `removeStep` call `removeKey` for each key nothing else uses any more. "The player picks" on a step with none
makes two choices, each to a new step; `'new'` makes a step with the same speaker and one line. `removeStep` with
`'choices-too'` removes each choice that led there (a step left with one choice becomes "It goes on to" that
choice's step, and its words' key is removed) and each `next` that led there (that step then ends); the start step
cannot be removed while another step exists ('no-such' is never used for it: `setStart` first). `newConversation`
makes the file with one step, `start` on it, and sets nothing on any character.

- [ ] **Step 1: Failing tests**, one per rule above, on the fixture: the new line's key is `keeper.hello.3` and
      `en.json` has the words and no other language does; the ninth line is 'most-lines'; the fifth choice
      'most-choices'; `setLine` in Korean writes `ko.json` only; `setLine` on a key the cutscene also uses gives
      the line a new key and copies every language's words (ruling 8); `removeStep('door', 'choices-too')` leaves
      `hello` going on to `bye` and removes `keeper.hello.choice-1`, `-2` and `keeper.door.1` from all six files;
      after every `did: true` in this file, `checkStory` has no problem except "Nothing leads to this step" for a
      step just added; a conversation of 128 steps refuses the next.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): every change a conversation can take`.

### Task 10: The map's layout

**Files:** Create `src/features/story/map.ts`. Test `tests/features/story/map.test.ts`.

**Interfaces:**
- Produces:

```ts
export interface Box { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface MapSizes {
  /** Each card's measured height at CARD_W wide; a card not measured yet counts as 120. */
  readonly cards: Readonly<Record<string, number>>
  /** Each line's chip, by line id; one not measured counts as 96 by 32. A chip is at most CHIP_W wide and wraps
   *  its words onto more rows, so a 2,000-character choice is a tall chip, never a cut one (audit M7). */
  readonly chips: Readonly<Record<string, { readonly w: number; readonly h: number }>>
}
export interface MapLine {
  /** '<step>:<choice>' for a choice, '<step>:next' for a "Then". */
  readonly id: string; readonly from: string; readonly to: string
  readonly chip: Box
  /** Corner to corner, each piece straight across or straight down. */
  readonly points: readonly { readonly x: number; readonly y: number }[]
}
export interface MapLayout { readonly cards: Readonly<Record<string, Box>>; readonly lines: readonly MapLine[]
  readonly size: { readonly w: number; readonly h: number }; readonly unreached: readonly string[] }
export const CARD_W = 280
export const CHIP_W = 200
export function layoutMap(file: ConversationFile, sizes: MapSizes): MapLayout
```

The rules (in map units; one unit is one CSS pixel at zoom 1):

1. **Columns.** Walk from `start`, breadth first, each step's choices in order and then its `next`: a step's column
   is how many steps from the start it is first met. Steps the walk never meets go in one last column, in file
   order, and are `unreached`.
2. **Rows.** In a column, cards go top to bottom in the order the walk met them, 48 apart. A card is at least as
   tall as its lines out need: (the tallest of its chips + 8) for each line out, plus 32.
3. **Gutters.** After each column comes a gutter: the widest chip of the lines leaving that column, plus 48, plus
   12 for every line that runs down through it. A line's chip sits in the gutter just right of its card, at the
   height of its own way out; ways out are spread evenly down the card's right edge in choice order, `next` last.
4. **A line to the next column** goes right through its chip to a lane of its own in the gutter, down or up the
   lane, then right into the target's left edge. Ways in are spread down the target's left edge in the order of
   the lines' ids.
5. **Any other line** (back to an earlier column, to its own card, to its own column, or over a column) leaves the
   same way, goes down its lane to a bus line of its own below the lowest card of every column it passes (24 below,
   then 12 apart), along the bus to the gutter left of its target (the far left gutter, 48 wide plus lanes, exists
   for the start's column), and up a lane there into the target's left edge.
6. No two cards overlap; no piece of a line passes through a card or a chip other than its own; two lines may
   cross. The same file and sizes always give the same layout.

- [ ] **Step 1: Failing tests.** The fixture: `hello` in column 0, `door` and `bye` in column 1, `door` above
      `bye`; `door:next` leaves `door`'s right and enters `bye`'s left by the bus (same column). Properties, checked
      over the fixture, a 12-step map with three back lines and a self line, a 128-step chain, a 128-step map
      where every step has four choices to seeded-random steps, and the fixture with one choice of 2,000 characters
      (a chip 200 wide and as tall as its rows, audit M7): every pair of cards is apart; every line piece is
      straight across or down; no piece meets a card's inside or another line's chip; every chip is inside `size`;
      a second call gives a deeply equal layout; changing one card's height moves only cards below it in its
      column and the lines that touch them or pass below.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): a conversation laid out as a map`.

### Task 11: The map on screen

**Files:**
- Create: `src/features/story/map-view.ts`, `ConversationMap.svelte`, `StepCard.svelte`, `MapLines.svelte`
- Modify: `src/features/suite/StoryScreen.svelte`, `src/features/story/MiniMap.svelte` (now from `layoutMap`)
- Test: `tests/features/story/map-view.test.ts`, `conversation-map.browser.test.ts`,
  `tests/journeys/story-map.journey.test.ts`

**Interfaces:**
- Consumes: `layoutMap`; `levels/view.ts` (`zoomAbout`, `panBy`, `pinch`, `clampView`, `stepZoom`), `levels/layout.ts`
  (`shapeOf`, `roomFor`, `roomWith`), the redesign's `ZoomButtons`, `Panel`, `Handle`, `Chip`, notes mode.
- Produces:

```ts
// map-view.ts: the map's view, in the terms of levels/view.ts with the map's `size` as the world
export const MOST_MAP_SCALE = 1.5
export const LEAST_OPEN_SCALE = 0.6
/** Where the map opens: the whole map if it fits at 0.6 or more (never above 1), else 0.6 with the start card in view. */
export function openView(size: Size, clear: Box, start: Box): LevelView
export function mostMapZoom(home: Fit): number      // so that scale never passes MOST_MAP_SCALE
```

```
ConversationMap.svelte  props: files: StoryFiles, talk: string, content: GameContent, shown: Language,
                        shape: Shape, mode: 'edit' | 'look', problems: readonly Diagnostic[], kept: Storage,
                        picked: string | undefined, onpick(step | undefined), onchange(next: StoryFiles),
                        onstate(state: MapState)
                        exports: tool(name), zoom(way), whole(), reveal(step), panel(name), panels()
                        MapState = { picked, tool: 'pick' | 'step', closed: readonly PanelName[], zoom: number }
StepCard.svelte         props: node, speaker: { name, picture } | undefined, lines: readonly (string | undefined)[],
                        start, end, plays?: string, faded, problem?: string, picked, shownName: string
```

The map is page elements, not a canvas: a layer with `transform` holds the cards (`StepCard`, each a `button`
`data-step`, 280 wide) over an SVG of the lines (`MapLines`: leader lines in words at 55%, end ticks, each chip a
`Chip` `data-line-to`). The component renders, measures every card and chip (`ResizeObserver`), lays out, and
places them; a text change re-measures. A card shows: the speaker's picture and shown name (the character's `name`
key in `shown`, else `nameOf(id)`; `storyNobody` for none), each line in quotes in `shown` (a line with no words in
`shown`: `storyNotWritten(language)` in the touch color), `storyStarts` on the start, `storyEnds` on a last step
and `storyPlays(name)` when it plays a cutscene, and its id as a small label. A card with a problem has the olive
edge and the framework's sentence under it (`problems` whose path is `nodes[i]…` of this file); an `unreached` card
has `data-faded`. One finger on empty map moves it; two fingers pinch and move it; the wheel, the three zoom
buttons and `+`, `-`, `0` work as on a level; a press on a card picks it and never moves the map. **Read
`levels/Stage.svelte` first:** if its two-finger and wheel handling is a function or an action that takes
callbacks, use it; if it is inline, write `story/fingers.ts` with the amendment's rules ("What each touch does")
and do not edit `Stage`. The tools here are `step` (Task 12) and `try` (Task 13); the parts close and open as in
World (`tools`, `card`, `block`, `switch`, `zoom`). The notes' switch shows, fades or hides the lines' chips'
leader ticks and the cards' id labels only; the words on cards are the content and always show.

- [ ] **Step 1: Failing tests.** `openView`: a map that fits opens whole at scale 1 or under; a 128-step map opens
      at 0.6 with the start card inside the clear cell; zoom never passes 1.5. Browser (each of the five sizes, in
      a box): the three cards of the fixture are there with their words in English; with `shown: 'ko'` in Korean;
      for `story-gaps` in Korean the `bye` card reads "Not written in Korean yet"; `hello` has `data-start`, `bye`
      has `data-end` and reads "Plays: Door opens"; no card's box meets another's; every chip's words are whole (no
      cut, no ellipsis) in all nine editor languages (`useTables` with the long-words table too), and a choice of
      2,000 characters wraps in a chip 200 wide whose box holds all its words (audit M7); a step nothing
      leads to has the framework's sentence and is faded; a press picks and `data-scale` does not change; a pinch
      changes `data-scale` and picks nothing; Look mode has no tools. Journey (five sizes, three engines): open
      Keeper; pinch by 2; two-finger move; "Whole map"; pick `door` by touch and by Tab and Enter; close and open
      each part; reload keeps what was closed; `broken(page, true)` is empty at each step; pictures `story-map`,
      `story-map-picked`, `story-map-korean`.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): a conversation reads as a map of cards`.

### Task 12: Changing a conversation

**Files:**
- Create: `src/features/story/StepPanel.svelte`, `ConversationPanel.svelte`, `NewName.svelte`
- Modify: `ConversationMap.svelte`, `StoryPage.svelte` ("Add a conversation" works), `StoryScreen.svelte`
- Test: `tests/features/story/step-panel.browser.test.ts`, `tests/journeys/story-change.journey.test.ts`

**Interfaces:**
- Consumes: every function of Task 9; `StoryEdit` (`StoryScreen` owns it; undo and redo are the frame's).

The picked card's panel (`data-part="card"`: right on `wide`, a `Sheet` otherwise), top to bottom: **`storyWho`**: a
`Choice` of the game's characters, each with its picture and shown name, and `storyNobody`; **`storyWhat`**: each
line a text box that grows (18 px, the game's script's font by `lang`), a remove button on each (44 px; hidden on
the only line), and `storyAddLine` (disabled at eight, with `storyMostLines` under it); **`storyThen`**: a `Choice`
of `storyThenPicks`, `storyThenGoes`, `storyThenEnds`; under "picks", each choice's words (a text box) and
`storyGoesTo` (a menu of the cards by first words, and `storyNewStep`), a remove on each, `storyAddChoice` (two to
four); under "goes", one `storyGoesTo`; under "ends", `storyAndPlays` (a menu of the game's cutscenes staged in a
level where this conversation's starters stand, and `storyNothing`); then the preview (Task 13); then
`storyRemoveStep`. Removing a step something leads to asks first in a notice that names each (`storyRemoveAsk(what)`,
"Remove them too" main, "Keep everything"). Typing applies on every pause of 400 ms and on leaving the box, as
one undo step per box visit. A refused change shows its reason under the control (`Why` to words: Appendix A's
`storyWhy…`); 'not-own-words' is the notice `storyOwnFirst` with the one button that shows the game's own words.
**Dragging a line's end** (`data-line-end`, a 48 px handle at the target card's edge) onto another card points it
there; the same is `storyGoesTo` in the panel and, with the end focused, the arrow keys move among cards and Enter
drops. **The `step` tool:** a touch on empty map adds a step (`addStep`, the picked card's speaker) and picks it;
its card appears in the unreached column with the framework's sentence until something leads to it. With nothing
picked the panel is the conversation's own (`ConversationPanel`): its name (read only), **`storyStartsWhen`** (a
list of characters with a switch each: `setStarters`), **`storyOpensOn`** (a menu of cards: `setStart`). "Add a
conversation" on Story's page asks its name (`NewName`), makes it (`newConversation`, the first character as
speaker), and opens its map.

- [ ] **Step 1: Failing tests.** Browser: each control calls its function and shows the result; the eighth line
      disables Add with the sentence; with `shown: 'ko'`, Add a line shows the notice and its button switches to
      English; typing in Korean changes `ko.json` only. Journey (five sizes, three engines), an Owner on the
      fixture: change "Hello there!" to "Hello, friend!" (the card and Undo and Redo follow); add a line; add a
      step with the tool, give it words, point "Bye!" at it by dragging the line's end (touch) and then back by
      the panel, and once more by keyboard; add a choice; remove `door` and see the notice name "What's that
      door?"; set the keeper off and on as a starter; set the start to another card and back; add a conversation
      "Shop talk" from Story's page and see its one card. After each, `[data-problem]` is only where the framework
      says, and `broken(page, true)` is empty. On `mid` and `narrow` the sheet never covers the picked card (the
      map reveals it above the sheet).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): change a conversation by touch`.

### Task 13: The speech box as a player sees it, and Try it

**Files:**
- Create: `src/features/story/talk-play.ts`, `SpeechPreview.svelte`, `TryIt.svelte`
- Modify: `StepPanel.svelte`, `ConversationMap.svelte`
- Test: `tests/features/story/talk-play.test.ts`, `speech-preview.browser.test.ts`,
  `tests/journeys/story-try.journey.test.ts`

**Interfaces:**
- Consumes: the framework's `createBox`, `BoxState` (Task 1), `openAt`, `nextPlace`, `choosePlace`;
  `levels/level-picture.ts` (`openLevelPicture`), `game/art.ts` (`loadLevelArt`).
- Produces:

```ts
// talk-play.ts (pure)
/** What the box shows at a place: the speaker's shown name and the line in `shown`, else in the game's own words
 *  (as the game does); the choices when the player must pick. */
export function boxAt(files: StoryFiles, talk: string, place: TalkPlace, shown: Language, own: Language): BoxState
/** The level the box is previewed over: the first level, in the project's order, with a thing whose character
 *  starts this conversation or speaks in it; else the project's start level. */
export function levelFor(content: GameContent, files: StoryFiles, talk: string): string | undefined
```

`SpeechPreview` (in the step's panel, `data-part="preview"`): a box of the window's own shape, drawn at the
window's size and scaled down to the panel's width, holding the level's picture (still, the framework's own) and
the framework's box showing the picked step's first line (its last line, with the choices, when the step has
choices), `inert` so nothing in it takes a press or the focus. Nothing is drawn on the art. `TryIt`
(`data-part="try"`, the `try` tool, or `storyTryFrom` in the panel): the same level and box, full window, live:
the box's own Next and choices walk the conversation as it is on screen, unsaved changes and all; `storyStop` top
left (56 px, also Escape); at the end a panel `storyTryEnd` (and `storyTryPlays(name)` when the last step plays a
cutscene) with `storyTryAgain` (main) and `storyStop`. It starts from the picked card, else the start. It changes
nothing and sends nothing. The box's two words come from the framework's own words for `shown` when the pin has
them, else its defaults.

- [ ] **Step 1: Failing tests.** `boxAt` at `hello`, line 1 (its last): two choices in Korean; with Korean missing
      a line, the English words; a step with no speaker has no `speaker`. `levelFor` is `level-1`. Browser: the
      preview holds `.automata-story` with the step's words; the level canvas's `toDataURL()` is the same with and
      without the box (the art-untouched test); a press inside the preview does nothing; typing `1`, `2` and Enter in a line's text
      box beside the preview changes only the text box, never the preview's line or choice (audit I9). Journey (five sizes, three
      engines): Try it from the start: "Hello there!", Next, "Lovely day." with two choices; pick "What's that
      door?"; Next to the end; "Then it plays: Door opens"; Try again; Stop returns to the map with the same card
      picked and the same `data-scale`; an unsaved new line is said; every box button is 48 px or more and above
      the bottom edge at `phoneSideways`; no `/api/` call is made while trying.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): see and try a conversation as a player does`.
      Review pictures for Tasks 11 to 13. Report them.

---

## Pull request 6: cutscenes

### Task 14: Every change a cutscene can take

**Files:** Create `src/features/story/cutscene-edit.ts`, `timeline.ts`. Test
`tests/features/story/cutscene-edit.test.ts`, `timeline.test.ts`.

**Interfaces:**
- Consumes: the framework's `cameraAt`, `actorsAt`, `linesAt`, `levelSize`; Task 7.
- Produces:

```ts
// timeline.ts (pure)
export const TICKS = 60
export const SNAP = 6                       // a tenth of a second
export const MOST_TICKS = 3600
export function seconds(ticks: number): number            // to a tenth: 72 -> 1.2
export function snap(ticks: number): number
export type RowId = 'camera' | 'words' | string           // else an actor's `who`
export interface Row { readonly id: RowId; readonly keys: readonly { readonly index: number; readonly at: number
  readonly until?: number }[] }                           // `index` is the place in the file's own array
/** Camera first, then each actor in the order it first appears, then words. */
export function rowsOf(file: CutsceneFile): readonly Row[]
/** The ticks a key may be dragged between: its neighbors on its own row, 0 and the length. */
export function reach(file: CutsceneFile, row: RowId, index: number): { readonly from: number; readonly to: number }
// cutscene-edit.ts (each takes and returns StoryFiles, or says why not, as Task 9's `Did`)
export type SceneWhy = 'last-camera-key' | 'most-keys' | 'most-lines' | 'not-own-words' | 'no-such' | 'same' | 'outside'
export function moveKey(f, scene: string, row: RowId, index: number, to: number): Did    // snapped, kept inside `reach`
export function setCamera(f, scene, at: number, to: Partial<{ x: number; y: number; zoom: number; ease: Ease }>): Did
export function setActor(f, scene, who: string, at: number, to: Partial<{ x: number; y: number
  clip: string | undefined; face: 'left' | 'right' | undefined }>, level: Level): Did
export function addKey(f, scene, row: 'camera' | string, at: number, level: Level): Did
export function addLine(f, scene, at: number, own: Language): Did
export function setLineTimes(f, scene, index: number, at: number, until: number): Did
export function setLineSpeaker(f, scene, index: number, character: string | undefined): Did
export function eraseKey(f, scene, row: RowId, index: number): Did
export function setLength(f, scene, ticks: number): Did
export function setOpens(f, scene, on: boolean): Did
export function newCutscene(f, name: string, level: Level): Did
export function actorsOffered(level: Level, file: CutsceneFile): readonly string[]       // things and player-<n> not yet rows
```

Rules. `setCamera` and `setActor` change the key at exactly `at` on that row, or make one there holding what
`cameraAt` or `actorsAt` gives at `at` and then the change (so nothing jumps); a new camera key's ease is `smooth`;
a first key for an actor holds the thing's place in the level (a player's start for `player-<n>`). A key is put
in its array just after the last key of its row at or before `at`, so the file stays in time order. Places are
rounded to a tenth of a tile and kept inside the level ('outside' is never shown: the place is clamped); zoom is
kept in 0.25 to 4. `eraseKey` on the only camera key is 'last-camera-key'; erasing an actor's only key removes its
row; erasing a line calls `removeKey` when nothing else uses its key. `addLine` makes a line of two seconds at
`at`, cut to the length, with `cutsceneLineKey`, the words `storyNewLine`'s, and the speaker of the line before it;
'not-own-words' as in Task 9. `setLength` is kept between the last key or line end (and 6) and 3,600. Limits: 64
camera keys, 256 actor keys, 64 lines. `newCutscene`: the level given, length 300, one camera key at 0 at the
level's middle, zoom 1, `cut`, no actors, no lines.

- [ ] **Step 1: Failing tests** on the fixture's `door-opens`: `seconds(72)` is 1.2; `rowsOf` is camera, `keeper-1`,
      `player-1`, words; `reach` of the camera's second key is `{ from: 0, to: 300 }` (its only neighbor is the first
      key, at 0); `moveKey` past a neighbor stops at it; `setCamera` at 60 makes a key holding `cameraAt(file, 60)`
      and the camera at 59 and 61 is within a hundredth of what it was; `setActor('crate-1', 0, {})` makes a row at
      the crate's place; erasing the camera's last key is refused; `setLength(100)` stops at 180 (the line's end);
      a line added at 290 ends at 300; after every `did: true`, `parseContent('cutscene', …)` of the file passes
      and `checkStory` has no new problem.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): every change a cutscene can take`.

### Task 15: The stage

**Files:**
- Create: `src/features/story/stage-level.ts`, `CutsceneStage.svelte`, `CameraFrame.svelte`
- Test: `tests/features/story/stage-level.test.ts`, `cutscene-stage.browser.test.ts`

**Interfaces:**
- Consumes: `levels/Stage.svelte` as the redesign and its amendment made it (props `content`, `level`, `art`,
  `room`, `picked`, `mode`, `onpick`, `ondrag`, `ondragend`, `layer`); the framework's timeline functions; the
  framework's shot function from plan T's Task 11, put on the headless entry by Task 1 (gate G3b; audit I2).
- Produces:

```ts
// stage-level.ts (pure)
/** The level as it stands at tick `t`: each actor's thing (or player's start) where `actorsAt` says, the rest as written. */
export function levelAt(level: Level, file: CutsceneFile, t: number): Level
/** The camera's frame at `t`, in tiles, for a window of `shape`: the framework's own shot for the camera key at `t`
 *  (plan T's Task 11), so the frame is what the game shows on that window, wide screens showing more as
 *  `placeCamera` does. The editor works out no frame of its own (audit I2). */
export function frameAt(level: Level, file: CutsceneFile, t: number, shape: Shape): Box
/** The camera's middle for a frame dragged to `box`, kept inside the level. */
export function cameraFor(level: Level, box: Box): { readonly x: number; readonly y: number }
```

```
CutsceneStage.svelte  props: content, files, scene: string, art, shape, room, at: number (the playhead, ticks),
                      shown: Language, mode, tool: 'move' | 'key' | 'erase', picked: Picked | undefined,
                      onpick(picked | undefined), onchange(next: StoryFiles)
                      Picked = { row: RowId; index: number } | { thing: string }
```

`CutsceneStage` renders `Stage` with `level = levelAt(…)` (so the framework draws every thing where the cutscene
puts it, in the game's art), and in `Stage`'s `layer`, as page elements over the canvas: `CameraFrame`
(`data-camera`: a dashed rectangle in the words color with the note `storyCamera(zoom)` and a − and a + of 44 px;
a `button` that can be focused); a name `Chip` on each actor (its shown name, and its clip and facing in words
when its latest key names them); and the line on screen at `at`, in the framework's own box through `createBox`
with `watching: true`, inside the camera's frame. With `move`: dragging the frame calls `setCamera` at the
playhead; − and + step the zoom by 1.25; pinching inside the picked frame zooms the camera (ruling 16); with the
frame focused the arrows move it half a tile and `+` and `-` zoom it. Dragging an actor's thing calls `setActor`
at the playhead; a thing that is not an actor does not move, and the timeline's foot offers `storyAddActor(name)`
(Task 16). An actor the level no longer has (World removed the thing) is not drawn; its row carries the
framework's sentence. Nothing is drawn on the canvas.

- [ ] **Step 1: Failing tests.** `levelAt` at 0 has `player-1`'s start where the level has it and at 120 halfway
      between its two keys; a thing with no key is where the level has it. `frameAt` equals the framework's shot
      function for the same key and window at 0, 120 and 300, at the five sizes' shapes, and at 300 is smaller than at
      0 (zoom 1.5) and about the crate (audit I2). `cameraFor` never leaves the level.
      Browser (five sizes): `[data-camera]`'s box, turned back into tiles by the stage's fit, equals `frameAt`;
      dragging it by two tiles calls `onchange` with a camera key at the playhead two tiles on; + makes the frame
      smaller by 1.25; with the frame not picked a pinch inside it changes the stage's `data-scale` and not the
      zoom, and with it picked the other way round; dragging `keeper-1` makes a key; dragging `crate-1` (no row)
      changes nothing; the canvas's `toDataURL()` is the same with the frame, the chips and the box shown and
      hidden; a cutscene naming a thing the level lacks renders and throws nothing.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): a cutscene staged on the level's own art`.

### Task 16: The timeline, a key's card, and Play

**Files:**
- Create: `src/features/story/Timeline.svelte`, `KeyCard.svelte`, `CutscenePanel.svelte`, `cutscene-play.ts`,
  `Cutscene.svelte` (the part: stage, tools, timeline, card)
- Modify: `src/features/suite/StoryScreen.svelte`
- Test: `tests/features/story/timeline.browser.test.ts`, `cutscene-play.test.ts`,
  `tests/journeys/story-cutscene.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// cutscene-play.ts: the playhead while Play is on, from a clock that is handed in
export interface Playing { readonly from: number; readonly startedAt: number }      // ticks, milliseconds
export function playheadAt(playing: Playing, now: number, length: number): { readonly at: number; readonly ended: boolean }
```

`Timeline` (`data-part="timeline"`, closable, ruling 15): a ruler in seconds (`.measure`, a mark each second, a
label every second on `wide` and every five on narrower); one row per `rowsOf` (44 px tall, its name on the left:
`storyRowCamera`, the actor's shown name, `storyRowWords`); a key is a diamond `button` (`data-key`, 44 px to
press), a line a bar with a handle at each end; between two camera keys the ease in words (`storyCut`,
`storySteady`, `storySmooth`), pressed to step through the three; the end is a line with a handle (`setLength`)
labeled `storyEndsAt(seconds)`; the playhead (`data-playhead`) is a line with a 44 px grip and its time. Pressing
the ruler or dragging the grip moves the playhead (snapped). Dragging a key calls `moveKey`; with a key focused,
Left and Right move it a tenth of a second. Under the rows: `storyAddActorRow` (a menu of `actorsOffered`, each
with its picture and name). Tools (`data-tool`): `move`, `key` (press a row to add a key at the playhead:
`addKey`, or `addLine` on words), `erase` (press a key or a line; the camera's last key shows `storyLastKey`),
`play` (plays from the playhead by `requestAnimationFrame` and `playheadAt`, the stage following; it turns into
`storyPause`; at the end it stops at the end). `KeyCard` (`data-part="card"`), for the picked key: `storyWhen`
(seconds, − and + a tenth); for the camera `storyWhere` (x and y to a tenth, − and +), `storyHowClose` (zoom) and
`storyHowItGetsThere` (the three eases); for an actor where, `storyClip` (the character's clips by name, and
`storyNoChange`) and `storyFaces` (left, right, no change); for a line its words (a text box, as in a
conversation, in `shown`), `storyWho`, `storyFrom` and `storyUntil`. With nothing picked, `CutscenePanel`: the name
(read only), `storyStagedIn(level)` (read only), `storyLength` (seconds, − and +), and the switch
`storyPlaysAtStart` (`setOpens`; the framework's sentence shows when another cutscene already opens that level).

- [ ] **Step 1: Failing tests.** `playheadAt` after 1,000 ms from 0 is 60; past the length it is the length and
      `ended`. Browser (five sizes): rows and keys match `rowsOf`; a key's left edge is at its `at` on the ruler;
      the ruler shows seconds and never a tick count (no text on the timeline matches a bare number over 60);
      dragging a key past its neighbor stops there; the ease's words step Cut, Steady, Smooth; on `phoneSideways`
      the sheet rests as one line and pulls up to three rows that scroll inside it; every key, handle and grip is
      44 px or more to press; all of it in the nine languages with nothing cut. Journey (five sizes, three engines),
      an Owner: open Door opens from Story's page; move the playhead to 1.0 s; drag the camera's frame and see a
      new diamond at 1.0; pinch the picked frame; drag the keeper; add a key on the hero's row; drag it; erase it;
      the camera's last key will not erase and says why; add the crate as an actor; add a line, type its words,
      change its times by its handles and by the card; switch "Plays when the level starts" on; press Play, see
      the playhead move and the line appear, Pause; Undo back to the start one step at a time and Redo; close and
      open the timeline; Look level sees it all and can press only Play. `broken(page, true)` is empty at each
      step; pictures `story-cutscene`, `-key-picked`, `-playing`, `-timeline-closed`.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): a cutscene's timeline, keys and Play`.

### Task 17: A new cutscene, and Try it in the game

**"Try it in the game" waits for G5.** If the redesign's Task 19 is not on `main`, build "Add a cutscene", report
that the other half waits, and stop this task there; it is then its own small pull request.

**Files:**
- Create: `src/features/story/NewCutscene.svelte`, `TryInGame.svelte`
- Modify: `StoryPage.svelte`, `CutscenePanel.svelte`
- Test: `tests/features/story/new-cutscene.browser.test.ts`, `tests/journeys/story-try-game.journey.test.ts`

"Add a cutscene" on Story's page: its name, then its level (a `Choice` of the game's levels, each with its
`Thumb`), then `newCutscene` and its stage opens. `TryInGame` (`storyTryGame` on the cutscene's panel): the
redesign's `Play` of the cutscene's level, with ruling 18's copy of the content, so the cutscene plays first
through the framework's real story feature; `storyStop` top left; what Play says for a game it cannot play, it
says here. It changes nothing.

- [ ] **Step 1: Failing tests.** Browser: the two questions, then a cutscene with one camera key, five seconds and
      `touched` listing the new file. Journey (five sizes, three engines): add "Big reveal" in Level 1 and see its
      stage; Try it in the game shows the level, the camera moves and "The door is open!" is on screen in the
      framework's box, Stop returns to the stage unchanged; a save of the new cutscene puts its file
      in the game's cutscenes folder (the pretend GitHub's `main` loads with `loadGame`).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): add a cutscene, and try one in the game`.
      Review pictures for Tasks 15 to 17. Report them.

---

## Pull request 7: words, and saving with six languages

### Task 18: The words as a table, pure

**Files:** Create `src/features/story/words-table.ts`. Test `tests/features/story/words-table.test.ts`.

**Interfaces:**
- Produces:

```ts
export type CellState = 'missing' | 'changed' | 'read' | 'unread' | 'own' | 'no-file'
export interface Cell { readonly language: Language; readonly text: string | undefined; readonly state: CellState
  readonly problems: readonly string[]; readonly readBy?: LineBy }
export interface WordRow { readonly key: string; readonly uses: readonly Use[]; readonly cells: readonly Cell[] }
export interface WordGroup { readonly kind: Use['kind']; readonly id: string; readonly rows: readonly WordRow[] }
export type Filter = 'all' | 'missing' | 'unread' | 'changed'
export function wordsTable(content: GameContent, edit: StoryEdit, history: WordsHistory | undefined,
  problems: readonly Diagnostic[]): readonly WordGroup[]                    // ruling 12's order; rows by key
export function filtered(groups: readonly WordGroup[], filter: Filter, find: string): readonly WordGroup[]
/** The columns a shape shows: all six on `wide`, else the game's own and `picked`. Always in LANGUAGES order. */
export function columnsFor(shape: Shape, has: readonly Language[], own: Language, picked: Language): readonly Language[]
export function wordsCount(content: GameContent, files: StoryFiles): { readonly words: number
  readonly worst?: { readonly language: Language; readonly missing: number } }
```

A cell's state: the game's own language is `own`; a language with no file `no-file`; no text `missing`; a mark that
equals `readMark` of the two texts as they are now `read`; else `changed` when the game's own text was changed in
this edit after this cell's, or `history` says the game's own line is newer than this cell's line; else `unread`.
A row is in the first group that uses it (ruling 8). `filtered` keeps a row with any cell in that state (never the
`own` column's), and with `find` any cell whose text holds every typed word, ignoring case and accents.

- [ ] **Step 1: Failing tests.** The fixture: groups Keeper, Door opens, Names, Level names, Buttons, in that
      order, ten rows in all; `keeper.hello.1` in Korean is `read`, the rest `unread`; `story-gaps`: three
      `missing`; `no-korean`: the Korean column is `no-file` for every row; after `setLine` in English,
      the five other cells of that row are `changed` and the Korean tick is gone; with history where English is
      newer, `changed` with no edit; `filtered(…, 'missing', '')` keeps three rows; `find` "puerta" finds the
      Spanish door line; `columnsFor('narrow', all, 'en', 'ko')` is `['en', 'ko']` and for `wide` all six in
      order.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): every word, as rows and states`.

### Task 19: The Words part

**Files:**
- Create: `src/features/story/WordsTable.svelte`, `WordCell.svelte`, `braces.ts`, `Words.svelte` (the part)
- Modify: `StoryScreen.svelte`, `src/features/api/api.ts` use of `wordsHistory`
- Test: `tests/features/story/braces.test.ts`, `words-table.browser.test.ts`,
  `tests/journeys/story-words.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// braces.ts (pure)
/** A text cut into words and values: 'Waiting for {count}' -> ['Waiting for ', { name: 'count' }]. */
export function pieces(text: string): readonly (string | { readonly name: string })[]
/** May this text replace that one in a translated cell? False when it loses a value the game's own text has. */
export function keepsValues(own: string, next: string): boolean
```

`Words` (`data-part="words"`): the title-block-style table inside the frame, under the pill and cluster, scrolling
up and down inside itself (ruling 14). A row of filters at its top (`data-filter`: `wordsAll`, `wordsMissing(n)`,
`wordsUnread(n)`, `wordsChanged(n)`, each with its count). Columns by `columnsFor`; each headed by the flag and
the language's own name; the game's own carries the label `wordsOwn`. On `mid` and `narrow` a row of the game's
flags above the table picks the second column. A group's heading is its name in words (`nameOf`, or `wordsNames`,
`wordsLevels`, `wordsButtons`, `wordsRest`) and links to its conversation or cutscene. `WordCell` (`data-cell`,
`data-state`, `lang`): the words with each value as a `Chip` (`pieces`); `wordsNotWritten` in the touch color for
`missing`; `wordsCheck(flag)` for `changed`; `wordsNoFile(language)` once at the column's head for `no-file`
(its cells are empty and cannot be pressed). Pressing a cell turns it into a text box that grows, with the
framework's sentences for that key and language live under it (from `checkStory`, 300 ms after the last key), and
under a translated box one `Chip` button per value of the game's own text that inserts it. A change that would
lose a value the game's own text has is undone as it is typed, pasted or composed (checked on `input`, and again
at `compositionend`), with `wordsKeep(name)` under the box. Leaving the box applies `setText` (an empty box on a
translated cell removes that language's words for the key; on the game's own cell it is refused with
`wordsOwnNeeded`). A row used in more than one place has the chip `wordsUsedIn(n)`, which opens the list. The
find bar's field filters the table by any language's text while Words is open. The game's script fonts load only
when a column or a map in that script is shown, by the redesign's Task 17 loader. A Look level reads everything
and presses nothing but the filters.

- [ ] **Step 1: Failing tests.** `pieces` and `keepsValues` (a lost `{count}`, a misspelled `{Count}`, an added
      `{name}` is allowed here and left to the framework's sentence). Browser (five sizes): on `wide` six columns
      in `zh es en pt ja ko` order and the game's own marked; on `phone` two; the filters' counts match
      `wordsTable`; `story-gaps` under "Missing" shows three rows; a `controls.jump` of 13 characters shows the
      framework's sentence while typing; selecting all and typing over a `{count}` text puts it back and says
      why; a paste of 5,000 characters shows the framework's sentence and Save (Task 21) will not send; a text of
      only spaces is refused; an IME composition (`compositionstart`, `input`, `compositionend`) that keeps the
      value is kept; `no-korean`'s Korean column says its one sentence. Journey (five sizes, three engines), an
      Owner on `story-gaps`: open Words from Story's page; press "Missing"; write the Korean word; the count goes
      to 2; pick Japanese by its flag on a phone; write both; "Missing" is empty and says `wordsNoneMissing`;
      find "door"; the heading "Keeper" opens the map and Back returns; Undo takes the last word away.
      `broken(page, true)` is empty; pictures `story-words`, `-missing`, `-editing`, `-two-columns`.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): every word in six languages, side by side`.

### Task 20: Read by someone who speaks it

**Files:** Create `src/features/story/marks.ts`. Modify `WordCell.svelte`, `Words.svelte`. Test
`tests/features/story/marks.test.ts`, `tests/journeys/story-read.journey.test.ts`.

**Interfaces:**
- Consumes: the framework's `markRead`, `readMark`, `emptyReadMarks`; `ui/Face.svelte`, `game/faces.ts`.
- Produces:

```ts
export function tick(content: GameContent, files: StoryFiles, language: Language, key: string): StoryFiles    // markRead with [key]
export function untick(files: StoryFiles, language: Language, key: string): StoryFiles
export function tickAll(content: GameContent, files: StoryFiles, language: Language, keys: readonly string[]): StoryFiles
```

Each translated cell that has words carries a 44 px tick button, `wordsRead` (`aria-pressed`). Ticked, it shows
the face of whoever wrote that line of the marks file (`history.read`), or the person's own for a tick not saved
yet, with `wordsReadBy(name, ago)` as its name. Changing either text unticks it by the framework's own rule (the
mark no longer matches): nothing here removes a mark for that. Above a translated column, `wordsReadAll(language)`
ticks every unread cell now showing (after one "Are you sure" notice naming the count). A marks file that cannot
be read (`OpenGame.marksProblem`) shows the framework's sentences once above the table with `wordsMarksMend`:
the next tick writes the file afresh.

- [ ] **Step 1: Failing tests.** `tick` then `writeReadMarks` equals what `markRead` and `writeReadMarks` give by
      hand for the same key; `untick` removes only that key; `tick` on the game's own language changes nothing.
      Journey (five sizes, three engines): an Owner ticks the Korean "Lovely day." and Saves: the pretend GitHub's
      marks file gains exactly that line and the cell shows the Owner's face; changing that Korean text unticks
      it at once; a second person opens Words and sees the first one's face and "Read by grandma, 2 minutes ago";
      "Mark all Korean as read" asks, naming the count, then every Korean cell is ticked; a Look level sees ticks and cannot press them.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): a native speaker marks words as read`.

### Task 21: Save, Export, and waiting for words

**Files:**
- Modify: `src/features/suite/StoryScreen.svelte`, `Cluster.svelte`, `WaitingChange.svelte`, `Waiting.svelte`,
  `GameHome.svelte`, `LevelScreen.svelte` (World's stamp: the one change to World, audit I8),
  `src/features/story/Words.svelte`; `tests/fixtures/fake-github/` (it sends a signed `check_suite` event to
  `/api/github-hook` when a test sets a commit's checks to passing, as GitHub would)
- Create: `src/features/suite/finish.ts`, `src/features/story/change-words.ts`
- Test: `tests/features/suite/finish.test.ts`, `tests/features/story/change-words.test.ts`,
  `tests/journeys/story-save.journey.test.ts`, `story-waiting-words.journey.test.ts`, `story-export.journey.test.ts`,
  `story-never-red.journey.test.ts`, `story-approve.journey.test.ts`

**Interfaces:**
- Consumes: `saveStory`, `storyCopy`, `zipOf`, the drafts (Task 7); `api.finish`; the redesign's `Stamp`, `Notice`,
  `SignInPanel`, `Leave`, `keepCopy`.
- Produces:

```ts
// suite/finish.ts
export const FINISH_AFTER_MS = [5_000, 10_000, 20_000, 40_000] as const
/** Tries `finish` now and after each wait while `alive()`; stops at the first answer that is not 'not-ready'. */
export function finishWhenReady(api: Api, game: GameRef, number: number, wait: (ms: number) => Promise<void>,
  alive: () => boolean): Promise<'in' | 'waiting' | ProblemKind>
/** The waiting changes a person who may save should finish on sight: words there, checks passing, goes in. */
export function readyToFinish(waiting: readonly Waiting[]): readonly Waiting[]
// story/change-words.ts (pure): what an approver reads about a Story change (audit I7)
export type ChangeLine =
  | { readonly kind: 'says'; readonly who: string; readonly before: string; readonly after: string }
  | { readonly kind: 'added' | 'removed'; readonly who: string; readonly words: string }
  | { readonly kind: 'wrote'; readonly language: Language; readonly count: number }
  | { readonly kind: 'read'; readonly language: Language; readonly count: number }
  | { readonly kind: 'changed'; readonly name: string }     // a step's way on, a cutscene's keys, a character's starter
/** Each Story file the change touches, before (the default branch) and after (the change's branch), in plain lines:
 *  the conversation or cutscene by its shown name, each line in `shown`. */
export function changeLines(before: StoryFiles, after: StoryFiles, shown: Language): readonly ChangeLine[]
/** True when every word the save leaves missing was already missing in the game as opened (audit M10). */
export function onlyOldGaps(opened: MissingWords, missing: MissingWords): boolean
```

`finishWhenReady` and the on-sight `finish` are the fallback: the App finishes a change itself when GitHub tells it
the checks passed (`/api/github-hook`, Task 6; the Owner's answer to the audit's I5), so `storyGoesInSoon` is true
as written, and the page's tries only make "It is in the game now" show sooner when the screen is still open.

What each press does (the stamp never moves the canvas, as in World):

| Press | Who and what | What happens |
|---|---|---|
| Save | may save straight in; nothing missing | `stampSaved`, `stampBy(name, justNow)` |
| Save | anyone who may save; words missing | `stampSaved`, `storyWaitingWords(languages)` with the flags ("Waiting for words in Korean, Japanese and 3 more"), and under it the line `storyTeamWrites` and the link `storySeeMissing` (Words, filtered to Missing) |
| Save | the same, when `onlyOldGaps` (the game already lacked those words; audit M10) | `stampSaved`, `storyWaitingOld(languages)` in place of `storyWaitingWords`, the same line and link |
| Save | Suggest or Approve; nothing missing | `stampSaved`, `stampWaiting`, as today |
| Save | the save that fills the last word of a change that goes in | `stampSaved`, `storyEveryWord`; the line `storyGoesInSoon`; `finishWhenReady`; on `'in'` the line becomes `storyInNow`; on `'waiting'` it stays |
| Save | the same, for a change that needs approval | `stampSaved`, `storyEveryWord`, `storyNowApprove`; `storyYouApprove` when the person saving may approve it themselves (the audit's Q-B person; M11) |
| Save | a change that clashes with `main` (audit I6) | the App brings it up to date (Task 6's `bringUpToDate`) and the line stays `storyGoesInSoon`; a key both sides changed is the notice `storyBothChanged(key)` with both texts and the two buttons `storyKeepMine` (main) and `storyKeepTheirs`, which save into the change with `into` |
| Save in World | someone whose waiting change is waiting for words (`mine.words` not empty) | World's stamp adds the line `worldIntoWords` under `stampWaiting`: the one change this plan makes to World (audit I8) |
| Save | a visitor | the notice `saveWhy` with Sign in and `exportInstead`; the draft keeps the change through the sign-in |
| Save | the framework has a problem with the change (`checkStory`) | nothing is sent; a problem notice with the sentences, each a link to the card, key or cell it is about |
| Export | anyone | `storyCopy`'s text to the clipboard; `stampExported`, `stampCopied`; `copyKeep` gives the one file or the zip (`story-change.zip`); the clipboard refused: the text selected in a notice, as in World |
| changed elsewhere | signed in | today's notice; "Show the newest" opens the game again and lays the kept draft over it where each file's version allows, saying which files could not be kept |
| leaving with unsaved changes | anyone | the redesign's `Leave` |

With `?change=<number>` (someone else's waiting change, or my own), the pill reads `storyWordsFor(by)`, only the
Words part can be changed (the map and the stage are Look), and the main button reads `storyAddWords` and saves
with `into`. The waiting list and a waiting change's screen show, for a change with `words` not empty,
`storyWaitingWords(…)` in place of its checks' words, and its main button is `storyWriteMissing`, which opens
`#/game/o/n/story/words?change=<number>&show=missing`; with `words` empty and `goesIn` it reads `storyGoesInSoon`.
`GameHome` and `Waiting`, for a person who may save, call `finish` once for each of `readyToFinish` and show the
list again. **A waiting change's screen shows a Story change** (audit I7): beside the levels it already draws, for
each Story file the change touches (the paths `showChange` already judges with `allowedPaths`), the plain lines of
`changeLines`, each in the editor's words (`storyChangeSays`, `storyChangeAdded`, `storyChangeRemoved`,
`storyChangeWrote`, `storyChangeRead`, `storyChangeOther`), at most eight and then `storyAndMore(n)`; and one
button, `storyOpenIn`, that opens it in Story at Look on that change (`#/game/o/n/story/page?change=<number>`).
Approve stays where it is, and the approver needs nothing else to judge it.

- [ ] **Step 1: Failing tests.** `finishWhenReady` with a clock handed in: 'not-ready' three times then in; stops
      when `alive()` is false; a refusal is returned at once. `changeLines`: the fixture with "Hello there!" changed
      is one `says`; five Korean lines written is one `wrote` with 5; a moved camera key is one `changed` named
      "Door opens"; the same files give nothing. `onlyOldGaps`: true when each language's count is at most the
      opened game's, false when one rises. `readyToFinish` keeps only `words` empty, `goesIn`
      and `checks: 'passing'`. Journeys (five sizes, three engines; the pretend GitHub's checks are set by the
      test): **straight in:** an Owner changes "Hello there!" and Saves: SAVED, one commit on `main` holding one
      file whose bytes equal `writeContent` of the same change made by hand in the test. **Waiting for words:** an
      Owner adds a line and Saves: "SAVED", "Waiting for words in" five languages by name in the editor's
      language, `main` is untouched, the game's page lists the change with the same words; a second person (Edit)
      opens it, sees Words filtered to five missing cells, writes all five, presses "Add words to this change":
      "SAVED, every word is there"; the test sets the checks to passing; within the tries it reads "It is in the
      game now" and `main` has the line in six languages. **Suggest:** a Suggest person's complete change waits
      for approval; their incomplete one says words first, then, completed by another, "Now someone approves it",
      and Approve by an Approver puts it in, after reading on the change's screen "Keeper: 'Hello there!' becomes
      'Hello, friend!'" and "Korean: 5 words written", and pressing "Open in Story" to see the map at Look on that
      change (`story-approve.journey.test.ts`, audit I7). **Q-B's person** (an Owner through GitHub only) reads
      "Now you can approve it" after the last word (M11). **World joins it** (I8): an Owner with a words change
      waiting moves the crate in World; the stamp says "Saved into your change that is waiting for words" and
      `main` is untouched. **Old gaps** (M10): in `story-gaps`, a save that changes only an English line says
      "Waiting for words the game was already missing". **A clash** (I6): a waiting words change, then an Owner's
      save straight in that adds a line beside it; the checks set to passing, the waiting change still goes in and
      `main` has both lines. **The hook** (I5): with the screen closed, the test sets the checks to passing; the
      pretend GitHub sends the signed event and `main` has the words without any page calling `finish`.
      **Two at once (Review Focus 4):** two people open the same waiting
      change, both write Korean; the second Save says changed elsewhere, "Show the newest" keeps their words in
      the boxes, and their next Save goes in. **Export** of a change across the conversation and two messages
      files: the clipboard holds three `=== path ===` blocks equal to the three files' bytes and no `/api/save`
      call was made; "Save it as a file" downloads a zip. **A visitor's** Save shows the panel and Export
      exports. **A problem** (a choice pointing at a removed step, forced by the test through the draft) is not
      sent and its notice links to the card. **Never red** (`story-never-red.journey.test.ts`): after every save
      in this file and in Tasks 12, 16, 17, 19 and 20's journeys that went straight in, the test reads the pretend
      GitHub's `main`, runs `loadGame` and `translationProblems`, and fails on any problem (a helper,
      `expectMainGreen(game)`, in `tests/fixtures/journey.ts`, called at the end of each such journey).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): one save for the whole change, and words that wait for their languages`.
      Review pictures for Tasks 18 to 21. Report them.

---

## Pull request 8: the first run, find, and every screen pictured

### Task 22: Story's first run

**Files:** Create `src/features/story/guide.ts`. Modify `StoryScreen.svelte`, `StoryPage.svelte`. Test
`tests/features/story/guide.test.ts`, `tests/journeys/story-first-run.journey.test.ts`.

**Interfaces:**
- Consumes: the redesign's `Tip.svelte`, `af.saved`, the `af.tip.*` stores.
- Produces:

```ts
export type StoryTip = 'words' | 'keep' | 'camera' | 'start' | 'none'
export interface StoryTipFacts { readonly wanted: boolean        // af.tip.story is not set
  readonly mode: 'edit' | 'look'; readonly part: 'conversation' | 'cutscene' | 'words' | 'page'
  readonly conversations: number; readonly cutscenes: number; readonly dirty: boolean; readonly kept: boolean }
export function storyTip(facts: StoryTipFacts): StoryTip
export function storyTipFor(tip: StoryTip, facts: { visitor: boolean; canSave: boolean; speaker: string
  startStep: string }): { readonly text: string; readonly target: string } | undefined
export function storyTipsWanted(store: Storage): boolean
export function finishStoryTips(store: Storage): void
```

`storyTip`: not wanted, or Look, is `none`; kept (a save or an export since the tip began) ends it
(`finishStoryTips`) and is `none`; dirty is `keep`; on a conversation `words`; on a cutscene `camera`; on Story's
page with no conversation and no cutscene `start`; else `none`. `words` is `storyTipWords(speaker)` ("Tap the
keeper's words to change them") at the start card; `keep` is `tipExport` at Export for a visitor and `guideSave`
at Save for someone who may save; `camera` is `storyTipCamera` at `[data-camera]`; `start` is `storyTipStart` at
the "Add a conversation" card. The tip carries `tipsHide`. On a first visit to Story the game's first conversation
opens (ruling 17 does this already) with its start card in view: pressing the card's words opens its panel with
the first line's box focused. After the stamp, the run is over; a waiting-for-words stamp carries
its one quiet line (Task 21).

- [ ] **Step 1: Failing tests.** Every row of `storyTip`; a store that throws counts as wanted; a visitor's `keep`
      targets Export. Journey (five sizes, three engines): **a visitor** opens Story on the demo game: the tip
      points at the start card within 24 px and overlaps no part; they tap, type, leave the box: "Nice. Now press
      Export to keep it."; Export: "EXPORTED", "Copied for your agent"; a reload shows no tip; the whole run is
      one tap, some typing and one press. **Signed in:** the same to "Nice. Now press Save." and "SAVED". **A new
      line in the first run** ends in "SAVED, waiting for words in 5 languages" with the quiet line. **A game
      with only cutscenes:** "Drag the camera". **A game with neither:** "Start a conversation here". **Hide
      tips** ends them; opening the find bar hides the tip and closing brings it back.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): the first run ends in a real change`.

### Task 23: Find or do anything, in Story

**Files:** Modify `src/features/find/commands.ts`, `scripts/write-commands.ts` only if a kind needs it,
`docs/commands.md` (by hand; the check says if it differs), `src/features/suite/StoryScreen.svelte`,
`src/features/words/*.ts`. Test `tests/features/find/commands.test.ts`, `tests/docs/commands.test.ts`,
`tests/journeys/story-find.journey.test.ts`.

`FindFacts` gains `story?: { part, talk?, scene?, step?, key?, tool, playing, filter, change?, conversations,
cutscenes, languages, shown, canUndo, canRedo }`; `FindDoes` one function per kind. Story's kinds, in this order
after World's, each with its `words` key and the file change it makes in `COMMAND_KINDS`:

| Id | Name (English) | Shown when | File change |
|---|---|---|---|
| `open-story-page` | Open Story's page | in Story | nothing |
| `open-talk:<id>` | Open Keeper | the game has it | nothing |
| `open-scene:<id>` | Open Door opens | the game has it | nothing |
| `open-words` | Open the words | the game has words | nothing |
| `add-talk`, `add-scene` | Add a conversation, Add a cutscene | may change | a new file in the kind's folder (and, once, the folder's entry in `automata.toml`) |
| `add-step` | Add a step | a conversation is open | a step in `nodes`, a key in the game's own messages file |
| `add-line`, `add-choice`, `remove-step`, `start-here` | Add a line, Add a choice, Remove this step, Start here | a card is picked | `lines`, `choices`, `nodes`, `start`, and the messages files |
| `try-talk` | Try it | a conversation is open | nothing |
| `show-words:<language>` | Show the words in Korean | the game has it | nothing: this visit only |
| `scene-move`, `scene-key`, `scene-erase` | Move, Add key, Erase (the tools) | a cutscene is open | nothing |
| `add-camera-key`, `add-actor-key:<who>`, `add-actor:<who>`, `add-scene-line` | Add a camera key, Add a key for Keeper, Add Crate to the timeline, Add words on screen | a cutscene is open | `camera`, `actors`, `lines` |
| `erase-key` | Erase this key | a key is picked | the key's entry |
| `play-scene`, `pause-scene`, `try-in-game` | Play the cutscene, Pause, Try it in the game | a cutscene is open | nothing |
| `playhead-start`, `playhead-back`, `playhead-on` | Go to the start, Back a tenth of a second, On a tenth of a second | a cutscene is open | nothing |
| `plays-at-start` | Play when the level starts (on or off) | a cutscene is open | `opens` |
| `show-missing`, `show-unread`, `show-changed`, `show-all-words` | Show missing words, Show words not read yet, Show changed words, Show every word | Words is open | nothing |
| `mark-read`, `unmark-read` | Mark as read, Not read after all | a translated cell with words is picked | `automata.translations.toml` |
| `add-words` | Add words to this change | a waiting change is open | the messages files, on that change |

`save`, `export`, `undo`, `redo`, the panels, the zoom and the language kinds are the redesign's and work in Story
through `StoryScreen`.

- [ ] **Step 1: Failing tests.** `commandsFor` with a conversation open and nothing picked has `add-step` and
      `try-talk` and no `add-line`; with a card picked it has them; Look has none that change a file; a visitor has
      `export` and no `save`. The docs test: `docs/commands.md` has every kind above with its name in nine
      languages and its file change. Journey (five sizes): by keyboard, "Open Door opens", "Add a camera key",
      "Play the cutscene", "Open the words", "Show missing words", "Open Keeper", "Add a step", "Try it"; each
      does what its button does.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(story): every Story action by name, and documented`.

### Task 24: Every Story screen pictured, the layout rules, the docs

**Files:**
- Create: `tests/fixtures/story-scenes.ts`, `tests/journeys/screens-story.journey.test.ts` (split in two files if
  it would pass 600 lines)
- Modify: `tests/fixtures/measure.ts` (only if a Story part needs a rule it lacks), `CLAUDE.md`, `README.md`,
  `docs/teams.md` (waiting for words, in a team's words), `docs/superpowers/progress.md`
- Test: `tests/docs/docs.test.ts`, `tests/features/words/tables.test.ts` (already holds every key to nine languages)

- [ ] **Step 1:** `story-scenes.ts` lists every state of Appendix B as the redesign's `scenes.ts` does (`{ name,
      reach(size), stage? }`). Each runs at the five sizes in three engines, is pictured as
      `<name>-<width>x<height>`, then measured with `broken`: every rule of the redesign's "Layout rules as tests"
      holds on every Story screen, and for the map and the stage "the canvas never moves under a finger"
      (`data-scale` and the first card's or thing's box equal before and after a pick, a stamp and a notice).
      The `de`, `ru` and `ja` scenes and the long-names game run the map, the timeline and Words.
- [ ] **Step 2:** The art-untouched test on the stage and on both speech boxes (Tasks 13 and 15) runs in this file
      too, at the five sizes.
- [ ] **Step 3:** Docs. `CLAUDE.md`: `story` in the features list and the structure; the two exceptions to
      "content files only" and the one route GitHub calls (`/api/github-hook`); the device list (`af.tip.story`, the Story draft, `timeline`). `README.md`: what Story
      is, in four sentences. `docs/teams.md`: what "Waiting for words" means for a team and its agent, and that a
      waiting change's checks fail until the words are there. The docs tests read each.
- [ ] **Step 4:** Push; green. **Review pictures: the full set, every scene of Appendix B at five sizes, saying
      these are the final look.** Tracker: stage 4 done (but for Task 17's second half if G5 is still closed).
      Report the summary: each task's commit and test count, every ruling made on the way, every deviation, what
      is not done.

---

## After the build (stages 5 and 6)

Two audits over every Story screen, as the spec says: the drunk-grandma audit on Opus (every word in nine
languages back-translated, every screen walked by touch), and the visual audit on Fable against the approved
mockup. Then fixes, then the Owner's review of the pictures.

## Appendix A: new words (English, `en.ts`)

Names in `()` take values. Every key is in all nine tables in the task that first uses it.

```
storyWords              Words
storyNoWords            This game has no words yet. Ask your agent to add its words, then come back.
storySetUpTalks         Set up conversations
storySetUpScenes        Set up cutscenes
storySetUpWhy           This adds one line to your game's list of files, once. After that, new ones just work.
storyAddTalk            Add a conversation
storyAddScene           Add a cutscene
storyNameAsk            What is it called?
storyLevelAsk           Which level is it in?
wordsCard(n, lang, m)   {n} words, {m} missing in {lang}
wordsCardFull(n)        {n} words, all six languages
storyStarts             Starts here
storyEnds               Ends
storyPlays(name)        Plays: {name}
storyThenChip           Then
storyNobody             Nobody (a sign or a thought)
storyNotWritten(lang)   Not written in {lang} yet
storyWho                Who says it
storyWhat               What they say
storyAddLine            Add a line
storyMostLines          That is the most lines one step can hold. Add a step for more.
storyThen               Then
storyThenPicks          The player picks
storyThenGoes           It goes on to
storyThenEnds           It ends
storyGoesTo             Goes to
storyNewStep            A new step
storyAddChoice          Add a choice
storyMostChoices        Four choices is the most. Remove one to add another.
storyAndPlays           and plays
storyNothing            Nothing
storyRemoveStep         Remove this step
storyRemoveAsk(what)    {what} goes here. Remove that too?
storyRemoveToo          Remove them too
storyKeepAll            Keep everything
storyOwnFirst(lang)     New lines start in the game's own words, {lang}. Your team writes the other languages after.
storyShowOwn(lang)      Show {lang}
storyNewLine            Write what they say
storyStartsWhen         Starts when the hero walks up to
storyOpensOn            Opens on
storyTry                Try it
storyTryFrom            Try it from here
storyStop               Stop
storyTryEnd             The conversation ends here.
storyTryPlays(name)     Then it plays: {name}
storyTryAgain           Try again
storyCamera(zoom)       Camera, zoom {zoom}
storyRowCamera          Camera
storyRowWords           Words
storyCut                Cut
storySteady             Steady
storySmooth             Smooth
storyEndsAt(s)          Ends at {s} s
storyAddActorRow        Add someone to the timeline
storyAddActor(name)     Add {name} to the timeline to move it
storyLastKey            The camera needs one key. Move it instead.
storyPause              Pause
storyWhen               When
storyWhere              Where
storyHowClose           How close
storyHowItGetsThere     How it gets there
storyClip               What it does
storyFaces              Which way it faces
storyNoChange           No change
storyFrom               From
storyUntil              Until
storyStagedIn(level)    Staged in {level}
storyLength             How long
storyPlaysAtStart       Plays when the level starts
storyTryGame            Try it in the game
wordsOwn                The game's own words
wordsAll                Everything
wordsMissing(n)         Missing ({n})
wordsUnread(n)          Not read yet ({n})
wordsChanged(n)         Changed ({n})
wordsNoneMissing        Nothing is missing. Every word is in every language.
wordsNotWritten         Not written yet
wordsCheck(flagName)    The {flagName} words changed. Check this still fits.
wordsNoFile(lang)       This game has no {lang} words yet. Ask your agent to add them.
wordsKeep(name)         Keep {name}. The game puts a number or a name there.
wordsOwnNeeded          The game's own words cannot be empty. Remove the line on its card instead.
wordsUsedIn(n)          Used in {n} places
wordsNames              Names
wordsLevels             Level names
wordsButtons            Buttons
wordsRest               Everything else
wordsRead               Read by someone who speaks it
wordsReadBy(name, ago)  Read by {name}, {ago}
wordsReadAll(lang)      Mark all {lang} as read
wordsReadAllAsk(n)      Mark {n} words as read? Only do this if you speak the language and read each one.
wordsMarksMend          The list of read words could not be opened. Your next tick starts it again.
storyWaitingWords(l)    Waiting for words in {l}
storyAndMore(n)         and {n} more
storyTeamWrites         Your team, or your agent, writes the other languages.
storySeeMissing         See what's missing
storyEveryWord          Every word is there
storyGoesInSoon         It goes into the game when its checks pass.
storyInNow              It is in the game now.
storyNowApprove         Now someone approves it.
storyYouApprove         Now you can approve it.
storyWaitingOld(l)      Waiting for words the game was already missing, in {l}
storyBothChanged(key)   Someone else changed these words too. Which do you keep?
storyKeepMine           Keep mine
storyKeepTheirs         Keep theirs
storyChangeSays(who, before, after)  {who}: “{before}” becomes “{after}”
storyChangeAdded(who, words)         {who} now says “{words}”
storyChangeRemoved(who, words)       {who} no longer says “{words}”
storyChangeWrote(lang, n)            {lang}: {n} words written
storyChangeRead(lang, n)             {lang}: {n} words marked as read
storyChangeOther(name)               {name} changed
storyOpenIn             Open in Story
worldIntoWords          Saved into your change that is waiting for words
storyWordsFor(by)       Words for {by}'s change
storyAddWords           Add words to this change
storyWriteMissing       Write the missing words
storyTipWords(name)     Tap {name}'s words to change them
storyTipCamera          Drag the camera
storyTipStart           Start a conversation here
storyWhy…               one plain sentence for each `Why` and `SceneWhy` not named above
```

`storySoonSave` exists only between Tasks 8 and 21 and is removed with its last use; no
"coming soon" is left on any Story screen when Task 24 ends.

## Appendix B: every Story screen state (the pictures and the scenes)

Story's page: with a conversation and a cutscene; empty (the two Add cards and the tip); no words; Look level.
The map: at rest; a card picked (panel on `wide`, sheet otherwise); in Korean with a line not written; a problem
card and a faded card; the step tool; a line's end being dragged; the remove notice; the conversation's own panel;
everything closed; zoomed in; a 40-step map opened on its start. Try it: a line; choices; the end panel. The
cutscene: at rest; the frame picked; a key picked (camera, actor, line); the timeline pulled up and resting on
`mid` and `narrow`; playing with a line on screen; the last-key notice; the new-cutscene questions; Try it in the
game. Words: all; Missing; a cell being written with a sentence under it; a value's chip; two columns with the
flag row; a ticked cell with a face; the no-file column; the mark-all notice. Saving: SAVED; waiting for words
(with the quiet line); every word is there; it is in the game now; a visitor's sign-in panel; EXPORTED; the
problem notice; changed elsewhere; a waiting change opened for its words; the waiting list with a words change;
waiting for words the game was already missing; now you can approve it; both changed the same words; a waiting
change's screen with its Story lines and Open in Story; World's stamp saved into a change waiting for words.
The first run: each of its three tips. Each of these in `en`; the map, the timeline and Words also in `de`, `ru`
and `ja` and with the long-names game.

## Self-review

- **Spec coverage.** Goals 1 to 7: Tasks 10 to 12 (the map), 7 and 9 (keys, never typed), 14 to 17 (the stage and
  timeline), 18 to 20 (words, six languages, read marks), 5, 6 and 21 (never red; the never-red journey), 22 (the
  first run), every task's journeys and 24 (pictures). "What Story edits": conversation (9, 12), cutscene (14 to
  17), messages (7, 19), a character's `conversation` (12, `setStarters`) and `name` (a row in Words' Names group,
  19), the marks (20). The frame and Story's page: 8. Try it: 13. Saving with six languages, every bullet: 5, 6,
  21. Find and agents: 23. Languages: Global Constraints, 19 (fonts), 24. Depends on: the gates. Testing: each
  task, 21 (same bytes, never red), 10 and 11 (the map), 24 (layout rules, art untouched).
- **Left to the builder, each settled:** the map's rules (ruling 3, Task 10); several files and adding words
  (rulings 4 and 5, Tasks 4 to 6); the framework asks (ruling 2, Task 1); Export's form (ruling 11); the Words
  groups and a word used twice (rulings 8 and 12); the cut into pull requests (eight, above); every screen state
  (Appendix B).
- **Not in the spec, added by this plan and flagged:** ruling 6 (the folder listed once, the Owner's rule across editors), ruling 7 (new lines in
  the game's own words), ruling 9 (a language with no file), ruling 13 (history from blame).
- **Names** used across tasks are defined once: `StoryFiles`, `StoryEdit`, `Did`, `TouchedFile` (7, 9); `MapLayout`
  (10); `MissingWords`, `Waiting.words`, `goesIn` (5, 6); `WordsHistory`, `LineBy` (6, 18, 20); `RowId` (14 to 16); `ChangeLine` (21).
- **After the plan audit** (2026-11-15): every finding of
  `docs/superpowers/audits/2026-11-15-story-editor-plan-audit.md` is written into the task it amends, tagged with
  its number (C1, C2, I1 to I12, M1 to M11), and I5 carries the Owner's answer A. The one change to World is the
  stamp line of I8; the one route GitHub calls is `/api/github-hook` (I5).
