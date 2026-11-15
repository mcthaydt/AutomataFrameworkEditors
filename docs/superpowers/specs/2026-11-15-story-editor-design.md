# The Story editor (2D)

Stage 1 (spec) of the Story editor's own cycle in AutomataFrameworkEditors. Written 2026-11-15 with the Owner. The
Owner asked that every editor get its own full pipeline (2026-11-15: "every editor tab is really" large enough for its
own sessions), so this page covers Story alone. It builds on the Blueprint redesign
([`2026-11-14-editors-blueprint-redesign-design.md`](2026-11-14-editors-blueprint-redesign-design.md)), which sets
the frame, the look, the languages and the first visit for every editor; where this page is silent, that page holds.
The first layer's spec in AutomataFramework
([`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md))
puts Story's two old editors, Writer and Sequence, into this one.

## Principles served

- **1. Agent-first.** A conversation, a cutscene and a game's words are already JSON files an agent writes and the
  framework checks in plain sentences. The Story editor writes exactly those files, byte for byte as `writeContent`
  writes them, so a person and an agent work on the same thing. A save that still needs words in other languages is
  an ordinary waiting change an agent can finish.
- **2. iPad-first editors.** A conversation is a map of cards you pinch and move, a cutscene is the level's real art
  with a camera frame you drag, and every part works by touch first, at iPad size first.

It breaks none: 2D only, its own repo, and no new dependency.

## Why

A game's story is the part a non-technical teammate most wants to touch: what the keeper says, what the player can
answer, the moment the camera swings to the door. Agents write the first version; the Story editor is where the
writer, the designer and the translator on a team change it without reading JSON, and where a native speaker
checks their own language. If this is clumsy, the team goes back to asking the agent for every word, and the editors
fail their reason for being.

## Goals

1. **A conversation reads as a map.** Every step and every choice is visible at once, as drawing cards joined by
   labelled lines, on the same canvas, pinch and notes as World.
2. **People write words, never keys.** A person types what is said; the editor makes the message key and puts the
   words in the right messages file.
3. **A cutscene is staged on the real level.** The camera is a frame drawn over the level's real art, dragged and
   pinched; actors are dragged where they stand; time is a timeline under it.
4. **Every word in six languages, as a team job.** The Words part shows every word a player reads in the game's six
   languages, says what is missing, and lets a native speaker mark their language as read.
5. **The game's `main` stays green.** No save puts a game in a state its own check fails.
6. **The first run ends in a real change in under a minute**, the way World's does: change one line, press Export or
   Save, see the stamp.
7. **Proven by journeys** in three browsers at five sizes, and by pictures for the Owner.

## Non-goals

- **Behaviour rules** (a critter that wanders or runs). The framework files them under Characters, so they are the
  Characters editor's.
- **New story features in the framework**: conditions, facts, standing, storylets, a typed-out line, fades and
  shakes. Story edits what the framework's formats hold today (with plan T's four additions), nothing more. A field
  the formats gain later joins Story then.
- **Machine translation.** The Owner chose the team way (Q2 below); no translation service is used.
- **Sound in a cutscene** (Sound's), **the figures and clips themselves** (Characters'), **the level a cutscene is
  staged in** (World's).
- **Arranging the map by hand.** Cards are placed by the editor from the file (see "The map"); nothing about their
  places is saved.

## Anti-goals (a failure even if it works)

- A message key, a node id or a tick count shown to a person as the way to do something.
- A save that turns a game's checks red, or one that quietly fills a language with another language's words.
- A conversation shown only as a list, so a choice that goes back to an earlier step cannot be seen.
- English, or the game's own language, treated as the language everyone reads. The editor's words follow the
  person; the game's words are the game's.
- Anything drawn on, tinted or outlined on the game's art, in the cutscene preview or the speech box.

## Decided with the Owner (2026-11-15)

| | Question | The Owner's answer |
|---|---|---|
| Q1 | What fills the screen when someone opens a conversation? | **A map of cards.** Each step is a drawing card on the canvas, joined by lines; each choice is a labelled line; it pinches and moves like a level; tapping a card opens it, with the speech box shown as a player sees it. |
| Q2 | A game needs every word in all six languages, and an Edit save goes straight in. When someone writes a new line, what happens to the other five? | **The save waits as a suggestion** ("Waiting for words in 5 languages") until every language has the words; teammates or the team's agent write them in the Words part; then it goes in. |
| Q2b | May a native speaker mark words as read in the editor? | **Yes**, as the one exception to "content files only": the editor may write `automata.translations.toml`, with the framework's own writer. |

The answers rejected, for the record: a script read top to bottom, and the level with the speaker standing there,
for Q1; a translation service filling the five, and refusing the save until an agent adds them, for Q2.

## Approaches considered

1. **Two editors, Writer and Sequence, as in the old repo**, each with its own screens. Matches the old work, but the
   first layer's spec merges them into Story, and a conversation's last step can start a cutscene, so the two are one
   story. Rejected.
2. **One Story editor with three parts in World's frame** (chosen): Conversations, Cutscenes and Words, each a canvas
   with floating panels, sharing the pill, the cluster, the find bar, the notes, pinch and Save. One product, one way
   to work, and the Words part is where the six-language rule becomes a team job.
3. **A script-first editor**, a long scrolling document of every conversation, with cutscenes as blocks inside it.
   Easiest to read on a phone, but it is a page of words, not a canvas, and it hides branches. The Owner chose the map
   (Q1). Rejected.

## What Story edits

Only these, all already in the framework's formats or in plan T's additions to them:

| File | What Story changes |
|---|---|
| `conversation` files (Story: Writer) | Steps (`nodes`): who speaks (`speaker`), their lines (`lines`, message keys), the choices (`choices`: the words and where each goes) or what follows (`next`), the cutscene a last step plays (`cutscene`, plan T), and which step it opens on (`start`) |
| `cutscene` files (Story: Sequence) | Length, camera keys (place, zoom, how it gets there), actor keys (who, place, clip, facing), lines on screen (from, until, words, who), and whether it plays when its level opens (`opens`, plan T) |
| `messages` files, one per language | The words behind every key, in each of the six languages |
| a `character` file's `conversation` and `name` (plan T) | Who starts a conversation by being walked up to, and a character's shown name, which is words |
| `automata.translations.toml` | Which translated words a native speaker has read (Q2b), written with the framework's `markRead` and `writeReadMarks` |

Everything is read with the framework's `loadGame` and written with `writeContent` (and `writeReadMarks`), so an
agent's hand edit of the same thing makes the same bytes. Every problem a person sees is the framework's own
sentence (its schema and checks, and `translationProblems`), shown on the card, key or cell it is about.

**Keys are made, never typed.** A new line's key is the file's id, the step's id and its place, like
`keeper.hello.2`; a choice's is `keeper.hello.choice-1`; a cutscene's line `door-opens.line-1`; the next free
number when one is taken. *My call:* the same rule an agent is told in the framework's content skill, so both make
the same keys. Step ids are made the same way from the step's first words ("hello", "ask-about-the-door"), at most
32 characters, and are shown only as a label under the card's title, like World's "CRATE-1".

## The frame

Story uses World's frame as the redesign spec describes it, at every size: the level-or-canvas fills the window;
the pill top left (the game's name, then what is open: "Keeper" or "Door opens" or "Words", then the switcher with
**Story** chosen); the cluster top right (Find, the faces or Sign in, the language button, Export, Share, Save);
tools on the left (or along the bottom on iPad upright and phones); the picked thing's card on the right (a bottom
sheet on narrow screens); the notes' switch; the title block and undo and redo bottom right. Every panel closes and
opens, as everywhere in the editors. Pinch, two fingers, the wheel, the three zoom buttons and `+`, `-`, `0` work on
each part's canvas.

**Story's page.** Pressing the pill's "Story" (or "Open Story's page" in the find bar) opens a floating panel over
the canvas, the way a game's page opens over World: the game's conversations as cards (each a small picture of its
map and who speaks), its cutscenes as cards (each a still of its level with the first camera frame), and the Words
card ("312 words, 4 missing in Korean"). "Add a conversation" and "Add a cutscene" are the last cards. Opening Story
from the switcher opens the last thing opened on this device, or else the first conversation, or else Story's page.
*My call:* no new device setting; "last opened" is the address, which the editors already keep.

## Conversations: the map

### What a person sees

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌ Crate Game · Keeper · Story ┐            ┌Find or do anything┐ ⚑ Share [Save]│
│ ┌────┐                                                                        │
│ │ADD │   ┌ KEEPER ───────────┐          ┌ KEEPER ─────────────┐               │
│ │STEP│   │ ▶ STARTS HERE     │          │ "The door opens if  │               │
│ │TRY │   │ "Hello there!"    │──"What's │  you push the crate │──── THEN ──┐  │
│ │ IT │   │ "Lovely day."     │  that    │  onto the button."  │            │  │
│ └────┘   └───────────────────┘  door?"─▶└─────────────────────┘            ▼  │
│                    │                                              ┌ ENDS ──────┐│
│                    └──── "Bye!" ──────────────────────────────────▶│ PLAYS:     ││
│                                                                    │ Door opens ││
│ ┌ DRAWING NOTES ● ON ┐                              ┌ title block ┐└────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Each step is a card** in the title-block style: the speaker's name and face (their real art, from the figure)
  at the top, then each line in quotes, in the language chosen for the map (below). The step that opens the
  conversation carries "Starts here". A last step carries "Ends", and "Plays: Door opens" when it plays a cutscene.
- **Each choice is a line** from its card to the card it leads to, labelled with the choice's words in a chip. A
  `next` is a line labelled "Then". Lines are the redesign's leader lines, with end ticks; a line going back to an
  earlier card curves round so it never crosses a card.
- **The map is placed by the editor**, left to right in reading order: the start first, then each step at the
  column of the first way it is reached, rows in the order of the choices. The same file always gives the same map.
  *My call:* nothing about a card's place is saved (no hidden state, no field the framework does not have); arranging
  by hand can come later as a framework field if a team needs it.
- **Problems show on the card they are about**, with the problem's olive edge and the framework's sentence: "Nothing
  leads to this step. Remove it, or point a choice at it." A card the start cannot reach is drawn faded.
- **Which language the map shows.** The map shows the game's words in the editor's language if the game has it,
  else in the game's own language, with a small flag on the pill to show the others (the Owner's rule for Play,
  2026-11-14, Q2=A, used here the same way). A line missing in the shown language says so on the card, in the
  touch color: "Not written in Korean yet".

### Changing it

- **Tap a card** to pick it; its card panel (right side, or a bottom sheet) shows:
  - **Who says it:** a choice of the game's characters, each with its real art and name; or "Nobody (a sign or a
    thought)" for a step with no speaker.
  - **What they say:** each line as a text box that grows, with + "Add a line" (up to eight, the format's limit) and
    a remove button on each. Typing writes the words in the language shown on the map.
  - **Then:** one choice of three: "The player picks" (its choices, two to four, each the player's words and
    "Goes to" a card or "A new step"), "It goes on to" a card or "A new step", or "It ends" (with "and plays" a
    cutscene, or nothing).
  - **The speech box, as a player sees it:** a preview of this step in the framework's own speech box (plan T's
    `story` box), drawn over a still of the speaker's level, at the size of the device being used.
  - **Remove this step** at the foot. If anything points at it, it asks first and names what: "The choice "Bye!" in
    Hello goes here. Remove the choice too?"
- **Dragging** a choice's end onto another card points it there (and the same is done by "Goes to" in the panel and
  by the keyboard, since nothing may be drag-only).
- **Add step** (tool): touch empty canvas to add a card there; it starts with the speaker of the picked card and one
  empty line, and is picked. A card that nothing points at yet shows the framework's sentence until a choice or a
  "Then" leads to it.
- **Try it** (tool): plays the conversation from the start (or from the picked card) in the framework's own speech
  box, full screen over the speaker's level, choices as the box's buttons; Stop top left. It reads the file as it is
  on screen; it runs no game code and changes nothing.
- **Who starts it:** the panel with nothing picked shows the conversation's own settings: its name (the card's
  title on Story's page), "Starts when the hero walks up to" one or more characters (the characters' `conversation`
  field), and "Opens on" a card.
- **Undo and redo** cover every change, including the words, and a change that touches two files (a new line writes
  the conversation and a messages file) is one step.

## Cutscenes: the stage and the timeline

### What a person sees

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌ Crate Game · Door opens · Story ┐       ┌Find or do anything┐ ⚑ Share [Save]│
│ ┌────┐           the level's real art, at the playhead                         │
│ │MOVE│      ┌ ─ ─ CAMERA  ZOOM 1.5 ─ ─ ┐                                       │
│ │ADD │      ¦      ⌐keeper¬            ¦     ⌐hero¬                            │
│ │KEY │      ¦   "The door is open!"    ¦                                       │
│ │ERASE│     └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                                        │
│ │PLAY│                                                                         │
│ └────┘ ┌ TIMELINE ─────────────────────────────────────────────── ✕ ┐        │
│        │ 0s     1s     2s     3s     4s     5s   ▏ ENDS 5s            │        │
│        │ CAMERA   ◆─────────smooth────────◆      ▏                    │        │
│        │ KEEPER   ◆ talk                         ▏                    │        │
│        │ HERO           ◆───────◆               ▏                    │        │
│        │ WORDS       [ "The door is open!" ]     ▏                    │        │
│        │            ▲ playhead 1.2s                                   │        │
│        └──────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **The stage** is the cutscene's level in its real art, drawn by the framework's renderer exactly as World draws
  it. On it, as drawing notes: the **camera's frame**, a dashed rectangle the shape of the game's view, with its
  zoom as a note; each **actor** where it stands at the playhead, with its name chip and facing; and the **line on
  screen** at the playhead in the framework's own speech box style. The art is never touched (the same pixel test
  as World).
- **The timeline** is a closable bottom panel: a ruler in seconds; one row for the camera, one for each actor, one for
  words; a key is a diamond, a line is a bar from its start to its end; the ease between two camera keys is written
  on the line between them ("Cut", "Steady", "Smooth"); the end of the cutscene is a line you can drag. A playhead
  shows where the stage is.
- **Seconds, not ticks.** Times are shown in seconds to a tenth (the file's ticks are 60 a second; a drag snaps to
  six ticks). *My call:* the file keeps ticks as it does today.

### Changing it

- **Move** (tool): drag the camera's frame to move it, pinch it (or its − and +) to zoom it; drag an actor to move
  it. Each makes or changes the key at the playhead on that row. Dragging a key along its row changes when it
  happens; it stops at its neighbors, so the file never goes back in time.
- **Add key** (tool): on a row, adds a key at the playhead with the place the stage shows there, so nothing jumps.
  Adding an actor row offers the level's things and players' heroes by name and real art.
- **Erase** (tool): removes a key or a line. A camera's last key cannot go; the tool says why.
- **A picked key's card**: when (seconds), where (the file's numbers, with − and +, as World's card), and for the
  camera how close and how it gets there; for an actor its clip (the character's clips, by name) and which way it
  faces; for a line its words (typed, as in a conversation), who says it, from and until.
- **The cutscene's own settings** (nothing picked): its name, its level (read only: "Staged in Level 1"; a new
  cutscene asks once), its length, and "Plays when the level starts" (`opens`).
- **Play** (tool): plays the cutscene on the stage from the playhead, at its own speed, as the framework works it
  out from the file. **Try it in the game** plays the level from its start with the cutscene through the framework's
  real story feature (plan T), Stop top left, the way World's Play does.
- **Add a cutscene** (Story's page): pick its level, and it starts with one camera key where the level's view is, a
  length of five seconds and nothing else.

## Words: every word a player reads

### What a person sees

A table on the canvas, in the title-block style, of every word in the game's messages files:

- **Rows** are words, grouped by where they are used, each group a heading a drunk grandma can read: "The keeper"
  (each conversation, by its name), "Door opens" (each cutscene), "Level names", "Buttons", "Everything else". A
  word used by a conversation or cutscene links there.
- **Columns** are the six languages, each headed by its flag (the framework's flags, as everywhere). The game's own
  language is marked "The game's own words" and is never first by default: the columns follow the framework's fixed
  order. *My call:* on an iPad sideways and a desktop all six show; on narrower screens two show, the game's own and
  one picked by its flag (the editor's language first, if the game has it).
- **Each cell** is the words, or "Not written yet" in the touch color. A cell whose words are older than the game's
  own (the game's own words changed since) says "The [flag] words changed. Check this still fits." Each cell is
  tapped to edit; the framework's limits show live ("A button's words are at most 12 characters, so they fit on the
  button") and a value in braces such as `{count}` is a chip that cannot be broken by typing.
- **"Read by someone who speaks it"** is a tick on each translated cell, shown with the person's face once ticked
  (Q2b). Ticking it writes `automata.translations.toml` through the framework's `markRead`; changing either text
  takes the tick away by the framework's own rule (the mark is of both texts).
- **A filter** at the top: "Missing", "Not read yet", "Changed", or everything, and the find bar finds a word by any
  language's text.

### Who may write what

The same levels as every other change (Look, Suggest, Approve, Edit, Owner). *My call:* anyone who may change the
game may write and tick any language; the tick says who ticked it and when, so a team can see who vouched for what.

## Saving with six languages (Q2)

The game's check fails when any word is missing in any of its six languages, and the Owner's answer is that no save
breaks that. So:

- **A save that leaves any word missing in any language is a waiting change, at every level, Edit and Owner
  included.** Its stamp is "SAVED" with "Waiting for words in Korean, Japanese and 3 more" (the flags shown), and it
  is listed on the game's page with the others.
- **A waiting change for words can be finished by anyone who may change the game.** Opening it shows the Words part
  filtered to what is missing, and "Add words to this change" saves into that same waiting change (its own branch,
  as every waiting change is), so many people (and the team's agent, through the ordinary pull request) can fill it.
- **It goes in when every word is there:** for a change started at Edit or Owner, the App puts it in once the game's
  checks pass; for one started at Suggest, it then waits for approval as today. Its stamp then is "SAVED, every word
  is there".
- **Changing the game's own words of an existing line** leaves the other five as they were, now marked "Changed"
  and unticked; the check still passes, so the save goes in as the person's level allows. *My call:* the old
  translation is closer than nothing, and the Words filter "Changed" lists them for the team.
- **Removing a line** removes its key from every language's file in the same save, so no language is left with a
  word nobody uses.
- **Export** (anyone, signed in or not, as the redesign spec says): "EXPORTED, copied for your agent", with every file
  the change touches, each as its path and its bytes, ready to paste to an agent, and "Save it as a file" giving a
  zip. *My call:* a zip because a story change is usually more than one file; the plan settles whether the copy is
  one text block or a zip only.
- **One save is one change to the game**, with every file it touched together (the conversation, each messages
  file, a character, the read marks), never one file at a time. The plan settles how the App writes several files in
  one go.

## The first run

The redesign's first visit still lands on World. Story's own first run, the first time a person opens Story on this
device (`af.tip.story`, under the allowed `af.tip.*`):

1. The game's first conversation opens on its map; one tip in the touch color points at the start card: **"Tap the
   keeper's words to change them"** (the speaker's shown name, from the game's words).
2. They tap and type. When they leave the box, the tip moves on: for a visitor **"Nice. Now press Export to keep
   it."**; for someone who may save, **"Nice. Now press Save."**
3. The stamp lands ("EXPORTED, copied for your agent", or "SAVED" with who and when, or "SAVED, waiting for words in
   5 languages" with one quiet line under it: "Your team, or your agent, writes the other languages. See what's
   missing").
4. That is the end of the first run; "Hide tips" sits on the tip, and doing anything else never blocks.

A game with no conversation opens on Story's page with one card, "Add a conversation", and the tip "Start a
conversation here". A game with only cutscenes opens the first cutscene with the tip "Drag the camera". *My call:*
the demo game gets its keeper and cutscenes with Examples' plan D; until then a visitor's Story opens on Story's page.

## The find bar and agents

Every Story action has its plain name in the find bar and in `docs/commands.md`, in nine languages, with the file
change it makes: "Add a step", "Add a choice", "Add a line", "Try it", "Open Keeper", "Open Story's page", "Add a
camera key", "Play the cutscene", "Try it in the game", "Show missing words", "Mark as read", "Add words to this
change", and the rest the plan lists. The test that holds the find bar and the doc to each other covers them.

## Languages

- The editor's own words (every label, button, tip and stamp above) are in `src/features/words/`, in all nine
  languages, plain, with no "repo", "commit", "branch", "pull request" or "token", as every word in the editors is.
- The game's words are the game's six; Story never adds a language the game does not ship, and never shows one of
  the editors' three extra languages as a column.
- Fonts per script as the redesign says; a cell in Korean, Japanese or Chinese uses that script's Noto Sans, loaded
  only when shown.

## Depends on

- **Framework plan T on `main`**: `name` and `conversation` on a character, `cutscene` on a step, `opens` on a
  cutscene, and the page's `story` box. Until it merges, Story's build cannot start. *Asks of the framework, for the
  plan to settle with that repo:* the speech box shown on its own from a step (for the card's preview and Try it),
  and a pure "where everything is at this tick" for a cutscene (for the stage and Play), both in the framework so
  the editor never re-implements what the game does.
- **Framework plan A** for an actor's clip and facing on the stage; until then those two show as fields only.
- **The redesign's build** (the frame, the find bar, the faces, nine languages, zoom) on `main`. Story starts after
  it, and does not change World.
- **Examples' plan D** for the demo game's keeper and cutscenes (only the visitor's first run waits on it; the
  editors' own test game gets a conversation, a cutscene and six languages of words for the journeys).
- **The editors' framework pin** moves to a commit with plan T, in its own pull request, as this repo's rules ask.

## Testing

- **Journeys** (real browsers, Chromium, WebKit and Firefox, the built suite against the pretend GitHub, at phone
  upright 390 × 844, phone sideways 844 × 390, iPad upright 820 × 1180, iPad sideways 1180 × 820 and desktop
  1440 × 900): Story's first run as a visitor (Export) and signed in (Save, and the waiting stamp); open a
  conversation from the switcher and from Story's page; change a line; add a line, a step and a choice; point a
  choice at another card by dragging and by the panel; remove a step something points at; Try it; set who starts it;
  open a cutscene; drag the camera's frame and pinch it; drag an actor; add, drag and erase a key; change a line's
  times; Play and Try it in the game; the Words part's filters; write a missing word; tick read and see it untick
  when the text changes; a save with missing words becomes a waiting change at Edit level; a second person adds
  words to that waiting change and it goes in; a Suggest-level words change waits for approval; Export of a change
  across several files; undo and redo of each kind of change; Look level sees the map and Try it but no tools.
- **Same bytes as an agent:** for every kind of change, the files the editor writes equal what `writeContent` (and
  `writeReadMarks`) writes for the same change made by hand in a test.
- **Never red:** a test plays each save in the journeys through the framework's `loadGame` and
  `translationProblems` and fails if a change that went straight in has any problem.
- **The map:** the same file always gives the same map; no card overlaps another; no line crosses a card; every
  choice's label is readable at the five sizes and in all nine editor languages.
- **Layout rules** as the redesign has them (no overlaps, 44 / 48 / 56 px, no cut words, the canvas never moves
  under a finger) and the art-untouched pixel test on the cutscene's stage and the speech box preview.
- **Words:** every Story word in nine languages; no banned word; the find bar and `docs/commands.md` match.
- **Tests run only in GitHub-hosted CI**, as always.

## Review

As the redesign spec says: the Owner sees pictures, not a branch. Every stage that changes a screen ends with a
review artifact of every Story screen at the five sizes, in the order a person meets them, saying plainly whether
the pictures show the final look. After the build, the two audits run over every Story screen: Opus for the
drunk-grandma test, Fable for the visuals.

## Constraints

- No new dependency. Story uses the framework, the editors' approved fonts and icons, and nothing else.
- An editor changes content files only; `automata.translations.toml` is the one exception (Q2b), written only with
  the framework's writer.
- The device keeps only what `CLAUDE.md` allows (`af.tip.story` is under `af.tip.*`).
- The editors never run a game's own code; Try it and Play use only the framework's built-in play of the content.
- Nothing private in this repo.

## Left to the builder (the plan)

- The exact map layout rules (column widths, how lines route round cards) within "same file, same map".
- How the App writes several files in one save, and how "Add words to this change" adds to a waiting change.
- The exact shape of the two framework asks (the speech box on its own, a cutscene's state at a tick) and their
  framework pull requests.
- The Export copy's form (one text block, a zip, or both).
- The group headings of the Words part beyond the five named, and how a word used in two places is shown.
- The cut into pull requests: the pin, the framework asks, Conversations, Cutscenes, Words and saving, the first
  run, pictures; any order that keeps `main` green.
- The full list of every Story screen state for the pictures and journeys.
