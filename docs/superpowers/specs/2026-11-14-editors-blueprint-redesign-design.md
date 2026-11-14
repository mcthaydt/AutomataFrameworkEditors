# The editors' Blueprint redesign

Stage 1 (spec) of Cycle 3 in AutomataFrameworkEditors. Written 2026-11-14 with the Owner, one question at a time.
It replaces the restyle of Cycle 2 (plan `plans/2026-11-14-editors-restyle.md`, its audit, and draft pull request
12) as the description of how the editors look and how a first-time person gets in. The first layer's spec in
AutomataFramework ([`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
"The editors" and "Visual direction") still holds; where this page is more exact, this page wins for the editors.

## Principles served

- **2. iPad-first editors.** The level fills the screen and everything else floats at the edges, designed at iPad size
  first, then phone, then desktop.
- **1. Agent-first.** Every action has a plain name in the find bar, the same name an agent's command uses. The
  drawing notes write on the screen what is in the file, next to the thing it changes. Nothing new is kept anywhere
  but the game's files and the few device settings the editors already allow.

It breaks none: 2D only, its own repo, and no dependency the Owner has not said yes to (see "Constraints").

## Why

The Owner saw the editors as Cycle 2 built them (PR 12) and said they look nothing like the Blueprint mockup that
was agreed. They were right. PR 12 changed the colours, the fonts and the icons, but kept Cycle 1's frame:

- a tips banner and a header bar across the top, in the flow, taking about 200 px of an iPad's height;
- the level as a small box in the middle, with sky round it, instead of across the whole screen;
- coloured squares where the game's art should be (the editors still draw each thing as its character's box);
- the picked thing's card and the notes saying "ACROSS 6.5" and "DOWN 7.5", with four "Move" buttons;
- a tool strip of Notes, Copy this level and Save it as a file, instead of Move, Add, Paint, Erase and Play;
- the welcome, game and share screens as plain lists in one column.

The mockup (the "Notes on" screen in the private notes' moodboard) is the target, at every size. The bar is set
by the Owner: someone who opens this should be shocked it is not a funded startup; it should be to game engines what
Figma is to Photoshop; the first visit to the first change should be absolutely tight; and a drunk grandma should
always know what is happening and what to press.

## Goals

1. **Every screen looks like the mockup**, in the editors' palette (No. 310), at phone upright, phone sideways, iPad
   upright, iPad sideways and desktop.
2. **The level shows the game's real art**, drawn by the framework's own renderer, exactly as a player sees it.
3. **The first visit ends in a real change in under a minute**, with no sign-in, no tour and no reading: drag the
   crate, press Save, see the stamp.
4. **Every button on screen works.** Nothing is drawn that does nothing.
5. **Nine languages from the start**, with no language treated as the default.
6. **Proven by pictures and journeys**: an Owner review of every screen at five sizes, two audits after the build,
   and end-to-end journeys for every path below.

## Non-goals

- **Feel, Characters, Sound and Story themselves.** They are M3 work. Here they appear in the switcher as "Coming
  soon" and nothing more.
- **Paint and per-thing settings like "How heavy".** Paint arrives with World's Tiles part, and "How heavy" and its
  like arrive with Feel and Characters. Until then the tool strip has no Paint, and the card shows what a level file
  holds today (see "The picked thing's card").
- **A light theme** (later, with the same care), **merging changes that collide** (M3), and **the Tauri app**
  (Release 4).
- **New sign-in or saving rules.** Access levels, saving straight in or as a suggestion, approving: all unchanged.
  Only how they look and read changes.

## Anti-goals (a failure even if it works)

- A screen that keeps Cycle 1's frame with new colours on it.
- Any colour, filter, tint, outline or rounded corner put on the game's art.
- A button, tool or editor name that does nothing when pressed, or a greyed-out control a person must guess about.
- English, or any one language, assumed for a person whose device asks for another.
- A first visit that starts with a page of words, a sign-in wall or a tour of panels.
- A screen that fits only because something was made smaller than 44 px, or hidden.

## Decided with the Owner

Already decided before this spec, and not reopened: the Blueprint layout (dark, canvas first, tools floating, a
drawing-notes layer over the game's real art, never restyling a game's art); palette No. 310, Deep Slate Olive
`#253122` (ground), Sulphur Yellow `#f5ecc2` (words), Pinkish Cinnamon `#eeb480` (touchable) and Olive `#837e31`
(marks only); Fraunces, Onest and JetBrains Mono, with Noto Sans KR, JP and SC for Korean, Japanese and Chinese;
Phosphor regular icons, each with its word; the name "Automata Framework editors" and the wordmark `automata`;
phones get a minimum height for the level and the page scrolls below it; the GitHub App is "Automata Framework
Editors".

Decided in this spec's conversation (2026-11-14):

| | Question | The Owner's answer |
|---|---|---|
| Q1 | What does a first-time visitor see first? | **Straight onto the full-screen demo level.** A tip says "Drag the crate", then "Press Save". No welcome page. |
| Q2 | The mockup shows parts the editors do not have yet. What do the screens show? | **Build the mockup's frame for real now.** Find, Play, Add and Erase work; the switcher shows all five editors, World working and the other four "Coming soon". Paint comes with Tiles; settings like "How heavy" with Feel. |
| Q3 | English must not be the default. How do languages work? | **All nine now.** The editor opens in the device's language; if the device's language is not one of the nine, a language picker comes first. A language button stays top right; the choice is kept on the device. A check fails on any missing word. Pickers show **just the flag** (the Owner, 2026-11-14). |
| Q4 | What does a visitor's Save do on the first run? | **Two actions, Save and Export.** Save only works signed in with GitHub, and the screen shows it is for working with your team (Figma is a huge inspiration). Export gives the level's file. |
| Q4b | Does Export need signing in? | **No, anyone can Export.** A visitor's first run ends: drag the crate, press Export, the stamp "EXPORTED", copied for their agent. Beside it, Save says "Sign in to save with your team". |

The Owner's rule behind Q3, in their words: English is not to be "just like the default language". It applies to
every screen, every word and the order languages are listed in. What gets translated is the games and the editors
only; anything a browser's own translation handles well (the site, docs, this repo's docs) is not translated (the
Owner, 2026-11-14).

Why Save and Export are apart, in the Owner's words: saving is for collaboration, and Figma is a huge inspiration.
The framework's MCP server and the paid desktop editor apps (which let a person's agent use it) exist so a team's agents and people work on the same files; Save is
where a person joins that, Export is where anyone takes a copy away.

