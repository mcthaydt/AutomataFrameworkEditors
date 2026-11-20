# Slice 3 (World) design review, round 1, batch A: working in a level, and playing it

Step 1 of `visual-check` (the words-and-design check), by a fresh reviewer that built none of these screens.
Model and effort: Fable 5.2, medium. Nothing was fixed.

- Commit examined: Editors `main` `fa3a85340f199969789e7db12692fac3db48591d` (merge of #128).
- Pictures: `/mnt/project-files/screens/design-round-1/a/<scene>-<size>.png`, 176 files, shot by this session from
  that commit in Chromium: 130 scene pictures (26 scenes at 5 sizes) from `tests/journeys/screens.journey.test.ts`,
  the 4 pictures of `tests/journeys/issue-pictures.journey.test.ts`, 38 Play pictures at phone, phone sideways and
  iPad sideways taken by the play journeys' own steps (`play-*`), and 4 pictures of the German and Russian level bar
  (`lang-*`). Every picture was looked at one by one.
- Measured: each scene's page was read at each size for every control's box, every cut word (`scrollWidth` over
  `clientWidth`), every panel's box and glass values; colours were read from the pixels. Positions are CSS pixels,
  `[left, top, width, height]`.
- Approved screens: `docs/superpowers/history.md` approves only the 2026-11-16 mockups, no built screen, so nothing
  was skipped.
- Not run: WebKit and Firefox (the pictures are Chromium only); no real device.
- The screens journey passed all 130 batch-A scenes (exit 0). Its rules do not catch A1, A3, A4, A6 or A9 below:
  it has no rule for one floating card over another, or for a card over the thing it is about.

## Summary

20 reds, 16 notes. The worst, in order: the map's problem cards pile on each other and on the rooms (A1); the top
bar cuts the game's and the level's name at three of five sizes (A2); a visitor's "Undo" is hidden under the tip
(A3); the game menu's last rows cannot be reached on a phone (A4); the ghost of someone else's change cannot be
seen (A5).

## Reds

### A1. The map with a problem: its cards cover each other and the rooms
UNIT: `src/features/map/WallCard.svelte`, `src/features/team/Problems.svelte`, `src/features/map/MapPart.svelte`.
VERDICT: red. REQUIREMENT: the plan's rule "none overlapping" and "at most two things floating over the level".
REASON: the fix card, the "Problem 1 of 1" strip, the legend and the room's own bar sit on each other.
EVIDENCE: `problem-strip-ipadSideways`: card `[76,490,520,210]` and strip `[345,591,520,147]` share 251x109 (the
card's second line of "Move them apart" is hidden); the legend `[358,679,563,59]` is under the strip by 507x59.
`problem-strip-computer`: strip over the legend by 520x59. `problem-strip-phoneSideways`: seven overlaps, the
largest legend under strip 350x79, room bar under strip 356x31, card over "New level" 98x26; four panels float.
`problem-strip-phone` and `problems-list-phone`: card `[8,76,358,262]` covers "New level" by 90x44 and touches all
three room names; the list `[12,76,366,144]` lies on the card by 354x144. `problems-list-phoneSideways`: list on
the card by 420x118. iPad upright is clean.
EXPECTED: one card at a time over the map, none on another, the rooms it speaks of in sight.
FIX: when the strip or the list is open, fold the fix card into it (one panel), and hide the legend while any of
them shows; place by the free band, as the room bar already does. Only the three files above.

### A2. The top bar cuts the game's and the level's name, and wraps its status
UNIT: `src/features/shell/TopBar.svelte`. VERDICT: red. REQUIREMENT: "no text off the side or cut short".
REASON: names end in "…" and the status wraps to two or three lines although the bar has room at iPad upright.
EVIDENCE: a name is cut in 59 of the 130 scene pictures. iPad upright (834): "Crate Game" gets 39 to 80 of 83px in all 22
signed-in scenes, "Levels · Level 1" 51 to 100 of 104px; with a change waiting "Links Game" 45 of 80, "Levels ·
Map" 50 of 87. Phone: "Levels · Level 1" gets 29 to 96 of 104px in every scene (at 69px it reads "Levels · …",
no level name left); `play-door-next-room-phone` shows "Levels · …" where the journey expects the bar to name the
room the door led to. Phone sideways: "Crate Game" 42 to 78 of 83, level 55 to 97 of 104. Wrapped: "Up to date" on
2 lines (41x37) in 52 pictures and on 3 lines (33x55, taller than the 44px bar row) in `world-game-menu` at three
sizes; "Waiting for grandma" on 3 lines (65x55) at phone; "Put in game" on 2 lines (43x37) at phone; the 11px
line "1 change, only on this computer" on 2 lines at iPad upright and phone sideways.
EXPECTED: the level's name always whole; nothing wrapped inside the bar.
FIX: give the names the bar's free space before the status words (the status keeps its icon and drops to the icon
alone when short of room, its words staying in its spoken name); on a phone show the level's name without
"Levels · ". Only `TopBar.svelte` and its test.

