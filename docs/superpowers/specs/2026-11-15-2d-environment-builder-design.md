# The 2D environment builder

Stage 1 (spec) of Cycle 4 in AutomataFrameworkEditors, written 2026-11-15 with the Owner. It describes World's third
part, **Scenes**: the 2D environment builder, in which a person or an agent builds a whole scene (the ground, what
stands on it, what is behind and in front of it, its light and its weather) and the level editor then places what
plays in it. It covers the framework's side too (a new `scene` file, its painter, and light and weather in the
renderer), because the builder is a screen over that file and cannot be planned without it. The first layer's spec in
AutomataFramework ([`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)),
the M2 spec's "Art (plan A)" and this repo's Blueprint redesign spec
([`2026-11-14-editors-blueprint-redesign-design.md`](2026-11-14-editors-blueprint-redesign-design.md)) still hold;
where this page is more exact about scenes, it wins.

## Principles served

- **5. Characters and scenes come from the environment builder and figure builder, carried over from the first
  attempt.** This is the environment builder, carried over cut down to 2D and seen from the side, with everything the
  3D one could do: shapes, photo materials, generated props, furnishing from one word, whole places from a name and a
  number, lettering, light and time of day, sky and weather, grime, and the check that characters read against it.
  The old code is read and its rules kept, never copied whole (principle 7).
- **1. Agent-first.** A scene is one JSON file an agent can write by hand. Every button in the builder is a documented
  command that ends as a change to that file; "Furnish" and "Make a whole scene" write ordinary props and shapes into
  the file, never a recipe the file hides.
- **2. iPad-first editors.** Painting ground, adding a tree and pulling the time of day are finger actions first, at
  iPad size first; everything a finger drags can also be done with buttons and keys.
- **3. Layers in order.** 2D only. The 3D builder's rooms, cameras and lights are not mixed in; a 3D Scenes part is a
  later layer.

It breaks none: no new dependency (see "Constraints"), its own repo for the builder, the framework's side in the
framework.

## Why

The Owner, 2026-11-15:

- "The 2D figure builder and 2D environment builder are large enough to warrant its own session for them
  individually, actually every editor tab is really."
- "The real art comes from the builders." The demo game's scenes are made with this builder, so it is on the path to
  Release 1, ahead of the rest of the editors' work.
- "The environment builder is not a background builder, it should be as powerful as its 3D counterpart, we build full
  scenes in it, just not orchestration, that's for the level editor."

And from the first attempt (2026-11-12): "we should do photo texture across the board since that's our environment
builder look."

Today a game's look is split across three files that were never meant to be a scene: the level's rows of tiles (the
ground), a tileset (how the ground looks) and a backdrop (flat bands of hills, mountains and clouds behind). Nothing
can make a forest, a street or the inside of a house. The old 3D builder could make all of those, and its look was the
one the Owner kept.

## Decided with the Owner

| | Question | The Owner's answer (2026-11-15) |
|---|---|---|
| Q1 | Who owns where the ground is? | **The scene.** The ground, walls and platforms are shaped in the scene, painted with the game's tiles and photo materials, with everything seen around them. A level names its scene and only places what plays: characters, start points, joints. As in 3D, where the builder made the rooms and the level editor placed things. |
| Q2 | Which of the 3D builder's powers come to 2D? | **All of them**, built in slices: ground and materials, props, layers, light and sky, Furnish and whole scenes, then lettering, grime and the reads check. |

Two earlier questions (a background-only builder, and where props come from) were withdrawn when the Owner said this
is a full scene builder.

Already decided and not reopened: the Blueprint frame, palette No. 310 for the editors (never on a game's art),
Fraunces, Onest and JetBrains Mono, Phosphor icons with words, nine languages with no default, flags-only pickers,
pinch and two-finger move on every canvas, closable panels like Claude's app, Save (with GitHub, for the team) and
Export (anyone), the access levels in `automata.access.toml`, editors change only authorable JSON and the pictures
painted from it, and every plan has end-to-end tests.

## Goals

1. **A person can build the demo game's three scenes in the builder alone**, to the standard the Owner signs off for
   Release 1, outdoors and indoors, at the quality of the first attempt's frames.
2. **Everything the 3D builder did has a 2D form here** (the table under "What a scene can hold").
3. **An agent and a person make the same bytes.** Every action is a command; the builder writes the scene and its
   pictures exactly as `writeContent` and `automata art` do.
4. **The level editor and the builder meet cleanly.** A level names a scene; the builder never places characters,
   starts or joints, and the level editor never shapes ground.
5. **No recorded play moves** for a game that does not use scenes, and a level moved onto a scene by the converter
   plays to the same hash.
6. **Proven by pictures and journeys**: the five sizes, nine languages, and journeys for every path below.

## Non-goals

- **Orchestration.** Characters, start points, joints, cutscenes and what happens when: the level editor, Characters
  and Story.
- **Making characters.** The figure builder (Characters) makes characters and hand-made props. The builder here can
  place a figure as a prop, never edit one.
- **Hand-painting pixels.** No brush on pixels. Everything is painted from the file by the framework's painter; a team
  that wants a hand-drawn picture uses a tileset image or a figure.
- **3D.** No depth, no camera angles, no rooms in perspective.
- **Moving the demo onto scenes.** That is the Examples repo's plan (plan D's art step uses this builder once it lands).

## Anti-goals (a failure even if it works)

- A builder that only makes backgrounds: the Owner's correction.
- Any part of a scene that lives only in the editor, or a "Furnish" whose result an agent cannot read in the file.
- A scene that looks different in two engines, or paints different bytes on an iPad and in `automata art`.
- Light or weather that changes what happens in play (they are pictures only, never in the hash).
- Words in a scene (a shop sign) that only one language can read.
- Any colour, tint or filter of the editors put on the scene's art.

## Approaches considered

1. **A new `scene` file that owns the ground and everything seen, with the level reduced to what plays (chosen, with
   the Owner's Q1).** One file per place, the way the 3D builder had one map per place; the level editor's file gets
   small; an agent edits a scene without touching gameplay. Costs: the level format changes (with a converter, and old
   levels still read), and the sim reads the ground from the scene.
2. **Widen the backdrop and keep the ground in the level.** Smallest framework change, but the ground, the thing a
   scene is mostly about, stays in the level editor, and the builder becomes a background builder, which the Owner
   ruled out.
3. **Port the 3D builder's map format and paint it side-on.** Its sectors, walls and heights describe rooms seen from
   above; a side view needs ground in rows, layers by depth and props on a line. Porting it would carry a 3D shape into
   a 2D package, against principle 3. Its rules come over (kinds with numbers and a seed, photo materials, the
   dresser's kits, the reads), not its format.

## What a scene can hold

Each row is one of the 3D builder's powers and its 2D form. The slice that builds it is in "Slices".

| The 3D builder | In a 2D scene |
|---|---|
| Room and street shapes: floors, walls, heights | **Ground**: rows of tiles, one letter per tile, as levels have today, with new tile shapes: solid, slopes (up and down, whole and half), a ledge you can jump up through, and "back wall" (seen, not solid: the inside of a house or a cave, seen cut away) |
| Swatches from CC0 photos (the photo pipeline: flatten, facet, resample, index, wear) | **Materials**: each ground letter is painted with a material, either a tileset from Tiles or a photo material; a photo material is a photo turned into pixel tiles indexed to the scene's colours, with its edges and corners worked out by the painter (grass on top, a lip on a ledge) |
| 92 generated props (furniture, cars, trees, signs, lamps) | **Props**: kinds with a few numbers and a seed (a tree: how tall, how leafy; a fence: how long), painted by the framework, with "Another one" for a new seed; or a figure the team made, placed as a prop |
| The dresser: a room furnished from one word and a seed, eight kits | **Furnish**: a stretch of the scene and one word (forest, meadow, town, street, house, shop, cave, castle) fills it with props from that word's kit; it writes ordinary props, each named like `forest:3`, which can then be moved, changed or removed |
| Whole maps from a name and a number (apartment, block) | **Make a whole scene**: a name and a number write a whole scene file (ground, materials, layers, props, light): meadow, town, house, cave |
| Shop-sign lettering from a glyph set | **Signs**: a sign prop with words, the words being a message key so every language the game ships has its sign |
| Layers of depth (near, far) and the sky | **Layers**: behind the ground and in front of it, back to front, each sliding at its own speed as the camera moves (today's backdrop kinds and more: tree lines, roofs, far towns, water) |
| Time of day (`times.json`), lamps, vertex light and occlusion | **Light**: the scene's time of day (dawn, day, dusk, night) colours the sky and everything in it; lamps glow round themselves; light is drawn by the renderer over the painted pictures |
| Sky, rain, stars, bloom | **Sky and weather**: the sky's colours from the time, stars at night, rain, snow, falling leaves, a soft glow round lamps |
| Decals: grime, puddles, litter | **Wear**: grime on materials (how worn, 0 to 1), puddles and litter as small props a kit can scatter |
| The readability check: a figure must read against its room, and must not read hot | **The reads check**: `automata check` paints each level's scene with the game's characters in it and fails when a character does not stand out (the first attempt's numbers, edge read 1.1 and the hot rule) |

## How a scene and a level split

- **A scene** is what a place is: its size, ground, materials, layers, props, signs, light, sky and weather. It knows
  nothing of play. Several levels can use one scene (the same meadow, different things in it).
- **A level** is what happens there: which scene, the camera's view, characters, start points, joints. A level with a
  `scene` has no `tiles`, `tileset`, `backdrop`, `sky` or `ground`; the check refuses one that has both, in a sentence
  that says which to keep.
- **The level editor** shows the level's scene as its picture and cannot change it; it has "Edit this scene", which
  opens Scenes on that scene with the level's things shown faded on top, so a person can see whether the crate still
  sits on the ground.
- **Scenes** shows the level's things faded when opened from a level, and none when opened from the game's page. A
  scene used by more than one level says so on its title block ("Used by Level 1 and Level 2").
- **Old levels still read.** A level with `tiles` and no `scene` plays as it does today. `automata scene from-level`
  writes a scene from a level's tiles, tileset, backdrop and sky, and points the level at it; a level moved this way
  plays to the same hash, which a test proves on the framework's fixture game and the Examples repo's goldens.

## The framework's side

All in AutomataFramework, in the `content`, `physics`, `render` and `cli` features, plain TypeScript with no page and no
Node in the painter, so the builder on an iPad and `automata art` paint the same bytes.

- **The `scene` file**, a new content type with a Zod schema, a JSON Schema in `schemas/`, `file: path` diagnostics in
  plain sentences, and written only by `writeContent`. Its parts: `format`, `id`, `seed`, `tile` (pixels a tile),
  `size` (in tiles), `paints` (the scene's colours, named for what they are for, as a figure's are), `materials`,
  `ground` (the rows and what each letter is: its material and its shape), `layers`, `props`, `light`, `weather`.
  The plan writes the full format; the M2 spec's rule holds: one thing per file, kinds with numbers and a seed.
- **The `backdrop` file is folded into scenes.** Its four kinds become layer kinds; a backdrop still reads until
  Release 1 so nothing breaks while games move, and `from-level` writes its layers into the scene.
- **Photos.** The framework ships the first attempt's CC0 photo library (the world kit's 38 photos, each with its
  source, licence and credit, already recorded) and the photo pipeline's stages, rewritten in the framework's form. A
  game may add its own photos under `content/photos/` with the same record; a photo without its record fails the check.
- **The painter** paints a scene into its pictures (the materials' tiles, the layers' strips, the props' frames) and
  their atlases beside the file, the same bytes in every engine: whole-number work, `dmath`, and a stream per part
  from `deriveSeed(seed, id)`, as `paint-backdrop.ts` does today. Props' kinds are the world kit's generators and
  kits, read for their rules and redrawn for a side view.
- **The sim** reads the ground's solid tiles, slopes and ledges from the scene. Slopes and ledges are new: switched on
  by content, so a game with neither has the sim it has today, to the byte.
- **The renderer** draws layers, ground, props and the level's things back to front with the layers in front last,
  then the light and the weather over them. Light and weather are presentation: they read the sim's tick and never
  change state, so they are never in the hash; weather's motion comes from a seeded stream, so a replay looks the same.
- **Commands** (`automata scene …` and the MCP server's tools, both thin over the same functions the builder uses):
  `new` (a whole scene from a name and a number), `furnish` (a stretch and a word), `another` (a prop's next seed),
  `from-level`, and `automata art` paints scenes as it paints figures. `automata check` runs the reads check.
- **A skill** (`skills/automata-content/`, the scenes page): how a scene is laid out, each kind's numbers, and how to
  make a place an agent can then hand to a person in the builder.

## The builder: World's Scenes part

### Where it is

The World pill's switcher lists its three parts: **Levels, Tiles, Scenes**, each with its icon and word (Tiles stays
"Coming soon" until its own cycle). Scenes opens from the switcher, from a level's "Edit this scene", from the game's
page (scenes as picture cards beside levels), and from the find bar ("Open the meadow scene").

### The frame

The Blueprint frame, unchanged: the scene fills the window, drawn by the framework's renderer, pinch to zoom and two
fingers to move, the pill top left, the cluster top right (Find, faces, language, Export, Share, Save), the title block
and undo and redo bottom right, the drawing notes switch bottom left. One finger never moves the view.

**Tools on the left edge** (along the bottom when upright): **Move**, **Paint**, **Add**, **Erase**, **Play**.

- **Move:** touch a prop to pick it, drag it; touch a layer's empty space to pick the layer.
- **Paint:** paints ground. A strip of the scene's materials, each shown as its real tiles, and a choice of shape
  (Solid, Slope, Ledge, Back wall). Drag to paint tiles; the painter works out edges and corners as you go. Erase
  with Paint on removes ground.
- **Add:** a tray of prop kinds (Trees, Rocks, Plants, Fences, Houses, Lamps, Signs, Furniture, and the game's own
  figures), each drawn in the scene's real art. Touch one then the scene, or drag it in. The new prop is picked and
  its card shows **Another one**. The tray's first row is **Furnish** and **Make a whole scene**.
- **Erase:** touch a prop or a layer's part to remove it; undo brings it back.
- **Play:** walks the scene with the game's hero (the framework's built-in hero, as the level editor's Play), so a
  person feels the slopes and ledges. Plays from the file on screen, unsaved changes included.

**Panels on the right**, each closable and openable like Claude's app's panels, each with its own button in a row
under the cluster (in the pill's menu when upright, as bottom sheets on a phone):

- **Layers:** every layer back to front with a small picture, the ground's place among them marked "The ground",
  each with Show/Hide, Up and Down, and dragging to reorder. Picking one shows its card.
- **Materials:** the scene's materials, each as its tiles; **Add a material** opens the photo library (the photos as
  pictures, each with its credit) and the game's tilesets; a material's card has "How big", "How worn" and its colours.
- **Light and sky:** the time of day as a slider with four marks (Dawn, Day, Dusk, Night) that changes the scene as the
  finger moves; Rain, Snow, Leaves and Stars as switches with "How much"; lamps are props and their card has "How
  bright" and "How far".

### The picked thing's card

As the level screen's card: the thing's name in words with its id under it as a label, and only what the file holds,
each number with − and +:

- **A prop:** its kind ("Tree"), its numbers as plain words ("How tall", "How leafy"), **Another one**, **Flip**,
  **In front / Behind** (which layer it stands on), its place ("From the left", "From the bottom"), and Erase.
- **A layer:** its kind, its colours, "How high", "How fast it slides" (the file's `drift`), Show/Hide, and Erase.
- **A sign:** its words in the language on screen, with a line that says the other languages' words come from the
  game's messages and which are missing.
- **A stretch Furnish made:** its word and "Furnish again" (a new seed for that stretch only), so a person can reroll a
  forest without losing their own trees elsewhere.

### The drawing notes

Over the picked thing: its name chip, its place as measure lines with end ticks, a layer's speed as a note ("SLIDES
30%"), a slope's rise, and a Furnish stretch as a dashed bracket with its word. Each note is a control, as on the level
screen. While a person drags the view, layers slide at their speeds, so depth is seen, not read.

### Words

Plain words only, in all nine languages, in `src/features/words/`: "ground", "slope", "ledge", "back wall", "material",
"layer", "how fast it slides", "another one", "furnish", "time of day". Never "seed", "drift", "parallax", "tile
shape", "decal" or "sprite" on a screen; the files keep their own names for agents.

### Onboarding

The first visit to Scenes (once, counted in `af.tip.*` as the other first runs are): the demo's meadow opens; a tip
says **"Add a tree"** by the Add tool; once one is placed, **"Press Another one"** by the card; then the stamp. Under a
minute, no reading beyond the two tips, nothing blocked meanwhile. The empty state of a game with no scene yet is one
calm panel: "This game has no scenes yet." with **Make a whole scene** (the main button) and "Start from Level 1"
(the converter).

### Saving

Save and Export as everywhere. Save commits the scene file and the pictures painted from it, exactly the bytes
`automata art` writes, so the game's check ("This picture is older than its scene file") stays green; a Suggest-level
save waits for approval as any other. Export gives the scene's file, copied for the person's agent.

## Slices

Each slice is a framework part and a builder part, each with its own plan and each through the full workflow (plan, plan audit, execution,
implementation audit, fixes, review), framework first. Each ends usable: a person can do that much in the builder.

1. **Ground and materials:** the `scene` file, the level's `scene`, `from-level`, slopes and ledges in the sim, photo
   materials and the painter's edges, Paint and the Materials panel. The demo's levels can move onto scenes here.
2. **Props:** the kinds and their numbers, Another one, the game's figures as props, Add, the card.
3. **Layers:** layer kinds (today's four and more), in front and behind, the Layers panel.
4. **Light, sky and weather:** time of day, lamps, stars, rain, snow, leaves, glow.
5. **Furnish and whole scenes:** the kits, `furnish`, `new`, the empty state.
6. **Signs, wear and the reads check.**

## Testing

- **Framework:** each schema's sentences; the painter's bytes as goldens, and the same bytes in Node, Chromium, WebKit
  and Firefox (the parity suites); every kind and kit from two seeds; a level and its `from-level` scene play to the
  same hash (the fixture game and a copy of the Examples goldens); a game with no scene keeps every hash; light and
  weather on and off give the same hash; the reads check fails a dark figure on a dark scene and names it; the photo
  records.
- **The builder (journeys, in real browsers at the five sizes):** the first run (Add a tree, Another one, the stamp);
  painting ground with each shape and erasing it; adding each prop kind by tap and by drag; Another one; every card's
  − and + and their notes; Layers reordered by drag, by Up and Down and by keyboard; a material added from the photo
  library; the time-of-day slider by finger and by keys; Furnish and Furnish again; Make a whole scene; Play walking a
  slope; Edit this scene from a level and back; Save as Edit and as Suggest, Export as a visitor; undo and redo of each
  change; pinch and two-finger move; every panel closed and opened; nine languages with no missing word.
- **Agent and person agree:** a journey writes a scene with `automata scene new`, opens it in the builder, changes
  nothing and saves: no byte changes. One that changes a prop in the builder and one that changes it by command give
  the same file.
- **Pictures:** every Scenes screen and panel at phone upright, phone sideways, iPad upright, iPad sideways and
  desktop, shown to the Owner in the screenshot review artifact, saying plainly whether they show the final look.

## Constraints

- **No new dependency.** The photo pipeline uses the framework's own PNG reader and writer; lighting and weather use
  PixiJS, already in the stack. If a slice finds it needs one, it stops and asks the Owner.
- **Determinism:** the painter as today's (whole numbers, `dmath`, seeded streams); presentation never in the hash.
- **Picture sizes:** a scene's pictures keep the framework's `MAX_PICTURE_SIDE`; the check says which part to make
  smaller.
- **The editors' rules:** only authorable JSON and its painted pictures are written; nothing kept on the device beyond
  the allowed keys; touch targets 44 px, main buttons 48 px, tools 56 px; nothing on screen that does nothing.
- **The Blueprint redesign comes first.** Scenes is built on its frame, after its build and its two audits; nothing
  here changes that work.
- **Example games' art stays in palette No. 276;** the framework imposes no palette, and a scene's `paints` are the
  game's choice.

## Left to the builder (the plans)

- The `scene` file's exact fields, names and limits, and how its pictures are laid out in files.
- The list of prop kinds and their numbers, the kits' words and contents, the whole-scene names, and the layer kinds
  beyond today's four, with the first attempt's world kit as the reference.
- The slope angles (my call: whole and half slopes, so a tile's rise is one or one half).
- How signs paint words in Chinese, Japanese and Korean (the first attempt's glyph set is Latin only); the rule is
  that every language the game ships can read every sign.
- How light is drawn (a light layer over the pictures, lamps as soft circles, or another way), within PixiJS.
- How many photos ship, and whether a game's own photos need a size limit.
- Which journeys share set-up, and how the five-size pictures are taken.

## My calls (the Owner may overrule any)

- On screen the part is **Scenes**; the files say `scene`.
- The scene owns its size; a level's size is its scene's.
- Furnish and Make a whole scene write ordinary content and keep no recipe, except that a Furnish stretch keeps its
  word and seed so "Furnish again" can reroll only it.
- The backdrop file is folded into scenes and kept readable until Release 1.
- Each slice has two plans, one in AutomataFramework for its framework part and one here for its builder part, the
  framework's written and landed first.
