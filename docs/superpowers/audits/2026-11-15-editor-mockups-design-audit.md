# The mockups of all five editors: design audit

Written 2026-11-15 on Fable 5.2. The Owner asked for it the same day: the mockups do not read as a professional game
tool that an experienced developer could realistically use, and this session can read the web, so the audit compares
them with the tools those developers use every day.

It serves principle 2 (iPad-first editors, with the desktop as a serious tool and not an afterthought) and principle 1
(agent-first: a person and an agent must be able to name the same thing). The bar is the redesign spec's: "what Figma
is to Photoshop", and a drunk grandma can still use it.

## What was read, and what was not

- **The mockups:** the twelve screens of pull request 34 (`docs/mockups/`, pictures from commit `82e11f8` on the
  `ci-screens` branch). All twelve were looked at at computer size (1280 × 800). Seven were looked at on an upright
  phone, two on a sideways phone and three on an upright tablet. The sideways tablet pictures were not opened.
- **This repo:** the redesign spec (`specs/2026-11-14-editors-blueprint-redesign-design.md`) for what is already
  decided, and the tracker.
- **The web:** 21 pages, listed under "Sources" with what each was used for. They are forum threads, vendors' own
  feature pages and two write-ups by working developers.
- **Not read:** Reddit and Construct's forum refused this session. No talk was watched. What this page says about
  GameMaker, Construct, Tiled, Wwise, Ink and GarageBand comes from knowing the products, not from a page read today,
  and each such line says "(not read today)".
- Nothing was run. No mockup was changed. This page proposes; the mockup thread revises.

## Verdict

**The Owner is right, and the cause is mostly one thing: every screen shows the first minute of a game, not the
hundredth hour.** One crate, one tree, four clips, three cards. A professional judges a tool by whether it holds a real
project: forty things in a level, twelve levels, two hundred lines of dialogue. The mockups never show that, and the
frame has nowhere to put it.

Three things are missing from every screen, and every tool a developer has used has all three:

1. **A list of everything here.** Unity calls it the Hierarchy, Godot the Scene tree, Unreal the Outliner, Figma and
   Aseprite the Layers list. The mockups have none: the only way to find a thing is to see it and touch it.
2. **A library of everything the game owns.** Unreal's Content Drawer, Godot's FileSystem dock, Unity's Project
   window. The mockups have an Add button and nothing that shows what there is to add.
3. **A full list of the picked thing's values.** Every engine has an Inspector. The mockups' card has two numbers.

Beyond those three: there is no way to pick more than one thing, no keyboard shortcut is shown anywhere, Play has no
pause or step, and at computer size the screen is spent on big touch rows that a mouse does not need.

**What is already better than the big engines, and must be kept:** the measure notes that write the file's own number
on the canvas; the jump drawn on the level in Feel; sound chips on the level; plain words; Save beside the faces of the
team; one frame shared by all five editors; every panel closable. None of the changes below removes any of these.
The task is to add depth behind the friendly first screen, not to replace it with a wall of panels.

## What the research says

Each line is something developers praise or complain about, with where it was read.

**Keep the work in the middle and let people arrange the rest.**
- Figma shipped floating panels in its 2024 redesign and took them back. Its own account: floating panels "hindered
  people who spend many hours a day in Figma", "cramped the canvas, especially on smaller screens", let the design
  "peek out from behind them", and "the nail in the coffin was learning that they slowed people down". Panels are
  fixed again, and resizable [S1]. This is the tool the spec names as the model, on the exact pattern the mockups use.
- Godot users ask to move panels where they want them, and the lead's answer keeps one distinction worth copying: side
  docks for lists and values, a bottom panel for wide things (timeline, tiles) that can fold away and grow over the
  canvas when needed [S2].
- Unreal 5's Content Drawer (a library that slides up on a key and goes away) is liked by newcomers for clearing the
  screen [S3], and disliked by long-time users only where it stops them pinning it open [S4]. Lesson: a drawer that can
  also be pinned.
- Unity puts its canvas tools in "overlays": small toolbars on the canvas that can be moved, collapsed and docked to an
  edge [S5]. That is the mockups' floating tool strip, done so that it can also be put away.

**A long list of values needs folding and finding.**
- Unreal's users on its Details panel: let people fold groups, keep what they folded, and do not undo it when they
  search [S6]. A values panel with groups that fold, and a search box, is expected.
