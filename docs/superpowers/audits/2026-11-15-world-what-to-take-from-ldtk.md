# World: what to take from LDtk

The Owner, 2026-11-15: "for World, our big inspo is LDtk, what can we steal from that?"

LDtk is a free 2D level editor by the director of Dead Cells, "built from 20+ years of experience creating video
games". It is a desktop app for a mouse and keyboard. This page lists what World should take from it, how each idea
changes for an iPad and for our own rules, and what to leave behind. It belongs with round 1 of the grill
([`2026-11-15-editor-mockups-round3-grill-1-shell-and-world.md`](2026-11-15-editor-mockups-grill-1-shell-and-world.md));
finding numbers below are that report's.

Read for this: LDtk's own site and docs (the pages are listed at the end) and our level format
(`src/features/content/level.ts` in AutomataFramework). Where a point comes from my own knowledge of LDtk and not from
a page read today, it says so.

Two rules from the Owner, given the same day, shape every pick:

- **No auto-tiling rules at launch.** So LDtk's rule editor, and anything that needs one, is not in the first
  editors. Pick 7 is marked "later" for this reason, and the Tiles rules pages leave the launch mockups.
- **The same editors will serve 3D later.** 3D is a layer added on top, never mixed in. So each pick has an "In 3D"
  line saying how it carries over, and nothing below ties the shell to flat ideas only.

"Cost" below means: **Mockup** = it can be drawn now, in this round. **Format** = the game's files would have to hold
something new, so it needs a framework spec first and the mockup can only show the intent.

---

## The one idea underneath LDtk

**You say what a place is. The editor works out how it looks.**

