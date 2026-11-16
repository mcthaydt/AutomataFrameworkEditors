# The World editor: the shell, World's Levels part and the world map

Stage 1 (spec) of the World slice's editor cycle in AutomataFrameworkEditors, written 2026-11-16, the day the Owner
approved the shell and World mockups ("approval of the mockups on board v17, stop design check", 2026-11-16 00:31 UTC;
the board is the Editor Mockups artifact, version 17, drawn from pull request 70). The approval lifts the hard stop on
editor code. This page says what the build makes, from the approved mockups, the framework's level links spec and its
plan, and the Owner's decisions. The plan (stage 2) is written from it.

The mockups are the picture of every screen: `docs/mockups/world-*.html` and `docs/mockups/shell-*.html` (each page's
first comment says what it shows and why). This page does not redraw them. Where a page and this spec differ, this
spec's words win and the difference is named here. The look itself (colours, fonts, glass, sizes, spacing, icons,
motion) is in the editors' design-language document, written alongside this spec in its own pull request; this page
does not repeat it, and the build reads both.

## Principles served

- **1. Agent-first.** Every action in World ends as a change to a documented file in the game's repo: a level, the
  world file, the sharing file, the editors' settings file, a notes file. Nothing a person does in World is kept where
  an agent cannot read it, and every control is held to the same limits `automata check` holds.
- **2. iPad-first editors.** Designed and tested on an 11-inch iPad Pro first, sideways then upright, then phone, then
  computer. Touch first, the Apple Pencil first-class, every drag also a set of buttons and keys.
- **3. Layers in order.** The shell holds nothing 2D-only (no stacked "layers" sheet, no tile rules, room for a third
  direction), so the 3D World reuses it whole.

It breaks none: no new dependency (Svelte 5, Pixi and the framework are already here), and nothing is built ahead of
its user (the test game in AutomataFrameworkExamples uses every part).

## Why

- The Owner (2026-11-13): agents are the main way a game is made; the editors change authorable content only, the JSON
  files the coding agents produce, for teams of technical and non-technical people, on an iPad.
- The roadmap, slice 3, items 5 and 6: build the shell (top bar, tools, panels, Help, Settings, tour, sign-in, Share)
  and World's Levels part, open a level, change it on an iPad, save it into the game; then test it in real browsers at
  iPad, phone and computer sizes with the journeys from the end-to-end check.
- The Owner's rules for World (2026-11-15): LDtk is the big inspiration; no auto-tiling rules at launch; nothing tied to
  2D; the Apple Pencil is first-class; "World" is the workspace and the things in it are levels; paths wait for the
  Characters slice (no walking critter); a door takes you straight into the next level; a new game starts with one
  level; levels join edge to edge by where they sit on the map, as one seamless place.

## What is here today

Read on 2026-11-16 (`main` at `565eb8d`; the framework pinned at `9109fa3`).

