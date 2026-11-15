# Editor mockups, round three: the grill, part 1b (Apple Pencil in the shell and World)

The Owner, 2026-11-15: "this is iPad first, so Apple Pencil first class support."

An addition to round 1 of the grill
([`2026-11-15-editor-mockups-round3-grill-1-shell-and-world.md`](2026-11-15-editor-mockups-grill-1-shell-and-world.md)),
on the same pages at the same commit (Editors PR 34 at 84986a8). It replaces that report's finding 14, which was
too small for this rule. Findings here are numbered P1 to P13.

Severity: **High** = the product cannot do its job this way. **Medium** = works, but below the bar. **Low** = polish.

## Verdict

**The Pencil is a guest in these mockups, not a first-class way in.** It appears once, on one page, as a label that
reads "Pencil hovering · Middle brush". No screen says what the Pencil does and what a finger does. Nothing answers
a double tap or a squeeze. No number or name can be written by hand. The compact rows the Owner already decided on
for Pencil use are drawn on no iPad page.

Counts: 3 High, 9 Medium, 1 Low.

---

## What a Pencil can do, and what our editor can hear

Three Pencils are sold, and they differ. A first-class design has to work with the least of them and get better
with the best.

| | Hover | Tilt | Pressure | Double tap | Squeeze, barrel roll, a felt tick |
| --- | --- | --- | --- | --- | --- |
| Apple Pencil (USB-C) | yes | yes | no | no | no |
| Apple Pencil (2nd generation) | yes, on newer iPads | yes | yes | yes | no |
| Apple Pencil Pro | yes | yes | yes | yes | yes |

