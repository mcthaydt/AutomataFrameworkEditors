# Scenes, Slice 1 (Editors): Ground and Materials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, in
> one session, with no subagents (project rule). Steps use checkbox (`- [ ]`) syntax for tracking. Tests run only in
> GitHub-hosted CI: "run" in a step means push and read the pull request's checks with `gh pr checks <number> --watch`.

**Goal:** In World's Scenes part a person opens a scene of their game, paints its ground by touch (solid ground,
slopes, ledges, back walls) in materials made from photos, tiles or plain colors, and saves it into the game with the
picture painted from it, byte for byte what `automata art` writes.

**Architecture:** A new page-side feature, `scenes`, above `levels`. The scene file is the only state: every action is
a pure change to a `SceneFile`, checked by the framework's own schema, painted by the framework's own painter in the
page, and drawn by the framework's `createLevelPicture` on the Blueprint frame's stage. The API gains one call that
saves several files of a game in one change. Nothing of the frame is rebuilt: Scenes uses the redesign's `Frame`,
`Stage`, `Panel`, `Sheet`, `Tool`, `Notice`, `Stamp`, `Tip`, words tables and command list.

**Tech Stack:** Svelte 5.57.1, strict TypeScript 6.0.3, Vite 8.3.3, Vitest 5.0.3 (Node, three browser engines,
journeys with Playwright 1.63.0), `@automataframework/framework` pinned by commit, Cloudflare Pages Functions for
`/api`. **No new dependency.**

**Plan audit:** [`audits/2026-11-15-scenes-1-plan-audit.md`](../audits/2026-11-15-scenes-1-plan-audit.md) (stage 3,
2026-11-15). Its fixes are written into this plan; each fixed place names its finding (E1 to E7, M1 to M5).