- A Godot user rebuilt the 2D editor because of "jumping back and forth to the Inspector just to nudge a z_index by 1",
  managing layers for parallax by hand, and "silent failures when accidentally moving locked nodes" [S7]. Layer order,
  lock and hide must be on the canvas or in the list, one touch away.

**Play in the editor is the feature people miss most when it is weak.**
- "Godot doesn't let you interact with the scene in the editor when it's running, which is a bummer" [S8]. Godot 4.4
  then made the embedded game window and "interactive in-game editing" a headline feature [S9].

**The 2D tools people love do less and do it right.**
- LDtk (from the director of Dead Cells): "do less, but do it right" [S10]; a tool bar on the left and the level on
  the right; all levels seen together as a world and "switching between views is just a mousewheel-roll away";
  entities with typed values of their own; rules that draw the right tile by themselves; a documented JSON format; and
  backups [S11].
- Aseprite's manual lists what a pixel artist expects as the basics: layers, animation frames with onion skinning,
  selecting and transforming, a tilemap mode, sprite sheet export and a command line [S12].
- Spine's own list of what an animator needs: a dopesheet ("at the heart of animating"), a graph for easing, a preview
  that blends clips as the game will, inverse kinematics for posing, and skins [S13].

**Sound and story people come from their own tools.**
- A sound designer who used both: FMOD's event has its own timeline, "more straightforward and DAWish", with every
  rule for how it plays in one place [S14]. Events, a timeline per event and a mixer are the expected shape.
- articy:draft sells: nested flows, auto-layout, conditions and instructions on lines, variables, a localization view
  with filters and states (final, in progress, outdated; a changed source marks the others outdated), and voice-over
  per line [S15].
- Yarn Spinner sells to writers: a script that "reads like a screenplay", a graph of every node, and "play any of them
  without leaving the editor" [S16]. Writers want the text view and the map view of the same file.

**Touch tools earn "professional" with gestures and room.**
- Procreate: two-finger tap undoes, three-finger tap redoes, a pinch fits the canvas; and for people who cannot use
  several fingers, a small floating set of Undo, Redo, Zoom and Fit buttons [S17]. The mockups already have the
  buttons; the gestures are missing from the plans' words.

**Friendly is asked for, but not at the cost of depth.**
- A 2026 Unity thread asks for an easier interface, and is answered by professionals that ease is their "least
  important problem" beside missing and half-built features; one adds that Godot's nesting and modal dialogs stop
  scaling in production [S18]. Both are right, and it is the exact tension here: plain first screen, real depth behind.
- Defold's users, asked for pain points, name setup steps that are powerful but too many for a simple job, and ask for
  ready-made starting points and a live preview panel [S19].
- Daily friction is small things: a rename key, find-references, shortcuts that work every time [S20]. A values panel
  that can silently override what the code says is called out as a source of lost hours [S21]: an editor must show
  where a value comes from.

## Findings for the whole frame

Each has a number the changes list uses.

**F1. Nothing lists what is in the level, scene, figure or song.** Add one panel, in every editor, on the left:
**"Everything here"**. In Levels it lists the things by kind (Hero, Crate-1, Door-1); in Scenes the layers and what is
on each; in Figures the body parts; in Music the lanes; in Conversations the steps. Each row has its picture, its name
(rename in place), an eye to hide and a lock. It has a search box. Touching a row picks the thing and brings it into
view. It is closable like every panel.

**F2. Nothing shows what the game owns.** Add a **Library** drawer along the bottom: every level, scene, tile set,
figure, clip, sound, song and conversation in the game, as pictures, with search and kind filters. Drag from it onto
the canvas; press and hold for where a thing is used. It opens from a button and a key, closes by itself, and can be
pinned open. Add's tray becomes this drawer filtered to "what can go here". The pill's menu (the list of levels) stays
as the short way.

**F3. The card for the picked thing is too thin to work with.** A crate has two numbers. Make it a real values panel:
- groups that fold and stay folded (Place, Size and turn, Look, What it does, Your own values), and a search box;
- every number can be typed, and on a computer dragged sideways on its label; − and + stay for touch;
- a mark on any value changed from its default, with "put back";
- Flip, turn, in front and behind, lock and hide;
- "Your own values": named values a game's code reads (a door's key colour, a sign's text), as LDtk's entities have;
- under each plain label, small and in the mono face, the name the file uses (`x`, `y`), so a person and their agent
  can name the same value. It hides with the drawing notes.

