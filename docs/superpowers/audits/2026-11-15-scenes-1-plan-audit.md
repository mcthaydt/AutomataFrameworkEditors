# Scenes, slice 1 (the builder's side): plan audit

Stage 3 of Cycle 4. Audited: [`plans/2026-11-15-scenes-1-ground-and-materials.md`](../plans/2026-11-15-scenes-1-ground-and-materials.md)
as written in PR 37 (`94a3c4d`), against the spec
([`specs/2026-11-15-2d-environment-builder-design.md`](../specs/2026-11-15-2d-environment-builder-design.md), PR 31),
the framework's plan of the same name (AutomataFramework PR 113, audited beside this one:
[its audit](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/audits/2026-11-15-scenes-1-plan-audit.md)),
this repo's `main` (`d853073`), and the other editor plans in review that change the same API: the 2D figure
builder (PR 36), Feel (PR 35, with its audit PR 40), Sound (PR 39) and Story (PR 38).

Nothing was run. Every fact below is read from a file on `main` or on a named branch.

**Verdict: ready for execution once the fixes below are in the plan; they are, in this pull request. Execution still
waits for the plan's four gates** (the all-editor mockups approved, the Blueprint redesign built and audited, the
framework's slice 1 merged, and for Task 13 the hero on slopes). One blocking finding, six important, five minor.

## The Owner's answers (2026-11-15, 01:02 UTC)

The four questions open on cards, answered by the Owner's taps in the project chat:

| Question | The Owner's answer | In the plan |
|---|---|---|
| The first run before props exist | "Paint ground, press Save" | Ruling 14 as written: "Paint some ground", then "Press Save" ("Press Export" for a visitor), then the stamp. Slice 2 brings the spec's "Add a tree". The alternative (no first run until slice 2) is struck. |
| How a scene's size is set in slice 1 | "Agents only for now" | Ruling 15 as written: no size control in the builder; an agent changes `size`. Slice 5 brings the control. |
| Which tools are shown | "Only working ones" | Ruling 1 as written: Paint and Erase, with Play joining in Task 13. Move and Add join with props (slice 2). |
| The empty state before scene generators exist | "Two simple starts" | Ruling 13 as written: "Start from Level 1" and "Start with flat ground". Slice 5's "Make a whole scene" replaces the second. |

Each ruling now says it is the Owner's, with the date. The plan's "Where this plan departs from the spec" list says
these four departures are approved.

## The coordinator's three flags

1. **The page paints; the API checks only the picture's shape (ruling 8).** Kept, and strengthened. See E3.
2. **The Rapier names.** The framework's; all four checked there.
3. **`listContent` as the one `automata.toml` writer.** On this side the question is the save call, not the writer:
   five editor plans each widen the API's save in their own shape. See E2.

## Blocking

**E1. A Suggest-level scene save can never be approved.** `service/approve.ts`, step 2: every path a waiting change
touches must be a content file the default branch's `automata.toml` lists ("the sharing file and the project file
above all can never be approved here"); `service/waiting.ts` sets `here` false on the same rule, and the screen then
offers no Approve. A scene save touches its `.png` and `.atlas.json` (never listed), and a scene started from a level
also touches `automata.toml` and a scene path the default branch does not list yet. So Task 10's journey "Approve by
an Approve-level person puts it in" cannot pass, and step 4 of `approve.ts` reads every touched path as text into
`wholeGameLoads`, which would hand it a PNG. The figure builder's saves (pictures, a new figure's block) and Feel's
(one block once) meet the same wall. *Fix:* Task 10 widens both checks, in one helper both call
(`service/changed.ts`, `allowedPaths`): a touched path is allowed when it is a listed content file; or the picture or
atlas beside a painted file that is listed, on the default branch or in the change's own `automata.toml`; or
`automata.toml` itself when the change's text is exactly the default branch's with `[[content]]` blocks added by the
framework's `listContent` and nothing else (never `automata.access.toml`). Step 4 lays over only the `.json` and
`automata.toml` files. Tests: a scene suggestion with its picture and atlas, and a first scene with its block, are
`here` and approve; a change that edits another line of `automata.toml`, or touches the sharing file, still does not.
Whichever editor cycle builds the multi-file save first builds this helper (E2), and the others use it.

