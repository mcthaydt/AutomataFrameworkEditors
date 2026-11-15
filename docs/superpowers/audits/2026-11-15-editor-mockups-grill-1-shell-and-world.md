# Editor mockups, round three: the grill, part 1 (the shell and the World editor)

Checked: Editors draft PR 34 at 84986a8, `docs/mockups`. Every World page (Levels first run, mid, play, rows, keys,
find, share, suggest; Scenes and Tiles, first run and mid) in CI's pictures on `ci-screens`, `pr-34/mockups/`. The
iPad Pro 11-inch held sideways (1210 x 834) is the size this report judges first, because it is the product's first
size. Nothing in the mockups was changed.

Bar held against: Y Combinator-level looks, ready for a AAA developer, as simple as Figma.

This is a different check from the three earlier ones (the grandma audit and design loops one and two). Those asked
"is each screen tidy and readable?" and their fixes mostly landed. This one asks a harder question: **is this an iPad
app, or a desktop app with bigger buttons?** It does not repeat their findings.

One editor per round. This round is the shell (what all five editors share) and World. Characters, Feel, Sound and
Story follow, one at a time, after the owner has seen this.

Severity: **High** = the product cannot do its job this way. **Medium** = works, but below the bar. **Low** = polish.

---

## Verdict

**Not at the bar yet. It is a tidy desktop layout drawn at touch sizes. It is not yet an iPad app.**

The screens are calm and readable now. That was the last three rounds' work and it shows. But hold the first size
against the direction the owner set and five things fail:

1. **"The canvas is the app" is not true on the iPad.** The level covers 28% of the screen. Panels, bars and empty
   dark bands cover the other 72%. (Measured: the level is 658 x 430 points on a 1210 x 834 screen.)
2. **Everyday actions cannot be seen anywhere.** There is no Delete, no Duplicate and no Erase on any screen, and no
   picture of how you choose what to place. They exist only as keyboard keys, or behind "press and hold".
3. **Nothing replaces the keyboard and mouse.** Every serious iPad app invented something to stand in for Shift, Alt,
   right-click and fine mouse movement. The mockups have nothing, and one gesture (press and hold) is given two
   different jobs.
4. **You cannot play the game in "play in place" on an iPad.** The play screen shows no touch controls, so a finger
   has nothing to press to move the hero.
5. **Sliders have no numbers.** "Light as a leaf" to "Heavy as a rock" is good for a first-timer and useless for a
   professional who needs two crates to weigh the same. That is the "AAA ready" test, and it fails.

The looks are clean but anonymous. Nothing on screen is ugly. Nothing on screen would make someone stop scrolling
either. Details in part C.

Counts: 12 High, 17 Medium, 4 Low. 33 findings.

---

## A. What iPad apps changed from their desktop versions

Pages read for this are listed at the end. Eight patterns come up again and again.

**1. The work takes nearly the whole screen. Panels are visitors.**
Procreate describes its own interface as "three parts ... designed to keep the focus on your artwork": a top bar and
one thin sidebar. Photoshop on iPad was "redesigned and minimized to dedicate more of the screen to the workspace".
Affinity Designer hides its toolbars by itself when you start drawing over the part of the canvas they cover. Apple's
own guidance for iPad says to "elevate the content people care about" and put controls "where they're easy to reach,
but not in the way". Final Cut on iPad shows one scope at a time where the Mac shows several.

**2. A stand-in for the keyboard's modifier keys.**
Photoshop on iPad has the "touch shortcut", a circle you hold with your other hand: "if there's a task that you
usually use the shift key for, it's probably in the touch shortcuts". Affinity lets you "hold one or two fingers on
the screen as a modifier for controls such as Shift and Alt". Logic Pro on iPad has two modifier buttons, Multiple
Select and Copy, which also work held down for a moment, "very much akin to holding down a modifier key". Procreate
has a Modify button on the sidebar for the free hand. Every one of them solved this. None left it to "press and hold".

**3. A stand-in for mouse precision.**
Final Cut on iPad added a Jog Wheel "to precisely position the playhead", nudge clips and trim. Procreate's sliders go
finer when you drag sideways first. Logic opens a number pad when you tap a value, and zooms in while you hold the
scissors. A finger covers what it touches, so each app gives a second, slower way to be exact.

**4. Options appear beside the tool or the thing, not in a far panel.**
On Photoshop for iPad "a Tool Options bar will pop up next to the toolbar when a tool is selected". Affinity has a
context toolbar that changes with the tool. Logic's shortcut menu opens on the thing you tapped. Logic shows each
plug-in as a small tile with "a few key controls", and the full set opens on a tap. Shapr3D calls this an adaptive
interface: "surfacing the right tools at the right moment", built "around your implicit and explicit actions and not
around available screen estate".

