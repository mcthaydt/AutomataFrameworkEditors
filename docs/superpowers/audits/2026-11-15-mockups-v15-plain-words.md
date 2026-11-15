# Mockups board v15: plain-words check

Visual review step 1 of 4 (plain-words check), on the mockups pull request at `6be0f5c`. Find only: nothing in
`docs/mockups/` was changed. The fixes come in a separate round.

**What was read.** Every word a person can see or hear on the board's pages (the shell pages and every World page),
at iPad sideways (1210 × 834) and phone upright (390 × 844): the page's own words and every button's hover name and
screen-reader name. The new pages were also looked at as pictures at iPad sideways, phone upright and phone sideways:
the nine map pages, `world-levels-edge`, `world-levels-door`, `world-levels-links`, `world-levels-unjoin`,
`world-levels-problems`, the three "folded away" pages (`world-levels-hidden`, `world-tiles-hidden`,
`world-scenes-hidden`) and `shell-language` on a phone held sideways.

**The test.** Could a drunk grandma tell what is happening and what to press, from the words alone?

## The three wording choices

1. **Levels "touch", players "walk straight across"** (Join kept for the link tool): **passes; keep it.** "Level 3 and
   Level 4 now touch", "Players can't walk across now. The door still takes them." and "Pull apart" read plainly, and
   the opposite of each is in sight. Three small fixes are below (findings 9, 10 and 11): the key's line has no
   person in it, the level menu's "Pull apart" line is back to front, and the edge page's title reads like an order.
2. **The button's target is a "gate", drawn as bars: right on the pages this round drew, but only half done.** Six
   older pages still call the button's target a "door" and draw it as a door (finding 2), so the two meanings the
   change was meant to pull apart are still mixed up on the board. The Opens menu shows a door's icon beside "Gate 1"
   (finding 3).
3. **"While pressed / For good"**: **nearly passes.** "For good" is everyday English, and the pair is short. But a
   button is stood on, not pressed: its own hover name says "opens a gate when something stands on it", and a crate
   can hold it down. Finding 4 suggests words that match.

## Findings

Severity: **High** means a grandma is told something untrue or is stopped; **Medium** means she guesses or is
puzzled; **Low** means she gets there, but the words could be plainer or more alike.

