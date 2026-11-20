# The World slice's end-to-end walk

Walked: `main` at `8dccec55ffe678a7291c5658565188f50df33284` (Merge pull request #124), started on 2026-11-20 06:43 UTC.

Result: 96 steps; 86 pass at every size walked, 10 fail at one size or more. 461 step-and-size checks: 439 PASS, 22 FAIL.
Six red findings (R1 to R6) and ten notes, under Findings.

How: the built suite (`pnpm build:journeys`) served with the real API code against the pretend GitHub
(`tests/fixtures/serve.ts`, `tests/fixtures/fake-github/`), driven in Chromium with Playwright as a person would: real
touch events (Chrome DevTools touch input) for taps, drags and the game's touch controls, the keyboard where a person
types. Sizes: phone 390×844, phone sideways 844×390, iPad upright 834×1210, iPad sideways 1210×834, computer 1280×800,
all with a touch screen. Pictures: `/mnt/project-files/screens/world-walk/` (named `<journey>-<size>-<step>.png`).
Not walked here, and the owner's walk: a real iPad, a real Apple Pencil and a real on-screen keyboard.

## Steps

Sizes in a line: P phone, PS phone sideways, IU iPad upright, IS iPad sideways, C computer.

### First open to the first change in the game

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Language card first, English chosen; "Go on" | PASS | PASS | PASS | PASS | PASS | `01-<size>-language.png` |
| Welcome page: "Try it now" and "Sign in with GitHub" | PASS | PASS | PASS | PASS | PASS | `01-<size>-welcome.png` |
| "Try it now": Crate Game opens with the welcome card | PASS | PASS | PASS | PASS | PASS | `01-<size>-welcome-card.png` |
| "Sign in with GitHub": "Pick a game to open" lists the games and what you may do | PASS | PASS | PASS | PASS | PASS | `02-<size>-pick-a-game.png` |
| Tap crate-game: Level 1 opens; "I'll look around myself" | PASS | PASS | PASS | PASS | PASS | `02-<size>-opened.png`, `02-<size>-looked.png` |
| Drag the crate 2 tiles by finger: the main button says "Put in game" | PASS | PASS | PASS | PASS | PASS | `02-<size>-changed.png` |
| "Put in game": the sheet lists "Moved Crate 1 · Level 1", "Put them in", "Not yet" | PASS | PASS | PASS | PASS | PASS | `02-<size>-sheet.png` |
| "Put them in": one commit on main ("Move Crate 1 in Level 1"), "Everyone on Crate Game has your 1 change now" | PASS | PASS | PASS | PASS | PASS | `02-<size>-done.png`; the pretend GitHub's main moved by one commit |
| "See what changed": the game's list, newest first, with the change and "Show me" | PASS | PASS | PASS | PASS | PASS | `02-<size>-what-changed.png` |
| Close: the top bar says "Up to date" | PASS | PASS | PASS | PASS | PASS | `02-<size>-up-to-date.png` |

### The tour

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| "Show me around": the tour has the spec's four steps (tap the crate, tap Place, drag How heavy, Play then Put in game) | FAIL | FAIL | FAIL | FAIL | FAIL | R1: the card says "1 of 2"; only two steps (`01-<size>-tour-1.png`) |
| Step 1: tap the crate, "That worked", Next | PASS | PASS | PASS | PASS | PASS | `01-<size>-tour-2.png` |
| Step 2: drag How heavy (the slider reached on the pulled-up sheet on a phone and upright iPad): "That worked" | PASS | PASS | PASS | PASS | PASS | `01b-<size>-step2-dragged.png` (1 → 3) |
| "That is the tour", Finish: the tour closes | PASS | PASS | PASS | PASS | PASS | `01b-<size>-that-is-the-tour.png` |
| Undo: How heavy is 1 again | PASS | PASS | PASS | PASS | PASS | seen (slider reads 1) |

### Place, move, copy, delete, erase, each undone (Crate Game, signed in)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Place, the crate in the tray, tap the level: Crate 2 is put there | PASS | FAIL | PASS | PASS | PASS | `03-<size>-placed.png`; PS: R2, the tray covers the floor and Crate 1 (`03-phoneSideways-placed-FAIL.png`, `03-phoneSideways-placed.png`) |
| Pick it, Move, one arrow tap: one tile; Done | PASS | PASS | PASS | PASS | PASS | `03-<size>-move-pad.png` (x 10.5 → 11.5) |
| Drag Crate 1 one tile by finger | PASS | PASS | PASS | PASS | PASS | x 6.5 → 5.5 |
| Make a copy, then Delete, from the bar over the thing | PASS | PASS | PASS | PASS | PASS | `03-<size>-copy-delete.png` |
| Erase, tap Crate 1: gone | PASS | PASS | PASS | PASS | PASS | `03-<size>-erased.png` |
| Six Undos: one crate at x 6.5, Undo off, "Up to date"; Redo puts Crate 2 back | PASS | PASS | PASS | PASS | PASS | `03-<size>-undone.png`, `03-<size>-redo.png` |

### Paint and erase ground, each undone (Links Game, Room 2)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Paint: the tray says Solid and Empty | PASS | PASS | PASS | PASS | PASS | `04-<size>-paint-tray.png` |
| A finger across 3 tiles: "Painted Solid" | PASS | PASS | PASS | PASS | PASS | `04-<size>-painted.png` |
| Over the open right edge: "The way across to Room 3 is closed now", "1 problem" | PASS | PASS | PASS | PASS | PASS | `04-<size>-closed.png` |
| Empty, the edge again: "…is open now" | PASS | PASS | PASS | PASS | PASS | `04-<size>-open.png`; PS failed once in four runs (N4) |
| Erase drags the painted step away | PASS | PASS | PASS | PASS | PASS | `04-<size>-erase-ground.png` |
| Undo every step: "Up to date" | PASS | PASS | PASS | PASS | PASS | `04-<size>-paint-undone.png` |

### Join a switch to a gate, undone (Links Game, Room 1)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Join: the line from Plate 1 to Gate 1 | PASS | PASS | PASS | PASS | PASS | `04j-<size>-line.png` |
| Tap the line, "Take this line away": gone; Undo: back | PASS | PASS | PASS | PASS | PASS | `04j-<size>-taken.png`, `04j-<size>-line-back.png` |
| Drawn again from Plate 1 to Gate 1 by finger | PASS | PASS | PASS | PASS | PASS | `04j-<size>-drawn.png` |
| Pick Plate 1: its settings say Opens Gate 1 | PASS | PASS | PASS | PASS | PASS | `04j-<size>-opens.png` |

### A value at its limits (How heavy: 0.5 to 4, in halves)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Slider dragged past its left end: 0.5 | PASS | PASS | PASS | PASS | PASS | `05-<size>-least.png` |
| Past its right end: 4 | PASS | PASS | PASS | PASS | PASS | `05-<size>-most.png` |
| Tap the number: the pad with -, + and Done | PASS | PASS | PASS | PASS | PASS | `05-<size>-pad.png` |
| + at 4: stays 4 | PASS | PASS | PASS | PASS | PASS | seen |
| Type 9, Enter: stays 4 | PASS | PASS | PASS | PASS | PASS | `05-<size>-typed-9.png` (N3: the pad's + is named "More", as the thing's three dots are) |

### Draw order set, played and undone

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Crate dragged onto the hero start; Drawn: In front | PASS | PASS | PASS | PASS | PASS | `05d-<size>-on-start.png`, `05d-<size>-in-front.png` |
| Play: the crate is seen over the start in the game | PASS | FAIL | PASS | PASS | PASS | `05d-<size>-play.png`; PS: R3, the play bar covers the level (`05d-phoneSideways-undefined-FAIL.png`) |
| Stop, Undo: With the hero again | PASS | PASS | PASS | PASS | PASS | `05d-<size>-undone.png` |

### A heavier crate pushed less far in play, with the game's touch controls

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| How heavy 0.5, Play, "Slide to walk" held 0.9 s into the crate | PASS | FAIL | PASS | PASS | PASS | crate moved 3.91 / 4.78 / 4.43 / 4.07 tiles (P, IU, IS, C); PS: R3, no crate or hero in sight under the play bar (`06-phoneSideways-undefined-FAIL.png`) |
| How heavy 4, the same push: less far | PASS | FAIL | PASS | PASS | PASS | 2.74 / 3.29 / 3.61 / 2.95 tiles; PS: R3 |
| Playing wrote nothing: still "Put in game", no commit | PASS | PASS | PASS | PASS | PASS | seen |

### Play's tools

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Play: the play bar over the level, the game runs | PASS | FAIL | PASS | PASS | PASS | `06t-<size>-bar.png`; PS: R3 |
| Slow: "How fast the game plays: Slow" | PASS | PASS | PASS | PASS | PASS | `06t-<size>-slow.png` |
| Pause, One step | PASS | PASS | PASS | PASS | PASS | `06t-<size>-step.png` |
| Drag the strip back through the last seconds | FAIL | FAIL | FAIL | FAIL | FAIL | R4: the hero jumps to the start and the strip is gone after the first drag, by finger and by mouse (`06t-strip-touch-after.png`, `06t-ipadUpright-back.png`) |
| Play from here: "Tap the level where the hero should start", Cancel | PASS | PASS | PASS | PASS | PASS | `06t-<size>-from-here.png` |
| Tap the level: the hero starts there | PASS | FAIL | PASS | PASS | PASS | IS tapped x 567, hero at 564; PS: R5, the hero starts about two tiles left of the tap (`06t-phoneSideways-from-here-where.png`, `06d-phoneSideways-after-walk.png`) |
| Bigger hides the panels, Smaller brings them back | PASS | PASS | PASS | PASS | PASS | `06t-<size>-bigger.png` |
| Stop: the editor, "Up to date" | PASS | PASS | PASS | PASS | PASS | `06t-<size>-stopped.png` |

### A door followed in play (Links Game)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Play from here by Room 1's door, slide to walk: Room 2 opens and plays on | PASS | FAIL | PASS | PASS | PASS | `06d-<size>-room2.png`; PS: R5, the hero starts left of the gate instead, so the door is never reached (`06d-phoneSideways-after-walk.png`) |

### The map (Links Game)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Map: three rooms whole on screen, 1 join, 3 doors | PASS | PASS | PASS | PASS | PASS | `07-<size>-map.png` |
| Drag Room 1 against Room 2 by finger: "meet at a wall" before letting go; the wall card | PASS | PASS | PASS | PASS | PASS | `07-<size>-wall-held.png`, `07-<size>-wall-card.png` |
| The card's first way out joins them; Undo brings the wall back | PASS | PASS | PASS | PASS | PASS | `07-<size>-joined.png` |
| Room 3, Move apart: the join goes; Undo brings it | PASS | PASS | PASS | PASS | PASS | `07-<size>-apart.png` |
| Room 1 dropped on another: "already here", it goes back | PASS | PASS | PASS | PASS | PASS | `07-<size>-overlap.png` |
| New level: "A new level, ready to play" | PASS | PASS | PASS | PASS | PASS | `07-<size>-new-level.png`, `07-phoneSideways-new-level-tap.png` |
| Its menu, Delete; Undo brings it back | PASS | PASS | PASS | PASS | PASS | `07-<size>-deleted.png` |

### Send, ask, turn down, undo, put in (kid may suggest, grandma may put in)

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Kid drags the crate: the main button says "Send to check" | PASS | PASS | PASS | PASS | PASS | `08-<size>-kid-change.png` |
| "Send to check", "Send to grandma to check": "Sent", the top bar says "Waiting for grandma"; nothing written to the game | PASS | PASS | PASS | PASS | PASS | `08-<size>-sent.png`; the pretend GitHub's main did not move |
| Grandma opens the game: the top bar says "1 to check" | PASS | PASS | PASS | PASS | PASS | `08-<size>-one-to-check.png` |
| Tap "1 to check": a sheet over the level with the change marked | FAIL | FAIL | FAIL | FAIL | FAIL | R6: the old full page "Waiting changes" with Back (`08-<size>-waiting-list.png`), then a second full page with no top bar or tools (`08-<size>-check-sheet.png`) |
| That page has the change on the level, Play them, Put them in, Ask for a change, Don't put them in | PASS | PASS | PASS | PASS | PASS | `08-<size>-check-sheet.png` |
| Ask for a change: Send is off until words are typed; typed, "Send to kid": asked | PASS | PASS | PASS | PASS | PASS | `08-<size>-asked.png` |
| Kid sees grandma's words; his change is still on his device | PASS | PASS | PASS | PASS | PASS | `08-<size>-kid-asked.png` (N7: on a fresh device kid's top bar still said "Waiting for grandma") |
| Don't put them in, then Undo: the change is back under "1 to check" | PASS | PASS | PASS | PASS | PASS | `08-<size>-turned-down.png` |
| Put them in: the game has kid's change, one commit | PASS | PASS | PASS | PASS | PASS | `08-<size>-put-in.png`; main moved by one commit |

