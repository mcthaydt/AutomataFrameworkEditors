# The editors' design language

The rules every editor screen follows. They come from the mockups the Owner approved on 2026-11-16 (board v17,
[`docs/mockups/`](mockups/), `shell.css` and `frame.js`) and the review reports that shaped them (`docs/superpowers/audits/`).
Where this page and the mockups differ, the mockups win; fix this page. The shared project rules are in
[AutomataFramework `docs/rules.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/rules.md).

## 1. The idea

- **Figma-simple. The canvas is the app.** The level, figure, song or story fills the screen; everything else floats
  over it and gets out of its way.
- **One shell, six workspaces:** World, Characters, Feel, Sound, Story, Screens. The top bar, panels, toolbar, sheets
  and words are the same in all six; learning one teaches the rest.
- **The game's real art is never restyled.** The editor's look is only its own skin.
- **Nothing 2D-locked.** No stacked "layers" sheets, no tile rules in the shell, and lists of numbers ("Where it is")
  leave room for a third one, so the same shell serves 3D.

## 2. Colour (dark only)

| Token | Value | Use |
|---|---|---|
| `--ground` | `#1e1e1e` | the page and the canvas behind everything |
| `--panel` / `--raised` / `--hover` | `#252525` / `#2a2a2a` / `#333333` | panels, raised rows, hover |
| `--line` | `#383838` | edges on solid panels |
| `--words` | `#ededed` | words |
| `--quiet` | `#9c9c9c` (`#a8a8a8` on glass) | labels and hints |
| `--faint` | `#8c8c8c` | icons and edges only, never words on glass |
| `--accent` | `#eeb480` (palette No. 310's peach) | **only** what is picked and the one main button (Put in game, Share) |
| `--agent` | `#b5b1d8` (Wada No. 177, Grayish Lavender A) | **only** what a helper (an agent) did |
| problem red | `#e5484d` | a problem, an overlap, a blocked edge |

- Neutral greys carry the frame; the accent means "picked" or "press this", nothing else. A picked thing gets a 2-point
  accent ring with finger-sized corner handles; a picked row is `#363636` with a 2-point accent edge, never accent mixed
  into grey. A picked segment is the lightest and white.
- Palette No. 310's olive (`#a7a24a`) is not drawn in the shell today; the plain-words round turned `--mark` grey.
- Words a person reads are never fainter than about 4.6 to 1.

## 3. Type and icons

- **Fraunces** (600, set about 2 points larger than the Onest it replaces) for the few big titles only: the welcome,
  the tour's cards, a sheet's heading, a new level's card, Help, Settings, the keys sheet.
- **Onest** for everything else: 15 px on touch, 13 px with a mouse. **JetBrains Mono** for numbers.
- Fraunces has no Russian letters, so Russian titles fall back to Onest; Chinese, Japanese and Korean get their own
  partner fonts.
- Sentence case everywhere; no capitals, no letter-spacing, no code signs.
- **Phosphor icons, regular.** An icon is never hidden with its word: rail buttons have a word under them, and where a
  bar is short of room it keeps the icon and the word moves to a short stand-in, never to nothing.

## 4. Glass and docks

- **Every dock floats**, 8 points in from the window and its neighbours, clear of the notch and the home bar. The canvas
  runs edge to edge behind them.
- **Glass** for docks (top bar, side panels, toolbar, tray, bar over what is picked): `rgb(30 30 30 / 0.72)`,
  `blur(24px) brightness(0.45) saturate(1.4)`, a 1-point `rgb(255 255 255 / 0.10)` edge and a faint top shine.
- **Soft glass** for what you read or decide in (the bottom band, menus, Help, Settings, the welcome and its cards, the
  keys sheet, the number pad): `rgb(37 37 37 / 0.92)`, `blur(12px) brightness(0.5) saturate(1.2)`.
- **Tips and the tour's cards stay solid and light** (dark words on the accent), the one thing meant to stand out.
- **Never glass inside glass**: anything drawn inside a glass surface is solid. Blur is never animated.
- Glass turns into a solid panel when the browser has no blur, the device asks for less transparency or more contrast,
  or "See-through panels" is Off in Settings.

## 5. Layout

- **Top bar:** the game's menu, the editor switcher, the part switcher, Map, Undo and Redo, problems ("1 problem"),
  Find, Play, and Put in game (or Send to check) with where the changes are as its second line. 48 high on a computer,
  56 on touch, 44 on a phone on its side.
- **Left panel:** the list of what is in it, and Add. Open on a computer; closed to a labelled rail on an iPad held
  sideways; opened over the level on an upright iPad and a phone. Find in the top bar filters it.
- **Right panel (the settings):** shown only when something is picked. The few values that matter, in one order (what it
  does, how it looks, where it is), the rest behind "N more settings", and under that the same values as the file's
  text, for an agent. Hide folds it to a **tab at the right edge**, with the thing's picture and its name written
  upright; a tap brings it back. On a phone it is a sheet closed with Done.
- **Toolbar: tools only.** Five tools every workspace shares, each with its key: Pick (V), Place (A), Paint (B), Erase
  (E), Join (L). A tool with no job on a page is left out, never dimmed. The picked tool's settings sit just above the
  toolbar; things to place or paint sit in one tray. On an iPad held sideways the tools go down the left edge.
- **The bar over what is picked:** at most four things, never on top of the thing; Move opens a pad of four big
  arrows; "…" holds the rest, and press and hold opens the same list.
- **At most two things float over the level at once.** An open menu or pad takes the place of the bar it came from.
- **Play in place:** the level runs where it is drawn, panels stay where they were and go quiet, every play control
  says what it does, and on touch the game's own touch controls are drawn.

## 6. Touch, Pencil, mouse

- Designed **iPad Pro 11 sideways first** (1210 × 834), then computer (1280 × 800), iPad upright (834 × 1210), phone
  (390 × 844) and phone on its side (844 × 390). Phone is up to 500 wide; above 1000 wide and 600 tall is the
  sideways-iPad and computer layout.
- Every control a finger uses has a **44-point hit area, measured**; main actions 48. Touch rows are 44, mouse rows 30
  (a mouse segment is 24 high).
- **Hold-buttons** for the free thumb stand in for Shift and Alt on touch, only where they do something.
- **Apple Pencil is first-class:** once a Pencil is seen it does the tool, one finger slides the view, taps still pick,
  and a hovering Pencil gets the mouse's small rows. Nothing depends on double tap, squeeze, barrel roll or pressure.
- Rows change size only when a panel next opens, never under a moving hand.
- Anything that can be dragged can also be moved with buttons and with the keyboard. No action is only a gesture.

## 7. Every action has a way back

- Undo and Redo everywhere, faint when there is nothing to undo.
- Every action has its opposite in sight: open and close, hide and show, lock and unlock, go in and come back, join and
  pull apart. Every sheet has its way out (Close, Done or Cancel), and its buttons stay at its foot.
- What just happened is a short note at the top of the level with one thing to press, usually Undo.
- A helper's change waits on the canvas as a ghost in the lavender, with what it says and **Keep** or **Undo**.
- A first-run tip goes once the thing it teaches is done, and never covers what is picked.

## 8. Words (the drunk-grandma test)

- Plain words a person would say. Never "repo", "commit", "branch", "pull request" or "token" on a screen.
- **One word per action**, and one action per word: Move, Make a copy, Copy to paste, Delete, Rename. "Share" is only
  the screen for who may do what; changes go in with **Put in game**, or **Send to check** for someone who may only
  suggest.
- Where the changes are, in words that cannot be read as "done": "3 changes, only on this iPad", then "Everyone has
  your changes". The device's own word is used ("iPad", "phone", "computer").
- A number has its noun ("3 changes", not "3"). A value can be words with its number beside it ("Quite heavy", with the number small beside it).
  Zoom is said in words: Whole level, Close up, Whole world.
- A button that can't act says why ("A level has one Start"). What is not built is drawn as it will be: no "Soon".
- Every word lives in `src/features/words/`.

## 9. Languages and first run

- The editors speak English, Spanish, Korean, Japanese, Chinese and Portuguese (the games' six) plus French, Russian and
  German. The language card comes before the welcome, each language in its own words with its flag.
- First run: the language, the welcome card (what this is and the three things you do), a short tour that dims
  everything but the part it is about, and Help with ticks for the basics. A new kind of screen comes with its own first
  run.
