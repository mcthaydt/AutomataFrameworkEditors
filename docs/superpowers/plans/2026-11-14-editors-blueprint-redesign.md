# The Editors' Blueprint Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (project rule). Tests run only in GitHub-hosted CI:
> "run" in a step means push and read the pull request's checks with `gh pr checks <number> --watch`.

**Goal:** Every screen of the editors looks and works like the agreed Blueprint mockup: the level fills the window in
the game's real art, the tools float, a first visit ends in a real change in under a minute, in nine languages with
none as the default.

**Architecture:** The framework draws the level (a new still picture of a level, with room kept on four sides); the
editors lay page elements over that canvas (hit buttons, notes, tips, stamps) and never draw on it. One `Frame`
(pill top left, cluster top right, floating panels) is shared by every screen. Every word comes from one table per
language, read through one reactive `WORDS`; every action has one entry in a command list that the find bar, the
buttons and `docs/commands.md` share.

**Tech stack:** Svelte 5, strict TypeScript, Vite 8, Vitest 5 (Node, three browser engines, journeys with
Playwright), `@automataframework/framework` pinned by commit, Cloudflare Pages Functions for `/api`.

**Spec:** [`docs/superpowers/specs/2026-11-14-editors-blueprint-redesign-design.md`](../specs/2026-11-14-editors-blueprint-redesign-design.md).
The mockup is the "Notes on" screen of the private notes' moodboard. The flag set and the order of languages are
the framework's [`2026-11-14-no-default-language-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-14-no-default-language-design.md).

**Plan audit:** [`audits/2026-11-14-blueprint-redesign-plan-audit.md`](../audits/2026-11-14-blueprint-redesign-plan-audit.md).
Its findings are written into this plan, each marked `(audit I<n>)` or `(audit M<n>)`. Its Owner question Q1 blocks
Task 7 (PRs 1 to 4 go ahead); Q2 blocks nothing until Task 19's amendment. Neither is defaulted.

This plan replaces `plans/2026-11-14-editors-restyle.md`. Pull request 12 (branch `claude/project-thread-lezp37`,
head `e0648b0`) is not merged; "from PR 12" below means `git show e0648b0:<path>`, copied and then changed only as
the task says.

## Global Constraints

- **Identity.** Before every commit: `git config --global user.name "McThayDT" && git config --global user.email
  "107786093+mcthaydt@users.noreply.github.com"`. Install the local hook that refuses any other author or committer
  before the first commit in a clone. No Claude attribution anywhere. Pull request bodies start with the project's
  two attribution lines and credit "Requested by **McThayDT**". Never force-push.
- **Tests only in CI.** Never run `vitest` locally. `pnpm install`, `pnpm format`, `pnpm lint`, `pnpm typecheck`,
  `pnpm knip` and `pnpm build` may run locally; they are not tests.
- **Branches.** `main` plus at most five with CI running. Each pull request below is one branch, opened as a draft,
  merged by the merge session before the next one starts. A screen-changing pull request is not reported finished
  until its review artifact is published (see "Review pictures").
- **Dependencies.** Only these may be added, exact versions: `@fontsource-variable/fraunces` 5.3.0,
  `@fontsource-variable/onest` 5.3.1, `@fontsource/jetbrains-mono` 5.3.0, `@phosphor-icons/core` 2.1.1 (Task 4);
  `@fontsource/noto-sans-kr`, `@fontsource/noto-sans-jp`, `@fontsource/noto-sans-sc` at the newest 5.x on npm the day
  Task 17 runs (5.3.1 for JP and SC on 2026-11-14). `pixi.js` leaves `package.json` in Task 3. **Anything else: stop,
  report to the coordinator, wait.**
- **The header stays** (`public/_headers`): no font, icon, script or picture from another address, no inline script,
  no `style="…"` attribute in markup (Svelte `style:` directives are fine), no `blob:` picture. `data:` pictures are
  allowed by the header as it is and are used only for faces (Task 14).
- **The device keeps** only what `CLAUDE.md` lists, plus `af.notes`, `af.language` and `af.panels`.
- **Sizes.** Five, named so everywhere: `phone` 390 × 844, `phoneSideways` 844 × 390, `ipadUpright` 820 × 1180,
  `ipadSideways` 1180 × 820, `desktop` 1440 × 900.
- **Touch.** 44 px or more for anything pressed, 48 for a main button, 56 for a tool. Nothing shrinks or gets an
  ellipsis to fit.
- **Colors.** `--ground #253122`, `--words #f5ecc2`, `--touch #eeb480`, `--mark #837e31`, `--raised #313c2c`
  (6% words in ground), `--quiet #b7b492` (70%). Named only in `src/features/ui/ui.css`. `--touch` only on what a
  finger can act on. `--mark` never carries words. Flags' own colors live only in `src/features/words/flags/*.svg`.
- **Type.** Sentences and buttons 18 px or more, never capitals. Labels (`.label`): Onest, capitals by CSS,
  letter-spacing 0.07em, 13 px or more. Numbers (`.measure`): JetBrains Mono, tabular, 15 px or more. Titles:
  Fraunces, then the words face.
- **Panels.** `--raised` at 94% opacity, 10 px backdrop blur, 1 px edge of words at 35%, 3 px corners, the one
  shadow. Nothing else has a shadow.
- **Motion.** 150 ms controls, 200 ms notes and panels, ease-out, no bounce; under reduced motion a plain fade of
  the same length. Tests read `animation-name`, never `getAnimations()`.
- **Words.** Every word a person reads is in `src/features/words/`; US spelling; no "repo", "commit", "branch",
  "pull request" or "token" (and the rest of `tests/fixtures/banned.ts`) in any language. New docs and comments use
  US spelling; existing docs and file names (`licences.txt`) keep theirs.
- **Languages, one order everywhere:** `zh`, `es`, `en`, `pt`, `ru`, `ja`, `ko`, `de`, `fr`. A list a person sees
  puts their own language first and moves nothing else. `'en'` is never a fallback in code.
- **The canvas draws the game and nothing else.** No ring, grid, tint or outline is drawn on it.
- **An editor changes only content files**, written by the framework's `writeContent`, and never runs a game's code.
- **Every task has end-to-end journeys**, run at all five sizes in Chromium, WebKit and Firefox.
- **Stop rules.** Stop and report to the coordinator at once on: a failing check you cannot explain in one sentence;
  the third fix for the same failure; a need for a dependency or a workflow change not named here; an `engines` job
  over 25 minutes; any Owner question. Never default on an Owner question.

## The Owner's answer on Play (2026-11-14)

The spec's Play "plays the level with the framework" and never runs a game's code. In every game today the hero's
movement and the controls are the game's own code, so the framework alone can only let things fall. The Owner was
asked, and answered **B**: Play is real play, built as this redesign's **last slice**, after a framework cycle adds
a built-in walk-and-jump that a game turns on in its own files. That framework cycle has its own spec and plan in
AutomataFramework. So Tasks 1 to 18 build everything but Play: until Task 19 the tools are Move, Add and Erase,
no screen shows a Play button, and nothing says "coming soon" about it. Task 19 adds it.

## Rulings made by this plan

The spec leaves these to the builder. The plan audit may challenge each.

1. **Shapes, by the frame's own box, not the device:** `wide` when width ≥ 1024 and height ≥ 600 (`ipadSideways`,
   `desktop`); `narrow` when width < 600 (`phone`); `mid` otherwise (`ipadUpright`, `phoneSideways`).
2. **Room kept clear of the level** (CSS px; top, right, bottom, left), the least room: `wide` 80, 320, 88, 96;
   `mid` 72, 16, 88, 16; `narrow` 64, 8, 144, 8. `Levels` measures the tools' panel and the bottom row (a
   `ResizeObserver`) and keeps, on each side, the larger of the least room and the measured part plus 16, so a long
   tool word in another language never covers the level (audit I1). The room changes only when the language or the
   panels change, never when a thing is picked, a stamp lands or a notice shows. The card's space on `wide` is always
   kept, so picking a thing never refits the level. On `mid` and `narrow` the card is a bottom sheet over the level
   and may cover it; it pulls down to its title. On `narrow` undo and redo are their own small panel just above the
   tools' right end, not in the tools' row, which four tools fill (audit I2).
3. **The level's least height** is 320 px. On `narrow` the stage is as tall as the window (at least 320 px) and the
   page scrolls below it to the notes' switch and the title block.
4. **Names in words.** A character or level has only an id. Its name in words is the id with dashes as spaces and a
   capital first letter (`crate` → "Crate", `level-1` → "Level 1"), by `nameOf(id)`. The framework's formats have no
   description for a character today, so the card's "what it is" line is left out.
5. **Start points** can be picked, moved and (unless the last) erased like things; their hit id is `start-<player>`.
   Add never adds a start point.
6. **The "Coming soon" card links nowhere.** It has the icon, the name, one sentence and "OK".
7. **Faces** are the person's GitHub picture fetched by this site's `/api` and shown as a `data:` picture, with the
   first letter of their name on a disc until it arrives or if it cannot.
8. **A stamp stays** until the next press anywhere outside it.
9. **Translations** are written by the building session in plain words, checked by tests (complete, placeholders
   kept, banned words, length), then read in full by the drunk-grandma audit, which back-translates every table.
   No native speaker has read them; the audit says so to the Owner in one line. There are no read marks this cycle.
10. **The editors draw their own nine flags** now. When the framework ships its six, a later pin move may take those.
11. **Level pictures on cards** are drawn by one shared hidden level picture and copied onto a 2D canvas each, so a
    wall of games never opens more than two WebGL contexts.
12. **Art that cannot be loaded** (a missing or old picture) does not stop a level: it opens as boxes with one
    notice saying pictures are missing.
13. **One framework addition** (Task 2): the framework's renderer draws only from a stepped sim and keeps room only
    at the bottom, so a still level fitted between four panels needs `createLevelPicture`.
14. **Until Task 17 lands, `main` shows English only**, as it does today. Nothing is released from `main`. This holds
    only while no site is deployed from this repo's `main`: if one is, stop and report before PR 5 merges (audit M11).
15. **A game that has not turned the built-in hero on** still has the Play tool. Pressing it plays nothing and says
    why in one notice (`playNeedsCode`). The spec's "offers to open the game's own page" is left out: no file of a
    game names the address it is played at. If the framework's cycle adds one, Task 19's amendment adds the link.
16. **The two audits do not wait for Play.** They run after Task 18 on every screen that exists, so the redesign
    can reach the Owner's review while the framework's cycle runs. Task 19 ends with the same two audits on its
    own screens.
17. **Panels close and open** (the Owner, 2026-11-14, after the spec was merged: "close and open panels", to hide
    things when overwhelmed and expand it all as a power user. This extends the spec). Four parts can be closed
    wherever they float: `tools`, `card`, `block` and `switch`. The pill and the cluster never close, so the
    level's name, Find, Save and Export are always there. A closed part leaves a 44 px handle at its own edge
    that opens it again; one more control hides or shows all four at once. Everything is open on a first visit.
    Closing or opening a part never moves or resizes the level (the room of ruling 2 is kept either way). A
    chosen tool stays chosen while the tools are closed, and picking a thing does not open a closed card. What is
    closed is kept on the device in `af.panels`. On `narrow`, `block` and `switch` are already in the scroll under
    the level and do not close.

18. **The title block is a drawing's title block**: a 2 × 2 grid of cells (game | level, editor | saved), labels,
    at most 72 px tall. On `mid`, when the bottom row does not fit in a language, it shows its level and saved cells
    only, since the pill names the game and the editor (audit I2).
19. **Tool words are at most 9 characters** in every language; a word that does not fit is translated shorter,
    never shrunk or cut (audit I1).

## Review Focus

Inputs the spec implies and a person will meet. Each has its test in the task named.

1. **A game with no art at all** (the demo game today): the level screen shows boxes on sky exactly as the game
   does, and the notes, ring and tips still read over the pale sky. Task 3 (`level-picture.browser.test.ts`,
   "a game with no pictures draws boxes") and Task 9 (grid contrast on `#9fd3f0`).
2. **A level with nothing in it, or only a start point:** no crate to drag. The tip points at Add. Task 12
   (`guide.test.ts`, "an empty level's first tip is Add").
3. **The clipboard is refused** (Firefox, an insecure origin): Export still ends in the level's text, selected, and
   the first run still finishes. Task 11 (`export.journey.test.ts`, "clipboard refused").
4. **A device with no storage, or storage full of rubbish** (a private window): language, notes and tips fall back
   to the device's language, notes on and tips shown, and nothing throws. Tasks 9, 12 and 17 (each store's test
   has "a store that throws").
5. **Long words and long names:** German and Russian words, and a game called
   "The Extraordinarily Long Adventure of Sir Reginald" with level `the-very-long-level-name-number-twelve`. Nothing
   is cut, Save and the tools keep their size, no two floating parts overlap. Task 18 (`screens.journey.test.ts`,
   the `long-names` scenes and the `de`, `ru`, `ja` scenes).

---

## File structure

Layers, lowest first (update `LAYERS` and `PAGE_SIDE` in `tests/architecture/rules.ts` in the task that adds one):
`words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`, `levels`, `find`,
`suite`.

```
src/features/words/
  words.svelte.ts      WORDS (reactive), setLanguage, language()            Task 5, 17
  table.ts             the Words type; nameOf                               Task 5
  en.ts … fr.ts        one table per language (en in Task 5, eight in 18)
  languages.ts         LANGUAGES, LANGUAGE_NAMES, LANGUAGE_TAGS, SOURCE, matchLanguage, listFor   Task 17
  kept.ts              readLanguage, keepLanguage (af.language)             Task 17
  format.ts            ago, tiles (dates and numbers the language's way)    Task 11, 17
  flags.ts, flags/*.svg  nine flags as SVG text                             Task 17
src/features/ui/
  ui.css               tokens                                               Task 4
  icons.ts, Icon, Button, Choice, Notice, Tool, Stamp   from PR 12, changed Task 4, 11
  Panel, Chip, Sheet, TitleBlock, Menu                                      Task 7, 8
  Face.svelte                                                               Task 14
  Flag.svelte                                                               Task 17
src/features/game/
  pictures.ts          readPictureFor(api, game)                            Task 3
  art.ts               loadLevelArt                                         Task 3
  (copy, draft, open, recent, save stay)
src/features/levels/
  level-picture.ts     the framework's still picture, wrapped               Task 3
  edit.ts, compare.ts, place.ts, ids.ts                                     Task 6
  layout.ts            shapeOf, roomFor                                     Task 7
  Stage.svelte         canvas + hit buttons + notes layer                   Task 7, 9
  Levels.svelte        the editor: tools, stage, card, undo, switch, block  Task 7 to 10
  ThingCard.svelte                                                          Task 8, 10
  notes.ts, notes-mode.ts (from PR 12), Notes.svelte                        Task 9
  AddTray.svelte                                                            Task 10
  play.ts, Play.svelte                                                      Task 19
  Thumb.svelte, thumbs.ts                                                   Task 15
src/features/find/
  commands.ts          the command list                                     Task 13
  FindBar.svelte                                                            Task 13
src/features/suite/
  Frame, Pill, Cluster, Switcher, ComingSoon                                Task 7
  LevelScreen                                                               Task 7, 11
  SignInPanel, Leave                                                        Task 11
  guide.ts, Tip.svelte                                                      Task 12
  Games, GameHome, Waiting                                                  Task 15
  Share, WaitingChange, NotFound                                            Task 16
  LanguagePicker                                                            Task 17
  App.svelte, route.ts, suite.ts                                            Task 7, 12, 16, 17
```