### Two people changed the same thing: whose to keep

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Grandpa moves the crate 2 tiles and puts it in | PASS | PASS | PASS | PASS | PASS | seen; main moved by one commit |
| Grandma, not knowing, moves the crate 1 tile and the start 1 tile, Put them in: one question, about the crate, both places shown on the level | PASS | PASS | PASS | PASS | PASS | `09-<size>-asked.png` |
| "Keep mine", Put them in: the crate is where grandma put it, the start goes in without a question | PASS | PASS | PASS | PASS | PASS | `09-<size>-kept.png` |

### Who can change it

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Share: anyone can suggest; add grandpa as "can check and put in"; Save: "Saved", the sharing file says so | PASS | PASS | PASS | PASS | PASS | `10s-<size>-sheet.png`, `10s-<size>-saved.png`; `automata.access.toml` on main |
| Grandpa (not an owner) reads the list in words, with a way to ask an owner and nothing to change | PASS | PASS | PASS | PASS | PASS | `10s-<size>-non-owner.png` |

### Notes

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| Kid (may only look): the crate, More, Add a note, writes, Pin it: a pin on the crate | PASS | PASS | PASS | PASS | PASS | `10n-<size>-pinned.png` |
| Grandma comes back to the tab: the pin is there; opens it, answers, Send | PASS | PASS | PASS | PASS | PASS | `10n-<size>-answered.png` |
| "Done: hide this note": it leaves the level; nothing went into the game itself | PASS | PASS | PASS | PASS | PASS | `10n-<size>-done.png` |