## Approaches considered

1. **Keep PR 12 and adjust it** (move the panels, add the missing tools). Cheapest, but PR 12's layout grid, its
   in-flow banner and bar, and its canvas of coloured boxes are the very things that are wrong. Every screen would be
   reworked anyway, on top of a structure that fights it. Rejected.
2. **Start again from `main`, reusing PR 12's sound parts** (chosen). The colours, fonts, icons, stamp, the notes'
   geometry, the notes' switch and redo are right and tested; they come over. The frame, the screens and the canvas are
   built new to the mockup.
3. **Only the level screen now, the other screens later.** Smaller, but the Owner asked for every screen, and the
   first run crosses several screens. Rejected.

### What happens to PR 12

PR 12 is not merged. The new plan names the parts it takes from PR 12's branch (by file, with their tests): the six
colours and `ui.css`'s tokens, the font set-up (`assetsInlineLimit: 0`, knip's ignores, `licences.txt`), `icons.ts`,
`Icon.svelte`, `Tool.svelte`, `Stamp.svelte`, `notes.ts`, `notes-mode.ts`, redo in `edit.ts`, `fitInside` in
`place.ts`, the contrast and measure helpers, and the five-size journey set-up from its screens branch. Everything
else (its `Levels.svelte`, `Floats.svelte`, `LevelScreen.svelte`, the guide strip, the list screens and the canvas)
is replaced. PR 12 is closed when the new execution branch opens, and its branch deleted.

## The look, exactly

The palette, fonts and icons are as decided above and as the first-layer spec's "Visual direction" says. These rules
make it Blueprint and not just dark:

- **Ground and paper.** The page is the ground colour. Floating panels are the raised shade (6% words in the ground)
  at 94% opacity with a 10 px backdrop blur, a 1 px edge of words at 35%, 3 px corners and one soft shadow. Nothing
  else has a shadow.
- **Touchable means touchable.** Pinkish Cinnamon is only on what a finger can act on: the main button's fill, the
  chosen tool's fill, the picked thing's ring, the values in notes, links. Nothing else uses it.