In LDtk you do not paint grass tiles. You paint "wall" with a plain coloured brush, and rules turn walls into grass
tops, dirt and corners by themselves. You do not write a door's wiring in code. You drop a Door, and its values
(which key, where it leads) are fields on it that you see in the level. The person makes decisions about the game;
the tool does the "boring part of the skinning job" (LDtk's words).

Our files already work this way: a level's ground is rows of letters, and the look comes from a tileset or a scene.
The mockups do not yet show it. That is the biggest thing to take. It also needs no auto-tiling rules: the
look can come from the scene's ground, which the framework already paints from the level's shape.

---

## What to take, in order of worth

### 1. Paint what it is, in plain colours, and let the look follow. (Mockup)

**LDtk:** a layer of plain values ("walls", "water", "ladder"), each with a name and a colour. Rules paint the tiles.
One switch shows the plain values without the art.

**For us, with no rules at launch:** Paint in Levels offers "what it is", three to six choices with a colour and a
word each: Ground, Ledge you can jump up through, Ladder, Water, Danger. The look comes from the level's scene, which
paints the ground from its shape, so the art appears as you paint with no rule to write. A "Show what it is" switch
in the view settings tints the level by kind, for checking where the hero can stand.

**In 3D:** the same idea is painting blocks or floor areas by kind, and the look comes from the 3D scene. "What it
is" is a list of kinds, not a list of flat tiles, so nothing here is 2D-only.

**For iPad:** the choices sit in a tray above the toolbar while Paint is picked (finding 9), never in a far panel.

### 2. The row you pick decides the tool and what is on offer. (Mockup)

**LDtk:** there is one panel, on the left. Pick a layer in it and the palette under it changes to what that layer
holds: values to paint, tiles to stamp, or things to place. You never choose a tool and then hunt for what to use it
with.

**For us:** tap "Ground" in the list and Paint is picked, with the ground kinds in the tray. Tap "Things" and Place
is picked, with crates, buttons and doors in the tray. Tap "Scene" and the scenery brushes come up. This answers
finding 6 (placing is drawn nowhere) and finding 33 (Levels and Scenes look the same): whatever row is picked is
sharp, the rest go faint.

**For iPad:** one tap does two jobs, which is exactly what a touch screen needs.

**In 3D:** unchanged. The list's rows are kinds of content (ground, things, scene), not flat layers stacked by
depth. Keep the word "layer" off the screen so 3D does not inherit a flat idea.

### 3. Values on a thing, with their type, drawn in the level. (Format for new kinds of value; Mockup for showing them)

**LDtk:** a thing has "custom fields" with a type and limits: a whole number "within [0,100] bounds", a choice from a
list, a list of up to three choices, a size "displayed as a circle around the entity", a value "displayed above the
entity". From my own knowledge of LDtk: a field can also be a path of points or a link to another thing, drawn as a
line between the two.

**For us:** the mid-project mockup has a Button and a Door and nothing shows that one opens the other. Take this
whole: a link is an arrow from the button to the door, made by dragging from one to the other. A patrol path is
drawn on the level (the "Draw path" tool already exists for it). A reach or a hearing distance is a circle. A
value that matters ("3 hits") sits as a small tag on the thing. Limits come with the value, so a slider cannot go
past them.

**For iPad:** dragging a link with a finger needs big ends to grab and a clear target glow. Tags are faint until the
thing is picked.

**In 3D:** unchanged, and more needed there. An arrow, a path and a reach are drawn in the view the person is
looking through. A reach becomes a ball. The values themselves have no dimension.

**Format:** today a placed thing holds its kind and its place only. Links and per-thing values need a framework
spec. That spec should give a place as a named set of numbers, so a third number can be added later without a new
format.

### 4. The world map: all the levels on one sheet. (Format)

**LDtk:** "levels are organized in worlds and you can seamlessly transition between views." Three layouts: in a
line, free, or snapped to a grid of rooms. You "reorganize all your levels using plain old simple drag-n-drop", and
moving between the level and the world is "a mousewheel-roll away".

**For us:** pinch out past "fit" and the level shrinks into a map of every level as a small picture. Drag to
arrange, tap to go in. While inside a level, its neighbours show faintly at the edges. It replaces the "Level 1 ▾"
menu as the way to move about a game, and it is part of the answer to finding 30 (no picture of a real, big game).

**For iPad:** pinch is the natural gesture; this is better on touch than LDtk's wheel.

**In 3D:** the map stays a flat sheet of pictures, as the maps of 3D games are. What matters is "what leads to
what" (this door goes to that level), which has no dimension. So the spec should record the joins first and treat
"where a level sits on the sheet" as the editor's own arrangement.

**Format:** a game today names one starting level and nothing says where levels sit or how they join. Needs a
framework spec (what leads to what, then where each level sits on the map).

### 5. "Only one of these": the editor keeps the rule, not the person. (Mockup)

**LDtk:** "you could limit the amount of PlayerStart entity to 1. Adding more will simply move the existing
PlayerStart."

**For us:** placing a second Start for player 1 moves the first. Placing a second Goal asks "Move the goal here?".
No error, no red triangle after the fact. Our files already limit starts to one per player, so this is behaviour
only.

**In 3D:** unchanged.

### 6. Box, fill and "pick this" while painting. (Mockup)

**LDtk:** "Hold SHIFT + click and drag to draw a rectangle", "SHIFT + a single click to fill an entire area", right
click to erase. From my own knowledge: holding Alt and clicking picks up whatever is under the pointer and switches
to its layer.

**For us:** these are the first jobs for the hold-buttons of finding 11. With Paint picked, the left edge offers
Box, Fill and Erase to hold with the free thumb. Press and hold on the level with Paint picked means "paint with
this": it picks up what is under the finger. A Pencil's double tap swaps Paint and Erase.

**In 3D:** the hold-buttons stay and gain 3D jobs (hold to turn the view, hold to move along one direction only).
This is the main reason to build them as a general "held with the other hand" strip and not as paint options.

### 7. Later, not at launch: ready-made rules, so nobody writes one. (Not in this round)

The Owner: no auto-tiling rules on launch. So this is recorded and parked.

**LDtk:** rules live in named groups. From my own knowledge: a rule can be mirrored with one tick, can fire by
chance for variety, and newer versions have a helper that makes a whole rule set from tiles laid out in a standard
pattern.

**When it comes:** the right form for us is that helper and the test patch, never the rule grids as a main page.
Until then the two Tiles rules pages ("The rules for Slope", "Fits next to", "Rules for it") come out of the launch
mockups, and Tiles is drawing a tile, its colours, what the hero can stand on, and how it looks in the game. The
Owner's earlier "test patch first" answer is kept for that later day.

**In 3D:** tile rules are a flat idea. Leaving them out at launch also keeps the shell free of it.

### 8. A picture of every level, made on save. (Mockup for the editor; a framework command for agents)

**LDtk's "Super Simple Export":** "a few PNGs per levels, a tiny JSON for your entity data and that's it." One
picture per layer and one of the whole level.

**For us:** this is an agent-first feature more than an export. An agent that can open a picture of the level after
its own change can check its own work. The same pictures feed the world map (4), the Share list ("Moved 3 crates"
with a before and after) and "Keep a copy". The framework already paints levels for CI's pictures; this would be a
command that writes them.

**In 3D:** a picture is a picture. Unchanged.

### 9. One panel, and values beside the thing. (Mockup)

**LDtk:** "the main tool bar on the left and the current level on the right". There is no inspector column. A
thing's values open in a small window beside it.

**For us:** the Owner has decided panels dock, and that stands. LDtk is one more reason for two of the grill's
fixes: the inspector shows only while something is picked (finding 1), and the picked thing's most-used actions sit
in a small bar beside it (finding 5).

**In 3D:** a 3D view needs the screen even more than a flat one, so both fixes matter more there.

### 10. A public record of how the files change. (Docs)

**LDtk:** "a well documented JSON format", a schema file, a "list of JSON changes" and "deprecation cycles" so
people who read the files are warned before something goes.

**For us:** we have the schema. A plain list of format changes, kept with it, is cheap and is what other teams and
their agents will need once games outside this project exist.

---

## What to leave behind

- **Its words.** IntGrid, Entity, Enum, Auto-layer, Defs, Instance. Every one fails the grandma test. Ours: "what it
  is", "things", "choices", "the look".
- **Its hands.** Right click to erase, the wheel to change view, Shift and Alt for everything. All need the
  stand-ins from finding 11.
- **The rule editor, at launch.** LDtk's docs need a three-step tutorial to make the first rule. It is the hardest
  part of LDtk. The Owner: no auto-tiling rules on launch.
- **Flat-only ideas in the shell.** LDtk says of itself "no isometric 3D here". Ours must take a third direction
  later, so the shell avoids "layers" as stacked sheets, "left and top" as the only two directions, and tile rules.
- **Setting things up in windows away from the level.** In LDtk you define layers, things and lists in separate
  panels before you can place anything. In ours, agents write those files; the editor shows the level and what can
  go in it.
- **One big project file.** LDtk keeps everything in one file by default and offers "separate level files" as an
  option. Ours are separate from the start, which is what lets two people's saves merge.
- **Its looks.** LDtk is dense and small, made for a mouse on a big screen.

---

## Where the mockups already match LDtk

A list grouped by depth in Scenes; "Try another tree" and "Shuffle them" (LDtk's random mode); a draft kept on the
device (LDtk's backups and crash recovery). The rule grids, the mirror switch and the test patch also match LDtk,
and now wait until after launch.

---

## The 3D test, applied to round 1's fixes

Checked against the grill's fix list. Nothing in it is 2D-only, with three things to word carefully:

- **A place is "From the left" and "From the top" today.** Keep the words, but lay the rows out so a third ("From
  the front") can join them, and never squeeze the two onto one line as a fixed pair.
- **"Drawn: Behind / With the hero / In front"** is how a flat game fakes depth. In 3D it is simply where the thing
  is. Keep it as a value of the thing, not as part of the shell.
- **Hold-buttons, the action bar on a picked thing, the number pad, numbers on sliders, Play in the top bar, the
  closed rail** all carry over unchanged. The hold-button strip is the natural home for turning the 3D view.

---

## Questions for the Owner

1. **Fold the picks that need only drawing into this round's fixes?** Picks 1, 2, 5, 6 and 9. Recommended: yes.
2. **Values and links on things, shown in the level** (pick 3)? It needs a framework spec for what a placed thing
   may hold. The mockup would draw the intent now. Recommended: yes.
3. **The world map** (pick 4)? It needs a framework spec for where levels sit and how they join. The mockup would
   draw it now. Recommended: yes.

Picks 8 and 10 are framework work, not mockup work, and are noted for the coordinator. Pick 7 waits until after
launch.

---

## Pages read

- ldtk.io (home): the feature list and quotes above
- ldtk.io/docs/general/world/ (layouts)
- ldtk.io/docs/general/auto-layers/ and /auto-layers/auto-layer-rules/ (rules, the "pure values" switch)
- ldtk.io/docs/general/intgrid-layers/ (painting, box and fill)
- ldtk.io/docs/general/editor-components/layers/, /entities/ and /enumerations-enums/
- ldtk.io/docs/game-dev/json-overview/ and /super-simple-export/

Not read today, and marked in the text as my own knowledge: links between things, paths as a field, picking with
Alt, mirror and chance on rules, and the helper that builds a rule set.