### The helper's ghost and paste

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| A helper changes the level in the game; coming back, a ghost card offers Keep or Undo | PASS | PASS | PASS | PASS | PASS | `10h-<size>-ghost.png` |
| Keep: the crate moves there as one step; Undo takes it back | PASS | PASS | PASS | PASS | PASS | seen |
| Help, Your helper, paste: nonsense is refused in words; a real level is offered as a ghost; Undo leaves the crate | PASS | PASS | PASS | PASS | PASS | `10h-<size>-paste-bad.png` |

### Find

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| The magnifier, "gate 1", tap Gate 1: it is picked | PASS | PASS | PASS | PASS | PASS | `10f-<size>-results.png`, `10f-<size>-picked.png` |
| Find "undo" lists the command with its key; Escape closes | PASS | PASS | PASS | PASS | PASS | `10f-<size>-command.png` |

### Your games

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| The game's menu, "Your games": the list of games | PASS | PASS | PASS | PASS | PASS | `13-<size>-list.png`; PS: the menu runs past the bottom of the screen and "Your games" is reached by scrolling it (N8, `13-phoneSideways-menu.png`) |
| Tap links-game: it opens | PASS | PASS | PASS | PASS | PASS | `13-<size>-opened.png` (N9: on a phone the top bar names the level, not the game) |