- **Olive is a mark.** Stamps' second line, a "Coming soon" tag, a problem's edge. It never carries words on raised.
- **Labels are drawing notes:** Onest, capitals made by CSS, letter-spacing 0.07em, at least 13 px. Tool words,
  notes, stamps, the title block and small headings are labels. Sentences and buttons are never capitals and are at
  least 18 px. Numbers and measures are JetBrains Mono, tabular, at least 15 px. Titles are Fraunces (Latin) with the
  words face for other scripts.
- **The drafting details** that make a screenshot read as Blueprint: the tile grid over the level; leader lines and
  measure lines with end ticks; the title block (game, level, editor, who saved last) in the bottom-right corner
  like a drawing's; the stamp at a slight angle; dashed rings. On list screens the same details hold: each card is a
  title block, each picture of a level carries its grid.
- **Motion:** 150 ms for controls, 200 ms for notes and panels, ease-out, no bounce. Notes draw themselves in, Save
  and Approve stamp, undo rubs the last note out. Reduced motion: plain fades of the same length.

## The frame: the level screen

The level screen is the product. Every other screen borrows its frame.

### iPad sideways and desktop (the mockup)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ┌ Crate Game · Level 1 ┐ ┌World┐ Characters Feel Sound Story   ┌Find or do anything┐ ◐◑ ⚑  Share  [ Save ] │
│ └──────────────────────┘                                        └──────────────────┘                        │
│ ┌────┐                                                                     ┌──────────────┐ │
│ │MOVE│              ·  ·  ·  ·  ·  ·  ·  the game's real art  ·  ·  ·  ·  │ CRATE         │ │
│ │ADD │                     ╭ Drag the crate anywhere ╮                     │ crate-1       │ │
│ │ERASE│                    ╰──────────╮──────────────╯                     │ ...           │ │
│ │PLAY│           [HOW FAR 6.5 TILES]──┤ ⌐crate¬          ┬ 3 TILES          └──────────────┘ │
│ └────┘                                                     ┴                               │
│ ┌ DRAWING NOTES ● ON ┐                                   ┌ title block ┐  ┌ ↶ ↷ ┐        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- **The level fills the whole window**, edge to edge, under everything. Nothing sits above it in the flow: no banner,
  no header bar. The level is fitted so the space the floating parts leave is where it is biggest; the sky and the
  game's backdrop run to every edge.
- **Top left, the pill:** the game's name and the level's name (pressing it opens the game's page: its levels,
  waiting changes and Share), then the editor switcher: World, Characters, Feel, Sound and Story, each with its
  icon and word. World is chosen. The other four carry a small "Coming soon" tag; pressing one opens a short card
  saying what it will do ("Feel will let you tune how the game moves and feels") and closes with one button.
- **Top right, the cluster:** the find bar ("Find or do anything"), the faces of the people in this game (or "Sign
  in" for someone who has not), the language button, Export, Share, and Save (the main button). Save carries the
  faces of the people it saves for, so it reads as "save with your team". A visitor sees Sign in where the faces
  go, no Share, and Save as "Sign in to save with your team"; Export is the main button for them.
- **Left edge, the tools:** Move (chosen at first), Add, Erase and Play, each an icon with its word under it, 56 px
  or more each way. Paint joins between Add and Erase when Tiles lands.
- **Right side, the picked thing's card**, under the cluster, when something is picked.
- **Bottom left, the "Drawing notes" switch**: on, faded, hidden, with its state as its word.
- **Bottom right:** the title block (game, level, World, "Saved by Sam, 2 minutes ago" or "Not saved yet"), then
  undo and redo together in the corner.
- **Words never lie on the art.** Anything written over the level has its own ground: a panel, a chip or the tip.
- **What just happened** floats: the stamp near the top centre, a notice as a small panel under the cluster. Nothing
  that just happened moves the level.

### iPad upright and phone sideways

The same parts, re-placed for the shape: the pill shortens to the level's name and the chosen editor (the switcher
opens from it as a list); the cluster keeps Find (as an icon with its word), the faces or Sign in, the language
button and Save, and Share moves into the pill's menu with the game's page; the tools run along the bottom edge
instead of the left; the card is a bottom sheet over the tools that can be pulled down to its title; the notes'
switch, the title block and undo and redo share the bottom row with the tools. Export sits in the pill's menu for
someone signed in; for a visitor it takes Save's place in the cluster. On a phone held sideways the level
keeps its minimum height and the floating parts may overlap the level's edges but never each other.

