# The 2D figure builder

Stage 1 (spec) of the Figures part of the Characters editor, in AutomataFrameworkEditors. Written 2026-11-15 with the
Owner through the coordinator. The first layer's spec in AutomataFramework
([`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
"The editors") and the editors' Blueprint redesign
([`2026-11-14-editors-blueprint-redesign-design.md`](2026-11-14-editors-blueprint-redesign-design.md)) still hold;
where this page is more exact about the Figures part, this page wins.

The Owner asked (2026-11-15) that every editor part get its own full pipeline: spec, plan, audits, build. This is the
first: the figure builder, the part of Characters that makes a character's picture.

## Principles served

- **5. Characters and scenes come from the environment builder and figure builder.** This is the figure builder. The
  Owner (2026-11-15): "the real art comes from the builders". The demo game's characters are made with it, so it is on
  the path to Release 1, ahead of the other editor parts.
- **2. iPad-first editors.** The figure fills the screen, every part can be picked, dragged, sized and turned with a
  finger, and every drag has buttons and keys beside it.
- **1. Agent-first.** The builder changes the framework's figure file and nothing else (plus the picture and atlas the
  framework paints from it). Every action has a plain name an agent's command also uses. An agent editing the same
  file by hand gets the same bytes, and the same picture.

It breaks none: 2D only (the 3D figure builder is a later layer), its own repo, nothing ported ahead of its user (the
demo game uses it at once), and no new dependency.

## Why

The framework can already draw a character from a figure file (M2 plan A): a picture made of blocks and rounds in
named colours, with poses that move parts, and other colours for players 2 to 4. Today only an agent can write one, by
typing numbers into JSON. The Owner wants the art of every game, the demo first, to come from the builders, and the
editors are where a person who does not write code changes a game. So a person needs to make and change a figure by
touch, and see it as the game will show it, at once.

## What a figure file holds today (the framework's `figure` format)

So the builder's words match the file, here is what it can change, from `src/features/content/figure.ts` at the
framework pin:

| In the file | What it is | Limits |
|---|---|---|
| `frame` | the size of one picture, in pixels | 4 to 128 each way |
| `tile` | how many pixels make one tile of the game | 4 to 64 |
| `outline` | an edge one pixel wide round the whole figure, or none | one colour |
| `paints` | the colours, each named for what it is for (`body`, `trim`, `ink`) | 1 to 16 |
| `parts` | blocks and rounds, each with a middle, a size, a turn and a paint; first is at the back | 1 to 32 |
| `poses` | ways the figure stands: each moves some parts (`dx`, `dy`, `turn`) | 1 to 64 |
| `variants` | the same figure in other colours, for players 2, 3 and 4 | 0 to 8 |

The framework paints it (`paintFigure`, the same bytes in every engine) into `content/figures/<id>.png` and
`<id>.atlas.json` beside the file (`artFiles`), and `artProblems` fails a game whose pictures are not what its files
say. A character file names its `figure` and lists its `clips` (runs of poses). Painted pictures are committed, and an
editor's save writes them with the file in the same commit (the Owner, 2026-11-14, AF audit I7).

## Goals

1. **A person makes a character's picture by touch**, from nothing or from a start, and sees it exactly as the game
   draws it, at every step.
2. **Every field of the figure file can be changed** without typing JSON: colours, parts, their order, poses, player
   colours, the outline, the frame and tile sizes.
3. **What is saved is the framework's bytes**: the figure file as `writeContent` writes it, and the picture and atlas
   as `artFiles` paints them, in one save.
4. **The demo game's characters can be made with it** (the hero, the keeper, the critter, and the crate as a prop).
5. **The first visit to Characters ends in a real change in under a minute**, with no reading.
6. **Proven by journeys** at five sizes, by byte checks against the framework, and by an Owner review of every screen.

## Non-goals

- **Clips** (which poses play, how fast, looping) are the "Clips and kinds" part's spec. The builder can play a
  character's clips to look at (pending Q1).
- **Behaviour** (Schematic), **movement numbers** (Feel's Tuner), **sounds** and **words**: other parts.
- **3D figures**: the 3D layer.
- **A pixel pencil or new shapes** (pending Q2): they need a framework format change, which would be its own spec in
  AutomataFramework first.
- **Importing a picture** (a PNG drawn elsewhere): the figure file is the source; a picture with no file behind it
  breaks principle 1.
- **The old procedural painter** (sliders, garments, lighting): settled by the Owner, 2026-11-14 (M2 plan A): not
  ported.

## Anti-goals (a failure even if it works)

- A picture on screen that is not the framework's painting of the file (a preview drawn some other way, smoothed,
  tinted or filtered).
- A change that can only be made by a gesture (no button or key does it too).
- A field of the file the builder silently drops or rewrites when it saves something else.
- Words like "variant", "dx", "paint id", "frame" or "atlas" on a screen.
- A figure that saves but fails `automata check` (its picture or its file refused).
- A first visit that starts with a list of parts, a page of words or a tour.

## Decided with the Owner

Already decided before this spec, and not reopened: the Blueprint look (dark, canvas first, floating panels that can
be closed and opened like Claude's app, drawing notes over the real art, never restyling a game's art); the editors'
palette No. 310, Fraunces, Onest and JetBrains Mono, Phosphor regular icons; pinch to zoom and two fingers to move at
every size; nine languages, no default language, flags only in pickers; Save (signed in, with your team) and Export
(anyone, copied for your agent) kept apart; painted pictures committed and written by the editor's save; the editors
change only authorable content; visitors open only the demo game.

Decided in this spec's conversation:

| | Question | The Owner's answer |
|---|---|---|
| — | Where does the demo's art come from? | **From the builders** (2026-11-15). The figure builder must be able to make the demo's characters. |
| Q1 | What does the Figures part change? | *Waiting.* Recommended: only the figure file; clips can be played, not changed. |
| Q2 | What can a person draw with? | *Waiting.* Recommended: blocks and rounds as the file holds them today. |
| Q3 | Can the builder make a new figure? | *Waiting.* Recommended: yes, from a copy, a starter or blank, listing it in `automata.toml`. |
| Q4 | The first visit's one task? | *Waiting.* Recommended: tap the hero's body, pick a colour, see it run. |

## Approaches considered

1. **Build on the framework's figure format, painted by the framework in the page** (chosen). The builder edits the
   `FigureFile` in memory, and on every change calls the framework's `paintFigure` (pure, the same bytes everywhere) to
   draw what is on screen, and `artFiles` and `writeContent` to save. What the person sees is what the game draws, by
   construction, and an agent's hand edit is the same file.
2. **Port the old 3D Studio and the procedural painter.** The Owner settled that the old painter is not ported. The
   Studio's way of working (Look, Pose, Animate) does carry over, as the modes below.
3. **A general pixel-art editor writing PNGs.** Familiar, but the picture would have no file an agent can read, change
   and paint again: it breaks principle 1 and the framework's `artProblems` check. Rejected.

## The Characters editor's frame

The level screen's frame (the redesign spec) holds: the pill top left, the cluster top right, tools on the left edge
(along the bottom when upright), panels that float and close, the title block and undo and redo bottom right.

- **The switcher** shows Characters chosen. Under the pill, Characters has its parts as a second row of tabs: **Figures**
  (working), **Clips and kinds** and **Schematic** (each "Coming soon", with the same short card as an editor that is
  coming). Each part is its own spec.
- **The pill** reads the game's name and the figure's name ("Crate Game · Hero"); pressing it opens the game's page,
  which gains a **Characters** list: each character with its picture, and each figure (pending Q3: and "New figure").
- **Opening Characters from World:** a picked thing's card in World gets "Change how it looks", which opens its
  character's figure in the builder. Back returns to the level with the thing still picked.

### iPad sideways and desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌Crate Game · Hero┐ World ┌Characters┐ Feel Sound Story        ┌Find or do anything┐ ⚑ Share [Save] │
│  ┌Figures┐ Clips and kinds · Schematic                                                        │
│ ┌──────┐                                                              ┌ PARTS ─────────── ✕ ┐ │
│ │MOVE  │          · · · · · · · · · · · · · · ·                       │ ▸ eye        ink    │ │
│ │SIZE  │          ·       ╭──── HEAD ───╮      ·   FROM THE LEFT 12   │ ▸ head       trim   │ │
│ │TURN  │          ·       │  ▒▒▒▒▒▒▒▒   │      ·  ├──────────┤        │ ▸ body       body   │ │
│ │ADD   │          ·       ╰──▒▒▒▒▒▒▒▒───╯      ·                      │ ▸ foot-back  ink    │ │
│ │ERASE │          ·        ██████████          ·   12 WIDE            │ [+ Add a block] [+ Add a round] │
│ │PLAY  │          ·        ██    ██            ·                      └────────────────────┘ │
│ └──────┘          · · · · · · · · · · · · · · ·                       ┌ COLOURS ────────── ✕ ┐ │
│                                                                       │ ● body ● trim ● ink  │ │
│ ┌ LOOK │ POSE │ PLAYERS ┐  ┌ idle ▾ ┐   ▶ run                         └────────────────────┘ │
│ ┌ DRAWING NOTES ● ON ┐                                    ┌ title block ┐   ┌ ↶ ↷ ┐            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **The figure fills the middle**, painted by the framework at a whole-number zoom (each pixel a crisp square, never
  smoothed), on the ground colour with the pixel grid over it and the frame's edge drawn as a dashed line. A strip of
  the game's own ground tile under its feet, at the game's tile size, shows how big it is in the game (from `tile`).
- **The modes** sit bottom left in one segmented control: **Look** (its parts and colours), **Pose** (how it stands in
  each pose) and **Players** (its colours for players 2 to 4). This is the old Studio's Look, Pose and Animate, cut to
  what a 2D figure file holds.
- **Panels on the right**, each closable and openable (a ✕ on each, and its name in a small row when closed, like
  Claude's app): **Parts** (the parts in drawing order, front at the top) and **Colours**. In Pose mode a **Poses**
  panel joins; in Players mode, **Players**.
- **Tools on the left**: Move, Size, Turn, Add, Erase, Play. Each is an icon with its word, 56 px or more.

### iPad upright, phone sideways and phone upright

The same parts re-placed as the level screen re-places them: tools along the bottom, the panels as one bottom sheet
with a tab per panel (pulled down to its title, or closed), the modes in the pill's row, the canvas keeping its minimum
height. On a phone held upright nothing scrolls; the sheet covers at most the lower third and the figure is fitted
above it.

```
┌────────────────────────────┐
│ ┌Hero · Characters ▾┐ ⚑[Save]│
│ ┌LOOK│POSE│PLAYERS┐         │
│      ·  ╭ HEAD ╮  ·         │
│      ·  │▒▒▒▒▒▒│  ·         │
│      ·  ██████    ·         │
│ ┌ PARTS · COLOURS ───── ✕ ┐ │
│ │ head  trim   [− 12 +]   │ │
│ MOVE SIZE TURN ADD ERASE ▶ ↶↷│
└────────────────────────────┘
```

## Look: parts and colours

- **Picking a part:** touch it on the figure (the frontmost part under the finger) or in the Parts panel. The picked
  part gets a dashed ring and its notes: its name chip ("HEAD"), its middle as two measure lines from the frame's left
  and top edges ("FROM THE LEFT 12"), its size ("12 WIDE", "10 TALL") and, when turned, its turn as an arc ("TURNED
  15°"). Each number is the very number in the file; each note is a control that opens − and + for it.
- **Move** drags the picked part's middle, in whole pixels (half pixels only by its − and +, since the file allows
  them). **Size** drags the edges and corners (the middle stays put, as the file's `x` and `y` mean). **Turn** drags a
  handle round the middle, snapping to 15°, finer with − and +. Arrow keys do the same as the tool chosen; Shift moves
  by 4.
- **The part's card** (in the Parts panel when picked): its name, its shape (Block or Round, with pictures), its
  colour (a choice of the figure's colours), its place, size and turn with − and +, "Bring forward", "Send back",
  "Copy this part" and Erase. Reordering also works by dragging in the list.
- **Add:** "Add a block" or "Add a round" puts a new part in the middle of the frame, in the picked part's colour (or
  the first), in front, named by its shape and the next free number ("block-2"), and picks it. Renaming is in the card.
- **Erase** removes the picked part, and with it its moves in every pose; the notice says how many poses changed.
  Undo brings it all back. The last part cannot be erased, and says why.
- **Colours:** each colour is a round swatch with its name ("body"). Touching one opens a picker: a grid of the
  game's palette (every colour the game's figures, tiles and backdrops already use) and a full picker beside it, with
  the `#rrggbb` shown as a label for anyone who wants it. "Add a colour" names it by what it is for, offering the
  usual names (body, trim, ink, eyes, cloth, metal) in the person's language, written to the file as the ids an agent
  would use. A colour still in use cannot be removed; the builder says which parts use it.
- **The outline** is a switch with a colour, in the Colours panel: "Edge round the figure".
- **Size of the picture** ("How big one picture is", width and height in pixels, and "Pixels in one tile") is in the
  Colours panel's foot under "Picture size". Making the frame smaller than a part's middle is refused in words before
  it is written, the same words the framework's check uses.

## Pose: how it stands

- **The Poses panel** lists the figure's poses, each with a small picture of it. The chosen pose is drawn on the
  canvas; the figure as its parts stand (the first pose, usually `idle`) shows faintly under it, so a person sees what
  moved.
- **In Pose mode, Move and Turn change the pose, not the part.** Dragging the arm in `run-1` writes a move for the arm
  in that pose (`dx`, `dy`, `turn`), never the arm's own place. The mode's control and a line under the pill say so in
  words ("Changing the pose run-1. The hero's own shape stays the same."). Size is not offered in Pose mode, because a
  pose cannot resize a part.
- **Put back** on a part's card removes its move from this pose. A move with nothing left in it is removed, never
  written as an empty move (the framework refuses one).
- **New pose** copies the chosen pose under a new name; **Erase pose** removes it, and if a character's clip plays it,
  says which clips use it and refuses (the character file would no longer load). Renaming a pose that a clip plays is
  refused for the same reason until the Clips part can rename both together.
- **Watch it move** (pending Q1): a strip at the foot of Pose mode lists the clips of the characters that use this
  figure ("Hero: run, jump, fall"); touching one plays it on the canvas at its own speed, looping, using the poses as
  they are on screen. It changes nothing.

## Players: colours for players 2 to 4

- The figure is shown four times side by side, one per player, in their colours. Touching a colour on player 2's
  figure opens the picker for that colour in player 2's set. Only colours that differ are written (the framework's
  `variants`: "only the paints that change").
- "Players 2 to 4 look like player 1" is the default when there are none. "Same as player 1" on a colour removes it from
  that player's set. The framework draws player 2 in the first set, 3 in the second, 4 in the third; the builder names
  them by player, never by the file's ids, which it writes as `two`, `three`, `four`.

## Play

Play in the builder shows the figure in the game: it opens the game's first level that has a thing with a character
drawn from this figure, and plays it there with the framework's built-in play (as World's Play does), from the files as
they are on screen, unsaved changes included. Stop returns to the builder. A figure no character uses plays nothing
and says so ("No character uses this picture yet").