**5. Pencil and finger get different jobs.**
In ZBrush on iPad "the workflow is now a pencil in your dominant hand and your finger on the screen". Procreate says
that with a Pencil "you don't need to paint with your finger anymore", so a finger tap can open a quick menu.

**6. Undo is a gesture, and everyone uses the same one.**
Two-finger tap to undo and three-finger tap to redo in Procreate, Photoshop and Affinity. (The mockups already have
this. Good.)

**7. One thing beside the work at a time, and views you switch between.**
Logic's bottom bar toggles Browser, Inspector, Plug-ins, Mixer and Editor, stacked only "if your iPad's display has
sufficient" room. Affinity folds whole workspaces into one Persona menu whose icon is all that shows when closed.

**8. Fewer features, chosen well, with lessons built in.**
Final Cut on iPad left out a long list (slip edits, compound clips, markers, custom LUTs) and reviewers still called
it "so well-designed". Photoshop on iPad launched "with only the most-used features". Final Cut, Logic and Affinity
all ship tutorials inside the app.

**And the awkward one: Figma itself has no full editor on iPad.** Figma's mobile app is for viewing, commenting and
testing prototypes. Its own forum has a long thread asking why "a leading design platform like Figma hasn't released
a fully functional iPad app", where users say Figma in the iPad's browser "doesn't even work correctly". So
"Figma-simple" is the right goal for how few things there are and how obvious they are. But Figma's layout (two
docked panels, hover, right-click, Shift and Alt) is a mouse layout. Copy its restraint. Do not copy its screen. For
the screen, copy Procreate, Logic and Affinity.

---

## B. The shell, held against those patterns

### B1. Space

1. **High. The level is 28% of the screen.** On iPad sideways the left list takes about 240 points, the inspector
   about 280, the top bar 56, and the level is letterboxed inside what is left with about 135 points of empty dark
   above it and 210 below. In the first-run picture the inspector is half empty and the list holds seven rows. Two
   docked panels are being paid for in canvas and are not using what they bought. This breaks pattern 1 and the
   owner's own "canvas is the app".
   The owner has already decided panels dock on iPad sideways, and this report does not reopen that. Inside that
   decision, three changes:
   - The left panel starts closed to its thin rail on iPad (the round-two mockups had a 56-point rail). One tap opens
     it. The level then grows from about 658 to about 830 points wide: 28% of the screen becomes about 45%.
   - The inspector shows only while something is picked. Nothing picked, no panel.
   - The level fits the space it has. No fixed dark bands.
2. **High. The top bar is a website's menu, not an app's.** It holds thirteen things: the game's square, World,
   Levels, Tiles, Scenes, Characters, Feel, Sound, Story, the level's name, Find, Saved, Share. Workspaces and their
   parts sit in one row as words, so "Levels, Tiles, Scenes" (parts of World) read as brothers of "Characters, Feel,
   Sound, Story" (other workspaces). The upright iPad's bar is already better: "World ▾" then "Levels · Level 1 ▾".
   Fix: that bar at every size. One switcher for the workspace, one for the part and file. Pattern 7: Affinity folds
   its workspaces into one menu.
3. **Medium. Three kinds of floating bar.** The toolbar (bottom), the play bar (top, while playing) and "Play the
   day" (top left, in Scenes), each with its own size, shape and place. One bar style, one place for anything that
   plays.
4. **Medium. Two Finds 150 points apart.** "Find" in the top bar and a "Find" box at the top of the list. Keep the
   top bar's. The list filters as you type into it.

### B2. Things you cannot see how to do

5. **High. Delete and Duplicate are on no screen.** The Keys page gives Delete as the ⌫ key and copy as ⌘C, and
   says "More for a thing: press and hold it". On an iPad with no keyboard, a person looking at a picked crate sees
   no way to remove it or make another. These are the second and third things anyone does in a level editor. Fix
   (pattern 4): when a thing is picked, a small bar sits just above it: Duplicate, Delete, and "…" for the rest.
   "Line up", "Space out" and "Stack" move there too when several are picked. They are 300 points from the crates
   today.
6. **High. Placing is not drawn.** Place is a tool, and no World page shows what happens after you press it: where
   the things to choose from appear, how one gets from there into the level, what the Assets tab looks like open.
   Putting a new thing in the level is the editor's main act. It needs its own picture before any code: Place opens
   a tray of things above the toolbar, and you tap one then tap the level, or drag it in.