### Offline

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| The internet goes; Put them in: the sheet says there is no internet, nothing is lost, one thing to press | PASS | PASS | PASS | PASS | PASS | `11o-<size>-offline.png` (N6: the top bar shows only a red cloud, not the words "No internet") |
| Back online, Try again: one commit, in the game | PASS | PASS | PASS | PASS | PASS | `11o-<size>-back-online.png` |

### Problems first, and a game with a problem

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| A wall made on the map: the top bar says "1 problem" | PASS | PASS | PASS | PASS | PASS | `11p-<size>-count.png` |
| Tap it: the list says it in words with Show me; Show me: "Problem 1 of 1" at the wall | PASS | PASS | PASS | PASS | PASS | `11p-<size>-list.png`, `11p-<size>-show-me.png` |
| A problem warns but does not stop: Put them in is on | PASS | PASS | PASS | PASS | PASS | `11p-<size>-warns.png` |
| The game set to stop on problems: the sheet puts the problem first, Put them in is off, and says why | PASS | PASS | PASS | PASS | PASS | `11p-<size>-stopped.png` |
| Mend the wall from the sheet: Put them in is on again | PASS | PASS | PASS | PASS | PASS | `11p-<size>-mended.png` |

### Signed out, keep a copy

| Step | P | PS | IU | IS | C | Evidence |
|---|---|---|---|---|---|---|
| A visitor drags the crate: the main button says "Keep a copy" | PASS | PASS | PASS | PASS | PASS | `11v-<size>-keep-button.png` |
| Keep a copy: the sheet offers the level as its file; the file is the level as moved; nothing written to the game | PASS | PASS | PASS | PASS | PASS | `11v-<size>-sheet.png`, `11v-<size>-kept.png` |
| "Not now" or Close leaves the level as it is | PASS | PASS | PASS | PASS | PASS | `11v-<size>-closed.png` |

