# The Feel Editor (2D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (project rule). Tests run only in GitHub-hosted CI:
> "run" in a step means push and read the pull request's checks with `gh pr checks <number> --watch`.

**Goal:** A person opens Feel on their game's level, presses Play, slides "How high it jumps" with the other hand,
feels the hero change on the next jump, sees on the level what the jump now reaches, and saves the tuning file; then
changes the keys and gamepad buttons by touch alone; and, once the framework can draw them, the effects.

**Architecture:** Feel is a new page-side feature, `feel`, between `levels` and `find`. Everything it knows about a
hero's numbers comes from the framework (`MOVE_NUMBERS`, `moveNumbers`, `jumpPaths`, `parseContent`); it holds only
the words and the units a person reads. A change is a new tuning file value in an undo list, drawn at once in the
jump note (page elements over the canvas) and, while playing, sent to the running game with the framework's
`game.tune`. Play is the redesign's Task 19 play, started with `tunable`. Save, Export, drafts and waiting changes
are World's, widened from "a level" to "a content file the editors may write".

**Tech stack:** as the redesign (Svelte 5, strict TypeScript, Vite 8, Vitest 5 in Node, three browser engines and
journeys on Playwright, `@automataframework/framework` pinned by commit, Cloudflare Pages Functions for `/api`).
**No new dependency.**

**Spec:** [`docs/superpowers/specs/2026-11-15-feel-editor-design.md`](../specs/2026-11-15-feel-editor-design.md).
The frame is the redesign's: its
[spec](../specs/2026-11-14-editors-blueprint-redesign-design.md) and
[plan](2026-11-14-editors-blueprint-redesign.md), whose Global Constraints, rulings 1 to 19, test hooks and
"Review pictures" all hold here and are not repeated. The framework's half is AutomataFramework's
[plan G](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/plans/2026-11-15-live-tuning.md)
(F1 to F3).

## Global Constraints

The redesign plan's "Global Constraints" hold word for word (identity and the author hook, nothing runs locally, at
most five branches, the strict header, sizes and touch sizes, colors, type, panels, motion, words only in
`src/features/words/`, nine languages in one order with none a fallback, the canvas draws the game and nothing else,
end-to-end journeys at five sizes in three engines, the stop rules). Added by this plan:

- **Mockups first** (the Owner, 2026-11-15: "Do a mockup for all editors first before we do any code"). No task in
  this repo starts until the Owner has approved the editors' mockups. If the approved Feel mockup differs from the
  spec's screens, this plan is amended and audited again before Task 1. AutomataFramework's plan G does not wait.
- **The framework and the demo game stay ahead of the editors** (the Owner, 2026-11-14). A session that could build
  either plan G or a task here builds plan G.
- **No new dependency.** If a task seems to need one, stop and report.
- **Feel writes one kind of file in Parts 1 and 2:** the hero's tuning file, as the framework's
  `writeContent('tuning', …)` writes it. It reads the hero's character file and the level and never writes them.
- **Every number a person reads about reach comes from `jumpPaths`.** No file in this repo multiplies a speed by a
  time or divides by gravity. `tests/architecture/rules.ts` gains the rule (Task 6).
- **Every limit, default, step and `about` comes from `MOVE_NUMBERS`.** None is typed in this repo outside a test.
- **The device keeps** what the redesign allows, plus nothing new: Feel's draft is an `af.draft:…` and its tips are
  `af.tip.feel`, both already on `CLAUDE.md`'s list.
- **Slider words are at most 32 characters** in every language (the spec).
- **Tracker.** `docs/superpowers/progress.md`, "Cycle 5: the Feel editor (2D)". Stage 4's 60 points: Tasks 1 to 11
  are 4 each (44), Task 12 is 4, Tasks 13 to 15 (Part 3) are 4 each (12).

## Before starting: what must be on `main`

Written in the tracker when each is true. Task 1 does not start before all of 1 to 5.

1. The Owner has approved the editors' mockups (above).
2. The redesign's Tasks 1 to 18 are merged here (the frame, the find bar, nine languages, the scenes).
3. AutomataFramework's plan H (the built-in hero, pull request 101) is merged, and the redesign's Task 19 (Play),
   with its amendment, is merged here.
4. AutomataFramework's plan G is merged.
5. This plan's audit is merged.
6. **For Part 3 only (Tasks 13 to 15):** AutomataFramework's plan F (the feel runtime, with F4; pull request 111) and
   its content folders (the sound formats cycle: spec pull request 106, plan M pull request 112) are merged, and a short amendment to
   Part 3 is merged here (see "Part 3").

**What this plan takes from the redesign as built** (names from its plan; Task 1's first step checks each on `main`
and reports any that differs before building on it): `Frame`, `Pill`, `Cluster`, `Switcher`, `ComingSoon`, `Panel`,
`Sheet`, `Handle`, `Tool`, `Chip`, `Stamp`, `Notice`, `TitleBlock`, `Tip`; `Stage` with its `layer` snippet and
`Fit`; `shapeOf`, `roomFor`, `roomWith`; `panels.ts`; `commandsFor`, `COMMAND_KINDS`, `FindFacts`, `FindDoes`;
`guide.ts`; `tiles(language, n)` and `ago`; `scenes.ts` and `broken`; `levels/play.ts` (`canPlay`, `startPlay`).

## The Owner's answers this plan builds

Q1 A (live play of the real level, the jump drawn as a note), Q2 A (effects after plan F), Q3 B (switches live in
Characters). **Q4 was changed by the Owner on 2026-11-15, after the spec was written:** Feel lists its effects folder
once in `automata.toml`, as Sound does, and does not add a line for each effect. The spec's Q4 row, its "What Feel
edits" row for `automata.toml` and its "Adding an effect" bullet were amended to say so (2026-11-15, with this plan);
Part 3 below is planned that way.

## Rulings made by this plan

The spec leaves these to the builder, or is silent. The plan audit may challenge each.

1. **Feel has its own address:** `#/game/<owner>/<name>/feel/<level>`, and `#/game/<owner>/<name>/feel` is the first
   level. The switcher's Feel goes there from World keeping the level, and World's goes back.
2. **Switching editors never asks "Leave without saving?".** Each editor's unsaved change is its own draft on the
   device and is there on return. Save in Feel saves the tuning file only. Leaving for the game's page asks, as in
   World.