7. **High. Erase is missing.** The pages' own data lists an Erase tool with a key (E), and the toolbar never shows
   it. Paint with no Erase is half a tool, in Levels, Scenes and Tiles.
8. **High. Press and hold has two jobs.** The Keys page says "Pick several: press and hold, then tap more" and also
   "More for a thing: press and hold it". The same press cannot do both. And there is no way drawn to pick many
   things at once by dragging a box around them. Fix (pattern 2): a "Pick several" button that can be tapped to stay
   on or held with the other hand, as Logic does. Press and hold on a thing means one thing only: its menu. A drag
   on empty ground draws a box.
9. **Medium. Options is a junk drawer.** Brush size in Scenes is inside Options, with snapping and whatever else.
   Brush size is the most-used control while painting, and it is two taps away under a word that says nothing.
   Procreate keeps size under the thumb at all times. Fix (pattern 4): the picked tool's own two or three settings
   sit beside the toolbar while that tool is picked (Small, Middle, Big for Paint). "Options" keeps only settings for
   the view, and is called "View".
10. **Medium. Lock and eye are never explained.** Hero, Ground tiles and Meadow carry a lock. Goal carries a
    crossed eye. Nothing says why the hero is locked or how to unlock. A first-timer will drag the hero, nothing
    will happen, and they will think it is broken. Tapping a locked thing should say "Locked. Unlock?" right there.

### B3. Doing without a keyboard and mouse

11. **High. No stand-in for Shift and Alt.** Beyond picking several: no way to drag a copy, no way to keep a drag
    straight, no visible snap switch. Every app in part A built something. Fix: two or three hold-buttons at the
    screen's left edge for the free thumb (Pick several, Copy, Straight). They disappear when a keyboard is attached.