## New figures (pending Q3)

If the Owner says yes: "New figure" on the game's page offers **a copy of one of this game's figures**, **a starter**
(the framework template's hero and crate, which the framework ships) or **blank** (one block, one colour, one pose
`idle`). The builder asks only for its name in words, and makes the id from it. Saving writes the figure file, its
picture and atlas, and the one entry listing it in `automata.toml` (`[[content]]` with `type = "figure"` and its
path), exactly as an agent or a framework command would write it. A character without a figure gets "Give it a
picture" on its card in World and in the Characters list, which makes a new figure and sets the character's `figure`
(one key in the character file).

The framework has no function today that adds a line to `automata.toml` while keeping the person's comments and
layout. The plan adds one to the framework (its own AF pull request, used by the editors and by an `automata`
command), rather than the editors writing TOML text of their own, so both make the same bytes.

## Saving, exporting and problems

- **Save** (signed in) writes, in one change: the figure file as `writeContent` writes it, its picture and atlas as
  `artFiles` paints them, and (for a new figure) the `automata.toml` entry and the character's `figure` key. The
  rules for saving straight in or as a suggestion, by the person's level, are unchanged.
- **Export** (anyone) copies the figure file for the person's agent, as World's Export copies a level, and also offers
  the picture as a PNG to keep. The stamp says "EXPORTED".
