# Progress

The tracker every stage reads first and updates last. It keeps **only open work**, one short line per task
(the Owner, 2026-11-16); finished and parked work moves to [`history.md`](history.md), which threads read only
when asked. One section per cycle; newest first.

## The World editor build (roadmap slice 3, items 5 and 6): planned (2026-11-16)

Stage 2 done: [`plans/2026-11-16-world-editor.md`](plans/2026-11-16-world-editor.md), from
[`specs/2026-11-16-world-editor-design.md`](specs/2026-11-16-world-editor-design.md). 44 tasks in 18 pull requests,
three lanes, plus three framework tasks (F1 to F3) built in AutomataFramework. Build progress: **0%**.

- Next: the plan audit (stage 3, Opus medium), then execution (Sonnet high) starting with pull requests 1 and 2.
- Waits on the framework: only pull request 17 (Plan W's pull request 5, and F1 to F3).

## The shell and World mockups (roadmap slice 3): the plain-words round, all 29 findings fixed (2026-11-15)

Visual review step 1's fixes (the [plain-words check of board v15](audits/2026-11-15-mockups-v15-plain-words.md)),
mockups only (no editor code), in one Sonnet session on PR 70 (it replaces PR 64, whose branch had stopped getting CI
after `main`'s `ci.yml` changed under it; PR 70 is the same branch plus a merge of `main`, no history rewritten).
Progress on this step: **100%** of the fixes; the board is republished (a new version of the same artifact) from CI's
own pictures at five sizes. Next: the design pass (visual review step 2).

- **All 29 findings, high and low together:** "The six editors" with a Screens row (1); a button's gate is a gate, with
  its own icon and drawn as bars, on every page and the library, and a door is only a way into another level (2, 3, 13,
  14, 29); "While something is on it" / "For good" (4); one word each, Move (6) and Make a copy (7); "3 changes, only on
  this iPad" (8); the map's key, move page, level menu, edge card, wall card, problems list, deleted note, zoom and Map
  names, "Zoomed out" and "Levels · Map" on a phone (5, 9 to 12, 15, 21 to 27); "Hide the list", "the 3 crates'
  settings" and "Crate 1 · settings" (17 to 19); the device's own word in the changed dot and the offline line (20); the
  fall band says what happens (16); the join's bar says what taking the line away does (28).
- **Paths wait for Characters:** the join pages no longer draw the walking creature or offer "A path to walk" (the
  Owner: paths wait for the Characters slice).
- **The Owner's yes:** on the world map the zoom button sits right under List and says "Whole world" (the "Far away" gap
  was a drawing mistake: the level's tools are hidden on the map); inside a level it stays "Whole level" and "Close up".
- **One judgement call:** the three-dots menu's clipboard Copy (with Paste) is a different action from Make a copy, so it
  is worded "Copy to paste" there, and both words stay.
- **Found by reading CI's pictures, and fixed:** the world-map wall page was blank (an unescaped apostrophe in its
  script); the edge card and its bar sat off the level's right edge (they are now placed from the level's real edge, at
  6.3% of the sheet); the "Send 1 more" button was 1176 px wide (its class `more` collided with the settings' `.more`
  row; now `extra`); the "For good" choice, the join's tag and the part menu were cut off at the smaller sizes (the
  choices wrap, the tag wraps, the menu is three columns on a phone sideways); on an upright iPad the top bar clipped the
  "Put in game" and "Send 1 more" badges (the `· Level 1` after the level name is dropped there).
- **Seen, not part of this round (for the design pass):** on iPad sideways the map's Move card covers Level 3, so the
  gap between two touching levels is half hidden; on a phone the join page's hint bubble sits over the gate; the phone
  map is panned so Level 1 is cut off; an upright iPad's bottom sheet loses "Where it is" while a dropdown is open.
- **Not changed:** game content in the Story, Characters and Sound pages that names a door (a door in a story is a
  door); the board stays trimmed to this round's screens.

## The shell and World mockups (roadmap slice 3): edge-joined levels, the right panel folded away, the language card (2026-11-15)

Mockups only (no editor code). What the merged level links spec (AutomataFramework PR 165,
`specs/2026-11-15-level-links-and-world-map-design.md`) needs on screen, and two finds of the Owner's ("do collapsed
right side panel, language screen, and whatever the edge-join spec says needs to be added, then do the review cycle").
Progress on this step: **85%** until CI's pictures are read at five sizes and the board is republished. Next: the review
cycle on this pull request, as the coordinator runs it.

- **The world map, redrawn** (`map.js` draws every map page from one description, `BASE.world()` in `base.js`; the
  stylesheet's section 27): each level at its true size where the world file puts it; where two levels touch and both
  are open, a bar across the stretch ("Walk straight across"); a door as a dashed arrow from the door to where you come
  out; the start marked; a key at the bottom so no mark has to be guessed. The test game's shape is in it: Level 2 and
  Level 3 touch, one seamless place.
- **Pushing levels together, and back:** `world-map-push` (dragging Level 4 to Level 3: the stretch shows dashed, a
  line says what letting go does, the old spot is a dashed outline), `world-map-joined` (a note with Undo; the picked
  level's bar: Go in, Move, Pull apart), `world-map-apart` (the opposite, with Undo), `world-map-move` (four arrows a tile
  a tap, and the arrow keys, for anyone who cannot drag), `world-map-overlap` (on top of another level: red, and it goes
  back), `world-map-menu` (held: Go in, Move with buttons, Pull apart, Rename, Make a copy, Delete) and
  `world-map-deleted` (the door into it goes too; Undo).
- **The check's messages:** `world-map-wall` (an edge open on one side only: a red dashed bar and a card with four ways
  out, each undoable), the same problem in the problems list (`world-levels-problems`), and a change that puts two
  levels together named on the Check changes sheet (`world-levels-check`).