Deleted along the way: `levels/level-canvas.ts` (Task 3); `suite/Guide.svelte`, `suite/Welcome.svelte` (Task 12);
`suite/PickGame.svelte`, `suite/AddEditor.svelte` (Task 15); `ui/Screen.svelte` (Task 16); `words/words.ts`
(Task 5).

Test hooks, used by every later task: `[data-frame]` with `data-shape="wide|mid|narrow"`; `[data-part]` on each
floating part (`pill`, `cluster`, `tools`, `card`, `switch`, `block`, `undo`, `tip`, `stamp`, `notice`, `find`,
`tray`, `sheet`); `[data-tool="move|add|erase"]` with `aria-pressed` (`play` joins in Task 19); `[data-thing]`
with `data-x`, `data-y`
(a start point is `start-1`); `[data-scale]` on the stage; `[data-clear]` on an empty element laid exactly over the
clear cell; `[data-handle="tools|card|block|switch"]` on a closed part's handle and `[data-close]` on a part's own
close button; `[data-note="left|top|name|joint"]`; `[data-stamp]`; `[data-lang]` on a flag button.

## Review pictures

At the end of every pull request that changes a screen, after its checks are green:

- [ ] Read the pull request's pictures from the `ci-screens` branch (`pr-<number>/<engine>/<name>.png`, through
      `gh api repos/mcthaydt/AutomataFrameworkEditors/contents/...?ref=ci-screens`; the artifact host is refused in
      a cloud session).
- [ ] Publish one Claude artifact: a line at the top saying plainly whether these pictures show the final look (they
      do not until Task 18); then one section per screen in the order a person meets them, each with five pictures
      labeled Phone landscape, Phone portrait, Tablet portrait, Tablet landscape, Desktop landscape. Chromium's
      pictures; WebKit's too for the level screen. Pictures go up as the artifact's files, in several publishes if
      one is over 64 MB. From Task 7 on, the first section puts the mockup's "Notes on" screen beside the real level
      screen at tablet landscape.
- [ ] Report the artifact's link to the coordinator with the task lines.

---

## Pull request 1: the framework pin

### Task 1: Move the framework pin to today's `main`

**Files:**
- Modify: `package.json` (the dependency and the matching `pnpm.onlyBuiltDependencies` line), `pnpm-lock.yaml`
- Modify: whatever no longer compiles against the new framework, and nothing else
- Test: `tests/workflows/package.test.ts` (it already holds the two lines to the same commit)

**Interfaces:**
- Produces: `@automataframework/framework` at the newest commit of AutomataFramework's `main` whose checks are all
  green when the task starts, `86a4966` or later. The framework's `loadArt`, `needsPictures`, `paintedPath`,
  `artFiles`, `ArtError`, `ReadPicture` exist from here on.

- [ ] **Step 1:** `gh api repos/mcthaydt/AutomataFramework/commits/main --jq .sha`, then
      `gh api repos/mcthaydt/AutomataFramework/commits/<sha>/check-runs --jq '.check_runs[].conclusion' | sort -u`
      must print only `success` (and `skipped`). If not, take the newest ancestor that does.
- [ ] **Step 2:** Put the full 40-character sha in both lines of `package.json`. `pnpm install --lockfile-only`,
      then `pnpm install --frozen-lockfile`.
- [ ] **Step 3:** `pnpm typecheck && pnpm lint && pnpm knip && pnpm build`. Fix only what the move broke. Expected
      on 2026-11-14: none. If `loadGame` now refuses the fixture game (a `source` line once the framework's language
      plan lands), add what its sentence asks to `tests/fixtures/game/automata.toml` and say so in the commit.
- [ ] **Step 4:** Commit `chore: pin the framework to <short sha>`, push, open the draft pull request, and read
      `check` and the three `engines` jobs. Expected: all green, every journey as before.
- [ ] **Step 5:** Tracker line; report `Task 1: <commit>, <test count>, surprises`.

No screen changes: no review artifact.

---

## Pull request 2 (in AutomataFramework): a level drawn still

### Task 2: `createLevelPicture`

Done on a branch of **mcthaydt/AutomataFramework**, following that repo's `CLAUDE.md`. Its pull request body names
this plan and task. Its tracker (`docs/superpowers/progress.md` there) gets one log line.

**Files:**
- Create: `src/features/render/still.ts`
- Modify: `src/features/render/stage.ts` (room on four sides; `keep`), `src/features/render/render.ts` (exports)
- Modify: `docs/api/framework.api.md` by `pnpm build && pnpm api-report --update`; a `patch` changeset
- Test: `tests/features/render/still.test.ts`, `tests/features/render/still.browser.test.ts`

**Interfaces:**
- Consumes: `tileRuns`, `tileBoxes`, `groundOf`, `skyOf`, `levelSize`, `usesSprites`, `colourNumber`, `fitWorld`,
  `createStage`, `loadArt`'s `Art`, the scene's `View` and `RopeLine`.
- Produces, exported from the browser entry:

```ts
/** CSS pixels kept free of the level on each side. The sky and the backdrop still fill the canvas. */
export interface Room { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number }

/** `fitWorld` of the box less its room, moved right and down by the room. No room left is scale 0, never NaN. */
export function fitInRoom(box: { w: number; h: number }, room: Room, world: { w: number; h: number }): Fit

/**
 * A level as it is written, with nothing run: the ground boxes `spawnLevel` makes, every thing at its place in its
 * character's size and color (and, in a game with figures, its sprite in the first pose facing right), each start
 * point as that player's hero, and each joint as its pin or rope. Sids count from 1 in that order.
 */
export function levelViews(content: GameContent, level: Level): { views: View[]; links: RopeLine[] }

export interface LevelPicture {
  readonly canvas: HTMLCanvasElement
  /** Draws this version of the level. Its size, tileset and backdrop must be those the picture was made with. */
  show(level: Level): void
  /** Draws again with this room. */
  setRoom(room: Room): void
  /** Where the level is on the canvas now: `fitInRoom` of the mount's size. */
  fit(): Fit
  /**
   * Removes the canvas and frees Pixi and the art. Safe to call twice. The picture owns the `Art` it was given, as
   * `createRenderer` does: never hand one `Art` to two pictures (audit I6).
   */
  destroy(): void
}

/** Fills `mount` with a canvas showing `level`, and refits when `mount` changes size. */
export function createLevelPicture(options: {
  mount: HTMLElement
  content: GameContent
  level: Level
  art?: Art | undefined
  density?: Density | undefined
  /** Keeps what was drawn readable afterwards (a test, a copy onto another canvas). Default false. */
  keep?: boolean
}): Promise<LevelPicture>
```

- [ ] **Step 1: Failing Node tests** in `still.test.ts`:
  - `fitInRoom({w:1180,h:820}, {top:80,right:320,bottom:88,left:96}, {w:16,h:9})` is
    `{ scale: 47.75, left: 96, top: 80 + (652 - 9 * 47.75) / 2 }`; zero room equals `fitWorld`; room larger than the
    box is `{ scale: 0, left: 0, top: 0 }`.
  - `levelViews` of the full game's `level-1`: for every entity `sim.query(Transform, Look)` gives in a
    `createGameSim` of the same content at tick 0 with players `[1, 2]`, there is a view with the same `x`, `y`, `w`,
    `h` and `color` (compare as sets; sids are not compared), and no view more. A level with one pin and one rope
    gives one `pin` link at the pin's `x`, `y` and one `rope` link from the thing's `from` to `to`.
  - A level with a start point for players 1 and 2: two hero views whose `sprite.player` are 1 and 2.
  - The stage's `setInset(500)` on a box 300 tall fits as `setInset(150)` does (audit I7).
- [ ] **Step 2:** Push; `check` fails on the missing module.
- [ ] **Step 3:** Implement. `stage.ts`: replace the single `inset` with a `Room` (`setInset(px)` stays and sets
      `{ top: 0, right: 0, bottom: min(px, h / 2), left: 0 }`, keeping today's half-height limit, so every golden and
      picture of a running game is untouched; only `setRoom` takes a room as given (audit I7));
      `room()` and `fitFor` use `fitInRoom` when there is no shot; the cover strip stays bottom only. `createStage`
      takes `keep` and passes `preserveDrawingBuffer: keep`. `still.ts` builds the views once per `show` and calls
      `stage.draw(views, links)`.
- [ ] **Step 4: Failing browser tests** in `still.browser.test.ts` (three engines), with the full game and its
      painted pictures (`tests/fixtures/full-game/pictures.ts`), `keep: true`:
  - the canvas has the tileset's ground color at the middle of a ground tile, and the pixel at the middle of
    `crate-1` is the crate's;
  - `show` with `crate-1` moved 2 tiles right: the old middle is no longer the crate's color, the new one is;
  - `setRoom({top:0,right:200,bottom:0,left:0})` on a 600 × 300 mount moves the level's left edge to
    `fitInRoom(...).left` (read from `fit()`), and the sky still fills the pixel at (590, 10);
  - a game with no pictures and no `art` draws each thing as its character's box (the box's color at its middle);
  - `destroy()` twice does not throw and the mount is empty.
- [ ] **Step 5:** Push; all checks green, the parity jobs and goldens unmoved (no golden file is in the diff).
- [ ] **Step 6:** `pnpm build && pnpm api-report --update`, commit what it writes with the changeset. Commit
      message `feat(render): a level drawn still, with room kept on four sides`. Report `Task 2`.

---

## Pull request 3: real art in the editors

### Task 3: The second pin, a test game with art, pictures over the API, and the framework's canvas

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (the pin to Task 2's merge commit; remove `pixi.js`)
- Modify: `tests/fixtures/game/` (art), `tests/fixtures/game/read.ts`, `tests/fixtures/fake-github/repos.ts`,
  `tests/fixtures/fake-github/server.ts`
- Create: `tests/fixtures/game/pictures.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/github/repo.ts`, `src/features/service/service.ts`,
  `src/features/api/api.ts`, `src/lib/base64.ts`
- Create: `src/features/service/picture.ts`, `src/features/game/pictures.ts`, `src/features/game/art.ts`,
  `src/features/levels/level-picture.ts`
- Delete: `src/features/levels/level-canvas.ts`, `tests/features/levels/level-canvas.browser.test.ts`
- Modify: `src/features/levels/Levels.svelte`, `src/features/levels/place.ts`, `src/features/levels/edit.ts`,
  `src/features/suite/LevelScreen.svelte`, `src/features/suite/WaitingChange.svelte`,
  `tests/architecture/rules.ts` (no file may import `pixi.js`)
- Test: `tests/features/service/picture.test.ts`, `tests/features/game/pictures.test.ts`,
  `tests/features/game/art.browser.test.ts`, `tests/features/levels/level-picture.browser.test.ts`,
  `tests/features/levels/place.test.ts`, `tests/features/levels/edit.test.ts`,
  `tests/journeys/real-art.journey.test.ts`

**Interfaces:**
- Consumes: Task 2's `createLevelPicture`, `Room`, `fitInRoom`.
- Produces:

```ts
// wire.ts
export interface WirePicture { readonly path: string; readonly base64: string }
// api.ts, on Api
picture(ask: { game: GameRef; branch: string; path: string }): Promise<Answer<WirePicture>>
// lib/base64.ts
export function bytesFromBase64(base64: string): Uint8Array
// github/repo.ts, on Repo
readBytes(branch: string, path: string): Promise<Answer<{ base64: string }>>
// game/pictures.ts: one fetch per path per game, kept in memory; rejects when the API says no
export function readPictureFor(api: Api, game: OpenGame): ReadPicture
// game/art.ts: undefined when the level needs none; 'missing' when a picture cannot be loaded. A new `Art` on every
// call (the bytes stay cached by readPictureFor), because each picture frees the one it is given (audit I6).
export function loadLevelArt(api: Api, game: OpenGame, levelId: string): Promise<Art | undefined | 'missing'>
// levels/edit.ts: what a change to a level must know about the game it is in
export interface LevelRules {
  readonly characters: GameContent['characters']
  readonly hero: string                              // the project's hero, whose size a start point takes
  readonly solid: (letter: string) => boolean
}
export function rulesOf(content: GameContent, level: Level): LevelRules   // solid is solidOf(content, level)
// levels/place.ts
export function solidOf(content: GameContent, level: Level): (letter: string) => boolean
export function onSolid(level: Level, size: Size, at: Point, solid: (letter: string) => boolean): boolean
export { fitInRoom, type Room } // re-exported from the framework
// levels/level-picture.ts: the only file that imports the framework's browser renderer
export function openLevelPicture(options: { mount: HTMLElement; content: GameContent; level: Level; art: Art | undefined }): Promise<LevelPicture>
```

`GET /api/picture?owner=&name=&branch=&path=`: `enter(deps, request, game, 'look', { visitors: true })`; `path` must
match `/^content\/[A-Za-z0-9._\/-]+\.png$/` and hold no `..`, else `bad-request`; `branch` must be the default
branch, or (signed in) the head of an open pull of this same game, else `not-found`; the answer is the file's
base64 as GitHub's contents call gives it, white space removed. A file over GitHub's one megabyte answers
`not-found`. Every picture answer carries `Cache-Control: private, max-age=300`; a visitor's answer for the demo game
on its default branch is also kept in Cloudflare's cache (`caches.default`, used only when the runtime has it, so the
journeys' server works without it), keyed by the request's address, for five minutes. A crowd of first visits then
costs GitHub one read per picture per five minutes, not one per visitor (audit I8).

- [ ] **Step 1: The test game gets art.** Copy from AutomataFramework at Task 2's commit,
      `tests/fixtures/full-game/content/`: `figures/hero.json`, `figures/meadow.json`, `figures/tree.json`,
      `tilesets/meadow.json`, `backdrops/valley.json`, and add a new `figures/crate.json` (copy the template's
      `template/content/figures/crate.json`). `hero.json` and `crate.json` characters gain `"figure"`. `level-1.json`
      gains `"tileset": "meadow"`, `"backdrop": "valley"` and the full game's rows of tiles, keeping `crate-1` at
      6.5, 7.5 and the start at 2.5, 7.5 so every existing journey's numbers hold. Copy the tiles, not the full
      game's `view`: the editors fit a level whole (audit M12). List each file in
      `automata.toml`. Every file is written by `writeContent` (a throwaway `node` script; do not hand-format).
      Add a second fixture, `tests/fixtures/plain-game/`, which is today's game unchanged (boxes), served by the
      pretend GitHub as `grandma/plain-game`.
- [ ] **Step 2:** `tests/fixtures/game/pictures.ts`: `fixturePictures(): Promise<Record<string, Uint8Array>>` from
      the framework's `artFiles(loadGame(...))`, as the framework's own fixture does. The pretend GitHub's
      `/contents/` answers a `.png` path of the fixture game with those bytes as base64 (`repos.ts` gains
      `pictures: Map<string, Uint8Array>` per repo; `plain-game` has none).
- [ ] **Step 3: Failing tests.**
  - `picture.test.ts`: a visitor reads `content/figures/hero.png` of the demo game on its default branch; a visitor
    asking any other game is `not-found`; `path=../secret.png`, `path=src/main.ts` and `path=content/a.json` are
    `bad-request`; a branch that is no open pull's head is `not-found`; the pretend GitHub was asked exactly once;
    a good answer has `Cache-Control: private, max-age=300`; with a stand-in `caches.default`, a second visitor's ask
    for the same demo picture does not reach the pretend GitHub (audit I8).
  - `pictures.test.ts`: `readPictureFor` asks the API once for two reads of one path; rejects when the API answers
    a problem; the Blob's bytes equal the fixture's.
  - `place.test.ts`: `solidOf` for a level with the `meadow` tileset says `G` is solid and `.` is not; for a level
    with no tileset, `#` only. `onSolid` with it refuses a crate inside a `G` tile. `edit.test.ts`: `rulesOf` names the project's hero, and
    `moveThing` with it refuses a place inside a `G` tile.
  - `level-picture.browser.test.ts` (three engines): the fixture game with its art shows the hero's picture (a pixel
    of the hero figure's own color at the start point, not the character's box color `#e4572e`); "a game with no
    pictures draws boxes" (`plain-game`: the crate's `#c9a227` at its middle); after `show` of a moved level the
    crate's pixel moved.
  - `real-art.journey.test.ts` (five sizes): a visitor opens the demo level; the canvas pixel at the middle of
    `[data-thing="crate-1"]` is not the sky's color and not `#c9a227`; dragging the crate 2 tiles right moves that
    picture; the request list holds `GET /api/picture` for each picture once; no `.wasm` file was fetched (the first
    visit loads no physics, audit M8); no rule was refused.
