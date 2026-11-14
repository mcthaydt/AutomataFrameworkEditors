# Pinch to Zoom on the Level: the Amendment to Task 7

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (project rule). Nothing runs locally: "run" in a step
> means push and read the pull request's checks.

**Goal:** At every size a person can make the level bigger with a pinch, move it with two fingers and get the whole
level back with one press, while one finger keeps meaning "move this thing".

**Architecture:** The editors hold one small value, the view (how much bigger than the whole level, and which point of
the level is in the middle). Pure functions in `levels/view.ts` turn fingers, the wheel, keys and buttons into a new
view; `Stage` hands the view's `Fit` to the framework's still picture, which redraws the level sharp at that scale (one
small framework addition, `setView`), and lays its hit buttons and notes by the same `Fit`. The canvas never grows and
is never stretched by CSS.

**Tech stack:** as the plan's. Pointer Events for fingers, pens and the mouse; `wheel` for a trackpad and a mouse
wheel; Safari's `gesturechange` for its trackpad pinch. No new dependency.

**Spec:** [`specs/2026-11-14-editors-blueprint-redesign-design.md`](../specs/2026-11-14-editors-blueprint-redesign-design.md),
which this pull request updates ("Every size" and "Testing"). It serves principle 2 (iPad-first editors: touch first)
and principle 1 (nothing gesture-only: every gesture has a button, a key and a find-bar command).

**This amends** [`2026-11-14-editors-blueprint-redesign.md`](2026-11-14-editors-blueprint-redesign.md) ("the plan"),
Task 7, as that task asks. The Owner answered the plan audit's Q1 with **C** on 2026-11-14: "pinch to zoom and drag
with two fingers at every size, like Figma". Everything in the plan stands unless this page says it changes; where the
two differ, this page wins. Its Global Constraints, stop rules, sizes, test hooks and review pictures all apply here.
The plan audit read this page before Task 7 starts
([`audits/2026-11-14-blueprint-redesign-task-7-zoom-plan-audit.md`](../audits/2026-11-14-blueprint-redesign-task-7-zoom-plan-audit.md));
its findings are written in below, marked `(audit I<n>)` and `(audit M<n>)`.

## The Owner's answer on a phone held upright (2026-11-14): O1, A

