# Floating glass docks: every panel floats, on every screen, as frosted glass

Status: spec, 2026-11-15. Stage 1 of its own small cycle, inside the shell and World mockups round (roadmap slice 3,
PR 57). The Owner, reviewing the floating side panels drawn at 4e7707a: "Wait I actually like the floating docks, can
we do that everywhere? And also add a bit of apple frosted glass semi-transparent too", then: "That needs a plan and
spec I think." This page is the spec. The plan follows it; nothing here changes a mockup, and the mockups-first stop
still holds (no editor code until the Owner approves the mockups).

## The Owner's answers (2026-11-15)

The Owner said "Yes to both" to the two questions this spec asked (18:30 UTC):

1. **The level slides under the see-through panels once you move it.** It still **starts** fitted in the clear room,
   so no panel hides it when you open a level, press "Whole level" or turn the device; once you drag or zoom it
   yourself, it may slide under a panel and you see it softly blurred through the glass (see "The level under the
   glass").
2. **The top bar floats too**, as a bar held off the edges like the other panels.

The third point stands as written, with no question asked: the glass is on, and a "See-through panels" choice goes in
Settings, under "For me" (Choose for me, On, Off). "Choose for me" turns the glass off when the device is set to reduce
see-through things (Apple calls it "Reduce Transparency").

## Principles served

- **2. iPad-first editors.** The point is the iPad: one look for every panel at every size and way up, the level given
  the whole screen behind the panels, and panels that never cost touch size or readability.
- **1. Agent-first.** Nothing here is hidden state: the one new choice is a device setting of the person's own, like
  "Row size", and is never something an agent needs.

It breaks none: it is a look for the 2D shell that a 3D World would share, and it changes no content file.

## Why

The floating cards drawn at 4e7707a (iPad sideways and computer) made the canvas feel like the whole app, which is the
editors' direction ("the canvas is the app"). But the shell now has two looks: floating cards on wide screens, panels
stuck to the edges on phones and an upright iPad (the phone's peek line and the toolbar float already; its open sheet,
its sideways rail and the top bar do not). A person who turns their iPad round sees the design change under their
hands. One rule everywhere is simpler to learn and simpler to build. Frosted glass then lets the level show through
the panels, so the work feels close even where a panel sits on it.

## What changes

### One rule: every dock floats

A **dock** is any panel that stays on screen while you work: the top bar, the list (and its closed rail), the tools
bar, the inspector (the settings of what you picked, and its peek line and sheet on narrow screens), the band along
the bottom (timelines), the Put in game sheet and the sheets built like it (sign in, keep a copy, blocked, check,
offline), the play bar, the small map and the hold buttons (Shift, Alt, straight lines).

Every dock, at every size:

- sits **8 points** in from the window's edges and 8 points from its neighbours (the gap drawn at 4e7707a), plus the
  device's safe area (the notch, the rounded corners, the home bar), so on an iPhone held sideways the left dock sits
  8 points inside the notch, not 8 points from the glass;
- has rounded corners: **12** for docks, **14** for sheets; on a phone, the open sheet's two lower corners are larger
  (**28**) so they follow the phone's own rounded corners instead of fighting them;
- has the glass look below (or, for the few docks named in "Which surfaces get glass", a solid card), one thin
  edge and the shadow the toolbar has today;
- keeps every touch size it has today: 44 points for a control, 48 for a main button. Insets come out of the canvas,
  never out of a panel or a button;
- keeps its slot: where code measures from `--left-w`, `--right-w`, `--top-h`, `--sheet-h` or `--bottom2-h`, the slot
  stays the same width and the card sits inside it, as at 4e7707a. The level's starting fit is counted from the cards'
  inner edges.

Screens that are not docks do not float as docks: the welcome, the tour's cards, the new level's card, Help, Settings,
the keys sheet and the find bar already sit as cards over a dimmed screen. They stay solid (see "Which surfaces get
glass").

### Size by size

| Size | Today | With floating docks |
| --- | --- | --- |
| **iPad sideways** (1210 × 834) and **computer** (1280 × 800) | List or rail, inspector, band and Put in game float (4e7707a); top bar runs edge to edge | The same, and the top bar floats as a bar 8 points in, its height unchanged (answer 2). The list, rail and inspector start 8 points under it. |
| **iPad upright** (834 × 1210) | Top bar edge to edge; tools float; settings sheet floats (4e7707a); the list ("In this level") opens over the level | Top bar floats. Tools and sheet as now. The list opens as a floating card from the left edge, 8 points in, as tall as the room between the top bar and the tools. The closed sheet on a page with a band (84 points) floats too. |
| **Phone upright** (390 × 844) | Top bar edge to edge; peek line and tools float; the open sheet is stuck to the bottom edge | Top bar floats (its 56 points of height stay; the 8-point inset comes from the canvas). Peek and tools as now. The open sheet floats: 8 points in at the sides and the bottom (above the home bar), its lower corners 28, at most 60% of the screen's height, and the level's fit moves up above it as it does today. The tray (Add's choices) floats the same way. |
| **Phone sideways** (844 × 390) | Top bar edge to edge; the tools are a column stuck to the left edge; the inspector is a strip stuck to the right edge | Top bar floats. The tools become a floating column 8 points in (inside the notch's safe area), only as tall as its tools. The closed inspector becomes a small floating tab on the right with the picked thing's name; opened, it is a floating card 300 points wide, the full height under the top bar. The level is fitted between the two. |

On every size the dark canvas, with its grid or paper dots, runs edge to edge behind everything, as it does on wide
screens since 4e7707a.

### Collapsing

Nothing new is needed: the list already closes to its rail, the inspector to its peek line or tab, and the band to its
title row. Each closed form is a floating card too. No dock hides itself on a timer, and none hides while you work:
a panel that comes and goes by itself fails the drunk-grandma test.

### Every workspace

The rule lives in the shell (`shell.css`), so World, Characters, Feel, Sound and Story all get it. The slice in review
is the shell and World, so the plan checks the shell and World pages at all five sizes first; the other workspaces'
pages, which are not in the review now, must at least not break (one look at each at iPad sideways and phone).

## The glass

### The recipe

One recipe, as tokens in the last section of `shell.css`, used by every glass surface:

| Token | Value | What it is for |
| --- | --- | --- |
| `--glass` | `rgb(30 30 30 / 0.72)` | The tint: the editors' own `--ground` grey, 72% covering. |
| `--glass-filter` | `blur(24px) brightness(0.45) saturate(1.4)` | What is behind is blurred, darkened and given a little more colour, so the level's colours glow through without its shapes. |
| `--glass-edge` | `rgb(255 255 255 / 0.10)` | The 1-point edge. `--line` (#383838) vanishes on glass, so the edge is a faint white. |
| `--glass-shine` | `inset 0 1px 0 rgb(255 255 255 / 0.06)` | A one-point light along the top inside edge, added to `--shadow`: the "lit from above" line of Apple's glass. |
| `--glass-quiet` | `#a8a8a8` | Quiet words (labels, hints) on glass. Today's `--quiet` (#9c9c9c) is a little too dim over a bright level. |

Written out, a glass surface is:

```css
background: var(--glass);
-webkit-backdrop-filter: var(--glass-filter);
backdrop-filter: var(--glass-filter);
border: 1px solid var(--glass-edge);
box-shadow: var(--glass-shine), var(--shadow);
```

Both spellings of `backdrop-filter` are written: Safari before 18 knows only `-webkit-backdrop-filter`.

The darkening (`brightness`) is what keeps words readable: the blur alone does not make a white sky behind the panel
any darker. Over the dark canvas the glass comes out a little darker than today's solid panel (about #191919 against
#252525), which is why the edge and the shine are there: they keep the panel's outline.

### Readability (WCAG)

Measured with the WCAG 2.2 contrast formula (normal text needs 4.5 to 1, large text and icons 3 to 1), for the recipe
above over the worst things that can sit behind a panel: pure white, and the demo level's own colours (its sky
#9fd3f0, its sand #fdd4bd, its pink #f37f94, its grass #afd472). The blur makes what is behind closer to an average,
so pure white is the true worst case.

| Colour | Over pure white | Over the sky | Over the dark canvas | Rule |
| --- | --- | --- | --- | --- |
| Words `--words` #ededed | 10.3 | 11.4 | 15.0 | Passes everywhere |
| Quiet words on glass `--glass-quiet` #a8a8a8 | 5.1 | 5.6 | 7.4 | Passes; used for every quiet word on glass |
| Today's quiet `--quiet` #9c9c9c | 4.4 | 4.9 | 6.4 | Fails over white: not used for words on glass |
| Faint `--faint` #8c8c8c | 3.6 | 4.0 | 5.2 | Only for icons and edges on glass (3 to 1), never words |
| Peach `--touch` #eeb480 | 6.6 | 7.3 | 9.6 | Passes |
| Helper `--agent` #b5b1d8 | 5.9 | 6.5 | 8.6 | Passes |
| Olive `--mark` #a7a24a | 4.6 | 5.0 | 6.6 | Passes |

Buttons that carry their own solid colour (the white main buttons, the peach Put in game, the helper's lavender) are
solid on the glass, so their words keep their contrast today (dark on peach is 9.1 to 1).

The plan adds a check that reads the tokens and holds them to this table, so a later change to the tint or the
darkening that makes words unreadable fails CI. It measures against pure white, because that is the worst case.

### Which surfaces get glass

- **Glass:** every dock in "One rule: every dock floats" except the band along the bottom (solid, see "Speed on an
  iPad"), and the small floating things that sit over the level with
  them: the tool's options (`.opop`), the bar over a picked thing (Make another, Delete, Nudge), the tray, the small
  map, the hold buttons and the helper's card.
- **Solid** (today's `--panel` or `--raised`): what you read or decide in, which sits over a dimmed screen: the welcome,
  the tour's cards, the new level's card, Help, Settings, the keys sheet, the find bar, menus and drop-down lists, and
  the tip bubbles ("Drag the crate anywhere"), which stay the light, solid thing that catches the eye.
- **Never glass inside glass.** A surface inside a glass surface (a menu opened from the inspector, a slider's thumb)
  is solid. Safari blurs only what is under the outer glass for an inner one, so glass on glass looks wrong, and each
  extra layer costs speed.

### When there is no glass

The glass turns into today's solid panel (`--panel`, `--line` edge, no shine, `--quiet` words) in each of these cases,
with nothing else moving:

- the browser does not know `backdrop-filter` (`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))`);
- the device asks for less see-through (`@media (prefers-reduced-transparency: reduce)`), unless the person has set
  "See-through panels" to On;
- the person has set "See-through panels" to Off;
- the device asks for more contrast (`@media (prefers-contrast: more)`): solid, with the edge in `--quiet`.

"See-through panels" is a device setting, kept like "Row size": in Settings, "For me", with "Choose for me" (follows
the device), "On" and "Off". It never travels with the game. The plan names the one device key it is kept under and
adds that key to the list of what the device may keep in `CLAUDE.md` ("Particular to this repo"), since that list is
the rule; it is also where "Row size" and the other "For me" choices should be named, which the plan checks.

## Speed on an iPad

Blurring what is behind a panel is done again every time what is behind it changes, which is every frame while the
level is dragged, zoomed or played. On an iPad the cost grows with the blurred area and the blur's size. So:

- **A budget.** Glass covers at most about a third of the screen at once. On iPad sideways the list, the inspector and
  the top bar are about 30%; a band along the bottom with both side panels open is over it, so **the band is solid**
  (it is also where timelines are read closely).
- **One blur size** (24) everywhere, never animated. A panel that opens or closes slides; its blur does not grow.
- **No glass inside glass**, as above.
- **Moving things are solid.** What follows a finger (a thing being dragged, the drawing line) is never glass.
- **Proof.** CI has no iPad and no GPU, so it cannot prove the speed. The plan adds a mockup page that pans the level
  under the glass by itself, with a frame counter on it, and asks the Owner to open it on the iPad Pro 11 (a real-device
  test is the Owner's). It is fine at 60 frames a second or more while panning. If it is not, the first step is a
  smaller blur (16), then glass on the top bar and the small floating things only. That fallback is decided by the
  Owner after the test, not switched on by the editor by itself.

The real editor draws the level with PixiJS into one canvas. Safari blurs a canvas behind a glass panel like any
other content; nothing in the canvas changes for the glass.

## The level under the glass

As the Owner decided (answer 1):

- The level's **starting fit** (opening a level, "Whole level", turning the device, opening or closing a panel) is
  counted from the cards' inner edges, exactly as today. No panel covers any of the level at the start.
- Dragging or zooming the level moves it freely, under the panels too. The rest of the shell already works this way
  for the canvas; only the fit is held to the clear room.
- A thing that is picked and then hidden under a panel is brought back into the clear room when it is picked from the
  list (as Figma does), so "where did it go" never happens.

The mockups are still pictures, so to show this the plan adds one page, `world-levels-glass.html`, with the level
dragged so that its sky and hills sit under the list and the inspector, at all five sizes; and one page,
`world-levels-solid.html`, the same scene with "See-through panels" set to Off, so the Owner sees both.

## What the plan must cover

- One new last section in `shell.css` (later wins, prefixed `html body.sh`, as every review round has done) with the
  tokens and the rules above. No new package: the glass is CSS only. No change to `mockup.css`, which the other
  workspaces' older pages also read, except where a shared class needs it.
- Every dock at every size floating per the table, with safe areas (`env(safe-area-inset-*)`).
- The two new pages, the Settings page's new choice (`shell-settings.html`, under "For me"), and the device word for
  "Reduce Transparency" on each device.
- The contrast check over the tokens (in `tests/`, run in CI only).
- The speed page for the Owner's iPad.
- CI's pictures (`docs/mockups/shoot.mjs`) of every shell and World page at the five sizes, looked at before the
  Owner sees them. Headless Chromium in CI draws `backdrop-filter`; the plan's first task confirms it does on the
  runner (a picture with the level under the glass must show the blur), and if it does not, takes the pictures with
  the GPU flags that make it.
- The board: the editor mockups artifact is republished with the new pictures, the two new pages and a "What changed
  and why" list, before anyone reports the round done.
- The visual review steps (plain words, design pass, end-to-end, second look) apply to this round as to every UI
  round, unless the Owner says this is a targeted change like the 4e7707a one.
- What it feeds: the editor design-language page the Owner asked for after mockup approval takes this recipe and the
  dock rule as written here.

## Left out

- No glass on the game itself or on anything the game draws: the editors' look never restyles a game's art.
- No change to the colours (palette E No. 310 accents, the neutral dark greys, the helper's #b5b1d8) or the fonts
  (Fraunces for big titles, Onest for the rest, JetBrains Mono for numbers). The one new colour is `--glass-quiet`, a
  lighter grey of the same neutral family.
- No light mode: the editors are dark only.
- No panels that hide by themselves, and no rearranging or tearing off panels; that is a later choice of the Owner's.