## Important

**E2. Five plans, five shapes of the same save.** The figure builder (PR 36, Task 2) makes `saveChange`: one change
of several files, `content`, `picture` and `atlas` kinds, `list` for new `automata.toml` blocks, at most 24 files and
6 MB; Feel's audit (PR 40, E3) already moved Feel onto it ("whichever cycle builds first builds `saveChange`; the
other adds only what it lacks"). Sound and Story plan their own. This plan adds a third route,
`POST /api/save-scene` with `SceneSaveAsk`, and a github-side `saveFiles`. *Fix:* this plan follows Feel's ruling.
Task 3 becomes "the scene in `saveChange`": if `saveChange` is on `main`, it adds only what it lacks (a `picture`
beside a `scene` checked against `sceneSheet`, the atlas checked against `atlasText(sceneSheet(scene), …)`, E3's
palette check, and a level file in the same change, which `saveChange` already takes); if it is not, this plan builds
it in the figure builder's shape and that plan adds what it lacks. `SceneSaveAsk`, `SceneSaveAnswer` and
`service/save-scene.ts` go. Task 2's `saveFiles` stays only if `saveChange` has no several-file commit yet, and its
stale answer is `changed-elsewhere`, the problem `saveFile` really gives (the plan said `stale`). Reported to the
coordinator, who orders the cycles.

**E3. Ruling 8, weighed.** Painting in the API would mean shipping the 38 photos (2.9 MB) and the pipeline inside a
Pages Function, whose CPU time is short; the figure builder's plan rules the same way for the same reason, and the
game's own `automata check` compares every painted file byte for byte with `artFiles` (`art.ts`'s `artProblems`), so a
wrong picture turns the game's CI red rather than breaking play. Keep it. But "a PNG of the right size" lets any
picture at all into a team's game under a scene's name. The framework writes an 8-bit palette PNG with `PLTE` and a
`tRNS` for index 0 (`src/lib/png.ts`), so the API can hold the picture to the scene without painting it. *Fix:* the
API checks the header says palette colour (type 3) and 8 bits, the `PLTE` holds exactly the scene's paints in order
(after the clear entry `artFiles` writes), the only chunks are `IHDR`, `PLTE`, `tRNS`, `IDAT` and `IEND`, and the
picture decodes whole with the framework's `decodePng` (cut short or garbled is refused). The 2 MB cap is wrong for
the largest scene the framework allows (2048 by 2048 indexed is 4 MB before deflate, and photo ground compresses
badly); the cap is the change's 6 MB (`saveChange`'s).

**E4. A picture over one megabyte cannot be read back.** `github/repo.ts`'s `readBytes` answers `not-found` for a file
over GitHub's one megabyte (the contents call sends no bytes). The builder paints its own scene afresh, but the level
editor draws a level with a scene from the game's picture, and the waiting change's before and after (ruling 17) read
both sides' pictures: a big scene would show as "missing". *Fix:* Task 2 (or `saveChange`'s task, whichever lands)
gives `readBytes` the fallback the contents call points at: when it says `encoding: "none"`, read the blob by its
`sha` (`GET git/blobs/<sha>`, which sends up to 100 MB). The pretend GitHub gains the route; a test reads a
1.5 MB picture.

