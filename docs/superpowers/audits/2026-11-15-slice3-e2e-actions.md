# Slice 3 mockups: every action and its opposite, end to end

2026-11-15. Shell and World mockups, AutomataFrameworkEditors PR 57 at `a2388c6` (floating glass docks). Pictures from
CI (`ci-screens`, `pr-57/mockups/`, taken at `b137632`; `a2388c6` changes only the tracker), 38 shell and World pages
at all five sizes: phone upright (390×844), phone sideways (844×390), iPad Pro 11 upright (834×1210), iPad Pro 11
sideways (1210×834) and computer (1280×800). Find-only: nothing in the mockups was changed.

**How this was done.** Every control drawn in the shell (`frame.js`) and on each page was listed, and for each one
I asked two things at every size: can a person reach it here, and is its opposite drawn and visible (open and close,
hide and show, lock and unlock, undo and redo, go in and come back, every sheet's way out). Then the journeys from
first open to a level in the game were walked again. The baseline is the first end-to-end check
(`2026-11-15-slice3-e2e-evaluation.md`); its dead ends E1 to E20 are fixed and are not reported again.

**Verdict.** The journeys the first check listed now finish. What is missing is the way *back* from many controls,
and almost all of it is at the sizes the pages were not designed on first: phones and the upright iPad. The
owner's example is real and is the worst of them: hiding the settings panel on an iPad or a computer leaves nothing
to bring it back.

**Counts:** 6 high, 16 medium, 12 low.

| Severity | Means |
|---|---|
| High | A person can get stuck or can't finish a journey at that size: no way back, no way in, or a sheet with no exit. |
| Medium | It can be done, but the way is not drawn, is hidden, or needs a gesture nobody is told about. |
| Low | A small missing state or "it worked" moment; nobody is stuck. |

## Status: all 34 drawn (2026-11-15, the fixes round)

Every gap below has a page or a change in the mockups, drawn at all five sizes on PR 64. CI's pictures were read in three
rounds and the layout faults they showed are fixed (`docs/superpowers/progress.md` lists them). One question for the Owner is left open: **H6**, whether "Ask for a change" is
enough on the check sheet or a separate "Don't put them in" is wanted. Each fix was held to the drunk-grandma test: the
action can be found, says what it does, can be undone, and is never only a gesture.

| Gap | Fixed by |
|---|---|
| H1 | world-levels-hidden: the hidden settings leave a floating tab at the right edge on an iPad and a computer, the same tab a phone on its side has; the Hide button's tip says where they went. |
| H2 | world-levels-settings: the phone's settings open as a sheet (upright) or a panel (sideways) with Done; world-levels-exact now shows the number pad over the open sheet. |
| H3 | world-levels-parts and shell-editors: both menus drawn open; on a phone the parts and the other editors are one menu, and an upright phone has the game's menu as its last row. |
| H4 | shell-people (the list, each level's drop-down open with what it means, take someone off the list, add someone) and shell-people-look (read only, with who to ask). |
| H5 | shell-games (after signing in, and "Your games" in the game's menu); signing out is on it. |
| H6 | world-levels-check: "Not now" at the top, and "1 to check" stays in the top bar. "Ask for a change" stays the one other answer until the Owner says otherwise (open question). |
| M1 | world-levels-rail: a computer's closed list is the same rail an iPad has. |
| M2 | world-levels-list and world-levels-add: the list and Add things open over the level on a phone and an upright iPad, each with Close. |
| M3 | An upright phone's toolbar has a second row with Undo, Redo, Show and Play, each with its word; world-levels-show draws the menu. |
| M4 | The settings bar stays above Join's and Paint's trays on an upright phone (world-levels-links, world-scenes-mid). |
| M5 | Undo and Redo are a pair on an upright phone, and the map keeps Undo, Redo and Play there. |
| M6 | world-levels-more draws the "..." menu (Rename, Lock or Unlock, Hide or Show, Copy, front, back, Add a note); the "..." is also a visible button in the settings' header, and world-levels-hold draws press and hold on the ground. |
| M7 | world-levels-bigger: Smaller where Bigger was, Stop and the play bar still there. |
| M8 | world-levels-problems (the list) and world-levels-problem (one shown, with Next problem and Back to Put in game). |
| M9 | shell-changes, from the game's menu ("What changed") and from "See what changed". |
| M10 | world-levels-ask (Mia's box), world-levels-asked (what Sam sees), world-levels-waiting (see them or take them back) and world-levels-waiting-more ("Send 1 more to Mia"). |
| M11 | shell-signin has "Not now" at the top; Find has Cancel on a touch screen (world-levels-find). |
| M12 | The part menu has "This level": Rename, Make a copy, Delete; world-map-menu is the press and hold shortcut; world-map-deleted has the note with Undo. |
| M13 | world-levels-note (the thread, an answer box, "Done: hide this note") and world-levels-note-new ("Add a note", from the "..." menu or press and hold). |
| M14 | shell-language: the very first card, the device's language already chosen. |
| M15 | The tile settings row wraps onto two lines on an upright phone (world-tiles, world-tiles-mid). |
| M16 | world-levels-unjoin: tap a join's line to pick it, "Take away this join" in its bar, and "Nothing" first in Opens. |
| L1 | The number pad has Cancel beside Done (world-levels-exact). |
| L2 | world-levels-play-from: the strip "Tap the level where the hero should start" with Cancel. |
| L3 | The map keeps its tip on a phone, and Play, Undo and Redo in a bottom bar on an upright phone. |
| L4 | shell-signin-kept: "Kept a copy of Level 1" with the file's name. |
| L5 | shell-menu-out: the menu signed out ("Sign in with GitHub", no "Who can change it"). |
| L6 | shell-helper: what a helper is, what to tell it, what comes back, and Keep a copy. |
| L7 | A "Back to Level 1" button in the top bar of Characters (characters-figures and -mid). |
| L8 | world-levels-thumb: the thumb buttons unfolded, each with its word. |
| L9 | With "to check" in the top bar, "Up to date" drops to the tick on an upright phone. |
| L10 | world-scenes-parts: "Show this scene with" is in the part menu, so a phone has it. |
| L11 | A "This tile" button at the end of the tile strip, and world-tiles-menu (Rename, Make a copy, Delete). |
| L12 | world-levels-check: "Play the level with them" is the first thing in the sheet, so it is in sight on a short screen. |

## High

### H1. Hiding the settings panel has no way back (iPad upright, iPad sideways, computer) (fixed)

- **Where:** every page with a picked thing (`world-levels`, `-exact`, `-big`, `-links`, `-scenes`, `-tiles-mid`,
  and the rest). The panel's header has a "Hide this panel" button (`frame.js`, `.ihead .ihide`).
- **What's missing:** once hidden, nothing on the screen brings it back. The 44-point tab ("Crate 1", upright text
  on the right edge, `.itab`) is drawn only on a phone held sideways, and the "Crate 1 · settings" bar (`.peek`) only
  on an upright phone. On the iPad and the computer, `.itab` is `display: none`. The only way back is the Tab key
  (keys sheet: "Show or hide the panels"), which an iPad without a keyboard does not have and nobody is told.
  Picking another thing may or may not reopen it; nothing says.
- **Fix:** when the panel is hidden, leave the same tab the phone held sideways has, at the right edge, floating like
  the other docks: the thing's picture and name, tap to open. Draw one page in this state (`world-levels-hidden`) at
  all five sizes. Say in the hide button's tip where it goes ("Hide. Tap Crate 1 at the right edge to show it
  again").

### H2. On a phone, a picked thing's settings are never drawn open, so they can't be closed either (fixed)

- **Where:** phone upright (the "Crate 1 · settings ⌃" bar) and phone held sideways (the "Crate 1" tab at the right).
- **What's missing:** no page shows the bar pulled up or the tab opened, at either phone size. So changing a setting
  on a phone, the welcome card's step 2 and the tour's step 3 ("open Crate 1's settings, then drag How heavy"),
  is never drawn, nor how the sheet goes down again (pull down, a Done, the ⌃ turned ⌄). `world-levels-exact` then
  shows the number pad floating on a phone while the settings are still closed, so the step that opens it is missing.
- **Fix:** one page with the sheet open on a phone: upright, a sheet over the lower half with a grab handle and a
  "Done" (or ⌄) at its top right; sideways, the panel open at the right edge with the same close. Make
  `world-levels-exact` show the pad over the open sheet at phone sizes.

### H3. Moving between Levels, Tiles and Scenes, and to the other editors, is never drawn (fixed)

- **Where:** the top bar's "World ⌄" and "Levels · Level 1 ⌄" buttons, every size.
- **What's missing:** neither menu is drawn open on any page, so there is no drawn way from Levels to Tiles or
  Scenes, or from World to Characters, Feel, Sound or Story, and none back. On an upright phone it is worse: the
  workspace button is hidden and the part's name ("Levels ⌄") is the only one left, but `shell-menu` shows that same
  button opening the game's menu (Help, Settings, Sign out), which has no Tiles, Scenes or World in it. So on an
  upright phone there is no way to Tiles or Scenes at all.
- **Fix:** draw the part menu open (Levels, Tiles, Scenes, each with its icon, the one you are in ticked) and the
  workspace menu open (the five). On an upright phone, put both in one menu: the parts at the top, the five editors
  under them, then "Crate Game menu" (or keep the coloured square for the game's menu on phones too).

### H4. "Who can change it" leads to a screen that isn't drawn (fixed)

- **Where:** the game's menu (`shell-menu`), all sizes: "Who can change it · Mia, Sam and 2 more".
- **What's missing:** the people screen (the Share screen in the Owner's decisions: Look, Suggest, Approve, Edit,
  Owner) is not drawn. So nobody can be invited, a level changed or someone removed, and a Suggest person never learns
  how they would become an Edit person. Teams are a firm decision, so this is a dead end.
- **Fix:** one page: the list of people with their level as a plain-words dropdown ("Can look", "Can suggest",
  "Can check and put in", "Can change", "Owner"), "Add someone" (by GitHub name, with a line saying they need GitHub
  only to sign in), and Close. Show it read-only for someone who isn't an Owner, with who to ask.

### H5. Opening your team's game is never drawn (fixed)

- **Where:** first open for a signed-in person; "Open another game" in the game's menu; "Sign in with GitHub" on
  `shell-signin`.
- **What's missing:** every page starts inside Crate Game. No screen shows what comes after signing in, the list of
  your games ("Open another game"), or a game opening for the first time. For anyone but a demo visitor, the journey
  from first open to their own level starts at a screen that doesn't exist. Signing out has no "after" either.
- **Fix:** one page "Your games": the games this person can open, each with its picture, its name and what you may
  do in it ("You can change everything", "You can suggest"), the demo game at the end, and a line for a game that
  isn't there ("Ask its owner to add you"). Coming back from GitHub lands here, or straight in the game if it was
  the one being opened.

### H6. The "check changes" sheet has no way out except deciding (fixed)

- **Where:** `world-levels-check`, all sizes.
- **What's missing:** Mia's only buttons are "Put them in the game" and "Ask for a change" (and "Play the level with
  them"). Every other sheet has a "Not yet" or "Not now"; this one has nothing to close it, so Mia can't look and come
  back later. There is also no way to say no to the whole lot, only to ask for a change.
- **Fix:** add "Not now" under the two buttons, the same as Put in game's "Not yet", and say the top bar keeps "1 to
  check" until she decides. Decide (with the Owner) whether "Ask for a change" is enough or a "Don't put them in"
  is wanted too.

## Medium

### M1. The list hidden on a computer: its closed state is not drawn (fixed)

- **Where:** computer, every page with the list. The list's tab row has a hide button (`.ltabs .ib`).
- **What's missing:** on a touch screen the closed list is a thin rail (List, Add) and the pictures show it; on a
  computer the rail is never drawn (`frame.js` sets `left-closed` only when `!fine`). The way back is not shown.
- **Fix:** draw a computer page with the list closed to the same rail, and keep the rail at every size.

### M2. The list is never drawn open on a phone or an upright iPad (fixed)

- **Where:** phone upright, phone sideways, iPad upright. The toolbar's first button ("In this level", the stack
  icon) opens it.
- **What's missing:** every page with `leftOpen` (paint, glass, solid) still shows it closed at these sizes, so
  neither the open list nor how it closes (a Close, a swipe, a tap on the level) is drawn. "Add things" (the full
  library, which the Place tray's "All things" leads to) is the same.
- **Fix:** a page with the list open at these sizes: a sheet from the left on an upright iPad, a full-height sheet on
  a phone, each with a Close at its top and the two tabs (In this level, Add things).

### M3. An upright phone has no "Show" button (fixed)

- **Where:** phone upright, every page. The toolbar is list, Pick, Place, Paint, Erase, Join, Undo, Play.
- **What's missing:** the "Show" menu (grid, line up with tiles, zoom, "Show what it is", the screens' frames, "Draw
  with a finger too") has no way in on an upright phone; every other size has it. The keys sheet and the paint page
  both send people to it.
- **Fix:** put Show at the end of the phone's toolbar, or move its rows into the part menu (H3) on a phone.

### M4. On an upright phone, a tray hides the picked thing's settings (fixed)

- **Where:** phone upright, `world-levels-links` (Button 1 picked, Join's tray open) and `world-scenes-mid`
  (Flowers picked, Paint's tray open). `shell.css` hides `.peek` when there is a tray.
- **What's missing:** the picked thing has settings (Opens, Stays open for; Sizes, Colours) but its bar is gone, so
  they can't be reached without leaving the tool.
- **Fix:** keep the settings bar above the tray, one line tall, or put a small "Button 1 · settings" button at the
  tray's left end.

### M5. An upright phone has no Redo button, and the map has no Undo (fixed)

- **Where:** phone upright, every page; phone upright, `world-map`.
- **What's missing:** the toolbar has Undo but no Redo, and the top bar hides both. Redo is only "tap with three
  fingers", which nobody is told outside the keys sheet. On the map the toolbar is gone (`noTools`), so an upright
  phone has neither Undo nor Redo there (for example after dragging a level by mistake).
- **Fix:** make Undo a pair on phones (Undo, and Redo once there is something to redo), and keep Undo and Redo in
  the top bar on the map at phone size.

### M6. The "…" menu over a picked thing is never drawn open (fixed)

- **Where:** the bar over a picked thing, every size ("Make another, Delete, Nudge, …").
- **What's missing:** the "…" holds the rest, but nothing shows what. So there is no drawn way to lock a thing (only
  to unlock it, on `world-levels-big`), to hide one (only the hidden mark on Goal in the list), to rename one, to
  copy it, or to put it in front or behind. Press and hold, "a thing's menu" in the keys sheet, is the same menu and
  isn't drawn either.
- **Fix:** draw the "…" menu open: Rename, Lock (or Unlock), Hide (or Show), Copy, Bring to front, Send to back,
  each with its key on a computer. The same menu opens on press and hold.

### M7. "Bigger" while playing has no way back drawn (fixed)

- **Where:** play bar, iPad and computer ("Bigger: hide the panels while playing").
- **What's missing:** no page shows the level playing bigger, so it isn't shown whether Stop, the play bar or a
  "Smaller" button is still on the screen.
- **Fix:** draw play in "Bigger" with a "Smaller" button where Bigger was and Stop still visible.

### M8. The list of problems is not drawn (fixed)

- **Where:** top bar, "⚠ 1 problem", every size (its tip: "Open the list of problems").
- **What's missing:** tapping it goes nowhere drawn. The sheets' "Show me" goes to one problem, but with two or more
  there is no list, and no way back from "Show me" to the sheet.
- **Fix:** a small list under the button: each problem in plain words with Show me, and on the level a strip "Crate 4
  is half in the ground · Next problem · Back to Put in game" while one is shown.

### M9. "See what changed" leads nowhere (fixed)

- **Where:** `world-levels-done` ("In the game" note), every size; `MOCK.closed` lists "Changes" but no page draws it.
- **What's missing:** the game's list of changes (who changed what, when) is promised and not drawn, and there is no
  other way to see what a teammate did.
- **Fix:** one page "What changed": newest first, each with who, when, the level and a picture, and "Show me".

### M10. After "Send to check", the back and forth is only half drawn (fixed)

- **Where:** `world-levels-sent`, `world-levels-check`.
- **What's missing:** (a) Mia's "Ask for a change" opens nothing drawn (where she writes what to change); (b) Sam
  never gets it: no page shows his top bar or note saying "Mia asked for a change: …"; (c) while waiting, the top
  button says "Waiting for Mia", so a change Sam makes after sending ("You can keep working") has no button to send
  it; (d) tapping "Waiting for Mia" ("see them, or take them back") is not drawn.
- **Fix:** draw Mia's note box, Sam's "Mia asked for a change" note with "Show me" and "Send again", and say where a
  new change goes while waiting (for example the button becomes "Send 1 more to Mia").

### M11. Two sheets have no close: "Keep what you made" and Find on a touch screen (fixed)

- **Where:** `shell-signin` (all sizes); `world-levels-find` on a phone and an iPad.
- **What's missing:** the sign-in sheet has Keep a copy and Sign in, but no "Not now" for someone who wants to go on
  playing with the level. Find has no Cancel on a touch screen, where there is no Escape key, and on a phone the
  on-screen keyboard will cover the screen's lower half.
- **Fix:** "Not now" at the foot of the sign-in sheet; a "Cancel" at the right of Find's box on touch screens.

### M12. A level can be made on the map but not deleted, renamed later or joined to another (fixed)

- **Where:** `world-map`, `world-levels-new`.
- **What's missing:** "New level" works, and its card has Rename, but after the card goes there is no drawn way to
  rename a level, and none to delete one (the opposite of making one) or copy one. The map's lines ("what leads to
  what") can't be drawn or removed. The links between levels are parked with the Owner's eight questions (PR 149),
  so only delete and rename are asked for now.
- **Fix:** press and hold a level on the map opens Rename, Make a copy, Delete (with "Undo" in a note after); the
  level's own name in the top bar is renamable.

### M13. Teammates' notes can be read but not written, answered or cleared (fixed)

- **Where:** `world-levels-mid`, `-share`, `-blocked` (Mia's pinned note).
- **What's missing:** no way to write a note, answer one or mark it done is drawn. The note just stays.
- **Fix:** a note opened: the thread, an answer box, "Done" (which hides it); and "Add a note" in the "…" menu (M6)
  and on press and hold of empty ground.

### M14. The language picked before the welcome is not drawn (fixed)

- **Where:** first open, before `shell-welcome` ("the language was picked before it").
- **What's missing:** the editors' nine-language picker (games' six plus Russian, German, French) is not drawn, so the
  first screen anyone sees is missing, and so is how to change it later from the place you first chose it.
- **Fix:** draw the picker as the very first card, the device's language already chosen, flags and names in their
  own language, one "Go on". Settings › Language is already drawn for later.

### M15. Tiles on an upright phone: the tool's settings run off the screen (fixed)

- **Where:** `world-tiles`, `world-tiles-mid`, phone upright.
- **What's missing:** the row "Draw, Fill, Line · Size 1 2 4 · Mirror · The hero stands on" is cut after Mirror, so
  "The hero stands on" can't be reached. The colour strip's last buttons (add a colour) are cut the same way.
- **Fix:** wrap the row onto two lines, or move "The hero stands on" into the tile's settings.

### M16. A join can be made but not taken away (fixed)

- **Where:** `world-levels-links`, all sizes.
- **What's missing:** drawing from the button to the door is drawn; removing that link is not (no handle with an ×,
  no "Opens: Nothing" in the dropdown shown).
- **Fix:** tapping a join's line picks it and shows "Take away" in its bar; the "Opens" dropdown lists "Nothing"
  first.

## Low

- **L1. The number pad has Done but no Cancel** (fixed) (`world-levels-exact`, all sizes). Undo covers it. Fix: a "Cancel"
  beside Done, or tapping outside keeps the old number.
- **L2. "Play from here" has no picking state** (fixed) (play bar, all sizes): the "tap where the hero should start" moment
  and its cancel aren't drawn. Fix: a strip "Tap where the hero starts · Cancel".
- **L3. The map on a phone:** (fixed) no Play on an upright phone (the toolbar holds it there); the tip ("Tap a level to go
  in") is missing on a phone held sideways. Fix: Play in the top bar on the map at phone size; keep the tip.
- **L4. "Keep a copy" has no "it worked"** (fixed) (`shell-signin`, the game's menu). Fix: a note "Saved Level 1 as a file:
  level-1.json · Show".
- **L5. Signed out, the game's menu isn't drawn** (fixed) (it should say "Sign in", not "Sign out", and have no "Who can
  change it"). Fix: draw it on `shell-signin`'s state.
- **L6. Help's "Ask your helper" leads nowhere drawn.** (fixed) Fix: a short card saying what to paste to your helper, with
  Keep a copy.
- **L7. "Change every crate, in Characters"** (fixed) leaves World for an editor outside this slice, with no way back drawn.
  Fix, when Characters is drawn: "Back to Level 1" in its top bar.
- **L8. The free thumb's "Hold" strip is only drawn folded** (fixed) on phones and the upright iPad. Fix: one picture
  unfolded, with how it folds again.
- **L9. "Up to date" wraps onto two lines** (fixed) on an upright phone when "1 to check" is in the top bar
  (`world-levels-check`). Fix: drop the words to the tick only at that width.
- **L10. "Shown with Level 1"** (fixed) (Scenes) has no way to switch level on a phone, where the words are hidden. Fix: put
  it in the part menu (H3).
- **L11. A tile can be added but not renamed or deleted** (fixed) (`world-tiles`). Fix: press and hold a tile in the strip
  opens Rename, Make a copy, Delete.
- **L12. Phone held sideways, `world-levels-check`:** (fixed) "Play the level with them" is reached only by scrolling inside
  the sheet. Fix: put it beside the two buttons at this height.

## What works both ways

Checked and fine at every size: the welcome (Show me around / I'll look around myself); the tour (Back, Next, Skip on
every step, Start making at the end); Help, Settings and the keys sheet (each has Close); the game's menu (a popover
over a dim, closes on a tap outside); the list closed to its rail and opened again on an iPad held sideways; Play and
Stop at every size, including an upright phone; Pause and Go on; "Try a change" open and its × (and "Keep it" or
"Put it back" when you stop); Put in game, Send to check and the blocked sheet (each has "Not yet"); "Take them
back" after sending; Try again or Not now when offline; Keep or Undo on the helper's change; Unlock on a locked
thing; "Put it back" on a changed value's dot; Undo beside the one-Start note; Map and back (Map button, or tap a
level); New level with Rename.

## Journeys

| Journey | Before | Now |
|---|---|---|
| First open as a visitor → keep a copy | ends at Keep a copy | OK, but the language card (M14) and "it worked" (L4) are missing |
| First open as a team member → your level | not listed | **Dead end**: no "Your games" (H5) |
| Pick, change a value | OK | **Phones: the open settings aren't drawn** (H2); iPad and computer: hide them and they don't come back (H1) |
| Tiles, Scenes | OK | **No drawn way in or back** (H3); none at all on an upright phone |
| Put in game / send to check / check | fixed | Checker can't leave (H6); the back and forth is half drawn (M10) |
| Invite someone, change what they may do | not listed | **Dead end** (H4) |
| Play and stop | fixed | OK; "Bigger" has no way back drawn (M7) |
| New level → delete it | not listed | Can't delete or rename later (M12) |