### A3. A visitor's "Moved Crate 1 · Undo" note is hidden under the tip
UNIT: `src/features/world/Events.svelte`, `src/features/ui/Note.svelte`. VERDICT: red.
REQUIREMENT: "none overlapping"; no dead end (the way back is Undo).
REASON: the note opens in the same place as the "Try anything you like" tip and lies under it.
EVIDENCE: `visitor-world-moved-ipadSideways`: note `[387,84,196,54]` wholly inside the tip `[345,76,520,98]`; its
Undo `[516,89,62,44]` is under the tip's words. Same at all five sizes (phone: note `[102,84,187,54]` inside tip
`[8,76,374,119]`). In the picture it is a blurred smudge.
EXPECTED: both readable, Undo tappable.
FIX: stack the note under the tip (or the tip gives way while a note shows). Only those two files.

### A4. The game menu's last rows cannot be reached on a phone
UNIT: `src/features/shell/TopBar.svelte` (the game menu), `src/features/ui/Menu.svelte`. VERDICT: red.
REQUIREMENT: no dead end; no text off the side or cut short. Walk note N8, raised: it is also true upright.
REASON: the menu is taller than the window and the page does not scroll.
EVIDENCE: `world-game-menu-phone`: menu `[14,64,300,868]` in an 844px window; "Your games" at y 824 to 872 is cut
and "Sign out" at y 881 to 925 is off the screen. `world-game-menu-phoneSideways`: menu `[14,58,300,463]` in 390px;
"Your games" (412) and "Sign out" (470) are off the screen. `Menu.svelte` sets no height limit or scroll.
EXPECTED: every row reachable, with a sign that there is more.
FIX: cap the menu at the window less 16px and let it scroll, with a faded foot. Only `Menu.svelte`.

### A5. The ghost of someone else's change cannot be seen, and its card covers the thing
UNIT: `src/features/levels/level-canvas.ts` (the ghost), `src/features/team/Ghost.svelte`. VERDICT: red.
REQUIREMENT: drunk-grandma test (nothing that needs explaining); "none overlapping".
REASON: the ghost is sky-coloured on sky, and the card sits on the crate's tag (and on the crate at phone sideways).
EVIDENCE: `ghost-offered-computer`: ghost fill `(164,202,234)` on sky `(159,211,240)` is 1.07:1; its dashed edge
`(181,177,216)` is 1.27:1. Card `[430,582,420,131]` covers the tag `[392,592,90,22]` by 52x22.
`ghost-offered-phoneSideways`: the card (about 212 to 632 by 245 to 375) covers the crate and the ghost.
EXPECTED: an edge of at least 3:1 on any level colour; the card clear of both the thing and its ghost.
FIX: draw the ghost's edge in two tones (dark under light, as the picked ring is) and place the card by the free
band. Only those two files.

### A6. Settings pulled up at phone sideways leave no level
UNIT: `src/features/shell/SettingsPanel.svelte`. VERDICT: red.
REQUIREMENT: "none overlapping"; every control 44 by 44.
EVIDENCE: `level-settings-pulled-up-phoneSideways`: the level is 700x76; the thing bar `[349,72,249,58]` covers
it; the panel `[8,148,828,234]` lies on the tools `[8,98,122,194]` by 122x144 and on the tag by 90x8; the crate's
and the start's marks are 39x44.
EXPECTED: the thing in sight while its settings change, tools not covered.
FIX: at this size open the settings as the side panel (as iPad sideways does) instead of the bottom sheet.

### A7. Play: the unfolded strip covers the whole level when a thing is picked (phone sideways)
UNIT: `src/features/play/PlayBar.svelte`. VERDICT: red. REQUIREMENT: the pr19 sketch (the short box folds the strip
so the bar does not hide the hero); "none overlapping".
EVIDENCE: `play-picked-strip-unfolded-phoneSideways`: the bar is about 517x130 at (145,73) over a game about 130px
tall; hero and crates are hidden while the bar says "Drag back to see it again".
EXPECTED: the game in sight while dragging back.
FIX: in the short box the unfolded strip takes the buttons' row (the buttons fold away while it is open).