| # | Severity | Screen | Words now | Problem | Suggested words |
|---|---|---|---|---|---|
| 1 | High | `shell-editors` (heading) and the editors button's hover name on **every** page | "The five editors"; "The five editors: World, Characters, Feel, Sound, Story" | There are six editors now: Screens was added by the Owner (2026-11-15). The list on `shell-editors` has no Screens row either. | "The six editors"; "The six editors: World, Characters, Feel, Sound, Story, Screens". Add a Screens row to the list, worded like the others, e.g. "Screens · Menus, pause and what players see". |
| 2 | Medium | `world-levels-mid`, `world-levels-note`, `world-levels-ask`, `world-levels-asked`, `world-levels-check`, `world-levels-suggest`, `shell-helper` | "Can the hero still jump over the door when it is open?"; "Mia · 10 minutes ago, on the door"; "Pinned on Door"; "Can the button sit nearer the door?"; "The door needs a button near it, I think."; "Make the door open when the hero stands on the button." | The thing a button opens is now a gate, drawn as bars, and a door now means a way into another level. These pages still say "door" for what the button opens, and `world-levels-mid` (with its note and ask pages) still draws it as a blue door. A grandma meets both meanings in one session and can't tell them apart. | Say "gate" and draw the bars: "Can the hero still jump over the gate when it is open?", "on Gate 1", "Pinned on Gate 1", "Can the button sit nearer the gate?", "The gate needs a button near it, I think.", "Make the gate open when the hero stands on the button." |
| 3 | Low | `world-levels-links`, `world-levels-unjoin` (Opens menu) | the icon beside "Gate 1" | The icon is a door's, so the picture says "door" while the word says "gate". | Use the gate's bars as its icon, here and in the Add list. |
| 4 | Medium | `world-levels-links`, `world-levels-unjoin` | "Stays open: While pressed / For good"; on the level, "Opens Gate 1 while pressed" | A button is stood on, by the hero or a crate, not pressed (its hover name says "when something stands on it"). A grandma who reads "pressed" looks for a way to press it. | "Stays open: While something is on it / For good"; on the level, "Opens Gate 1 while something is on it". If that is too long for the switch, "While held down / For good". |
| 5 | Medium | `world-map-move` | "One more to the left and it touches Level 3: players will walk straight across." | The picture already shows Level 4 touching Level 3, with the orange walk-across mark between them, so the words and the picture disagree. | Either draw Level 4 one tile apart with no mark, or say "Level 4 touches Level 3 now: players walk straight across. Move it away to keep them apart." |
| 6 | Medium | every page with the folded-in toolbar menu (`world-levels-hidden`, `world-levels-door`, `world-scenes-hidden`, `shell-editors` and others); `world-scenes` ("Nudge one tile"); `world-levels-keys` ("Nudge a picked thing", "Nudge, in the bar over it"); and the map's menu ("Move · With arrows, a tile a tap") | "Nudge" in the levels and scenes; "Move" on the map | Two words for one action: moving a thing a tile at a time with arrows. "Nudge" is also less plain than "Move". | "Move" everywhere, with "a tile at a time" where it needs saying: "Move", "Move it one tile", "Move a picked thing a tile at a time". Hover names: "Move up" (not "Nudge up"), and so on. |
| 7 | Medium | the toolbar menu on the levels and scenes pages ("Make another"), the map's menu ("Make a copy"), the tile menu ("make a copy"), the More menu's hover names ("copy it"), the left strip ("Drag a copy") | "Make another" / "Make a copy" / "copy it" | Three ways of saying one thing. "Make another" can be read as "make a new, blank one". | "Make a copy" everywhere; keep "Drag a copy" for the drag. |
| 8 | Medium | the Put in game button on every page with changes | "1 only on this iPad", "3 only on this iPad" | "3 what?" The number has no noun, so it reads as a puzzle. | "1 change, only on this iPad"; "3 changes, only on this iPad". On a phone, "this phone". |
| 9 | Low | the map's key, at the bottom of every map page | "Walk straight across" beside an orange bar | No person in it, so it reads as an order to the reader. The round orange mark with two arrows, which is what shows on the map where levels touch, is not in the key. | "Players walk straight across", with the two-arrows mark beside the bar. |
| 10 | Low | `world-map-menu` (a level's menu) | "Pull apart · From Level 3. Players can't walk across then" | Back to front: the reason comes first and "then" dangles. | "Pull apart · Move it away from Level 3, so players can't walk across" |
| 11 | Low | `world-levels-edge` (the card at the edge) | "Walk straight into Level 3"; "the hero walks across with no break, and so can a crate" | The title reads like an order. "With no break" can be read as "without breaking anything". "And so can a crate" sounds as if a crate walks. | Title "Players walk straight into Level 3 here"; body "Level 2 and Level 3 touch here. When you play, the hero walks across without stopping, and a crate the hero pushes goes across too." |
| 12 | Low | `world-map-wall`, and the problem's line on `world-levels-problems` | "Players would walk into a wall" then "Level 4 has ground in the way"; "Clear the ground in Level 4 there"; "It stays in the problems"; on the problems list, "Level 3 is open on its right, where Level 4 has ground. It shows on the map." | "Wall" in the title and "ground" in the body for the same thing; "there" points at nothing; "in the problems" is not a place a grandma knows; "It shows on the map" doesn't say what to do. | Title "Players would walk into a wall"; body "Level 3 is open on its right side here, but Level 4 has a wall of ground in the way."; "Clear Level 4's ground where they meet"; "It stays on the list of problems"; problems list "Level 3 is open on its right, but Level 4 has ground in the way. Show me opens the map." |
| 13 | Low | `world-levels-door` (Door 1's settings) | "Which door: Door in" | The other level's door is named "Door in", which reads as broken words, not a name. | Give the door in Level 2 a plain name, such as "Door 1" (each level counts its own) or "Door from Level 1". |
| 14 | Low | `world-levels-door` | "Where it leads" heading, then "Leads to" | Says the same thing twice. | Keep the heading "Where it leads" and name the row "Level", or drop the heading. |
| 15 | Low | `world-levels-problems` (the list's heading) | "3 things to look at", with "3 problems" on the top bar | Two names for one list. | "3 problems" in both places. |
| 16 | Low | `world-levels-mid` and the pages built on it (note, ask, check, suggest and others) | "Fall off" on the dashed band along the bottom | Doesn't say what happens: is it a place to fall off, or what happens when you do? | "Falls out of the level here", or what the game really does, e.g. "Fall in here and you start again". |
| 17 | Medium | the list button's hover name on every page | "Close to the rail" (screen-reader name "Hide") | "Rail" is a builders' word. | "Hide the list" (both names). |
| 18 | Low | every page with an item's settings (`world-levels-hidden`, `world-tiles-hidden`, `world-scenes-hidden` and the settings pages) | hover names "Show 3 crates's settings", "Show Flowers's settings"; "More to do with 3 crates: rename it, lock it…" | Wrong for a plural: "crates's", "Flowers's", "it" for three crates. | "Show the 3 crates' settings", "Show the flowers' settings"; "More to do with the 3 crates: rename them, lock them…" |
| 19 | Low | the three folded-away pages | the tab at the right edge shows only the thing's name, turned on its side ("Crate 1", "Tree 2", "Slope") | The tab doesn't say what it opens. The rest of the board says "Crate 1 · settings". | "Crate 1 · settings" on the tab (and so on). |
| 20 | Low | `world-levels-door`, `world-levels-links`, `world-levels-unjoin` (the changed dot's hover name) | "Changed, only on this device so far" | Every other line says "this iPad" or "this phone". | "Changed, only on this iPad so far" (on a phone, "this phone"). Same for the offline dot: "This iPad can't reach the internet…" |
| 21 | Low | the map, on every map page | the left strip's zoom button "Far away"; its hover name "How near you are: pinch, or press to pick" | "Far away" doesn't say it is about zooming; "press to pick" doesn't say what is picked. | "Zoomed out" on the button (and "Close up" when near, as Tiles has); hover name "How close you are: pinch, or tap to choose". |
| 22 | Low | the Map button's hover name on every page | "Every level on one map. Or pinch out past the whole level" | The second sentence is not a sentence, and "past the whole level" is hard to picture. | "See every level on one map. Pinching out far enough opens it too." |
| 23 | Low | the map on a phone (`world-map*`, phone upright) | the top bar's map button is an icon with no word, and the level menu says only "Levels" | On a phone the map's own button has no name, and nothing on the bar says this is the map. | Put "Map" under the icon (as Undo, Redo and Play have words), or say "Levels · Map" on the menu. |
| 24 | Low | the map's top bar on an iPad and a computer | "Levels · All levels" beside a lit "Map" button | Two names for the one view. | "Levels · Map", or drop "All levels" while the Map button is lit. |
| 25 | Low | `world-map-push`, `world-map-overlap` (hover name of the level being dragged) | ": tap to go in" | The dragged level's copy has an empty name. | Give the copy its level's name ("Level 4: tap to go in"), or no name, since it can't be tapped while dragged. |
| 26 | Low | `world-map-menu` | "Move · With arrows, a tile a tap" | Clipped words; "a tile a tap" is a riddle. | "Move · A tile at a time, with arrows" |
| 27 | Low | `world-map-deleted` | "Its things, and the door into it, went with it. You can bring it back." | "Went with it" is vague about where things went. | "Its things, and the door into it, are gone too. Undo brings them all back." |
| 28 | Low | `world-levels-unjoin` | "Take away this join" (button and hover name) | "Join" as a thing is odd; the grandma sees a line. | "Take this line away", with "Button 1 stops opening Gate 1" under it if there is room. |
| 29 | Low | `shell-people`, `shell-people-look` | "Joined last week", "Joined yesterday" | "Join" now names the tool that links a button to a gate; "joined" here means something else. | "Added last week", "Added yesterday". |

## A note for the coordinator (not a word fault)

`world-levels-links` and `world-levels-unjoin` still show a walking creature with "Walks here", "Sees this far" and
"Takes 3 hits", and the Join tool's choices still include "A path to walk". The Owner's answer B on the level-links
plan (2026-11-15) was that paths wait for Characters, with no walking creature this slice. The words themselves are
plain; whether these belong on this round's board is a question for the coordinator or the Owner, so it is not
counted above.

## Summary

29 findings: 1 High, 8 Medium, 20 Low. The new map and edge screens read well; the touching and walking-across words
should stay. The biggest fixes are the six editors (1), the gate words not yet carried to the older pages (2), the
move page whose words and picture disagree (5), and the counts on Put in game with no noun (8).
