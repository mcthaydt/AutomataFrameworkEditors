# Plan audit: pinch to zoom, the amendment to Task 7

Written 2026-11-14. Stage 3 (Plan audit) for
[`plans/2026-11-14-blueprint-redesign-task-7-zoom.md`](../plans/2026-11-14-blueprint-redesign-task-7-zoom.md) as merged
in pull request 20. It was read against the spec
([`specs/2026-11-14-editors-blueprint-redesign-design.md`](../specs/2026-11-14-editors-blueprint-redesign-design.md),
with pull request 20's changes), the plan it amends (its Global Constraints, rulings 2, 3, 17 and 18, and Tasks 6 to
16), the Owner's answers (Q1 C, O1 A, and the desktop and `setView` rulings the Owner was shown), the code on `main`
(`levels/Levels.svelte`, `levels/compare.ts`, `tests/fixtures/journey.ts`, `index.html`) and AutomataFramework's
`main` at `5a63689` (`render/stage.ts`, `still.ts`, `fit.ts`, `tests/features/render/still.browser.test.ts`).
Nothing was run.

## The answer first

The amendment is sound and does what the Owner asked: a pinch and two fingers at every size, one finger still drags,
the first visit is still one drag and one press, every gesture has a button, a key and a find-bar command, and it is
tested at the five sizes in three browsers. Every number in its tests was worked again by hand and holds (below).
The framework addition is the right one: `setRoom` cannot show part of a level, and `setView` slots into
`fitFor` exactly as Task 7a says.

It had **no blocking findings**, **seven important ones** and **twelve minor ones**, all written into the amendment in
this pull request and marked `(audit I<n>)` and `(audit M<n>)`. There is **no question for the Owner**.

## Important

- **I1. The page itself could still zoom or move.** The stage is `touch-action: none`, but the amendment gave panels
  `touch-action: manipulation`, which allows a pinch to zoom the page; a pinch with one finger on the tools and one on
  the level, or a trackpad pinch over the pill (a Ctrl wheel outside the stage), would zoom the whole page and break
  the frame's measuring. `overscroll-behavior: none` on every page also took pull to refresh from the other screens.
  Fixed as ruling 29: the frame `none`, scroll regions `pan-y`, `document` gesture events and a `window` Ctrl wheel
  prevented while the level screen is open, the overscroll rule behind a class the level screen sets; tests in Step 2
  and real-finger cases in journey 11.
- **I2. A press's focus would slide the level under the finger.** Reveal ran when a `[data-thing]` "takes focus from
  the keyboard" with no way to tell; Chromium and Firefox focus a button on press, so touching a thing near the edge
  at zoom would move the level as the drag starts (the spec: nothing refits under a finger). Fixed: reveal only when
  `:focus-visible` matches; a test (Review Focus 8).
- **I3. A mouse wheel with Ctrl zoomed 2.7 times a notch.** `exp(−deltaY × 0.01)` with Chromium's 100 a notch on
  Windows and Linux. Fixed: `deltaY` clamped to ±40, so a notch is × 1.49, one button press; a trackpad's small steps
  are unchanged; exact numbers in the test.
- **I4. The phone's new row was not measured and may not fit.** The plan's `roomWith` measures the tools and the
  bottom row; on `narrow` the highest part is now the switch and block row, and with German words the switch beside
  the 2-cell block can pass 358 px. Fixed: the measured bottom is the top of the highest bottom part; when the row does
  not fit, the block shows its saved cell only (the pill names the level), as ruling 18 does on `mid`; a long-words
  test at `phone`.
- **I5. Task 16 has one stage, not two.** The amendment shared a view between "the before and after stages"; Task 16
  draws one stage with a Before / After switch. Fixed: the stage keeps its view across the switch; a journey.
- **I6. The order built the phone's scroll only to remove it, and the commits could not be made.** Task 7's own tests
  and table still had ruling 3's scroll and `LEAST_LEVEL_HEIGHT`, which zoom Step 3 then took out; and steps that each
  commit cannot run "before Task 7's commit". Fixed: Task 7 takes the O1 lines in its own Step 1; the zoom steps follow
  its commit; the report waits for the last.