(From Apple's own Pencil page. The iPad Pro 11-inch of today takes the Pro and the USB-C one.)

**One fact decides a lot: the editors run in the browser first, and as an app second.** A web page can read where
the Pencil is, that it is a Pencil and not a finger, how hard it presses, how it tilts and when it hovers (WebKit:
"hover on iPadOS with Apple Pencil" works in web pages). Scribble works in "editable fields in web content" with no
work from us (Apple's guidelines). From my own knowledge, and not from a page read today: a web page is **not** told
about double tap or squeeze, and cannot make the Pencil Pro's tick. Those reach only an app, so they need the Tauri
iPad app to pass them to the page. I could not confirm whether Safari reports barrel roll.

So the rule for every finding below: **nothing may depend on double tap, squeeze, barrel roll or pressure alone.**
Each is a shortcut to something that is also on screen.

---

## What Apple asks of a Pencil app

From the Human Interface Guidelines, "Apple Pencil and Scribble":

- "Let people make a mark the moment Apple Pencil touches the screen", with no mode to enter first.
- Controls must answer the Pencil too, or "a control that doesn't support Apple Pencil input might seem to be
  unresponsive".
- "Use hover to help people predict what will happen when Apple Pencil touches the screen", for example "the
  dimensions and color of the mark". "Avoid using hover to initiate an action."
- Double tap: "respect people's settings". By default it swaps "the current tool and the eraser". Never use it "to
  perform an action that modifies content".
- Squeeze: one quick action, and "if you use squeeze to reveal app UI, like a contextual menu, display it close to
  Apple Pencil Pro".
- Barrel roll: "only to modify marking behavior".
- Pressure: "affect continuous properties, such as ink opacity or brush size".
- "Design a great left- and right-handed experience."
- Scribble: "people can simply write wherever text is accepted". Give "enough space to write", keep the field
  "stationary", and hide the placeholder "the moment people begin to write".

Procreate and ZBrush for iPad add the working habit (from the pages read for part 1): the Pencil in the drawing
hand, and a finger of the other hand on the screen for everything else.

---

## Findings

### The rule

**P1. High. No screen says what the Pencil does and what a finger does.** The only statement is a code comment on
the Scenes page. Decide it once for all five editors and show it on the Keys page:

- **Once a Pencil has touched the screen, the Pencil does the tool's job.** One finger dragging on the level moves
  the view. Two fingers pinch to zoom. A finger tap still picks a thing and still presses any button.
- **With no Pencil, one finger does the tool's job** and two fingers move the view, as today.
- One switch in the view settings: "Draw with a finger too", off by default once a Pencil is seen.

This holds in 3D unchanged: the Pencil works on the thing, the other hand turns the view. It is how the 3D
sculpting apps on iPad work.

**P2. High. Hover is drawn as a label and not as a preview.** "Pencil hovering · Middle brush" is a note about the
mockup, shown as if it were part of the product. Hover's job is to show what will happen. For each shared tool:

- **Paint:** the brush's outline at its real size, in the colour of what will be painted. (The dashed circle on the
  Scenes page is right. Drop the label.)
- **Place:** a faint copy of the thing, already snapped to where it would land.
- **Move:** the thing under the tip lights up, so a small thing among many can be picked surely.
- **Draw path:** the next piece of the path from the last point to the tip.
- **Tiles:** the one square under the tip, in the picked colour.

Hover never does anything by itself, and the preview does not change with the Pencil's height.

**P3. High. The compact rows for Pencil are drawn nowhere.** The Owner decided on 2026-11-15 that touch keeps 44
points and rows go small when a trackpad, mouse or hovering Pencil is in use. Every iPad picture shows the large
rows only. Draw one iPad page in the Pencil state. And decide the moment of change, because a list that reshapes
itself under a moving hand is worse than either size: rows change size only when the panel is next opened, or when
the person asks, never while they are looking at it.

### The Pencil's own gestures

**P4. Medium. Double tap does nothing.** Follow the person's own iPad setting. By default: swap Paint and Erase;
with any other tool, swap to the tool used before. It changes the tool only, never the game. On screen, the same
swap is a small button by the toolbar, for the browser and for a Pencil with no double tap.

**P5. Medium. Squeeze does nothing.** On a Pencil Pro, a squeeze opens the picked tool's tray at the Pencil's tip:
the kinds to paint, the brush's three sizes, the things to place. This saves the trip to the bottom of the screen,
which is the longest move on an iPad. The same tray is always above the toolbar (grill finding 9).

**P6. Medium. Pressure and tilt are used nowhere, and should be used in few places.** Be honest about where they
fit:

- **Scenes, painting scenery:** yes. Press harder for more flowers, closer together. This is the "continuous
  property" Apple describes.
- **Levels, painting ground, and Tiles, drawing a tile:** no. A square is ground or it is not. Pressure there would
  be a gimmick.
- **Barrel roll (Pencil Pro):** turn the thing being placed, or a stamp, before it lands.

Since the USB-C Pencil has no pressure, every one of these is also a control in the tray.

**P7. Low. No felt tick.** On a Pencil Pro in the iPad app: a light tick when a thing snaps to the grid, and when a
link reaches its target. Nothing depends on it.

### Writing by hand

**P8. Medium. Nothing can be written by hand, and the fields are too small for it.** Scribble should work in every
place words or numbers go: a thing's name in the list, "6 tiles", the Find box, the note to Mia. Three changes to
the mockups: a number or name field grows to about 44 points high and 120 wide when the Pencil comes near it; it
does not move while being written in; its placeholder ("Find") goes the moment writing starts. Writing "6" into
"From the left" then sits beside the number pad of grill finding 12 as two ways to the same end.

### Picking and linking

**P9. Medium. A loop drawn with the Pencil should pick several things.** With Move picked, a Pencil stroke that
starts on empty ground draws a free loop, and everything inside is picked. This is the natural Pencil answer to
grill finding 8 (no way to pick several) and is faster than any box.

**P10. Medium. Links are made for the Pencil.** The Owner approved links between things (a button's arrow to its
door). Drawing a line from one thing to another is the most Pencil-like act in the editor. Draw it: start on the
button, the line follows the tip, the door lights up on hover, lift to join.

### Hands and help

**P11. Medium. The layout assumes a right hand.** The hold-buttons of grill finding 11 sit at the left edge for the
free thumb, and the inspector sits on the right, under a right-hander's drawing arm. A left-hander gets both wrong.
One switch, "I draw with my left hand", mirrors the two.

**P12. Medium. The Keys page has no Pencil column.** It has Touch and keys. Add Pencil: draws, hover shows, double
tap swaps, squeeze opens the tray, write in any box.

**P13. Medium. Say plainly which Pencil shortcuts need the app.** In the browser, double tap, squeeze and the tick
are not available (see above). The Keys page marks them "in the iPad app". A person must never be told a shortcut
exists and then find it dead.

---

## For the mockups, in order

1. P1 and P2: the rule, and hover previews for all five tools.
2. P3: one iPad page in the Pencil state, with the compact rows.
3. P9 and P10: the loop to pick several, and drawing a link.
4. P8: fields that can be written in.
5. P4, P5, P12, P13: double tap, squeeze, and the Keys page.
6. P6, P7, P11.

No question here needs the Owner. If the Owner disagrees with the rule in P1, that is the one to say.

## Pages read

- Apple, Human Interface Guidelines, "Apple Pencil and Scribble":
  developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble
- Apple, the Apple Pencil page (what each Pencil can do): apple.com/apple-pencil
- WebKit, "WebKit features in Safari 16.1" (hover with Apple Pencil in web pages): webkit.org/blog/13399
- MDN, PointerEvent (pressure, tilt, twist, pointer type): developer.mozilla.org/en-US/docs/Web/API/PointerEvent

Not reached: Procreate's handbook pages on the Pencil and on hover (they returned only a menu), and Apple's
developer page for the Pencil's double tap and squeeze. What this report says about a web page not hearing double
tap and squeeze is from my own knowledge and should be checked before the build plan relies on it.
