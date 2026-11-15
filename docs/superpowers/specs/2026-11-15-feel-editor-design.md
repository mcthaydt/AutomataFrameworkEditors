# The Feel editor (2D): tune how the game moves and feels by playing it

Status: spec, 2026-11-15. Stage 1 of its own cycle: the Owner gave every editor tab its own full pipeline
(2026-11-15: "every editor tab is really" large enough to warrant its own session). The frame it sits in is the
Blueprint redesign's ([`2026-11-14-editors-blueprint-redesign-design.md`](2026-11-14-editors-blueprint-redesign-design.md));
the files it edits are the framework's built-in hero
([AutomataFramework `2026-11-14-content-hero-controls-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-14-content-hero-controls-design.md),
plan H and its audit). Where this page is short, those have the detail.

## Principles served

- **1. Agent-first.** Feel changes only documented content files, in the bytes `writeContent` writes, so a number an
  agent types and a number a person slides are the same edit. Every action is a find-bar command with a documented
  name.
- **2. iPad-first editors.** Tuning is done by thumb, while playing, on a tablet held either way and on a phone.
- It is the first editor slice after World's Levels part (the first-layer spec's "Order inside the editors": Feel, with
  Tuner inside it), because game feel is the most common reason agent-made games fail.

It breaks none: it is 2D and 3D alike (the first-layer spec: "Feel, Sound and Story are the same in both"), and mixes
in nothing of the 3D layer.

## Why

An agent can write a hero's tuning file in a minute, but whether a jump feels good is only known by playing it. Today
the only way to try a change is to edit `jump-speed` from 12 to 13, run the game, jump, and remember how 12 felt. A
person who is not a programmer cannot do even that. Feel makes the loop one gesture: play the level, slide a number
with the other hand, feel the hero change on the next jump, and see on the level how high and far the jump now goes.

## The Owner's answers (2026-11-15)

| # | Question | Answer |
|---|---|---|
| Q1 | How does a person feel a change to the move numbers? | **A.** They play the real level, and a slider changes the hero while they play. The jump is drawn on the level as a drawing note ("Reaches 3 tiles up, 5 across") that redraws as a number moves. |
| Q2 | Dust, shake and freeze need the framework's feel runtime, which nobody had planned. | **A.** The framework's plan F (the feel runtime) goes first, in its own thread. Feel builds the move numbers and the controls first, and the effects after plan F is merged. |
| Q3 | Where do the move switches (double jump, wall jump, dash) live? | **B** (the Owner changed this from A: "we're using ECS and double jump wall jump seem like components so shouldn't they be under characters?"). They are on the character, so they live in **Characters**. Feel shows the numbers only for the moves that are on, with "Turn on in Characters" for the rest. |
| Q4 | A new effect is a new feel file, which `automata.toml` must list. May Feel add that line? | **A.** The save that adds an effect also adds that file's `[[content]]` entry to `automata.toml`, and touches nothing else in it. An agent does exactly the same by hand. |

## What Feel edits, and what it only reads

| File | What Feel does with it |
|---|---|
| The hero's **tuning file** (`moves.tuning` on the project's `hero` character) | Writes its `numbers` (the eighteen built-in ids and any of the game's own) and its `controls`. |
| **Feel files** (`content/feel/*.json`: `on`, `dust`, `shake`, `freeze`, `buzz`) | Writes them in Part 3, after plan F. |
| The hero's **character file** | Reads only: whether it has `moves`, its `tuning` id, and which of `double-jump`, `wall-jump` and `dash` are on. Never writes it (Q3). |
| `automata.toml` | Only in Part 3: adds or removes one feel file's `[[content]]` entry, and nothing else (Q4). |
| The **level** | Reads only, to play it. Feel never moves a thing in a level; that is World. |

Nothing else. Feel never shows or touches a game's code, and keeps nothing anywhere but the files (and the unsaved
draft the device may keep, `af.draft:…`, as World does).

## Goals

1. Tune every built-in move number by playing the real level, with the change felt on the next step or jump.
2. See what a jump can reach, drawn on the level in the Blueprint's drawing-notes style, before and while playing.
3. Change the keys and gamepad buttons for every action, by touch alone as well as by pressing them.
4. After plan F: add, change and remove what happens when something happens (dust, shake, freeze, buzz), and feel it
   in the same play.
5. A first-time person, who has never heard the word "coyote time", tunes a jump in under a minute and knows they did.

## Non-goals

- **Turning moves on or off** (Characters, Q3), the hero's body, clips or art (Characters), the level (World).
- **Presets** ("floaty", "snappy"). Not asked for; a later spec may add them as framework data an agent can use too.
- **A practice room** in place of the person's level (Q1's option C was not chosen).
- **The editor drawing effects itself** (Q2's option B was not chosen). Every effect on screen is the framework's.
- **Sound.** What plays when something happens is the Sound editor's.
- **Online play.** Feel plays the level alone, on the device.

## Anti-goals (failure even if it technically works)

- **A wall of eighteen sliders.** A person sees the numbers for one move at a time, in words, never as ids.
- **A number that lies.** The note's "3 tiles up" must be what the hero really reaches, worked out by the framework's
  own move step, never by a separate formula in the editor.
- **Tuning that needs skill.** A person who cannot make the jump must still see what it reaches.
- **A slider that takes the thumb's walk.** Touching the numbers never moves the hero; touching the game never moves
  a number.
- **Play that keeps something.** Stopping leaves the level exactly as it was; only the numbers a person slid change.
- **A key a person cannot choose without a keyboard.** On an iPad with nothing plugged in, a key is picked from a
  list.

## Approaches

The Owner chose the how for the three big calls (Q1, Q2, Q3 above). The approaches weighed:

| Approach | Trade-off | Verdict |
|---|---|---|
| **Live play of the real level with a drawn jump** | Needs two small framework calls (numbers changed while playing; the jump's path from the move step). Truthful, and works for someone who can't play well. | **Chosen** (Q1 A) |
| Live play, no drawn jump | Less work, but a person must be good at the game to judge a jump. | Not chosen |
| A practice room of ledges and walls | Same jumps every time, but not the person's level, and a room the editors invent is content no game has. | Not chosen |
| Effects after the framework's feel runtime | Waits for plan F, but the game and the preview are one thing. | **Chosen** (Q2 A) |
| The editor's own effect preview | Starts sooner; doubles the work, and the preview may not match the game. | Not chosen |
| Move switches in Characters | One job per editor and one file per editor for the hero; a person tuning a wall jump goes to Characters once to turn it on. | **Chosen** (Q3 B) |

## The screen

Feel is the third editor in the switcher. Choosing it replaces World's tools with Feel's; the pill, the cluster
(Find, faces, language, Export, Share, Save), the title block and undo and redo stay where World has them, so the
frame does not move. The level fills the window as in World. Feel has **three parts**, picked from the left-edge tool
strip where World has Move, Add and Erase:

1. **Moves** (icon `person-simple-run`): the move numbers, the Tuner.
2. **Controls** (icon `game-controller`): keys and gamepad buttons.
3. **Effects** (icon `sparkle`): what happens when something happens. Shown with a small "Coming soon" tag until plan
   F is merged and Part 3 is built; pressing it then opens the same kind of card the switcher uses.

The fourth tool is **Play**, as in World, and Feel is the editor where it matters most: Moves opens playing.

### iPad sideways and desktop

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌ Crate Game · Level 1 ┐ World Characters ┌Feel┐ Sound Story  ┌Find or do anything┐ ◐ ⚑ Share [Save] │
│ ┌─────┐                                                               ┌ MOVES ─────────────────┐ │
│ │MOVES│   the game, playing                                           │ Walk │ Jump │ Dash      │ │
│ │CTRLS│               ╭─── Reaches 3 tiles up ───╮                     │                         │ │
│ │EFFCT│               ┆        ⌒⌒⌒⌒⌒             ┆                     │ How high it jumps       │ │
│ │STOP │          hero ●'    ·  ·  ·  ·  '·       ┆                     │ ○━━━━━━━●━━━━○   12     │ │
│ └─────┘               ╰── 5 tiles across ────────╯                     │ Let go early to jump    │ │
│                                                                        │ lower  ○━━●━━━━━○ half  │ │
│                                                                        │ ...                     │ │
│                                                                        │ Wall jump is off.       │ │
│                                                                        │ [Turn on in Characters] │ │
│ ┌ DRAWING NOTES ● ON ┐                                ┌ title block ┐ └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **The numbers panel** floats on the right, where World's card is: a row of the moves that are on (Walk, Jump, and
  Double jump, Wall jump and Dash when the hero has them), each a tab with its icon and word; under the chosen move,
  its numbers as sliders, each with its words and its value in plain units. It closes and opens like every panel
  (the redesign's ruling 17).
- **The game plays in the level's place**, from the files as they are on screen. Its thumb scheme takes the halves of
  the game as the framework places it; the panel, the tools, the pill and the cluster are stacked over it and take
  their own touches (plan H audit I5).
- **The jump note** is drawn on the level (below).

### iPad upright and phone sideways

The same parts, re-placed as World re-places them: the tools along the bottom edge, the numbers panel as a bottom
sheet over the game's lower edge that pulls down to its row of moves. Playing goes on while the sheet is open.

### Phone upright

```
┌────────────────────────────┐
│ ┌Level 1 · Feel ▾┐ ⚑ [Save] │
│                            │
│   the game                 │
│   ╭ Reaches 3 up ╮          │
│   ●'  ⌒⌒⌒   '·  5 across   │
│                            │
│ ┌ Walk  Jump  Dash ───────┐ │
│ │ How high it jumps   12  │ │
│ │ ○━━━━━━━●━━━━━━○        │ │
│ └ ▾ play ─────────────────┘ │
│ MOVES CTRLS EFFECTS PLAY ↶ ↷│
└────────────────────────────┘
```

The thumb band sits under the level when upright and narrow (plan H), and the numbers sheet would sit in the same
place. So on a phone held upright they take turns: **the sheet up is tuning, the sheet down is playing.** With the
sheet up, the game holds still with the hero where it stood, and the jump note shows from its feet, redrawing as
the slider moves; one slider shows at a time, with the others a swipe or a tab away. Pulling the sheet down (or
pressing "Play" on its edge) hands the band back and the game goes on with the new numbers. Nothing scrolls.

### Every size

- Touch targets at least 44 px, main buttons 48 px, tools 56 px (the redesign's sizes). A slider's thumb is 44 px; a
  slider is at least 200 px long where it fits, else as long as the panel.
- Each slider also has **− and +** buttons (one `step` each) and takes the arrow keys while it has focus, so nothing
  needs a drag. A long press on − or + repeats.
- While a slider has focus, the keys go to it; the game gets the keys whenever no control in a panel has focus, and
  Escape gives the focus back to the game.

## Part 1: Moves (the Tuner)

### Which numbers show

The moves that show are walk and jump always, and double jump, wall jump and dash when the hero's character file has
them on. A move that is off is not a tab; under the last tab one quiet line says which are off ("Double jump and dash
are off.") with **Turn on in Characters**, which opens Characters at the hero. Until Characters is built it opens
Characters' "Coming soon" card, which says the switches are on the hero's file for now and that an agent can turn
them on (`"double-jump": true` in its `moves`).

A game's own numbers (ids that are not built-in) show under a last tab, **More**, by their file's `about` words, which
are the developer's and stay untranslated on purpose. They still slide live, but the framework does not read them,
so the note does not change for them.

### The eighteen numbers, in words

The words are the editors' own, in all nine languages, never the file's `about` text. Ticks are shown as seconds (60
ticks is a second) with two decimals and a short word; tiles a second as "tiles a second". The file keeps its units.

| Move | id | What the slider says | Shown as |
|---|---|---|---|
| Walk | `walk-speed` | How fast it walks | 6 tiles a second |
| Walk | `walk-grip` | How quickly it gets going and stops | 0.05 seconds; 0 says "At once" |
| Walk | `air-grip` | How quickly it turns in the air | 0.10 seconds; 0 says "At once" |
| Jump | `jump-speed` | How high it jumps | 12, with the note's height beside it ("3 tiles") |
| Jump | `jump-cut` | Let go early to jump lower | 1 says "Off", else "Keeps half", "Keeps a third" … as a share |
| Jump | `ledge-grace` | Jump just after leaving a ledge | 0.10 seconds |
| Jump | `early-press` | Press jump just before landing | 0.10 seconds |
| Jump | `fall-speed` | Fastest it falls | 20 tiles a second |
| Double jump | `air-jumps` | Jumps in the air | 1, 2 or 3 |
| Double jump | `air-jump-speed` | How high an air jump goes | 10, with its height |
| Wall jump | `wall-slide-speed` | How fast it slides down a wall | 3 tiles a second |
| Wall jump | `wall-jump-out` | How far a wall jump pushes away | 7 tiles a second |
| Wall jump | `wall-jump-up` | How high a wall jump goes | 11, with its height |
| Wall jump | `wall-jump-lock` | How long it keeps away from the wall | 0.13 seconds |
| Dash | `dash-speed` | How fast a dash goes | 18 tiles a second, with its length |
| Dash | `dash-ticks` | How long a dash lasts | 0.17 seconds, with its length |
| Dash | `dash-rest` | Wait before the next dash | 0.50 seconds |
| Dash | `air-dashes` | Dashes in the air | 1, 2 or 3 |

Each slider also has one plain sentence under it, shown when its words are pressed (an info disc beside them): for
`ledge-grace`, "Lets a jump still work for a moment after running off an edge, so the player never feels cheated."

### The range of a slider

A slider runs over the file's own `min` and `max`, inside the framework's limits (the hero spec's table). A number
the file leaves out shows at the framework's default with "Not in the file yet"; moving it writes it in, with the
framework's own limits as its range and step and the framework's `about`. **Reset** beside a number sets it back to
the framework's default and keeps it in the file (my call: a reset is still a choice a teammate should see).

Power users can widen or narrow a slider's range in a small "Range" panel under the number's info (the file's `min`,
`max` and `step`), never past the framework's limits; a value outside a new range is moved inside it, and the panel
says so.

### Feeling it

- **Playing:** a change to a number reaches the hero on the next tick, with nothing else reset: the hero keeps its
  place and its speed, the crate stays where it was pushed. This needs one framework call (F1 below).
- **The jump note:** a dashed arc from the hero's feet, in the drawing notes' style, with two dimension marks:
  "Reaches 3 tiles up" and "5 tiles across" (the farthest a full-speed run and a held jump land on flat ground at the
  height it left). With double jump on, a second arc from the top of the first, in the same style, marked "with an
  air jump". With dash on, a straight dimension line "Dash: 3 tiles". The note follows the hero while it stands and
  holds still at the spot it left from while it is in the air, so it can be compared with the jump just made. It
  redraws the moment a number changes, with a 200 ms draw-in (the redesign's motion), and shows the old arc faded for
  a second so the change is seen. The drawing notes switch hides it like every note.
- **Before playing:** pressing Moves when the game is not playing shows the level still, the hero at its start, and
  the note at its feet. Play is one press away and is the main button of the tool strip in Feel.
- **Stop** ends play; the level, the undo steps and the view are as they were; only the numbers keep their changes.

### Undo, saving, Export

- One slider gesture (from touch to lift, or one press of − or +, or one run of arrow keys within half a second) is
  one undo step. Undo during play changes the number back live.
- **Save** and **Export** are World's, with the same words, stamps and levels: Save writes the changed tuning file
  (Look and visitors cannot; Suggest makes a waiting change; Edit and Owner save straight in); Export copies the
  tuning file, exactly as `writeContent` writes it, "Copied for your agent", for anyone.
- The title block's editor cell reads "Feel".

## Part 2: Controls

A list of the hero's actions (`left`, `right`, `jump` and, with dash on, `dash`, plus any of the game's own) in words
("Walk left", "Jump"), each with its keys and its gamepad buttons as chips.

- **Change a key:** press its chip, then press a key on a keyboard; or, with no keyboard, choose from the list of keys
  the chip opens (grouped: arrows, letters, numbers, Space, Shift and the rest), so an iPad alone can do it.
- **Change a gamepad button:** press its chip, then press a button on a connected pad, or choose from the list, named
  by place ("the bottom button", "the left stick, up"), never by a letter (plan H).
- **Add** and **remove** a chip, up to the file's limits (eight keys, four pad inputs). The last way to do an action
  cannot be removed.
- A clash or a key kept for menus is refused with the framework's own sentence ("The key Space is used for both
  "jump" and "dash". Give each action its own key."), shown beside the chip, before it is ever written.
- **Touch** has no buttons to move: the thumb scheme is the framework's. The list says so in one line, "On a touch
  screen, the left thumb walks and the right thumb jumps", in words that follow the moves that are on.
- Play works here too, so a person can try a new key at once.

## Part 3: Effects (after plan F)

Built only once plan F is merged to the framework's `main` and the editors' pin has moved to it.

- A list of **"When … happens"** cards, one per feel file: "When the hero lands: dust, a buzz". The events are offered
  in words, best first: the built-in hero's (`hero.landed` "lands", `hero.jumped` "jumps", `hero.wall-jumped`, …),
  then every `on` already in the game's files; a typed event name is allowed and shown as typed.
- A card opens its four effects, each switched on or off, each with its numbers as sliders like Moves':
  **Dust** (how many, colour from the game's palette or typed, how fast, how long), **Shake** (how hard, how long),
  **Freeze** (how long), **Buzz** (how strong, how long). The framework's limits are the sliders' limits; "Say what
  happens" is the framework's sentence when all four are off.
- **Feeling it:** effects fire in the same live play, as the game fires them. **Show me** on a card fires that effect
  once at the hero, playing or not (F4 below), so a person who cannot reach a ledge still sees a landing's dust.
  Buzz plays on the device when it can and says "Buzz: strong, 0.07 seconds" when it cannot. Reduced motion on the
  device shows the framework's still form, as the game does.
- **Adding an effect** writes a new feel file, `content/feel/<id>.json`, its id from the event ("hero-landed", with
  "-2" and up when taken), and the same save appends its two-line `[[content]]` entry (`type = "feel"`, its `path`)
  to the end of `automata.toml`, changing no other byte there (Q4). **Removing** one deletes the file and that entry
  in one save. This is the one place an editor writes `automata.toml`; the plan changes this repo's `CLAUDE.md` rule
  ("writes only the content files `automata.toml` lists") to say so.

## The first run

Someone who opens Feel for the first time (`af.tip.feel*` counts, as World's tips do):

1. Feel opens on Moves, with the level still, the hero at its start, and the jump note at its feet. One tip, with its
   own ground, by Play: **"Press Play and jump."**
2. Once they have jumped, the tip moves to the Jump tab's first slider: **"Now slide this and jump again."**
3. After the first change and the next jump: **"Feel that? It's saved on your screen. Press Save to keep it for your
   team."** (Export for a visitor: "Press Export to keep it.") The stamp afterwards is World's.

A person who does something else is never blocked; the tip waits. A game whose hero has no `moves`, or no tuning file,
opens Moves with one calm panel over the still level: "This game's hero is moved by its own code, so there's nothing
to tune here yet." and, for a game that has tuning files, a list of their numbers to change without play. The demo
game is in this state until the Examples repo's plan D gives it the built-in hero.

## Agent-first

- Every action is a command in the find bar, named as the redesign names World's (`feel.moves`, `feel.set
  jump-speed 13`, `feel.reset jump-speed`, `feel.play`, `feel.key jump Space`, …), listed in `docs/commands.md` by
  the same generator. The plan names them in full.
- What a person changes is the tuning file and, in Part 3, feel files; nothing else is kept.
- `docs/` gets a short page, "Tuning a hero", for an agent and a person: which file, which numbers, what each does,
  how the editor shows it.

## Languages

All nine of the editors' languages, through the words table, with no default language (the Owner's rule). Every word
in this spec is the English row; the plan writes the other eight, held to the same tests (complete, placeholders,
banned words, length). Slider words are at most 32 characters in every language where the panel is narrow.

## What Feel needs from the framework

Each is its own small AutomataFramework pull request with a pin move here, as the redesign's Task 7a was.

- **F1. Numbers changed while playing.** A call on the editors' play (from `startGame`'s result) that takes the
  eighteen numbers and applies them from the next tick, offline only, without resetting anything. A game never calls
  it. No golden moves (no recorded play uses it).
- **F2. The jump's path.** A headless function that runs the built-in move step on flat, empty ground from standing
  and returns the path's points and its reach (up, across; with an air jump; a dash's length), from the numbers and
  the switches. It uses `stepMoves`, never its own maths, so the note and the game agree. Units are tiles.
- **F3. The numbers' table.** `MOVE_NUMBERS` (ids, defaults, limits, `about`) and the hero's actions are exported from
  the headless entry, so the editor never copies them. Plan H builds most of this; F3 only checks the names.
- **F4. From plan F: an effect fired on demand.** Plan F's runtime takes a feel and a place and plays it once in a
  running game, presentation only, so Show me is the framework's own drawing. This is sent to the plan F thread as
  input to its spec.

## The order of work

1. Plan H merged and the redesign's Task 19 (Play) built, which Feel's play is.
2. F1 to F3 in the framework, one pull request, then the editors' pin.
3. Part 1, Moves, with the first run.
4. Part 2, Controls.
5. Part 3, Effects, once plan F (and F4) is merged and the pin has moved again.

The test game in `tests/fixtures/game/` gets a tuning file and the built-in hero with all three switches in step 2;
`plain-game` stays without, for the "moved by its own code" panel.

## Testing

Every test runs in GitHub-hosted CI, never locally.

- **Unit:** the words for every number and the unit shown (seconds from ticks, "At once", shares); which tabs show
  for each set of switches; a range kept inside the framework's limits; a number not in the file written in with the
  framework's range; reset; one gesture is one undo step; a key clash refused with the framework's sentence before
  writing; the command list.
- **DOM:** each slider writes the file as `writeContent` would; − and + and the arrow keys; the Range panel; the
  Controls chips by key press and by list; Turn on in Characters opens Characters (or its card).
- **Real browsers** (Chromium, WebKit, Firefox) at phone upright and sideways, iPad upright and sideways, and
  desktop: the panel and sheet placement; nothing under 44 px; nothing scrolls on a phone upright; the panel takes its
  own touches over the thumb halves; the jump note's marks read F2's numbers.
- **Journeys** (`tests/journeys/`, the real API against the pretend GitHub):
  1. *Tune a jump:* open Feel on the test game, press Play, jump, slide "How high it jumps" to 15, see the note say a
     higher reach, jump again, press Save as an Edit-level person; the game's tuning file in the pretend GitHub has
     `jump-speed` 15 and nothing else changed.
  2. *A visitor exports:* the same tune, Export, the copied text equals `writeContent`'s bytes.
  3. *Phone upright:* the sheet up holds the game still; down plays on with the new number.
  4. *Remap without a keyboard:* change jump to Z from the key list, play, press Z, the hero jumps.
  5. *A Suggest-level tune* becomes a waiting change.
  6. *The first run* tips appear in order and say they are done.
  7. *A hero moved by its own code* (`plain-game`) gets the calm panel.
  8. After plan F: *Show me* a landing's dust, and an added effect saved.
- **Screens:** every new screen added to the redesign's scene list, so the screenshot review artifact shows them at
  the five sizes.

## Left to the builder (my calls, open to the plan audit)

- The icons named above (Phosphor regular, in the Editors palette E No. 310 like every tool).
- Seconds with two decimals; "At once" for 0 grip; shares in words for `jump-cut`.
- Reset keeps the number in the file.
- The old arc fades for one second after a change.
- On a phone held upright the sheet and the thumb band take turns.
- The find-bar command names.
- Whether Part 2 lands in the same pull request as Part 1 or after it.
