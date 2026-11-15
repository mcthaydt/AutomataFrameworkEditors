# The 2D figure builder

Stage 1 (spec) of the Figures part of the Characters editor, in AutomataFrameworkEditors. Written 2026-11-15 with the
Owner through the coordinator. The first layer's spec in AutomataFramework
([`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
"The editors") and the editors' Blueprint redesign
([`2026-11-14-editors-blueprint-redesign-design.md`](2026-11-14-editors-blueprint-redesign-design.md)) still hold;
where this page is more exact about the Figures part, this page wins.

Its partner is the framework's
[`2026-11-15-rigged-figures-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-15-rigged-figures-design.md):
that page says what a figure file holds and how the framework paints it; this page says what a person sees and does.
The builder can change only what that file holds, so the framework's cycle comes first.

The Owner asked (2026-11-15) that every editor part get its own pipeline. This is the first.

## Principles served

- **5. Characters and scenes come from the environment builder and figure builder.** This is the figure builder. The
  Owner (2026-11-15): "the real art comes from the builders", and it "should be as complex as the 3D counterpart". The
  demo game's characters are made with it, so it is on the path to Release 1, ahead of the other editor parts.
- **2. iPad-first editors.** The figure fills the screen; every slider, piece and pose is changed by a finger, and
  every drag has buttons and keys beside it.
- **1. Agent-first.** The builder changes the figure file and nothing else (plus the picture and atlas the framework
  paints from it, and the one `automata.toml` line for a new figure). Every action has a plain name an agent's command
  also uses, and an agent editing the same file by hand gets the same bytes and the same picture.

It breaks none: 2D only (the 3D builder is the 3D layer's), its own repo, nothing ahead of its user (the demo game uses
it at once), and no new dependency.

## Why

The old 3D figure builder (AutomataFrameworkFailed's Studio, `packages/editor-3d/src/features/studio`, and the painter
behind it) made a whole person from sliders, dressed them from a library, walked them with a gait and posed them by
dragging their hands, feet and head. The Owner wants that power in 2D, so that a person who does not write code can
make a game's characters, the demo's first, and see them as the game draws them at every step.

## Decided with the Owner (2026-11-15)

| | Question | The Owner's answer |
|---|---|---|
| — | Where does the demo's art come from? | **From the builders.** The figure builder makes the demo's characters. |
| — | How powerful is it? | **As powerful as the old 3D builder.** The framework's format grows to match (its own spec). |
| Q1 | Does the Figures part change clips? | **No.** It changes the figure; clips are their own part ("Clips and kinds"). It can play them to look at. |
| Q2 | How is a 2D figure built? | **A 2D-native rigged figure** with the old builder's features (sliders, outfits, hair, face, held things, walks, stands, poses by hands and feet), not a port of its painter. |
| Q3 | Which views? | **Side, front and back.** The side view is mirrored to face left. |
| Q4 | Which bodies? | **People, four-legged animals and free shapes.** |
| Q5 | Can the builder make a new figure? | **Yes.** |
| — | Where do the hero's moves go? | **Characters, not Feel** (the Owner: "double jump, wall jump seem like components"). The switches for double jump, wall jump and dash are changed in a Characters part, not in this one (see "The Characters editor's frame"). |

Already decided before this spec, and not reopened: the Blueprint look (dark, canvas first, floating panels that close
and open like Claude's app, drawing notes over the real art, never restyling a game's art); palette No. 310, Fraunces,
Onest and JetBrains Mono, Phosphor regular icons; pinch to zoom and two fingers to move at every size; nine languages,
no default language, flags only in pickers; Save (signed in, with your team) and Export (anyone, copied for your agent)
kept apart; painted pictures committed and written by the editor's save; editors change only authorable content;
visitors open only the demo game.

## Goals

1. **A person makes a person, an animal or a free figure by touch**, from a starter, a copy or nothing, and sees it as
   the game paints it at every step, in every view.
2. **Everything the figure file holds can be changed** without typing: the body's and face's sliders, colours and
   palette, pieces from the library and the game's own, shapes on a bone, the walk and the stand, poses, views, player
   colours, outline and sizes.
3. **What is saved is the framework's bytes**: the file as `writeContent` writes it, the picture and atlas as
   `artFiles` paints them, and for a new figure the `automata.toml` line as the framework writes it, in one save.
4. **The demo's hero, keeper and critter, and the crate as a free figure, can be made with it.**
5. **The first visit to Characters ends in a real change in under a minute**, with no reading.
6. **Proven by journeys** at five sizes, by byte checks against the framework, and by an Owner review of every screen.

## Non-goals

- **Clips** (Q1), **behaviour** (Schematic), **the hero's move switches** (a Characters part of their own),
  **movement numbers** (Feel's Tuner), sounds and words.
- **3D figures** and more than three views.
- **Importing a picture** drawn elsewhere, or a pixel pencil: a picture with no numbers behind it breaks principle 1.
- **Lamps and a time of day lighting the figure**, and cloth or hair swaying in play: not in the framework's format (see
  its spec's non-goals).

## Anti-goals (a failure even if it works)

- A picture on screen that is not the framework's painting of the file (drawn another way, smoothed, tinted).
- A change that only a gesture can make.
- A field of the file the builder drops or rewrites when it saves something else.
- Words like "variant", "effector", "IK", "ramp", "atlas" or "frame" on a screen.
- A figure that saves but fails `automata check`.
- A first visit that starts with a wall of sliders, a page of words or a tour.
- Forty sliders shown at once. Power is there when asked for, folded until then.

## Approaches considered

1. **The old Studio's way of working, in 2D, on the framework's painter** (chosen). Its Look, Pose and Animate modes
   become Look, Move and Pose here (Animate is clips, which is another part); every change is a change to the figure
   file in memory, painted by the framework's own painter on each change, so what is seen is what the game draws.
2. **A part-by-part shape editor** (the first draft of this spec). Simple, but a person would be built block by block:
   far from the old builder's power, and the Owner said so. Kept for free figures only.
3. **A paint program writing PNGs.** No file an agent can change and paint again. Rejected.

## The Characters editor's frame

The level screen's frame (the redesign spec) holds: the pill top left, the cluster top right, tools on the left edge
(along the bottom when upright), floating panels that close and open, the title block and undo and redo bottom right.

- **The switcher** shows Characters chosen. Characters has its parts as a second row of tabs under the pill:
  **Figures** (this spec, working), **Clips and kinds** and **Schematic** ("Coming soon", each with the short card an
  editor that is coming has). The hero's move switches (double jump, wall jump, dash; the Owner, 2026-11-15) are a
  character's parts, so they belong with what a character is: the Clips and kinds part's spec places them, not Feel's.
- **The pill** reads the game's name and the figure's name ("Crate Game · Keeper"); pressing it opens the game's page,
  which gains a **Characters** list: each character with its picture, each figure, and **New figure**.
- **From World:** a picked thing's card gets "Change how it looks", which opens its character's figure here. Back
  returns to the level with the thing still picked.

### iPad sideways and desktop

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌Crate Game · Keeper┐ World ┌Characters┐ Feel Sound Story       ┌Find or do anything┐ ⚑ Share [Save] │
│  ┌Figures┐ Clips and kinds · Schematic                                                          │
│ ┌──────┐                                                          ┌ BODY ───────────────── ✕ ┐ │
│ │LOOK  │            · · · · · · · · · · ·                         │ Height        ──●──  30  │ │
│ │MOVE  │            ·      ▄▄▄▄          ·      ┬                 │ Build         ─●───      │ │
│ │POSE  │            ·     ▐◕ ◕▌  HEAD    ·      │ 30 TALL         │ Legs          ──●──      │ │
│ │PLAYER│            ·      ▀██▀          ·      │                 │ ▸ More: arms, hips, age … │ │
│ │PLAY  │            ·     ▐████▌ ○ hand  ·      │                 ├ WEAR ─────────────── ✕ ┤ │
│ └──────┘            ·      █  █          ·      ┴                 │ [tunic] [boots] [hood] +  │ │
│                     · · · · · · · · · · ·                         ├ FACE · COLOURS ────── ✕ ┤ │
│ ┌SIDE│FRONT│BACK┐  ⟲ turn                                         └──────────────────────────┘ │
│ ┌ DRAWING NOTES ● ON ┐                                    ┌ title block ┐   ┌ ↶ ↷ ┐            │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **The figure fills the middle**, painted by the framework at a whole-number zoom (each pixel a crisp square), on the
  ground colour with the pixel grid over it and the picture's edge dashed. A strip of the game's own ground under its
  feet, at the game's tile size, shows how big it is in the game. Beside it, smaller, the figure as it stands in the
  game's first level, so the person sees it among the art it lives with.
- **Views**, bottom left: Side, Front and Back (only those the file paints; "Add front and back views" when it paints
  only the side), and **Turn**, which shows it facing left. A view that is not painted is never shown as if it were.
- **Modes** are the tools on the left: **Look** (what it is and wears), **Move** (how it walks and stands), **Pose**
  (its poses), **Players** (its colours for players 2 to 4), and **Play**. Each is an icon with its word, 56 px or more.
- **Panels** on the right, each closable and openable (a ✕, and its name in a small row when closed, like Claude's app),
  change with the mode. Look has **Body**, **Wear**, **Face** and **Colours**; Move has **Walk** and **Stand**; Pose has
  **Poses**; Players has **Players**.

### iPad upright and phones

The same parts re-placed as the level screen re-places them: the modes along the bottom, the panels as one bottom
sheet with a tab per panel (pulled down to its title, or closed), the views in the pill's row, the figure keeping its
minimum height. On a phone held upright nothing scrolls but a panel's own list; the sheet covers at most the lower
third and the figure is fitted above it.

```
┌────────────────────────────┐
│ ┌Keeper · Characters ▾┐⚑[Save]│
│ SIDE FRONT BACK  ⟲          │
│        ▄▄▄▄                 │
│       ▐◕ ◕▌                 │
│       ▐████▌                │
│ ┌BODY · WEAR · FACE ─── ✕ ┐│
│ │ Height   ──●──   30     ││
│ LOOK MOVE POSE PLAYERS ▶ ↶↷│
└────────────────────────────┘
```

## Look: what it is and what it wears

### Body

- **Sliders**, each the file's own number with its plain sentence as its label ("How long the legs are"), in the order
  a person reads a body. The first three show (for a person: height, build, legs; for an animal: length, height,
  legs); **More** opens the rest in folded groups (Shape: shoulders, hips, arms, fat, muscle; Head and neck; Hands and
  feet; Stance: posture, hunch, head tilt; Age; Chunk). Each slider has − and + and a "back to normal" that removes the
  number from the file (the old Studio's rule: a slider at its default is not written).
- **Dragging the body** works too: with Body open, the figure grows handles at the top of the head, the shoulders,
  the hips and the feet. Dragging one changes the slider it belongs to, and the note beside it names it ("LEGS 0.45").
- **Surprise me** picks every body slider at random within its range; undo puts it back. It is how someone who does not
  know what to change gets started.
- A free figure's Body is the shape editor: its blocks and rounds, picked on the figure or in a list, moved, sized and
  turned by drag, buttons or keys, with their order and colours (the first draft's Look, kept for free figures).

### Wear

- **The pieces it wears** in a row of chips with pictures ("Tunic", "Boots", "Hood", "Lantern"), in the order they are
  drawn. Touching one opens its card: its colour and second colour (from the palette), its own choices the library
  gives it (sleeves long or short, a cape's length), which hand holds it for a held thing, Bring forward, Send back,
  and Take off.
- **Add** opens the library as a tray of pictures, in the kinds the framework's spec lists (tops, trousers and skirts,
  shoes, capes, hats and hoods, hair, face marks, held things; for animals, collars, saddles, coats and markings), each
  shown on this figure as it would look. The game's own pieces come first, marked "This game's".
- **Shapes on a bone:** "Add your own shape" puts a block or a round on a part of the body (picked by touching it:
  "On the chest"), moved and sized like a free figure's shape, for what the library does not have.
- **Outfits** are not named sets in this format; an outfit is what it wears. Another look for the same character is a
  copy of the figure (Copy this figure, on the game's page).

### Face

- Eye, brow and mouth styles as pictures to pick; then the sliders (eye size, spacing and tilt; brow weight; nose;
  cheeks; jaw), folded like the body's. The face is drawn big in the panel as well as on the figure, because at game
  size it is a few pixels.

### Colours

- **The palette's colours** as rows of swatches, each row a colour and its shades ("tan", four shades). Touching a
  named colour on the figure (its skin, its hair) or in the list, then a swatch, sets it. The figure is always shaded
  from the colour's row, so a person picks a colour, not a shade.
- **Add a colour to the game's palette** opens a picker; the builder makes the shades the way the framework's spec says
  and writes the palette file (it is authorable content, and other figures may use it). The palette can be changed only
  by someone whose level lets them change every file it touches; the save says which figures it changes.
- **Edge round the figure:** dark (each colour's darkest shade), one ink colour, or none.

## Move: how it walks and stands

- **Walk:** the figure walks on the spot (or along the ground strip, with "Walk across") using its gait. The gait is a
  choice of the library's and the game's ("Brisk", "Strut", "Loose", "Bounce", and for animals "Trot") with sliders for
  its numbers in plain words ("How long a step is", "How high the feet lift", "How much the arms swing", "How bouncy").
  Changing a number repaints the walk while it plays. The pictures it makes (`walk-1` to `walk-n`) show as a strip
  under it; touching one stops on it.
- **Stand:** how it stands still (the library's stands: "Hand on hip", "Arms crossed", "Thumbs in pockets", "Hands
  behind") and how much it breathes and shifts, shown as its idle.
- **Watch its clips** (Q1): a strip lists the clips of the characters that use this figure ("Hero: run, jump, fall");
  touching one plays it on the figure at its own speed. It changes nothing; "Change the clips" opens Clips and kinds
  when that part lands.

## Pose: its poses

- **The Poses panel** lists the figure's own poses with a picture of each, then the poses its walk and stand make
  (shown, not changed here: they come from Move). The chosen pose is drawn; the figure standing shows faintly under it.
- **Handles** on the hands, feet, head and hips, as the old Studio had: drag one and the arm or leg follows, bending
  only the way a joint can (the framework's limits). The note by the handle names what moved ("RIGHT HAND"); one that
  cannot reach further stops there and the note says so. Two-finger turn, or the Turn handle, turns a hand, a foot or
  the head.
- **Joint by joint:** picking a joint (touch it, or from a list) shows its two bends as − and + with numbers in
  degrees ("Bends forward 20°", "Bends out 5°"), for exact work; that is what the file holds too.
- **In any view:** a pose is one pose in every view. Dragging in Side changes the forward bends; in Front or Back, the
  out bends. The other views update beside it as small pictures, so a person sees the whole pose.
- **New pose** copies the chosen one under a name; **Mirror** swaps left and right; **Back to standing** clears it.
  **Erase pose** and renaming are refused, with the clips named, when a character's clip plays it.

## Players: colours for players 2 to 4

- The figure is shown four times side by side, one per player. Touching a colour on player 2's figure, then a swatch,
  sets it for player 2 only. Only colours that differ are written. "Same as player 1" removes one.

## Play

Play opens the game's first level that has a character drawn from this figure and plays it with the framework's
built-in play, from the files as they are on screen, unsaved changes included. Stop returns here. A figure no character
uses says so ("No character uses this picture yet") and offers "Give a character this picture" (it sets the character's
`figure`).

## New figures (Q5)

- **New figure**, on the game's page and in the find bar, asks first what it is: **A person**, **An animal** or **A
  shape** (pictures, no words needed), then where to start: **one of this game's figures** (a copy), **a starter** from
  the framework's library (a few people and animals, already dressed), or **blank**. Then its name in words; the id is
  made from it.
- A character without a figure gets **Give it a picture** on its card in World and in the Characters list, which does
  the same and sets the character's `figure`.
- Saving writes the figure file, its picture and atlas, and the one `[[content]]` entry in `automata.toml`, written by
  the framework's function for it (its spec), so an agent and the editors make the same bytes.

## Saving, exporting and problems

- **Save** (signed in) writes, in one change: the figure file as `writeContent` writes it, its picture and atlas as
  `artFiles` paints them, and, when they changed, the palette file, the `automata.toml` entry and the character's
  `figure` key. Saving straight in or as a suggestion, by the person's level, is unchanged.
- **Export** (anyone) copies the figure file for the person's agent, as World's Export copies a level, and offers the
  picture as a PNG to keep. The stamp says "EXPORTED".
- **Painting is in the page**: the framework's painter runs in the browser on each change (the same code as `automata
  art`). If a big figure's painting takes long enough to be felt, the plan may move it off the page's main thread; the
  bytes stay the framework's.
- **Problems** come from the framework's own checks, shown as you edit in the panel that holds the thing at fault,
  never as a raw path. The builder refuses most before they happen ("A figure can have 32 shapes at most").
- **Undo and redo** cover every change in every mode. The unsaved figure is a draft on the device (`af.draft:…`,
  already allowed).

## The find bar and agents

Every action is in the find bar by its plain name and in `docs/commands.md` with the file change it makes: "New
figure", "Make the legs longer", "Surprise me", "Wear a hood", "Take off the hood", "Change the skin colour", "Add a
colour to the palette", "Walk like Strut", "Make the steps longer", "Stand with arms crossed", "New pose", "Move the
right hand up", "Mirror this pose", "Show the front", "Turn to face left", "Colours for player 2", "Edge round the
figure", "Play". The test that fails on a find-bar action missing from that list covers these too.

## First visit

On the demo game, the first time Characters opens: the hero, big, in Look, with one tip, "Tap the hero's hat" (or the
piece the hero wears most visibly), then "Pick a colour". The hero then walks on the spot in its new colour, and the
tip ends as World's does: "Press Export" for a visitor (stamp "EXPORTED, copied for your agent"), "Press Save" for
someone signed in. Nothing else is explained; sliders, poses and the library are found by looking. The tips count as
World's do (`af.tip.*`). (This first visit is this spec's call, as the Owner's earlier first-visit question was
withdrawn with the rescope; the Owner may change it at review.)

The demo has no figures on Examples' `main` today. Until its figures are made, the first visit starts one step earlier:
"Give the hero a picture", pick A person, pick a starter, then the same tip.

## Words and languages

Every word is in `src/features/words/`, in all nine languages, in the drunk-grandma voice. The file's words never
reach the screen: a variant is "colours for player 2", a ramp is "a colour and its shades", an effector is "a hand",
a gait is "how it walks". A person's own names are shown as written; the library's names are translated on screen and
written as the library's ids.

## Tests

- **Unit tests** of each edit: the file it writes for every action in every mode, including what the framework refuses
  (a pose past a joint's limit, a piece on a bone the body lacks, a colour still used, a pose a clip plays).
- **Byte checks:** for every figure the tests save, the bytes equal `writeContent` of the same value, the picture and
  atlas equal `artFiles`, the `automata.toml` text equals the framework's writer, and the canvas's pixels equal the
  framework's painting at that zoom.
- **Agent parity:** a figure changed by hand (as an agent would) opens with every field shown and saves back byte for
  byte when nothing changes.
- **Journeys** (real browsers, the pretend GitHub, at phone upright and sideways, iPad upright and sideways, and
  desktop): the first visit as a visitor and as an Owner; New figure as a person, an animal and a shape, from a starter,
  a copy and blank; change sliders, wear and take off pieces, set colours and add one to the palette; set a walk and a
  stand; make and mirror a pose by its handles and joint by joint, in each view; colours for player 2; give a character
  the figure and Play it in the level; a suggestion-level save; every action once by touch, once by buttons and once by
  keys; undo and redo through every mode.
- **Pictures for the Owner review** at the five sizes, in the artifact format the Owner uses, saying plainly whether
  they show the final look.

## Constraints

- The framework's rigged-figure cycle (its spec, plans and builds) is on its `main` first, and the framework pin moves
  to it in its own pull request. The builder may ship by stages as the framework's plans land (people and the side view
  first), each stage only what the pinned framework can paint.
- It does not overlap the Blueprint redesign build: it uses that build's frame, panels, notes, find bar, words and
  journeys set-up, and starts after the frame and the level screen are on `main`.
- Nothing runs on a session's machine: every test is read from CI.
- No new dependency. Touch targets 44 px or more, main buttons 48 px, tools 56 px; the figure is redrawn sharp at
  every zoom.

## Left to the builder (the plan)

- The zoom steps and how the figure is fitted at each size.
- Which sliders show first for each body, and the folded groups' exact contents.
- The handles' look, and how they are hit on a small figure.
- How the library's tray is sorted and searched.
- Whether painting moves off the main thread.
- How the work is cut into pull requests that keep `main` green, following the framework's plans: likely the frame and
  a person's Look, then Move, then Pose, then views, then animals and free shapes, then Players, New figure and the
  first visit.