### A8. "Play from here": the waiting strip is at the foot, and on a phone 5 lines tall
UNIT: `src/features/play/PlayPart.svelte` (`.pick`). VERDICT: red. REQUIREMENT: the pr17 sketch ("centre top of the
level, over the game"); "none overlapping".
EVIDENCE: `play-from-here-phone`: the strip is about 187px wide, its sentence on 5 lines, over the game's "Slide to
walk" and "Tap to jump" labels. At iPad sideways and phone sideways it is at the foot on 2 lines.
EXPECTED: one or two lines at the top centre, clear of the game's own buttons.
FIX: `top` in place of `bottom`, width `calc(100% - 16px)` on a phone. Only `PlayPart.svelte`.

### A9. The first Play tip lies on the play bar (iPad sideways)
UNIT: `src/features/world/Events.svelte`, `src/features/play/PlayBar.svelte`. VERDICT: red. REQUIREMENT: "none
overlapping".
EVIDENCE: `play-first-tip-ipadSideways`: tip about (345 to 865, 140 to 278) over the bar's strip and time (bar
84 to 550, 84 to 215). On a phone the tip sits edge to edge under the bar instead.
FIX: the tip opens below the play bar's box. Only `Events.svelte`.

### A10. A level that cannot play: file names, and no way to the problem
UNIT: `src/features/play/PlayPart.svelte`, `src/features/words/play.ts`. VERDICT: red. REQUIREMENT: the pr17
sketch ("the framework's sentence and 'Show me the problem'"); no jargon; every error says what to do next.
EVIDENCE: `play-cannot-*` at all three sizes: the sentence names "room-9" and "room-1, room-2, room-3" where the
screens say "Room 1"; the only button is "Got it".
FIX: add "Show me" (it opens the problems list at that problem) and write level names as the map shows them.

### A11. One icon, two meanings
UNIT: `src/features/shell/Toolbar.svelte:55`, `src/features/shell/ListPanel.svelte:40`,
`src/features/play/PlayBar.svelte`. VERDICT: red. REQUIREMENT: the owner's "a short word only where the icon alone
is unclear"; the pr17 sketch.
EVIDENCE: the rail's "Add" and the toolbar's "Place" are both `plus-circle`, side by side in every level picture.
The play bar's "Start again" is `arrow-counter-clockwise`, the same picture as Undo in the top bar above it
(`play-bar-ipadSideways`), and beside it at phone sideways sits the strip's `clock-counter-clockwise`, nearly the
same. The sketch draws it `[|<]` with the words "From the start"; the built name is still "Start again".
FIX: the sketch's skip-back icon and name for the play bar; a different icon for one of Add and Place.

### A12. The Look group has no "Drawn" label
UNIT: `src/features/shell/SettingsPanel.svelte` (the Look group). VERDICT: red. REQUIREMENT: the pr18 sketch.
EVIDENCE: `level-thing-picked-*`: after "Looks like" comes the bare Behind / With the hero / In front row; no
label. In the 300px side panel "With the hero" wraps to 2 lines (60x40) and the helper line starts 1px under the
row.
FIX: the label line as sketched, 8px above the helper.

### A13. A note or the paste sheet covers the thing it is about
UNIT: `src/features/team/NoteCard.svelte`, `src/features/ui/Sheet.svelte`. VERDICT: red. REQUIREMENT: "none
overlapping"; the panel never covers what you work on.
EVIDENCE: `note-card-ipadUpright`: sheet `[137,408,560,394]` over the crate's tag by 90x20, the crate at its edge.
`paste-sheet-ipadUpright`: 90x16. `note-card-phone`: sheet from y 450, the crate's tag at 472.
FIX: at iPad upright these open as the side sheet does at iPad sideways (top right), not in the middle.

### A14. Find is not where its sketch puts it, and on a phone the keyboard would cover it
UNIT: `src/features/shell/Find.svelte`. VERDICT: red (drift from the pr16 sketch: "a glass sheet at the top").
EVIDENCE: `find-open`: sheet at `[325,297]` iPad sideways, `[360,280]` computer, `[137,485]` iPad upright, and at the
foot on a phone `[0,604,390,240]`, where the typing keyboard opens.
FIX: top of the window at every size.

### A15. The phone settings dialog squeezes its words
UNIT: `src/features/shell/Settings.svelte`. VERDICT: red. REQUIREMENT: drunk-grandma test (plain to read).
EVIDENCE: `world-settings-phone`: "Big rows for a finger…" is an 84px column on 5 lines; the "See-through panels"
helper is 111px wide on 9 lines (157px tall).
FIX: on a phone put each helper line under its control, full width.

### A16. Two peach buttons on one screen; "Back" does not say where
UNIT: `src/features/team/Problems.svelte`, `src/features/team/Ghost.svelte`. VERDICT: red. REQUIREMENT: one main
action per screen.
EVIDENCE: `problem-strip-*`: "Back" is `action main` (69x48, peach) while "Put in game" is peach in the bar;
`ghost-offered-*`: "Keep" (97x48, peach) likewise.
FIX: plain style for both; "Back" becomes "Back to the list".