- **I7. The zoom buttons could not be closed.** The Owner's rule is that every editor panel can be closed and opened.
  Ruling 17 keeps the pill and the cluster open because they hold the only Save, Export and Find; the zoom buttons have
  a pinch, the wheel, the keys and the find bar beside them. Fixed: `PanelName` gains `zoom`, it closes like the rest,
  and "Hide everything" closes it.

## Minor

- **M1.** The edge slide's sign was open; it is `panBy(view, …, −dx, −dy)`.
- **M2.** Undo's reveal names `compareLevels(before, after)`'s order (moved, added, retyped; an undone erase is an
  add), which Task 6's extended `compareLevels` gives.
- **M3.** Principle 1: with nothing picked, the arrow keys move a zoomed level a tile, so a keyboard reaches empty
  ground (where Add adds) and not only things.
- **M4.** The two-finger tip shows only after a zoom by buttons, keys or the find bar; someone who pinched already
  knows, and that pinch sets `af.tip.zoom`. Before, a pinch would show and end the tip at once.
- **M5.** Task 8: on `mid` and `narrow` the sheet waits until a pick lasts, so a pinch that starts on a thing does not
  flash it.
- **M6.** A Ctrl wheel between `gesturestart` and `gestureend` is ignored, so Safari never zooms twice.
- **M7.** Task 7a: `show()` keeps the view, and a shot always wins over a view (a running game never meets one).
- **M8.** On `desktop` the most zoom (2) is reached in two presses, not three.
- **M9.** "A pinch re-renders no component" could not hold with Task 9's chips, which are placed by code; the `Fit` is
  a `$state` set once a frame, and the hit buttons alone go by CSS properties.
- **M10.** Ruling 26 said a visitor "moves the crate out of sight"; it is the level that moves.
- **M11.** The whole-level icon is `frameCorners` ("fit to the frame"); `cornersIn` beside "zoom out" reads as
  "smaller". If 2.1.1 lacks it, Task 4's icon test says so and `cornersIn` stays. (Not checked: the package cannot be
  fetched from this session.)
- **M12.** `index.html` asks for `viewport-fit=cover` and nothing uses `env(safe-area-inset-*)`, so O1's bottom row
  would sit in an iPhone's home-bar band. Ruling 30 puts the insets into the frame's margins.

## Checked and holding

- **Numbers:** the phone's `home` (scale 23.375, top 232.8125); `mostZoom` 5.476, 2.681, 2, 1; every `clampView`,
  `zoomAbout`, `panBy`, `pinch`, `stepZoom`, `reveal` and `edgeSlide` case in Step 1; nine presses to 32 (1.5⁹ passes
  32, 1.5⁸ is 25.6); Task 7a's pixel (233, 200) for `crate-1` at 6.5, 7.5 and scale 66.67 in a 600 × 300 mount whose
  fit is 33.33 (the full game's level is 16 × 9).
- **The framework:** `fitFor` without a shot is the one place the view goes; the backdrop's strips start from
  `fit.left` and repeat across the canvas, so a negative `left` still fills it; the cover strip is drawn only without a
  room, so a still picture never meets it; the canvas does not grow.
- **Synthetic fingers work with the code as it is:** `Levels.svelte` already catches a refused `setPointerCapture`,
  which an in-page `PointerEvent` gets.
- **Ruling 17:** closing a panel changes neither `home` nor `clear`, so the view is kept (journey 9).
- **The first visit:** nothing about zoom is shown before the first change; the drag tip follows the crate as the view
  moves and points at the whole-level button when it is out of sight.
- **End-to-end:** every new behaviour has a journey at the five sizes in three engines, and Chromium alone plays real
  touches.

## Seen, not changed

- No glide after the fingers lift and no double tap (ruling 21). A phone's own lists glide, so the Owner's "AAA touch"
  bar may want it; the amendment now asks the Fable visual audit after the build to judge it.
- Each zoom frame redraws every box's edge in the framework (its look keys on the scale). Fine for today's levels;
  worth a look if a level grows to hundreds of boxes.
- Pictures are drawn with nearest sampling, so zoomed art shows its pixels crisp, as the game does. The spec's "sharp,
  never stretched" holds in that sense.