- **Problems** come from the framework's own check of the figure (`FigureSchema` and the character check): shown as
  you edit, in the panel that holds the thing at fault, never as a raw path. The builder refuses most of them before
  they happen (a limit reached says so: "A figure can have 32 parts at most").
- **Undo and redo** cover every change in all three modes. The unsaved figure is kept on the device as a draft
  (`af.draft:…`, already allowed) until saved or thrown away.

## The find bar and agents

Every action is in the find bar by its plain name and in `docs/commands.md` with the file change it makes: "Add a
block", "Add a round", "Erase head", "Move head left", "Make head wider", "Turn head", "Bring head forward", "Change
the colour body", "Add a colour", "New pose", "Change the pose run-1", "Put head back in this pose", "Colours for
player 2", "Edge round the figure", "Play", "New figure" (pending Q3). The test that fails on a find-bar action
missing from that list covers these too.

## First visit (pending Q4)

On the demo game, the first time Characters opens: the hero's figure, big, in Look mode, with one tip: "Tap the hero's
body", then "Pick a colour". The hero then runs on the spot in its new colour (its run clip, played once round), and
the tip ends as World's does: "Press Export" for a visitor (stamp "EXPORTED, copied for your agent"), "Press Save" for
someone signed in. Nothing else is explained; the tools, modes and panels are found by looking. The tips count as
World's do (`af.tip.*`).