### A17. A square patch shows outside the rounded corners of glass cards
UNIT: `src/features/ui/ui.css` (glass). VERDICT: red (polish). EVIDENCE: `visitor-world-*` tip and
`world-game-menu-*`: beside the bottom corners the pixel is `(136,181,206)` where the sky is `(159,211,240)`.
Chromium only was shot. FIX: clip the blur to the radius (`overflow: clip` or the blur on a pseudo-element).

### A18. "Stay" is 44 tall; the unpicked tag is faint
UNIT: `src/features/world/Events.svelte`, the level tag. VERDICT: red (small). REQUIREMENT: main action 48 tall;
contrast on glass. EVIDENCE: `level-leave-anyway-*`: "Stay" `main` 57x44. `ghost-offered-computer`: "How heavy 1"
on its tag is `(152,139,122)` on `(65,49,27)`, 3.76:1 at 12px.
FIX: 48px; full-strength words on the tag.

### A19. The Move card covers Room 1 (known, issue 1)
VERDICT: red (low). EVIDENCE: `issue-1-move-card`: card about (85 to 343, 262 to 508) over Room 1's left end; the
band below it, (85 to 343, 520 to 826), is empty. FIX: place it there when free. `src/features/map/PadCard.svelte`.

### A20. Device word on an iPad (walk note N2)
VERDICT: red (words). EVIDENCE: `level-unsaved-ipadUpright`, `issue-4-dropdown`: "1 change, only on this
computer" at iPad size, at 11px. FIX: "on this iPad" (or "only here"); 13px.

## Notes (ideas, not gaps)

1. Dialogs read as solid: the settings dialog is `(30,32,34)` over the sky and `(25,26,26)` over the ground, a
   difference of 5 in 255. It matches the tokens the owner was shown in `glass-icons.md` (80% tint, darken to 35%),
   so it is not a red; the bars (layer 1) do show through: `(40,49,54)` over sky, `(37,33,28)` over a wall.
2. The map's room menu (`map-level-more`) repeats Go in, Move and Move apart from the bar under it, and at phone
   sideways covers "New level", the legend and that bar.
3. The framework's problem sentence says ids, "rows" and "solid", and repeats the plain fix card.
4. The keys list leaves out the V A B E L tool letters, Find and Play; the "A" beside "Place a Crate" is unexplained.
5. Find shows two X's (clear and close).
6. Help's "More help" rows look like plain text.
7. With nothing picked the level leaves an empty band at the right at iPad sideways and computer.
8. The first Play tip says "code" and "the game's files".
9. "Keep mine" and "Keep someone else's" show a tick before either is chosen.
10. A half line of text shows above the arrows pad; the pad has no label.
11. During Play the editing tools stay lit as if they could be used.
12. The game's own walk circle covers the hero at phone sideways after the door (`play-door-next-room-phoneSideways`);
    that is the framework's.
13. `issue-4-dropdown`: "0 / 4" under the Opens list is not explained.
14. The settings panel's "The game's file for it, as text" shows raw JSON at 12px.
15. The game menu on a phone lists Characters, Feel, Sound, Story and Screens, which this slice does not build.
16. The play strip shows one time, not the sketch's two ends; the strip overlaps the walk circle by about 23px at
    phone sideways.

## Already known: counted

| Item | Seen here | Verdict |
| --- | --- | --- |
| The Move card over Room 1 | yes, `issue-1-move-card` | red, low (A19): a clear place exists below it |
| German and Russian level bars wider than a phone | not at this commit: `lang-de-level-phone` and `lang-ru-level-phone` have no sideways scroll (390 of 390); the name is cut instead, to 38 of 96px in German and 60 of 111px in Russian | red, as part of A2 |
| N1 tour's last card says "That is the tour" twice | batch B's screens | not judged here |
| N2 "on this computer" at iPad sizes | yes | red (A20) |
| N3 the number pad's + is named "More" | not in these pictures | stays a note |
| N4 an Empty tap missed once at phone sideways | not a picture matter | stays a note |
| N5 pulled-up settings hide Undo on a phone | yes, `level-settings-pulled-up-phone` | stays a note (Undo is in the tools when the sheet is down) |
| N6 offline shows a red cloud only | not shot | stays a note |
| N7 a kid's bar still says "Waiting for grandma" | batch B | not judged here |
| N8 game menu taller than the screen | yes, and also upright | red (A4) |
| N9 the phone's top bar names the level, not the game | yes, and the level's name is cut too | red, as part of A2 |
| N10 no journey turns the device | not a picture matter | stays a note |
| A tooltip never shows on touch | not a picture matter | stays a note: every icon button has a spoken name |
| The loading sheet's "Not now" goes to the level, the loaded one to the list | batch B's sheet | not judged here |