Once the level takes pinches and two-finger moves, it must own every touch that lands on it, so a swipe on the level
can no longer scroll the page. The spec's phone-upright screen scrolled the page below the level to reach the notes'
switch and the title block (the plan's ruling 3). The Owner was asked where those two go, through the coordinator,
with three options (A: nothing scrolls and they float in a row above the tools; B: nothing scrolls and they move into
the pill's menu; C: the page still scrolls, from the bars only), and answered **A**: "nothing scrolls. They float in
one row above the tools, like at every other size, and you can close them like the other panels." A phone held upright
has height to spare (the level is about 210 px tall in about 550 px of clear space), so the level stays as big as it
is. The lines this decides are marked `(O1)`. The Owner was also shown rulings 22 and 25 below and did not object.

## Rulings made by this amendment

Numbered on from the plan's. The plan audit may challenge each.

20. **The view** is `{ zoom, x, y }`: `zoom` 1 is the whole level fitted in the clear cell (the plan's fit, unchanged),
    and `x`, `y` are the level's point, in tiles, at the middle of the clear cell. Zoom never goes under 1. Its most is
    the zoom at which one tile is 128 CSS px, and never less than 2. On each axis, a level smaller than the clear cell
    is centered; a larger one may be moved until its edge meets the clear cell's edge, no further. So at zoom 1 the
    level is exactly where the plan puts it, and nothing a person does can lose the level off the screen.
21. **One finger never moves the level, and two fingers always do.** One finger on a thing drags it; one finger on
    empty space lets go, adds (Task 10) or does nothing. Two fingers anywhere on the level zoom and move it at once,
    whatever tool is chosen and in every mode (`edit`, `look`, `read`). There is no double tap, no turn and no glide
    after the fingers lift: the level stops where it was let go (the plan's "no bounce").
22. **On a desktop, as Figma does it**, because the Owner's answer makes two fingers the move: two fingers on a
    trackpad move the level; a trackpad pinch zooms about the pointer; a mouse wheel moves the level up and down (with
    Shift, sideways); Ctrl or Cmd with the wheel zooms about the pointer. A person with only a mouse also has the
    buttons and the keys.
23. **Three zoom buttons** (smaller, bigger, the whole level) are on screen at every size, in their own panel
    (`data-part="zoom"`). It closes and opens like the other panels (audit I7: the Owner's "every editor panel can be
    closed and opened"; a pinch, the wheel, the keys and the find bar still zoom while it is closed): `PanelName` gains
    `zoom`, its handle sits where it was, and "Hide everything" leaves the pill, the cluster, the handles and undo and
    redo, as ruling 17 has it. A tip whose target is the closed zoom panel points at its handle (Task 12's rule).
24. **The view is not kept.** Every level opens whole, and a reload shows the whole level. The device keeps nothing
    new for it but one tip's "seen" (`af.tip.zoom`, which `CLAUDE.md`'s `af.tip.*` already allows).
25. **A second framework addition** (after the plan's ruling 13): `LevelPicture.setView`. The merged `setRoom` refuses
    a negative room, so it cannot show part of a level; drawing the picture bigger by CSS would blur the art, and a
    bigger canvas passes a phone's WebGL limits at four times a 390 × 844 screen. It is its own pull request in
    AutomataFramework and one more pin move, both before pull request 5.
26. **The first visit is still one drag and one press.** Nothing about zoom is taught before the first change. Two
    tips exist beside it: if a first-time visitor zooms or moves the level so the crate is out of sight before
    dragging it, the tip points at the whole-level button ("Press here to see the whole level."); and the first time
    someone on a touch screen zooms in **with the buttons, a key or the find bar**, after the first run, one tip by the
    zoom buttons says "Use two fingers to move the level. Pinch to zoom.", once. Someone who zoomed with their fingers
    already knows: that zoom sets `af.tip.zoom` and shows nothing (audit M4).
27. **A thing you are working on is never left out of sight.** Dragging a thing to the clear cell's edge slides the
    level under it; a thing that takes keyboard focus, is nudged, is picked from the find bar or is changed by undo or
    redo is brought into the clear cell by the least move that shows it. Focus from a finger or the mouse never moves
    the level (audit I2): Chromium and Firefox focus a button on press, and a reveal there would slide the level out
    from under the finger that is starting a drag (the spec: nothing refits under a finger).
28. **(O1, the Owner's answer A)** On `narrow` the frame is the window, as on `wide` and `mid`; nothing scrolls, and
    the switch and the block float in a row above the tools and close and open like the rest. This replaces the plan's
    ruling 3 and the last sentence of its ruling 17, and `LEAST_LEVEL_HEIGHT` is not made. Task 7 is built this way
    from its first step (audit I6): it never builds the scroll only for this page to take it out.
29. **Nothing on the level screen lets the browser zoom or scroll the page** (audit I1). A pinch with one finger on a
    panel and one on the level, a trackpad pinch over the pill, or a swipe on the tools would otherwise zoom or move
    the whole page, which breaks the frame's own measuring. So, while the level screen is open: the frame has
    `touch-action: none`, and only the declared scroll regions (the sheet's body, a menu's list, the find bar's list,
    the tray) say `touch-action: pan-y`, which holds because the browser intersects `touch-action` only up to the
    nearest scrolling box; `document` listens to `gesturestart` and `gesturechange` (Safari) and `window` to `wheel`
    with Ctrl or Cmd, all `{ passive: false }`, and calls `preventDefault()` on each; `overscroll-behavior: none` is
    set on `html` and `body` by a class the level screen adds and removes, so every other screen keeps the browser's
    own pull to refresh. Ctrl or Cmd with `+`, `-` or `0` is left to the browser: a person who needs the page bigger
    keeps that.
30. **The frame keeps clear of the phone's own edges** (audit M12). The page asks for `viewport-fit=cover`, so on a
    phone with a home bar the bottom row would sit in the band the system's swipe takes. The frame's 16 px margin is
    `max(16px, env(safe-area-inset-<side>) + 8px)` on each side, and the least room of ruling 2 is measured inside it.

## Review Focus

Inputs a person will meet that the rules above imply. Each has its test in the step named.

1. **A gesture cut short** (a phone call, the system's own swipe, a palm): a `pointercancel` on one finger in the
   middle of a pinch ends the gesture where it is, and the next one-finger drag works. Step 2.
2. **No room at all** (a tiny window, or the room eats the stage): the whole-level scale is 0; the view is `{ 1, w/2,
   h/2 }`, no `NaN` reaches `data-view`, and the three buttons are disabled. Step 1.
3. **A very big level** (200 × 100 tiles, 4 px a tile when whole): the most zoom is 32, `stepZoom` reaches it and
   stops, and `reveal` brings a thing at the far corner into the clear cell. Step 1.
4. **A level that changed size while zoomed** (the file changed elsewhere and was opened again): the view is clamped
   to the new level and never shows only sky. Step 1.
5. **Two kinds of pinch at once** (iOS sends Safari's gesture events during a finger pinch): the zoom is applied
   once. Step 2.
6. **One finger on a panel and one on the level:** only fingers that went down on the level count, so this is a
   one-finger touch and the level does not zoom, and the page does not zoom either (ruling 29). Step 2, Step 4.
7. **A mouse wheel with Ctrl** (Chromium on Windows and Linux sends `deltaY` 100 a notch): one notch zooms about as
   much as one press of a button, never two and a half times. Step 2 (audit I3).
8. **A press on a thing near the clear cell's edge:** the level does not move until the edge slide starts. Step 2
   (audit I2).

---

## File structure

```
AutomataFramework
  src/features/render/stage.ts, still.ts     setView                                  Task 7a
AutomataFrameworkEditors
  src/features/levels/view.ts                the view and every way it changes, pure  Step 1
  src/features/levels/Stage.svelte           fingers, wheel, the view's Fit           Step 2
  src/features/levels/ZoomButtons.svelte     the three buttons                        Step 3
  src/features/levels/layout.ts              rooms for the zoom buttons               Step 3
  src/features/levels/Levels.svelte          zoom(), keys, reveal, where the panel sits   Step 3
  tests/fixtures/journey.ts                  pinch, twoFingerMove, wheel, touchPress  Step 4
```

New test hooks, added to the plan's list: `data-zoom` on the stage (the view's zoom to two decimals, `1` when
whole); `data-view="<x>,<y>"` on the stage (tiles, two decimals); `data-moving` on the stage while fingers move the
level; `[data-zoom-out]`, `[data-zoom-in]`, `[data-zoom-whole]` on the three buttons. `data-scale` stays the pixels
per tile of what is on screen, so it now grows with the zoom.

---

## Before pull request 5

### Task 7a (in AutomataFramework): `setView`

Done on a branch of **mcthaydt/AutomataFramework**, as the plan's Task 2 was, following that repo's `CLAUDE.md`. Its
pull request body names this page. Its tracker gets one log line.

**Files:**
- Modify: `src/features/render/stage.ts`, `src/features/render/still.ts`
- Modify: `docs/api/framework.api.md` and a `patch` changeset, made the way Task 2's were
- Test: `tests/features/render/still.browser.test.ts`

**Interfaces:**
- Consumes: Task 2's `createLevelPicture`, `Stage.setRoom`, `Fit`.
- Produces:

```ts
// stage.ts, on Stage, and still.ts, on LevelPicture (which passes it through)
/**
 * Draws the world exactly here, in place of the fit in the room: `scale` pixels a tile, its top-left corner at `left`,
 * `top` (CSS pixels, rounded to whole device pixels; either may be negative). `undefined` goes back to the fit in the
 * room. A scale that is not above zero, or not a number, is taken as `undefined`. The sky and the backdrop still fill
 * the canvas, the backdrop standing on the level's bottom edge as it does for a fitted level. Draws the last views again.
 */
setView(view: Fit | undefined): void
// `fit()` on both now answers the view while one is set, and the fit in the room otherwise.
```

- [ ] **Step 1: Failing browser tests** (three engines; the full game with its pictures, `keep: true`, a 600 × 300
      mount, so the fit is scale 33.33):
  - after `setView({ scale: 66.6667, left: -200, top: -300 })`, `fit()` is that view, the pixel at (233, 200) is
    `crate-1`'s (its middle, 6.5 × 66.6667 − 200 and 7.5 × 66.6667 − 300), and the canvas's `width` and `height` are
    what they were;
  - after `setView({ scale: 10, left: 400, top: 200 })` the pixel at (10, 10) is the sky's or the backdrop's, never
    transparent;
  - `setView(undefined)` gives back the first `fit()`, and `toDataURL()` equals the one taken before any view;
  - `setRoom(...)` and a mount resized to 500 × 300 while a view is set leave `fit()` the view;
  - `setView({ scale: Number.NaN, left: 0, top: 0 })` and a scale of 0 act as `undefined`;
  - `show(level)` with a view set keeps `fit()` the view and draws the changed level in it (audit M7);
  - on the stage, a `draw` with a shot places the level by the camera whatever view is set, and `fit(shot)` answers
    the camera's placement: the view is only for a level drawn without a shot (a running game never meets it).
- [ ] **Step 2:** Push; red. **Step 3:** Implement: the stage keeps `view: Fit | undefined`; `fitFor` with no shot
      answers it (offsets through `snap`) before the room; no cover strip is drawn while it is set.
- [ ] **Step 4:** Push; every check green, the parity jobs and goldens unmoved (no golden file is in the diff).
- [ ] **Step 5:** The API report and changeset as Task 2 made them. Commit
      `feat(render): a level picture drawn at a view`. Report `Task 7a`.

### Task 7b: the third pin

- [ ] Move the framework pin to Task 7a's merge commit, in its own pull request, exactly as the plan's Task 1 did
      (`package.json`, `pnpm.onlyBuiltDependencies`, the lockfile). Green, merged, then pull request 5 starts.
      Report `Task 7b`.

---

## Task 7, with zoom

Task 7's files, interfaces, layout table and steps stand, with the O1 lines (ruling 28) and the changed test lines of
Step 3 below written into its own Step 1, so the frame is built without the `narrow` scroll from the start (audit I6).
These steps are added to it and run **after its Step 5** (the frame's commit, green), in the same branch. Each ends
with its own commit, and Task 7's report waits for Step 5 below.

**Files:**
- Create: `src/features/levels/view.ts`, `src/features/levels/ZoomButtons.svelte`
- Modify: `src/features/levels/Stage.svelte`, `Levels.svelte`, `layout.ts`, `src/features/ui/icons.ts`
  (`zoomIn: magnifyingGlassPlus`, `zoomOut: magnifyingGlassMinus`, `zoomWhole: frameCorners`; audit M11:
  `cornersIn` beside "zoom out" reads as "smaller"; if `@phosphor-icons/core` 2.1.1 has no `frame-corners`, Task 4's
  icon test says so and `cornersIn` stays), `src/features/ui/panels.ts` (`PanelName` gains `zoom`, audit I7),
  `src/features/ui/ui.css` (ruling 29: `html.level-screen, html.level-screen body { overscroll-behavior: none }`; the
  frame `touch-action: none`, the scroll regions `pan-y`; ruling 30: the frame's margins),
  `src/features/words/en.ts`, `tests/fixtures/journey.ts`
- Test: `tests/features/levels/view.test.ts`, `tests/features/levels/stage.browser.test.ts` (more cases),
  `tests/features/levels/levels.browser.test.ts` (more cases), `tests/features/levels/layout.test.ts` (changed
  numbers), `tests/journeys/zoom.journey.test.ts`; `tests/journeys/frame.journey.test.ts` and
  `panels.journey.test.ts` (changed lines, named in Step 3)

**Interfaces:**
- Consumes: Task 7a's `setView`; the plan's `fitInRoom`, `Room`, `Fit`, `HitId`, `Stage`, `Levels`.
- Produces:

```ts
// levels/view.ts. `clear` is the clear cell in the stage's CSS pixels; `home` is fitInRoom(stage, room, world).
export interface LevelView { readonly zoom: number; readonly x: number; readonly y: number }
export const MOST_TILE_PX = 128
export const ZOOM_STEP = 1.5
export const EDGE_PX = 40          // how near the clear cell's edge a dragged thing starts the level sliding
export const SLIDE_PX_S = 480      // the fastest it slides, at the edge itself
export function whole(world: Size): LevelView                       // { zoom: 1, x: w / 2, y: h / 2 }
export function isWhole(view: LevelView): boolean                   // zoom under 1.005
export function mostZoom(home: Fit): number                         // max(2, MOST_TILE_PX / home.scale); 1 when home.scale is 0
export function clampView(view: LevelView, home: Fit, clear: Box, world: Size): LevelView   // ruling 20
export function fitOf(view: LevelView, home: Fit, clear: Box): Fit   // what setView takes
export function zoomAbout(view: LevelView, home: Fit, clear: Box, world: Size, at: Point, factor: number): LevelView
export function panBy(view: LevelView, home: Fit, clear: Box, world: Size, dx: number, dy: number): LevelView
export function pinch(start: LevelView, home: Fit, clear: Box, world: Size,
  from: readonly [Point, Point], to: readonly [Point, Point]): LevelView
export function stepZoom(zoom: number, way: 'in' | 'out', most: number): number
export function reveal(view: LevelView, home: Fit, clear: Box, world: Size, box: Box): LevelView   // box in tiles
export function edgeSlide(at: Point, clear: Box, seconds: number): { readonly dx: number; readonly dy: number }
```

`fitOf`: `scale = home.scale × zoom`, `left = clear.x + clear.w / 2 − x × scale`, `top = clear.y + clear.h / 2 − y ×
scale`. `zoomAbout` keeps the level's point under `at` under it, then clamps. `panBy` moves the level by `dx`, `dy`
pixels (a finger moving left by 10 moves the level left by 10), then clamps. `pinch` scales by the ratio of the two
fingers' distances and moves by their midpoint, always from the view the gesture started with, then clamps.
`stepZoom`: in is `min(most, zoom × ZOOM_STEP)`; out is `zoom / ZOOM_STEP`, and anything under 1.01 is 1. `reveal`
returns the same object when the box, with half a tile around it, is already in the clear cell; otherwise the nearest
view at the same zoom that holds it. `edgeSlide` is how far the view travels in `seconds`: nothing unless `at` is
within `EDGE_PX` of an edge of `clear`, then toward that edge at `SLIDE_PX_S` times how deep in it is (0 to 1).

```
Stage.svelte   new props: view: LevelView (bindable; a new level or none given is `whole`), ondragcancel(),
               onview?(view: LevelView, by: 'fingers' | 'wheel' | 'buttons' | 'reveal')
               exports: zoom(way: 'in' | 'out' | 'whole'), reveal(id: HitId)
               The `Fit` it gives `layer`, the hit buttons and a drag is `fitOf(view, …)`. `[data-clear]` stays the
               clear cell (it does not zoom). The stage clips what leaves it.
ZoomButtons    props: view: LevelView, most: number, column: boolean, onzoom(way)
               Three 44 px icon buttons in a `Panel` (`data-part="zoom"`): `[data-zoom-out]` (`WORDS.zoomOut`),
               `[data-zoom-whole]` (`WORDS.zoomWhole`), `[data-zoom-in]` (`WORDS.zoomIn`), the words as accessible
               names. Out and whole are disabled when `isWhole`; in is disabled at `most`.
Levels.svelte  exports gain: zoom(way: 'in' | 'out' | 'whole')
               LevelState gains: zoom: number, whole: boolean
```

### What each touch does

Only pointers that went down on the stage count. A "clean tap" is one finger down and up within 10 px, with no second
finger on the stage at any time between.

| What happens on the stage | What it does |
|---|---|
| one finger down on a thing | picks it at once (Move), as Task 7 says |
| that finger moves past the drag start | drags the thing, through the view's `Fit`; `ondragend` when it lifts |
| a clean tap on empty space | on finger up: lets go of the pick (`onpick(undefined)`); with Add, Task 10's `ontouch` |
| a clean tap on a thing with Erase (Task 10) | on finger up: erases it. Never on finger down |
| a second finger lands while one is down | a drag in progress is called off: `ondragcancel()`, the thing is back where the drag began and no undo step is made; a pick that first finger made is put back to what was picked before it landed; from here the two fingers zoom and move the level |
| two fingers move | `pinch(...)` from the view at the second finger's landing; `data-moving` is set |
| one of the two lifts, or is cancelled | the gesture ends where it is. The finger still down does nothing until every finger is off |
| a third finger | ignored; the first two carry on |
| the mouse, or a pen | one pointer: as one finger |

| On a desktop | What it does |
|---|---|
| `wheel` with Ctrl or Cmd (a trackpad pinch in Chromium and Firefox; a mouse wheel with the key) | `zoomAbout(view, …, pointer, exp(−clamp(deltaY, −40, 40) × 0.01))`: a trackpad's small steps pass whole, and a mouse notch is at most × 1.49, about one press of a button (audit I3). Ignored between `gesturestart` and `gestureend`, so Safari can never zoom twice (audit M6) |
| `wheel` without (two fingers on a trackpad; a mouse wheel) | `panBy(view, …, −deltaX, −deltaY)`; with Shift and no `deltaX`, `deltaY` moves it sideways |
| `gesturestart`, `gesturechange` (Safari's trackpad pinch) | `zoomAbout(the view at gesturestart, …, pointer, event.scale)`; ignored while a finger is down on the stage |
| `+` or `=`, `-`, `0`, no modifier, focus in the level screen and not in a text field | `zoom('in')`, `zoom('out')`, `zoom('whole')` |
| an arrow key with nothing picked, the same focus (audit M3) | `panBy` one tile the other way, so a keyboard can reach every part of a zoomed level, empty ground too (where Add then adds); with Shift, half the clear cell. At zoom 1 nothing moves. With a thing picked the arrows nudge it, as the plan has it |

`deltaY` in lines is 16 px a line; in pages, the clear cell's height. The wheel and gesture listeners are added with
`addEventListener(..., { passive: false })` and always call `preventDefault()`, so the browser never zooms or swipes
the page from the level. The stage has `touch-action: none`, and ruling 29 covers the rest of the frame.

**Buttons and keys** zoom about the picked thing's middle when it is in the clear cell, else the clear cell's middle,
moving there over 150 ms, ease-out (`whole`: 200 ms); under reduced motion the view changes at once. Fingers and the
wheel are never eased: the level is under the fingers on the same frame. All drawing is once a frame: pointer moves
are kept and one `requestAnimationFrame` calls `setView` and sets the stage's `Fit`, a `$state`. The hit buttons are
placed by CSS custom properties `--scale`, `--left`, `--top` (Svelte `style:` directives); the layer's snippet gets
the new `Fit` and only what reads it updates (Task 9's chips need their places worked out, so the layer is not
CSS-only; audit M9).

**The edge slide (ruling 27):** while a thing is dragged and the finger is within `EDGE_PX` of the clear cell's edge,
each frame applies `edgeSlide(finger, clear, frame's seconds)` as `panBy(view, …, −dx, −dy)` (near the right edge
the level slides left and the view's `x` grows; audit M1) and moves the thing to stay under the finger. It stops at the level's edge, when the finger leaves the band, and when the drag ends.

**Reveal (ruling 27):** `Stage.reveal(id)` sets `reveal(view, …, the thing's box)` over 150 ms. `Stage` calls it when
a `[data-thing]` takes focus and `matches(':focus-visible')` (the keyboard's focus; a press's focus is not, audit
I2); `Levels` calls it after `nudge`, after `pick(id)` from outside the stage, and after `undo` or `redo` for the
first id of `compareLevels(the level before, the level after)`'s `moved`, then `added`, then `retyped` (an undone
erase is an add; audit M2).

**When the room or the window changes** (a turn of the device, another language, a panel measured again), `home` and
`clear` are worked out again and the view is clamped: the same point of the level is still in the middle. Closing
or opening a panel changes neither (ruling 17).

### Where the zoom buttons sit

One more row in the plan's "Where each part sits":

| Part | `wide` | `mid` | `narrow` |
|---|---|---|---|
| zoom | bottom row, right of the switch | right edge, a column, centered on the clear cell's height | a row just above the tools' left end, level with undo and redo at the right end |
| switch, block (O1) | as the plan | as the plan | one row above zoom and undo: the switch at the left, the block (`compact`) at the right; they close and open as on the other shapes. When the two do not fit side by side in a language at 390 px, the block shows its saved cell only (the pill already names the level), as ruling 18 does on `mid`; the row never wraps and no word shrinks (audit I4) |

Least room (the plan's ruling 2), changed numbers only: `mid` right 16 becomes 92 (the 60 px column, its 16 px
margin, 16 more); `narrow` bottom 144 becomes 232 (O1: the row of switch and block, 72 px, and its 16 px gap). `wide`
is unchanged. On `narrow` the measured bottom (the plan's `roomWith`) is the frame's height less the top of the
highest part in the bottom stack (the switch and block row while either is open, else the zoom and undo row), so a
taller row in a language never lies over the level (audit I4).

### Steps

- [ ] **Step 1: The view, pure.** Failing tests in `view.test.ts`, all with `world = { w: 16, h: 9 }`,
      `clear = { x: 8, y: 64, w: 374, h: 548 }` and `home = { scale: 23.375, left: 8, top: 232.8125 }` unless said:
  - `fitOf(whole(world), home, clear)` equals `home`.
  - `mostZoom(home)` is 5.476 (to three places); of `{ scale: 47.75 }` is 2.681; of `{ scale: 100 }` is 2; of
    `{ scale: 0 }` is 1.
  - `clampView({ zoom: 0.5, x: 3, y: 1 })` is `{ zoom: 1, x: 8, y: 4.5 }`; `{ zoom: 2, x: 0, y: 0 }` is
    `{ 2, 4, 4.5 }`; `{ zoom: 2, x: 99, y: 9 }` is `{ 2, 12, 4.5 }`; `{ zoom: 4, x: 0, y: 0 }` is `{ 4, 2, 2.9305 }`
    (to four places); `{ zoom: 99, … }` has `mostZoom`; `NaN` in any field gives `whole(world)`.
  - `zoomAbout(whole, …, { x: 8, y: 338 }, 2)` is `{ 2, 4, 4.5 }`; about `{ x: 195, y: 338 }` is `{ 2, 8, 4.5 }`.
  - `panBy({ 2, 8, 4.5 }, …, -46.75, 0)` is `{ 2, 9, 4.5 }`; `panBy(whole, …, 100, 100)` is `whole`.
  - `pinch(whole, …, [{ x: 101.5, y: 338 }, { x: 288.5, y: 338 }], [{ x: 8, y: 338 }, { x: 382, y: 338 }])` is
    `{ 2, 8, 4.5 }`; with both end points 46.75 further right it is `{ 2, 7, 4.5 }`; two fingers at one point (a
    distance of 0) return the start view.
  - `stepZoom(1, 'in', 2.68)` is 1.5; `(2.25, 'in', 2.68)` is 2.68; `(1.2, 'out', 2.68)` is 1; `(1, 'out', …)` is 1.
  - `reveal({ 2, 4, 4.5 }, …, { x: 14, y: 4, w: 1, h: 1 })` is `{ 2, 11.5, 4.5 }`; of a box already inside, the same
    object (`toBe`).
  - `edgeSlide({ x: 372, y: 338 }, clear, 0.5)` is `{ dx: 180, dy: 0 }`; at the clear cell's middle `{ 0, 0 }`.
  - Review Focus 2: `home.scale` 0 gives `whole(world)` from every function and no `NaN`. Focus 3: a 200 × 100
    world at `home.scale` 4 has `mostZoom` 32; `stepZoom` from 1 reaches exactly 32 in nine presses and stays;
    `reveal` of `{ x: 199, y: 99, w: 1, h: 1 }` at zoom 32 puts it in the clear cell. Focus 4: `clampView` of
    `{ 4, 14, 6 }` with `world = { w: 8, h: 5 }` lies inside the new level's limits.
  - Push, red; implement; push, green. Commit `feat(levels): the view of a level, and every way it changes`.

- [ ] **Step 2: Fingers and the wheel on `Stage`.** Failing cases added to `stage.browser.test.ts` (three engines).
      Fingers are `PointerEvent`s with `pointerType: 'touch'` dispatched on the element under the point, by a test
      helper `fingers(stage)` with `down(id, at)`, `move(id, at)`, `up(id)`, `cancel(id)`; each assertion waits one
      animation frame.
  - two fingers spread to twice their distance about the clear cell's middle: `data-zoom` is `2`; the picture's
    `fit()` equals `fitOf(view, …)` within 1 px; `crate-1`'s button middle is where that `Fit` puts 6.5, 7.5; the
    canvas's `width` and `height` did not change; `[data-clear]`'s box did not change.
  - a finger dragging `crate-1`, then a second finger: `ondragcancel` once, `ondragend` never, and spreading then
    zooms.
  - a pinch whose first finger lands on `crate-1` with nothing picked: the last `onpick` call's argument is
    `undefined`.
  - after one of two fingers lifts, moving the other calls no `ondrag` and changes no view; once both are up, a
    one-finger drag of `crate-1` by 2 tiles at zoom 2 calls `ondrag` with x 8.5.
  - a clean tap on empty space calls `onpick(undefined)` on the up, not the down; a pinch on empty space calls it
    never.
  - `mode="read"`: a one-finger drag does nothing and a pinch zooms.
  - Focus 1: `cancel` of one finger in the middle of a pinch leaves `data-zoom` where it was, removes
    `data-moving`, and the next one-finger drag works. Focus 5: a `gesturechange` with `scale: 3` while two fingers
    are down changes nothing. Focus 6: a finger down on an element outside the stage and one on the stage, spread
    apart: `data-zoom` stays `1`.
  - `wheel` with `ctrlKey` and `deltaY: -100` at a point: `data-zoom` is `1.49` (Focus 7), the level's point under
    the pointer moved less than 1 px, and the event is `defaultPrevented`; the same with `metaKey`; `deltaY: -5`
    gives `1.05`; a Ctrl wheel between `gesturestart` and `gestureend` changes nothing.
  - Focus 8: at zoom 2 with `crate-1` half outside `[data-clear]`, a finger down on it and moved 3 px: `data-view` is
    unchanged; Tab to it (`:focus-visible`) then reveals it.
  - Arrow keys with nothing picked at zoom 2: ArrowRight moves `data-view`'s x by one tile; at zoom 1 nothing. `wheel` with `deltaX: 50` at
    zoom 2: the view's x grew by 50 / scale. `wheel` with `shiftKey` and `deltaY: 50`: the same. A plain wheel at
    zoom 1 changes nothing and is still `defaultPrevented`.
  - `gesturestart` then `gesturechange` (plain `Event`s given `scale: 2`, `clientX`, `clientY`) with no finger down:
    `data-zoom` is `2`.
  - at zoom 2 with the view at the level's left end, `focus()` on a thing at x 14.5, as the keyboard does: its box
    is inside `[data-clear]` within 200 ms.
  - the edge slide: at zoom 2, a finger holding `crate-1` 10 px inside the clear cell's right edge for 600 ms:
    `data-view`'s x grew and `ondrag` was called with an x past 8.
  - (ruling 29) the frame's computed `touch-action` is `none` and a menu list's is `pan-y`; a `gesturestart` on
    `document` and a Ctrl `wheel` on the pill are `defaultPrevented`; `html` has the class while the level screen is
    mounted and not after.
  - the canvas's `toDataURL()` is the same whole, and again after zooming in and pressing whole (the art is
    untouched and comes back exactly); the stage's computed `touch-action` is `none`.
  - `zoom('in')` under reduced motion (`matchMedia` stubbed) sets `data-zoom` to `1.5` by the next frame; without,
    within 200 ms.
  - Push, red; implement; push, green in three engines. Commit `feat(levels): pinch to zoom and two fingers to move`.

- [ ] **Step 3: The buttons, the keys and the room.** Failing tests:
  - `layout.test.ts`: `roomFor('mid').right` is 92 and `roomFor('narrow').bottom` is 232 (O1); the plan's clear-cell
    case still holds at the five sizes.
  - `levels.browser.test.ts`, at each of the five sizes: `[data-part="zoom"]` is where the table says and overlaps
    no part; its three buttons are 44 px or more each way; out and whole are `disabled` at first and in is not;
    pressing in twice ends with `data-zoom` `2` and in `disabled` on `desktop` (its most is 2: 1.5, then 2; audit M8),
    and `data-zoom` is never over `mostZoom` at any size; whole puts `data-zoom` back to `1` and `crate-1`'s box back within 1 px of its first box; the keys
    `+`, `-` and `0` do what the buttons do, and do nothing while a text field has focus; with `crate-1` picked and in
    view, zooming in keeps its middle within 1 px; arrow keys that take a picked thing past the clear cell's edge
    keep it inside (`reveal`); after a move, zooming elsewhere and Undo, the thing is inside `[data-clear]`;
    `LevelState.zoom` and `whole` follow. (O1) On `phone`, `[data-part="switch"]` and `[data-part="block"]` are in
    the frame above the tools, the frame's box is the window's, and `document.scrollingElement.scrollHeight` equals
    the window's height; with the plan's 40%-longer test words the row is one row, the block shows its saved cell
    only, no part overlaps another and `[data-clear]`'s bottom is above the row's top (audit I4).
  - `panels.test.ts`: `PANEL_NAMES` has `zoom`; closing it leaves `[data-handle="zoom"]` and `data-zoom` unchanged,
    and a pinch still zooms (audit I7).
  - ruling 30: `ui.css` gives the frame's margins with `env(safe-area-inset-…)` on all four sides (a check that reads
    the sheet, as `tests/features/ui/` does).
  - Changed lines in the plan's Task 7 tests, written so in Task 7's own Step 1 (audit I6): `frame.journey.test.ts`
    reads "`[data-scale]`'s box is the window's" at all five sizes (O1); `panels.journey.test.ts`'s "hide all" leaves
    the pill, the cluster, the handles and undo and redo (the zoom buttons close too, audit I7), and on `phone` the
    block and the switch close and open like the rest (O1). The
    plan's "every `[data-thing]` lies inside `[data-clear]`" cases, here and in Task 18's `measure.ts`, hold when
    `data-zoom` is `1`.
  - Push, red; implement; push, green. Commit `feat(levels): zoom buttons at every size`.

- [ ] **Step 4: The journeys.** `tests/fixtures/journey.ts` gains `pinch(page, { at, by })` (two fingers about a page
      point, their distance multiplied by `by`), `twoFingerMove(page, { from, dx, dy })`, `wheel(page, { at, dx?, dy?,
      ctrl? })` and `touchPress(page, locator)`, each dispatching real `PointerEvent`s or `WheelEvent`s inside the
      page (Playwright has no two-finger touch in WebKit or Firefox), and `realPinch(page, …)` for Chromium only,
      through `Input.dispatchTouchEvent`. `zoom.journey.test.ts`, five sizes, three engines, a visitor on the demo
      level unless said:
  1. **It opens whole:** `data-zoom` is `1`; out and whole are disabled; `broken(page, true)` is empty.
  2. **Pinch:** `pinch` by 2 over the crate: `data-zoom` is `2`; `pictureColourUnder(page, 'crate-1')` is the
     crate's (the art and its button agree when zoomed); the pill's, the tools' and the zoom panel's boxes are what
     they were; `broken(page, true)` is empty; `window.scrollY` is 0.
  3. **Drag while zoomed:** `dragByTouch` of the crate 2 tiles right gives `data-x` 8.5; as an owner, Save writes x
     8.5 to the pretend GitHub's file.
  4. **Two fingers move, and change nothing:** `twoFingerMove` changes `data-view`; the crate's `data-x` is 6.5 and
     Undo is disabled.
  5. **A second finger calls a drag off:** the crate is back at 6.5 and Undo is disabled.
  6. **Whole:** pressing `[data-zoom-whole]` gives `data-zoom` `1` and the crate's first box, within 1 px.
  7. **Keyboard only:** `+`, then Tab to a thing that is out of sight brings it into `[data-clear]`; `0` shows the
     whole level.
  8. **Wheel:** `wheel` with `ctrl` zooms, `wheel` without moves the level, and the page never scrolls or zooms
     (`visualViewport.scale` is 1).
  9. **Panels and turning:** at zoom 2, closing and opening the tools leaves `data-zoom` and `data-view` as they
     were; "Hide everything" closes the zoom buttons too, a pinch still zooms and their handle opens them (audit I7); setting the window from `phone` to `phoneSideways`
     keeps the crate inside `[data-clear]` when it was in the middle before.
  10. **A reload shows the whole level** (ruling 24), and `localStorage` holds no key this page does not name.
  11. **Real fingers (Chromium only, five sizes):** `realPinch` by 2 gives `data-zoom` over 1.5 and
      `visualViewport.scale` 1: the browser did not take the gesture for itself. A `realPinch` with one finger on the
      tools and one on the level, and one wholly over the pill, leave `visualViewport.scale` 1 and `data-zoom` `1`
      (ruling 29, Focus 6).
  - Push, red; implement what is missing; push, green in three engines.
- [ ] **Step 5:** Commit `feat: zoom journeys at five sizes`. Then report `Task 7`; the line names both test counts
      (the frame's and the zoom's).

---

## What the later tasks take from this

Each line is added to the task named; its test goes in that task's own test file and step.

- **Task 9 (notes).** The notes are laid by the view's `Fit` on every frame, so they zoom with the level; their
  strokes and words do not grow (the grid is drawn again at the new scale, never scaled by CSS). A measure line is
  clipped where the level leaves the stage, and its chip sits in the middle of the part of the line inside the clear
  cell; a chip whose line is wholly outside is not shown. The number is always the file's. Tests added to
  `notes.browser.test.ts`: at zoom 2 with the level's left edge out of sight, the left chip is inside `[data-clear]`
  and still reads "FROM THE LEFT 6.5 TILES"; the grid's stroke width is the same at zoom 1 and 2; the canvas's
  `toDataURL()` at zoom 2 is the same with the notes on and hidden. `notes.journey.test.ts`: after `pinch` by 2 no
  words lie on the art (`broken`).
- **Task 8 (the card).** On `mid` and `narrow` the sheet rises only once a pick lasts (the finger lifts, or the drag
  starts), so a pinch that begins on a thing never flashes the sheet up and down (audit M5). Test added to its
  journey: a `pinch` that starts on the crate at `phone` never shows `[data-part="sheet"]` above its title.
- **Task 10 (Add, Erase).** `ontouch` and the Erase tool's erase fire on a clean tap's finger up (the table above).
  A thing is added at the level's point under the tap by the view's `Fit`; Enter on a tray button adds at the level's
  point in the middle of the clear cell, which is the middle of what the person is looking at. Tests added to
  `add-erase.browser.test.ts`: with Add and a character chosen, a pinch adds nothing; with Erase, a pinch that
  starts on `crate-1` erases nothing; at zoom 2 a tap adds at the point under it.
- **Task 12 (the first visit).** `tipFor('drag', …)` takes one more fact, `inView: boolean` (the first thing's box is
  in the clear cell): when false the tip is `WORDS.tipWhole` at `[data-zoom-whole]`, and the thing keeps its
  `data-hinted` ring. `Tip` reads its target's box again on every `onview`. A new function beside `tipStep`:

  ```ts
  /** The one tip about fingers (ruling 26): after the first run, the first zoom in on a screen a finger has touched. */
  export function zoomTip(facts: { zoomed: boolean; touched: boolean; seen: boolean; step: TipStep }): boolean
  // true when zoomed and touched and not seen and step is 'done' or 'none'
  ```

  `zoomed` is a zoom in by the buttons, a key or the find bar; a zoom by fingers sets `af.tip.zoom` instead (ruling
  26, audit M4). `touched` is true once the frame has had a `pointerdown` with `pointerType: 'touch'`. The tip is `Tip` with
  `WORDS.tipTwoFingers` at `[data-part="zoom"]` and a `WORDS.tipGotIt` button; "Got it", the first two-finger move
  and "Hide tips" each set `af.tip.zoom`, and it never shows again. Tests added: `guide.test.ts`, every row of
  `zoomTip` and "`drag` out of view points at the whole-level button"; `first-run.journey.test.ts`: a first-time
  visitor who pinches and moves the crate out of sight sees "Press here to see the whole level." by that button,
  presses it, sees "Drag the crate anywhere" again, and finishes with one drag and one press; a first visit with no
  zooming never shows the two-finger tip; after the first run, a `pinch` does not show it either and sets
  `af.tip.zoom`; after the first run, `touchPress` on `[data-zoom-in]` shows it, overlapping
  no part, a `twoFingerMove` ends it, and a reload and another zoom do not bring it back; with the mouse it never
  shows.
- **Task 13 (the find bar).** Three commands, in `COMMAND_KINDS` and `docs/commands.md`: `zoom-in` (`WORDS.zoomIn`),
  `zoom-out` (`WORDS.zoomOut`), `whole-level` (`WORDS.zoomWhole`), each "changes no file"; `zoom-out` and
  `whole-level` are absent when the level is whole, `zoom-in` at the most. A `move-*` or `erase` command on a thing
  out of sight reveals it first. `find.journey.test.ts`: typing "whole" after a pinch and pressing Enter shows the
  whole level.
- **Task 16 (one waiting change).** The waiting change is one stage with a Before / After switch (the plan's Task
  16), so the stage keeps its view when the switch redraws the other version, and the marks, ghosts and chips are
  laid by the same `Fit`. Its journey: pinch by 2 on the crate, press Before, and `data-zoom` and `data-view` are
  unchanged and the ghost is still by the crate (audit I5).
- **Task 18 (every screen).** Appendix B gains `level-zoomed` (stage; zoom 2, the crate picked, notes on),
  `level-zoomed-out-of-view` (the first visit's whole-level tip) and `level-two-finger-tip`. `measure.ts`: "every
  thing inside the clear cell" is checked when `data-zoom` is `1`; when it is not, every `[data-thing]` whose middle
  is in the stage has the art's color under it, and no part overlaps another. The docs: `README.md` and
  `docs/commands.md` name the gestures, the keys and the three commands in one short table.
- **Task 19 (Play).** Play shows the level as the framework frames it; the view is set aside while playing and comes
  back on Stop, and the stage takes no zoom gesture while the game has the touches. Task 19's amendment writes its
  test.

## New words (English, added to the plan's Appendix A)

| Key | Text |
|---|---|
| `zoomIn`, `zoomOut`, `zoomWhole` | Zoom in, Zoom out, Show the whole level |
| `tipWhole` | Press here to see the whole level. |
| `tipTwoFingers` | Use two fingers to move the level. Pinch to zoom. |

## Self-review

- **The coordinator's list:** one-finger tool drags beside two-finger gestures ("What each touch does", ruling 21);
  panels that close and open (ruling 23, "When the room or the window changes", journey 9, O1); the first-visit
  "Drag the crate" tip (ruling 26, Task 12's lines); reset and fit (the whole-level button, the `0` key, the
  `whole-level` command); trackpad and mouse wheel (ruling 22, the desktop table); end-to-end tests at all five sizes
  (Step 4, and each later task's journey lines); the spec's paragraphs (this pull request).
- **Names:** `LevelView`, `whole`, `fitOf`, `clampView`, `zoomAbout`, `panBy`, `pinch`, `stepZoom`, `reveal`,
  `edgeSlide`, `setView`, `zoom(way)`, `ondragcancel`, `onview`, `zoomTip` are spelled the same wherever they
  appear.
- **Numbers checked by hand:** the phone's `home` is `fitInRoom({ w: 390, h: 844 }, { top: 64, right: 8, bottom: 232,
  left: 8 }, { w: 16, h: 9 })`: scale 374 / 16 = 23.375, top 64 + (548 − 210.375) / 2 = 232.8125.
- **Not in this amendment, on purpose:** a glide after the fingers lift, a double tap, turning the level, a zoom
  kept between visits, a hand tool. Each is a ruling above that the audits after the build may reopen; the plan
  audit asks the Fable visual audit to judge the glide in particular, since a phone's own lists glide.