12. **High. No stand-in for mouse precision.** A finger covers a crate. There are no nudge arrows, no magnified
    view while dragging, and the mockups do not show what tapping "6 tiles" opens. Fix (pattern 3): tapping a number
    opens a number pad with minus and plus (Logic's); picked things get four small nudge arrows in their action bar;
    a slider goes finer when the finger slides away from it (Procreate's).
13. **High. Sliders hide their numbers.** "How heavy: Light as a leaf … Heavy as a rock", "How tall", "How steep",
    "How close together". The number is under More. A level designer needs "2.5" to match another crate, to tell a
    teammate, to tell an agent. Fix: keep the two friendly words under the ends, and show the number at the right of
    the label, tappable for the number pad. Friendly and exact at once.
14. **Medium. Pencil and finger are only half decided.** The Scenes page's own notes say a finger on the scene
    moves the view so nothing is painted by accident. Good, and that is pattern 5. But it is in a code comment, not
    on screen, and nothing says what happens in Levels and Tiles, or for someone with no Pencil. Decide once for all
    editors: with a Pencil in use, the Pencil does the tool's job and a finger only moves and zooms. With no Pencil,
    one finger does the tool's job and two fingers move.
15. **Medium. Undo and Redo spend toolbar room that gestures already cover.** Two-finger tap is in the Keys page.
    Keep Undo and Redo, but as two small buttons in the top bar (Procreate, Photoshop on iPad), so the toolbar holds
    tools and nothing else. Play is not a tool either: it is the thing you do after using tools. Move it out, to the
    top bar's right, beside Share, where every game engine puts it.

### B4. Play in place

16. **High. On an iPad there is nothing to play with.** The play screen shows the paused game, a play bar and a
    Stop button. It shows no on-screen thumb controls. The project's own rule is that most players are on phones and
    touch comes first. So playing in the editor, on the editor's first device, must show the game's real touch
    controls over the level, and the mockup must draw them.
17. **Medium. Play's controls are at both ends of the screen.** Pause, step, speed and the time line are in a bar
    at the top. Stop is at the bottom, 700 points away. One bar, one place. Its icons (the pin, the circled arrow)
    have no words on a product whose rule is that grandma can tell what to press.
18. **Medium. The inspector while playing reads like a debugger.** "Going sideways: Fast, to the right. Going up:
    Slowly. Standing on: Nothing: in the air." This is honest, plain and of no use to most people most of the time,
    and it takes the same 280 points. While playing, close the inspector unless the person opens it. "Try a change
    while it plays" is the valuable part: keep that as a small card.

---

## C. The looks, against a Y Combinator-level bar

19. **Medium. It is clean and it has no face.** Grey panels, one orange button, a system-like font at one weight.
    Covering the logo square, nothing says which product this is. The products people call beautiful (Linear,
    Procreate, Figma) each have one or two things that are theirs: a type choice, a way panels meet the canvas, a
    motion. The project already chose its fonts (Fraunces, Onest, JetBrains Mono). Use them with intent: numbers in
    the mono font everywhere (positions, sizes, times), panel titles with real weight, and one drawn detail that is
    the editor's own.
20. **Medium. The accent turns brown.** A picked row in the list is the orange mixed into dark grey, which comes
    out as mud beside bright pixel art. Three picked crates make a brown block. Fix: a picked row is a lighter
    neutral grey with a thin orange bar at its left edge.
21. **Medium. The one accent is spent on a button that is always there.** Share is the largest, brightest thing on
    every screen, even on a first run with nothing to share. When everything is loud all the time, nothing is being
    said. Fix: Share is quiet (outline) when there is nothing to share and fills with the accent when there is.
    Then the colour means something.
22. **High. What is picked is the hardest thing to see on the canvas.** A picked crate gets a thin one-point box in
    cream and black with no handles. Three picked crates are close to invisible. Meanwhile the name tag ("Crate-1")
    and the white tip bubble are the loudest things there. Picking is the most important state in an editor. Fix:
    the accent colour, two points thick, with corner handles big enough for a finger. This is what the accent is
    for. The name tag goes (the inspector and list already say the name).
23. **Medium. One dashed white box means four things.** The Start zone, the Fall out zone, "A phone sees" and "A
    computer sees" all use the same dashed white line and white label. Zones are part of the game; the "sees"
    frames are a preview aid. Give each kind its own look, and let the frames be switched off.
24. **Medium. The level's picture looks broken.** Outside the level's black border there are bright blue strips at
    top and bottom, and a column of small green squares down the left edge with one more at the bottom right.
    Nothing explains them. The owner will see a rendering fault. Crop the art to the level, or draw what the edge of
    a level really looks like.
25. **Medium. The grid is always on, over the art.** Thin lines across the whole level at full strength make the
    pixel art look like a spreadsheet. Show the grid faintly, and only while moving, placing or painting.
26. **Medium. Small grey words are too faint.** The faintest grey (`#6e6e6e` on `#252525`) is about 3 to 1. The
    floor for words is 4.5 to 1. Check "Saved", the words under slider ends and "Show as text, for agents" against
    it, and use the middle grey (`#9c9c9c`, about 5.6 to 1) for anything meant to be read.
27. **Low. Two marks for one teammate.** Mia has a round "M" floating in the sky and also a pointer with her name.
    One is enough: the pointer when she is moving, the round mark on the thing she has picked.
28. **Low. "Show as text, for agents" is on every inspector, forever.** It is a link for a small group, shown to
    everyone. Move it under More.
29. **Low. The inspector's header runs to three lines.** "Crate · a box to push and stand on" wraps under the name
    on every pick. One line: the name and its kind.

---

## D. World, part by part

### Levels

30. **High. The "mid-project" level is not a real project.** It is one screen wide with four crates, a button and a
    door. A real level is ten or more screens wide with hundreds of things. Nothing drawn answers: how do I get
    around a long level (a small map? a scroll bar?), what does the list look like with 200 rows at 44 points each,
    how do groups fold? A AAA developer judges an editor on exactly this picture, and it has not been drawn. Draw
    one honest big-level page before calling Levels done.
31. **Medium. "Line up" has no direction.** Line up along the top, the bottom, the left? "Stack" which way? Three
    one-word buttons hide six or more actions. In the action bar (finding 5), a tap on "Line up" offers the four
    edges as pictures.
32. **Low. "Change every crate" has an arrow-out-of-a-box icon and no hint of where it goes.** If it leaves for
    Characters, say so: "Change every crate, in Characters".

### Scenes

33. **Medium. Scenes looks the same as Levels.** Same picture, same hero, same crate at full strength, a different
    list. A person who taps between the two parts cannot tell what changed or which one they are in. In Scenes, the
    game's things (hero, crates, zones) should be faint, and the scenery sharp. In Levels, the other way round.
    (Brush size being hidden is finding 9. The "sees" frames are finding 23.)

### Tiles

- **Medium, covered by 7 and 9:** drawing a tile offers Move and Paint, and no Erase, Fill or colour picker in
  sight. The colours are in the inspector, about 500 points from the tile being drawn. For a drawing screen the
  colours belong beside the drawing (Procreate, every pixel-art app).
- **Medium. The rules page is the hardest screen in World and is drawn as the default.** Striped, grey, orange and
  empty squares in three-by-three grids are how tools for specialists show "which tile goes where". The legend
  helps, and it still fails the grandma test. The page already has the better idea next to it: the test patch
  ("paint here, the tiles join by themselves"). Make the patch the page. Show the rule grids only when someone asks
  "why did it pick that tile?".
- The drawing grid is about 340 points square in a canvas of about 690 x 780, most of it empty dotted ground.
  Finding 1 applies: let it fill the space.

(These three are counted under the findings they point to, so the total stays 33.)

---

## What is right, and should not be touched

- **Share and Suggest.** "Share 3 changes", the list of changes in plain words, "Keep mine / Keep Mia's", "Send to
  Mia to check". This is the best work in the set and is better than what most professional tools offer.
- **Find.** One box that finds values, things and actions, grouped and in plain words.
- **The agent's note with Keep and Undo.** Clear, small, honest.
- **"Different for each"** when several things are picked. Exactly right.
- **Two-finger and three-finger undo and redo.** The same as Procreate, Photoshop and Affinity.
- **Friendly words at slider ends.** Keep them. Add the number (finding 13).
- **The upright iPad's top bar and two-column bottom sheet.** Better than the sideways layout. Borrow from it.

---

## Suggested order

1. **Draw the missing acts** (5, 6, 7, 8): the action bar on a picked thing, Place with its tray, Erase, and one
   clear way to pick several. Without these the editor cannot be judged.
2. **Give the canvas the screen** (1, 2): closed rail, inspector only when something is picked, the upright bar's
   two switchers at every size.
3. **Stand-ins for keyboard and mouse** (11, 12, 13, 14): hold-buttons, number pad, numbers on sliders, the Pencil
   and finger rule.
4. **Play you can play** (16, 17, 18).
5. **One honest big level** (30).
6. **The looks** (19 to 26), which are quick once the layout is settled.

## Three questions only the owner can answer

1. **May the left panel start closed on the iPad** (a thin rail, one tap to open)? Panels still dock, as decided.
   It is the single change that most makes the canvas the app. Recommended: yes.
2. **May Play, Undo and Redo move from the bottom toolbar to the top bar**, so the toolbar holds only tools? The
   direction says "one small toolbar". This keeps one toolbar and makes it smaller. Recommended: yes.
3. **Tiles: test patch first, rule grids only on request?** It changes what the Tiles part is about. Recommended:
   yes.

---

## Pages read

- Procreate handbook, Interface and Gestures: help.procreate.com/procreate/handbook/interface-gestures/interface and
  /gestures
- Digital Trends, "Photoshop for iPad guide" (the touch shortcut, the tool options bar, gestures):
  digitaltrends.com/photography/photoshop-for-ipad-guide
- Creative Bloq, Photoshop for iPad review: creativebloq.com/reviews/photoshop-for-ipad-review
- Creative Bloq, Affinity Designer for iPad review (toolbars that hide, finger modifiers):
  creativebloq.com/reviews/affinity-designer-for-ipad-review
- Affinity Designer 2 for iPad help, the interface (Persona menu, context toolbar, Command Controller):
  affinity.help/designer2ipad/en-US.lproj/pages/Workspace/interface.html
- Sound on Sound, Logic Pro for iPad review (function and modifier buttons, plug-in tiles, number pad, view bar):
  soundonsound.com/reviews/apple-logic-pro-ipad
- ProVideo Coalition, "Final Cut Pro for iPad vs. Mac: What's the Difference?" (the Jog Wheel, what was left out):
  provideocoalition.com/final-cut-pro-for-ipad-vs-mac-whats-the-difference
- Shapr3D, "Behind the Shapr3D user interface refresh" (the adaptive interface):
  shapr3d.com/content-library/behind-the-shapr3d-user-interface-refresh
- Creative Bloq, ZBrush for iPad (Pencil in one hand, finger of the other):
  creativebloq.com/3d/zbrush-for-ipad-5-ways-maxon-has-perfected-mobile-3d-sculpting
- Nomad Sculpt manual, the interface (a toolbar the user fills with their own shortcuts):
  nomadsculpt.com/manual/interface.html
- Apple, Human Interface Guidelines, Designing for iPadOS:
  developer.apple.com/design/human-interface-guidelines/designing-for-ipados
- Figma help, "Guide to the Figma mobile app", and the Figma forum thread asking for a full iPad app:
  help.figma.com and forum.figma.com (thread 42058)

Not reached: LumaFusion's own pages (they returned almost nothing), Notion, and Fast Company's piece on Photoshop
for mobile (blocked). Nothing in this report rests on them.