- [ ] **Step 4:** Push; the new tests fail, the old ones pass.
- [ ] **Step 5:** Implement. `Levels.svelte` keeps its present frame and behavior in this task and only swaps its
      canvas: it mounts `openLevelPicture`, calls `show(edit.now)` in the effect that redrew before, and takes its
      `fit` from `fitInRoom(size, NO_ROOM, levelSize(edit.now))`. The picked ring stays the page element it already
      is (`.thing[aria-pressed='true']`). `moveThing(edit, rules, id, to)` and `nudgeThing(edit, rules, id, way)` take a
      `LevelRules` (from `rulesOf`) in place of the characters they took before, and ask `rules.solid`. `LevelScreen` loads the art beside the game and shows `WORDS.artMissing` ("Some of this game's
      pictures are missing, so things show as boxes.") as an info notice when it is `'missing'`.
- [ ] **Step 6:** `pnpm knip` must report nothing for `pixi.js` once it is out of `package.json`; `rules.ts`'s
      `PIXI_FILE` rule becomes "no file under `src/` imports `pixi.js`", with its case in `rules.test.ts`.
- [ ] **Step 7:** Push; all green. Commit by step (`test:` then `feat:`). Review pictures (the level screen, in the
      old frame, with real art: say plainly this is not the final look). Report `Task 3`.

---

## Pull request 4: the look's parts

### Task 4: Colors, fonts, icons and the shared pieces

**Files (all from PR 12 unless marked new):**
- `package.json`, `pnpm-lock.yaml`, `knip.json`, `vite.config.ts` (`assetsInlineLimit: 0`), `index.html`
  (`theme-color`, `color-scheme`, title "Automata Framework editors"), `public/licences.txt`
- `src/features/ui/ui.css`, `icons.ts`, `Icon.svelte`, `Tool.svelte`, `Stamp.svelte`, `Button.svelte`,
  `Choice.svelte`, `Notice.svelte`, `ui.ts`
- `tests/styles/tokens.test.ts`, `tests/features/ui/icons.test.ts`, `tests/features/ui/ui.browser.test.ts`,
  `tests/features/ui/choice.browser.test.ts`, `tests/workflows/licences.test.ts`, `tests/fixtures/contrast.ts`,
  `tests/fixtures/measure.ts`, `tests/fixtures/live.svelte.ts`, `tests/fixtures/serve.ts` (`.woff`),
  `tests/fixtures/journey.ts` (the five `SIZES`, `Look`, the font and console lines)
- New: `src/features/ui/Panel.svelte`, `src/features/ui/Chip.svelte`

**Interfaces:**
- Produces: the tokens of "Global Constraints"; `Icon { name: IconName }`; `Tool { label, icon, pressed?: boolean,
  disabled?, onpress }` (`aria-pressed` and a `--touch` fill when pressed; `data-tool` passed through);
  `Button { label, kind?: 'primary' | 'plain', icon?, disabled?, onpress }`; `Stamp` (changed in Task 11);
  `Panel { part: string, edge?: 'mark', children }` (the floating panel of "Panels", `data-part={part}`,
  `data-panel`); `Chip { children }` (ground color, 1 px words edge, for words over art); `contrast`, `mix`,
  `broken(page, stage)`.

- [ ] **Step 1:** Copy the files. Change from PR 12: `--corner: 3px`; `.label` letter-spacing `0.07em`; the panel
      look lives in `Panel.svelte` only (take the fill and shadow off `Tool.svelte`, which now sits in a panel);
      `ICONS` gains `move: arrowsOutCardinal`, `erase: eraser`, `export: export`,
      `characters: person`, `feel: slidersHorizontal`, `sound: waveform`, `story: bookOpen`, `language: globe`,
      `menu: caretDown`, `minus: minus`, `grid: gridFour`, `person: userCircle` and loses `tryIt`, `copy`, `file`
      (Task 11 removes their last use; until then keep them).
- [ ] **Step 2:** Until Task 16 the old screens still ask for the old token names. Keep them alive as aliases at
      the foot of `ui.css` under one comment, `/* Old names, until the last old screen is gone (Task 16). */`:
      `--fg: var(--words)`, `--muted: var(--quiet)`, `--surface: var(--raised)`, `--line: var(--words)`,
      `--focus: var(--touch)`, `--radius: var(--corner)` and any other name `git grep -o "var(--[a-z-]*)" src` still
      finds. `tokens.test.ts` allows a `var()` alias and still fails a second literal color.
- [ ] **Step 3: Tests** (they come with the files; make these changes): `tokens.test.ts` expects 3 px corners and
      0.07em; a new case, "a panel is raised at 94% with a 10 px blur and a 35% edge", reads `Panel.svelte`'s
      computed style in `ui.browser.test.ts`; `measure.ts`'s `SIZES` loop covers five sizes.
- [ ] **Step 4:** US spelling in shown words: `git grep -n -i -E "colour|organis|centre|grey|cancell|licence" src/features/words`
      and change each hit in a shown string (none expected in strings on 2026-11-14; the comment at
      `noticeInfo` becomes "color").
- [ ] **Step 5:** Push. Expected: green. `SIZES` names all five, but the old screens' journey keeps the three sizes
      it runs today: no scene is skipped. Each later task runs the screens it builds at all five sizes, and Task 18
      runs every scene at five (audit I9).
- [ ] **Step 6:** Commit (`feat: the editors' six colors, three fonts and icons`), review pictures, report `Task 4`.

### Task 5: Words as a table, read through one reactive `WORDS`

**Files:**
- Create: `src/features/words/table.ts`, `src/features/words/en.ts`, `src/features/words/words.svelte.ts`
- Delete: `src/features/words/words.ts`
- Modify: every importer of `words.ts` (`git grep -l "words/words.ts"`), `src/features/service/save.ts`,
  `src/features/wire/wire.ts`
- Create: `tests/fixtures/words.ts`
- Test: `tests/features/words/words.test.ts`, `tests/features/suite/words-used.test.ts`

**Interfaces:**
- Produces:

```ts
// table.ts
import type { EN } from './en.ts'
/** Every word, by key: a string, or a function of names and numbers that gives one. */
export type Words = { readonly [K in keyof typeof EN]: (typeof EN)[K] extends string ? string : (typeof EN)[K] }
/** An id as a person reads it: dashes are spaces and the first letter is a capital. `nameOf('level-1')` is 'Level 1'. */
export function nameOf(id: string): string
// en.ts
export const EN = { /* today's WORDS, key for key */ } as const satisfies Record<string, string | ((...a: never[]) => string)>
// words.svelte.ts
export type Language = 'en'            // Task 17 widens it to the nine
export const TABLES: Readonly<Record<Language, Words>>
/** The words of the language on screen. Reading a key in markup re-renders when the language changes. */
export const WORDS: Words
export function language(): Language
export function setLanguage(next: Language): void
// wire.ts (the API side may not import a rune module)
export const APP_ON_GITHUB = 'Automata Framework Editors'
// tests/fixtures/words.ts
export const WORDS: Words   // TABLES.en, for tests that look a button up by its English name
```

`WORDS` is a `Proxy` over a `$state` language: `get(_, key) => TABLES[current][key]`. A test-only
`useTables(tables)` (reached only through `tests/fixtures/words.ts`, never called by `src/`) swaps the table map, so
a browser test can mount a screen in a made-up table; Task 7's "long" table uses it (audit M10). `appName` becomes
"Automata Framework editors"; `blockedOwner` names `APP_ON_GITHUB`; `service/save.ts` writes
`Made with ${APP_ON_GITHUB} by ${who.login}.`.

- [ ] **Step 1: Failing tests.** `words.test.ts`: `Object.keys(TABLES.en)` equals today's key list plus none lost;
      `WORDS.save` is "Save"; a component test (`*.browser.test.ts`) mounts a `<p>{WORDS.save}</p>`, calls
      `setLanguage` with a second made-up table injected through a test-only `TABLES` argument, and reads the new
      text; `nameOf('crate')` is "Crate", `nameOf('the-very-long-level')` is "The very long level",
      `nameOf('')` is "". `words-used.test.ts` reads keys from `EN` and code from every file but the tables.
- [ ] **Step 2:** Push; red. **Step 3:** Implement; every test file imports `WORDS` from
      `tests/fixtures/words.ts`. **Step 4:** Push; green, every journey as before.
- [ ] **Step 5:** Commit (`refactor: words are a table read through one reactive WORDS`). No screen changed: no
      artifact. Report `Task 5`.

---

---

## Pull request 5: the level screen

Tasks 6 to 12 are one branch and one pull request, committed task by task. The old frame is gone when it merges.
New English words for each task are in "Appendix A"; add each key to `en.ts` in the task that first uses it.

### Task 6: Every change a level can take: redo, add, erase, another character, a moved start

**Files:**
- Modify: `src/features/levels/edit.ts`, `src/features/levels/compare.ts`, `src/features/levels/levels.ts`
- Create: `src/features/levels/ids.ts`
- Test: `tests/features/levels/edit.test.ts`, `tests/features/levels/compare.test.ts`,
  `tests/features/levels/ids.test.ts`

**Interfaces:**
- Consumes: `LevelRules` and `solidOf` (Task 3).
- Produces:

```ts
export interface LevelEdit { readonly opened: Level; readonly now: Level; readonly past: readonly Level[]; readonly future: readonly Level[] }
/** A hit id: a thing's own id, or `start-<player>` for a start point. */
export type HitId = string
export function sizeOf(rules: LevelRules, level: Level, id: HitId): Size          // a start is the hero's size
export function placeOf(level: Level, id: HitId): Point | undefined
export function moveThing(edit: LevelEdit, rules: LevelRules, id: HitId, to: Point): Moved   // things and starts
export function nudgeThing(edit: LevelEdit, rules: LevelRules, id: HitId, way: Way): Moved
export type Added =
  | { readonly edit: LevelEdit; readonly added: true; readonly id: string }
  | { readonly edit: LevelEdit; readonly added: false; readonly why: 'solid' | 'no-such-character' }
export function addThing(edit: LevelEdit, rules: LevelRules, character: string, at: Point): Added
export function canErase(level: Level, id: HitId): boolean      // false for the last start point and an unknown id
export function eraseThing(edit: LevelEdit, id: HitId): LevelEdit   // also drops every joint that names the thing
export function setCharacter(edit: LevelEdit, rules: LevelRules, id: string, character: string): LevelEdit
export function undo(edit: LevelEdit): LevelEdit
export function redo(edit: LevelEdit): LevelEdit               // from PR 12
// ids.ts: the next free id for a character, as an agent would write it
export function nextId(level: Level, character: string): string   // 'crate-2' when 'crate-1' is taken
// compare.ts
export function compareLevels(before: Level, after: Level): {
  readonly moved: readonly ThingMove[]      // things and starts, by hit id
  readonly added: readonly string[]
  readonly erased: readonly string[]
  readonly retyped: readonly string[]       // another character
  readonly other: number                    // tiles, joints, anything else
}
export function describeChange(edit: LevelEdit): string
```

`describeChange` (the change's name in the game's history, developer text, English): one move "Move crate-1 in
level-1"; several moves "Move 3 things in level-1"; one add "Add crate-2 to level-1"; one erase "Erase crate-1
from level-1"; one retype "Make crate-1 a spark in level-1"; any mix "Change level-1"; nothing "".

- [ ] **Step 1: Failing tests.** For each function, on the fixture level: every change pushes `now` onto `past`
      and empties `future`; `undo` then `redo` gives a level equal by `JSON.stringify` to the changed one; three
      undos and three redos of a move, an add and an erase end where they started; `addThing` at 6.5, 3.5 gives
      `crate-2` snapped and kept inside; into a solid tile is `{ added: false, why: 'solid' }`; `nextId` skips
      gaps upward (`crate-1`, `crate-3` taken gives `crate-2`); `canErase(level, 'start-1')` is false with one
      start and true with two; `eraseThing` of a thing a joint holds drops that joint, and `writeContent('level',
      result)` parses back; `eraseThing` of the last start returns the same edit; `setCharacter` to an unknown
      character returns the same edit; `moveThing(…, 'start-1', …)` changes `starts[0]`; `describeChange` for each
      sentence above; `compareLevels` for an add, an erase, a retype and a moved start.
- [ ] **Step 2:** Push, red. **Step 3:** Implement. **Step 4:** Push, green.
- [ ] **Step 5:** Commit `feat(levels): redo, add, erase, another character and a moved start`. Report `Task 6`.

### Task 7: The frame: the level fills the window, the pill, the cluster, the tools, undo and redo

**Waits for the Owner's answer to the plan audit's Q1** (how big the level is on a phone held upright: as planned,
a taller level that slides, or pinch to zoom). If the answer is B or C, a short amendment to this task, written and
audited before it starts, adds the gesture to `Stage` and its tests. PRs 1 to 4 do not wait.

**Files:**
- Create: `src/features/levels/layout.ts`, `src/features/levels/Stage.svelte`
- Create: `src/features/ui/Menu.svelte`, `src/features/ui/TitleBlock.svelte`, `src/features/ui/Sheet.svelte`
- Create: `src/features/suite/Frame.svelte`, `Pill.svelte`, `Cluster.svelte`, `Switcher.svelte`,
  `ComingSoon.svelte`
- Create: `src/features/ui/panels.ts`, `src/features/ui/Handle.svelte`; modify `src/features/ui/Panel.svelte`,
  `src/features/ui/icons.ts` (`panels: sidebarSimple`), `CLAUDE.md` (the device list gains `af.panels`)
- Rewrite: `src/features/levels/Levels.svelte`, `src/features/suite/LevelScreen.svelte`
- Modify: `src/features/suite/App.svelte` (the level route renders with no bar and no strip above it)
- Test: `tests/features/levels/layout.test.ts`, `tests/features/levels/stage.browser.test.ts`,
  `tests/features/levels/levels.browser.test.ts` (rewritten), `tests/features/suite/frame.browser.test.ts`,
  `tests/journeys/frame.journey.test.ts`; `tests/journeys/move-the-crate.journey.test.ts` keeps passing;
  `tests/features/ui/panels.test.ts`, `tests/journeys/panels.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// layout.ts
export type Shape = 'wide' | 'mid' | 'narrow'
export function shapeOf(box: Size): Shape          // ruling 1
export function roomFor(shape: Shape): Room         // ruling 2: the least room
export function roomWith(least: Room, measured: Partial<Room>): Room   // the larger on each side, plus 16 (audit I1)
export const LEAST_LEVEL_HEIGHT = 320
// ui/panels.ts: which parts are closed (ruling 17), kept in `af.panels` as a JSON list of names
export type PanelName = 'tools' | 'card' | 'block' | 'switch'
export const PANEL_NAMES: readonly PanelName[]
export function readClosed(store: Storage | undefined): ReadonlySet<PanelName>   // rubbish or a throw: none closed
export function keepClosed(store: Storage | undefined, closed: ReadonlySet<PanelName>): void   // never throws
export function toggled(closed: ReadonlySet<PanelName>, name: PanelName): ReadonlySet<PanelName>
export function allClosed(closed: ReadonlySet<PanelName>, floating: readonly PanelName[]): boolean
```

```
Stage.svelte   props: content, level (the version to draw), art, room: Room, picked: HitId | undefined,
               mode: 'edit' | 'look' | 'read', onpick(id | undefined), ondrag(id, to: Point): 'moved' | 'solid' | 'same',
               ondragend(), layer?: Snippet<[Fit]> (what lies over the canvas: Task 9's notes)
               Draws through `openLevelPicture` with `keep: true`; one <button data-thing> per thing and start, at
               least 48 px; `data-scale`; an empty `[data-clear]` exactly over the clear cell.
Levels.svelte  props: content, levelId, start: Level, art, shape: Shape, mode, block: { game, level, saved },
               kept: Storage, onchange(edit: LevelEdit), onstate(state: LevelState)
               exports: pick(id?), tool(name), undo(), redo(), nudge(way), erase(), add(character), notes(mode)
               LevelState = { picked: HitId | undefined; tool: ToolName; canUndo: boolean; canRedo: boolean;
                              notes: NotesMode; solid: boolean }
Frame.svelte   props: game?: string, level?: string, onhome?(), editors: boolean, menu: readonly MenuItem[],
               cluster: Snippet<[Shape]>, children: Snippet<[Shape]>
               `data-frame`, `data-shape`; measures its own box; never taller than the window on wide and mid.
Menu.svelte    props: label, icon?, items: readonly MenuItem[]   MenuItem = { id, label, icon?, tag?, onpress }
TitleBlock     props: game, level, editor, saved, compact?   (a 2 × 2 grid of label cells, at most 72 px tall;
               `compact` shows the level and saved cells only; `data-part="block"`; ruling 18)
Sheet.svelte   props: title, open (bindable), children   a bottom sheet that pulls down to its title (`data-part="sheet"`)
```

**Where each part sits** (every one a `Panel`, positioned inside the frame with the frame's 16 px margin):

| Part | `wide` | `mid` | `narrow` |
|---|---|---|---|
| pill | top left: game name, level name (the `h1`), then the five editors in a row | top left: level name and "World", opens `Menu` | the same as `mid` |
| cluster | top right: Find, person, language (Task 17), Export, Share, Save | top right: Find, person, Save (a visitor: Export) | top right: Save (a visitor: Export) |
| tools | left edge, a column, centered | bottom left, a row | bottom, a row the full width (undo and redo float just above its right end) |
| card | right, under the cluster, 296 px wide | `Sheet` over the tools | `Sheet` over the tools |
| switch (Task 9) | bottom left | bottom row, after the tools | in the scroll below the level |
| block | bottom right, left of undo | bottom row, before undo | in the scroll below the level |
| undo, redo | bottom right corner | bottom right | their own panel, just above the tools' right end (audit I2) |

The pill's `Menu` on `mid` and `narrow` holds: the five editors, "Open the game's page", Share (who may), Export
or Save (whichever the cluster does not show), Find (`narrow`), Sign in or Sign out. On `wide` pressing the game's
name opens the game's page and pressing an editor chooses it. World is chosen (`aria-current`); each other editor
carries a `.label` tag `WORDS.comingSoon` in `--mark`'s edge and opens `ComingSoon` (a `Panel` with its icon, name,
`WORDS.soonFeel` and its like, and `WORDS.ok`). In this task the cluster holds Save (main; a visitor's says
`WORDS.saveTeam` on `wide`), Export (Task 11 wires both: until then Save calls the old save and Export the old
"copy this level"), and Sign in or the person's name (`Menu` with Sign out; faces come in Task 14). Share and Find
appear in the tasks that build them. The tools are Move only in this task.

**Panels close and open (ruling 17).** `Panel` gains `name?: PanelName`, `closed`, `onclose`: a named panel
has a close button at its top corner (`data-close`, the `minus` icon, 44 px to press, accessible name
`WORDS.panelHide(name)`, as in "Hide tools"). `Levels` renders a closed part as a `Handle` in its place
(`data-handle="<name>"`, a 44 px `Panel` holding the part's icon, accessible name `WORDS.panelShow(name)`), set
against the same edge the part sits on: tools at the left edge (`wide`) or bottom left; card at the right edge
under the cluster (`wide`) or as the sheet's title bar (`mid`, `narrow`, where closing the card is pulling the
sheet down to nothing but its handle); block and switch where they were. The names come from `WORDS.panelTools`,
`panelCard`, `panelBlock`, `panelSwitch`. One control hides or shows all the floating four at once: on `wide` a
44 px icon button (`panels`) at the end of the pill, on `mid` and `narrow` a row in the pill's menu; it reads
`WORDS.panelsHide` while any is open and `WORDS.panelsShow` when all are closed. Opening and closing use the
200 ms panel motion. Focus goes to the handle on close and to the part's first control on open. `Levels` exports
`panel(name)` and `panels()` for the find bar, and `LevelState` gains `closed: readonly PanelName[]`.

- [ ] **Step 1: Failing tests.**
  - `layout.test.ts`: `shapeOf` of the five sizes is narrow, mid, mid, wide, wide; of 1024 × 599 is mid; `roomFor`
    returns ruling 2's least numbers; `roomWith(least, measured)` keeps the larger on each side; for each size the
    clear cell is at least 160 px tall and half the shorter side wide.
  - `levels.browser.test.ts`, "long words": with a test table whose every string is the English one 40% longer
    (`useTables`), at each of the five sizes, `broken` is empty, the tools keep 56 px, the room on the tools' side
    grew to fit them, and `data-scale` is the same before and after a pick (audit I1).
  - `stage.browser.test.ts`: the canvas is as big as the stage; `[data-clear]` equals the stage less `room`; every
    `[data-thing]` lies inside it; a touch drag of `crate-1` by 2 tiles calls `ondrag` with x 8.5; a second finger
    cancels; `mode="read"` ignores a drag; the canvas's `toDataURL()` is the same before and after `picked` is set
    (the ring is a page element); with `picked`, the ring is a dashed `--touch` outline with `animation-name:
    draw` (`fade` under reduced motion).
  - `levels.browser.test.ts`: at each shape (mount in a box of each of the five sizes) every part of the table is
    present and where the table says (compare `getBoundingClientRect` to the box's edges); `[data-tool="move"]` is
    pressed; a drag makes Undo enabled, Undo makes Redo enabled; arrow keys on a picked thing move it half a tile;
    Escape lets go; touching empty space lets go; the level's `Fit` (`data-scale`) is the same before and after a
    thing is picked.
  - `frame.browser.test.ts`: on `wide` five editors show and Feel opens the Coming soon card whose one button
    closes it and returns focus to Feel; on `mid` the pill opens a menu with the five editors and "Open the game's
    page"; exactly one `h1`.
  - `frame.journey.test.ts` (five sizes): a visitor on the demo level sees no banner and no bar: the first
    element in the frame is the stage, and `[data-scale]`'s box is the window's (on `narrow`, the window's width
    and at least 320 tall); `broken(page, true)` is empty; no two `[data-part]` boxes overlap; every `[data-tool]`
    is at least 56 px each way; Save is at least 48 tall; each of the four other editors opens its card.
  - `panels.test.ts`: nothing is closed for an empty store, for rubbish and for a store that throws; `toggled`
    twice is the start; `keepClosed` then `readClosed` gives the same set; `allClosed` looks only at the parts
    that float.
  - `panels.journey.test.ts` (five sizes): on a first visit nothing is closed and no `[data-handle]` exists;
    closing the tools leaves `[data-handle="tools"]` at least 44 px each way at the same edge, and `data-scale`
    and the crate's box are unchanged; the crate can still be dragged with the tools closed; the handle opens
    them and Move is still pressed; with the card closed, picking the crate shows no card and the handle is
    there; "hide all" leaves only the pill, the cluster, the handles and undo and redo, Save still works, and the
    control now reads "Show everything"; a reload keeps what was closed; by keyboard, Enter on a close button
    moves focus to its handle; `broken(page, true)` is empty with everything closed and with one part closed.
- [ ] **Step 2:** Push, red. **Step 3:** Implement. `measure.ts` now finds parts by `[data-part]` and the main
      button by `.button.primary` as before. **Step 4:** Push, green in three engines.
- [ ] **Step 5:** Commit `feat: the level fills the window and its tools float`. Report `Task 7`.

### Task 8: The picked thing's card

**Files:**
- Create: `src/features/levels/ThingCard.svelte`, `src/features/levels/character-picture.ts`,
  `src/features/words/format.ts`
- Modify: `src/features/levels/Levels.svelte`
- Test: `tests/features/levels/thing-card.browser.test.ts`, `tests/features/levels/character-picture.browser.test.ts`,
  `tests/features/words/format.test.ts`, `tests/journeys/card.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// character-picture.ts: the character as the game draws it, on a 2D canvas: its figure's first pose painted by the
// framework's `paintFigure` and `figureSheet`, or its box in its own color with the framework's dark edge.
export function drawCharacter(canvas: HTMLCanvasElement, content: GameContent, character: string): void
// format.ts
export function tiles(language: Language, n: number): string      // '6.5' the language's way (Intl.NumberFormat)
```

`ThingCard` props: `content`, `level`, `id: HitId`, `asked: 'left' | 'top' | undefined`, `onnudge(way)`,
`oncharacter(character)`, `onerase()`. It shows, top to bottom: the title (`nameOf(character)` for a thing,
`WORDS.cardStart(n)` for a start) with the id under it as a `.label`; `WORDS.cardWhere` with two rows, "From the
left" and "From the top", each the file's own number in `.measure` between a − and a + (44 px; accessible names
`WORDS.stepLess(label)` and `WORDS.stepMore(label)`; a row with `data-asked` is ringed in `--touch`); for a thing,
`WORDS.cardWhat` (the choice arrives in Task 10); `WORDS.cardLater` in `--quiet`; Erase arrives in Task 10. The
old four "Move" buttons and the words "Across" and "Down" are gone.

- [ ] **Step 1: Failing tests.** The card for `crate-1` reads "Crate", "CRATE-1" (by CSS), `6.5` and `7.5`; + on
      "From the left" calls `onnudge('right')`; the numbers shown equal `data-x`, `data-y` of the thing after three
      presses; a start's card reads "Player 1 starts here"; no text on the card is a number the level file does not
      hold; `drawCharacter` of the fixture's `hero` puts a non-transparent pixel of the figure's palette on the
      canvas, and of `plain-game`'s crate fills `#c9a227`; `tiles('en', 6.5)` is "6.5". Journey (five sizes): pick
      the crate; on `wide` the card is under the cluster and the level did not refit; on `mid` and `narrow` it is a
      sheet that pulls down to its title and comes back; pressing + four times then Save saves x 8.5 (read from the
      pretend GitHub's file).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(levels): the picked thing's card`.

### Task 9: The drawing notes

**Files:**
- Create: `src/features/levels/notes.ts`, `src/features/levels/notes-mode.ts` (both from PR 12, with their tests
  `tests/features/levels/notes.test.ts`, `notes-mode.test.ts`), `src/features/levels/Notes.svelte`
- Modify: `src/features/levels/Levels.svelte`, `src/features/levels/Stage.svelte`, `CLAUDE.md` (the device list
  gains `af.notes`)
- Test: `tests/features/levels/notes.browser.test.ts`, `tests/journeys/notes.journey.test.ts`,
  `tests/docs/docs.test.ts` (a new case: `CLAUDE.md` names every `af.` key the code uses, found by
  `git grep -o "'af\.[a-z.:]*" src`)

**Interfaces:**
- Consumes: `notesFor`, `readNotesMode`, `keepNotesMode`, `nextNotesMode` (PR 12, unchanged), `tiles` (Task 8).
- Produces: `Notes.svelte` props `level`, `fit: Fit`, `picked: HitId | undefined`, `thing: Box | undefined`,
  `clear: Box`, `mode: NotesMode`, `compact: boolean` (true on `narrow`), `onask(which: 'left' | 'top' | 'card')`.

What it draws, all page elements in the stage's layer, none on the canvas:
- **The grid** over the level's own area: one SVG, each line a pair of strokes, `--ground` 3 px under `--words`
  1 px at 25%, so it reads on any sky.
- **For what is picked:** the name chip (`data-note="name"`, the id as a label); two measure lines with end ticks,
  from the level's left edge and from its top edge to the thing's middle, `--ground` with a 1 px `--words` halo;
  on each a `Chip` button: `WORDS.noteLeft`, then the number in `--touch` `.measure`, then `WORDS.tilesWord(n)`
  (`data-note="left"` and `"top"`); for a thing a joint holds, a chip `WORDS.notePin` or `WORDS.noteRope` at the
  joint (`data-note="joint"`). A measure chip calls `onask` with its side (the card marks that row; on `mid` and
  `narrow` the sheet opens); the name chip calls `onask('card')`.
- **`compact`:** only the name chip, which opens the card.
- **The switch** (`data-part="switch"`, in `Levels`): one button, as the mockup draws it: a small three-position
  knob (right for on, middle for faded, left for hidden; `--touch` track when on), then `WORDS.notesSwitch` and its
  state word; each press steps on, faded (the layer at 35%), hidden. Kept in `af.notes` (audit M2).
- **Motion:** the layer's children have `animation-name: draw` when a thing is picked (200 ms) and `fade` under
  reduced motion. An undo rubs the last notes out: the layer has `animation-name: rub` (200 ms) as the undone
  version's notes leave, `fade` under reduced motion (the spec's "undo rubs the last note out", audit M3).
- **The name chip** goes where `notesFor`'s `block` says (its first side that fits in the clear cell), joined to the
  thing by its leader; the notes have no other block (audit M7).

- [ ] **Step 1: Failing tests.**
  - Node: the grid's stroke pair on `#9fd3f0` (the framework's sky) and on `#253122` each reach 1.5 to 1 against
    the color behind (`contrast` and `mix`).
  - Browser: with `crate-1` picked, the left chip reads "FROM THE LEFT 6.5 TILES" and its line runs from the
    level's left edge to the crate's middle (within 1 px of `fit`); after a move the number is the file's; every
    chip lies inside `[data-clear]` on every side at each of the five sizes; after a move then Undo, the layer's
    `animation-name` is `rub`; the switch's knob is right, middle and left in its three states; the canvas's `toDataURL()`
    is identical with the notes on, faded and hidden, and with a thing picked or not; a chip is a button at least
    44 px tall; pressing "FROM THE TOP" gives the card's second row `data-asked`; `compact` shows one chip; a store
    that throws leaves the notes on and the switch working.
  - Journey (five sizes): pick the crate, the notes appear; the switch steps through three states and a reload
    keeps the state; no words lie on the art (`broken`); a pinned thing shows "PIN" (the fixture's `level-2`,
    added in this task: `level-1` plus a `plank-1` on a pin, listed in the fixture's `automata.toml`).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(levels): drawing notes over the real art`.

### Task 10: Add, Erase and the character choice

**Files:**
- Create: `src/features/levels/AddTray.svelte`
- Modify: `src/features/levels/Levels.svelte`, `src/features/levels/ThingCard.svelte`,
  `src/features/levels/Stage.svelte` (`ontouch(at: Point)` for a touch on empty space; a thing that leaves fades,
  150 ms)
- Test: `tests/features/levels/add-erase.browser.test.ts`, `tests/journeys/add-erase.journey.test.ts`

**Interfaces:**
- Consumes: Task 6's `addThing`, `eraseThing`, `canErase`, `setCharacter`; `drawCharacter`.
- Produces: `AddTray` props `content`, `chosen: string | undefined`, `onchoose(character)`. One button per
  character of the game but the project's hero, in the order of the project file, each a `drawCharacter` canvas
  (48 px) over `nameOf(id)`; `data-part="tray"`. On `wide` it opens beside the tools; on `mid` and `narrow` it is
  a row above them.

Behavior: **Add** opens the tray with `WORDS.addPick` in it; choosing a character then touching the level adds it
there (or dragging the tray's button onto the level; or, with the keyboard, Enter on a tray button adds it at the
middle of the clear cell); the new thing is picked and the tool goes back to Move; on solid ground the notice
`WORDS.solid` shows and nothing is added. **Erase** (the tool): the hint `WORDS.eraseHint` shows in the tools'
panel; touching a thing erases it; touching the last start shows `WORDS.lastStart` and erases nothing. **The
card** gains the character choice (a `Choice` of the same character pictures, under `WORDS.cardWhat`) and, at its
foot, an Erase button (`--touch` words, `--mark` edge), absent for the last start. Every one of these is one undo
step. `LevelState.tool` and the tools' `aria-pressed` follow.

- [ ] **Step 1: Failing tests.** Browser: Add, choose crate, touch at 10.5, 3.5: a `[data-thing="crate-2"]`
      exists there and is picked, Move is pressed again; Undo removes it, Redo brings it back; adding into a
      ground tile adds nothing and says so; Erase tool then a touch on `crate-1` removes it; the card's Erase does
      the same; the card of the only start has no Erase, and the Erase tool on it says `WORDS.lastStart`; the card's
      choice to another character changes `character` and the picture under the hit button; the tray lists the
      fixture's characters without the hero. Journey (five sizes): a signed-in owner adds a crate and saves; the
      pretend GitHub's `level-1.json` holds `crate-2` and equals `writeContent` of the level on screen byte for
      byte; then erases `crate-1` and saves; the file has no `crate-1`; a visitor does both and the title block
      says "Not saved yet"; by keyboard only (Tab, Enter, arrows) a crate is added, moved and erased.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(levels): add, erase and choose a character`.

### Task 11: Save, Export, the stamps, and what just happened

**Files:**
- Modify: `src/features/ui/Stamp.svelte`, `src/features/ui/Notice.svelte`
- Create: `src/features/suite/SignInPanel.svelte`, `src/features/suite/Leave.svelte`
- Modify: `src/features/suite/LevelScreen.svelte`, `src/features/suite/Cluster.svelte`,
  `src/features/suite/App.svelte`, `src/features/words/format.ts`
- Modify (who saved last): `src/features/wire/wire.ts`, `src/features/github/repo.ts`,
  `src/features/service/open.ts`, `tests/fixtures/fake-github/server.ts`
- Test: `tests/features/service/open.test.ts`, `tests/features/github/repo.test.ts`,
  `tests/features/words/format.test.ts`, `tests/features/ui/ui.browser.test.ts`,
  `tests/journeys/save.journey.test.ts`, `tests/journeys/export.journey.test.ts`,
  `tests/journeys/save-problems.journey.test.ts`, `tests/journeys/sign-in.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// wire.ts
export interface WireFile { readonly path: string; readonly text: string; readonly version: string
  /** For a level file: who changed it last and when (milliseconds). Left out when GitHub does not say. */
  readonly last?: { readonly by: string; readonly at: number } }
// repo.ts, on Repo: GET /repos/{owner}/{repo}/commits?sha={branch}&path={path}&per_page=1
// `by` is the commit's `author.login`, else `commit.author.name` (a save's author name is the person's login, audit M5)
lastChange(branch: string, path: string): Promise<Answer<{ by: string; at: number } | undefined>>
// format.ts
export function ago(language: Language, then: number, now: number): string   // Intl.RelativeTimeFormat; under 45 s is WORDS.justNow
```

`Stamp` props: `word: string`, `line?: string`, `children?: Snippet` (what sits under it). It is a `.label` word in
a 3 px `--mark` edge on `--ground`, turned −8 degrees as the mockup's is (audit M4), `animation-name: land` (`fade` under reduced motion),
`data-stamp`, `data-part="stamp"`, placed top center of the frame, over the level, and it never moves the level.
It is announced once through a `role="status"` sentence beside it. `Notice` becomes a `Panel` under the cluster
(`data-part="notice"`, an olive edge for a problem) with one sentence on what happened, one on what to press, and
its buttons; a notice that asks nothing has `WORDS.tipGotIt`.

What each press does:

| Press | Who | What happens |
|---|---|---|
| Save | Edit, Owner | stamp `stampSaved` with `stampBy(name, justNow)`; the title block says `blockSavedBy`; under the stamp the link `seeTeamGame` (first save on this device only) |
| Save | Suggest, Approve | stamp `stampSaved` with `stampWaiting` |
| Save | a visitor | the notice `saveWhy` with Sign in (main) and `exportInstead`; the change stays on screen through the sign-in (the draft, as today) |
| Export | anyone | the level's `writeContent` text goes to the clipboard; stamp `stampExported` with `stampCopied`; under it the button `copyKeep` ("Save it as a file") and, for a visitor, on every shape, a quiet link `saveTeam` that opens the sign-in panel (audit I5); never calls `/api/save` |
| Export, clipboard refused | anyone | the same stamp with the line `copySelect`, and the text in a selected box in a notice |
| the file changed elsewhere, offline, busy, blocked, broken | signed in | today's sentences, as a problem notice with today's buttons |
| the pill's game name or "Open the game's page" with unsaved changes | anyone | `Leave`: `leaveAsk`, Stay (main), Leave |

The title block's last line is `blockNotSaved` while the level differs from the file, else `blockSavedBy(by,
ago(...))` from `WireFile.last`, else nothing. Sign-in going, cancelled, failed and signed-out are `SignInPanel`s
over the level the person was on (`App.svelte` no longer swaps the screen for `Welcome` when a level is open).

- [ ] **Step 1: Failing tests.** Service: a level file's `last` is its newest commit's author and time on that
      branch; a file with no commit has none; `automata.toml` and character files have none; one extra call per
      level file. `ago('en', now - 120000, now)` is "2 minutes ago"; `ago` under 45 seconds is "just now". Journeys
      (five sizes each): owner drags and saves: `[data-stamp]` reads "SAVED" and "by grandma, just now", the block
      reads "Saved by grandma, just now", `data-scale` and the crate's box are unchanged from before the stamp
      landed, and the stamp leaves on the next press; a Suggest-level save reads "Waiting for someone to approve";
      a visitor's Save shows the panel with exactly one main button, "Export instead" exports; a visitor signs in
      from the panel and the moved crate is still moved; Export puts text on the clipboard equal to the fixture
      file with the move applied (Chromium and WebKit read the clipboard; Firefox takes either the stamp or the
      selected box), and `POST /api/save` is not in the request list; a visitor's stamp holds the `saveTeam` link at
      every size and it opens the sign-in panel; "clipboard refused" (the page's
      `navigator.clipboard.writeText` replaced by one that rejects): the box holds the text and is selected; "Save
      it as a file" downloads `level-1.json`; each save problem shows its notice with the level visible behind and
      nothing overlapping; leaving with a change asks, Stay keeps it, Leave goes to the game's page.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat: Save, Export and the stamps`.

### Task 12: The first visit, and the other first runs

**Files:**
- Rewrite: `src/features/suite/guide.ts`
- Create: `src/features/suite/Tip.svelte`
- Delete: `src/features/suite/Guide.svelte`, `src/features/suite/Welcome.svelte`
- Modify: `src/features/suite/App.svelte`, `src/features/suite/route.ts`, `src/features/suite/LevelScreen.svelte`
- Test: `tests/features/suite/guide.test.ts`, `tests/features/suite/route.test.ts`,
  `tests/journeys/first-run.journey.test.ts` (rewritten), `tests/journeys/visitor.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// guide.ts
export type TipStep = 'drag' | 'add' | 'keep' | 'done' | 'none'
export interface TipFacts {
  readonly wanted: boolean            // af.guide.done is not set
  readonly mode: 'edit' | 'look'
  readonly things: number             // things in the level
  readonly dirty: boolean
  readonly kept: boolean              // saved or exported once on this device (af.saved)
}
export function tipStep(facts: TipFacts): TipStep
/** What the tip says and what it points at, or undefined for no tip. `target` is a selector that exists on screen. */
export function tipFor(step: TipStep, facts: { visitor: boolean; canSave: boolean; first: string | undefined }):
  { readonly text: string; readonly target: string } | undefined
export function guideWanted(store: Storage): boolean
export function finishGuide(store: Storage): void
// route.ts: Route gains { screen: 'none' } for an address that is not empty and matches nothing,
// and the level route's `level` may be left out: `#/game/o/n/level` is the game's first level.
```

`tipStep`: not `wanted` or `look` is `none`; `kept` is `done`; `dirty` is `keep`; no things is `add`; else `drag`.
`tipFor`: `drag` is `WORDS.tipDrag(nameOf(character of the first thing))` at `[data-thing="<first thing's id>"]`;
`add` is `WORDS.tipAdd` at `[data-tool="add"]`; `keep` is `WORDS.tipExport` at the Export button for a visitor and
`WORDS.guideSave` at Save for someone who may save; `done` and `none` are undefined. `Tip.svelte`
(`data-part="tip"`): a `--touch` chip with a small pointer, placed beside its target's box inside the frame, never
over another part, with a `WORDS.tipsHide` button; it re-reads the target's box on resize and hides itself (no
throw) if the target is not on screen, as when a menu or the find bar is open. A tip whose target is in a closed
panel (ruling 17) points at that panel's handle instead; `guide.test.ts` has the case for Add.

**The arrival ring** (the spec's "the crate's ring gently draws itself in", audit I3): while the tip is at `drag`, its
target thing has the picked ring's dashed `--touch` outline with `animation-name: draw` (`fade` under reduced
motion), as `data-hinted`, without being picked, so no card opens. **The sheet waits** (audit I4): while the tip is at
`drag` or `keep`, picking a thing on `mid` and `narrow` brings the card's sheet up pulled down to its title only; a
press on the title opens it as usual. On `wide` the card shows as always (it has its own room).

**The address with nothing after it:** signed out with a demo game: the demo's first level, at once, in the level
screen (no welcome page, no redirect, the address stays). Signed out with no demo game: the frame with one
`SignInPanel`. Signed in: your games (Task 15). An address that matches nothing: `none` (Task 16's screen; until
then your games).

**The other first runs:** a link to a game that is not the demo, signed out: the frame, empty ground, a panel
`WORDS.teamGame` with one Sign in; after sign-in the level the link named opens with the tips. Just added the
editor (`setup_action` in the address): the newest of the person's games opens on its first level with the tips.
Look level: the tools' panel holds one line, `WORDS.lookLine(owner)`, and nothing else (Play joins it in Task
19); no tips.

- [ ] **Step 1: Failing tests.** `guide.test.ts`: every row of `tipStep` above; "an empty level's first tip is
      Add"; a store that throws counts as wanted; `tipFor('keep')` for a visitor targets Export. `route.test.ts`:
      `#/nonsense` is `none`, `#/` is `games`, `#/game/a/b/level` is the first level. Journeys (five sizes, three
      engines): **a visitor's first visit**: one navigation to the site's address shows `[data-scale]` and the tip
      "Drag the crate anywhere" with no click; no element with the old welcome's words exists; `[data-part="tip"]`
      overlaps no other part and its pointer is within 24 px of the crate; the crate has `data-hinted` and a dashed
      ring with `animation-name: draw`, and nothing is picked; on `mid` and `narrow` the drag leaves the sheet at its
      title only; no `.wasm` file was fetched (audit M8); dragging the crate changes the tip to
      "Nice. Now press Export to keep it." beside Export; pressing Export shows "EXPORTED", "Copied for your
      agent", and "Sign in to save with your team" under the stamp at every size (and as Save on `wide`); a reload shows
      no tip; the whole run is one drag and one press. **Signed in, a game you may change:** drag, "Nice. Now
      press Save.", Save, "SAVED". **Hide tips** ends them for good. **Doing something else** (open the find bar
      or a menu) hides the tip, and closing brings it back. **A link to a team's game, signed out:** the panel,
      one button, and after sign-in the named level. **Look level:** the line names the owner and nothing can be
      dragged. **No demo game** (`dist-plain`): the sign-in panel.
- [ ] **Steps 2 to 4:** red, implement, green.
- [ ] **Step 5:** Commit `feat: the first visit goes straight to the level`. Push; when every check of the pull
      request is green: review pictures (every state of the level screen so far, the mockup beside the real level
      screen at tablet landscape), then report Tasks 7 to 12.

---

## Pull request 6: find and faces

### Task 13: The find bar and `docs/commands.md`

**Files:**
- Create: `src/features/find/commands.ts`, `src/features/find/FindBar.svelte`, `src/features/find/find.ts`,
  `scripts/write-commands.ts`, `docs/commands.md`
- Modify: `tests/architecture/rules.ts` (`find` after `levels`), `src/features/suite/LevelScreen.svelte`,
  `src/features/suite/Cluster.svelte`, `src/features/suite/Pill.svelte`, `package.json` (script `commands:write`)
- Test: `tests/features/find/commands.test.ts`, `tests/features/find/find-bar.browser.test.ts`,
  `tests/docs/commands.test.ts`, `tests/journeys/find.journey.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Command {
  /** Its documented name for agents, the same in every language: 'save', 'add:crate', 'move-left', 'open-level:level-2'. */
  readonly id: string
  /** What a person reads and types, in the language on screen. */
  readonly name: string
  readonly run: () => void
}
/** Every action possible right now, in a fixed order. A thing that cannot be done now is not in the list. */
export function commandsFor(facts: FindFacts, does: FindDoes): readonly Command[]
/** Those whose name holds every typed word, in any order, ignoring case and accents; all of them for ''. */
export function findCommands(all: readonly Command[], typed: string): readonly Command[]
/** The kinds of command, for the docs: id pattern, the words key of its name, the file change it makes. */
export const COMMAND_KINDS: readonly { readonly id: string; readonly words: keyof Words; readonly changes: string }[]
```

`FindFacts`: `mode`, `picked`, `tool`, `canUndo`, `canRedo`, `notes`, `characters: string[]`, `levels: string[]`,
`level`, `signedIn`, `mayShare`. `FindDoes`: one function per kind. The kinds, in order: `move-tool`,
`add:<character>` ("Add a crate"), `erase-tool`, `move-left` / `-right` / `-up` / `-down` ("Move
crate-1 left", only with a thing picked), `erase` ("Erase crate-1"), `save`, `export`, `undo`, `redo`,
`show-notes`, `fade-notes`, `hide-notes`, `hide-panel:<name>` and `show-panel:<name>` ("Hide tools", whichever
applies to each part that floats), `hide-panels`, `show-panels`, `share`, `open-game`, `open-level:<id>` ("Open Level 2"),
`open-editor:<name>` ("Open Feel"), `sign-in`, `sign-out`; Task 17 adds `language:<code>` (each by its own name);
Task 19 adds `play` after `erase-tool`.

`FindBar` (`data-part="find"`): on `wide` a field in the cluster reading `WORDS.find`; on `mid` an icon with
`WORDS.findShort`; on `narrow` from the pill's menu. Open, it is a panel at the top center: a field, then the
list (each row 48 px), `WORDS.findNone` when nothing matches. It opens by touch, Ctrl or Cmd with K, and "/" when
no field has focus; arrows move, Enter runs and closes, Escape closes and returns focus. `docs/commands.md` is
written by `pnpm commands:write` from `COMMAND_KINDS` and the tables: one row per kind with its id, its name in
each language the tables hold, and the file change it makes ("moves `x` of a thing in the level file", "nothing:
a device setting").

- [ ] **Step 1: Failing tests.** `commandsFor` with nothing picked has no `move-left`; with `crate-1` picked it has
      "Move crate-1 left"; a Look level has no `save` and no tool kinds; a visitor has `sign-in` and no
      `share`; `findCommands(all, 'crate add')` finds "Add a crate"; `'NOTES'` finds three; `'zzz'` none.
      `commands.test.ts` (docs): the file equals what the script would write; every kind's `words` key exists;
      every id in the file is a kind's and every kind is in the file. Browser: Ctrl+K opens, typing "red" and Enter
      redoes; "/" in the field types a slash; Escape returns focus to what had it. Journey (five sizes): by
      keyboard, "Add a crate" opens the tray's choice made; "Move crate-1 right" moves it half a tile; "Hide
      notes"; "Open Feel" shows the Coming soon card; "Save" saves; by touch, the same from the list; on `narrow`
      it opens from the pill's menu and fills the width without covering the tools.
- [ ] **Steps 2 to 4:** red, implement (`pnpm commands:write` writes the doc), green.
- [ ] **Step 5:** Commit `feat: find or do anything, and every action documented`. Report `Task 13`.

### Task 14: Faces

**Files:**
- Create: `src/features/service/face.ts`, `src/features/ui/Face.svelte`, `src/features/game/faces.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/service/service.ts`, `src/features/service/open.ts`,
  `src/features/github/repo.ts`, `src/features/api/api.ts`, `src/features/suite/Cluster.svelte`,
  `tests/fixtures/fake-github/server.ts`
- Test: `tests/features/service/face.test.ts`, `tests/features/service/open.test.ts`,
  `tests/features/ui/face.browser.test.ts`, `tests/journeys/faces.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// wire.ts
export interface OpenAnswer { /* … */ readonly people: readonly string[] }   // the owner first, then the sharing file's people; [] for a visitor
export interface WireFace { readonly type: 'image/png' | 'image/jpeg'; readonly base64: string }
// api.ts
face(login: string): Promise<Answer<WireFace>>
// game/faces.ts: one fetch per name per visit, kept in memory only
export function faceOf(api: Api, login: string): Promise<string | undefined>   // a data: address, or undefined
```

`GET /api/face?login=`: signed-in people only (`signed-out` otherwise); `login` must match GitHub's name rule
(`/^[A-Za-z0-9-]{1,39}$/`, else `bad-request`); it reads `GET /users/{login}` for `avatar_url`, fetches that with
`s=96`, and answers at most 64 KB (`not-found` beyond, or for anything but PNG or JPEG). `Face` props: `login`,
`src: string | undefined`, `size: 32 | 44`: a round picture with a 1 px `--words` edge, or the name's first letter
on `--raised`; its accessible name is the login. The cluster shows up to three faces and "+N"; pressing your own
opens the menu with Sign out. Save shows the same faces inside its button on `wide`.

- [ ] **Step 1: Failing tests.** `face.test.ts`: the three refusals; a good answer; GitHub asked twice.
      `open.test.ts`: `people` is `['grandma', 'kid']` for the shared fixture and `[]` for a visitor. Browser: a
      `Face` with no `src` shows "G"; with one, an `img` whose `src` starts `data:image/png;base64,`. Journey (five
      sizes): the owner's level shows two faces on `wide` and `mid`; no request leaves the site's origin
      (`requests` hold only the site's address); nothing was refused; a face that fails shows the letter and no
      console error.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat: the faces of the people in a game`. Review
      pictures (find bar open, faces), report Tasks 13 and 14.

---

## Pull request 7: the other screens

### Task 15: Your games, a game's page and the changes waiting

**Files:**
- Create: `src/features/levels/thumbs.ts`, `src/features/levels/Thumb.svelte`, `src/features/suite/Games.svelte`
- Rewrite: `src/features/suite/GameHome.svelte`, `src/features/suite/Waiting.svelte`
- Delete: `src/features/suite/PickGame.svelte`, `src/features/suite/AddEditor.svelte`
- Modify: `src/features/suite/App.svelte`
- Test: `tests/features/levels/thumb.browser.test.ts`, `tests/journeys/open-game.journey.test.ts`,
  `tests/journeys/games.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// thumbs.ts: one hidden level picture, shared; each ask is drawn in turn and copied to the asker's 2D canvas. The
// picture is made again (destroyed, then created) whenever the next ask's size, tileset or backdrop differs, one at a
// time, so never more than one hidden context; its mount is laid out off screen at the thumb's own pixel size
// (a `display: none` mount has no size, and the framework draws nothing until it has one). Each picture frees its own
// art, so an ask brings a loader, never an `Art` another picture holds (audit I6).
export function drawThumb(target: HTMLCanvasElement, ask: { content: GameContent; level: Level; art: () => Promise<Art | undefined | 'missing'> }): Promise<void>
```

`Thumb` props: `content`, `level`, `art` (a loader, as `drawThumb` takes), `grid?: boolean` (default true: the same stroke-pair grid as the notes,
drawn as an SVG over the 2D canvas), `marks?` (Task 16). 16:9, the level fitted with no room.

- **Your games** (`Frame` with no level; the pill reads `WORDS.gamesTitle`): a wall of title-block cards, as many
  across as fit at 280 px each: a `Thumb` of the game's first level, the game's name (Fraunces), its faces, and
  `waitingRow(n)` when n > 0. Each card is one link. A game opens lazily (its card shows the ground and its name
  until its files arrive; at most three opens at once). The last card is `WORDS.addAnother` (with no games:
  `WORDS.addCardTitle`, `WORDS.addCardLine`, a picture of what will happen (a `Thumb` of the demo level with a
  "SAVED" stamp over it, the spec's "with a picture of what will happen", audit M6), one main button). A game that cannot be reached or is not a game is a
  card with its plain sentence and one button. The find field of the old list is gone; the find bar lists
  `open-game:<owner>/<name>` for each.
- **A game's page:** the game's first level fills the frame behind, drawn by `Stage` in `mode="read"` at 35%
  opacity; over it one `Panel` (at most 560 px wide; the full width less margins on `narrow`, where the page
  scrolls): the game's `TitleBlock`, `WORDS.youAre(level)`, the levels as `Thumb` cards (`nameOf(id)`,
  `WORDS.changedBy(by, ago)` from `WireFile.last`), then `waitingRow(n)` as a link for those who may see it, then
  Share for those who may. The other four editors are in the pill, not here; `gameMoreSoon` is gone.
- **Changes waiting:** the same panel switched to the list (the address stays `…/waiting`): one card per change
  with its author's face, its title and `waitingBy(name)`, and a before-and-after pair of `Thumb`s when the change
  is a level; `waitingNone` when empty. A back button returns to the game's panel.

- [ ] **Step 1: Failing tests.** Browser: 12 `Thumb`s on one page all show the level (a non-sky pixel where the
      ground is) and `document.querySelectorAll('canvas')` holds no more than 2 WebGL canvases; with a `Stage` of the
      same level open beside them, the `Stage`'s crate pixel is still the crate's after the thumbs are drawn and
      their picture destroyed (audit I6); thumbs of two games with different tilesets both draw. Journeys (five
      sizes): the wall shows the fixture's games as cards with pictures; the first card opens the game's page,
      whose first level card opens the level; each access level sees only what it may (Look: no Share, no waiting
      link; Suggest: its own waiting change; Approve, Edit, Owner as today's `game-*` scenes); can't-reach shows
      the card with Try again; not-a-game and a broken game show their sentences; an Owner with no games sees the
      one card and its one main button; the waiting list shows two changes with faces and thumbnails; `broken`
      is empty everywhere.
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat: your games, a game's page and what waits`.

### Task 16: Share, one waiting change, the problems and "nothing here"

**Files:**
- Rewrite: `src/features/suite/Share.svelte`, `src/features/suite/WaitingChange.svelte`
- Create: `src/features/suite/NotFound.svelte`, `src/features/levels/marks.ts`
- Delete: `src/features/ui/Screen.svelte`; the old token aliases at the foot of `ui.css`
- Modify: `src/features/levels/Notes.svelte` (marks), `src/features/suite/App.svelte`,
  `src/features/suite/LevelScreen.svelte` (problems)
- Test: `tests/features/levels/marks.test.ts`, `tests/journeys/share.journey.test.ts`,
  `tests/journeys/approve.journey.test.ts`, `tests/journeys/problems.journey.test.ts`

**Interfaces:**
- Produces:

```ts
// marks.ts
export interface Mark { readonly id: HitId; readonly kind: 'moved' | 'added' | 'erased' | 'retyped'
  readonly from?: Point; readonly note: string }
/** What a waiting change did to a level, as marks. `note` is in the language on screen: "Moved 2 tiles right". */
export function marksOf(before: Level, after: Level): readonly Mark[]
```

A move's note is `WORDS.movedNote(tiles, way)` by the larger of its two distances (ties go sideways); an add is
`WORDS.changeAdded`, an erase `WORDS.changeErased`, a retype `WORDS.changeRetyped`.

- **Share:** a `Panel` over the game's page (the address stays `…/share`), not a page: the link with Copy; what
  anyone who signs in may do (a `Choice`); the people, each a row with their `Face`, name and a `Choice` of level;
  `addName` with Add; Save sharing (main). Every sentence and rule is today's.
- **One waiting change:** the level screen's frame with `mode="read"`: the level as it will be; each mark ringed
  (dashed `--touch`), a moved thing with a dashed ghost outline where it was and a leader to it, and its note as a
  `Chip`; a Before / After switch (`Choice` of two) that redraws the level and keeps the marks' places; in the
  cluster Approve (main) and Turn it down for those who may, `waitingFor(name)` for its author, `cantApprove` for
  the rest. Approve stamps `stampApproved` with `stampApprovedBy(name)` and the button under the stamp returns to
  the game's page. Failed checks, running checks, clashes, own change, gone and "touches more than levels" are
  notices in the same frame with today's sentences.
- **Problems:** a game that cannot be read, cannot be reached, is not found or is not a game is the frame with one
  problem notice (one sentence on what happened, one on what to press, one button); the level stays behind when
  there is one.
- **Nothing here:** route `none`: the frame with one panel, `WORDS.nothingHere`, and one button (`toDemo` when a
  demo is set, `toGames` when signed in).

- [ ] **Step 1: Failing tests.** `marksOf` for a move of 2 right ("Moved 2 tiles right"), 1.5 up, an add, an
      erase, a retype, and equal levels (none). Journeys (five sizes): Share opens over the game's page, a person
      is added at Suggest and saved, the link is copied, a mistyped name says so, and the panel overlaps nothing
      and scrolls inside itself on `phoneSideways`; a Suggest-level change opened by an approver shows the ring,
      the ghost and "MOVED 2 TILES RIGHT", Before shows the crate at 6.5, Approve lands "APPROVED" and the game's
      file has the move; its author sees "Waiting for grandma to approve" and no Approve; each of the six refusals
      shows its notice; `#/nonsense` shows "There's nothing here." and its one button leads to the demo level;
      `git grep -n "var(--fg\|var(--surface\|var(--muted\|var(--line\|var(--focus\|var(--radius" src` is empty
      (a Node test in `tests/styles/tokens.test.ts`).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat: share, approve and the problem screens in
      the frame`. Review pictures (every list screen, Share, a waiting change), report Tasks 15 and 16.

---

## Pull request 8: nine languages

### Task 17: No default language

**Files:**
- Create: `src/features/words/languages.ts`, `kept.ts`, `flags.ts`, `flags/{cn,mx,us,br,ru,jp,kr,de,fr}.svg`,
  `es.ts`, `ko.ts`, `ja.ts`, `zh.ts`, `pt.ts`, `fr.ts`, `ru.ts`, `de.ts`
- Create: `src/features/ui/Flag.svelte`, `src/features/suite/LanguagePicker.svelte`
- Modify: `src/features/words/words.svelte.ts`, `format.ts`, `src/features/ui/ui.css` (fonts per script),
  `src/features/suite/suite.ts`, `App.svelte`, `Cluster.svelte`, `src/features/find/commands.ts`, `index.html`,
  `package.json`, `knip.json`, `public/licences.txt`, `CLAUDE.md` (`af.language`), `scripts/write-commands.ts`
- Test: `tests/features/words/languages.test.ts`, `kept.test.ts`, `tables.test.ts`, `flags.test.ts`,
  `tests/features/words/no-default.test.ts`, `tests/features/ui/flag.browser.test.ts`,
  `tests/journeys/languages.journey.test.ts`, `tests/workflows/licences.test.ts`

**Interfaces:**
- Produces:

```ts
// languages.ts
export const LANGUAGES = ['zh', 'es', 'en', 'pt', 'ru', 'ja', 'ko', 'de', 'fr'] as const
export type Language = (typeof LANGUAGES)[number]
export const LANGUAGE_NAMES: Readonly<Record<Language, string>>   // 中文, Español, English, Português, Русский, 日本語, 한국어, Deutsch, Français
export const LANGUAGE_TAGS: Readonly<Record<Language, string>>    // zh-Hans, es-MX, en-US, pt-BR, ru, ja, ko, de, fr
// (the framework gives `en` and `es`; the editors follow the flags, audit M9)
/** The language this team writes the editors' words in. A fact for checks; no code reads it as a fallback. */
export const SOURCE: Language = 'en'
/**
 * The first of the device's tags that is one of the nine (`pt-PT` is pt, `zh-TW` is zh), or undefined. Tags are read
 * as the framework's `matchLanguage` reads them: what follows a `.` is dropped, `_` is `-`, and a bad tag finds nothing
 * (audit M9).
 */
export function matchLanguage(tags: readonly string[]): Language | undefined
/** `own` first, then the fixed order with nothing else moved. */
export function listFor(own: Language | undefined): readonly Language[]
// kept.ts
export function readLanguage(store: Storage): Language | undefined     // af.language; rubbish or a throwing store is undefined
export function keepLanguage(store: Storage, language: Language): void
// words.svelte.ts
export function language(): Language | undefined      // undefined until one is chosen
export function setLanguage(next: Language): void     // also sets <html lang> to its tag
// flags.ts
export const FLAGS: Readonly<Record<Language, string>>   // the SVG text
```

- **Which one shows** (`suite.ts`, before the app mounts): `readLanguage(localStorage)`, else
  `matchLanguage(navigator.languages)`, else none: the app mounts `LanguagePicker` full screen and nothing else
  until a flag is pressed. Choosing keeps it in `af.language`. `WORDS` read with no language chosen throws in
  development and tests, so no screen can render words before the choice.
- **`LanguagePicker`:** full screen on the ground: the wordmark `automata`, then the nine flags in `listFor(…)`
  order, three across (`wide`, `mid`) or three across smaller (`narrow`), each a button at least 88 px wide with
  `aria-label` its own name, `lang` its tag, `data-lang` its code. No other text. As a panel (from the language
  button, `data-part="language"`): the same nine, the current one first and ringed in `--touch`.
- **The language button:** the current flag (44 px), in the cluster on every screen and shape (on `narrow` between
  the pill and Save), accessible name `WORDS.language`.
- **Flags:** `viewBox="0 0 60 40"`, presentation attributes only (no `style`, no `class`, no script, no link),
  each under 2 KB, drawn to read at 44 px wide: China (red, one large and four small yellow stars), Mexico (green,
  white, red, a plain brown-and-green emblem), the United States (thirteen stripes, a blue canton of white dots),
  Brazil (green, yellow rhombus, blue disc, white band), Russia, Germany and France (three bands), Japan (white,
  red disc), South Korea (white, the red and blue circle, four groups of black bars). `Flag.svelte` gives each a
  1 px `--words` edge at 35% and 3 px corners.
- **Tables:** each of the eight is `export const ES: Words = { … }` with every key. Plain words at the
  drunk-grandma level; Spanish as in Mexico, Portuguese as in Brazil, Chinese Simplified; functions keep their
  arguments' order free (`blockSavedBy: (name, when) => …`); plurals by `Intl.PluralRules` where the language has
  them; the tools' and stamps' words as short as the language allows.
- **Fonts:** `ui.css` adds `:root:lang(ko)`, `:lang(ja)`, `:lang(zh-Hans)` overrides of `--label` and `--title`
  that put "Noto Sans KR" (JP, SC) first; `setLanguage` loads the package's stylesheet with a dynamic
  `import('@fontsource/noto-sans-kr/400.css')` (and `600.css`) only for that language. Fraunces stays for Latin
  titles; Russian titles fall to Onest.
- **Dates and numbers:** `ago` and `tiles` take `LANGUAGE_TAGS[language]`.
- **Find bar:** `language:<code>` for each, named by `LANGUAGE_NAMES`; `docs/commands.md` gains every language's
  column in the fixed order.

- [ ] **Step 1: Failing tests.**
  - `languages.test.ts`: the order; `matchLanguage(['fr-CA', 'en'])` is `fr`; `['nl', 'sv']` is undefined;
    `['zh-TW']` is `zh`; `['pt-PT']` is `pt`; `listFor('ko')` starts `ko, zh, es, en, pt, ru, ja, de, fr`.
  - `tables.test.ts`: for every language, every key of `EN` exists, is the same kind (string or function), is not
    empty, and a function called with marker arguments (`'§1'`, `7`) returns a string holding each marker, but for
    the keys in `MAY_DROP = ['tipDrag', 'cmdAdd']`, which may leave the name out ("Drag this anywhere", the tip's
    pointer naming it: a character's name is an English id from the game's files, audit I10); no
    table holds a banned word (`tests/fixtures/banned.ts` gains, per language, its own words for repo, commit,
    branch, pull request and token: es `repositorio`, `rama`; pt `repositório`, `ramificação`; fr `dépôt`,
    `branche`, `jeton`; de `Repository`, `Zweig`; ru `репозиторий`, `коммит`, `ветка`, `токен`; ja `リポジトリ`,
    `コミット`, `ブランチ`, `トークン`, `プルリクエスト`; ko `저장소`, `커밋`, `브랜치`, `토큰`; zh `仓库`, `提交`,
    `分支`, `令牌`); no English table value has a UK spelling (`colour`, `centre`, `organis`, `cancelled`,
    `favourite`, `grey`); the words of the four tools and three stamps are at most 9 characters in every
    language (ruling 19); a table other than `EN` equals `EN` in at most 10% of its string values (names like "GitHub").
  - `no-default.test.ts`: no file under `src/` but `languages.ts`, `en.ts` and `words.svelte.ts`'s table map holds
    the string `'en'`; `index.html` has no `lang` attribute (the page sets it); no `?? 'en'` or `|| 'en'` anywhere.
  - `flags.test.ts`: nine files, each parses as SVG with that `viewBox`, has no `style`, `class`, `script`, `href`
    or `on*`, and is under 2 KB; `tokens.test.ts` lets colors be named in `words/flags/` and nowhere new.
  - `kept.test.ts`: round trip; rubbish; a store that throws.
  - Journeys (five sizes; a browser context with `locale` set): **Dutch** (`nl-NL`): nine flags and no letters
    but the wordmark on screen (the page's text is exactly "automata"), in the fixed order; pressing Korea's shows
    the demo level with the tip in Korean and `<html lang="ko">`; a reload skips the picker. **German** (`de-DE`):
    no picker; the tip is German. **Each of the nine:** the level screen with the crate picked passes `broken`
    (nothing cut, nothing overlapping, tools 56 px, Save 48 px) and the title block's time is that language's.
    **The language button** opens the panel with the current flag first; choosing Japan's changes every word at
    once without a reload and keeps the unsaved change. **The find bar** lists nine language commands by their
    own names and `Español` switches. For `ko`, `ja`, `zh` the Noto font's file was requested and for `de` none
    of them was.
- [ ] **Step 2:** Push, red. **Step 3:** Implement; write the eight tables; `pnpm commands:write`. **Step 4:** Push,
      green. If the `engines` job passes 25 minutes, stop and report (do not change the workflow).
- [ ] **Step 5:** Commit `feat: nine languages and no default`. Review pictures (the picker, the language panel,
      the level screen in each of the nine), report `Task 17`.

---

## Pull request 9: every screen pictured, and the docs

### Task 18: The whole set of pictures, the layout rules, the docs and the old pull request

**Files:**
- Rewrite: `tests/journeys/screens.journey.test.ts` (split by group into `screens-first.journey.test.ts`,
  `screens-level.journey.test.ts`, `screens-games.journey.test.ts`, `screens-languages.journey.test.ts`, each
  under 600 lines, sharing `tests/fixtures/scenes.ts`)
- Modify: `tests/fixtures/measure.ts`, `tests/fixtures/fake-github/repos.ts` (the long-named game)
- Modify: `CLAUDE.md`, `README.md`, `docs/deploy.md`, `docs/teams.md` (only where a screen's words or steps
  changed), `docs/superpowers/progress.md`
- Test: `tests/docs/docs.test.ts`

- [ ] **Step 1:** `scenes.ts` lists every state in "Appendix B", each `{ name, reach(size), stage? }`. Every scene
      runs at the five sizes, is pictured as `<name>-<width>x<height>`, then measured.
- [ ] **Step 2:** `measure.ts`'s `broken` holds every rule of the spec's "Layout rules as tests": no sideways
      scroll; nothing pressed under 44 px (a `.button.primary` 48, a `[data-tool]` 56); no two `[data-part]`
      overlap; no word cut or run off the side; exactly one `h1`; at most one main button outside an open notice,
      and exactly one inside one; sentences 18 px, labels 13, numbers 15; every word 4.5 to 1 on what is behind
      it; no words on the art; on a stage, `[data-scale]` as wide as the window, the clear cell at least 160 px
      tall and half the shorter side wide, every thing inside it; and a new rule, checked by each stage scene:
      `data-scale` and the first thing's box are equal before and after the scene's last step when that step
      picks a thing, lands a stamp or shows a notice.
- [ ] **Step 3:** No scene is skipped at any size (`git grep -n "skip" tests/journeys` finds nothing Task 4 left).
- [ ] **Step 4:** Docs. `CLAUDE.md`: the features list and structure match the code (`find`, the new files), the
      device list names `af.notes` and `af.language`, a "The look" bullet (the six colors, the fonts, the panel,
      where each may be used), "Languages" (nine, the order, no default, where words live). `README.md`: what a
      first visit is now, `pnpm commands:write`, the link to `docs/commands.md`. The docs tests read each.
- [ ] **Step 5:** Push; green. Close pull request 12 with one sentence pointing at this cycle's pull requests, and
      delete its branch (`gh pr close 12 --delete-branch`; the standing approval covers a closed pull request's
      branch).
- [ ] **Step 6:** Review pictures: **the full set, every scene of Appendix B at five sizes, saying these are the
      final look**, the mockup beside the level screen first. Tracker to 64%: stage 4 is done but for Play,
      which counts 8 of its 60 points and waits for the framework. Report the summary: each task's commit and
      test count, every ruling made on the way, every deviation, what is not done.

---

## Pull request 10: Play (the last slice; it waits for the framework)

### Task 19: Play the level right there

**This task does not start until all three are true, each written in the tracker:**

1. The framework's cycle that lets a game turn on a built-in walk-and-jump hero in its own files is merged to
   AutomataFramework's `main`, with its touch buttons and keys.
2. An amendment to this task is merged here. The plan stage writes it and the plan audit reads it. It closes the
   two gaps named below with the framework's real names and changes nothing else, unless the framework's cycle
   made something below untrue, which it then says.
3. The framework pin has moved to that commit, in its own pull request, as Task 1 did. The fixture game
   (`tests/fixtures/game/`) turns the built-in hero on in that pull request; `plain-game` does not.

**The two gaps** (the only things this task leaves open, because the framework has not decided them):

- **G1:** how a game's files say the built-in hero is on. The hero spec (AutomataFramework PR 91, merged) decides
  it: the project's `hero` character has `moves`. So `canPlay` is
  `content.characters[content.project.hero]?.moves !== undefined`; the amendment only checks plan H kept that name
  (audit I11).
- **G2:** the framework's call that plays content in an element with the built-in hero's keys, gamepad and thumb
  scheme. It decides the body of `startPlay`. The amendment also settles, with the framework's real API: which
  language the game's hints speak (the plan audit's Q2, the Owner's answer); how the game's language is chosen, since
  the framework's game start refuses to begin before one is (plan W); and how a touch on Stop never starts a walk,
  since on a sideways phone and a tablet the thumb scheme's halves cover the game and Stop sits over the left half
  (audit I11).

Everything else is decided here.

**Files:**
- Create: `src/features/levels/play.ts`, `src/features/levels/Play.svelte`
- Modify: `src/features/levels/Levels.svelte`, `src/features/suite/LevelScreen.svelte`,
  `src/features/find/commands.ts`, `src/features/ui/icons.ts` (`play: play`, `stop: stop`),
  `src/features/words/table.ts` and all nine tables, `tests/architecture/rules.ts`, `tests/fixtures/scenes.ts`,
  `docs/commands.md` (by `pnpm commands:write`), `CLAUDE.md`, `docs/superpowers/progress.md`
- Test: `tests/features/levels/play.test.ts`, `tests/features/levels/play.browser.test.ts`,
  `tests/journeys/play.journey.test.ts`, `tests/features/find/commands.test.ts`

**Interfaces:**
- Consumes: G1 and G2 from the framework; `Stage`, `Levels`, `commandsFor`, `scenes.ts`, `broken`.
- Produces:

```ts
// levels/play.ts: the only file that starts a sim; loaded only with `await import('./play.ts')`
/** Whether this game's files turn the framework's built-in hero on. Reads the files and runs nothing. */
export function canPlay(content: GameContent): boolean
/** Plays the level as it is on screen, with the framework's built-in hero, keys and touch buttons. */
export function startPlay(options: { mount: HTMLElement; content: GameContent; level: Level; art: Art | undefined }):
  Promise<{ stop(): void }>
```

**What a person sees.** Play is the fourth tool, under Erase (`data-tool="play"`, the `play` icon, `WORDS.toolPlay`),
for every level of every game, at Look level too: there it is the one button beside the line "You can look around".

- **Pressed, in a game that can play:** the notes, the tools, the card, the title block, the pill and the cluster
  go; the level plays in the same canvas box, from the files as they are on screen, unsaved changes included; one
  main button, `WORDS.stop` with the `stop` icon, is top left (`data-tool="play"`, `aria-pressed="true"`, at least
  48 px). The framework's own touch buttons show where it puts them and are not restyled. Keys go to the game: the
  find bar's keys, undo, redo and the arrow nudges are off while it plays. Escape or Stop ends it.
- **Stopped:** the level is exactly as it was: the same edit, the same picked thing, the same undo and redo steps,
  the same scale. Nothing a play did is kept or saved.
- **Pressed, in a game that cannot** (`canPlay` is false): nothing plays. One notice, `WORDS.playNeedsCode`, with
  `WORDS.ok`; the level does not move under it (ruling 15).
- The find bar gains one kind, `play` ("Play"). There is no `stop` kind: the find bar cannot be opened while the
  level plays, so a person stops with Escape or the button.

- [ ] **Step 1: Failing tests.**
  - `play.test.ts`: `canPlay` is true for the fixture game and false for `plain-game`.
  - `rules.test.ts`: a file that imports `levels/play.ts` with a plain `import` fails; `await import` passes.
  - `commands.test.ts`: `play` is in the list at every level, Look included, right after `erase-tool` where
    there are tools.
  - `play.browser.test.ts` (three engines): after `startPlay` on the fixture level, holding the `right` action's
    key for one second moves the hero's picture to the right; `stop()` twice is safe and leaves the
    mount empty.
  - `play.journey.test.ts` (five sizes, three engines): drag the crate into the air and press Play: no
    `[data-note]`, no `[data-part="tools"]`, no `[data-part="card"]`; Stop is at least 48 px and overlaps nothing;
    the crate falls (two pictures half a second apart differ); on the touch sizes the built-in hero's thumb scheme
    plays it (a thumb put down on the left half and slid right walks the hero right; a tap on the right half jumps
    it), on desktop the keys do; a touch on Stop stops and does not walk the hero; the hero spec's own case, "Play on
    the demo level by thumbs at iPad size", is the `ipadSideways` run (audit I11); Stop: the crate's `data-y` is the dragged one, it is
    still picked, Undo is still enabled and `data-scale` is unchanged; Escape does the same; a Look-level person
    can Play and Stop; in `plain-game`, Play shows the notice, `data-scale` and the first thing's box do not
    change, and OK closes it; nothing was saved by any of it (the pretend GitHub got no write).
- [ ] **Step 2:** Push; the new tests fail for the right reason.
- [ ] **Step 3:** Implement. Add `toolPlay`, `stop` and `playNeedsCode` to `table.ts` and to all nine tables, each
      in its own language, by Task 17's rules. Add the scenes `level-play` and `level-play-needs-code`.
- [ ] **Step 4:** `pnpm commands:write`; `CLAUDE.md` names Play in "Particular to this repo" ("Play runs the
      framework's built-in play of the content and never a game's code"). Push; all green.
- [ ] **Step 5:** Commit `feat(levels): play the level right there`. Review pictures (both scenes at the five
      sizes, saying these are the final look). Then the two audits of "After the build", on these two scenes only,
      added to the same audit files, and their fixes. Tracker: stage 4 complete. Report `Task 19`.

---

## After the build (stages 5 and 6)

These start when Task 18 is merged and do not wait for Task 19 (ruling 16). Two audits, each over every scene of
Appendix B that exists by then, at all five sizes, read from the final review artifact and
`ci-screens`, each written to `docs/superpowers/audits/`:

1. **`2026-11-14-blueprint-redesign-grandma-audit.md`** (Opus, medium): on each screen, could a tired, distracted
   person who has never seen a game editor tell what is happening and what to press? Is the first visit to the
   first change tight? It also reads all nine word tables and back-translates each into English beside the
   English, flagging any word that is not plain or not what the English says.
2. **`2026-11-14-blueprint-redesign-visual-audit.md`** (Fable, medium): would a person think this is a funded
   company's product, at the level of the best creative tools? Every shortfall is a finding with its picture.
   The implementation audit of the code against this plan and the spec is part of this stage too
   (`2026-11-14-blueprint-redesign-implementation-audit.md`, Opus, medium, the audit prompt).

Stage 6 (Sonnet, high) fixes every finding, republishes the review artifact, and only then is the Owner asked to
look.

## Appendix A: new words (English, `en.ts`)

Keys that stay keep today's text unless listed. Keys no screen uses any more are deleted in the task that removes
their last use (the words-used test names them).

| Key | Text |
|---|---|
| `appName` | Automata Framework editors |
| `toolPlay`, `stop` (Task 19) | Play, Stop |
| `playNeedsCode` (Task 19) | This game moves its hero with its own code, which the editors never run. Play it in the game itself. |
| `artMissing` | Some of this game's pictures are missing, so things show as boxes. |
| `toolMove`, `toolAdd`, `toolErase` | Move, Add, Erase |
| `edWorld`, `edCharacters`, `edFeel`, `edSound`, `edStory` | World, Characters, Feel, Sound, Story |
| `comingSoon`, `ok` | Coming soon, OK |
| `soonCharacters` | Characters will let you make and change who is in your game. |
| `soonFeel` | Feel will let you tune how the game moves and feels. |
| `soonSound` | Sound will let you make your game's sounds and music. |
| `soonStory` | Story will let you write what people say and what happens. |
| `find`, `findShort`, `findNone` | Find or do anything, Find, Nothing has that name. |
| `export`, `saveTeam`, `signInShort` | Export, Sign in to save with your team, Sign in |
| `openGamePage`, `menu`, `language` | Open the game's page, Menu, Language |
| `cardStart(n)` | Player {n} starts here |
| `cardWhere`, `cardWhat` | Where it is, What it is |
| `noteLeft`, `noteTop` | From the left, From the top |
| `tilesWord(n)` | tile (n is 1), tiles (otherwise) |
| `notePin`, `noteRope` | Pin, Rope |
| `stepLess(label)`, `stepMore(label)` | {label}, a little less; {label}, a little more |
| `cardLater` | How heavy, how bouncy and the rest: in Characters and Feel, coming soon. |
| `eraseThis`, `eraseHint` | Erase, Touch a thing to erase it. |
| `lastStart` | Every level needs a place to start, so this one stays. |
| `addPick` | Pick what to add, then touch the level where it goes. |
| `notesSwitch`, `notesOn`, `notesFaded`, `notesHidden` | Drawing notes, On, Faded, Hidden |
| `blockNotSaved`, `blockSavedBy(name, when)` | Not saved yet; Saved by {name}, {when} |
| `justNow` | just now |
| `stampSaved`, `stampApproved`, `stampExported` | Saved, Approved, Exported |
| `stampBy(name, when)`, `stampApprovedBy(name)` | by {name}, {when}; by {name} |
| `stampWaiting`, `stampCopied` | Waiting for someone to approve, Copied for your agent |
| `seeTeamGame` | See your team's game |
| `saveWhy` | Save puts your change into your team's game, so everyone works on the same thing. Sign in with GitHub to save. |
| `exportInstead` | Export instead |
| `tipDrag(name)` | Drag the {name, lower case} anywhere (other languages may say "Drag this anywhere": `MAY_DROP`) |
| `tipAdd` | Press Add to put something in the level. |
| `tipExport` | Nice. Now press Export to keep it. |
| `tipsHide` | Hide tips |
| `panelTools`, `panelCard`, `panelBlock`, `panelSwitch` | tools, details, level name, notes |
| `panelHide(name)`, `panelShow(name)` | Hide {name}, Show {name} |
| `panelsHide`, `panelsShow` | Hide everything, Show everything |
| `lookLine(owner)` | You can look around. To change things, ask {owner}. |
| `teamGame` | This game belongs to a team. Sign in to open it. |
| `leaveAsk`, `leaveYes` | Leave without saving?, Leave |
| `gamesTitle`, `addCardTitle`, `addAnother` | Your games, Add the editor to your game, Add the editor to another game |
| `addCardLine` | You'll pick your game on GitHub and come straight back. |
| `changedBy(name, when)` | Changed by {name} {when} |
| `before`, `after` | Before, After |
| `movedNote(n, way)` | Moved {n} tile(s) left / right / up / down |
| `changeAdded`, `changeErased`, `changeRetyped` | Added, Erased, Changed |
| `waitingFor(name)` | Waiting for {name} to approve |
| `nothingHere`, `toDemo`, `toGames` | There's nothing here., Open the example game, Your games |
| `cmdMove(id, way)`, `cmdErase(id)`, `cmdAdd(name)`, `cmdOpen(name)` | Move {id} left / right / up / down; Erase {id}; Add a {name} ("an" before a vowel); Open {name} |
| `cmdShowNotes`, `cmdFadeNotes`, `cmdHideNotes`, `redo` | Show notes, Fade notes, Hide notes, Redo |

## Appendix B: every screen state (the pictures and the screens journeys)

Each at the five sizes. `(stage)` scenes also run the level rules.

**First visit:** `picker` (a Dutch device); `first-level` (stage; the drag tip); `first-level-dragged` (stage; the
Export tip); `exported` (stage; the stamp, "Save it as a file", Save reading "Sign in to save with your team");
`export-text-box` (clipboard refused); `visitor-save-panel` (stage); `no-demo-sign-in`; `team-game-sign-in`;
`sign-in-cancelled`, `sign-in-failed`, `signed-out-again` (each over the level).

**The level:** `level-open` (stage; an owner, with faces); `level-picked` (stage; card and notes);
`level-notes-faded`, `level-notes-hidden` (stage); `level-sheet-down` (stage; `mid` and `narrow` pull the sheet to
its title; `wide` is the same as picked); `level-pinned` (stage; the pin's note); `level-start-picked` (stage);
`level-add-tray` (stage); `level-added` (stage); `level-erase-tool` (stage); `level-last-start` (stage);
`level-character-choice` (stage); `level-unsaved` (stage); `level-saved` (stage; the stamp);
`level-saved-suggestion` (stage); `level-changed-elsewhere` (stage); `level-offline` (stage); `level-leave`
(stage); `level-look-only` (stage); `level-art-missing` (stage); `level-plain-game` (stage; boxes on sky);
`level-tools-closed`, `level-card-closed`, `level-everything-closed` (stage); `level-find-open`, `level-find-typed`, `level-find-none` (stage); `level-pill-menu`; `level-person-menu`;
`level-coming-soon`; `level-language-panel`; `level-long-names` (stage).

**Play (added by Task 19):** `level-play` (the fixture game, playing); `level-play-needs-code` (the plain game,
the notice).

**Languages:** `level-zh`, `level-es`, `level-en`, `level-pt`, `level-ru`, `level-ja`, `level-ko`, `level-de`,
`level-fr` (stage; the crate picked); `games-de`, `share-ru`, `change-ja`.

**Games:** `games-wall`; `games-empty`; `games-cant-reach`; `game-owner`, `game-edit`, `game-approve`,
`game-suggest`, `game-look`, `game-visitor`; `game-with-changes-waiting`; `game-cant-be-reached`; `game-broken`;
`not-a-game`; `nothing-here`.

**Waiting:** `waiting-list`; `waiting-none`; `change-as-approver` (stage); `change-before` (stage);
`change-approved` (stage; the stamp); `change-as-author` (stage); `change-failed-checks` (stage); `change-gone`;
`change-turned-down`.

**Share:** `share-empty`; `share-three-people`; `share-mistyped-name`; `share-saved`.

## Self-review

- **Spec coverage.** Goals 1 to 6: Tasks 7 to 18; Task 3; Task 12; Tasks 7, 10, 13 and 19; Task 17; Task 18 and the
  two audits. Anti-goals: the old frame is deleted (Tasks 7, 12, 15, 16); nothing is drawn on the art (Tasks 3,
  7, 9 pixel tests); no dead button (Task 7's Coming soon cards, Task 18's rules); no default language (Task 17);
  no page of words first (Task 12); nothing under 44 px (`broken`). "What happens to PR 12": Tasks 4, 6, 9, 18.
  The spec's Paint and "How heavy" are non-goals and appear only as `cardLater`.
- **Gaps the spec left, closed here:** rulings 1 to 16, and 18 and 19 from the plan audit. **Added after the spec, by the Owner:** ruling 17 (panels that
  close and open). **Open:** the two named gaps of Task 19, which only the
  framework's cycle can close.
- **Where this plan differs from the spec, and why:** the card has no "what it is" line (the format has no such
  field: ruling 4); Play comes last, after a framework cycle, and offers no link to a game's own page (the Owner's answer and
  ruling 15); the picker
  puts the person's own language first when one is known (the framework's language spec, which this spec defers
  to for the flag table); faces are `data:` pictures, which the spec's constraints rule out ("no `data:` address")
  but the page's header already allows for pictures, and only faces use it (ruling 7, audit M1).