### Phone upright

```
┌────────────────────────────┐
│ ┌Level 1 · World ▾┐ ⚑ [Save]│
│                            │
│     the game's real art    │
│   ╭ Drag the crate ╮        │
│   ╰──╮─────────────╯        │
│      ⌐crate¬  [6.5 TILES]  │
│                            │
│ ┌ card as a bottom sheet ┐ │
│ MOVE  ADD  ERASE  PLAY  ↶ ↷ │
└────────────────────────────┘
   (page scrolls below the level's minimum height: notes switch, title block)
```

The top-right button is Save for someone signed in and Export for a visitor; the other one is in the pill's menu.
The level keeps a minimum height worth touching; below it the page scrolls to the title block and the notes'
switch. Find opens from the pill's menu and from the keyboard. Notes collapse to one chip by the picked thing that
opens the card, so a small thing is never buried.

### Every size

- Touch targets 44 px or more, Save and other main buttons 48 px, tools 56 px.
- Long names wrap; Save and the tools never shrink or get cut with an ellipsis.
- Picking a thing, a stamp arriving or a notice appearing never refits the level under a finger.

## The level and its art

- **Real art.** The level is drawn by the framework's own renderer (`loadArt` and the renderer the games use), from
  the game's own tiles, backdrop and figures, at the framework's own fit. A game with no art yet shows what the
  framework shows for it (each thing as its character's box): that is the game's look, not the editor's.
- **The framework pin moves** to a commit of AutomataFramework's `main` that has the art (M2 plan A), in its own pull
  request before the redesign's build, as this repo's rules ask.
- **The canvas draws the game and nothing else.** The ring, the grid, the measure lines, the notes, the tip and the
  stamp are page elements in a layer above it, so a test can prove the art is untouched (the canvas's pixels with
  notes on, faded and hidden are the same).

## The drawing notes

As the first-layer spec says, with these choices for what a level holds today:

- **What is picked gets notes:** its name chip ("CRATE-1"), its place as two measure lines with end ticks, from the
  level's left edge and from its top edge, each labelled with the file's own number ("FROM THE LEFT 6.5 TILES"), and, for a thing held by a joint, the joint drawn as a pin
  or a rope with its note. The grid shows over the whole level.
- **Each note is a control.** Tapping a measure note opens the same − and + as the card for that measure; tapping
  the name chip opens the card.
- **Notes read over any art:** chips are the ground colour with a 1 px words edge and touchable values; lines are
  the ground colour with a 1 px words halo.
- **The switch** (on, faded, hidden) is a device setting (`af.notes`, already on the allowed list once this lands);
  Play always hides the notes; the find bar has "Hide notes" and "Show notes".

## The picked thing's card

What a level file holds for a thing, in plain words, and nothing it does not:

- **Its title** is the character's name in words ("Crate"), with its id under it as a label ("CRATE-1"), and a line
  saying what it is when the game's files say ("A box the hero can push and stand on" comes from the character's
  description if the format has one; otherwise the line is left out, never invented).
- **Where it is:** "From the left" and "From the top", each the very number the level file holds (`x` and `y`,
  in tiles) with − and + (half a tile a press), the same controls the notes open. Dragging, the arrow keys and these
  buttons all move it. The card never shows a number the file does not hold.
- **What it is:** the character, as a choice of the game's own characters, each shown with its real art. Changing
  it changes the thing's `character` in the level file.
- **What comes later:** one quiet line, "How heavy, how bouncy and the rest: in Characters and Feel, coming soon".
- **Erase** at the foot of the card, as a plain button with the touch colour's words and an olive edge.
- A start point's card is the same, titled "Player 1 starts here", with its place and no Erase if it is the last.

## The tools

- **Move** (the default): touch a thing to pick it, drag it to move it; or pick it and use the card, the notes or the
  arrow keys. Touching empty space lets go.
- **Add:** a tray of the game's own characters, each drawn with its real art and named. Touch one, then touch the
  level where it goes (or drag it from the tray). The new thing gets the next free id ("crate-2"), as an agent would
  write it, and is picked.