### The Pencil (pen input through Chrome DevTools, Links Game Room 2, Paint)

| Step | P | IU | IS | Evidence |
|---|---|---|---|---|
| A Pencil hovering shows the brush outline and paints nothing | PASS | PASS | PASS | `12p-<size>-hover.png` |
| The Pencil drags across 3 tiles: they are painted, "1 change" | PASS | PASS | — | `12p-ipadUpright-cdp-probe.png`, `12p-phone-cdp-probe.png` (the tile's colour changed; my first run looked for words the app does not show, so `12p-<size>-painted-FAIL.png` is a harness miss, not a defect; IS not re-run) |
| Then a finger drag slides the view and paints nothing | PASS | PASS | PASS | `12p-<size>-finger-slides.png` (the level slid 120px) |

### Turning the device

| Step | Result | Evidence |
|---|---|---|
| iPad sideways, crate picked, number pad open, its field focused; turned upright: all three kept | PASS | `12t-ipadSideways-sideways.png`, `12t-upright.png` |
| Turned back sideways: all three kept | PASS | `12t-sideways-again.png` |
| Phone upright, settings sheet pulled up; turned sideways: the crate still picked, its settings still open | PASS | `12t-phone-upright.png`, `12t-phone-sideways.png` |

## Not walked here

- A real iPad, a real Apple Pencil and a real on-screen keyboard: the owner's walk. The Pencil was stood in for by
  Chrome's pen input and touch by Chrome's touch input. No stand-in for the on-screen keyboard was tried, so "picks and
  open sheets survive the on-screen keyboard" is unwalked.
- Firefox and WebKit: this walk ran in Chromium only.
- Only English was walked; the other eight languages were not read.

## Findings

UNIT: `src/features/world/Guidance.svelte` (the tour's steps), with `src/features/shell/tour.ts`.
VERDICT: red (R1).
REQUIREMENT: spec, first open: "then the four-step tour: 1 the level, tap the crate; 2 the tools, tap Place; 3 the
crate's settings, drag How heavy; 4 Play, then Put in game".
REASON: the tour shown in World has two steps, tap the crate and drag How heavy; Place and Play/Put in game are left out.
EVIDENCE: `01-<size>-tour-1.png` at all five sizes says "1 of 2"; `Guidance.svelte` builds
`stepsIn(new Set<Step>(['tap-the-crate', 'drag-a-value']))`, while `tour.ts` has four steps.
EXPECTED: "1 of 4", with the steps tap Place and Play then Put in game in between, each saying "That worked".
FIX: give World's tour all four steps from `tour.ts` and walk them in the first-run journey. Files: `Guidance.svelte`,
`tests/journeys/first-run.journey.test.ts`.

UNIT: the Place tray at phone sideways (`src/features/world/insets.ts` and the tray's layout).
VERDICT: red (R2).
REQUIREMENT: spec and the screens rule: a panel never covers the thing you are working on; every size works.
REASON: at 844×390 the open Place tray covers the floor and Crate 1, so you cannot see where you put the new crate.
EVIDENCE: `03-phoneSideways-placed-FAIL.png`, `03-phoneSideways-placed.png`.
EXPECTED: the level fits in the room the tray leaves, as it does at the other sizes.
FIX: count the tray's height in the level's insets at phone sideways. Files: `src/features/world/insets.ts`, the tray's
component, and a screens journey shot at phone sideways.

UNIT: the play bar at phone sideways (`src/features/play/PlayBar.svelte`, `PlayPart.svelte`).
VERDICT: red (R3).
REQUIREMENT: spec, play in place: "the level plays where it is", with the bar over the level and the game seen.
REASON: at 844×390 the play bar covers the level, so the hero and crates are not in sight while you play.
EVIDENCE: `05d-phoneSideways-undefined-FAIL.png`, `06-phoneSideways-undefined-FAIL.png`.
EXPECTED: the game is seen whole (or the part where the hero is) with the bar beside or over an edge, as on the phone
upright.
FIX: lay the play bar out for a short screen (a side column, as the toolbar does with `SECOND_COLUMN`) and fit the game
in the room left. Files: `PlayBar.svelte`, `PlayPart.svelte`, `src/features/world/insets.ts`, a play journey shot at
phone sideways.

UNIT: the last-30-seconds strip (`src/features/play/PlayPart.svelte` `back(tick)`, `PlayBar.svelte`).
VERDICT: red (R4).
REQUIREMENT: spec, the play bar: "the last 30 seconds to drag back through".
REASON: one drag on the strip puts the hero back at the very start and the strip disappears, so you cannot drag back
and forth through the last seconds.
EVIDENCE: at all sizes, by finger and by mouse: `06t-strip-touch-after.png`, `06t-ipadUpright-back.png`; the hero's x
went 698 → 213 (the start). `PlayBar.svelte` shows the strip only while `strip.to > strip.from`, and after
`playing.backTo(tick)` the range collapses.
EXPECTED: dragging part way back puts the hero where it was at that moment; the strip stays, so you can drag again.
FIX: keep the recorded range after going back (only drop the part after the chosen tick when play goes on) and put the
hero at the chosen tick. Files: `PlayPart.svelte`, `PlayBar.svelte`, the play journey (a drag half way, then another).

UNIT: Play from here at phone sideways (`src/features/play/PlayPart.svelte` `tapped()`).
VERDICT: red (R5).
REQUIREMENT: spec, the play bar: "play from here (it waits for a tap …)": the hero starts where you tap.
REASON: at 844×390 the hero starts about two tiles left of the tap, so in Links Game the hero lands behind the closed gate
and the door is never reached.
EVIDENCE: `06t-phoneSideways-from-here-where.png`, `06d-phoneSideways-after-walk.png`; at iPad sideways a tap at x 567
put the hero at 564 (right), so the mapping fails only when the toolbar takes the left side.
EXPECTED: the hero starts under the finger at every size.
FIX: map the tap with the game's own box, counting the left toolbar's width at phone sideways. Files: `PlayPart.svelte`,
the play journey at phone sideways.

UNIT: checking someone's changes (`src/features/world/World.svelte` `page`, the team `Sheets`, `src/features/team/route.ts`).
VERDICT: red (R6).
REQUIREMENT: spec, Checking someone's changes: "'1 to check' in the top bar opens a sheet over the level with the changes
marked in orange"; the owner's design instruction 2: glass everywhere, no solid panels.
REASON: "1 to check" opens the old full page "Waiting changes" with a Back link; one more tap opens a second full page
with no top bar and no tools. The person leaves the level twice to check one change.
EVIDENCE: `08-<size>-waiting-list.png`, `08-<size>-check-sheet.png` at all five sizes; `World.svelte` says "The pages that
still take the whole screen: what waits, and one waiting change" and renders `Sheets` instead of the level.
EXPECTED: tapping "1 to check" opens a glass sheet over the level, the change marked in orange on the level, with Not
now, Play them, Put them in, Ask for a change and Don't put them in; with several waiting, the sheet lists them first.
FIX: show the waiting list and one waiting change as sheets over the level, using the kit's sheet surfaces. Files:
`World.svelte`, the team sheets, `route.ts` if the address changes, `send-to-check` and `approve` journeys, the screens
journey.

### Notes (not blocking)

- N1: the tour's last card says "That is the tour" twice, as its small heading and as its title (`01b-<size>-that-is-the-tour.png`).
- N2: at iPad sizes the device word is "on this computer"; the browser cannot tell an iPad here, so the owner's iPad walk should check it says "iPad".
- N3: the number pad's + is named "More", the same spoken name as the thing's three dots; "Add a half" or "Up" would be clearer.
- N4: at phone sideways, tapping Empty in the Paint tray missed once in four runs.
- N5: on a phone the pulled-up settings sheet hides Undo; you tap Done first (known since PR 15).
- N6: offline, the top bar shows a red cloud icon only; the spec says "No internet" in words, and a first-timer may not read the icon.
- N7: after grandma asked for a change, kid's top bar on a fresh device still said "Waiting for grandma"; the asked words were there once opened.
- N8: at phone sideways the game's menu is taller than the screen; "Your games" and "Sign out" are below the fold with no sign that it scrolls.
- N9: on a phone the top bar names the level, not the game, so after "Your games" there is no word saying which game is open.
- N10: no journey turns the device (no `setViewportSize` in `tests/journeys/`); plan Task 43 asks for one. The turn was walked here and passed.