The demo's hero has no figure on Examples' `main` today (its art arrives with the figures this builder makes). Until
it does, the first visit starts one step earlier: "Give the hero a picture", pick a starter, then the same tip.

## Words and languages

Every word is in `src/features/words/`, in all nine languages, in the drunk-grandma voice. The file's words never
reach the screen: a variant is "colours for player 2", a frame is "one picture", a paint is "a colour", a move is "how
it moves in this pose", `dx` is "moved right". A person's own names (a part called "head", a colour called "body") are
shown as they wrote them; the builder's offered names are translated on screen and written in the game's ids.

## Tests

- **Unit tests** of each edit: the file it writes for every action, in all three modes, including the cases the
  framework refuses (erasing a part removes its moves; a pose move put back to nothing is removed; a colour in use
  cannot be removed; frame smaller than a part).
- **Byte checks:** for every figure the builder saves in the tests, the bytes equal `writeContent` of the same value,
  and the picture and atlas equal `artFiles`; the canvas's pixels equal `paintFigure`'s at that zoom.
- **Agent parity:** a figure changed by hand in a test (as an agent would) opens in the builder with every field shown
  and saves back byte for byte when nothing is changed.
- **Journeys** (real browsers, the pretend GitHub, at phone upright and sideways, iPad upright and sideways, and
  desktop): the first visit as a visitor and as an Owner; make a part, colour it, pose it, give player 2 colours; New
  figure from a starter, used by a character, then Play shows it in the level; a suggestion-level save; every action
  done once by touch, once by buttons and once by keys; undo and redo through all three modes.
- **Pictures for the Owner review** at the five sizes, in the artifact format the Owner uses, saying plainly whether
  they show the final look.

## Constraints

- The framework pin must have everything the builder uses (`FigureSchema`, `paintFigure`, `artFiles`,
  `writeContent`, and the `automata.toml` writer if Q3 is yes). Moving the pin is its own pull request.
- It does not overlap the Blueprint redesign build: it uses that build's frame, panels, notes, find bar, words and
  journeys set-up, and starts after the frame and the level screen are on `main`.
- Nothing runs on a session's machine: every test is read from CI.
- No new dependency. The colour picker is built from the existing pieces.
- Touch targets 44 px or more, main buttons 48 px, tools 56 px; the figure is redrawn sharp at every zoom.

## Left to the builder (the plan)

- The zoom steps and how the figure is fitted at each size.
- The exact handles for Size and Turn, within the rules above.
- How the palette grid gathers the game's colours.
- How the frame-size change treats parts that would end outside it (refuse, or offer to move them in).
- How the work is cut into pull requests, keeping `main` green: the framework's `automata.toml` writer first (if Q3
  is yes), then Look, then Pose, then Players, then New figure and the first visit.