| Part | On `main` | This cycle |
|---|---|---|
| Sign-in, the API acting as the GitHub App, levels of access from `automata.access.toml` (`access`, `exchange`, `github`, `service`, `wire`) | built and tested | kept; the save grows to several files (below) |
| Opening a game with the framework's `loadGame`; the draft kept on the device (`af.draft:…`); keeping a copy; recent games (`game`) | built | kept; the draft grows to every changed file |
| Moving a thing in a level as plain functions, with undo (`levels/edit.ts`, `place.ts`, `compare.ts`) | built | kept and widened to every action below |
| The level drawn with Pixi at the framework's own fit (`levels/level-canvas.ts`) | built | becomes World's canvas |
| The screens (`suite`, `ui`, `Levels.svelte`): Blueprint-look first screens, Share, Waiting | built (the old look) | replaced by the approved shell; the logic under them stays |
| The framework's values on things, the world file and their checks (Plan W pull request 1, AutomataFramework #171) | merged in the framework, not yet pinned here | read through `loadGame` |
| Switches and gates, a place, doors, `paintLevel` and `paintWorld` (Plan W pull requests 2 to 5) | in progress in the framework | the pin moves after its pull request 5 (Plan W's gated task G5) |

The Blueprint redesign spec (`specs/2026-11-14-editors-blueprint-redesign-design.md`) drew an earlier frame. Its
screens are replaced by the approved mockups; its rules on words, languages, saving and onboarding stand where this page
does not change them.

## Goals

1. **One shell, six editors as workspaces.** The top bar, the game's menu, the editor and part menus, the toolbar of five
   tools, the panels that dock and fold, the find box, Settings, Help, the keys sheet, the language card, the welcome
   card and the four-step tour. Only World is built; the other five are rows in the editor menu that say they are
   coming, never a dead screen.
2. **World's Levels part, whole.** Open any level the game lists, see it as the game draws it, and with the five tools
   (Pick, Place, Paint, Erase, Join) move, place, paint, erase and join everything a level holds; change any value on a
   placed thing within its limits; undo and redo every step.
3. **The world map.** Every level on one sheet at its true size, where the world file puts it; doors as arrows, edge
   joins as bars, the start marked; push levels together and pull them apart, by drag, buttons or keys, with the check
   said on the map.
4. **Play in place.** The level plays where it is drawn, with the game's own touch controls, pause, one step, slow,
   start again, play from here and the last 30 seconds to drag back through.
5. **Putting changes in, by the person's level.** Changes are kept on the device as they are made; "Put in game" puts
   them in (Edit, Owner), "Send to check" sends them to someone who may approve (Suggest, Approve); the checker plays
   them, puts them in, asks for a change in words, or turns them down, each with a way back. Someone who has not signed
   in keeps a copy of the level as its file.
6. **Problems, said in plain words.** The framework's own check, run in the page, lists every problem with "Show me";
   a problem warns and never stops anyone, unless an Owner set the game to stop.
7. **Working as a team.** Who can change the game (the sharing file, from the game's menu), what changed (the game's
   history of content changes), notes pinned on a level, and a helper (an AI) whose changes come back as a ghost to
   keep or undo.
8. **Nine languages** for every word on a screen.
9. **Onboarding:** a first-time person learns what to do, how, and that they did it, from the language card to their
   first change in the game.

## Non-goals

- **The Tiles and Scenes parts of World** (my recommendation, the Owner's question Q1 below): they are World's next
  parts, each after its framework piece. Until then the part menu shows Levels only. Painting what the ground *is*
  (solid, ledge, empty, the tileset's kinds) is part of Levels and is built here; drawing a tile's picture and building
  a scene are not.
- The other five editors. Their mockups exist; their build is their slices'.
- Paths a character walks, and the walk itself (the Characters slice, the Owner, 2026-11-15). Join links a switch to
  what it opens and nothing else.
- Auto-tiling rules, and any rule editor (the Owner: not at launch).
- Rooms put together from a seed, and a "Try a seed" view (a later spike).
- The Tauri app for iPad, Android and desktop (Release 4). This cycle is the browser build.
- Deploying the editors (Release 2). Journeys run the built suite against a pretend GitHub in CI.
- Editing characters, figures, music or words. World reads a character's value declarations; the Characters editor
  writes them.

## Anti-goals (a failure even if it works)

- Anything a person does in World that an agent could not do with the files and the `automata` command.
- A control that lets a value pass its limits, or a save that writes bytes `writeContent` would not.
- A screen that fails the drunk-grandma test: a word from Git ("commit", "branch", "pull request", "merge", "repo",
  "token") on a screen, an action only a gesture reaches, a sheet with no way back, a wrong tap with no undo.
- A change reaching a game without the person pressing the button that puts it in.
- Anything that only works with a mouse, or only with a Pencil, or depends on Pencil pressure, double tap, squeeze or
  barrel roll alone.
- The level shrunk to make room for panels: on a sideways iPad the level gets the screen and the panels float over it.

## Approaches considered

1. **The approved shell in Svelte over the logic that exists, the level drawn by the framework's renderer (chosen).**
   The screens are rebuilt from the mockups as Svelte components in `ui` and new features; the level picture comes from
   the framework (its fit, its art, its renderer for play), and the editor draws its own marks (rings, handles, tags,
   arrows, bars, the faint thing under a hovering Pencil) on a layer above it. The plain functions under `levels`,
   `game` and the API stay and grow. One picture of the level in the editor and the game; the marks are the editor's
   own, so they can be touch-sized without touching the game's art.
2. **Everything drawn in Pixi, the marks and the panels too.** One drawing surface, but the panels lose the page's own
   text, focus, screen-reader and keyboard handling, and nine languages' text in Pixi is a second text system to keep.
3. **The mockups' HTML and CSS taken as the build.** Fastest to look right, but the mockups are static pictures with
   no state; every page would be rewritten anyway, and their CSS is layered round by round (later sections win), which
   is not code to keep.

## The shell

### The top bar

From left to right, as the mockups draw it at each size:

- **The game's square** opens the game's menu: Help, Settings, the keys, who can change it, what changed, keep a copy
  of this level as a file, your games, sign out (or sign in). Signed out, it is the shorter menu
  (`shell-menu-out`). On an upright phone the part's name opens it instead.
- **The editor button** ("World") opens the six editors, each with what it is for, World ticked; the other five say they
  come later and open nothing. A "Back to Level 1" button shows when a person came from another editor (later slices).
- **The part's name** ("Levels · Level 1", "Levels · Map") opens the part menu: World's parts (only Levels in this
  cycle), and on a phone the editors and the game's menu too, so nothing is more than one menu away.
- **Find** (the magnifier, or ⌘K): one box finds any value, thing, level or file and does any command, each with its key.
- **Undo and Redo,** then **Play** (the Owner, 2026-11-15: Play, Undo and Redo are in the top bar; the toolbar holds
  only tools).
- **The state of the changes**: "Up to date", "3 changes, only on this iPad" (the device's own word), "Waiting for Mia",
  "Send 1 more to Mia", "1 to check", "No internet", "3 problems". Each is a button that opens what it is about.
- **The main button,** by the person's level: "Put in game" (Edit, Owner), "Send to check" (Suggest, Approve), "Keep a
  copy" (not signed in, on the demo game). It shows only when there is a change.
- **Faces** of the people in the game, which open who can change it.

### The toolbar: five tools

Pick (V), Place (A), Paint (B), Erase (E), Join (L), with their keys on a computer. Each workspace gives the same five
its own meaning, so later editors reuse it. A tool's own settings sit just above the toolbar (a tray of things to
place, what to paint). On a phone and an upright iPad the toolbar has a second row ending in Show and the "Hold" tab.

**The free thumb's buttons:** Box, Fill and Erase while painting; Pick several, Drag a copy and Straight lines while
picking. They stand in for the keyboard's Shift and Alt, are held with the free thumb, and on a phone or an upright iPad
fold behind a "Hold" tab that unfolds with its words. A computer uses the keys and does not draw them.

### Panels

- **The list** (left): "In this level", grouped (Things, Zones, Ground) with counts, folding groups, locked rows, and a
  second tab, "Add things", the game's characters, each with how many times this level uses it. It starts closed on an
  iPad (a thin rail with List and Add; the Owner, 2026-11-15) and on a phone; open beside the level on a sideways iPad
  and a computer once opened.
- **The settings** of a picked thing (right): shown only when something is picked. Its Hide button leaves a floating tab
  at the right edge with the thing's picture and name written upright. On an upright iPad and a phone the settings are a
  one-line bar ("Crate 1 · settings") above the toolbar that pulls up into a sheet with Done; on a phone held sideways,
  the same tab as an iPad.
- **Docks float over the level, frosted** (the Owner, 2026-11-15), and "See-through panels" in Settings (Choose for me,
  On, Off; kept on this device) makes them plain. Choose for me follows the device's "fewer see-through things".
- **Row size:** 44-point rows for touch; small rows when a trackpad, a mouse or a hovering Pencil is in use. The size
  changes only when a panel opens or the pointer comes to rest, never under a finger or mid-drag.

### Settings, Help, the keys, the language

- **Settings** (one sheet, sections down its left; one long page on a phone): "For me" is kept on this device; "For
  everyone on Crate Game" is kept in the game's own files (the editors' settings file, below), and only an Owner may
  change it. In this cycle "For everyone" holds one choice: when a level has a problem, warn and still let changes in
  (the default), or don't let them in until it is fixed (the Owner, 2026-11-15).
- **Help** (the game's menu, or ?): the basics, each ticked once done, each with "Show me" that plays that tour step;
  the tour again; the keys and finger moves; ask your helper.
- **The keys sheet** (? or the keyboard button): every key and every gesture. Without a keyboard it shows only gestures.
- **The language card** comes first, before the welcome, with the device's language chosen: English, Spanish, Korean,
  Japanese, Chinese, Portuguese, French, Russian and German, each in its own words with its flag. Changed any time in
  Settings.

### Onboarding

The language card, then the welcome card (what this is, the three things you do; "Show me around" or "I'll look around
myself"), then the four-step tour: 1 the level, tap the crate; 2 the tools, tap Place; 3 the crate's settings, drag "How
heavy"; 4 Play, then "Put in game", which now shows because the crate is a change. Each step waits for the person to do
the thing and says when they have; Skip is always there; the ticks carry into Help. The device keeps only that the tour
was done and the ticks (`af.guide.done`, `af.tip.*`).

## World's Levels part

### The level

The level as the game draws it, fitted to the screen, with the editor's marks above it. Pinch and two fingers zoom and
slide; a single finger slides the view on empty ground with Pick, or once a Pencil is in use. "Whole level" and "Close
up" sit under List; a big level shows a small map at the top left with the part on screen boxed (drag the box or tap the
map to go there). A neighbour level shows only at the level's real end, as a short upright label ("to Level 5 →").

### Pick (V)

- Tap a thing to pick it; its settings open; a bar of everyday acts floats over it (Move, Make a copy, Delete, the three
  dots). Drag it to move it, lined up with the tiles when "Line up with tiles" is on, never into solid ground (the
  existing `moveThing` rule).
- **Move** opens four big arrows, a tile a tap; the arrow keys do the same.
- **The three dots** (and press and hold on a thing, the one job press and hold has): rename, lock (then "Unlock it"),
  hide (then "Show it"), copy to paste, bring to the front, send to the back, add a note. Each has its key. A locked
  thing says it is locked when tapped, with one button to unlock.
- **Pick several:** a loop drawn with the Pencil, the free thumb's Pick several, or Shift on a computer. Their shared
  settings show what they have in common ("Not the same" where they differ).
- **Press and hold on empty ground:** put a thing here, add a note here, paste. The same are in the toolbar and the
  three dots, so nobody needs the gesture.

### Place (A)

Its tray (above the toolbar, and "Add things" in the list) holds the game's characters. Tap one then tap the level, or
drag one straight in; a faint copy, lined up, shows where a tap would put it (with a Pencil, wherever the tip hovers).
A new thing takes the next free id (`crate-2`) and its character's defaults; no values are written until changed.

- **Only one of these:** a character with `one-per-level` (a goal, an exit) moves the old one instead of adding a
  second, after asking ("Move the goal here?"). A level has one start per player: placing another moves the first, with
  a note and Undo (the mockup `world-levels-one-start`; the spec's "A second Goal asks first").

### Paint (B): what the ground is

Picking "Ground" in the list picks Paint and fills the tray with what the ground can be, each a colour and a word: the
level's tileset's kinds, or Solid and Empty for a level without one. You paint what a place is; the look follows from
the tileset's own pictures, with no rules to write. Box, Fill and Erase are held with the free thumb; press and hold on
the level picks what is there. The things go faint while the ground is picked. "Show what it is" (in Show) tints the
level by kind. Painting over an edge that touches another level opens or closes the join, and the check says so.

### Erase (E)

Erases a thing (tap) or ground (drag), with Undo; the free thumb's Box erases an area.

### Join (L): what a switch opens

Draw from a switch (a button, a plate) to what it opens (a gate) with the Pencil or a finger; both ends are big enough to
grab, and a thing it may open lights up as the tip comes near. The arrow is the switch's `thing` value; its settings show
the same link as a list ("Opens", with "Nothing" first). Tap the line to pick it, and "Take this line away" leaves both
things where they are. A value that matters sits as a small tag, faint until its thing is picked (the value's `shown`).

### A thing's settings

Grouped as the mockups draw them: "Where it is" (from the left, from the top, in tiles), "Look" (looks like, drawn
behind, with the hero or in front), then the character's own values, in its declared order, each with its control:

| Value type | Control |
|---|---|
| `number` | a slider with its number shown, held to `least`, `most` and `step`; tap the number for the number pad with minus and plus; drag the number finer as the finger moves away; type on a keyboard; write with the Pencil |
| `switch` | an on and off knob |
| `choice` | a row of choices, or a list past four |
| `words` | the source language's words, and which message they are |
| `thing` | the arrow in the level, and a list of what it may link to |
| `leads-to` | a list of the game's levels, then where you come out: that level's start, or beside one of its doors; "Go to Level 2" |
| `path` | shown, not edited, until the Characters slice |

A line under each says what it does (the declaration's `about`). Every control reads its limits from the character
through `loadGame`, so the editor cannot hold a value `check` refuses. "Every crate starts like this" notes that the
character holds the defaults and a change here is for this thing only.

### Doors and edges inside a level

- A door's settings say where it leads and where you come out; a tag beside it says "To Level 2"; "Go to Level 2" opens
  that level at the door you come out of.
- An edge that touches the next level is drawn as the map draws it, a bar, with a card that says the hero walks
  straight across when you play; "Go to Level 3" opens it; Map shows the two side by side. The open stretch comes from
  the empty tiles, so painting ground over it closes it.

### A new level

From the map's "New level" or press and hold on its empty ground: never empty. A flat run of ground, the hero on a
start, a goal and, when the game has a fall-off rule, its fall band; named "Level 9" until renamed right there. One card
says what it has and offers the first two things to do. The new file is listed in `automata.toml` and placed in the
world file where it was made; all three are changes put in together.

### Show

Grid (Off, Tiles, Finer), line up with tiles, show what it is, how near you are, the frames each screen sees, "Draw with
a finger too" and "I draw with my left hand" (which mirrors the free thumb's buttons and the panels).

## The world map

"Map" (in the part menu and the top bar), or pinching out past the whole level, shows every level on one sheet at its
true size, where the world file's `at` puts it, each as the framework paints it (`paintWorld`, live). Doors are dashed
arrows from the door to where you come out; edges that touch where both are open are bars; the start is marked; a key
at the bottom says what each mark means. "Whole world" sits under List. The list shows the levels.

- **Tap a level** to pick it; its bar has Go in, Move, Pull apart (only when it touches another, and it says what that
  does) and the three dots (Rename, Make a copy, Delete). Press and hold opens the same menu.
- **Push together:** drag a level by its picture. Within a tile of another, the stretch where both are open shows as a
  dashed bar, with a line saying what letting go will do; where it came from stays as a dashed outline; nothing changes
  until it is let go. **Move** opens four arrows, a tile a tap, and the pad says in words when the next tap makes it
  touch. Levels snap to whole tiles.
- **Never on top of each other:** a level dragged over another turns red with a line saying so; let go there, it goes
  back.
- **The check, on the map:** an edge open on one side and solid on the other is a red dashed bar and a card with the ways
  out (clear the ground where they meet, move the level so the openings meet, pull them apart, or leave it for now),
  each one undoable. It is also in the problems list, whose "Show me" opens the map at it.
- **Delete** says it can be undone; after it, a note with Undo brings the level back with everything in it, and the
  doors into it with it. Deleting a level removes its file, its line in `automata.toml` and its place in the world file,
  and empties every door that led to it (each a change, put in together).
- A game with no world file is shown in a row, and the file is written at the first arrangement (the framework spec).

## Play in place

Play in the top bar plays the level where it is drawn, with the game's own touch controls over it on a touch screen.
The play bar: pause, one step, slow, start again, play from here (it waits for a tap, with a strip that says what a tap
does and Cancel; "From the start" goes back), the last 30 seconds to drag back through, and "Bigger", which hides the
panels (a "Smaller" button brings them back). One small card holds the change worth trying while it plays; on a phone it
is the play bar's "Try a change" button. Stop is in the top bar. A level in a place plays the whole place, as the game
does; a door opens its level in the editor too.

Playing changes nothing in the files. It uses the framework's own `startGame` on the edited content, so what plays is
what the game would play.

## Putting changes in

### On the device as you go

Every change is kept on the device as it is made, as the files it changes (a level, the world file, `automata.toml`),
each against the version it was made from (today's `af.draft:…`, one key per file). A reload or a trip to sign in loses
nothing. "3 changes, only on this iPad" counts them.

### Put in game, and Send to check

- **Edit and Owner:** "Put in game" opens a sheet: the changes in a list, a problem first if there is one (with Show me),
  and the button. Pressed, every changed file goes into the game in **one change** (the API's save widens from one file
  to several, in one commit, each file written by `writeContent` and the whole game loaded before anything is written,
  as today). A note says it worked and who has the changes now; "See what changed" opens the game's list of changes.
- **Suggest and Approve:** "Send to check" sends them to someone who may approve (the waiting change the API already
  makes, widened to several files). The top bar says "Waiting for Mia"; its sheet shows what she has and "Take them
  back". A change made while waiting is offered as "Send 1 more to Mia".
- **Someone who has not signed in,** on the demo game: "Keep a copy" keeps the level as its file first, and offers
  signing in only to open their own game; "Not now" closes it.
- **When it fails:** the sheet says what happened in plain words, that nothing is lost, and one thing to press (Try
  again). The top bar says "No internet" until it comes back. Nothing goes in without the person pressing it again.
- **When the game says problems come first** (the Owner's setting): the problem is the sheet's first thing, the button is
  there but switched off, with why under it.

### Two people changed the same thing

When the game changed under a person's changes, the editor lays their changes over the new version **thing by thing**,
by each thing's id (and the world file level by level). Where both changed the same thing, the sheet asks whose to keep,
and the level shows both places. Everything else goes in without a question. This is the same three-way merge GitHub
does on lines, done on the file's own pieces, so the bytes stay `writeContent`'s.

### Checking someone's changes

For a person who may approve: "1 to check" in the top bar opens a sheet over the level with the changes marked in
orange. "Not now" leaves it; looking is never a decision. Play them first; then "Put them in", "Ask for a change" (a box
for words, "Send to Sam" or Back) or "Don't put them in" (a plain no, no words, with Undo that brings them back under "1
to check"). What Sam sees after each is drawn (`world-levels-asked`, `world-levels-turned-down-sam`): his changes are
still on his iPad, and the top bar says "Send to check" again. Underneath these are the waiting change's approve, a
review that asks for changes with the words, and closing it; the screens never say so.

## Problems

The framework's own check, run in the page on the edited content (the same sentences `automata check` prints, in the
person's language where the framework has them), is listed under "3 problems": each in plain words, what to do, and
"Show me", which opens the level (or the map) at it, with a strip saying which problem it is, "Next problem" and "Back".
A problem never stops a change going in, unless an Owner chose otherwise in Settings.

## Working as a team

- **Who can change it** (the game's menu): the sharing file, `automata.access.toml`, as the Share screen edits it today,
  with the levels in plain words (can look, can suggest, can check and put in, can change, owner). A non-owner sees the
  same list as words, with one button that asks an owner.
- **What changed** (the game's menu, or "See what changed"): every change put in, newest first, who, what, which level,
  when; "Show me" opens that level with the change marked. Read from the game's history of its content files.
- **Notes** pinned on a thing or a spot: add from the three dots or press and hold; tap one to open it (what was said,
  by whom, answers, a box to answer, "Done: hide this note"). The team sees a note at once, before changes are put in;
  anyone who may look can read and answer. Notes are kept in a notes file, `automata.notes.toml`, on its own branch,
  `automata/notes`, in the game's repo (the Owner, 2026-11-16, Q2 = A), written by the App at once for anyone at Look
  or above. It never touches the game or runs its checks, and an agent reads it like any file.
- **Your helper** (an AI the person chats with, outside the editors): Help says what a helper is and what to tell it,
  and gives a copy of the level to hand it. When the helper changes a file the person has open (in the game, or as a
  file the person pastes back), the change comes back as a ghost on the level with Keep or Undo. Keep takes it into the
  person's changes; Undo drops it. The editor never talks to the helper itself.
- **Your games:** the first screen after signing in, each game with its picture, its name and what this person may do in
  it; a game missing from the list says to ask its owner. Sign out is here too.

## Files World writes

| File | When | Who |
|---|---|---|
| a level's file (`content/levels/<id>.json`) | any change in a level | by the person's level |
| the world file (`type = "world"`) | a map arrangement, a new or deleted level | by the person's level |
| `automata.toml` | a new, renamed or deleted level (its line only) | by the person's level |
| `automata.access.toml` | Who can change it | Owner |
| the editors' settings file, `automata.editors.toml` (my call: TOML, as everything that is not game content) | Settings, "For everyone" | Owner |
| `automata.notes.toml`, on the branch `automata/notes` | a note, an answer, done | anyone at Look or above |

Every content file is written by the framework's `writeContent`, so an agent editing the same file makes the same
bytes. `automata.toml` is changed only in the level's own line, with the framework's project writer if it has one, or
a line-exact edit the plan specifies, so a hand-written project file keeps its comments. The editors' settings file is
documented in `docs/teams.md`, as the sharing file is.

The device keeps only what CLAUDE.md lists (the drafts, the first-run tips and ticks, the sign-in, recent games) and
"For me" settings (`af.me.*`: see-through panels, draw with a finger too, left hand, row size).

## The Apple Pencil

Once a Pencil touches the screen: the Pencil does the tool; one finger slides the view; a finger tap still picks and
presses buttons ("Draw with a finger too" in Show turns this off). The Pencil's hover previews per tool (the faint thing
under Place, the brush outline under Paint, the light on the thing a tap would pick). The number box grows to take
handwriting when the Pencil comes near. Nothing depends on pressure, double tap, squeeze or barrel roll: the USB-C
Pencil has neither pressure nor double tap, and a web page probably cannot hear double tap or squeeze at all (to be
checked by the plan before anything leans on it; only the Tauri app may).

## Every size

Designed at an 11-inch iPad Pro sideways first, then upright, then a phone upright and sideways, then a computer. The
mockups draw every page at those five. Touch targets are at least 44 points, primary actions 48. Every drag also has
buttons and keys. Focus, picks and open sheets survive turning the device and the on-screen keyboard.

**Known layout issues to fix in the build** (seen on board v17; the Owner stopped the design check, 2026-11-16, so they
are the build's to fix, each with a journey picture that shows it fixed):

1. On a sideways iPad, the map's Move card covers Level 3, so the gap between two touching levels is half hidden. The
   card must sit clear of the picked level and the level it would touch.
2. On a phone, the join page's hint bubble sits over the gate. A hint must never cover the thing it points at.
3. On a phone, the map is panned so Level 1 is cut off. The map opens fitted to every level ("Whole world").
4. On an upright iPad, the settings sheet loses "Where it is" while a dropdown is open. A dropdown opens over the sheet
   without scrolling the group it belongs to out of sight.

## Words and languages

Every word a person reads lives in `src/features/words/`, in nine languages, English the source; a translation not yet
read by a native speaker is marked as such, as the game's are. No Git words on a screen. The mockups' words are the
build's words (they passed the plain-words checks of 2026-11-15); a word the build needs that no mockup has gets the
drunk-grandma test before it lands.

## What World needs from the framework

Each is on the framework's `main` or in Plan W; the plan checks each against the pinned commit and, where one is
missing, makes it a framework task first (framework first, then the pin, then the editor):

- Plan W pull requests 2 to 5 merged and the pin moved (G5): values with their declarations and `withDefaults`,
  `one-per-level`, the world file and `layoutWorld`, which levels join and their open stretches, `paintLevel` and
  `paintWorld` usable in a browser, every `check` sentence callable headless on content held in memory.
- `writeContent` for the world file, and a way to change one level's line in `automata.toml` without rewriting it.
- Playing in a mount the editor owns, with pause, one step, a slower speed, start again, start with the hero at a given
  spot, and going back through the last 30 seconds (re-running the recorded inputs to an earlier tick is enough, since
  the sim is deterministic).

## Testing

All in GitHub-hosted CI, never locally.

- Unit tests (Node) for every plain function: each edit and its undo, the per-thing merge, the several-file save, each
  value control's limits against the framework's own, the map's snapping, overlap and join wording.
- Component tests in the browser project for the shell's parts.
- **Journeys** in three browsers against the built suite, the real API code and the pretend GitHub, at an 11-inch iPad
  Pro sideways and upright, a phone and a computer, one for each journey of the end-to-end check: first open to the first
  change in the game (language, welcome, tour); place, move, paint, erase and join, each undone; a value at its limits;
  the map's push, pull apart, overlap, the wall card and delete with undo; a door followed in play; play in place with
  touch controls; put in game; send to check, ask for a change, turn down, undo; offline; problems first; two people on
  the same thing; signed out, keep a copy. Each also checks the opposite of every action and a visible way back.
- The screens journey takes pictures at every size for the four known layout issues and the whole of World.
- With a Pencil emulated (pointer type `pen`): the Pencil does the tool and a finger slides the view.

## Left to the builder (the plan)

- The features' names and order below `suite` (likely `shell`, `world`, `map`, `play`, `changes`, `notes` beside the
  existing `levels` and `game`), keeping the page side and the API side apart as `tests/architecture.test.ts` holds.
- How the marks layer sits over the framework's canvas, and how hit areas reach 44 points around small things.
- The per-thing merge's exact rules for a thing moved by one person and deleted by the other.
- How "What changed" reads the history within the App's permissions (contents and pull requests, read).
- How the pull requests split. A likely order: the shell frame and onboarding; Levels' Pick, Place, Erase and the
  settings; Paint and Join; the world map; play in place; putting changes in, checking and the merge; problems, notes,
  the helper's ghost and Find; the framework pin and the full journeys.

## Calls I made

1. The other five editors show in the editor menu with "Comes later" and open nothing, so the shell is whole and no
   row is a dead end.
2. The editors' "For everyone" settings live in `automata.editors.toml` in the game's repo, Owner only, documented in
   `docs/teams.md`.
3. Putting changes in is one change for every file it touches, so a new level, its line in `automata.toml` and its place
   on the map go in together or not at all.
4. Two people's changes merge thing by thing, by id; only the same thing changed twice asks.
5. The helper is outside the editors; its changes reach the level as a ghost to keep or undo, and the editor never calls
   an AI itself.
6. A new level gets a fall band only when the game has a fall-off rule (the game checklist's `lost`), since a level
   alone cannot hold one today.
7. `path` values are shown and not edited until the Characters slice.
8. "For me" settings are kept on the device under `af.me.*`; the build adds that key to the list in `CLAUDE.md` of what
   the device may keep.

## The Owner's questions

Asked through the coordinator, 2026-11-16, each with my recommendation; this page is written on the recommendations
and changes to match the answers.

1. **Which parts of World does this slice build?** A (recommended): the shell, Levels and the world map now; Tiles and
   Scenes are World's next parts, each after its framework piece. B: also Tiles now, which needs a framework format
   that keeps a tileset's pictures as JSON, painted by `automata art`. C: all three, which also brings Scenes back
   from the archive tag first.
2. **Where do notes live?** **Answered (2026-11-16): A**, `automata.notes.toml` on its own branch, `automata/notes`,
   written at once for anyone at Look or above, never touching the game. (Considered: the same file on the main branch,
   so every note runs the game's checks; notes waiting for a later slice.)