Also put the thing's name in the panel's title ("Crate" where "The picked thing" is now): the title row is the most
valuable row on the panel and today it says nothing.

**F4. Only one thing can be picked.** Show, in at least one mockup: several things picked (a drag on empty ground
draws a box; on touch, a "Pick more" tool), the values panel for "3 things" with shared values, and a small bar by the
selection with Copy, Make another, Line up, Space out, Group and Erase. Press and hold (right click on a computer)
opens the same list as a menu.

**F5. No shortcut is visible.** Each tool shows its key in its corner on a computer (V Move, A Add, E Erase, Space
Play), buttons show theirs when the pointer rests on them, the find bar lists each action's key beside its name, and a
"Keys" sheet opens with `?`. On touch, the Procreate gestures: two fingers tap to undo, three to redo.

**F6. On a computer the frame wastes the screen and hides the level.** At 1280 × 800 the Levels card shows two values
in 760 pixels of height, and the level slides under five floating parts. Figma tried this and reversed it [S1].
Proposal, which touches a decision already made (the redesign spec's "tools floating"), so it is **the Owner's
question Q1**: on a computer the panels **attach to the edges** (list left, values right, library and timeline bottom),
resizable by their edge, and the canvas is the space between; each can still be closed, and each can be pulled off to
float. On touch sizes nothing changes: they float and become sheets as drawn.

**F7. Row size should follow the hand, not the window.** With a mouse, rows of 28 to 32 pixels and 14 pixel words
(the spec's label minimum is 13) give three times as many values per panel. With touch, 44 and 48 stay. A sideways
tablet with a mouse gets the small rows; a touch laptop gets the big ones. **The Owner's question Q2**, because the
spec sets sentences at 17 pixels.

**F8. Play is a button, not a tool.** Add to the frame, shown while playing: Pause, one step forward, slow (half and
quarter speed), Start again, and **Play from here** (the hero starts where the view is, not at the level's start).
Because the game replays exactly, add what no engine above has: a bar of the last 30 seconds that can be dragged back,
to see what happened and to try again from that moment. While playing, a touched thing still shows its values, live.

**F9. There is no place for the small facts.** On a computer, one thin bar along the bottom replaces three floating
parts (the notes switch, the title block, undo and redo) and adds what is missing: where the pointer is in tiles, the
zoom as a number that can be typed, the grid's size and a snap switch, how many things are picked, and "Saved by Sam,
2 minutes ago". The title block repeats the pill (the level's name is on screen twice); on a computer its facts move
to this bar. On touch the row stays as drawn.

**F10. Nothing shows what Save will send.** For a tool whose Save is a change to a team's game, add a **Changes**
panel: each thing changed since the last save in plain words ("Crate-1 moved 2 tiles right", "Jump is higher: 10 to
12"), with "put back" on each, and the same list on the Save button's sheet. Beside it, a **Problems** list for the
whole game (a missing word, a key used twice, a step nothing leads to), each line a link to its place. The mockups
show such problems only on the screen where they happen.

**F11. The tool strip is too short.** Four tools reads as a toy. Levels and Scenes need at least: Pick, Move the view
(hand), Add, Paint, Box (fill a rectangle), Fill, Erase, Pick up a look (eyedropper), Measure. A tool with choices
shows a small corner mark and opens them on press and hold. The second row under the pill becomes the tool's own
settings (brush size, shape, snap), as in Aseprite and Photoshop (not read today).

**F12. Show working with others.** The faces are on the Save button and nowhere else. Show one teammate's pointer and
name on the canvas, a note pinned to a thing ("Too far to jump? Mia"), and a waiting change as a mark on the thing it
changes. This is where the Figma comparison is earned, and the access levels (Suggest, Approve) already need it.

**F13. Show a real project.** Every mockup gets a second state, "mid-project": Level 3 of 12 with forty things, a
figure with all its parts, a song of 64 bars, a conversation of thirty cards. Reviews judge that state at computer
size first. The first-visit state stays as it is.

**F14. Faults in the pictures themselves.**
- Scenes, computer: the tree's card cuts "Behind" in half and the Light and sky panel cuts "Falling leaves".
- Music, computer: the Add a loop panel cuts "Bring in MIDI" and "Save as MIDI", and the title block covers the Motifs
  panel's corner.
- Cutscenes, upright tablet: the notes switch and the title block sit on top of the timeline's Words row.
- Feel: the "Soon" stamp sits on top of the Effects icon.
- Phone: the "Mockup" tag covers the Words filter row.
- Words: the columns have a flag and no name. A flag is a country, not a language (Portuguese is drawn as Brazil,
  Spanish as Mexico); write the language's own name beside each flag.

## Findings for each screen

### World: Levels

Good: the measure notes, the name chip, the first-visit tip.

- No list of things (F1), no way to see all levels at once. Add a **world view**: zoom far out and every level is a
  card on one sheet, as LDtk does [S11]; pinch or wheel moves between the two.
- Nothing shows what is joined to what. A button that opens a door should be a drawn line from one to the other, made
  by dragging, with the line's name as a note.
- No zones: where the level ends, where the camera may go, where the hero starts, areas that do something (a goal, a
  fall). Each is a thing with a dashed outline.
- No layers switch: show or hide the scene, the things, the zones and the notes separately.
- The card needs F3; the canvas needs rulers in tiles along the top and left on a computer.
- "What it is" (Crate or Hero) offers two kinds; with twenty kinds it needs the Library's search.

### World: Tiles

This was a guess, and it is the furthest from what a pixel artist expects [S12].

- The drawing is small in an empty screen. It should fill the canvas, with a 1× preview beside it.
- Tools are missing: line, box, circle, select and move, mirror (draw both halves at once), brush size, and a second
  colour on the other mouse button.
- Twelve colours are shown. The game palette has 256: show it as ramps (light to dark of one colour) with recent
  colours on top.
- **"How it joins" is the heart of a tile set and is only a picture here.** Make it the editor of the joining rules:
  the set's pieces laid out as corners, edges and middles, each slot filled or "drawn by rule", and a patch of ground
  to paint on as the test. LDtk's rules and Godot's terrains (not read today) are why people pick those tools.
- Per tile: what is solid (drawn as a shape on the tile, with one-way platforms and slopes), and what it does
  (slippery, hurts). None is shown.
- Tiles that move (water) need frames: the same strip of pictures as Clips.
- Bring in a picture, and save one out. Artists will arrive with tiles made in Aseprite.

### World: Scenes

Good: the "Hills slides 30%" note, Another one, Light and sky.

- Layers is closed. It is the main panel of a scene builder: on a computer it is open on the left (F1) with eye, lock,
  how far it slides, and drag to reorder.
- Paint has no settings: brush size, how thick, which material, scatter (many small things at once, each a little
  different). These sit in the tool's own row (F11).
- No frame for what a player sees: add outlines for phone, tablet and computer screens that can be switched on, since
  a scene is built for all three.
- "How leafy 0.8" has no unit and no ends. Say "a little" to "a lot" under the slider, and keep the number.
- A scene will hold hundreds of things. Show the mid-project state (F13), box-picking (F4) and the Library with ready
  groups (a clump of trees) to drop in.
- Time of day should be a bar to drag while watching the scene change, with the four names as stops, as drawn; add
  "play the day" to watch it run.

### Characters: Figures

Good: handles on the figure, the height note, the picture of it in Level 1, Surprise me.

- No list of parts. The old builder's power is in its parts: head, hair, body, arms, legs, each with pieces to pick.
  "Everything here" (F1) is that list, with hide and lock.
- On a computer the canvas is two thirds empty. Show Side, Front and Back together, at once, and the game-size figure
  beside them; "Turn" plays the turn.
- Wear is five chips. A real wardrobe is a grid of pictures by place (head, body, feet, hands) with search and colour.
  That is the Library (F2) filtered to this figure.
- Colours must be ramps from the game palette, one ramp per material (skin, cloth, hair), not single swatches.
- Pose is a tool here but nothing shows it: handles to drag a hand or foot with the limb following [S13], a ghost of
  the pose before, and "put back".
- Sliders show 0.40 and 0.45 with no meaning. Use ends in words ("narrow" to "wide") and keep the number.
- No way to keep versions of a figure side by side (the keeper in a red tunic). Add "Make another like it".

### Characters: Clips and kinds

The weakest screen, and it holds two different jobs.

- **Split it.** Clips is a timeline job. Kinds ("what the hero can do") is a values job and belongs in the values
  panel of the picked character (F3), under "What it does", with "Add something it can do". The move switches stay in
  Characters as the Owner decided; they move from a side panel to the character's own values.
- **Clips needs a real timeline** [S13]: a row for each body part with its keys, a playhead to drag, Play, loop and
  speed, the length of each picture shown as a width that can be dragged, a ghost of the picture before and after, and
  easing between poses.
- Marks on the timeline for what happens when: "footstep sound here", "the hit lands here". Sound and Feel both need
  them.
- A picture of which clip follows which: Stand to Run to Jump to Fall, with what causes each change. Without it nobody
  can tell why the hero is running. If this is what Schematic will be, say so on the "Soon" stamp.
- The clip always plays, small, beside the timeline, at the game's real size and speed.

### Feel: Moves

The best screen. No engine draws the jump on the level.

- Three values are shown; a platformer has twenty (how fast it falls, how quickly it stops, how long a late press
  still counts). Add "All the numbers": the full list, grouped, with search (F3).
- **Compare.** "Keep this as A", change things, flip between A and B on a key while playing. Add ready-made feels to
  start from ("floaty", "tight", "heavy").
- **Try the same run again.** Record ten seconds of play once, then replay those presses after every change and watch
  the hero land somewhere new. The game is exact, so this is cheap here and impossible in most engines.
- A small graph of the jump (height over time) for people who think in curves, closable.
- Pause, step and slow (F8) matter most here.
- Switches to draw what is solid, and where the hero's feet and head are.

### Feel: Controls

- **Touch is one sentence, and the project is mobile first.** Add a **touch layout** part: the phone's outline with
  the game's touch buttons on it, each draggable, with size, how see-through it is, and what it does; then the same on
  a tablet. This is the most important missing screen in Feel.
- A drawing of a gamepad with each button's action written on it, instead of "the bottom button".
- Tabs by device (Touch, Gamepad, Keys), in that order.
- "Try it": press anything and the matching action lights up, to prove it works.
- Per action: press, hold or double press; and how far a stick must move before it counts.

### Sound: Sounds

Good: chips on the level, Try another, the big Play.

- No list of every sound in the game (F1, F2). A game has a hundred; they need folders, search and "where it plays".
- **Variation is the first thing a sound designer sets** and it is missing: several takes of one sound picked at
  random, and "a little different each time" for pitch and loudness.
- The wave is a strip. Make it a place to work: drag the ends to trim, drag the corners to fade in and out, see the
  loop points.
- **A mixer:** Music, Sounds, Voices and Everything, each with a loudness slider and a moving meter, and "music gets
  quieter while someone talks". This is also where the game's volume settings come from.
- "Plays when" is fixed in the subtitle ("Hero, when it jumps"). Make it a value: pick the thing and the moment.
- Hear it in the level: Play the level with this sound alone, or with the others dimmed.
- Coin and Magic chips have nothing to do with a Jump sound; say "Start again from a kind" above them.

### Sound: Music

Good: lanes, whole loops, the motif mark.

- **No transport.** Play, Stop, loop this part, the speed (120 beats a minute), the key, a click to play along with,
  and the time at the playhead. A music screen without these does not read as a music tool.
- Each lane's header needs: quiet, alone (solo), loudness, and its instrument's name with a picture.
- Open a loop to change its notes. The Owner asked for whole loops and not notes as the way to *build*; making a motif
  "easy" still needs a place to tap out eight notes. A simple grid, opened by pressing a loop twice.
- **Music that follows the game** is why game composers use FMOD and Wwise [S14]: mark parts of the song (Calm,
  Danger, Won) and say what moves between them, and which lanes join in when. Even one line of it ("Drums come in when
  the door opens") changes this from a toy to a game tool. If the format does not hold it yet, show it as "Soon".
- The loop library needs filters by mood and speed, and should play in time with the song when tried.

### Story: Conversations

Good: cards with faces, labelled lines, the speech box preview, the faded card nothing leads to.

- **No "only if" and no "remember".** Real dialogue depends on what happened: a line shown only if the door is open; a
  choice that sets "met the keeper". Add both to the step's panel in plain words, and draw them on the card and the
  line [S15]. If the format does not hold them yet, this is the first thing to ask the framework for.
- **A script view.** The same conversation as a page of text that reads like a play, switchable with the map [S16].
  Writers type; a map of cards is slow for a hundred lines.
- A small map of the whole conversation in a corner, "tidy up" to lay the cards out, and groups that fold [S15].
- Try it needs a side list of what the game remembers, changing as you pick.
- On each card: a mark for a line not yet in all six languages, and a note field for the writer.
- "Everything here" (F1) lists every conversation, by who speaks.

### Story: Cutscenes

- The stage is small and the timeline floats over empty sky. On a computer the timeline belongs along the whole bottom
  edge, resizable (F6), with the stage filling the rest.
- **Transport:** Play, loop, step by one tick, snap on or off, zoom the time ruler.
- **More kinds of row,** added with a button: a sound, the music, an effect, a camera shake, "wait for the player to
  press", "hide the touch buttons". Each row has quiet and lock.
- Keys: pick several with a box, drag together, copy and paste, and see the ease as a small curve between two keys
  that can be bent.
- Time is shown in seconds only. The game runs in ticks; offer both.
- Markers with names along the ruler ("door starts opening").
- Dragging an actor on the stage at the playhead should make a key; say so in a tip.

### Story: Words

Good: the grid, the filters with counts, "the words it was made from changed".

- Language names beside the flags (F14).
- A search box, and sort by "newest" and "longest".
- **Does it fit?** Each cell shows a mark when the words are too long for the speech box in that language, and the
  preview shows the real box in that language and font.
- A column for a note to the translator and a small picture of where the line appears.
- Bring in and save out a sheet (CSV), because translators work in their own tools [S15].
- Words inside a line that must not be translated (a name, a number) are shown as chips.
- A bar per language at the top: "Korean 91%".

## The changes, in order

**First: without these it does not read as a professional tool.**

| # | Change | Finding |
|---|---|---|
| 1 | Add the "Everything here" list to the frame, in every editor | F1 |
| 2 | Add the Library drawer to the frame | F2 |
| 3 | Make the picked thing's card a full values panel: groups, search, typed numbers, the file's names, "put back" | F3 |
| 4 | Computer layout: panels attached to the edges and resizable, small rows with a mouse, one status bar (after Q1, Q2) | F6, F7, F9 |
| 5 | Picking several things, the selection bar and the press-and-hold menu | F4 |
| 6 | Keys shown on tools, buttons and the find bar; the Keys sheet; the two touch gestures | F5 |
| 7 | Play as a tool: pause, step, slow, play from here, drag back in time | F8 |
| 8 | Clips: a real timeline; kinds move into the character's values | Clips and kinds |
| 9 | Controls: the touch layout part and the gamepad drawing | Controls |
| 10 | A mid-project state of every screen, judged at computer size first | F13 |
| 11 | Fix the cut-off and covered parts | F14 |

**Second: the depth each editor needs to be believed by its own kind of professional.**

| # | Change | Screen |
|---|---|---|
| 12 | Tiles: fill the canvas, the missing drawing tools, palette ramps, the joining rules as an editor, solid shapes | Tiles |
| 13 | Scenes: Layers open on the left, the brush's settings row, device frames | Scenes |
| 14 | Levels: the world view of all levels, drawn links between things, zones | Levels |
| 15 | Figures: three views at once, the parts list, the wardrobe grid, posing handles | Figures |
| 16 | Sounds: the list of all sounds, variation, trim and fade on the wave, the mixer | Sounds |
| 17 | Music: transport, lane headers, the note grid for a loop, parts of the song | Music |
| 18 | Conversations: "only if" and "remember", the script view, the small map | Conversations |
| 19 | Cutscenes: timeline along the bottom, transport, more kinds of row, box-picking keys | Cutscenes |
| 20 | Words: search, "does it fit", notes for translators, bring in and save out a sheet | Words |
| 21 | Feel: all the numbers, A and B, try the same run again | Moves |
| 22 | The longer tool strip with press-and-hold choices and a settings row | F11 |
| 23 | The Changes panel and the Problems list | F10 |

**Third: what earns the comparison with Figma.**

| # | Change | Finding |
|---|---|---|
| 24 | A teammate's pointer, notes pinned to things, waiting changes marked on the canvas | F12 |
| 25 | Saved arrangements of panels ("Building", "Tuning", "Writing"), one per editor to start | F6 |
| 26 | A list of what was done, to step back through | F10 |

Changes 1 to 7 are the frame's and are drawn once. The redesign's build (the frame that is being built now) does not
have 1, 2, 4 or 5; whoever plans next should treat them as an amendment to that frame, not as part of one editor.

## Questions for the Owner

- **Q1. On a computer, do panels attach to the edges?** The redesign spec says tools float. Figma tried floating
  panels and went back to fixed ones for people who work in it all day [S1]. Recommended: yes on a computer (still
  closable, still able to float); no change on a phone or tablet.
- **Q2. With a mouse, may rows and words be smaller?** The spec sets sentences at 17 pixels and touch targets at 44.
  Recommended: yes, 14 pixel words and 28 to 32 pixel rows only when a mouse is in use; touch keeps today's sizes.

Until these are answered the mockup thread can draw everything else; change 4 waits.

## What this audit does not settle

- Whether the framework's formats hold what changes 14, 17 and 18 show (links, parts of a song, "only if"). Each
  editor's plan thread should check its own before a mockup promises it.
- Schematic and Effects are "Soon" and were not judged.
- The words on the new parts ("Everything here", "Library", "Changes", "Problems", "Keys") are proposals and need the
  usual drunk-grandma pass.

## Sources

Read on 2026-11-15.

- [S1] Figma, "Our approach to designing UI3": <https://www.figma.com/blog/our-approach-to-designing-ui3/>
- [S2] Godot forum, "Why doesn't Godot let you dock anything at the bottom", quoting the lead's dock proposal:
  <https://forum.godotengine.org/t/why-doesnt-godot-let-you-dock-anything-at-the-bottom-of-the-screen-and-you-cant-undock-console-debugger-etc-either/69453>
- [S3] Unreal forum, "Newcomer developer's critique of UE's UX":
  <https://forums.unrealengine.com/t/newcomer-developers-critique-of-ues-ux-website-editor-etc/1260422>
- [S4] Unreal forum, "The new UE5 Content Browser is introducing two major regressions":
  <https://forums.unrealengine.com/t/the-new-ue5-content-browser-is-introducing-two-major-regressions-compared-to-4-2x/524461>
- [S5] Unity manual, "Overlays": <https://docs.unity3d.com/Manual/overlays.html>
- [S6] Unreal forum, "Concerning direction of the UE5 UI Design":
  <https://forums.unrealengine.com/t/concerning-direction-of-the-ue5-ui-design/501345>
- [S7] Godot forums, "I got tired of Godot's 2D workflow":
  <https://godotforums.org/d/43901-i-got-tired-of-godots-2d-workflow-so-i-fixed-it-myself-in-c>
- [S8] Popcar, "Switching from Unity to Godot": <https://popcar.bearblog.dev/unity-to-godot-what-to-expect/>
- [S9] Godot 4.4 release page: <https://godotengine.org/releases/4.4/>
- [S10] LDtk, "Design philosophy": <https://ldtk.io/about/>
- [S11] LDtk home page: <https://ldtk.io/>
- [S12] Aseprite manual, contents: <https://www.aseprite.org/docs/>
- [S13] Esoteric Software, "Spine: in depth": <https://en.esotericsoftware.com/spine-in-depth>
- [S14] Javier Zúmer, "Differences between FMOD and Wwise, part 1":
  <https://javier-zumer.squarespace.com/blog/2022/6/28/differences-between-fmod-amp-wwise-part-1>
- [S15] articy:draft feature list: <https://www.articy.com/en/articydraft/feature-list/>
- [S16] Yarn Spinner home page: <https://www.yarnspinner.dev/>
- [S17] Procreate handbook, "Gestures": <https://help.procreate.com/procreate/handbook/interface-gestures/gestures>
- [S18] Unity Discussions, "Unity is not user friendly, compared to Godot":
  <https://discussions.unity.com/t/unity-is-not-user-friendly-compared-to-godot/1720981>
- [S19] Defold forum, "Defold pain points survey": <https://forum.defold.com/t/defold-pain-points-survey/81367>
- [S20] itch.io, notes after three weeks in GMEdit in place of GameMaker's own editor:
  <https://itch.io/t/1852535/dumped-gms2-editor-for-gmedit-some-feedback-notes-i-jotted-down-while-using-it-for-3-weeks>
- [S21] Defold forum, "Choosing Defold. Things I don't like about Godot":
  <https://forum.defold.com/t/choosing-defold-things-i-dont-like-about-godot-a-long-useless-rant/82899>