**Spec:** [`docs/superpowers/specs/2026-11-15-2d-environment-builder-design.md`](../specs/2026-11-15-2d-environment-builder-design.md).
Read "The builder: World's Scenes part", "Slices" (this is the builder's part of slice 1), "Testing" and
"Constraints". Principles served: 5 (the environment builder, carried over), 2 (touch first), 1 (every action ends in
a documented file). The framework's part is
[AutomataFramework's plan of the same name](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/plans/2026-11-15-scenes-1-ground-and-materials.md);
its "The format" section is the scene file this plan edits, and its "Handoffs" lists what this plan uses.

## Before starting: four gates

No task here starts until all of the first three are true, each written in the tracker with its date.

1. **The Owner has approved the mockups of all editors** (the Owner, 2026-11-15: "Do a mockup for all editors first
   before we do any code"). If the approved Scenes mockup differs from this plan (the tools, the paint strip, the
   Materials panel, the empty state), an amendment to this plan is written and audited before Task 1.
2. **The Blueprint redesign (Cycle 3) is built and through its two audits** (the spec's constraint). This plan names
   that plan's parts as it wrote them on 2026-11-15 (`Frame`, `Stage.svelte`, `Panel`, `Sheet`, `Tool`, `TitleBlock`,
   `Notice`, `Stamp`, `Tip.svelte`, `guide.ts`, `find/commands.ts`, `ui/panels.ts`, `layout.ts`, `game/art.ts`,
   `game/pictures.ts`, the `[data-*]` hooks, `tests/fixtures/scenes.ts`). The same amendment gives any name that
   differs on `main`; it changes nothing else.
3. **The framework's slice 1 is merged** (its Part D), and Task 1 moves the pin to that commit.
4. **Task 13 only (Play):** the redesign's Task 19 (Play in the level editor) and the framework's built-in hero on
   slopes (the framework plan's Task 12) are both merged.

## Global Constraints

- **Identity.** Before every commit: `git config --global user.name "McThayDT" && git config --global user.email
  "107786093+mcthaydt@users.noreply.github.com"`; the local hook that refuses any other author. No AI attribution
  anywhere. Pull request bodies start with the project's two attribution lines. Never force-push.
- **Nothing runs locally:** no test, lint, typecheck, build or generator. A generated file (`docs/commands.md`, the
  lockfile) is written as the redesign plan's tasks wrote theirs, and CI says if it differs.
- **Branches.** `main` plus at most five with CI running. One draft pull request per part below, merged by the merge
  session before the next is opened.
- **No new dependency.** If a task seems to need one, stop and report.
- **An editor writes only content files and their painted pictures:** here `content/scenes/<id>.json`, its `.png` and
  `.atlas.json`, a level's file and `automata.toml` (one added `[[content]]` block, by the framework's `listContent`),
  all through the one multi-file save every editor plan shares, `saveChange` (E2).
  Every JSON byte is `writeContent`'s; every picture byte is `artFiles`'.
- **The device keeps** only what `CLAUDE.md` lists. This plan adds no key: the first run counts in `af.tip.scenes`
  (the `af.tip.*` family), an unsaved scene is an `af.draft:…` entry, and `af.panels` gains the name `materials`.
- **The header stays** (`public/_headers`): no `blob:` or `data:` picture, no inline script, no `style="…"` attribute.
  A painted picture reaches the screen as bytes to an `ImageBitmap`, the way `game/art.ts` gives a read picture to the
  framework.
- **Sizes and touch.** The five sizes, by their names. 44 px for anything pressed, 48 for a main button, 56 for a
  tool and for a material in the paint strip. Nothing shrinks or gets an ellipsis to fit.
- **The view.** Pinch to zoom and two fingers to move at every size; one finger never moves the view (it paints).
- **Panels close and open** (the Owner, 2026-11-14): the paint strip and the Materials panel each have a close
  button and leave a 44 px handle; closing one never moves or resizes the scene.
- **Words.** Every word a person reads is in `src/features/words/`, in all nine languages, plain: "ground", "slope",
  "ledge", "back wall", "material". Never on a screen: "seed", "drift", "parallax", "tile shape", "decal", "sprite",
  "letter" (for a ground letter), "repo", "commit", "branch", "pull request", "token". Game words never name colors.
- **Nothing on screen does nothing.** A tool or button that has no work in this slice is not shown.
- **No file over 600 lines.**
- **An Owner question is never defaulted.** Send it to the coordinator with options and a recommendation, and wait.
- **Stop rules.** Stop and report at once on: the third fix for the same failure; a framework name in "Consumes" that
  the pinned commit lacks; a picture the page paints that differs by a byte from `automata art`'s; a need for a
  dependency, a workflow change not named here, or a change to a file of the frame beyond what a task lists.
- **Tracker:** after each task, update `docs/superpowers/progress.md` (Cycle 4, stage 4, slice 1). Tasks 1 to 12 are
  7% each, Task 13 is 6%, and the last 10% is the final green run with the review pictures published.

## Rulings made by this plan

The spec leaves these to the builder. Rulings 1, 13, 14 and 15 are the Owner's (cards answered 2026-11-15, 01:02
UTC); the plan audit's changes to the others are marked.

1. **Three tools in this slice: Paint, Erase, Play** (the Owner: "Only working ones"). Move and Add have nothing to act on until props (slice 2), so
   they are not shown. Play joins in Task 13.
2. **Four shapes on screen, nine in the file.** The strip offers Solid, Slope, Ledge and Back wall. Solid, Ledge and
   Back wall paint the tiles a finger passes over. **A slope is drawn as a line:** press where it starts, drag to
   where it ends, lift. The builder takes the nearer of the two angles the file has (one tile up per tile, or one per
   two tiles) and the drag's direction, shows the slope as a ghost while the finger moves, and on lift writes the
   slope tiles **and fills solid ground of the same material under them**, down to the level of the slope's foot. So a
   drag makes a hill, and a person never meets the framework's rule that a slope stands on ground while painting. A
   tap is a slope one tile long, rising to the right.
3. **Erase removes ground** a finger passes over. If that leaves a slope with air under it, the scene still shows,
   one notice says so in the framework's own sentence with the tile ringed, and its button **Fill it** puts ground
   back. Save while that notice shows saves nothing and points at it.
4. **Ground letters are the builder's business.** Painting a material in a shape uses the scene's first letter with
   that material and shape, or adds one: the first unused of `A` to `Z`, `a` to `z`, `0` to `9`. A letter is never
   removed or renamed, so a scene an agent wrote opens and saves with no byte changed. With all 62 taken and none
   matching, a notice says the scene has too many kinds of ground.
5. **A new photo material brings its own colors.** Add a material with a photo adds three paints named
   `<material>-dark`, `<material>` and `<material>-light` (the mean color of the photo's darker half, of all of it
   and of its lighter half, in whole-number math) and a `ladder` of the three. Every other key is left out, so the
   framework's defaults hold. A tileset tile adds a `tiles` material and no paint; "A plain color" adds one paint and
   a `flat` material.
6. **The material's card holds three things,** as the spec lists: How big (`scale`, steps of 0.25, 0.25 to 8), How
   worn (`wear`, steps of 0.1, 0 to 1) and its colors (each paint of its ladder as a swatch that opens the device's
   own color chooser; changing one changes the scene's paint, so every material using it follows). Keys the card does
   not show (`top`, `edge`, `turn`, `facet` and the rest) are kept as the file has them.
7. **A material in use cannot be removed.** Remove says "Paint over this ground first" when a letter of the ground
   uses it.
8. **The page paints the pictures; the API checks them without painting** (weighed and kept by the plan audit, E3).
   On Save the page sends the scene's value and the picture `artFiles` painted from it. The API writes the JSON and
   the atlas itself (`atlasText`), and takes the picture only at the scene's painted path, only as an 8-bit palette
   PNG (type 3) whose size is what `sceneSheet` says, whose `PLTE` is exactly the scene's paints in order after the
   clear entry, whose only chunks are `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`, and which `decodePng` reads whole,
   within the change's 6 MB. Painting again inside the API would mean carrying the 38 photos (2.9 MB) and the
   pipeline's work in a Cloudflare Function. A wrong picture cannot break a game: the game's own `automata check`
   says "This picture is older than its scene file", and the builder repaints on the next save.
9. **One save, one change to the game.** A scene, its picture, its atlas, and (when started from a level) the level
   and `automata.toml` go into the game together, never one without the others, through `saveChange` (E2).
10. **Library photos are served by this site** from `/photos/`, copied at build time from the pinned framework
    package's `photos/` folder. A game's own photos are read through `/api/picture`. No photo is uploaded from the
    builder in this slice: a game's own photos are added by its agent.
11. **A scene alone is drawn as a level made in memory** that names the scene and holds nothing else the schema does
    not demand. It is never written.
12. **Names.** A scene has only an id; its name in words is `nameOf(id)` ("meadow" is "Meadow"). A scene started
    from a level takes the id the framework's command would (`level-1` gives `scene-1`); a new one is the first free
    `scene-<n>`. Renaming a file is the agent's work.
13. **The empty state in this slice** (the Owner: "Two simple starts") has "Start from Level 1" (one button a level that has no scene, the first as
    the main button) and "Start with flat ground" (32 by 18 tiles at 16 pixels, the bottom three rows solid in the
    library's `dirt`, its three paints measured from the photo, E7). "Make a whole scene" replaces the second in
    slice 5.
14. **The first run in this slice** (the Owner: "Paint ground, press Save"; the spec's is "Add a tree", which needs
    slice 2): the tip **"Paint some ground"** by the paint strip; once a stroke lands, **"Press Save"** (or "Press
    Export" for a visitor) by the cluster; then the stamp. Slice 2 replaces it with the spec's.
15. **A scene's size is not changed in the builder in this slice** (the Owner: "Agents only for now"). The spec
    names no control for it. Until a slice
    does (the outline puts it in slice 5), a converted scene has its level's size, a flat one is 32 by 18, and an
    agent changes `size`.
16. **While a finger drags,** the tiles under it show at once as the material's swatch (page elements over the
    stage), and the painter runs at most once a frame with the newest scene, so the real edges and corners follow as
    the finger moves and a slow device never queues work. The new picture goes onto the screen by the framework's
    `LevelPicture.showScene(content, art)` (E6), never by remaking the picture.
17. **A waiting change that touches a scene** shows the scene's ground before and after, from the painted pictures
    on each side, in the place a level's before and after are shown.

## Review Focus

Inputs the spec implies and a person will meet. Each has its test in the task named.

1. **A game with no scene and no level without one** (every level already moved, then every scene's file removed by
   an agent), or with no level at all: the empty state shows only "Start with flat ground", never an empty list.
   Task 9 (`scenes-home.browser.test.ts`, "no level to start from").
2. **A scene whose picture in the game is old or missing** (an agent changed the file and did not run `automata
   art`): the builder paints it afresh and shows it; no notice about pictures; the next Save puts it right. Task 5
   (`paint.browser.test.ts`, "an old picture in the game is not what is shown").
3. **A photo that cannot be fetched** (offline, or a game's own photo missing): the scene shows with that material
   as its plain middle color, one notice names the material, and Save is refused with the same words, since the
   picture would be wrong. Task 5 ("a photo that will not load") and Task 10.
4. **Two people save the same scene:** the second Save is told the scene changed, exactly as a level's is, and
   nothing of theirs is written, not the picture either. Task 2 (`save-files.test.ts`, "the file moved") and Task 3.
5. **A big scene on a phone** (256 by 64 tiles at 8 pixels): painting stays under the finger (ruling 16), pinch
   reaches every tile, and the strip's materials stay 56 px. Task 7 (`paint.journey.test.ts`, the `big-scene` case).

---

## File structure

Layers, lowest first: `words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`,
`levels`, **`scenes`**, `find`, `suite`. Task 1 adds `scenes` to `LAYERS` and `PAGE_SIDE` in
`tests/architecture/rules.ts`.

```
src/features/scenes/
  scenes.ts            the feature's entry                                         Task 4 on
  edit.ts              every change a scene's ground and materials can take         Task 4, 8
  slope.ts             a drag as a slope line; the ground it stands on              Task 4
  history.ts           undo and redo of whole scenes (or `src/lib/history.ts`,     Task 4
                       shared with the figure builder, whichever lands first, M2)
  photos.ts            the photos a scene needs, fetched and decoded                Task 5
  paint.ts             the scene painted in the page; the level made in memory      Task 5
  swatch.ts            a material as a small picture                                Task 5
  SceneStage.svelte    the stage with a scene on it, the tile grid's hit layer      Task 5, 7
  Scenes.svelte        the editor: tools, stage, strip, panel, undo, block          Task 6 to 8
  PaintStrip.svelte    materials and shapes                                         Task 7
  MaterialsPanel.svelte, MaterialCard.svelte, AddMaterial.svelte                    Task 8
  start.ts             a scene from a level, a flat scene, the next free id         Task 9
  SceneThumb.svelte    a scene's picture on a card                                  Task 9
src/features/suite/
  SceneScreen.svelte   the frame around Scenes: pill, cluster, save, export, tips   Task 6, 10, 11
  ScenesHome.svelte    the empty state                                              Task 9
  route.ts, App.svelte, Switcher.svelte, GameHome.svelte, WaitingChange.svelte, guide.ts
src/features/game/save.ts            saveScene (the page's side)                    Task 10
src/features/api/api.ts              saveScene                                      Task 3
src/features/wire/wire.ts            SceneSaveAsk, SceneSaveAnswer                  Task 3
src/features/service/save-scene.ts   the API's side                                 Task 3
src/features/github/repo.ts          saveFiles                                      Task 2
scripts/copy-photos.ts, vite.config.ts   /photos/ in the built site                 Task 1
tests/fixtures/game/                 gains the scene `meadow` and the level `meadow-walk`   Task 1
```

Test hooks added: `[data-tool="paint"]`; `[data-part="strip"]`, `[data-part="materials"]`,
`[data-handle="strip|materials"]`; `[data-material="<id>"]` with `aria-pressed`; `[data-brush="solid|slope|ledge|back"]`
with `aria-pressed`; `[data-tile]` with `data-x`, `data-y` on the keyboard's tile cursor; `[data-ghost]` on a slope's
ghost; `[data-ground]` on the stage with `data-rows` (the ground's rows joined by `/`, so a journey reads what was
painted without reading pixels); `[data-photo="<id>"]` in Add a material; `[data-scene="<id>"]` on a scene's card.

---

## Part A: the pin and the plumbing (pull request 1)

### Task 1: The pin, a test game with a scene, and the photos served

**Files:**
- Modify: `package.json` (the pin, both places), `pnpm-lock.yaml`, `vite.config.ts`, `tests/architecture/rules.ts`
- Create: `scripts/copy-photos.ts`, `src/features/scenes/scenes.ts` (empty entry with its comment)
- Create: `tests/fixtures/game/content/scenes/meadow.json`, `tests/fixtures/game/content/levels/meadow-walk.json`;
  modify the fixture's `automata.toml` and `tests/fixtures/game/pictures.ts` (E5: no picture is committed; `artFiles`
  is handed the photos, read from the pinned package's `photos/` in Node and fetched from `/photos/` in a browser)
- Test: `tests/pin.test.ts` (or where the redesign's Task 1 put the pin's test), `tests/fixtures/game.test.ts`,
  `tests/workflows/photos.test.ts`, `tests/architecture/rules.test.ts`

**Interfaces:**
- Consumes: the framework's `tests/fixtures/scene-game/` (its `meadow` scene's JSON, copied byte for byte; its
  pictures are painted at test time like every picture of the test game, E5).
- Produces: `/photos/<file>` in `dist/` and on the dev and journey servers; the fixture game's `meadow` (every shape,
  all three kinds of material) used by `meadow-walk` (one crate on the slope's top, one start); `plain-game` keeps no
  scene.

`copyPhotos()` is a Vite plugin in `scripts/copy-photos.ts`: at build it copies every `.png` of
`import.meta.resolve('@automataframework/framework/photos/brick.png')`'s folder to `dist/photos/`; in the dev and
journey servers it serves the same folder at `/photos/`.

- [ ] **Step 1: Failing tests.** The pin is a 40-character commit, the same in `dependencies` and
      `onlyBuiltDependencies`; the fixture game loads with `loadGame` and `artProblems(content, read, photos)` is
      empty for it; `photos.test.ts` reads `vite.config.ts` for the plugin and, in the built-site check the redesign
      already has, `dist/photos/` holds one file for every `PHOTO_LIBRARY` record; `LAYERS` has `scenes` after
      `levels`.
- [ ] **Step 2:** Push; red. **Step 3:** Move the pin (the lockfile's checksum for a git pin is the one thing that
      cannot be hand-written: do it as the redesign's Task 1 did and say so in the pull request), copy the fixture,
      write the plugin. **Step 4:** Push; green, every existing journey still green (no existing level changed).
- [ ] **Step 5:** Commit `chore: pin the framework with scenes, and serve its photos`. Report `Task 1`.

### Task 2: Several files of a game in one change (only if `saveChange` is not on `main`, E2)

If the figure builder's (or Feel's) `saveChange` has landed, this task is only E4's `readBytes` fallback below and
Task 3 adds to `saveChange`. If not, this task builds the several-file commit in that plan's shape, and its stale
answer is `changed-elsewhere`, the problem `saveFile` gives.

**Files:**
- Modify: `src/features/github/repo.ts`, `src/features/github/github.ts`, `tests/fixtures/fake-github/server.ts`
- Test: `tests/features/github/save-files.test.ts`

**Interfaces:**
- Produces, on `Repo`:

```ts
export interface FileToSave {
  readonly path: string
  /** Exactly one of the two. */
  readonly text?: string
  readonly base64?: string
  /** The version this file must still have on the branch; `null`: it must not exist; left out: not checked. */
  readonly version?: string | null
}
/** Every file in one commit on `branch`, or none. `changed-elsewhere` (the problem `saveFile` gives for an old version) when a
 *  checked file's version differs. Tries again, at most three times, when only the branch's head moved. */
saveFiles(ask: { branch: string; files: readonly FileToSave[]; message: string; author: { name: string; email: string } }):
  Promise<Answer<{ commit: string; versions: Readonly<Record<string, string>> }>>
```

By GitHub's git data calls, as the App: read the head and its tree; check each `version` against the tree's blob
sha; `POST git/blobs` a file; `POST git/trees` with `base_tree`; `POST git/commits`; `PATCH git/refs/heads/<branch>`
with `force: false`. A refused `PATCH` (the head moved) starts again from the new head. The pretend GitHub gains those
five routes over the store it has.

- [ ] **Step 1: Failing tests,** against the pretend GitHub: three files land in one commit whose author is the one
      given; a wrong `version` writes nothing and answers the stale problem ("the file moved"); `version: null` on a
      path that exists writes nothing; a head moved by another file's commit between the read and the `PATCH` still
      saves, on top of it; a head moved three times answers the problem `saveFile` gives when GitHub is busy; a
      picture's bytes read back with `readBytes` are the bytes sent, and so are a 1.5 MB picture's (E4: when the
      contents call answers `encoding: "none"`, `readBytes` reads `git/blobs/<sha>`, a route the pretend GitHub
      gains).
- [ ] **Steps 2 to 4:** red, implement, green. **Step 5:** Commit `feat(github): save several files in one change`.
      Report `Task 2`.

### Task 3: Saving a scene, on the API (in `saveChange`, E2)

The route below is how the work was first planned. As fixed by the audit, nothing new is routed: `saveChange`'s
`ChangeAsk` carries the scene (`content`, type `scene`), its picture and atlas (`picture`, `atlas`), the level, and a
`list` entry for a new scene; this task adds to `saveChange`'s checks exactly the steps 2 to 4 below that it lacks
(the picture beside a `scene`, by `sceneSheet` and ruling 8's palette check; the atlas by `atlasText`; a level in the
change naming this scene). `SceneSaveAsk`, `SceneSaveAnswer` and `save-scene.ts` are not made; the page's
`saveScene` (Task 10) calls `saveChange`. The tests below stay, against `saveChange`.

**Files:**
- Create: `src/features/service/save-scene.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/service/service.ts` (the route `POST /api/save-scene`),
  `src/features/service/save.ts` (only to share steps 4 and 6, "where it goes" and "the suggestion", as
  `whereItGoes` and `suggestionOf` in `src/features/service/pulls.ts`), `src/features/api/api.ts`
- Test: `tests/features/service/save-scene.test.ts`, `tests/features/api/api.test.ts`

**Interfaces:**
- Consumes: `saveFiles` (Task 2); the framework's `writeContent`, `parseProject`, `listContent`, `sceneSheet`,
  `paintedPath`, `loadGame` (through `wholeGameLoads`).
- Produces:

```ts
// wire.ts
export interface SceneSaveAsk {
  readonly game: GameRef
  /** The scene's content file. */
  readonly path: string
  readonly value: unknown
  /** The version of the scene's file the person opened; `null` for a scene the game does not have yet. */
  readonly version: string | null
  /** The ground's picture as the page painted it: a PNG as base64. */
  readonly picture: string
  /** A level changed with it (a scene started from a level): its file, its value, the version opened. */
  readonly level?: { readonly path: string; readonly value: unknown; readonly version: string }
  readonly message: string
}
export interface SceneSaveAnswer extends SaveAnswer {
  /** The level's new version, when one was saved. */
  readonly levelVersion: string | undefined
}
// api.ts, on Api
saveScene(ask: SceneSaveAsk): Promise<Answer<SceneSaveAnswer>>
// save-scene.ts
export function saveScene(deps: ApiDeps, request: Request): Promise<Answer<SceneSaveAnswer>>
```

What the API does, in order, trusting nothing the page says:

1. Enter as `saveLevel` does (signed in, may save or suggest).
2. Read `automata.toml` from the default branch. With a `version`, `path` must be a scene the game lists. With
   `null`, `path` must be `<folder>/<id>.json` where `<folder>` is the folder of the game's first listed scene, or
   `content/scenes`, and must not be listed; the project's new text is `listContent(text, { type: 'scene', path })`.
3. `writeContent('scene', value)`; its `id` is the file's name; the same for `level` with `writeContent('level', …)`,
   whose path must be a listed level and whose `scene` must be this scene's id.
4. The picture (ruling 8, E3): the eight bytes of a PNG's signature; its width and height (bytes 16 to 23) equal the
   size of `sceneSheet(scene)`; 8 bits, palette colour; `PLTE` is the scene's paints in order after the clear entry;
   no chunk but `IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`; `decodePng` reads it whole; the change within 6 MB. Else
   `broken` with "The picture sent with this scene is not the scene's picture. Try Save again."
5. `wholeGameLoads` with the scene, the level and the project's text in place.
6. Where it goes (`whereItGoes`, the level save's own rule), then `saveFiles`: the scene's JSON (checked against
   `version`), the picture at `paintedPath`, the atlas (`writeAtlas(sceneSheet(scene))`, or the name the framework
   gives its atlas writer; it is `atlasText(sceneSheet(scene), '<id>.png')`, M4), the level (checked against its version) and `automata.toml` (checked against the version
   read in step 2) when they are part of it. Then the suggestion, as a level's.

- [ ] **Step 1: Failing tests,** against the pretend GitHub with the fixture game: an Edit-level save of `meadow`
      with one tile changed is one commit of three files and the picture's bytes are the ones sent; a Suggest-level
      save is a waiting change holding the same three; a new scene with a level is one commit of five files, the
      project file's earlier bytes unchanged and the game loads; each refusal writes nothing: signed out, Look
      level, a path that is not a scene, an id that is not the file's name, a value the schema refuses (the
      framework's sentences come back), a picture that is a JPEG, one of the wrong size, one whose `PLTE` is not the
      scene's paints, one with an extra chunk, one cut short, a change over 6 MB, a level that
      names another scene, a stale scene version, a stale level version, a scene that breaks the whole game (a level
      thing now inside solid ground is allowed; a level naming a removed scene is not).
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(service): save a scene with its picture`. Open Part A's pull
      request when green; report Tasks 1 to 3; message the merge session.

---

## Part B: the scene on screen (pull request 2)

### Task 4: Every change a scene can take

**Files:**
- Create: `src/features/scenes/edit.ts`, `slope.ts`, `history.ts`
- Test: `tests/features/scenes/edit.test.ts`, `slope.test.ts`, `history.test.ts`

**Interfaces:**
- Consumes: the framework's `SceneFile`, `GroundShape`, `GROUND_SHAPES`, `slopeRuns`, `gapsUnder`, `SceneSchema`.
- Produces (every function returns a new scene and never changes the one given):

```ts
// edit.ts
export type Brush = 'solid' | 'ledge' | 'back'
export interface Tile { readonly x: number; readonly y: number }
/** The letter for a material in a shape: the scene's first that matches, else a new one (ruling 4). `full` when none is free. */
export function letterFor(scene: SceneFile, material: string, shape: GroundShape): { scene: SceneFile; letter: string } | 'full'
/** Those tiles painted. Tiles outside the scene are skipped. */
export function paintTiles(scene: SceneFile, tiles: readonly Tile[], material: string, brush: Brush): SceneFile | 'full'
export function eraseTiles(scene: SceneFile, tiles: readonly Tile[]): SceneFile
/** Ground of the slope's own material put under every slope that has air under it (the framework's `gapsUnder`). */
export function fillUnder(scene: SceneFile): SceneFile | 'full'
/** The framework's own sentences for this scene, and the tiles they name; empty when it is good. */
export function problemsOf(scene: SceneFile): readonly { sentence: string; tile: Tile | undefined }[]
// slope.ts
export interface SlopeLine { readonly from: Tile; readonly to: Tile; readonly gentle: boolean; readonly up: boolean
  /** Each slope tile with its shape, left to right, then the solid tiles under them. */
  readonly slope: readonly (Tile & { readonly shape: GroundShape })[]; readonly under: readonly Tile[] }
/** A drag from one tile to another as the nearest slope the file can hold (ruling 2). `to` is snapped onto the line. */
export function slopeLine(scene: SceneFile, from: Tile, to: Tile): SlopeLine
export function paintSlope(scene: SceneFile, line: SlopeLine, material: string): SceneFile | 'full'
// history.ts
export interface History<T> { readonly now: T; readonly canUndo: boolean; readonly canRedo: boolean }
export function historyOf<T>(first: T): History<T>
export function did<T>(history: History<T>, next: T): History<T>   // drops what could be redone; keeps 100 steps
export function undo<T>(history: History<T>): History<T>
export function redo<T>(history: History<T>): History<T>
```

`slopeLine`: with `dx = to.x - from.x` and `dy = to.y - from.y` (y down), the slope goes left to right from the
lefter end; it is `up` when the right end is higher; it is gentle when `|dx| >= 1.5 * |dy|` and steep otherwise; its
length in tiles is `max(1, |dx| + 1)` for steep (one tile a step) and the next even number for gentle (a low and a
high tile a step); a gentle up slope's tiles are `half-up-low` then `half-up-high`, a gentle down slope's
`half-down-high` then `half-down-low`; it stops at the scene's edge. `under` is every tile below a slope tile down to
the row of the slope's lowest tile, the lowest tile's own column left out.

- [ ] **Step 1: Failing tests.** `edit.test.ts`: painting `earth` solid on the fixture reuses its letter `G` and the
      file's `letters` do not change; a material never used in that shape adds `A`, then `B`; with 62 letters taken,
      `'full'`; erasing gives `.`; a painted then erased scene keeps its new letter; tiles outside are skipped;
      `problemsOf` of the fixture is empty and, after erasing under its slope, has the framework's sentence and that
      tile; `fillUnder` then empties it; every result passes `SceneSchema` and `writeContent('scene', …)`.
      `slope.test.ts`: (2, 10) to (5, 7) is steep, up, four tiles, six tiles under; (5, 7) to (2, 10) is the same
      line; (2, 10) to (9, 7) is gentle, up, eight tiles; (2, 7) to (5, 10) is steep, down; a tap is one `slope-up`
      tile with none under; a line off the right edge stops at it; `paintSlope` then `problemsOf` is empty for each.
      `history.test.ts`: undo and redo walk both ways; `did` after `undo` drops the redo; the 101st step drops the
      first.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): every change a scene's ground can take`. Report `Task 4`.

### Task 5: The scene painted in the page

**Files:**
- Create: `src/features/scenes/photos.ts`, `paint.ts`, `swatch.ts`, `SceneStage.svelte`
- Test: `tests/features/scenes/photos.test.ts`, `paint.browser.test.ts`, `swatch.browser.test.ts`

**Interfaces:**
- Consumes: the framework's `artFiles`, `photosUsed`, `PHOTO_LIBRARY`, `decodePng`, `materialTile`, `Photos`,
  `MissingPhotoError`, `paintedPath`, `createLevelPicture`, `LevelPicture.showScene` (E6), `loadArt`;
  `game/pictures.ts`'s `readPictureFor`;
  `levels/Stage.svelte`.
- Produces:

```ts
// photos.ts: one fetch a photo, kept in memory; a photo that will not load is left out and named in `missing`
export function photosFor(game: OpenGame, api: Api, ids: readonly string[]): Promise<{ photos: Photos; missing: readonly string[] }>
// paint.ts
/** The smallest level the schema takes that names this scene. Never written (ruling 11). */
export function levelOf(sceneId: string): Level
/** The game's content with this scene in place of the one it has (or added). */
export function contentWith(content: GameContent, scene: SceneFile): GameContent
/** The scene's painted files, as `automata art` writes them. A material whose photo is missing is painted flat in
 *  its ladder's middle paint, and `whole` is false: such a picture must never be saved. */
export function paintNow(content: GameContent, sceneId: string, photos: Photos, missing: readonly string[]):
  { files: readonly ArtFile[]; whole: boolean }
/** The framework's `Art` for a level, the scene's pictures taken from `files` and every other from the game. */
export function artOf(content: GameContent, level: Level, files: readonly ArtFile[], read: ReadPicture): Promise<Art>
// swatch.ts: 0xrrggbb pixels, `side` by `side`, of a material at the scene's tile size (photo, tiles or flat)
export function swatchOf(scene: SceneFile, materialId: string, photos: Photos, tileset: RgbaPicture | undefined, side: number): Uint32Array
```

`SceneStage.svelte` wraps the redesign's `Stage` (its pinch, its room, its `[data-scale]`): props `content`, `scene`,
`level` (the level whose things show faded, or none), `photos`; it paints at most once a frame with the newest scene
(ruling 16), swaps the stage's art when the painting is done, and sets `[data-ground]`'s `data-rows`.

- [ ] **Step 1: Failing tests.** `photos.test.ts` (a pretend fetch): a library id is fetched from `/photos/<file>`
      once however often asked; a game's own photo goes through `api.picture`; a 404 is in `missing`.
      `paint.browser.test.ts` (three engines, the fixture game): `paintNow`'s files equal, byte for byte, the
      fixture's `meadow.png` and `meadow.atlas.json` as `fixturePictures()` paints them (E5); after `paintTiles` they differ and the atlas does
      not; with `dirt` missing, `whole` is false and nothing throws; mounted in `SceneStage`, the canvas pixel in the
      middle of a painted tile is one of the material's paints; "an old picture in the game is not what is shown"
      (the pretend API serves a blank `meadow.png`; the canvas still shows ground); `data-rows` equals the scene's
      rows. `swatch.browser.test.ts`: a flat material's swatch is one color; a photo material's has more than one
      and only the ladder's; a tileset material's equals the tileset picture's square.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): a scene painted and drawn in the page`. Report `Task 5`.

### Task 6: The Scenes screen on the frame

**Files:**
- Create: `src/features/scenes/Scenes.svelte`, `src/features/suite/SceneScreen.svelte`
- Modify: `src/features/suite/route.ts`, `App.svelte`, `Switcher.svelte`, `src/features/ui/panels.ts`,
  `src/features/ui/icons.ts` (`paint: paint-brush`, `scenes: mountains`, `materials: swatches`),
  `src/features/words/table.ts`, `en.ts`, `tests/fixtures/scenes.ts`
- Test: `tests/features/suite/route.test.ts`, `tests/features/scenes/scenes.browser.test.ts`,
  `tests/journeys/open-scene.journey.test.ts`

**Interfaces:**
- Produces: the route `#/<owner>/<game>/scenes/<id>` (and `?level=<id>`, the level it was opened from), parsed and
  written by `route.ts` as `{ screen: 'scene', game, scene, level? }`; `PanelName` gains `'strip' | 'materials'`;
  `Scenes.svelte` props `{ game, content, sceneId, levelId?, onChange(scene) }` holding the `History<SceneFile>`.

The screen is the level screen's frame with these differences and no others: the pill says World and the scene's
name; the switcher lists **Levels, Tiles, Scenes** (Tiles opens the redesign's "Coming soon" card; Scenes opens the
game's first scene, or the empty state of Task 9); the tools are those of ruling 1; the title block's cells are game
| scene, editor | saved, and under the scene's name one line, "Used by Level 1 and Level 2" (`usedBy`, the levels
whose `scene` is this id, by `nameOf`) or "No level uses this scene yet"; undo and redo act on the scene's history
(Ctrl or ⌘ with Z, and with Shift). The drawing notes switch is shown; its notes come in Task 7.

- [ ] **Step 1: Failing tests.** `route.test.ts`: both forms round-trip; an unknown scene id is the redesign's
      "nothing here" screen. `scenes.browser.test.ts`: at each of the five sizes the frame's shape is right, the
      tools are Paint and Erase only, no two `[data-part]`s overlap, and the scene's box is inside the room.
      `open-scene.journey.test.ts`: from the fixture game's level screen, the switcher's Scenes opens `meadow`; the
      title block says "Used by Meadow walk"; pinch changes `[data-scale]` and a one-finger drag with no tool's
      work does not; Back returns to the level; a visitor on the demo game reaches the same screen.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): the Scenes screen`. Report `Task 6`.

### Task 7: Paint and Erase

**Files:**
- Create: `src/features/scenes/PaintStrip.svelte`
- Modify: `src/features/scenes/Scenes.svelte`, `SceneStage.svelte`, `src/features/levels/notes.ts` and
  `Notes.svelte` (one new note kind, `rise`), `src/features/words/table.ts`, `en.ts`
- Test: `tests/features/scenes/strip.browser.test.ts`, `tests/journeys/paint.journey.test.ts`

**Interfaces:**
- Consumes: Task 4's functions, Task 5's `swatchOf`, the redesign's `Tool`, `Panel`, `Notice`, `Notes`.

The strip (`[data-part="strip"]`) shows while Paint is the tool: beside the tools on `wide`, above them on `mid` and
`narrow`, scrolling sideways when the materials do not fit, closable (it leaves `[data-handle="strip"]`). First the
four shapes, each an icon with its word (Solid, Slope, Ledge, Back wall); then every material as a 56 px swatch with
its name under it; last a **+** that opens Add a material (Task 8). The first material and Solid are chosen on
arrival. With Slope chosen, a `tiles` material is shown faded and pressing it says "Tiles cannot be a slope. Pick
another material." (it is still a button that does something).

On the stage, with Paint: a finger down on a tile paints it and each tile it passes over (Solid, Ledge, Back wall),
as one undo step a stroke; with Slope, ruling 2, the ghost (`[data-ghost]`) drawn as page elements from `slopeLine`.
With Erase: `eraseTiles` over the tiles passed, one step a stroke. Two fingers never paint. **Without dragging:** the
stage holds a tile cursor (`[data-tile]`, focusable, shown when it has focus or after "Paint with buttons" in the
strip's menu); arrow keys move it, Space or Enter paints or erases its tile, and for a slope the first press sets
the start and the second the end, with the ghost between; the same four arrows and a Paint button show on screen as
a small pad after "Paint with buttons".

The notes, when the notes switch is on: a slope run (the framework's `slopeRuns`) under the last painted or touched
tile carries its rise as a note, "UP 3" or "DOWN 3" with a measure line and end ticks, and the chip of the tile's
material and shape in words. `problemsOf` shows as one notice with the first sentence, the tile ringed, and **Fill
it** when `fillUnder` would help (ruling 3).

- [ ] **Step 1: Failing tests.** `strip.browser.test.ts`: every material and shape button is at least 56 px at the
      five sizes; German and Russian words are not cut; closing the strip leaves the handle and does not change
      `[data-scale]` or the scene's box. `paint.journey.test.ts` (Chromium, WebKit and Firefox; touch on the phone
      and iPad sizes, mouse on desktop), each ending by reading `data-rows`: drag Solid over five tiles; drag a
      slope from (2, 10) to (5, 7) and find the four slope letters and the six under them; a gentle slope; Ledge;
      Back wall; Erase three tiles; erase under the slope, read the notice, press Fill it, and it is gone; undo and
      redo of each; the whole of it again by keyboard only, and by the on-screen pad on the phone; a two-finger
      pinch in the middle of a stroke paints nothing more; the notes switch on shows `[data-note="rise"]` with "UP
      3"; the `big-scene` case (256 by 64 at 8 pixels, made in the test) paints a 20-tile stroke on the phone and
      the rows are right; a tileset material with Slope says its sentence.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): paint and erase ground`. Report `Task 7`.

### Task 8: The Materials panel

**Files:**
- Create: `src/features/scenes/MaterialsPanel.svelte`, `MaterialCard.svelte`, `AddMaterial.svelte`
- Modify: `src/features/scenes/edit.ts`, `Scenes.svelte`, `src/features/suite/SceneScreen.svelte` (the panel's button
  under the cluster; in the pill's menu when upright), `src/features/words/table.ts`, `en.ts`
- Test: `tests/features/scenes/materials.test.ts`, `materials.browser.test.ts`,
  `tests/journeys/materials.journey.test.ts`

**Interfaces:**
- Produces, in `edit.ts`:

```ts
/** A free id from a wanted one: `dirt`, then `dirt-2`. */
export function freeId(taken: readonly string[], wanted: string): string
/** Ruling 5. `colors` are the three the caller measured from the photo, dark to light, as `#rrggbb`. */
export function addPhotoMaterial(scene: SceneFile, photo: string, colors: readonly [string, string, string]): { scene: SceneFile; id: string }
export function addTilesMaterial(scene: SceneFile, tileset: string, tile: string): { scene: SceneFile; id: string }
export function addFlatMaterial(scene: SceneFile, color: string): { scene: SceneFile; id: string }
export function setScale(scene: SceneFile, material: string, scale: number): SceneFile     // kept in 0.25 to 8
export function setWear(scene: SceneFile, material: string, wear: number): SceneFile       // kept in 0 to 1, one decimal
export function setPaint(scene: SceneFile, paint: string, color: string): SceneFile
/** `in-use` when a ground letter names it (ruling 7); `last` when it is the scene's only material. */
export function removeMaterial(scene: SceneFile, material: string): SceneFile | 'in-use' | 'last'
/** The three colors of ruling 5 from a photo's pixels. */
export function photoColors(photo: PhotoPixels): readonly [string, string, string]
```

The panel (`[data-part="materials"]`): a floating panel on the right on `wide`, a bottom sheet on `mid` and
`narrow`, closed on arrival, opened by its button, closable. It lists the scene's materials, each a swatch, its name
(`nameOf(id)`) and what it is made from ("Photo: Dirt", "Tiles: Stone", "Plain color"). Pressing one opens its card in
the panel: How big and How worn with − and + and the number between (photo materials only), its colors (ruling 6),
"Paint with this" (chooses it in the strip and the Paint tool) and Remove. **Add a material** opens a sheet with
three parts: **Photos** (every library photo and the game's own as a 96 px picture with its name and, under it, its
credit and licence from its record), **This game's tiles** (each tileset's tile kinds; left out when the game has no
tileset) and **A plain color** (the device's color chooser). Choosing one adds it, closes the sheet and opens its
card. Every change is one undo step and repaints the scene.

- [ ] **Step 1: Failing tests.** `materials.test.ts`: each function's result passes `writeContent('scene', …)`; a
      second `dirt` is `dirt-2` with its own three paints; `setScale` stops at 0.25 and 8; `setWear(…, 0.30000001)`
      writes `0.3`; `removeMaterial` of a painted one is `'in-use'`; `photoColors` of a half black, half white photo
      is `#000000`, a grey and `#ffffff`. `materials.browser.test.ts`: at the five sizes the panel and the sheet
      overlap no tool, every button is 44 px or more, each photo shows its credit, and closing the panel does not
      move the scene. `materials.journey.test.ts`: open the panel; add the photo `brick`; its card opens; + on How
      big twice makes `scale` 1.5 in the file (read through Export's text) and the canvas changes; − on How worn;
      change a color and see a ground pixel take it; Paint with this, paint three tiles, find its new letter in
      `data-rows`; Remove says "Paint over this ground first"; undo every step back to the scene as opened; add a
      tile of the game's tileset and a plain color; all by keyboard.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): the Materials panel`. Open Part B's pull request when
      green; publish its review pictures (the redesign plan's "Review pictures", saying they do not show the final
      look); report Tasks 4 to 8; message the merge session.

---

## Part C: ways in and out (pull request 3)

### Task 9: Scenes on the game's page, a first scene, and "Edit this scene"

**Files:**
- Create: `src/features/scenes/start.ts`, `SceneThumb.svelte`, `src/features/suite/ScenesHome.svelte`
- Modify: `src/features/suite/GameHome.svelte`, `LevelScreen.svelte`, `App.svelte`,
  `src/features/find/commands.ts`, `docs/commands.md`, `src/features/words/table.ts`, `en.ts`
- Test: `tests/features/scenes/start.test.ts`, `scenes-home.browser.test.ts`,
  `tests/journeys/first-scene.journey.test.ts`, `tests/journeys/edit-this-scene.journey.test.ts`

**Interfaces:**
- Consumes: the framework's `sceneFromLevel`, `listContent`.
- Produces:

```ts
// start.ts
/** The id a scene made from this level takes (ruling 12), free in this game. */
export function sceneIdFor(content: GameContent, levelId: string): string
/** The first free `scene-<n>`. */
export function nextSceneId(content: GameContent): string
/** Ruling 13's flat scene; `colors` are `photoColors` of the library's `dirt` (E7). */
export function flatScene(id: string, colors: readonly [string, string, string]): SceneFile
/** The levels that have no scene, in the project's order. */
export function levelsToStartFrom(content: GameContent): readonly string[]
```

- **The game's page** shows scenes as picture cards beside levels, under the word Scenes: each
  (`[data-scene]`) the scene's ground painted small (the redesign's shared hidden picture, ruling 11 there), its name
  and "Used by …". With no scene, one card, "Make this game's first scene", that opens the empty state.
- **The empty state** (`ScenesHome`, one calm panel on the frame): "This game has no scenes yet." and the buttons of
  ruling 13. Start from a level opens the new scene with that level's things faded; the scene and the changed level
  are an unsaved draft until Save (Task 10). Nothing is written by pressing it.
- **From a level:** a level that names a scene has **Edit this scene** in its title block's menu and in the find
  bar; it opens the scene with the level's things and start points drawn faded (40%) and not touchable, and the pill
  gains **Back to Level 1**. A level with no scene has **Give this level a scene** there, which is Start from this
  level. The level editor itself needs no change to open a level with a scene: the framework draws it.
- **Find:** `open-scene` ("Open the Meadow scene", one a scene), `edit-this-scene`, `start-scene-from-level`,
  `paint`, `erase`, `open-materials`, `add-material`, each one entry in the command list with its words and its
  line in `docs/commands.md`.

- [ ] **Step 1: Failing tests.** `start.test.ts`: `level-1` gives `scene-1`, and `scene-1-2` when taken; `flatScene`
      passes `writeContent` and its bottom three rows are solid; `levelsToStartFrom` leaves out `meadow-walk`.
      `scenes-home.browser.test.ts`: the five sizes; "no level to start from" shows only Start with flat ground; a
      game with three bare levels shows three buttons and only the first is the main one.
      `first-scene.journey.test.ts` (`plain-game`): the game's page, the first-scene card, Start from Level 1; the
      scene shows the level's ground and its crate faded; the level screen for Level 1, opened again from the
      draft, plays to the same picture as before (the canvas at the crate and at a ground tile is unchanged);
      Start with flat ground gives `scene-1` with three rows of ground. `edit-this-scene.journey.test.ts` (the
      fixture game): Meadow walk, Edit this scene, paint a tile, Back to Meadow walk shows the new ground under the
      level's things; the same by the find bar; a crate cannot be dragged on the scene's screen.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): scenes on the game's page, and a first scene`. Report
      `Task 9`.

### Task 10: Save, Export, the draft and the waiting change

**Files:**
- Modify: `src/features/game/save.ts`, `game/draft.ts`, `src/features/suite/SceneScreen.svelte`, `Leave.svelte`
  (only if it names levels), `WaitingChange.svelte`, `src/features/service/waiting.ts` (a scene's file and its
  picture's path in a `FileChange`), `src/features/service/approve.ts`; create `src/features/service/changed.ts`
  (E1: `allowedPaths`, used by both `waiting.ts`'s `here` and `approve.ts`'s step 2: a listed content file; a picture
  or atlas beside a painted file listed on the default branch or in the change's own `automata.toml`; or
  `automata.toml` when its text is the default branch's with only `listContent` blocks added; never
  `automata.access.toml`; step 4 lays over only `.json` files and `automata.toml`. Built once, by whichever editor
  cycle builds the multi-file save first), `src/features/words/table.ts`, `en.ts`
- Test: `tests/features/game/save-scene.test.ts`, `tests/features/service/waiting.test.ts`,
  `tests/features/service/changed.test.ts` (a scene suggestion with its picture and atlas, and a first scene with its
  block, are allowed; one more changed line of `automata.toml`, or the sharing file, is not),
  `tests/journeys/save-scene.journey.test.ts`, `tests/journeys/agent-and-person.journey.test.ts`

**Interfaces:**
- Consumes: `api.saveScene` (Task 3), `paintNow` (Task 5), the redesign's Save, Export, stamp, sign-in panel and
  leave rules.
- Produces:

```ts
// game/save.ts
/** Paints, sends, and on success puts the new versions into the open game. Refuses, sending nothing, when the
 *  painting is not whole (a photo is missing) or `problemsOf` is not empty; the answer says which. */
export function saveScene(api: Api, game: OpenGame, scene: SceneFile, level: Level | undefined, photos: Photos,
  missing: readonly string[], message: string): Promise<Answer<SceneSaveAnswer> | { ok: false; problem: 'not-whole' | 'has-problems' }>
```

Save and Export behave as on the level screen in every way not said here. The message offered is "Change the Meadow
scene" (or "Make the Scene 1 scene from Level 1"). Export copies the scene's file as `writeContent` writes it, under
the line for the agent the redesign's Export uses, naming the file's path and `automata art`; when the scene was
started from a level, the level's file follows under its own path. The draft (`af.draft:…`) holds the scene's text
and, when there is one, the level's; a picture is never kept on the device. A waiting change: ruling 17.

- [ ] **Step 1: Failing tests.** `save-scene.test.ts`: `'not-whole'` and `'has-problems'` send nothing.
      `save-scene.journey.test.ts` (the pretend GitHub): as Edit, paint a tile and Save: one change of three files;
      the picture in the pretend GitHub equals, byte for byte, what the framework's `artFiles` gives in Node for the
      saved scene file (the test runs it), and `artProblems` for the saved game is empty; as Suggest, the same is a
      waiting change, its screen shows the ground before and after, and Approve by an Approve-level person puts it
      in; a first scene from Level 1 saves five files and the game loads; a second person's stale Save is told the
      scene changed and the pretend GitHub's picture is the first person's; a visitor's Save opens the sign-in
      panel and Export gives the file; with `/photos/dirt.png` refused, Save says the material's photo could not be
      loaded and writes nothing; leaving with an unsaved scene asks as a level does, and the draft is there on
      return. `agent-and-person.journey.test.ts`: the fixture's `meadow`, as an agent wrote it, opened and saved
      with nothing changed: the Save button says there is nothing to save and no request is sent; with one tile
      painted and painted back by undo, the same; a tile painted in the builder and the same tile changed in the
      file's rows by the test give the same file text and the same picture bytes.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): save and export a scene`. Report `Task 10`.

### Task 11: The first run

**Files:**
- Modify: `src/features/suite/guide.ts`, `SceneScreen.svelte`, `src/features/words/table.ts`, `en.ts`
- Test: `tests/features/suite/guide.test.ts`, `tests/journeys/first-run-scenes.journey.test.ts`

**Interfaces:**
- Consumes: the redesign's `tipStep`, `tipFor`, `Tip.svelte`, the stamp.
- Produces: `guide.ts` gains the run `scenes` with the steps `paint` (by `[data-part="strip"]`, or by the Paint tool
  when another tool is chosen) and `keep` (by Save, or Export for a visitor), counted in `af.tip.scenes`.

Ruling 14. Nothing is blocked while a tip shows; a tip leaves when its step is done or when it is closed; a closed
run does not come back. On the empty state the first tip is by its main button instead, "Start here".

- [ ] **Step 1: Failing tests.** `guide.test.ts`: the steps in order; "a store that throws" shows the tips and
      throws nothing; an empty game's first tip is the empty state's. `first-run-scenes.journey.test.ts`, at
      `phone` and `ipadSideways`, as a visitor on the demo game: Scenes for the first time; "Paint some ground";
      one stroke; "Press Export"; Export; the stamp; under a minute of test time and four presses; a second visit
      shows no tip; the same signed in ends at Save; and a demo with no scene yet (as the real demo is until
      Examples' plan D moves it, M5): "Start here", Start from Level 1, "Paint some ground", Export, the stamp.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): the first visit to Scenes`. Open Part C's pull request when
      green, with its review pictures; report Tasks 9 to 11; message the merge session.

---

## Part D: nine languages, every screen, the docs (pull request 4)

### Task 12: Words in nine languages, the pictures, the docs and the last run

**Files:**
- Modify: the eight other tables in `src/features/words/` (Appendix A's words), `tests/fixtures/scenes.ts` (the
  screens of Appendix B), `tests/journeys/screens.journey.test.ts`, `CLAUDE.md` ("Structure": `scenes`; the layers
  line; the device's keys unchanged, said so; and the rule "An editor changes authorable content and nothing else"
  names the painted pictures and atlases beside listed files and the `[[content]]` blocks `listContent` adds, M3), `README.md` (a "Scenes" paragraph and where its files go),
  `docs/commands.md`, `docs/superpowers/progress.md`
- Test: `tests/features/words/words.test.ts` (the redesign's: complete, placeholders kept, banned words, length),
  `tests/docs/`, `tests/journeys/screens.journey.test.ts`

- [ ] **Step 1: Failing tests.** Every new key is in all nine tables; the banned list of this plan's "Words" rule
      is added to `tests/fixtures/banned.ts` for the new keys; tool and shape words are at most 9 characters in
      every language (the redesign's ruling 19); `screens.journey.test.ts` takes every screen of Appendix B at the
      five sizes in Chromium (the level-like ones in WebKit too), in `en`, `de`, `ru` and `ja`, and fails on two
      `[data-part]`s that overlap, a button under its size, or a word cut.
- [ ] **Step 2:** Push; red. **Step 3:** Write the eight tables in plain words (the redesign's ruling 9 holds: no
      native speaker has read them, and the audit back-translates every one). **Step 4:** Green.
- [ ] **Step 5:** Publish the review-pictures artifact for every Scenes screen and panel (Appendix B), five sizes
      each, with one line at the top saying plainly whether these show the final look, and report its link.
- [ ] **Step 6:** The last run: every check green. Tracker to 94% of stage 4 (Task 13 waits). Commit `feat(scenes):
      nine languages, every screen pictured, the docs`. Open Part D's pull request; report Task 12 and the summary:
      each task's commit, the test count, every deviation and its reason.

---

## Part E: Play (pull request 5; gate 4)

### Task 13: Walk the scene

**Files:**
- Modify: `src/features/scenes/Scenes.svelte`, `paint.ts`, `src/features/suite/SceneScreen.svelte`,
  `src/features/find/commands.ts`, `docs/commands.md`, the nine tables
- Test: `tests/features/scenes/play.test.ts`, `tests/journeys/play-scene.journey.test.ts`

**Interfaces:**
- Consumes: the redesign's Task 19 as built (`levels/play.ts`'s `canPlay` and `startPlay`, `Play.svelte`, the Play
  tool and Stop); the framework's `surfaceAt`.
- Produces:

```ts
// paint.ts
/** The level Play runs: the level the scene was opened from, as it is; else `levelOf` with one start standing on
 *  the ground at the scene's leftmost column that has ground with two tiles of air over it. */
export function playLevelOf(content: GameContent, scene: SceneFile, levelId: string | undefined): Level
```

Play is the level editor's Play given `contentWith(content, scene)`, `playLevelOf` and the pictures of `paintNow`:
it plays the scene on screen, unsaved changes included, with the game's hero; Stop returns to the same view with the
same tool. A game whose hero is not the built-in one gets the redesign's own notice (`playNeedsCode`). A scene with
no place to stand says "Paint some ground to stand on first."

- [ ] **Step 1: Failing tests.** `play.test.ts`: the start is on the first standable column; a scene of air has none;
      a level it was opened from is used as it is. `play-scene.journey.test.ts` (three engines; touch at `phone` and
      `ipadSideways`, keys at `desktop`): paint a slope, press Play, hold right: the hero's view rises along the
      slope; jump up through a ledge and stand on it; Stop; the painted slope is still there and still unsaved; the
      touch scheme is the game's own and a touch on Stop starts no walk.
- [ ] **Steps 2 to 4.** **Step 5:** Commit `feat(scenes): play the scene`. Review pictures for the Play states;
      tracker to 100% of stage 4; open Part E's pull request; report `Task 13`.

---

## After the build (stages 5 and 6)

As Cycle 3's: the implementation audit (Opus, medium), then the two screen audits of every Scenes screen at the five
sizes (the drunk-grandma audit and the visual audit, on Fable), then fixes, then the Owner's review with the pictures
artifact.

## Later slices (outlines; each gets its own plan, audit and build, after its framework plan has landed)

Each adds its words in nine languages, its commands in the find bar, its journeys at the five sizes in three
engines, undo and redo of each change, the agent-and-person journey for its own keys, and its review pictures.

2. **Props.** The Move and Add tools join. The Add tray (prop kinds as the framework's `PROP_KINDS`, each drawn in
   the scene's real art, and the game's figures): touch one then the scene, or drag it in. The picked prop's card:
   its kind, its numbers in plain words with − and +, Another one, Flip, In front / Behind, its place, Erase. Erase
   takes props. Notes: name chip, place as measure lines. Save sends `<id>.props.png` too (the save call takes a
   list of pictures). The first run becomes the spec's: "Add a tree", "Press Another one", the stamp. Erase then
   takes props and ground both (M1).
3. **Layers.** The Layers panel: every layer back to front with a small picture, "The ground" marked among them,
   Show/Hide, Up and Down, drag to reorder, the layer's card (kind, colors, How high, How fast it slides). Layers
   slide at their speeds while a person drags the view. The `backdrop` bridge goes.
4. **Light and sky.** The Light and sky panel: the time-of-day slider with four marks, by finger and by keys; Rain,
   Snow, Leaves and Stars as switches with How much; a lamp's card gains How bright and How far. Still under reduced
   motion.
5. **Furnish and whole scenes.** The tray's first row: Furnish (a word, then a stretch dragged on the scene) and Make
   a whole scene; the stretch's card with Furnish again; its dashed bracket note. The empty state's main button
   becomes Make a whole scene. **The scene's size** gets its control here (ruling 15), with the levels that use the
   scene saved in the same change when the top edge moves.
6. **Signs, wear and reads.** A sign's card: its words in the language on screen and which languages are missing;
   the scene's "Does every character stand out?" check as a notice that names the character.

## Appendix A: new words (English, `en.ts`)

| Key | English |
|---|---|
| `scenes` | Scenes |
| `tiles` | Tiles |
| `toolPaint`, `toolErase` | Paint, Erase |
| `shapeSolid`, `shapeSlope`, `shapeLedge`, `shapeBack` | Solid, Slope, Ledge, Back wall |
| `materials`, `material` | Materials, Material |
| `addMaterial` | Add a material |
| `photos`, `gameTiles`, `plainColor` | Photos, This game's tiles, A plain color |
| `madeFromPhoto`, `madeFromTiles` | Photo: {name}, Tiles: {name} |
| `photoBy` | {credit} · {licence} |
| `howBig`, `howWorn`, `colors` | How big, How worn, Colors |
| `paintWithThis`, `remove` | Paint with this, Remove |
| `paintOverFirst` | Paint over this ground first. |
| `lastMaterial` | A scene needs one material. Add another first. |
| `tilesNoSlope` | Tiles cannot be a slope. Pick another material. |
| `tooManyGrounds` | This scene has too many kinds of ground. Paint over one you no longer need. |
| `fillIt` | Fill it |
| `fixBeforeSave` | Fix this first, then press Save. |
| `photoNotLoaded` | The photo for {name} could not be loaded. Check your connection and open the scene again. |
| `paintWithButtons` | Paint with buttons |
| `riseUp`, `riseDown` | UP {n}, DOWN {n} |
| `usedBy`, `usedByNone` | Used by {levels}, No level uses this scene yet |
| `editThisScene`, `backToLevel` | Edit this scene, Back to {level} |
| `giveLevelScene` | Give this level a scene |
| `noScenesYet` | This game has no scenes yet. |
| `startFromLevel`, `startFlat` | Start from {level}, Start with flat ground |
| `firstSceneCard` | Make this game's first scene |
| `openScene` | Open the {name} scene |
| `tipPaint`, `tipSave`, `tipExport`, `tipStartHere` | Paint some ground, Press Save, Press Export, Start here |
| `changeScene`, `makeSceneFrom` | Change the {name} scene, Make the {name} scene from {level} |
| `nothingToStandOn` | Paint some ground to stand on first. |
| `groundBefore`, `groundAfter` | The ground now, The ground with this change |

The framework's own sentences (a scene the schema refuses) are developer text and stay as the framework writes them,
as a level's do.

## Appendix B: every screen state (the pictures and the screens journeys)

1. The scene, Paint chosen, strip open, notes off. 2. The same, notes on, a slope's rise shown. 3. A slope's ghost
mid-drag. 4. Erase chosen. 5. The "slope needs ground" notice with Fill it. 6. Strip and panel closed (handles
only). 7. The Materials panel, list. 8. A material's card. 9. Add a material, Photos. 10. Add a material on a game
with tilesets. 11. The scene opened from a level (things faded, Back to level). 12. The empty state, one level.
13. The empty state, no level. 14. The game's page with scene cards. 15. The first run's two tips and the stamp.
16. A waiting change with a scene's ground before and after. 17. A photo that could not be loaded. 18. The
`long-names` game. 19 (Task 13). Play, and Stop.

## Self-review

- **Spec coverage, slice 1's builder part:** where Scenes is (Tasks 6, 9); the frame, pinch and two-finger move (6);
  Paint with the materials strip and the four shapes, Erase (7); the Materials panel, Add a material from the photo
  library with credits and from the game's tilesets, the card's How big, How worn and colors (8); the drawing
  notes' slope rise (7); the words (Appendix A, Task 12); the empty state and the converter (9); Edit this scene (9);
  saving the file and the pictures painted from it, Suggest waiting, Export (3, 10); Play walking a slope (13); the
  journeys the spec lists for this slice, the agent-and-person journey (10) and the pictures (12). Move, Add, the
  Layers and Light panels, Furnish and signs are slices 2 to 6, outlined above.
- **Where this plan departs from the spec, each approved by the Owner (2026-11-15, 01:02 UTC):** the first run (14),
  the empty state's second button (13), no size control (15), three tools shown instead of five (1).
- **Types:** `Tile`, `Brush`, `SlopeLine`, `History`, `FileToSave`, `SceneSaveAsk` and `SceneSaveAnswer` are each
  defined once and used by the same name after.
- **Review Focus:** each of the five has its test in the task named.
- **Settled by the audit:** ruling 8 kept with the palette check (E3); ruling 2 kept; the save goes through
  `saveChange` (E2); the atlas writer is `atlasText` (M4). Still open to gate 2's amendment: the names of the
  redesign's parts.