- **Erase:** touch a thing to remove it; it fades out and the title block says "Not saved yet". Undo brings it back.
  A start point that is the last of its kind cannot be erased, and the tool says why on touch.
- **Play:** plays the level right there with the framework, from the files as they are on screen (unsaved changes
  included), notes hidden, the tools replaced by one "Stop" button top left. The game's own touch buttons and keys
  work as in the game. A level whose game needs its own code to play (code the editor never runs) says so plainly
  and offers to open the game's own page; the plan settles how that is detected.
- **Undo and redo** cover every change on the level: move, add, erase, character changes.

## The find bar

"Find or do anything": one box that finds every action by its plain name and does it. It opens by touch, by Ctrl or
Cmd and K, and by "/". It lists, filtered as you type in your language: the tools ("Move", "Add a crate", "Erase",
"Play"), the picked thing's actions ("Move crate-1 left"), "Save", "Undo", "Redo", "Show notes", "Fade notes",
"Hide notes", "Share", "Open the game's page", each level ("Open Level 2"), each language by its own name, and each
editor ("Open Feel", which shows its Coming soon card). Each action's name is also its documented name for agents
(`docs/commands.md`, a new file listing every action, its words in each language and the file change it makes); a
test fails when a find-bar action is missing from that list or the list names one that does not exist.

## Languages

- **Nine:** English, Spanish, Korean, Japanese, Chinese, Portuguese, French, Russian and German. No order puts one
  first: the picker shows them in a fixed order the plan sets that does not lead with English, and every list of
  languages in this repo follows the same order.
- **Pickers show just the flag** (the Owner, 2026-11-14): no language names on screen, no words around them. Each
  language has one flag, the same one the framework's language picker uses for the games' six; the plan takes the
  framework's table (from the framework's language spec, once it lands) and extends it with the same rule for French,
  Russian and German, so a language's flag is the same everywhere in the product. Each flag button still has the
  language's own name as its accessible name, for screen readers and for the find bar, but that name is never drawn.