3. **Feel plays the level as World has it on this device,** its unsaved draft included ("from the files as they are
   on screen").
4. **The numbers panel is the `card` part** (ruling 17's name), so it closes, opens and is kept like World's card.
   On `wide` it is 296 px wide; on `mid` and `narrow` it is a `Sheet`.
5. **A slider is the browser's own range input,** restyled (a 44 px thumb, a `--touch` fill), between a − and a +
   button. It gives arrow keys, touch and a screen reader for free. One slide is the time from its first `input` to
   its `change`.
6. **A panel keeps its key presses, never its key releases.** Every Feel panel stops `keydown` from leaving it, so a
   key typed in a slider or on a button never reaches the game; the framework listens on the window after it (and
   already leaves a key typed into an `input` alone). A `keyup` always goes on to the window: the framework lets go
   of a key "wherever the event went" (`input/keyboard.ts`), and a walk key let go while the focus is in a panel
   must stop the hero (plan audit E2). Escape in a panel puts the focus on
   the game; Escape on the game stops play. Pressing Play or a thumb on the game puts the focus on the game.
7. **While playing in Feel the frame stays:** the pill, the cluster, the tools (Play reads Stop) and the numbers
   panel. This differs from World's Play, which hides them, because tuning needs them. The find bar's keys are off
   while it plays, as in World; its button still opens it.
8. **On `narrow` while playing, the game's box ends above the tools' row,** so the framework's thumb band is never
   under the tools. With the sheet up the game is paused (`pause`), with it down it goes on (`resume`).
9. **A number written into the file for the first time goes at the end of `numbers`,** with the framework's `about`,
   limits and step.
10. **A value is always on a step:** `min` plus a whole count of `step`, held inside the range, written with at most
    four decimals, so no file ever holds `0.30000000000000004`.
11. **Reset widens a range that does not hold the framework's value** (its `min` or `max` moves to that value), and
    says so in the Range panel.
12. **`jump-cut` in words:** 1 is "Off"; 0.5 "Keeps half"; 0.25 "Keeps a quarter"; 0.75 "Keeps three quarters";
    anything else "Keeps 35%". The spec's "Keeps a third" is not a value a step of 0.05 lands on.
13. **Reach is shown to one decimal** ("2.3 tiles"), without the decimal when it is nought ("3 tiles"), the
    language's way (`tiles`).
14. **The note's air arc uses every air jump the hero has,** and says "with an air jump" for one and "with 2 air
    jumps" for more.
15. **In Controls, a chip pressed while playing stops the play first.** A new key is tried with the next Play.
16. **Find-bar ids follow the redesign's pattern,** not the spec's dotted examples: `feel-moves`, `feel-more:<id>`
    and so on (Task 9). The find bar runs named actions and takes no typed value; an agent sets a number in the file,
    which `docs/tuning-a-hero.md` says.
17. **The eight other languages are written by the building session** under the redesign's ruling 9 (tests, then the
    drunk-grandma audit's back-translation). The spec says "the plan writes the other eight"; this plan fixes the
    English (Appendix A) and the rules, as the redesign did.
18. **A third test game, `walker-game`,** has a hero that only walks and jumps, a tuning file of seven numbers and no
    controls list, so the journeys can show a move that is off, a number not in the file yet and the framework's
    controls. `plain-game` stays as it is.
19. **A waiting change that touches a tuning file** shows the game's first level still, with the jump note, and a
    panel listing each number that changed, before and after. Before and After switch the note.
20. **The API saves any content file the default branch's `automata.toml` lists**, the rule this repo's `CLAUDE.md`
    already states, and not a fixed list of kinds. The 2D figure builder's plan (pull request 36, its Task 2) widens
    the same save into `saveChange`, one change of several content files (and pictures) in one commit, with `list`
    for new `automata.toml` entries. Whichever of the two cycles builds first builds that call, in that plan's shape;
    the second adds only what it lacks. Feel needs one content file a change in Parts 1 and 2, and in Part 3 a new
    file, a removed one and the one folder entry (plan audit E3).

## Review Focus

Inputs the spec implies and a person will meet. Each has its test in the task named.

1. **A tuning file with none of the eighteen** (a game that only lists its own numbers), or with a number whose own
   range is one step wide: every built-in slider shows the framework's value with "Not in the file yet", and a
   one-step slider still moves and saves. Task 3, `numbers.test.ts`.
2. **A slide that ends where it began, and a hundred presses of +:** no undo step for the first; a hundred steps
   for the second, each undone live. Task 3, `tune.test.ts`; Task 8, `feel-play.browser.test.ts`.
3. **A second finger on a slider while the first is walking the hero, and a thumb resting on the panel:** the walk
   goes on, the slider moves, and nothing under the panel jumps. Task 8, `feel-play.journey.test.ts`.
4. **A jump that reaches off the top of the level or the screen** (`jump-speed` 30 with three air jumps on a phone):
   the arc is cut at the stage's edge, both marks stay inside the clear cell and readable, nothing scrolls. Task 7,
   `jump-note.browser.test.ts`.
5. **The file changed elsewhere while a person tuned** (a teammate, or an agent, saved another `jump-speed`): Save
   says so with World's notice and buttons, and the draft is not laid over the new file on the next visit. Task 10,
   `feel-save.journey.test.ts`.

---

## File structure

Layers, lowest first: `words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`,
`levels`, **`feel`**, `find`, `suite`. Task 3 adds `feel` to `LAYERS` and `PAGE_SIDE` in `tests/architecture/rules.ts`.

```
src/features/wire/wire.ts            the change's shape (saveChange's, ruling 20)                 Task 2
src/features/service/save.ts         saves a level or a tuning file                        Task 2
src/features/service/open.ts         `last` for tuning files too                           Task 2
src/features/game/files.ts           NEW contentPath, saveContent, contentCopy, drafts by kind   Task 2
src/features/ui/Slider.svelte        NEW the range input with − and +                      Task 4
src/features/ui/icons.ts             moves, controls, effects, reset, info, range          Task 4
src/features/feel/
  feel.ts                            the feature's entry                                   Task 3
  numbers.ts                         which moves show, each number's row, set, reset, range   Task 3
  units.ts                           a value as a person reads it                          Task 3
  tune.ts                            the undo list of tuning files; the change's name      Task 3
  reach.ts                           jumpPaths for a file; the note's shape in pixels      Task 6
  compare.ts                         what changed between two tuning files                 Task 11
  controls.ts, keys.ts               the actions' chips; the keys and buttons offered      Task 12
  NumberRow.svelte, RangePanel.svelte, MovesPanel.svelte                                  Task 4
  JumpNote.svelte                                                                          Task 7
  Feel.svelte                        the editor: tools, stage or play, panel, note, undo   Task 5, 7, 8
  ControlsPanel.svelte, KeyPicker.svelte                                                   Task 12
  (Part 3) effects.ts, EffectsPanel.svelte, EffectCard.svelte                              Task 14
src/features/levels/play.ts          startPlay({ tunable }), Playing                       Task 8
src/features/find/commands.ts        the Feel kinds                                        Task 9
src/features/suite/
  FeelScreen.svelte                  Feel in the frame: Save, Export, stamps, notices      Task 5, 10
  feel-guide.ts                      the three tips                                        Task 9
  route.ts, App.svelte, Switcher.svelte, ComingSoon.svelte                                 Task 5
  WaitingChange.svelte               a tuning change                                       Task 11
docs/tuning-a-hero.md                NEW                                                   Task 9
tests/fixtures/game/                 the built-in hero with all three moves, a full tuning file   Task 1
tests/fixtures/walker-game/          NEW (ruling 18)                                       Task 1
```

Test hooks, added to the redesign's: `data-editor="world|feel"` on the frame; `[data-tool="moves|controls|effects|play"]`;
`[data-move="walk|jump|double-jump|wall-jump|dash|more"]` on a tab, with `aria-selected`; `[data-number="<id>"]` on a
row, holding `[data-slider]` (the range input), `[data-less]`, `[data-more]`, `[data-shown]` (the value in words),
`[data-reach]`, `[data-info]`, `[data-reset]`, `[data-range]`; `[data-moves-off]` and `[data-to-characters]`;
`[data-note="jump|air|dash|up|across"]` and `[data-note-was]` (the faded old arc); `[data-playing]` on the frame;
`[data-sheet-play]`; `[data-action="<action>"]` on a controls row, `[data-key="<code>"]` and `[data-pad="<name>"]` on
chips, `[data-add-key]`, `[data-add-pad]`, `[data-picker]`, `[data-clash]`; `[data-own-code]` on the calm panel.

---

## Pull request 1: the pin and the test games

### Task 1: The framework at plan G, and games Feel can tune

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (the pin, as the redesign's Task 1 did it)
- Modify: `tests/fixtures/game/content/characters/hero.json`, `tests/fixtures/game/automata.toml`,
  `tests/fixtures/fake-github/repos.ts`
- Create: `tests/fixtures/game/content/tuning/hero-moves.json`, `tests/fixtures/walker-game/` (`automata.toml`,
  `content/characters/{hero,crate}.json`, `content/levels/level-1.json`, `content/tuning/hero-moves.json`,
  `read.ts`)
- Test: `tests/fixtures/game.test.ts`, `tests/workflows/package.test.ts`

**Interfaces:**
- Produces: `@automataframework/framework` at plan G's merge commit: `jumpPaths`, `JumpPaths`, `moveNumbersOf`,
  `startGame({ tunable })`, `Game.tune` exist from here on. The fixture game's hero has
  `"moves": { "tuning": "hero-moves", "double-jump": true, "wall-jump": true, "dash": true }`; its tuning file lists
  all eighteen numbers at the framework's values and ranges, one number of the game's own (`crate-bounce`, about
  "How much the crate bounces", 0.2, 0 to 1, step 0.1) and the four controls of `DEFAULT_HERO_CONTROLS`.
  `walker-game` (served as `grandma/walker-game`, with `grandma` as its Owner): `plain-game`'s level and crate, a
  hero with `"moves": { "tuning": "hero-moves" }`, and a tuning file with the seven numbers `walk-speed`,
  `walk-grip`, `air-grip`, `jump-speed`, `jump-cut`, `ledge-grace`, `early-press` (no `fall-speed`) and no
  `controls`.

- [ ] **Step 1:** Check on `main` every name under "What this plan takes from the redesign as built" (`git grep`).
      Write any that differs in the tracker and report it before Step 2.
- [ ] **Step 2:** Move the pin to the framework's `main` as it is then, at or after plan G's merge commit, in the three
      places, as the redesign's Task 1 Steps 1 and 2. If plan F is on that `main`, every hand-made `Host` in this
      repo's code and tests gains its `reducedMotion()` in the same commit (plan audit E4).
      If the redesign's Task 19 already gave the fixture's hero `moves`, keep its file and add what is missing.
- [ ] **Step 3: Failing tests** in `game.test.ts`: the fixture game loads, `usesMoves` is true, its tuning file has
      the eighteen ids of `MOVE_NUMBERS` and `crate-bounce`, and every content file equals `writeContent` of itself
      byte for byte; `walker-game` loads with seven numbers and no controls; `plain-game` still has no `moves`.
- [ ] **Step 4:** Write the files with a throwaway script run in CI's `check` job log, or by hand in `writeContent`'s
      form; the byte test says if one differs. Push; green, every existing journey as before.
- [ ] **Step 5:** Commit `chore: pin the framework to <short sha>, and test games with a built-in hero`. Tracker
      line. Report `Task 1: <commit>, <test count>, surprises`. No screen changed: no review artifact.

---

## Pull request 2: the parts with no screen

### Task 2: The editors may save a tuning file

**Files:**
- Modify: `src/features/wire/wire.ts`, `src/features/service/save.ts`, `src/features/service/open.ts`,
  `src/features/service/service.ts`
- Create: `src/features/game/files.ts`; modify `src/features/game/game.ts`, `open.ts`, `save.ts`, `draft.ts`,
  `copy.ts` (each keeps its level-named function as one line over the new one, so World's callers do not change)
- Test: `tests/features/service/save.test.ts`, `tests/features/service/open.test.ts`,
  `tests/features/game/files.test.ts`

**Interfaces:**
- Produces:

```ts
// ruling 20: if the figure builder's `saveChange` is on `main`, these are thin calls over it and the API is not
// changed here; if not, this task builds `saveChange` in that plan's shape, with only its `content` files.
// `ContentType` is the framework's.
// game/files.ts
/** The path of the listed file of this kind whose name is `<id>.json`; undefined when the project lists none. */
export function contentPath(game: OpenGame, type: ContentType, id: string): string | undefined
/** Saves one content file and brings the opened game up to date, as `saveLevel` did for a level. */
export function saveContent(api: Api, game: OpenGame, type: ContentType, value: { readonly id: string }, message: string): Promise<SaveResult>
export interface ContentCopy { readonly name: string; readonly text: string }
export function contentCopy(game: OpenGame, type: ContentType, value: { readonly id: string }): ContentCopy | undefined
export function keepContentDraft(store: Storage, game: OpenGame, type: ContentType, value: { readonly id: string }): void
export function dropContentDraft(store: Storage, game: OpenGame, type: ContentType, id: string): void
export function takeContentDraft<T>(store: Storage, game: OpenGame, type: ContentType, id: string): { readonly value: T } | 'changed' | undefined
```

The API's save (`service/save.ts`, or `service/change.ts` once it exists): the path must be a file the default
branch's `automata.toml` lists as that type, else `not-allowed`; the bytes are `writeContent(<that type>, value)`; the id must be the file's name;
the whole game must still load (so a tuning file with a range outside the framework's limits, or a controls list
with a clash, is `broken` with the framework's own sentences). Nothing else in the save changes. `open.ts` gives a
tuning file its `last` (who changed it and when), as a level file has.

- [ ] **Step 1: Failing tests.** `save.test.ts`: an Owner saves the fixture's `hero-moves` with `jump-speed` 15: the
      pretend GitHub's file equals `writeContent('tuning', value)` and no other file changed; a Suggest-level save of
      it is a waiting change; a path the game does not list is `not-allowed`; a listed path given with another type
      is `not-allowed`; `automata.toml` is `not-allowed`; a tuning
      value whose `jump-speed` range reaches 50 is `broken` and its details hold `"jump-speed" can be 4 to 30`; a
      controls list with `Space` on two actions is `broken` with the framework's sentence; a value whose id is not
      the file's name is `broken`; a stale `version` is `changed-elsewhere`. `open.test.ts`: the tuning file has
      `last`; a character file has none. `files.test.ts`: `contentPath(game, 'tuning', 'hero-moves')` is the listed
      path and `undefined` for an id not listed; `saveContent` puts the saved value in `game.content.tunings` and the
      new version in `game.files`; `contentCopy`'s text is `writeContent`'s; a kept draft comes back, is `'changed'`
      after the file's version moved, and is dropped when it is not a tuning file any more; a store that throws
      gives no draft and throws nothing; every level test that exists still passes through the one-line wrappers.
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat: the editors can save a tuning file`. Report `Task 2`.

### Task 3: The numbers, their words' units, and the undo list

**Files:**
- Create: `src/features/feel/feel.ts`, `numbers.ts`, `units.ts`, `tune.ts`
- Modify: `tests/architecture/rules.ts`, `src/features/words/en.ts`, `table.ts` (the keys of Appendix A's "Units")
- Test: `tests/features/feel/numbers.test.ts`, `units.test.ts`, `tune.test.ts`, `tests/architecture/rules.test.ts`

**Interfaces:**
- Consumes: the framework's `MOVE_NUMBERS`, `MoveSwitches`, `TuningFile`, `TuningNumber`, `GameContent`,
  `writeContent`; `tiles`.
- Produces:

```ts
// numbers.ts
export type MoveName = 'walk' | 'jump' | 'double-jump' | 'wall-jump' | 'dash'
export type TabName = MoveName | 'more'
/** Which move each of the eighteen ids belongs to: the spec's table. */
export const MOVE_OF: Readonly<Record<string, MoveName>>
export interface HeroFeel { readonly character: string; readonly tuning: TuningFile; readonly on: MoveSwitches }
/** The hero's tuning file and switches, or undefined for a hero moved by its game's own code. */
export function heroFeel(content: GameContent): HeroFeel | undefined
/** Walk and jump, then the moves that are on, then 'more' when the file has a number that is not built in. */
export function tabsShown(tuning: TuningFile, on: MoveSwitches): readonly TabName[]
export function movesOff(on: MoveSwitches): readonly MoveName[]
export interface NumberRow {
  readonly id: string
  readonly value: number; readonly min: number; readonly max: number; readonly step: number
  /** Built in: one of the eighteen. Not built in: the game's own, shown by `about`. */
  readonly builtIn: boolean
  readonly whole: boolean
  /** False: the file leaves it out, and the row shows the framework's value. */
  readonly inFile: boolean
  /** The framework's value; undefined for a number of the game's own. */
  readonly start: number | undefined
  readonly about: string
}
/** The rows under a tab, in the framework's order ('more': in the file's order). */
export function rowsFor(tuning: TuningFile, tab: TabName): readonly NumberRow[]
/** The file with this number at the nearest step inside its range (rulings 9 and 10). The same file when nothing changes. */
export function setNumber(tuning: TuningFile, id: string, value: number): TuningFile
export function nudgeNumber(tuning: TuningFile, id: string, steps: number): TuningFile
/** The framework's value, kept in the file (ruling 11). The same file for a number of the game's own. */
export function resetNumber(tuning: TuningFile, id: string): TuningFile
export type Ranged =
  | { readonly ok: true; readonly tuning: TuningFile; readonly moved: boolean }
  | { readonly ok: false; readonly why: 'limits' | 'order' | 'step' }
/** A new range for one number: inside the framework's limits, min under max, a step over nought (whole for a count). */
export function setRange(tuning: TuningFile, id: string, range: { min: number; max: number; step: number }): Ranged
// units.ts
export type Unit = 'speed' | 'time' | 'share' | 'count' | 'plain'
export const UNIT_OF: Readonly<Record<string, Unit>>     // the eighteen; anything else is 'plain'
/** A value as the row shows it: "6 tiles a second", "0.10 seconds", "At once", "Keeps half", "2". */
export function shown(words: Words, language: Language, id: string, value: number): string
// tune.ts
export interface TuneEdit { readonly opened: TuningFile; readonly now: TuningFile; readonly past: readonly TuningFile[]; readonly future: readonly TuningFile[] }
export function openTune(file: TuningFile): TuneEdit
/** One undo step. The same edit when `next` is `now`. */
export function step(edit: TuneEdit, next: TuningFile): TuneEdit
/** Inside one slide: replaces `now` and adds no step. */
export function slide(edit: TuneEdit, next: TuningFile): TuneEdit
/** The end of a slide: drops the step it began if the file is back where it was. */
export function settle(edit: TuneEdit): TuneEdit
export function undoTune(edit: TuneEdit): TuneEdit
export function redoTune(edit: TuneEdit): TuneEdit
/** True when `writeContent` of `now` differs from that of `opened`. */
export function dirtyTune(edit: TuneEdit): boolean
/** The change's name in the game's history (developer text, English). */
export function describeTune(edit: TuneEdit): string
```

`shown`: a speed is `WORDS.perSecond(tiles(language, value))`; a time is ticks over 60 with two decimals and
`WORDS.seconds(...)`, and for `walk-grip` and `air-grip` at 0 `WORDS.atOnce`; `jump-cut` is ruling 12; a count and a
plain number are `tiles(language, value)`. `describeTune`: one number "Set jump-speed to 15 in hero-moves"; several
"Tune 3 numbers in hero-moves"; only controls "Change the controls in hero-moves"; any mix or a range "Change
hero-moves"; nothing "".

- [ ] **Step 1: Failing tests.**
  - `numbers.test.ts`: `MOVE_OF` has exactly the eighteen ids of `MOVE_NUMBERS`, split 3, 5, 2, 4, 4 as the spec's
    table; `tabsShown` for every set of the three switches, with and without a number of the game's own;
    `movesOff`; `rowsFor(fixture, 'jump')` is five rows in the framework's order with the file's values;
    **(Review Focus 1)** for a file with none of the eighteen, every built-in row has `inFile` false and the
    framework's value, limits and step; `setNumber(file, 'jump-speed', 15.2)` is 15 and `(…, 99)` is the file's
    `max`; `setNumber` of a number not in the file appends it with the framework's `about`, `min`, `max`, `step`;
    `setNumber(file, 'jump-cut', 0.1 + 0.2)` writes `0.3`; a range one step wide still takes both its values;
    `setNumber` to the value it has returns the same object; `resetNumber` gives the framework's value and keeps the
    row in the file, and widens a range of 14 to 20 to 12 to 20; `setRange` past the framework's limits is
    `limits`, min over max is `order`, a step of 0 or a fraction for a count is `step`, and a value left outside a
    narrower range comes inside with `moved` true; every result of every function goes through `writeContent('tuning', …)`
    and parses back.
  - `units.test.ts`: each row of the spec's table ("6 tiles a second"; `walk-grip` 3 "0.05 seconds", 0 "At once";
    `jump-cut` 1 "Off", 0.5 "Keeps half", 0.35 "Keeps 35%"; `ledge-grace` 6 "0.10 seconds"; `dash-rest` 30 "0.50
    seconds"; `air-jumps` 2 "2"); in German the decimal is a comma.
  - `tune.test.ts`: `step` then `undoTune` then `redoTune` ends on a file equal by `writeContent`; a `step` empties
    `future`; **(Review Focus 2)** `step`, three `slide`s back to the start, `settle`: `past` is as before the slide;
    a hundred `step`s then a hundred `undoTune`s is the opened file; `dirtyTune` is false after a change and its
    undo; each sentence of `describeTune`.
  - `rules.test.ts`: `feel` may import `levels` and not `find`; `find` may import `feel`.
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat(feel): a hero's numbers as rows, in a person's units, with undo`. Report `Task 3`.

---

## Pull request 3: Moves, the Tuner

Tasks 4 to 11 are one branch and one pull request, committed task by task. English words for each task are in
Appendix A; add each key to `en.ts` in the task that first uses it, and to the other eight tables in Task 10.

### Task 4: The slider and the numbers panel

**Files:**
- Create: `src/features/ui/Slider.svelte`, `src/features/feel/NumberRow.svelte`, `RangePanel.svelte`,
  `MovesPanel.svelte`
- Modify: `src/features/ui/icons.ts` (`moves: personSimpleRun`, `controls: gameController`, `effects: sparkle`,
  `reset: arrowCounterClockwise`, `info: info`, `range: arrowsHorizontal`, and one icon a move for its tab:
  `walk: personSimpleWalk`, `jump: arrowFatLineUp`, `doubleJump: arrowsOutLineVertical`, `wallJump: wall`,
  `dash: lightning`, `more: dotsThree`)
- Test: `tests/features/ui/slider.browser.test.ts`, `tests/features/feel/moves-panel.browser.test.ts`

**Interfaces:**
- Consumes: Task 3.
- Produces:

```
Slider.svelte      props: label, value, min, max, step, shown (the value in words), less, more (accessible names),
                   oninput(value) (while it slides), onchange(value) (when it is let go), onstep(steps: -1 | 1)
                   A range input (`data-slider`) at least 200 px long where the panel allows, its thumb 44 px, between
                   a − (`data-less`) and a + (`data-more`), each 44 px. A press that is held repeats after 400 ms,
                   every 80 ms. The input's `aria-valuetext` is `shown`.
NumberRow.svelte   props: row: NumberRow, words (its label), shown, reach?: string, info: string, tip: boolean,
                   onslide(value), onset(value), onstep(steps), onreset(), onrange()
                   `data-number={row.id}`: the label with an info disc (`data-info`, opens the one sentence under it),
                   the value (`data-shown`) and, when given, its reach (`data-reach`, a `.measure`); the Slider; when
                   `!row.inFile` the quiet line `WORDS.notInFile`; Reset (`data-reset`, the `reset` icon with its
                   word, 44 px) beside the value, only for a built-in number that is not at its start, as the spec
                   puts it; with the info open, Range (`data-range`). Plan audit E6.
RangePanel.svelte  props: row, limits: { min, max } | undefined, onset(range), onclose()
                   Three number fields (least, most, step) with − and +, the line `WORDS.rangeLimits(min, max)` for a
                   built-in number, and after a `setRange`: its refusal in words, or `WORDS.rangeMoved` when the value
                   moved.
MovesPanel.svelte  props: content, tuning, on, tab (bindable), compact: boolean (true on `narrow`), tipAt?: string,
                   onslide(id, value), onset(id, value), onstep(id, steps), onreset(id), onrange(id, range),
                   oncharacters()
                   A tab list (`role="tablist"`, each `data-move`, 48 px, its icon and word), the chosen tab's rows,
                   and under the last tab `[data-moves-off]`: `WORDS.movesOff(names)` with the button
                   `WORDS.toCharacters` (`data-to-characters`). `compact` shows one row at a time, with the others a
                   swipe or the row's own two arrows away, and never scrolls.
```

The label of a built-in number is `WORDS.number[id]` and its sentence `WORDS.numberInfo[id]`, never the file's
`about`. A number of the game's own shows its `about` as its label, marked `translate="no"`, with no info sentence
and no Reset. Reach beside a value comes in as text from Task 6; until then the prop is left out.

- [ ] **Step 1: Failing tests** (three engines, at the five sizes where a size is named).
  - `slider.browser.test.ts`: ArrowRight moves one step and calls `onchange`; a drag of the thumb calls `oninput`
    more than once and `onchange` once; − and + call `onstep`; a + held for one second calls it at least six times;
    the thumb and both buttons are at least 44 px; the input is at least 200 px long in a 296 px panel;
    `aria-valuetext` is `shown`.
  - `moves-panel.browser.test.ts`: for the fixture, five tabs and More, Jump's five rows in order, each label from
    the words table and none the file's `about`; "How high it jumps" shows `12`; for `walker-game`, two tabs, a
    `fall-speed` row reading "Not in the file yet" at 20, and `[data-moves-off]` reading "Double jump, wall jump and
    dash are off." with a button that calls `oncharacters`; the info disc opens the sentence and Range; Reset shows beside the value once the number has moved and is
    absent at the framework's value; Range opens the panel, a `max` of 50 for `jump-speed` shows the limits line and
    changes nothing, a `max` of 10 with the value at 12 calls `onrange` and shows "moved"; a More row's label is the
    file's `about` with `translate="no"` and has no Reset; on `phone`, one row shows, the arrows change it, and the
    panel's `scrollHeight` equals its `clientHeight`; `broken` is empty at each size in a made-up table 40% longer
    (`useTables`).
- [ ] **Steps 2 to 4:** push red; implement; push green. **Step 5:** Commit `feat(feel): the slider and the numbers panel`.

### Task 5: Feel opens: the address, the switcher, the frame, the hero moved by its own code

**Files:**
- Create: `src/features/feel/Feel.svelte`, `src/features/suite/FeelScreen.svelte`
- Modify: `src/features/suite/route.ts`, `App.svelte`, `Switcher.svelte`, `Pill.svelte`, `ComingSoon.svelte`,
  `src/features/find/commands.ts` (`open-editor:feel` goes to Feel), `tests/fixtures/scenes.ts`
- Test: `tests/features/suite/route.test.ts`, `tests/features/feel/feel.browser.test.ts`,
  `tests/journeys/feel-open.journey.test.ts`

**Interfaces:**
- Consumes: `Frame`, `Stage`, `Panel`, `Sheet`, `Tool`, `TitleBlock`, `panels.ts`, `MovesPanel`, `TuneEdit`.
- Produces:

```ts
// route.ts
export type Route = /* as today */ | { screen: 'feel'; owner: string; name: string; level?: string }
```

```
Feel.svelte   props: content, levelId, level: Level (as World has it, ruling 3), art, shape, mode: 'edit' | 'look',
              start: TuningFile | undefined (the draft or the file), block, kept: Storage,
              onchange(edit: TuneEdit), onstate(state: FeelState), oncharacters()
              exports: part(name), tab(name), set(id, value), nudge(id, steps), reset(id), undo(), redo(),
                       play(), stop(), panel(name), panels()
              FeelState = { part: 'moves' | 'controls' | 'effects'; tab: TabName; playing: boolean; canUndo: boolean;
                            canRedo: boolean; canPlay: boolean; closed: readonly PanelName[] }
```

What it shows in this task (still; play is Task 8): the level through `Stage` in `mode="read"` with the room of
ruling 2; the tools' panel with Moves (pressed), Controls, Effects (a `comingSoon` tag; it opens the Coming soon
card with `WORDS.soonEffects`) and Play (the main one of the strip, `--touch` fill, disabled look never: before
Task 8 it is not rendered); the numbers panel as the `card` part (ruling 4), a `Sheet` on `mid` and `narrow`; undo
and redo; the title block with `WORDS.edFeel` in its editor cell. The switcher's Feel is chosen (`aria-current`) and
has no tag; World's goes to the level's own address. "Turn on in Characters" opens Characters' Coming soon card,
which in Feel adds the sentence `WORDS.soonCharactersMoves`. At Look level the sliders are disabled and the tools'
panel holds `WORDS.lookLine(owner)`.

**A hero moved by its own code** (`heroFeel` is undefined): no tabs. One `Panel` (`data-own-code`) over the still
level with `WORDS.ownCode`; when the game lists tuning files, under it each file's name and its numbers as rows by
their `about`, changed and saved like any other (the first file is the one on screen; a `Choice` picks another).

- [ ] **Step 1: Failing tests.**
  - `route.test.ts`: `#/game/a/b/feel/level-2` and `#/game/a/b/feel` parse and print back; `needsPerson` is false.
  - `feel.browser.test.ts`: at each of the five sizes the parts are where World's are (tools, card or sheet, block,
    undo), `data-editor="feel"`, the title block reads "Feel", and `data-scale` is the same before and after a tab
    is chosen and a slider moved; a slider move makes Undo enabled and Undo puts the value back; closing the numbers
    panel leaves its handle and reopening shows the same tab; in `plain-game` the calm panel reads the sentence and
    no tab exists; in a game in memory with no `moves` and one tuning file, its numbers show and one moves.
  - `feel-open.journey.test.ts` (five sizes, three engines): a visitor on the demo level opens Feel from the
    switcher (on `mid` and `narrow` from the pill's menu): the address ends `/feel/level-1`, the Jump tab's first
    slider is on screen, `broken(page, true)` is empty and no two parts overlap; "Open Feel" from the find bar does
    the same; World from the switcher goes back to the same level; a reload stays in Feel; the Effects tool opens
    its card and OK closes it; in `walker-game`, "Turn on in Characters" opens the card with the sentence about the
    hero's file; in `plain-game`, the calm panel; a moved crate in World is still moved after going to Feel and
    back (ruling 2), and nothing asked to leave.
- [ ] **Steps 2 to 4:** push red; implement; add the scenes `feel-moves-still`, `feel-jump-tab`, `feel-number-info`,
      `feel-range`, `feel-move-off` (`walker-game`), `feel-own-code` (`plain-game`); push green.
- [ ] **Step 5:** Commit `feat(feel): Feel opens on the level with the hero's numbers`.

### Task 6: What a jump reaches, as numbers

**Files:**
- Create: `src/features/feel/reach.ts`
- Modify: `src/features/feel/MovesPanel.svelte`, `Feel.svelte`, `tests/architecture/rules.ts`
- Test: `tests/features/feel/reach.test.ts`, `tests/architecture/rules.test.ts`

**Interfaces:**
- Consumes: the framework's `jumpPaths`, `moveNumbers`, `JumpPaths`, `PathPoint`.
- Produces:

```ts
/** What this file's hero reaches: `jumpPaths(moveNumbers(tuning), on)`. The same answer for the same file. */
export function reachOf(tuning: TuningFile, on: MoveSwitches): JumpPaths
/** The reach a row shows beside its value, in tiles: jump-speed, air-jump-speed, wall-jump-up, dash-speed, dash-ticks. */
export function reachFor(paths: JumpPaths, id: string): number | undefined
export interface Mark { readonly from: Point; readonly to: Point; readonly value: number }
export interface NoteShape {
  /** SVG path data in CSS pixels, a point a tick. */
  readonly arc: string
  readonly air: string | undefined
  readonly up: Mark
  readonly across: Mark
  readonly dash: Mark | undefined
  /** How many air jumps the air arc used. */
  readonly airJumps: number
}
/** The note for a hero whose feet are at `feet` (CSS pixels), at `scale` pixels a tile, facing `face`. */
export function noteShape(paths: JumpPaths, feet: Point, scale: number, face: 1 | -1, airJumps: number): NoteShape
```

`reachFor`: `jump-speed` is `jump.up`; `air-jump-speed` is `airJump.rise`; `wall-jump-up` is `wallJump.up`;
`dash-speed` and `dash-ticks` are `dash.across`; anything else, or a part the switches leave out, is undefined.
`up` runs from the feet to the arc's highest point, straight up; `across` along the floor from the feet to the
landing; `dash` along the floor from the feet for `dash.across`. The new rule in `rules.ts`: no file under
`src/features/feel/` but `reach.ts` imports `jumpPaths`, and none holds the word `gravity`.

- [ ] **Step 1: Failing tests.** `reach.test.ts`: `reachOf(fixture)` equals `jumpPaths(moveNumbers(file), on)` and
      is the same object twice; `reachFor` for each of the five ids and `undefined` for `walk-speed` and for
      `dash-speed` with dash off; `noteShape` at scale 40 from feet (100, 300): `up.to.y` is `300 - 40 * jump.up`,
      `across.to.x` is `100 + 40 * jump.across`, the arc starts `M100,300`, and with `face` −1 `across.to.x` is
      `100 - 40 * jump.across`; `air` is undefined with double jump off. Panel: "How high it jumps" shows
      `[data-reach]` reading the tiles of `reachOf(...).jump.up` and it changes when the slider moves; "How fast a
      dash goes" shows the dash's length. `rules.test.ts`: a made-up `feel/units.ts` that imports `jumpPaths`, or
      names `gravity`, fails.
- [ ] **Steps 2 to 4:** push red; implement; push green. **Step 5:** Commit `feat(feel): what a jump reaches, from the framework's own step`.

### Task 7: The jump note, drawn on the still level

**Files:**
- Create: `src/features/feel/JumpNote.svelte`
- Modify: `src/features/feel/Feel.svelte`
- Test: `tests/features/feel/jump-note.browser.test.ts`, `tests/journeys/feel-note.journey.test.ts`

**Interfaces:**
- Consumes: `noteShape`, `reachOf`, `Stage`'s `layer` snippet and `Fit`, `Chip`, `NotesMode`, `tiles`.
- Produces: `JumpNote.svelte` props `shape: NoteShape`, `clear: Box`, `mode: NotesMode`, `compact: boolean`. All
  page elements in the stage's layer, none on the canvas, in the drawing notes' style (the redesign's Task 9: lines
  `--ground` with a 1 px `--words` halo, values in `--touch` `.measure`, words on a `Chip`):
  - the arc, dashed (`data-note="jump"`); the air arc from the top of the first (`data-note="air"`) with a chip
    `WORDS.noteAir(n)`; the dash as a measure line (`data-note="dash"`) with `WORDS.noteDash(tiles)`;
  - two measure lines with end ticks and a chip each: `WORDS.noteUp(tiles)` (`data-note="up"`) and
    `WORDS.noteAcross(tiles)` (`data-note="across"`); `compact` uses `WORDS.noteUpShort` and `noteAcrossShort`;
  - a chip that would leave `clear` goes to the other side of its line, then is held at the edge; the arc is cut by
    the stage's box and never by a chip;
  - when `shape` changes: the new note has `animation-name: draw` (200 ms; `fade` under reduced motion) and the old
    one stays for one second at 35% as `[data-note-was]`;
  - `mode` is the drawing notes switch: faded at 35%, hidden draws nothing.

In `Feel` (not playing): the feet are the hero's start point for player 1, its `y` plus half the hero's height,
through the stage's `Fit`; the face is 1.

- [ ] **Step 1: Failing tests.**
  - `jump-note.browser.test.ts` (three engines, five sizes): the up chip reads "Reaches 2.3 tiles up" and the across
    chip "4.7 tiles across" for the fixture; the across line's length is `4.7 × data-scale` within 1 px; after
    `set('jump-speed', 15)` the chips read what `reachOf` says, `[data-note-was]` exists and is gone after 1.2
    seconds; the canvas's `toDataURL()` is the same with the note on, faded and hidden; with double jump on the air
    chip reads "with an air jump", and with `air-jumps` 2 "with 2 air jumps"; with dash on, "Dash: 3 tiles";
    **(Review Focus 4)** with `jump-speed` 30 and `air-jumps` 3 on `phone`, both chips lie inside `[data-clear]`,
    no chip overlaps another, and the page has no scroll; under reduced motion the animation is `fade`.
  - `feel-note.journey.test.ts` (five sizes): open Feel on the demo level: the note is at the hero's feet (the arc's
    first point within 2 px of the bottom middle of `[data-thing="start-1"]`) with no press; + on "How high it
    jumps" three times: the up chip's number grows each time and equals the row's `[data-reach]`; the notes switch
    hides it; in `walker-game` there is no air arc and no dash line; `broken(page, true)` is empty.
- [ ] **Steps 2 to 4:** push red; implement; add the scenes `feel-note-changed` and `feel-note-all-moves`; push green.
- [ ] **Step 5:** Commit `feat(feel): the jump drawn on the level`.

### Task 8: Play, with the numbers live

**Files:**
- Modify: `src/features/levels/play.ts`, `src/features/feel/Feel.svelte`, `MovesPanel.svelte`,
  `src/features/suite/FeelScreen.svelte`, `CLAUDE.md` ("Play in Feel may change the hero's numbers while it plays,
  through the framework's `tune`")
- Test: `tests/features/levels/play.browser.test.ts`, `tests/features/feel/feel-play.browser.test.ts`,
  `tests/journeys/feel-play.journey.test.ts`

**Interfaces:**
- Consumes: the redesign's `startPlay` and `canPlay`; the framework's `startGame({ tunable })`, `Game.tune`,
  `Game.pause`, `Game.resume`, `Game.heroes`, `Game.sim`, `Moves`, `Transform`, `Player`, `tuningNumbers`.
- Produces:

```ts
// levels/play.ts
export interface HeroNow {
  /** Its box on the mount, CSS pixels. */
  readonly box: Box
  /** Its middle in the level, tiles. */
  readonly at: Point
  readonly face: 1 | -1
  /** It stands on something. */
  readonly grounded: boolean
}
export interface Playing {
  stop(): void
  /** Only when started with `tunable`: the built-in numbers by id, from the next tick. */
  tune(values: Readonly<Record<string, number>>): void
  pause(): void
  resume(): void
  /** Player 1's hero after the last draw; undefined before the first. */
  hero(): HeroNow | undefined
}
export function startPlay(options: { /* the redesign's */ readonly tunable?: boolean }): Promise<Playing>
```

`hero()` reads the first of `game.heroes()` for the box and the sim's player 1 entity for `Transform`, `Moves.face`
and `Moves.stood`. World's Play passes no `tunable` and ignores the new members. Feel loads `levels/play.ts` only with `await
import`, the redesign's rule for the one file that starts a sim (plan audit E9). `game.heroes()` is empty for a hero
with no figure in a level with no view, so in such a game (`walker-game`, whose hero has no figure, as `plain-game`'s
has none) `hero()` stays undefined and the note stays at the start; no journey plays `walker-game` (plan audit E8).

**What a person sees** (the spec's "Feeling it", with rulings 6, 7 and 8):

- Play is the main button of the tools' strip. Pressed, the level plays in the stage's box with the tuning file as
  it is on screen, `tunable`; the frame has `data-playing`; Play reads `WORDS.stop`; the focus goes to the game.
- A slide, a − or +, a Reset, a Range that moves the value, an Undo or a Redo calls `tune(tuningNumbers(now))` in
  the same frame. Nothing else of the play changes.
- The note follows the hero while `grounded` (its feet from `hero().box`, its face from `hero().face`, the scale
  from the box's width over the hero's width in tiles) and holds where it left while it is in the air: the place it
  left is kept in tiles and drawn from `hero().at`, so a moving camera does not carry it off.
- Stop, or Escape with the focus on the game: the play ends; the level, the view, the picked tab and the undo list
  are as they were, and the numbers keep their changes.
- `narrow`: the game's box ends above the tools' row. The sheet up calls `pause`; pulling it down, or its edge
  button `WORDS.sheetPlay` (`data-sheet-play`), calls `resume` (or starts the play the first time). With the sheet
  up the note shows from the standing hero's feet.
- A game that cannot play (`canPlay` false) has no Play in Feel: the calm panel of Task 5 is what it gets.
- At Look level Play works and the sliders do not.

- [ ] **Step 1: Failing tests.**
  - `play.browser.test.ts` (three engines): `startPlay({ tunable: true })` then `tune({ ...all, 'jump-speed': 20 })`:
    the next jump's highest `hero().at.y` is above the one before; `hero()` is undefined before the first draw and
    `grounded` at rest; `pause` holds `hero().at` still for half a second and `resume` moves it again; without
    `tunable`, `tune` throws the framework's sentence.
  - `feel-play.browser.test.ts` (three engines): pressing Play gives the frame `data-playing` and the focus to the
    stage; ArrowRight held with the focus on a slider moves the slider and not the hero (ruling 6), and held with
    the focus on the stage moves the hero and not the slider; Escape in the panel moves the focus to the stage and
    does not stop; Escape again stops; ArrowRight held with the focus on the stage, then a tap on a slider, then
    ArrowRight let go: the hero stops (plan audit E2); after Stop the tab, `data-scale` and the undo list are as before and the
    slider keeps its value; **(Review Focus 2)** a hundred + presses while playing then a hundred Undos leaves the
    opened value, and the last `tune` call held it; a slide that ends where it began adds no undo step.
  - `feel-play.journey.test.ts` (five sizes, three engines; thumbs on the touch sizes, keys on `desktop`): Play,
    jump, read the top of the jump from the hero's box; slide "How high it jumps" to 15; jump again: the top is
    higher and the hero did not move sideways or restart when the slider moved (its box's left is within 2 px
    across the slide); the note stays where the jump began until the hero lands, then is at its feet again;
    **(Review Focus 3)** on `ipadSideways`, with one touch held on the left half walking the hero, a second touch
    drags the slider: the hero's box keeps moving right and the slider's value changes, and a touch that lands on
    the numbers panel over the right half does not jump the hero; a touch on the game never moves a slider; Stop
    is at least 48 px and a touch on it does not walk the hero; on `phone`: the sheet up holds the hero's box
    still for half a second, a slide then moves the note, the sheet down plays on and the next jump is higher, and
    the page never scrolls; the pretend GitHub got no write from any of it; `broken(page, true)` is empty while
    playing.
- [ ] **Steps 2 to 4:** push red; implement; add the scenes `feel-playing` and `feel-playing-sheet-up`; push green.
- [ ] **Step 5:** Commit `feat(feel): play the level and tune it live`.

### Task 9: The first run, the find bar, and the page for agents

**Files:**
- Create: `src/features/suite/feel-guide.ts`, `docs/tuning-a-hero.md`
- Modify: `src/features/suite/FeelScreen.svelte`, `src/features/find/commands.ts`, `docs/commands.md` (by
  `pnpm commands:write`, taken from CI's log), `README.md` (one link)
- Test: `tests/features/suite/feel-guide.test.ts`, `tests/features/find/commands.test.ts`,
  `tests/docs/commands.test.ts`, `tests/docs/docs.test.ts`, `tests/journeys/feel-first-run.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// feel-guide.ts
export type FeelTip = 'play' | 'slide' | 'keep' | 'done' | 'none'
export interface FeelTipFacts {
  readonly wanted: boolean      // af.tip.feel is not set
  readonly canPlay: boolean
  readonly jumps: number        // jumps seen this visit
  readonly changed: boolean     // a number differs from the file
  readonly jumpsSince: number   // jumps since the first change
  readonly kept: boolean        // saved or exported from Feel on this device
}
export function feelTip(facts: FeelTipFacts): FeelTip
export function feelTipFor(tip: FeelTip, facts: { visitor: boolean; canSave: boolean; tabs: readonly TabName[] }):
  { readonly text: string; readonly target: string } | undefined
export function feelTipsWanted(store: Storage): boolean
export function finishFeelTips(store: Storage): void
```

`feelTip`: not `wanted`, or cannot play, is `none`; `kept` is `done`; `changed` with `jumpsSince` over 0 is `keep`;
`jumps` over 0 is `slide`; else `play`. `feelTipFor`: `play` is `WORDS.tipFeelPlay` at `[data-tool="play"]`;
`slide` is `WORDS.tipFeelSlide` at `[data-number="jump-speed"] [data-slider]` (at `[data-move="jump"]` when another
tab is open, and at the `card` handle when the panel is closed); `keep` is `WORDS.tipFeelSave` at Save for someone
who may save and `WORDS.tipFeelExport` at Export for a visitor. A jump is counted when the hero goes from
`grounded` to not while it rises. The tip is the redesign's `Tip` and waits like World's; "Hide tips" ends Feel's
too.

**The find bar.** `FindFacts` gains `editor: 'world' | 'feel'` and, in Feel, `feel: { part, tabs, rows: { id,
canReset }[], actions: string[], playing }`. World's own kinds show only in World. The Feel kinds, after `play`:
`feel-moves` ("Moves"), `feel-controls` ("Controls"), `feel-effects` ("Effects"), `feel-tab:<move>` ("Show the jump
numbers"), `feel-more:<id>` and `feel-less:<id>` ("How high it jumps, a little more"), `feel-reset:<id>` ("Reset how
high it jumps", only when it can), `feel-go:<id>` ("Change how high it jumps": opens its tab and puts the focus on
its slider); Task 12 adds `feel-key:<action>` and `feel-pad:<action>`. `docs/commands.md` says of each what it
changes ("one step of `value` of that number in the hero's tuning file"; "nothing: what is on screen").

`docs/tuning-a-hero.md`, for an agent and a person: which file (the hero's `moves.tuning`), the eighteen ids with the
framework's `about` (written by the same script as `docs/commands.md`, from `MOVE_NUMBERS`, so it cannot drift),
that a number left out is the framework's value, how Feel shows each (its words and its unit), and that the switches
are in the character file.

- [ ] **Step 1: Failing tests.** `feel-guide.test.ts`: every row of `feelTip`; a store that throws counts as wanted;
      `slide` targets the tab when Walk is open; `keep` targets Export for a visitor. `commands.test.ts`: in Feel
      there is no `move-tool` and there is `feel-more:jump-speed`; with dash off there is no `feel-more:dash-speed`;
      `feel-reset:jump-speed` only when it is not at its start; in World there is no `feel-` kind; `findCommands(all,
      'jump high')` finds the three for `jump-speed`. Docs: `commands.md` holds every Feel kind; `tuning-a-hero.md`
      names every id of `MOVE_NUMBERS` and the README links it. Journey (five sizes, three engines): a visitor's
      first time in Feel: "Press Play and jump." by Play, with no click; after Play and one jump, "Now slide this and
      jump again." within 24 px of the first Jump slider; after one + and one jump, "Feel that? Press Export to keep
      it." by Export; Export stamps "EXPORTED" and a reload of Feel shows no tip; signed in as an Owner the third
      tip names Save and the stamp is "SAVED"; opening the find bar hides the tip and closing brings it back; by
      keyboard, "How high it jumps, a little more" from the find bar moves the slider one step and the note.
- [ ] **Steps 2 to 4:** push red; implement; push green. **Step 5:** Commit `feat(feel): the first tune, and every action by name`.

### Task 10: Save, Export, the draft, and nine languages

**Files:**
- Modify: `src/features/suite/FeelScreen.svelte`, `src/features/words/table.ts` and all nine tables,
  `tests/fixtures/scenes.ts`, `CLAUDE.md`, `docs/teams.md` (one line: what a Feel save changes)
- Test: `tests/journeys/feel-save.journey.test.ts`, `tests/features/words/words.test.ts`,
  `tests/journeys/screens-feel.journey.test.ts` (new, under 600 lines, sharing `scenes.ts`)

**Interfaces:**
- Consumes: `saveContent`, `contentCopy`, the content drafts (Task 2); `describeTune`, `dirtyTune`; the redesign's
  Save, Export, `Stamp`, `Notice`, `SignInPanel`, `Leave`.

`FeelScreen` does for the tuning file exactly what `LevelScreen` does for a level, with the same words, stamps,
notices and levels: Save (Edit and Owner straight in; Suggest and Approve a waiting change; a visitor the sign-in
panel; Look no Save), Export (the tuning file's `writeContent` text, "Copied for your agent", "Save it as a file" as
`hero-moves.json`), the draft kept on every change and dropped on save, "Not saved yet" and "Saved by …" in the title
block from the tuning file's `last`, every save problem's notice, and "Leave without saving?" for the game's page.
The change's name is `describeTune`.

- [ ] **Step 1: Failing tests.** `feel-save.journey.test.ts` (five sizes, three engines):
  1. **Tune a jump** (the spec's journey 1): an Edit-level person opens Feel on the test game, Play, jump, slide to
     15, the note's up chip grows, jump again, Stop, Save: the stamp reads "SAVED"; the pretend GitHub's
     `hero-moves.json` equals `writeContent` of the fixture with `jump-speed` 15, no other file was written, and the
     change's name is "Set jump-speed to 15 in hero-moves".
  2. **A visitor exports** (journey 2): the same tune, Export: the clipboard's text equals those bytes (Firefox:
     the stamp or the selected box), and `POST /api/save` is not in the request list.
  3. **A Suggest-level tune** (journey 5): the stamp reads "Waiting for someone to approve" and the game's page
     lists the change.
  4. **The draft:** a tune, a reload: the slider is at 15 and the block says "Not saved yet"; after Save and a
     reload it is at 15 and saved.
  5. **(Review Focus 5) The file changed elsewhere:** the pretend GitHub's file is given another `jump-speed`
     while the person tunes; Save shows World's "changed elsewhere" notice with its buttons and the level behind;
     after a reload the kept draft is not laid over the new file.
  6. **`walker-game`:** sliding "Fastest it falls" and saving writes `fall-speed` at the end of `numbers` with the
     framework's `about` and limits.
  7. **Leaving:** the pill's game name with an unsaved tune asks; Stay keeps it.
  `words.test.ts`: every Feel key is in all nine tables, placeholders kept, no banned word, and every key under
  `number` is at most 32 characters in every language.
- [ ] **Step 2:** Push; red. **Step 3:** Implement. Write the eight other tables for every key of Appendix A
      (ruling 17). Add the scenes `feel-saved`, `feel-exported`, `feel-changed-elsewhere`, `feel-tip-play`,
      `feel-tip-slide`, `feel-tip-keep`, `feel-de`, `feel-ru`, `feel-ja`, `feel-long-names`; `screens-feel` runs
      every Feel scene at the five sizes and measures each with `broken`.
- [ ] **Step 4:** `CLAUDE.md`: Feel in the features list and the structure; "Particular to this repo" says what
      Feel writes. Push; green.
- [ ] **Step 5:** Commit `feat(feel): save and export a tune, in nine languages`.

### Task 11: A waiting tune can be read and approved

**Files:**
- Create: `src/features/feel/compare.ts`
- Modify: `src/features/suite/WaitingChange.svelte`, `src/features/suite/Waiting.svelte` (the card's small picture
  for a tuning change is the level with the note)
- Test: `tests/features/feel/compare.test.ts`, `tests/journeys/feel-approve.journey.test.ts`

**Interfaces:**
- Produces:

```ts
export interface TuneChange {
  /** Each number whose value differs, in the file's order; `before` undefined for one the change adds. */
  readonly numbers: readonly { readonly id: string; readonly before: number | undefined; readonly after: number | undefined }[]
  readonly controls: boolean      // the controls differ
  readonly other: number          // a range, an about, anything else
}
export function compareTunings(before: TuningFile | undefined, after: TuningFile | undefined): TuneChange
```

A waiting change whose files are tuning files (ruling 19): the frame, read only, with the game's first level still
and the jump note for After (Before switches it); a `card` panel titled `WORDS.changeNumbers` listing each number as
its words, then `shown(before)`, an arrow icon and `shown(after)`; `WORDS.changeControls` when the controls differ;
Approve, "Turn it down" and the author's line as for a level. A change that touches a level and a tuning file shows
the level's view with the numbers' panel beside it.

- [ ] **Step 1: Failing tests.** `compare.test.ts`: one changed value; an added number; a changed key is `controls`;
      a changed `max` is `other`; equal files are empty. Journey (five sizes): a Suggest-level person saves
      `jump-speed` 15; an Approve-level person opens the change: the panel reads "How high it jumps", "12" and
      "15", the note's up chip is After's and Before's after the switch; Approve stamps "APPROVED" once the checks
      pass, and the pretend GitHub's default branch has 15; the author sees "Waiting for … to approve".
- [ ] **Steps 2 to 4:** push red; implement; add the scene `feel-change-waiting`; push green.
- [ ] **Step 5:** Commit `feat(feel): a waiting tune shows what changed`. When every check of the pull request is
      green: review pictures (every Feel scene so far at the five sizes, saying whether they match the approved
      mockup), then report Tasks 4 to 11.

---

## Pull request 4: Controls

### Task 12: Keys and gamepad buttons, by touch alone

**Files:**
- Create: `src/features/feel/controls.ts`, `keys.ts`, `ControlsPanel.svelte`, `KeyPicker.svelte`
- Modify: `src/features/feel/Feel.svelte`, `src/features/find/commands.ts`, `src/features/words/` (nine tables),
  `tests/fixtures/scenes.ts`, `docs/commands.md`, `docs/tuning-a-hero.md` (the controls)
- Test: `tests/features/feel/controls.test.ts`, `keys.test.ts`, `controls-panel.browser.test.ts`,
  `tests/journeys/feel-controls.journey.test.ts`

**Interfaces:**
- Consumes: the framework's `DEFAULT_HERO_CONTROLS`, `TuningControl`, `parseContent`, `RESERVED_KEYS`,
  `RESERVED_PAD`, `PAD_BUTTONS`, `PAD_STICKS`.
- Produces:

```ts
// controls.ts
/** The hero's actions as Feel lists them: the file's list, else the framework's (without dash when it is off). */
export function controlsOf(tuning: TuningFile, on: MoveSwitches): readonly TuningControl[]
export type Changed =
  | { readonly ok: true; readonly tuning: TuningFile }
  /** `sentence` is the framework's own, from `parseContent('tuning', …)`. */
  | { readonly ok: false; readonly sentence: string }
export function setKey(tuning: TuningFile, on: MoveSwitches, action: string, index: number, code: string): Changed
export function addKey(tuning: TuningFile, on: MoveSwitches, action: string, code: string): Changed       // at most 8
export function removeKey(tuning: TuningFile, on: MoveSwitches, action: string, index: number): Changed
export function setPad(…, name: PadInput): Changed
export function addPad(…, name: PadInput): Changed                                                          // at most 4
export function removePad(…, index: number): Changed
/** False for the last key or button of an action that has no other way to be done. */
export function canRemove(control: TuningControl, kind: 'key' | 'pad', index: number): boolean
// keys.ts
export interface KeyGroup { readonly name: 'arrows' | 'letters' | 'numbers' | 'other'; readonly codes: readonly string[] }
/** The keys a person may choose from a list, grouped; none of `RESERVED_KEYS`. */
export const KEY_GROUPS: readonly KeyGroup[]
/** The gamepad inputs offered, none of `RESERVED_PAD`. */
export const PAD_CHOICES: readonly PadInput[]
/** A key or a gamepad input in words: "Space", "Left arrow", "A"; "the bottom button", "the left stick, up". */
export function inputWords(words: Words, name: string): string
```

Every change builds the candidate file, runs `parseContent('tuning', writeContent('tuning', candidate), path)` and
is refused with the first sentence whose path is under `controls` when it does not parse, so the words are the
framework's and nothing is ever written that the game would refuse. A change to a file with no `controls` list
first writes the framework's list in (the hero's own four or three), then changes it. The `shared` keys of an
action are kept as they are and not shown (two people on one keyboard is not Feel's this cycle).

`ControlsPanel` (the `card` part while Controls is the tool): one row per action (`data-action`), its words
(`WORDS.action[action]` for `left`, `right`, `jump`, `dash`; the file's `label`, `translate="no"`, for a game's
own), its keys as chips (`data-key`) and its gamepad inputs as chips (`data-pad`), each 44 px, each with a small
remove button when `canRemove`; `data-add-key` and `data-add-pad` when there is room; and one line,
`WORDS.touchLine(moves)` ("On a touch screen, the left thumb walks and the right thumb jumps", with "and a flick
dashes" when dash is on). Pressing a chip opens `KeyPicker` (`data-picker`): `WORDS.pressKey`; the next key pressed
on a keyboard, or button on a connected pad, is taken; and the list of `KEY_GROUPS` or `PAD_CHOICES` as 44 px
buttons, so a tablet alone can do it. A refusal shows its sentence beside the chip (`data-clash`) and changes
nothing. Each change is one undo step in the same `TuneEdit` and reaches Save, Export and the draft with no new
code. Play works here (ruling 15).

- [ ] **Step 1: Failing tests.**
  - `controls.test.ts`: `controlsOf` is the file's list; for `walker-game`, the framework's three; `setKey(jump, 0,
    'KeyZ')` gives `KeyZ` first; `addKey` of `Space` to `dash` is refused with `The key Space is used for both
    "jump" and "dash". Give each action its own key.`; `Escape` is refused with the framework's "kept for the
    game's menus" sentence; a ninth key and a fifth pad input are refused; `canRemove` is false for an action's only
    key when it has no pad input; the first change to `walker-game` writes the three framework controls and the
    change; every `ok` result parses with `parseContent`.
  - `keys.test.ts`: no reserved key or button is offered; every offered code and pad name has words in the English
    table; `inputWords` for `ArrowLeft`, `KeyA`, `Digit1`, `Space`, `south`, `left-stick-up`.
  - `controls-panel.browser.test.ts` (three engines, five sizes): the rows read "Walk left", "Walk right", "Jump",
    "Dash" with their chips; a chip then a pressed `KeyZ` changes it; a chip then `KeyZ` from the list does the
    same with no keyboard event; the clash shows `[data-clash]` and the chip is unchanged; a pad chip then "the
    left button" from the list; add and remove; the only key's remove is absent; Undo puts a key back; every chip
    and list button is at least 44 px; `broken` is empty with the picker open; the key pressed to choose never
    reaches a playing game.
  - `feel-controls.journey.test.ts` (five sizes, three engines), the spec's journey 4: on `ipadSideways` with no
    key event sent, Controls, the Jump row's first chip, Z from the list; Play; then one `KeyZ` press: the hero
    leaves the ground; Space no longer jumps; an Edit-level Save writes `controls` with `KeyZ` and the file equals
    `writeContent`'s bytes; in `walker-game` the first change saves a full `controls` list; "Change the keys for
    Jump" from the find bar opens that picker.
- [ ] **Steps 2 to 4:** push red; implement; the eight other tables; the scenes `feel-controls`, `feel-key-list`,
      `feel-key-clash`, `feel-pad-list`; push green.
- [ ] **Step 5:** Commit `feat(feel): choose keys and gamepad buttons by touch`. Review pictures; report `Task 12`.

---

## Part 3: Effects (pull request 5; it waits for the framework)

**Tasks 13 to 15 do not start until "Before starting" line 6 is true.** As with the redesign's Play, everything the
editors decide is here; three gaps are left because the framework has not decided them, and a short amendment,
written by the plan stage and read by the plan audit once plan F and the content folders are merged, closes them
with the framework's real names and changes nothing else:

- **G1:** plan F's call that plays one feel file once at a place in a running game (the spec's F4), and whether a
  game that is not playing can show one (if not, Show me starts a play, fires it and leaves it playing). Plan F's plan
  (pull request 111, not yet merged) names it `Game.showFeel(file, at?)`, with `Game.feel()`; the amendment checks
  those names on `main`.
- **G2:** the content folders' exact form in `automata.toml` and how `loadGame` reads a folder through the editors'
  `/api` (the open call must list a folder's files).
- **G3:** the names of the events a built-in hero raises, as plan F offers them to a feel file (`hero.landed` and
  the other seven are plan H's `MOVE_EVENTS`; the amendment only checks the names).

### Task 13: The API can add a file to a listed folder, take one away, and set the folder up

**Files:** `src/features/wire/wire.ts`, `src/features/service/change.ts` (the figure builder's `saveChange`, which
already writes several files in one commit and adds `automata.toml` entries through `list`: this task adds a removed
file and a file new to a listed folder, and builds the call itself only if neither cycle has yet), `tests/fixtures/fake-github/server.ts`, `src/features/api/api.ts`,
`src/features/game/files.ts`; tests beside each.

**What it decides:** a feel file is saved like a tuning file when it exists. A new one may be written only into a
folder the default branch's `automata.toml` lists for `feel`, named `<id>.json`, never over a file that is there.
Removing deletes one file of that folder. A game whose `automata.toml` lists no feel folder gets **one** write to
that file, ever: the block that lists `content/feel` as the feel folder, appended at the end, every other byte
kept, in the same commit as the first effect (the Owner's changed Q4; the Sound editor's "Set up sounds" is the
same step). Each is one commit, by the person's level like any save (a Suggest-level add is a waiting change), and
each is refused unless the whole game still loads. `CLAUDE.md`'s rule becomes: an editor writes only content files,
plus that one set-up line.

- [ ] **Step 1: Failing tests.** Service: add `hero-landed` into the listed folder: one commit, the file is
      `writeContent('feel', value)`, `automata.toml` untouched; add where a file of that name exists: `not-allowed`;
      add into a folder not listed: `not-allowed`; remove: the file is gone in one commit; a game with no feel
      folder: the first add's commit holds the new file and `automata.toml` with exactly one block more, the rest
      byte for byte; a second add does not touch it; a Suggest-level add is a waiting change that holds both files;
      a feel file with all four effects off is `broken` with the framework's sentence.
- [ ] **Steps 2 to 5:** red, implement, green, commit `feat: the editors can add and remove an effect file`.

### Task 14: The effects list and its cards

**Files:** `src/features/feel/effects.ts`, `EffectsPanel.svelte`, `EffectCard.svelte`, `Feel.svelte`, the words,
the find-bar kinds (`feel-add-effect`, `feel-effect:<id>`, `feel-show:<id>`, `feel-remove:<id>`); tests beside each.

**What it decides:**

```ts
// effects.ts
/** The id for a new effect on this event: the event with dots as dashes ("hero-landed"), then "-2" and up when taken. */
export function effectId(on: string, taken: readonly string[]): string
/** The events offered, best first: the built-in hero's that are on, then every `on` in the game's feel files. */
export function eventsOffered(content: GameContent): readonly string[]
/** A new effect as the framework's defaults make it: dust on, the rest off. */
export function newEffect(id: string, on: string): FeelFile
export function setEffect(file: FeelFile, kind: 'dust' | 'shake' | 'freeze' | 'buzz', value: object | undefined): FeelFile
/** "dust, a buzz": what a card's title line lists. */
export function effectSummary(words: Words, file: FeelFile): string
```

The Effects tool loses its tag. Its panel is a list of cards, one a feel file: `WORDS.whenHappens(event words)` and
the summary. A card opens its four effects, each a switch and, when on, its numbers as `Slider`s over the
framework's limits, in a person's units (`shown`'s rules: ticks as seconds, tiles, counts): Dust (how many, color
from the game's palette or typed, how fast, how long), Shake (how hard, how long), Freeze (how long), Buzz (how
strong, how long). Turning the last one off is refused with the framework's "Say what happens" sentence. "Add an
effect" asks for the event from `eventsOffered` (a typed name is allowed and shown as typed) and makes
`newEffect`. Remove asks once ("Remove this effect?"). Every change is an undo step in an undo list of the game's
feel files; Save writes each changed, added or removed file (Task 13), Export copies the open card's file. Event
words are the editors' for the hero's eight ("lands", "jumps", "jumps off a wall" …); any other event shows as
typed.

- [ ] **Step 1: Failing tests.** `effects.test.ts`: `effectId('hero.landed', [])` is `hero-landed`, with it taken
      `hero-landed-2`; `eventsOffered` leaves out `hero.dashed` with dash off; every result of `setEffect` parses;
      the last effect off is refused with the framework's sentence. Browser, five sizes: the cards, a switch, each
      slider within the framework's limits, the color choice, nothing under 44 px, `broken` empty.
- [ ] **Steps 2 to 5:** red, implement, green, commit `feat(feel): what happens when something happens`.

### Task 15: Feeling an effect, and the last journey

**Files:** `src/features/levels/play.ts` (`Playing.show(file: FeelFile)`, by G1), `EffectCard.svelte`, the scenes,
the docs, `tests/journeys/feel-effects.journey.test.ts`.

**What it decides:** effects fire in the same live play, as the game fires them, from the feel files as they are on
screen (a changed effect restarts nothing: the amendment says whether plan F takes changed files live or the play
is handed them through G1's call). **Show me** on a card fires that file once at the hero, playing or not. Buzz
plays where the device can and otherwise the card says `WORDS.buzzSays(strength, seconds)`. Reduced motion shows the
framework's still form. The editors draw no effect themselves: a canvas pixel test holds that the only change on
screen during Show me is on the canvas.

- [ ] **Step 1: Failing tests** (five sizes, three engines), the spec's journey 8: an Edit-level person opens
      Effects on the test game (which gains `content/feel/land.json` in this task), presses Show me on "When the
      hero lands": two pictures of the canvas 100 ms apart differ near the hero and no page element was added over
      the stage; adds "When the hero jumps", turns Shake on, Save: the pretend GitHub has
      `content/feel/hero-jumped.json` equal to `writeContent`'s bytes and `automata.toml` is unchanged; in a game
      with no feel folder the same save adds the one block; Remove and Save deletes the file; Play, land: the dust
      shows with no Show me.
- [ ] **Steps 2 to 4:** red, implement, green; the scenes `feel-effects`, `feel-effect-open`, `feel-effect-add`.
- [ ] **Step 5:** Commit `feat(feel): feel an effect right there`. Review pictures. Tracker: stage 4 complete.
      Report Tasks 13 to 15 and the summary.

---

## After the build (stages 5 and 6)

They start when Task 12 is merged and do not wait for Part 3, as the redesign's did not wait for Play. Three audits,
each to `docs/superpowers/audits/`: the implementation audit of the code against this plan and the spec (Opus,
medium, the audit prompt); the drunk-grandma audit of every Feel scene at the five sizes, which also back-translates
every Feel word in the nine tables (Opus); and the visual audit against the approved mockup (Fable, the Owner's
rule for design audits). Part 3 ends with the same three on its own scenes. Stage 6 fixes every finding and
republishes the review artifact before the Owner is asked to look.

## Appendix A: new words (English, `en.ts`)

| Key | Text |
|---|---|
| `toolMoves`, `toolControls`, `toolEffects` | Moves, Controls, Effects |
| `soonEffects` | Effects will let you add dust, a shake or a buzz when something happens. |
| `soonCharactersMoves` | For now the switches are in the hero's file. Your agent can turn one on: "double-jump": true. |
| `moveWalk`, `moveJump`, `moveDoubleJump`, `moveWallJump`, `moveDash`, `moveMore` | Walk, Jump, Double jump, Wall jump, Dash, More |
| `movesOff(names)` | {names} is off. / {names} are off. (the names joined the language's way) |
| `toCharacters` | Turn on in Characters |
| `notInFile` | Not in the file yet |
| `reset`, `range` | Reset, Range |
| `rangeLeast`, `rangeMost`, `rangeStep` | Least, Most, One step |
| `rangeLimits(min, max)` | A game can use {min} to {max}. |
| `rangeOrder`, `rangeStepBad` | The least must be under the most. / One step must be more than nothing. |
| `rangeMoved` | The number was outside, so it moved inside. |
| `perSecond(n)` | {n} tiles a second |
| `seconds(n)` | {n} seconds |
| `atOnce`, `cutOff` | At once, Off |
| `keepsHalf`, `keepsQuarter`, `keepsThreeQuarters`, `keepsShare(percent)` | Keeps half, Keeps a quarter, Keeps three quarters, Keeps {percent}% |
| `number['walk-speed']` | How fast it walks |
| `number['walk-grip']` | How fast it starts and stops |
| `number['air-grip']` | How quickly it turns in the air |
| `number['jump-speed']` | How high it jumps |
| `number['jump-cut']` | Let go early to jump lower |
| `number['ledge-grace']` | Jump just after leaving a ledge |
| `number['early-press']` | Press jump just before landing |
| `number['fall-speed']` | Fastest it falls |
| `number['air-jumps']` | Jumps in the air |
| `number['air-jump-speed']` | How high an air jump goes |
| `number['wall-slide-speed']` | How fast it slides down a wall |
| `number['wall-jump-out']` | How far a wall jump pushes away |
| `number['wall-jump-up']` | How high a wall jump goes |
| `number['wall-jump-lock']` | How long it stays off the wall |
| `number['dash-speed']` | How fast a dash goes |
| `number['dash-ticks']` | How long a dash lasts |
| `number['dash-rest']` | Wait before the next dash |
| `number['air-dashes']` | Dashes in the air |
| `numberInfo['walk-speed']` | How far the hero gets in a second at a full walk. |
| `numberInfo['walk-grip']` | How long it takes to reach full speed, and to stop. Short feels sharp. Long feels like ice. |
| `numberInfo['air-grip']` | The same, in the air. Short lets the player steer a jump. Long makes a jump keep its path. |
| `numberInfo['jump-speed']` | How hard the hero leaves the ground. More goes higher and farther. |
| `numberInfo['jump-cut']` | A quick tap gives a small hop and a long press the full jump. This is how much of the jump a tap keeps. |
| `numberInfo['ledge-grace']` | Lets a jump still work for a moment after running off an edge, so the player never feels cheated. |
| `numberInfo['early-press']` | Lets a jump pressed a moment too early still happen on landing, so the game feels like it listens. |
| `numberInfo['fall-speed']` | The hero never falls faster than this, so a long fall can still be steered. |
| `numberInfo['air-jumps']` | How many more jumps the hero gets before it touches the ground again. |
| `numberInfo['air-jump-speed']` | How hard a jump in the air pushes up. |
| `numberInfo['wall-slide-speed']` | Holding toward a wall slows the fall to this. Lower gives more time to jump off. |
| `numberInfo['wall-jump-out']` | How hard a wall jump pushes the hero away from the wall. |
| `numberInfo['wall-jump-up']` | How hard a wall jump pushes the hero up. |
| `numberInfo['wall-jump-lock']` | For this long after a wall jump the hero keeps moving away, so it cannot slide straight back. |
| `numberInfo['dash-speed']` | How fast the hero moves during a dash. Faster goes farther. |
| `numberInfo['dash-ticks']` | How long one dash goes on. Longer goes farther. |
| `numberInfo['dash-rest']` | How long the player waits before the hero can dash again. |
| `numberInfo['air-dashes']` | How many dashes the hero gets before it touches the ground again. |
| `noteUp(n)`, `noteUpShort(n)` | Reaches {n} tiles up, Reaches {n} up |
| `noteAcross(n)`, `noteAcrossShort(n)` | {n} tiles across, {n} across |
| `noteAir(n)` | with an air jump (n is 1), with {n} air jumps |
| `noteDash(n)` | Dash: {n} tiles |
| `sheetPlay` | Play |
| `ownCode` | This game's hero is moved by its own code, so there's nothing to tune here yet. |
| `ownCodeNumbers` | These numbers are in the game's files. You can change them here. |
| `tipFeelPlay` | Press Play and jump. |
| `tipFeelSlide` | Now slide this and jump again. |
| `tipFeelSave` | Feel that? It's saved on your screen. Press Save to keep it for your team. |
| `tipFeelExport` | Feel that? Press Export to keep it. |
| `cmdFeelTab(move)`, `cmdFeelMore(label)`, `cmdFeelLess(label)` | Show the {move} numbers; {label}, a little more; {label}, a little less |
| `cmdFeelReset(label)`, `cmdFeelGo(label)` | Reset {label, lower case}; Change {label, lower case} |
| `changeNumbers`, `changeControls` | What changed, The keys and buttons changed |
| `action.left`, `action.right`, `action.jump`, `action.dash` (Task 12) | Walk left, Walk right, Jump, Dash |
| `keysOf`, `padOf` (Task 12) | Keys, Gamepad |
| `addKey`, `addPad`, `removeInput(name)` (Task 12) | Add a key, Add a button, Remove {name} |
| `pressKey`, `pressPad`, `orChoose` (Task 12) | Press a key, Press a button on your gamepad, or choose one: |
| `keyArrows`, `keyLetters`, `keyNumbers`, `keyOther` (Task 12) | Arrows, Letters, Numbers, Other keys |
| `key.*` (Task 12) | Left arrow, Right arrow, Up arrow, Down arrow, Space, Left Shift, Right Shift, Enter, Left Ctrl, Right Ctrl, Left Alt, Right Alt, Backspace (letters and digits are themselves) |
| `pad.*` (Task 12) | the bottom button, the right button, the left button, the top button, the left shoulder, the right shoulder, the left trigger, the right trigger, the pad, left / right / up / down, the left stick, left / right / up / down, the right stick, left / right / up / down |
| `touchLine`, `touchLineDash` (Task 12) | On a touch screen, the left thumb walks and the right thumb jumps. / … and a flick dashes. |
| `cmdFeelKey(action)`, `cmdFeelPad(action)` (Task 12) | Change the keys for {action}, Change the gamepad buttons for {action} |
| `whenHappens(what)`, `event.*` (Part 3) | When the hero {what}; lands, jumps, starts walking, leaves the ground, jumps in the air, slides down a wall, jumps off a wall, dashes |
| `effectDust`, `effectShake`, `effectFreeze`, `effectBuzz`, `addEffect`, `showMe`, `removeEffect`, `removeEffectAsk` (Part 3) | Dust, Shake, Freeze, Buzz, Add an effect, Show me, Remove, Remove this effect? |
| `dustCount`, `dustColor`, `dustSpeed`, `dustLife`, `shakeHard`, `howLong`, `buzzStrong` (Part 3) | How many, Color, How fast, How long, How hard, How long, How strong |
| `buzzSays(strength, seconds)` (Part 3) | Buzz: {strength}, {seconds} seconds |

## Appendix B: every Feel screen state

Each at the five sizes, added to the redesign's scene list; `(stage)` scenes also run the level rules.

**Moves:** `feel-moves-still` (stage; the note at the hero's feet), `feel-jump-tab` (stage), `feel-number-info`,
`feel-range`, `feel-move-off` (`walker-game`), `feel-own-code` (`plain-game`), `feel-note-changed` (stage; the old arc
faded), `feel-note-all-moves` (stage), `feel-playing` (stage), `feel-playing-sheet-up` (`narrow` holds the game
still; the others are as playing), `feel-tip-play`, `feel-tip-slide`, `feel-tip-keep`, `feel-saved`, `feel-exported`,
`feel-changed-elsewhere`, `feel-change-waiting`, `feel-de`, `feel-ru`, `feel-ja`, `feel-long-names`.

**Controls:** `feel-controls`, `feel-key-list`, `feel-key-clash`, `feel-pad-list`.

**Effects (Part 3):** `feel-effects`, `feel-effect-open`, `feel-effect-add`.

## Self-review

- **Spec coverage.** Goal 1: Tasks 3, 4, 8. Goal 2: Tasks 6, 7, 8. Goal 3: Task 12. Goal 4: Tasks 13 to 15. Goal 5:
  Task 9. "What Feel edits": Tasks 2 and 10 (the tuning file), 13 (feel files, the one set-up line); the character
  file and the level are never written (no task writes them; Task 2's save test refuses a character's path). "The
  screen" at every size: Tasks 4, 5, 8. "Which numbers show", "The eighteen numbers, in words", "The range of a
  slider": Tasks 3 and 4. "Feeling it": Tasks 7 and 8. "Undo, saving, Export": Tasks 3, 8, 10. "The first run" and
  the hero moved by its own code: Tasks 9 and 5. "Agent-first": Task 9. "Languages": Task 10. "What Feel needs from
  the framework": plan G (F1 to F3); F4 is gap G1. "Testing": the unit, DOM and real-browser lists are in Tasks 3
  to 8 and 12; journeys 1, 2 and 5 are Task 10, 3 is Task 8, 4 is Task 12, 6 is Task 9, 7 is Task 5, 8 is Task 15;
  the screens are Appendix B. Anti-goals: one move at a time (Task 4); a number that lies (Task 6's rule); tuning
  that needs skill (Task 7 draws the note with nothing pressed); a slider that takes the thumb's walk (Task 8,
  Review Focus 3); play that keeps something (Task 8's Stop tests); a key without a keyboard (Task 12).
- **Where this plan differs from the spec, and why.** Q4 is the Owner's later answer, so nothing appends a line an
  effect (Part 3). Find-bar ids follow the redesign (ruling 16). `jump-cut` has no "third" (ruling 12). The other
  eight languages are the build's (ruling 17). A third test game (ruling 18). A waiting tune has its own view
  (ruling 19), which the spec does not mention and journey 5 needs. While playing, Feel keeps the frame (ruling 7). The spec says both "Moves opens playing" and that Moves opens with
  the level still and the tip "Press Play and jump."; the plan follows the second, which its first run needs (plan
  audit E7). Two slider words are shorter than the spec first had them, because the spec's 32-character
  limit refused them in English: `walk-grip` "How fast it starts and stops" (was 35) and `wall-jump-lock` "How long it
  stays off the wall" (was 36); the spec's table is amended with them (plan audit E1).
- **Open.** The three gaps of Part 3, which only the framework's cycles can close, and the Owner's approval of the
  mockups, which may amend the screens.
- **Types.** `TuneEdit` (Task 3) is what `Feel` reports (Task 5) and `FeelScreen` saves (Task 10); `NumberRow` is
  what `MovesPanel` draws; `Playing` (Task 8) is what `Feel` drives; `Changed` (Task 12) feeds `step`; Task 2's
  content calls take the framework's `ContentType`, and Task 13 adds a removed file and a file new to a folder.