**E5. The test game's pictures are never committed.** `tests/fixtures/game/pictures.ts` paints them with `artFiles`
at test time ("none is committed, so a change to a painter … moves them and nothing here is out of date"). Task 1
asks to copy the framework fixture's "painted files" byte for byte, but the framework commits none for `scene-game`
either (its tests paint in memory). And once the test game lists a scene, `artFiles(loaded.value)` with no photos
throws `MissingPhotoError`, so every journey that uses `fixturePictures()` breaks. *Fix:* Task 1 copies only the
scene's and the level's JSON; `pictures.ts` hands `artFiles` the photos (in Node by reading the pinned package's
`photos/` folder through `import.meta.resolve`, in a browser by fetching `/photos/`); Task 5's test compares
`paintNow` with `fixturePictures()` instead of committed files.

**E6. The live repaint needs a framework call that did not exist.** `createLevelPicture`'s picture owns its `Art` and
keeps the content it was made with; `show(level)` cannot take a new ground. Ruling 16's "swaps the stage's art"
had nothing to call. The framework's plan now adds `LevelPicture.showScene(content, art)` (its I7). *Fix:* Task 5
consumes it and names it in "Consumes"; a size change (only by an agent, ruling 15) makes a new picture.

**E7. The flat scene cannot be made without its photo.** Ruling 13's flat scene is ground "in the library's `dirt`",
which needs `dirt`'s three paints (ruling 5), measured from the photo's pixels; `flatScene(id)` has no photo. *Fix:*
`flatScene(id: string, colors: readonly [string, string, string])`, the caller passing `photoColors` of `dirt` once
it is fetched; its test uses fixed colors.

## Minor

**M1. Erase.** The spec gives the Erase tool props and layers, and erasing ground to Paint ("Erase with Paint on
removes ground"). With the Owner's "only working ones", an Erase tool that takes ground is right for slice 1. *Fix:*
slice 2's outline says Erase then takes props and ground both, so painting with nothing chosen never loses its
undo.

**M2. Two generic histories.** The figure builder's plan makes `figures/history.ts` with the same three moves. *Fix:*
whichever lands first puts `History` in `src/lib/history.ts`, and the other uses it.

**M3. This repo's `CLAUDE.md` still says an editor writes only listed JSON.** The spec's "already decided" includes
"the pictures painted from it", and Feel's ruling adds the one `[[content]]` block. *Fix:* Task 12's `CLAUDE.md`
change also rewrites that rule to name the painted pictures and atlases beside listed files and the `[[content]]`
blocks `listContent` adds.

**M4. The atlas writer's name.** The plan said "`writeAtlas(sceneSheet(scene))`, or the name the framework gives".
*Fix:* `atlasText(sceneSheet(scene), '<id>.png')`, which the framework's plan now exports (its M5).

**M5. The demo game has no scene yet.** In the journeys the demo is the test game (`grandma/crate-game`, served from
`tests/fixtures/game`), which gains `meadow`, so Task 11's first run starts on a scene. The real demo
(AutomataFrameworkExamples) lists no scene until plan D's art step, so a real visitor's first visit starts at the empty
state's "Start here". *Fix:* Task 11 adds that case (a demo with no scene: "Start here", Start from Level 1, "Paint
some ground", Export, the stamp) and says the spec's first run waits for Examples to move onto scenes.

## Checked and found sound

- The slope rule's arithmetic agrees with the framework: (2, 10) to (5, 7) is four steep tiles with six under; a tap is
  one tile with none under; `gapsUnder` is the same rule.
- The header allows what ruling 10 needs: `connect-src 'self'` covers `fetch('/photos/…')`, and a painted picture reaches
  the canvas as bytes to an `ImageBitmap`, no `blob:` URL.
- `/api/picture` already serves any `content/…png`, so a game's own photo at `content/photos/<id>.png` is reachable.
- The layer order (`scenes` after `levels`) fits `tests/architecture/rules.ts`; `find`, the eight other word tables,
  `Stage.svelte`, `Tip.svelte` and the rest of gate 2's names are the redesign's and not on `main` yet (PR 28 is its
  Task 6), as gate 2 expects.
- Ruling 4's 62 letters sit inside the framework's 93; a scene an agent wrote with other letters keeps them.