- **Which one shows:** the language the person last chose on this device (`af.language`, a new device setting added
  to `CLAUDE.md`'s allowed list); else the first of the device's preferred languages that is one of the nine; else
  the language picker, before anything else, full screen: nine large flags, with no words in any one language
  around them.
- **The language button** (the current language's flag) sits in the top-right cluster on every screen and opens the
  same picker of flags as a panel.
- **Every word in nine languages.** All words stay in `src/features/words/`, one table per language. A test fails
  when a word is missing or empty in any language, or when a screen shows a word not taken from the tables. Words
  are written by agents in plain language at the drunk-grandma level in each language; the plan says how they are
  reviewed.
- **Fonts per script:** Onest and JetBrains Mono for Latin and Cyrillic, Fraunces for Latin titles only, and Noto Sans
  KR, JP and SC (approved in the first-layer spec) for Korean, Japanese and Chinese, loaded only for that language.
  Layouts are tested in all nine; German and Russian (long words) and Japanese (no spaces) are in the picture set.
- **Dates and numbers** ("2 minutes ago", "6.5") are written the language's way.
- **The game's own words are the game's.** The editors' language does not change the game's content.

## Onboarding: the first visit to the first change

The path, for someone who has never been here, on any device:

1. **They open the editors' address.** If their device's language is not one of the nine, the picker comes first:
   one tap. Otherwise nothing comes first.
2. **The demo game's first level opens, full screen, with its real art.** No welcome page, no sign-in. One tip, in
   the touch colour, points at the crate: **"Drag the crate anywhere"**. The crate's ring gently draws itself in.
   Nothing else asks for attention; the tools, Save and the rest are there, quiet.
3. **They drag the crate.** The notes draw themselves in as it moves, showing where it is. When they let go the tip
   moves on. For a visitor it points at Export: **"Nice. Now press Export to keep it."** For someone signed in
   into a game they may change, it points at Save: **"Nice. Now press Save."**
4. **They press it.** For a visitor, the stamp **"EXPORTED"** lands with "Copied for your agent", the level's file is
   on their clipboard (and a "Save it as a file" button sits under the stamp). For someone signed in, the stamp
   **"SAVED"** lands with "by Sam, just now" (or "Waiting for someone to approve"). This is the "you did it" moment:
   the first run is finished and stays finished on this device (`af.guide.done`).
5. **After that, one quiet line** under the stamp offers the next thing, never a tour: for a visitor, Save beside it
   reads "Sign in to save with your team"; for a signed-in person, "See your team's game".

A person who does something else (a tool, the find bar, the switcher) is never blocked: the tip waits and comes back
when they return to the level. A "Hide tips" button sits on the tip. The tip's words and its target come from facts
on screen, as today's guide does, so it can never point at something that is not there.

A visitor who presses Save instead of Export is not stopped cold: a small panel says "Save puts your change into
your team's game, so everyone works on the same thing. Sign in with GitHub to save." with "Sign in" (main) and
"Export instead". Their change is still on screen after signing in.

### The other first runs

- **Someone sent a link to a game** (signed out): the game opens if the link's game is the demo; for any other game,
  the level screen's frame with a calm panel on the ground: "This game belongs to a team. Sign in to open it." One
  button. After sign-in they land on the level the link named, with the same two tips.
- **An Owner starting out** (signed in, no games with the editor): the games page shows one card, "Add the editor to
  your game", with a picture of what will happen, and one button that goes to GitHub and comes back. When they come
  back their game is open on its first level, with the two tips.
- **Someone at Look level**: the level opens with the tools replaced by one line, "You can look around. To change
  things, ask Sam", and Play still works.

## The other screens

Every screen borrows the level screen's frame: the ground, the pill top left, the cluster top right, floating panels,
title-block cards. None is a plain list in one column.

| Screen | What it is in the redesign |
|---|---|
| **Language picker** | Full screen on the ground: the wordmark, then nine large flags, nothing else. |
| **Your games** (signed in) | A wall of title-block cards, one per game: a picture of its first level in its real art with the grid over it, the game's name, its people's faces, "2 changes waiting". "Add the editor to another game" is the last card. Can't-reach and not-a-game states are cards with a plain sentence and one button. |
| **A game's page** | The game's first level, faded, fills the back; over it, a floating panel with the game's title block, its levels as picture cards ("Level 1, changed by Sam yesterday"), the changes waiting (with faces), and Share for those who may. Look, Suggest, Approve, Edit and Owner each see only what they may do. |
| **Share** | A floating panel over the game's page, the way people know from shared documents: the people and their level as a choice each, "Add someone by their GitHub name", what anyone who signs in may do, and the link to copy. |
| **Changes waiting** | The game's page panel switched to the waiting list: one card per change, with its author's face and a small before-and-after picture. |
| **One waiting change** | The level screen's frame, read only: the level as it will be, in real art, with the notes marking what changed (each moved thing ringed, a dashed ghost where it was, its note "MOVED 2 TILES RIGHT"); a before/after switch; Approve (stamps "APPROVED") and "Turn it down" for those who may; its author sees "Waiting for Sam to approve". Failed checks and gone states are notices in the same frame. |
| **Sign-in** (going, cancelled, failed, signed out) | A calm floating panel over the level the person was on, never a page of its own; what they changed is still there after. |
| **Problems** (the game can't be read, the file changed elsewhere, can't reach) | A notice panel under the cluster with an olive edge, one sentence on what happened and one on what to press, and the button. The level stays visible behind when there is one. |
| **Leave without saving?** | A small panel over the level: "Leave without saving?", "Stay" (main) and "Leave". |
| **Coming soon** (the other four editors) | A small card from the switcher: the editor's icon, name, one sentence on what it will do, and "OK". |
| **Play** | The level playing full screen, notes hidden, "Stop" top left. |
| **Not found** (a bad address) | The frame with one panel: "There's nothing here." and a button to the demo game or your games. |

The plan lists every state of every screen (the journeys' current list of 43 pictures a size is the starting
point) and adds the new ones (picker, find bar open, Add tray, Erase, Play, Coming soon card, each language).

## Saving, and the stamps

Unchanged in what it does; restyled in what it says:

- **Edit and Owner:** the stamp "SAVED" with "by Sam, just now"; the title block updates.
- **Suggest and Approve:** the stamp "SAVED" with "Waiting for someone to approve"; the change is listed on the game's
  page.
- **Approving:** the stamp "APPROVED" with "by Sam".
- **The file changed elsewhere:** the notice says so, plainly, and offers to see the other version or keep theirs, as
  M1 does today.
- **Export (anyone, signed in or not):** the stamp "EXPORTED" with "Copied for your agent"; the file is exactly what
  the framework's `writeContent` writes; "Save it as a file" under the stamp. Export never changes the game.
- **A visitor's Save:** the "Sign in to save with your team" panel above; nothing is kept anywhere but the unsaved
  draft the editors already keep.

## Testing

- **Journeys** (real browsers, Chromium, WebKit and Firefox, the built suite against the pretend GitHub) for: the
  first visit in a supported language and in one that is not (the picker first), each language's level screen,
  drag then Save then stamp (visitor and signed in), Add, Erase, Play and Stop, the find bar doing each kind of action
  by keyboard and by touch, the switcher and a Coming soon card, the notes' three states, undo and redo of each kind
  of change, every access level's game page, Share, approving with its stamp, every problem notice, and leaving
  without saving. Each journey runs at the five sizes: phone upright (390 × 844), phone sideways (844 × 390), iPad
  upright (820 × 1180), iPad sideways (1180 × 820) and desktop (1440 × 900).
- **The art is untouched:** a browser test reads the canvas's pixels with the notes on, faded and hidden, and with a
  thing picked, and finds them equal.
- **Layout rules as tests:** no two floating parts overlap; nothing a person can press is under 44 px (48 for main
  buttons, 56 for tools); no word is cut; the level never moves when a thing is picked, a stamp lands or a notice
  shows; every word on screen comes from the words tables; every pair of colours a person reads passes contrast.
- **Words:** every language has every word; no banned word ("repo", "commit", "branch", "pull request", "token") in
  any language.
- **Commands:** the find bar's list and `docs/commands.md` match.
- **Tests run only in GitHub-hosted CI**, as always.

## Review: pictures, then two audits

- **The Owner sees pictures, not a branch.** Every stage that changes a screen ends with a Claude artifact of
  screenshots in the format of the earlier review page (every screen, in the order a person meets them, at phone
  landscape, phone portrait, tablet portrait, tablet landscape and desktop landscape), saying plainly whether the
  pictures show the final look. The mockup's "Notes on" screen is shown beside the real level screen at iPad
  sideways so the two can be compared.
- **After the build, two audits run, each over every screen at all five sizes:**
  1. **Opus, a drunk-grandma audit of the UI and UX:** could a tired, distracted person who has never seen a game
     editor tell, on each screen, what is happening and what to press? Is the first visit to the first change tight?
  2. **Fable, a visual audit for startup readiness:** would a person who sees this think it is a funded company's
     product, at the level of the best creative tools? Every place it falls short is a finding with a picture.
  Both audits are written to `docs/superpowers/audits/` and their findings are fixed in the fixes stage before the
  Owner's review.

## Constraints

- **Dependencies:** the four PR 12 packages (Fraunces, Onest, JetBrains Mono, Phosphor) and the three Noto Sans
  packages, all approved. If the plan finds it needs anything else (a translation library, for example), it stops
  and asks the Owner before it starts.
- **The strict page header stays.** No font, icon or script from another address; no inline script; no `data:`
  address.
- **The device keeps only what `CLAUDE.md` allows**, plus `af.notes` and `af.language`, which this redesign adds to
  that list.
- **An editor changes only content files.** Add, Erase and the character choice change the level file, written by the
  framework's `writeContent`, so an agent's edit of the same thing makes the same bytes.
- **The editors never run a game's own code.** Play uses only the framework's built-in play of the content.
- **Every word passes the drunk-grandma test** in every language, and no screen says "repo", "commit", "branch",
  "pull request" or "token".
- **Nothing private.** No other product's name, no strategy or pricing, in this repo.

## Left to the builder (the plan)

- The exact track sizes and breakpoints of each layout, within the rules above.
- How Play detects a level that needs its game's own code.
- The order of the nine languages in lists (not English first).
- How the translations are written and reviewed.
- Whether the "Coming soon" card links anywhere.
- The list of every screen state for the pictures and journeys.
- How the work is cut into pull requests: the framework pin first, then the frame, then the screens, then languages,
  or another order that keeps `main` green.