- **In a level:** `world-levels-edge` (the touching stretch drawn as on the map, "Walk straight into Level 3", "Go to
  Level 3") and `world-levels-door` (a door's "Leads to" and "You come out", "To Level 2" over it).
- **Words:** "Join" stays the tool that links a button to what it opens (the Owner's word), so levels "touch" and
  players "walk straight across"; the two never share a word. What a button opens is a **gate** (drawn as bars), so it
  never looks like a door into another level, and a button's "Stays open" is the spec's yes or no ("While pressed" or
  "For good"); the old "for 5 seconds" slider and "Pressed by" are gone, since the spec has neither.

- **The right panel folded away** ("what does it look like when the right side is collapsed"): each World part now has
  a pair, the settings shown and the same page with them folded away, so the board can set them side by side:
  Levels (`world-levels-settings`, `world-levels-hidden`, already drawn), Tiles (`world-tiles-settings`,
  `world-tiles-hidden`, from the mid-project slope) and Scenes (`world-scenes-settings`, `world-scenes-hidden`, from
  Tree 2). The way back is the floating tab at the right edge on an iPad and a computer, and the one-line
  "<name> · settings" bar on an upright iPad and a phone. Characters, Feel, Sound and Story get theirs with their slices.
- **The language card on a phone held sideways** had its right column of languages cut off at the card's edge and its
  sentence cut at the bottom: an older rule for the welcome made it a two-column grid at 780 points while the card was
  held to 520. The stylesheet's section 26 lays both cards before a game is open (the language and your games) out on
  purpose there: the title, the sentence and the button down the left, the list on the right, the whole card on the
  screen.

## The shell and World mockups (roadmap slice 3): every action and its opposite, fixed (2026-11-15)

Fixing the [actions check](audits/2026-11-15-slice3-e2e-actions.md), mockups only (no editor code), in one Sonnet
session: all 34 gaps (6 high, 16 medium, 12 low), the Owner's own rule for each fix being the drunk-grandma test on top:
find the action, understand what it did, undo a wrong tap, and no gesture nobody is told about (a visible button with a
plain word wherever a press and hold or a pinch was the only way). Progress on this step: **95%**: the pages and the
stylesheet are drawn and pushed on PR 64 (it replaces PR 57: one merge commit on that branch carried the wrong author and
a force-push is not allowed); the report marks all 34 gaps fixed; CI's pictures at five sizes were read in three rounds
(`d220dbe`, `c6fbdd0`, `e8a2b89`) and every layout fault they showed is fixed; the Editor Mockups board
([the board](https://claude.ai/artifact/W5REbCVDUkABgoPY5Hxy2X)) is republished with 73 screens (the two new ones are the
turned-down pair, below). What is left is the Owner's look.

- **What the pictures showed, and the fixes:** three of the new classes (`.who`, `.chg`, `.key`) had the names of older
  elements (a level's label, the changed dot, a keyframe diamond) and were drawn as those, so the people and changes rows
  and the access key were crushed (renamed `.wh2`, `.cgr`, `.lkey`); the "..." menu's rows took a grid layout from the
  line-up menu (a row layout for its own rows); "Show me" wrapped in the problems list; the language and games cards had
  an empty level behind them; a note for a change made while waiting had no style and ran off the top; a picked join and a
  deleted level had a hint under their note; the colours to paint with ran off an upright phone (two rows now) as did the
  brush settings in a tray and the tile strip (six tiles fit, so "New tile" is in sight); Characters' top bar cut "Up to
  date" on an upright iPad (the back button says "Level 1" there); the scene menu page showed a stray nudge pad.
- **Shared pieces:** `base.js` (the level every World page shares, so a page only says what it is about),
  `frame.js` (the "..." beside a thing's name, "Done" on a phone's sheet, "Smaller", Undo and Redo as a pair, the back
  button, "Send 1 more", the menus that hang under the button that opened them) and a last section in `shell.css`.
- **Pages made (31):** the settings hidden and opened (`world-levels-hidden`, `-settings`), the parts menu, the five
  editors, which scene level, people (open, and read only), your games, the language, what changed, the problems, one
  problem shown, a note opened and a note added, the "..." menu, press and hold on the ground, playing bigger, play from
  here, ask for a change, asked, waiting, a change while waiting, a level held on the map and deleted, the list opened,
  Add things opened, the list put away, Show, the thumb buttons unfolded, a join taken away, a copy kept, the menu signed out, ask your helper,
  and this tile.
- **Pages changed:** the check sheet ("Not now" at the top, Play first), keep a copy ("Not now"), Find (Cancel on a
  touch screen), the number pad (Cancel, over the open sheet on a phone), the game's menu (What changed, Your games),
  Characters (a back button to Level 1), the tile strip ("This tile").
- **H6 answered (the Owner, 2026-11-15, "add it"):** the check sheet has a third answer, "Don't put them in". It turns the
  changes down with no message; Mia gets a note with an Undo (`world-levels-turned-down`) and Sam a note that nothing
  went in and his changes are still on his iPad (`world-levels-turned-down-sam`).
- **What the last pictures showed, fixed (2026-11-15):** on an upright phone the Tiles pages had the first row of colours
  half under the tile strip and the second "in the game" picture cut by the tray, so the drawing is a little smaller and the
  gaps tighter (the stylesheet's section 25); the colours sit four and four, and "Button 1" stays on one line in the narrow
  settings panel. A picture set on `ci-screens` can come from a run a newer push cancelled, so it is read only when that
  run's pictures job finished.

## The shell and World mockups (roadmap slice 3): floating glass docks, built (2026-11-15)

Executing [`plans/2026-11-15-floating-glass-docks.md`](plans/2026-11-15-floating-glass-docks.md) on PR 57, mockups only
(no editor code). Progress on this step: **100%**: all six tasks are done, every picture of Tasks 3 to 5 and of the
other workspaces was read at `b137632`, and every check on the pull request is green. The Editor Mockups board is
republished (version 10, [the board](https://claude.ai/artifact/W5REbCVDUkABgoPY5Hxy2X)) with CI's pictures from that
commit, and the speed test is its own page
([speed test](https://claude.ai/artifact/TbwA44WZwaAX6SsUfkZWoM)). Next: the Owner's speed test on the iPad Pro 11, then
the visual review steps (plain words, design pass, end to end, second look) on this pull request, as the coordinator
decides.

- **Task 1 (20%):** the seven glass tokens, the two recipes (glass for the docks, soft glass for the band, menus, Help,
  Settings and their family), the four solid cases and the contrast check, all in one new last section of
  `docs/mockups/shell.css` and `tests/docs/glass.test.ts`. The check was written first and failed on CI for the right
  reason (the section was not there); it passes with the section.
- **Task 2 (45%):** `world-levels-glass.html` draws the level slid under every panel (a body class, `moved`, and a
  glass class from the page's `MOCK.glass`); `shoot.mjs` now looks for glass inside glass and for pages whose wide blur
  covers over 40% of the window. CI's pictures show the blur is drawn in headless Chromium (no launch flags were
  needed), no element with a blur sits inside another, and the pages over 40% are listed in the `mockups` job's log
  (iPad sideways and computer, mostly the Put in game family, up to 0.68). Three small fixes came out of looking: the
  tools' own card had been given a solid panel by an older rule with a longer selector, the closed rail's tools are a row
  of the rail's card rather than a second card, and the inspector's tab is transparent so its card's glass shows.
- **Task 3 (60%):** every dock floats. The top bar floats 8 points in at all five sizes (its height is what it was: 48,
  56 on a touch screen, 44 on a phone on its side), and its slot `--top-h` grew by the 8 points and the notch, so
  everything measured from it keeps its 8 points under the bar. A phone on its side has a floating column of tools and
  a floating tab for the inspector; an upright iPad and a phone have a floating band above the sheet; the dark canvas
  runs edge to edge at every size; the safe areas (notch, home bar) are kept clear by every dock.
- **Task 4 (75%):** Settings has a "See-through panels" row under "Row size" in "For me" (Choose for me, On, Off; the
  line under it names this device's own setting, "Reduce Transparency" on an iPad or phone), `world-levels-solid.html`
  is the glass page with the setting Off, and `CLAUDE.md` lists the device key `af.me.glass` (`auto`, `on` or `off`)
  with the other "For me" choices the device may keep.
- **Task 5 (90%):** `shell-glass-speed.html` is one page that measures how smooth the glass is on a real iPad: a
  picture sliding behind stand-in panels in the same two glasses, a solid card in the middle with the frames a second
  and the slowest second, and five choices that make a little more of the screen solid, one step at a time. Nothing in
  it loads from anywhere, so it can be published on its own. **Pages over 0.40 wide blur** (the share of the window
  the 24-point blur covers; measured on CI at 7d70541, so the numbers are before Task 3): a normal wide page is about
  0.45 (the list, the inspector and the top bar), and the Put in game family (`world-levels-share`, `-blocked`,
  `-check`, `-offline`, `-suggest`) is highest: 0.62 on an iPad sideways, 0.68 on a computer, 0.75 to 0.77 on a phone,
  0.74 on a phone on its side. Those, and the upright iPad (up to 0.51), are what the Owner's speed test decides.
- **Task 3, after looking (95%):** CI's pictures of the floating docks at all five sizes showed three things, now fixed
  and pictured again at `b137632`. (a) The foot of the Put in game sheet (the buttons and the line under them) was a
  solid panel-grey box laid on the glass card (37 against 24 round it); it is now the glass tint laid on the dark of the
  ground, still filled so rows scrolling under it never show through the buttons (a faint darker strip over a bright
  level remains, see the deferred minors). (b) "Send to check" ran past the narrower floating bar on a phone, so the
  button's words go onto two lines when short of room (nothing else in the bar shrinks). (c) On the big level the Hold
  buttons sat under the floating list, showing only as a ghost through the glass; they now sit beside the list, and
  clear of the home bar. The sheet-foot overlap fix from `7f7d519` holds at all five sizes on `blocked` and `suggest`
  (the buttons about 28 points under the last row, "Your changes are safe" about 16 under "Not yet", the note box on a
  phone whole).
- **Task 6 (100%):** the Characters, Feel, Sound and Story pages at an iPad sideways and a phone were read: docks float,
  words read, the soft glass band is soft, no glass inside glass (the `mockups` job prints nothing for it). The speed
  test page is published on its own, and the board is republished from CI's pictures at `b137632`.
- **Pages over 0.40 wide blur, at `b137632`** (after every dock floats; page, size, share of the window the 24-point
  blur covers): iPad sideways: `world-levels-blocked`, `-check`, `-offline`, `-share`, `-suggest` 0.62, the big level
  0.49, the glass page 0.48. Computer: those five 0.67, the other pages 0.43 to 0.50. Upright iPad: up to 0.51
  (`-check`). Phone: `-check` 0.76, `-suggest` 0.75, `-share` 0.74, `-blocked` 0.60 and `shell-signin` 0.53. Phone
  sideways: 0.69 for the same family and `shell-signin` 0.68. The speed test's choices ("Only the top bar and small
  things" and the others) are the Owner's way to see which of these need the lighter blur.
- **Rulings so far.** (1) The spec's contrast table names `--touch` as peach and `--mark` as olive, but the plain-words
  audit re-pointed them to greys (`#c8c8c8`, `#8a8a8a`) and made `--accent` the peach; the check measures the colours the
  cascade ends on, with `--accent` for the peach, and holds `--mark` (a fill and an icon, never words) to 3 to 1.
  (2) The tour's cards (`.coach`) are light, with dark words and a pointer, like the tips; they stay solid and are not in
  the soft-glass list. If the Owner wants them frosted, they need their words and pointer redrawn dark.
  (3) The plan's page source `world-levels-mid.html` has no picked thing, so `world-levels-glass.html` is made from
  `world-levels.html`. (4) On an upright iPad and a phone the picked crate is low in the level's art, so the level
  cannot slide far enough for the ground to sit behind the bottom docks and keep the crate in the clear: those two
  sizes show glass over sky at the top bar and the Hold tab, and the bottom docks sit over the dark canvas. (5) The
  upright list card and the phone's open inspector sheet are drawn by no mockup (the list is hidden below 1000 points
  wide and the phone's inspector is the one-line peek), so no rules were written for them; the sheets a phone does
  draw (Put in game and the family) already hang 8 points in. (6) The `mockups` job is gated by the `plan` job's
  pictures output (`needs: plan`), not run always, so a draft that changes no mockup does not spend a browser run; the
  `screens` job needs `engines` and `mockups`, as the coordinator said.
- **Deferred minors.** (1) `story-conversations` on a phone has its card labels running off the left edge and over the
  text; it looks the same before the glass work, and the Story slice is later. (2) The Put in game sheet's foot is a
  solid strip, so over a bright level it is a little darker than the glass round it (a see-through foot would let rows
  scroll under the buttons on a short screen). (3) The speed test page's own top bar wraps "Crate Game" and the level's
  name onto two lines on a phone; it is a test page, not a screen. (4) The tour's light cards and the tip bubbles stay
  solid by design (an open question for the Owner, one token to change).

## The shell and World mockups (roadmap slice 3): floating glass docks, the spec (2026-11-15)

The Owner, reviewing the floating side panels at 4e7707a: floating docks everywhere, with a little of Apple's
frosted glass. Spec: [`specs/2026-11-15-floating-glass-docks-design.md`](specs/2026-11-15-floating-glass-docks-design.md).
Progress on this step: **100%** for the spec (the Owner said "Yes to both", 18:30 UTC: the level slides under the glass
once moved, and the top bar floats; "See-through panels" stays; then, 18:31 UTC, a second, softer glass). The plan is
written, **100%**: [`plans/2026-11-15-floating-glass-docks.md`](plans/2026-11-15-floating-glass-docks.md), six tasks
(tokens and the contrast check; glass on today's cards and a check for glass in glass; every dock floating at five
sizes; the setting and the solid page; the speed test page; the other workspaces, the board and the handoff). Next:
the plan's audit or its execution (Sonnet), as the coordinator decides. No mockup changed.

- Every dock floats 8 points in at all five sizes, inside the safe areas; the top bar floats too (the Owner's yes).
- Glass: tint `rgb(30 30 30 / 0.72)`, `blur(24px) brightness(0.45) saturate(1.4)`, a faint white edge and a top shine;
  quiet words on glass are `#a8a8a8` so they pass 4.5 to 1 over pure white. Solid when the browser has no
  `backdrop-filter`, when the device asks for less see-through or more contrast, or when "See-through panels" is Off.
- The level starts clear of every panel but may be dragged under them (the Owner's yes); never glass inside glass.
  Speed is proven on the Owner's iPad with a test page.
- Two strengths (the Owner, 18:31 UTC: menus, Help, Settings and the band "should also be frosted just much less
  transparent and more subtle"): soft glass, `rgb(37 37 37 / 0.92)` with `blur(12px) brightness(0.5) saturate(1.2)`,
  for the band, menus, Help, Settings and the cards of their family. Tip bubbles stay solid and light.

## The shell and World mockups (roadmap slice 3): the Owner's review notes (2026-11-15)

Three changes the Owner asked for while reviewing PR 57, made without the review cycle (the Owner: "don't run the full
cycle"). Progress on this step: **90%** (the first two were drawn in `shell.css`'s last section and checked in CI's
pictures at 4e7707a: the welcome at all five sizes, the World list, the Put in game sheet and the Sound page at iPad
sideways and computer, the Put in game sheet on an upright iPad; the third is drawn and its pictures are still to be
checked).

- **Room to breathe:** the welcome card's foot was cramped (step 3 against the buttons, narrow buttons, the small
  line touching them, 20 points of padding under them). It now has 28 points of padding on every side, 28 between step 3
  and the buttons, 12 between the two buttons (the editors' `--gap`), 16 above the small line, and the buttons wrap
  one above the other on a phone. The same air is given to the tour's cards, the new level's card, the Put in game sheet
  and the sheets built like it, Help, Settings and the helper's card, so they match (one shared `--card-pad`, 20 points).
  The cause of the small line touching the buttons: an older rule for the card's paragraphs out-ranked its own margin.
- **Floating side panels** (the Owner said yes to the coordinator's proposal): on an iPad held sideways and on a
  computer, the list, the rail, the inspector and a band along the bottom are cards inset 8 points from the window and
  the top bar, with the floating toolbar's corners, edge and shadow, and the dark canvas runs edge to edge behind
  them. The level is still fitted between the panels, so nothing of it is hidden. An upright iPad keeps its settings
  sheet from the bottom, now floating too, so the level is never covered. Phones keep their sheet and peek as they were.
  The first pictures showed three things, fixed in the next commit: a card is 8 points narrower than its slot, so each
  slot is 8 wider (the list, the inspector and the Put in game sheet keep the widths they had); the list's two tabs
  stay on one line; and the Put in game sheet, which still sat square against the edge, floats like the rest.
- **The foot of the Put in game sheet** (the Owner, on an iPad held sideways: the line "Your changes are safe" was
  half hidden under Not yet): the buttons pulled the line under them with a negative margin meant to cancel their own
  padding, so the line slid under the opaque buttons. The buttons and the line are now one foot (`.foot` in the page,
  the last block of `shell.css`) with its own room: 16 points above the line, the sheet's own padding under it, and
  the foot still stays at the bottom of a sheet that has to scroll, so the line is read with the buttons. The same
  fault was on the "Send to Mia" sheet ("After you send, the top bar says…"), so it has the same foot. The other
  sheets end on their buttons and are unchanged.

## The shell and World mockups (roadmap slice 3): the second visual look (2026-11-15)

Step 4 of the mockup review: a fresh, harsh look at every screen at the five sizes CI pictures, iPad Pro 11 sideways
first, after the plain-words audit, the Fable pass and the end-to-end check. Report:
`/mnt/project-files/reports/2026-11-15-slice3-second-visual-look.md` (at 59718fe: 28 findings, 7 high, 13 medium,
8 low; two questions for the Owner). Progress on this step: **95%** (every high and medium finding and the
end-to-end leftovers drawn and checked in CI's pictures at d3fb036; a second round fixes what those pictures showed:
tips slid back inside a phone's screen now keep their width, the tour measures after the fonts load, and a phone on
its side keeps room under the level for the names that hang below it).

- **Found:** iPad sideways is in good shape; phone sideways is the weakest size. At every size the play screen was
  shrunk inside a peach outline (the page's frame shared a class name with the body's "playing").
- **Frame:** "this iPad" says the device it is on, everywhere on a page; the body carries the device, so a Pencil
  line shows only on an iPad (`only-ipad`, `only-computer`, `no-phone`); the helper's card on a phone is held to the
  screen, not to the level; a bar or pad with no room above or below what is picked stands beside it; tips and bars
  are kept on the screen once the fonts are in.
- **Fixes:** the play screen's frame (H1) and the phone's two-row play bar (H6); trays on phone sideways lie on the
  bottom edge (M1) and on an upright iPad sit above the settings sheet (H7); the welcome, the new level's card and the
  game's menu fit a phone on its side (H4, M4, M13); the rows page shows both panels at every size (H5); the number
  pad sits clear of the toolbar and the bar steps aside (M2); Tiles fits a phone on its side (M3); the top bar keeps
  the part's name on an upright iPad (M8); the map's lines are drawn from where each level really is (M9, E18); Hold
  goes with the tools under a sheet (M10); the tour rings Place, not the toolbar (M11).
- **New pages:** `shell-tour-pick` (tour step 1, the level: tap the crate), `shell-tour-change` (step 3, a thing's
  settings: drag How heavy) and `world-levels-blocked` (Put in game when a problem must be fixed first; E20).
- **The Owner's answers:** the helper's colour is now Grayish Lavender A (#b5b1d8), from Wada's combination No. 177,
  which pairs it with an olive. The fonts: after seeing four main and secondary pairings on real screens, the Owner
  picked Fraunces + Onest, the site's pair. Fraunces is the main font, for the few big titles (the welcome, the tour's
  cards, a sheet's heading, a new level's card, Help, Settings and the keys); Onest is everything else.
- **Left (low):** an upright phone's top bar cuts "Put in game 3" when it is also offline; "Start was here" wraps
  to three lines on a phone; the iPad's 240-point column still squeezes a few labels to two lines.
- **Next:** the Owner's review.

## The shell and World mockups (roadmap slice 3): the end-to-end check (2026-11-15)

The first check of the mockups as journeys rather than screens: every journey a person expects to finish, walked
screen to screen at five sizes, iPad Pro 11 sideways first. Report: `/mnt/project-files/reports/2026-11-15-slice3-e2e-evaluation.md`
(at d52c73b: 18 journeys, 9 dead ends or gaps, 9 small things). Progress on this step: **100%** (every gap drawn;
CI's pictures checked at 59718fe after one round of fixes).

- **New pages, one per missing step:** `shell-menu` (the game's menu open: the way in to Help, Settings and the keys,
  plus who can change it, keep a copy, another game, sign out; E1), `shell-tour-done` (the tour's last step, ticks
  and "Start making"; E3), `shell-signin` (someone not signed in keeps a copy, or signs in for their own game; E9),
  `world-levels-new` (a new level: ground, Start, Goal and a name; E4), `world-levels-done` (the note after putting
  changes in; E5), `world-levels-sent` (waiting for Mia; E8), `world-levels-check` (Mia checks Sam's changes: play
  them, put them in, or ask for a change; E8) and `world-levels-offline` (couldn't put them in, nothing lost, Try
  again; E10).
- **Frame:** the top bar's button can say "Waiting for Mia" (`waiting`), "Keep a copy" for someone not signed in
  (`signedOut`, no faces), "1 to check" (`checks`) and "No internet" (`offline`); tips stay inside a phone's screen.
- **Fixes:** the welcome no longer points at a button that isn't there yet (E6); the number pad names the row it
  edits (E12); "In front" fits (E13); sheets scroll with their buttons kept at the foot on a short screen (E7); Stop
  stays on an upright phone while playing (E2); an open tray hides the phone's settings line (E16); "Delete" and its
  reason no longer run together (E17).
- **Default chosen (easy to change):** a new level starts with ground, a Start, a Goal and a Fall off zone, so it
  can be played at once.
- **Left:** the phone map's lines (E18), the "Don't let them until it is fixed" sheet (E20), tour steps 1 and 3.
- **Next:** the Owner's review.

## The shell and World mockups (roadmap slice 3): the Fable UI/UX pass's fixes (2026-11-15)

Pull request 56's work moves to branch `claude/project-thread-95sweh` (a new pull request replaces 56) with the fixes from
the one Fable UI/UX pass (`/mnt/project-files/reports/2026-11-15-slice3-fable-uiux-pass.md`, at 7b7039d, 37 findings)
and the Owner's answers to its three questions (2026-11-15, 09:01 UTC). Progress on this step: **100%** (every finding
drawn; CI's pictures checked at five sizes at 1eca759 after two rounds of fixes; the review page is republished as
version 8). Next: the Owner's review.

- **The Owner's answers:** F2 yes, the tools go down the left edge on an iPad held sideways (in the rail with the list
  when it is closed, a floating column beside the open list; the free thumb's buttons move to the bottom left); F9 a
  problem warns first and still lets you put changes in, and that is a setting; F27 "Draw path" is now **Join**, with a
  tray of "Join two things" and "A path to walk".
- **New pages (the Owner: onboarding, instructions and settings, Figma-inspired):** `shell-welcome` (the first-run
  card), `shell-tour` (step 2 of 4, a spotlight on the tools), `shell-help` (the basics with ticks, the tour again,
  keys, your helper) and `shell-settings` ("For everyone on Crate Game": what a problem does when changes go in, three
  choices, warn first by default; "For me": rows, Pencil, left hand, tips, the tour, language).
- **The level's room (F1, F37):** the level's picture is now only the level (`art/level-1-fill.png`, the same 888 by
  580 sheet so no note moved), fitted to the free space; the inspector is 240 points on a sideways iPad; the big
  level's list opens over the level. No green strip, no notch.
- **One tray (F3, F10):** the tray hugs its tiles and carries the tool's one setting at its right end; no grey hint
  line; one hint per screen.
- **Plain faults (F4 to F8):** the two-row page shows its panels again; a one-only thing's bar has no "Make another"
  and its Delete says "A level needs a Start"; four things at most in the bar (Line up, Make another, Delete, …; one
  thing gets Nudge, which opens a pad of 48-point arrows, drawn open on Scenes); the bar stays on the screen and clear
  of what is picked; Tiles colours 44 points; play controls at a thumb's size.
- **Play (F7, F21):** the frame hugs the level; on phones the game takes the screen under the play bar and its
  controls sit in the corners; "Try a change" is a play-bar button on phones; "From the start" and "Play from here" in
  words on iPad and computer, with a picture that is not Undo's; the rewind hint sits under the bar.
- **The rest:** tips point at their thing (F11); picked things have a dark edge (F13); "3 only on this iPad" (F14);
  "Up to date" is quiet and Undo is faint with nothing to undo (F15); one list name, rail "List" and "Add" (F16);
  "Where it is", last, with "Drawn" under Look (F17, F18, F35); a tapped dot explains itself and the sheet's heading
  has the dot (F19); "Whole level" (F20); the Keys sheet in two left columns (F22); the sheet takes the right column
  (F23); Mia's Crate 2 shows as a ghost (F24); one Paint everywhere, Scenes with a tray and Box, Fill, Erase (F25,
  F26); Links' tags above their owner, "Sees this far", "Walks here" (F28); no neighbour tabs mid-level (F29); the map
  has "New level" and no toolbar (F30); "Meadow, shown with Level 1" (F31); Tiles' strip of tiles along the top and
  "The hero stands on" in the settings strip (F32); phones fold the free thumb's buttons to one tab, strips scroll
  with a fade, the lock note wraps, the peek line on an upright phone (F33, F34); Pencil: the left-hand switch shown
  in Show, hover lights the thing under the tip (F36); the Low list (F37).
- **Deviation:** the helper's card on mid-project now says the fix waits for Keep ("Keep this to lift it onto the
  grass"), so the red ring and "1 problem" staying is right (F9's second half).
- **Next:** check CI's pictures at five sizes, fix what is off, republish the review page (artifact
  W5REbCVDUkABgoPY5Hxy2X), then the Owner.

## The shell and World mockups (roadmap slice 3): the plain-words audit's fixes (2026-11-15)

Pull request 56 (branch `claude/project-thread-3v0bsz`) replaces 55: it carries every commit of 55 and adds the fixes
from the Opus plain-words audit (`/mnt/project-files/reports/2026-11-15-slice3-plain-words-audit.md`, at 4f0135d,
52 findings). Progress on this step: **100%** (every finding fixed and checked in CI's pictures at 8538775; the review page
is republished). Branch `claude/project-thread-h6n4o2` (55's) is already deleted.

- **B1 done:** the icons (192 Phosphor files the pages name) and the three fonts (latin and latin-ext) are copied
  into `docs/mockups/assets/` with `LICENCES.txt`. No package came back.
- **Words done (W1 to W24):** "Put in game" / "Send to check" (Share is kept for the people screen) with "3 only on
  this iPad" / "Everyone has it" as the button's second line; Pick, "Slide the view"; "In this level", "Add things",
  rail labels "In it" and "Add"; "Show"; zoom in words; "Drag a copy", "Straight lines"; "3 more settings";
  "Make another" and "…"; "Not the same"; "Your helper"; Crate 1; Fall off; Camera stops here; Ledge; Hurts;
  "Takes 3 hits"; Patch; the Tiles brush "Draw"; Keys sheet words and one line for what needs the iPad app.
- **Simplicity done:** S2/B5 (mid-project shows the helper's card with nothing picked; an open menu takes its bar's
  place), S3, S4, S6, S7, S8, S10, S11, S12, S13, S14. S5: the top bar says "1 problem" in words above phone size.
- **Deviation:** slider values keep their number, small, beside the new word ("Quite heavy 1.6"): the grill round
  asked that sliders never hide their numbers, so both stay. W13: the Group line is removed from the Keys sheet.
- **Layout done (B2 to B14, S1, S9), checked in CI's pictures at 3e84820:** icons were hidden with their words on
  phones (a span rule); the phone toolbar, tray and top bar fit; on a phone on its side the tray is one row along
  the bottom and nothing else floats while it is open; the Keys sheet wraps; Links' part name was drawn as a dot
  (the page's `.pt` class); the tray clears the settings strip; Scenes mid has no frames or day bar.
- **Deviations:** on an upright phone, Show and the zoom readout leave the toolbar (pinch zooms) so the five tools,
  the list, Undo and Play fit; the nudge arrows leave the bar on touch screens below iPad sideways; Line up's menu
  is not drawn open on any page now (the only page that drew it was mid-project, which now shows the helper's card
  alone).
- **Review page republished** (artifact W5REbCVDUkABgoPY5Hxy2X, version 7): the shell and World only, 20 screens at
  five sizes, pictures from 8538775.
- **Left for the Fable pass:** small overlaps CI's pictures still show: on a phone on its side the settings strip
  sits over the top of the hold-buttons (Scenes) and the colour column (Tiles); on Links the keeper's figure covers
  part of "Takes 3 hits"; an upright phone's tool buttons are icons, with a word only under the picked one.
- **Next:** the one Fable UI/UX pass, in its own thread, then the Owner.

## The shell and World mockups (roadmap slice 3): handoff (2026-11-15, 08:10 UTC)

The work is now on pull request 55 (branch `claude/project-thread-h6n4o2`), which carries every commit of pull
request 34 and a merge of `main`. Pull request 34 is closed: it conflicted with `main` in this file after the slice
cut, so its checks had not run on its last three commits. Its branch `claude/project-thread-ul6x7a` is still to be
deleted.

- **Found in CI's first pictures of the grill fixes (at f8ffeda):** every page was blank on a sideways iPad, and
  the Pencil page on a computer too. Cause: the closed left panel put the class `rail` on the page's body, and
  `mockup.css` already had a `.rail` rule (an old slider, 4 pixels high). Fixed by naming the class `left-closed`.
  The pictures of that fix have **not** been looked at yet.
- **Not checked yet:** the other four sizes of the ten new pages, at any commit.
- **Still to do, in order (the Owner, 2026-11-15, 08:06 UTC: one Fable pass, not two; each step its own
  thread):** look at the pictures at all five sizes and fix what is broken; publish the review page again at the
  same address (artifact W5REbCVDUkABgoPY5Hxy2X), with the shell and World only; the Opus plain-words audit, with
  fixes; one Fable UI/UX pass over every shell and World screen at every size, with fixes; then the Owner.
- Only the shell and World are in scope. The other editors' pages are still in `docs/mockups/` and are pictured, but
  wait their turn.

## The mockups, round three: handoff (2026-11-15, stopped for the night)

The Owner stopped for the night at 07:04 UTC ("we'll revisit this tomorrow; we need to have a roadmap so we stick
to the plan again"). Work picks up from that roadmap, not from here. Where things stand, all on PR 34
(`docs/mockups/` only, no editor code):

- **Done and on the branch:** round three's shell, the plain-words audit (122 fixes), design loops one (73)
  and two (63 plus 19 leftovers), and the phone-name fix (84986a8, CI green, pictures checked).
- **Pushed, pictures not yet checked:** grill round 1 for the shell and World (309ac5c) and the Apple Pencil report
  (6f6b588). Grill reports: `/mnt/project-files/reports/2026-11-15-editor-mockups-round3-grill-1-shell-and-world.md`
  and `...-grill-1b-apple-pencil.md`; LDtk picks: `.../2026-11-15-world-what-to-take-from-ldtk.md`. The Owner's
  rules taken in: no auto-tiling rules at launch (the Tiles rules pages are gone), nothing in the shell 2D-only (no
  "layer" on screen, the hold-buttons are a general strip), LDtk picks 1 to 6 and 9 drawn, the world map drawn,
  Apple Pencil first-class. Ten new pages: `world-levels-place`, `-exact`, `-big`, `-paint`, `-one-start`,
  `-links`, `-pencil`, and `world-map`.
- **Not done:** CI's pictures of 6f6b588 checked at five sizes; the review page (artifact W5REbCVDUkABgoPY5Hxy2X,
  its new list is written in the session's scratch copy but not published); the gate before the Owner sees it (an
  Opus drunk-grandma audit, then two Fable UI/UX loops, then the grill thread's re-grill).
- **Deviations to report:** on an upright phone Undo and Play stay at the toolbar's end (no room in the top bar);
  only World turns on the hold-buttons so far; Levels does not dim the scenery (the hero and crate are in the art);
  numbers are in the mono font, which reverses the plain-words audit; Pencil double tap's on-screen twin is the
  toolbar's own Erase, not an extra button; squeeze and the felt tick are only on the Keys page.

## The World editor (roadmap slice 3, items 5 and 6)

Spec written 2026-11-16 after the Owner approved the mockups (board v17):
[`specs/2026-11-16-world-editor-design.md`](specs/2026-11-16-world-editor-design.md). Stage 1 of 7, **4%**. No Owner
question open: the shell, Levels and the world map now, Tiles and Scenes later (Q1 = A); notes live on
`automata/notes` (Q2 = A). Next: the plan (Fable 5.2, medium).

## Task 6 and Task 7 part 1 reverted (2026-11-15)

The Owner said (2026-11-15) that the editors were built before their mockups were shown, and chose to revert what had
already merged on that path: Task 6 (pull request 28) and Task 7 part 1 (pull request 45). This pull request reverts
both merge commits and nothing else; pull request 47 (Task 7 parts 2 and 3) was closed unmerged. Tasks 1 to 5, the
framework pin and every document stay. No editor is built until the Owner approves the revised mockups. Nothing was
run; the pull request's checks are the test.

## The mockups of all five editors: the grill, one editor at a time

The Owner asked (2026-11-15) for a harsh critique of the round-three mockups (pull request 34, at `84986a8`), one
editor per round, held against how well-known iPad apps differ from their desktop versions. Round 1 of 5, the shell
and World, is written, 100%:
[`audits/2026-11-15-editor-mockups-grill-1-shell-and-world.md`](audits/2026-11-15-editor-mockups-grill-1-shell-and-world.md).
Its verdict: a tidy desktop layout at touch sizes, not yet an iPad app. 33 findings (12 High): the level covers 28%
of a sideways iPad; Delete, Duplicate, Erase and placing a thing are drawn on no screen; nothing stands in for the
keyboard's modifier keys or the mouse's precision; play in place shows no touch controls; sliders hide their numbers.
The Owner answered its three questions yes (2026-11-15): the left panel starts closed on the iPad; Play, Undo and
Redo move to the top bar; Tiles opens on the test patch. The Owner then set three more rules the same day: one
editor at a time, moving on only when the Owner is satisfied (so the shell and World are grilled again after each
round of fixes); LDtk is World's big inspiration; no auto-tiling rules at launch, and nothing may tie the editors to
2D only, since they will serve 3D later. What World takes from LDtk, with each pick checked for iPad and for 3D, is
[`audits/2026-11-15-world-what-to-take-from-ldtk.md`](audits/2026-11-15-world-what-to-take-from-ldtk.md): written,
100%; the Owner answered its three questions yes (the picks that need only drawing join this round; values and
links on things, and the world map, are drawn now and each gets a framework spec). The Owner also ruled that the
Apple Pencil gets first-class support; the shell and World are held to that in
[`audits/2026-11-15-editor-mockups-grill-1b-apple-pencil.md`](audits/2026-11-15-editor-mockups-grill-1b-apple-pencil.md):
written, 100%, 13 findings (3 High), no question open. Rounds 2 to 5 (Characters, Feel, Sound, Story) wait for the Owner. Overall:
20%. Nothing was run.

