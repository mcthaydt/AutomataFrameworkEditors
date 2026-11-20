# Slice 3 (World) design review, round 1, batch B: getting in, the team, and putting changes in

Step 1 of `visual-check` (the words-and-design check). Model and effort: Fable 5.2, medium. The reviewer did not build
these screens and changed nothing but this file.

- Commit examined: Editors `main` `fa3a85340f199969789e7db12692fac3db48591d` (merge of #128).
- Written: 2026-11-20 14:41 UTC.
- Pictures: 240, shot from that commit in a cloud container (Chromium), in
  `/mnt/project-files/screens/design-round-1/b/`, named `<scene>-<size>.png`. 39 scenes of the screens journey and 9
  steps of the check sheet (`check-*`, driven by a throwaway journey that was deleted after the shoot), each at phone
  (390x844), phoneSideways (844x390), ipadUpright (834x1210), ipadSideways (1210x834) and computer (1280x800).
- Every picture was looked at one by one. Sizes, positions, colours and contrast below were measured from the pixels.
- Approved screens skipped: none. "Approved screens" in `history.md` lists only the 2026-11-16 mockups.
- Not run: WebKit, Firefox, any language but English, a real iPad.

Result: 17 red, 14 notes. Paths below are relative to the pictures folder; "all sizes" means the five above.

## Red

### R1. The top bar's words are cut and stacked once someone is signed in

UNIT: `src/features/shell/TopBar.svelte`. VERDICT: red. REQUIREMENT: plan rule "no text off the side or cut short";
iPad upright is the first design size. REASON: with a face or "1 to check" in the bar, the names are cut with dots and
the status wraps onto two or three lines. EVIDENCE: `people-empty-ipadUpright.png`: "Crate Ga…", "Levels · Lev…", "Up
to / date" on two lines. `check-ask-empty-ipadUpright.png`: "Cra…", "Level…", "Up / to / date" on three lines.
`send-sheet-sent-phone.png`: "Lev…" and "Waiting / for / grandma" on three lines. `send-sheet-asks-ipadUpright.png`:
the Send button's second line "1 change, only on this computer" wraps to three small lines. Same at phoneSideways
(`check-ask-empty-phoneSideways.png`). Signed out the same bar fits (`first-run-tour-ipadUpright.png`). EXPECTED: at
every size each word in the bar is whole and on one line. FIX: where the bar has no room, show the status by its icon
alone (it keeps its spoken name) before any name is cut; only `src/features/shell/TopBar.svelte` and
`src/features/shell/docks.ts`.

### R2. The tour's first card covers the visitor's tip

UNIT: `src/features/shell/Tour.svelte`, `src/features/world/begin.ts`. VERDICT: red. REQUIREMENT: plan rules "none
overlapping" and "no text cut short". REASON: two cards sit on top of each other. EVIDENCE:
`first-run-tour-ipadUpright.png`: the tip is at x158 to 676, y77 to 173, the tour card at x248 to 586, y68 to 281; the
tip reads "Try anythin… sign in." with its "Got it" still showing. Same at phone, ipadSideways and computer;
phoneSideways is fine (the tour card is at the bottom right). EXPECTED: one of them at a time. FIX: hold the tip until
the tour ends or is skipped; only those two files.

### R3. "Asked for a change": two notes on top of each other

UNIT: `src/features/team/AuthorNote.svelte`. VERDICT: red. REQUIREMENT: plan rules "none overlapping" and "no text cut
short". REASON: the note with grandpa's words covers a second card, of which only a second "Got it" shows. EVIDENCE:
`check-asked-kid-sees-ipadUpright.png`: front note y76 to 129; behind it a card to y194 whose words are hidden and whose
"Got it" is at x172 to 233, y138 to 181. In the front note "Got it" is broken over two lines. All sizes. EXPECTED: one
note, one "Got it" on one line. FIX: show one note at a time and give the button room for its two words; only
`src/features/team/AuthorNote.svelte`, `src/features/ui/Note.svelte` and `src/features/world/begin.ts`.

### R4. After a change is asked for, the bar still says "Waiting for grandma" (the walk's N7)

UNIT: `src/features/shell/TopBar.svelte`, `src/features/world/Changes.svelte`. VERDICT: red. REQUIREMENT: the
drunk-grandma test (nothing that needs explaining, the next step in sight). REASON: the bar says something untrue, and
names grandma when grandpa answered. EVIDENCE: `check-asked-kid-sees-*.png`, all sizes: the note says "Change it, then
press Send to check", the bar says "Waiting for grandma" and has no Send button. EXPECTED: once the change is sent back
the bar no longer says it is waiting. FIX: read the asked state for the bar's status; only those two files.

### R5. Your own waiting change, opened from the list, is described wrongly

UNIT: `src/features/team/Check.svelte` lines 233, 238 and 253. VERDICT: red. REQUIREMENT: the drunk-grandma test (plain
and true words). REASON: the sheet names the author as the checker and says the change touches something it does not.
EVIDENCE: `waiting-change-as-its-author-*.png`, all sizes: kid reads "With kid, to check" and "kid has your changes",
then "It also changes something that is not a level, like a character." for a change that only moved Crate 1; no "Moved
Crate 1" line. The code passes `change.by` (the author) to `waitTitle` and `waitAbout`, which take the checker's name,
and shows `otherChange` whenever there are no lines. `waiting-sheet-yours-*.png` shows the same change correctly: "With
grandma, to check", "Moved Crate 1 · Level 1". EXPECTED: both ways in show the same true sheet. FIX: for `role ===
'own'` use the waiting sheet's words and lines; only `src/features/team/Check.svelte`.

### R6. The check sheet on a phone held sideways hides what it is about

UNIT: `src/features/team/Check.svelte`. VERDICT: red. REQUIREMENT: plan rule "no text cut short"; the sketch
`walk-check-sheet-sketches.md` (buttons in pairs). REASON: four buttons, one a row, fill the sheet. EVIDENCE:
`waiting-change-as-approver-phoneSideways.png`: the buttons run from y172 to 374 of 390; one cut line of words shows
above them and "Moved Crate 1" does not. `waiting-change-failed-checks-phoneSideways.png`: "Put them in the game" is
off, and the reason is out of sight. EXPECTED: the lines and any reason show without scrolling. FIX: two buttons a row
at this size, as sketched; only `src/features/team/Check.svelte`.

### R7. At iPad upright the check sheet is at the side, not at the foot

UNIT: `src/features/team/Check.svelte`, `src/features/ui/Sheet.svelte`. VERDICT: red (a difference from the sketch that
I did not find named). REQUIREMENT: `walk-check-sheet-sketches.md`: "iPad upright (the level has the room above; the
sheet comes from the foot)". REASON: the built sheet takes the right third and the level is squeezed. EVIDENCE:
`waiting-change-as-approver-ipadUpright.png`: sheet at x527 to 825, y77 to 497; the level is 502 wide of 834, with an
empty dark column 300 wide and 700 tall under the sheet. Same in every `check-*-ipadUpright.png`. EXPECTED: as sketched,
or the difference named with its reason. FIX: place it at the foot at this size, or name the difference in the fix
pull request; only those two files.

### R8. "Not waiting any more" loses the level

UNIT: `src/features/team/Check.svelte`. VERDICT: red. REQUIREMENT: `walk-check-sheet-sketches.md` (a sheet over the
level; "the open level stays under it"). REASON: the level and tools are gone and the sheet sits on an empty dark page.
EVIDENCE: `waiting-change-gone-*.png`, all sizes; the bar still says "1 to check". EXPECTED: the open level stays and
the count is right. FIX: keep the level drawn in the gone step and refresh the count; only
`src/features/team/Check.svelte`.

### R9. "Who can change it" with three people runs off the bottom

UNIT: `src/features/team/People.svelte`, `src/features/ui/Sheet.svelte`. VERDICT: red. REQUIREMENT: the drunk-grandma
test (the main action visible without scrolling); plan rule "no text cut short". REASON: the sheet is taller than the
screen. EVIDENCE: `people-three-people-computer.png`: Save starts at y797 of 800 (3px of a 48px button show).
`people-three-people-ipadSideways.png`: it starts at y831 of 834. The line "They need GitHub only to sign in…" is cut
through. EXPECTED: the foot with Save stays in sight and the rows scroll. FIX: cap the side sheet at the screen's height
with its foot held; only those two files.

### R10. The wrong-name error is too faint

UNIT: `src/features/team/People.svelte`. VERDICT: red. REQUIREMENT: the kit's own contrast rule for problem words on
glass (`--problem-words`, checked in `tests/features/ui/tokens.test.ts`). REASON: the line uses the problem mark's red,
not the words' colour. EVIDENCE: `people-mistyped-name-ipadUpright.png`: text (229, 72, 77) on (33, 34, 32) is 4.08 to
1 at 13px. The same words colour elsewhere is (255, 138, 128) (`game-is-broken-ipadUpright.png`). EXPECTED: at least
4.5 to 1. FIX: use `--problem-words`; only `src/features/team/People.svelte`.

### R11. On a phone held sideways the wrong-name error is out of sight

UNIT: `src/features/team/People.svelte`. VERDICT: red. REQUIREMENT: `visual-check` step 2 (every error says what to do
next, where the person can see it). REASON: the error is under the sheet's foot. EVIDENCE:
`people-mistyped-name-phoneSideways.png`: the field with "-no- good" ends at y303, the foot starts at y305; no error
shows. EXPECTED: the error is in sight after the press. FIX: scroll the error into view; only that file.

### R12. The game's menu on a phone held sideways cuts its last row (the walk's N8)

UNIT: `src/features/ui/Menu.svelte`. VERDICT: red. REQUIREMENT: plan rules "no text cut short" and "every control 44 by
44". REASON: the menu is taller than the screen and ends flat through a row. EVIDENCE:
`visitor-game-menu-phoneSideways.png`: the menu ends at y367; "Sign in", the visitor's way forward, shows 24px of its
row, with no sign that there is more. EXPECTED: whole rows, and a sign when it scrolls. FIX: end the menu on a whole
row with a fade; only `src/features/ui/Menu.svelte`.

### R13. A broken game and "not a game" speak in file words and offer no main action

UNIT: `src/features/world/Opening.svelte`, `src/features/words/`. VERDICT: red. REQUIREMENT: the drunk-grandma test (no
jargon, one main action, no dead end). REASON: a file path and "JSON", and only a quiet "Back". EVIDENCE:
`game-is-broken-*.png`: "content/levels/level-1.json: This file is not valid JSON. Check for a missing comma, quote or
bracket."; the heading is "grandma/crate-game". `not-a-game-*.png`: "Pick another one." with a quiet "Back" only. All
sizes. EXPECTED: a plain sentence first and one big button. FIX: say what is wrong plainly, keep the file line as small
print for a helper, and make the way back the main action; only `src/features/world/Opening.svelte` and the words.

### R14. A map problem is named by ids

UNIT: `src/features/team/PutSheet.svelte` and where the problem sentence is built. VERDICT: red. REQUIREMENT: the
drunk-grandma test (no jargon). REASON: the sentence says "room-1" and "room-2" where the map says "Room 1" and "Room
2". EVIDENCE: `put-sheet-with-a-problem-ipadUpright.png`: "1 problem: room-1's right edge is open at rows 5 to 7, but
room-2, which touches it, is solid there. Open room-2's left edge at those rows, or move it." Same in
`put-sheet-stopped-by-a-problem-*.png`. The map's own card behind it says "Room 1 is open on its side here, but Room 2
has a wall of ground in the way." EXPECTED: the levels' names, in the map card's plain words. FIX: use the name and the
map card's sentence; only the file that builds the sentence and the words.

### R15. Some buttons have their icon on one screen and not on another

UNIT: the `Action` calls in `src/features/world/Opening.svelte`, `src/features/team/PutSheet.svelte`,
`src/features/world/Changes.svelte`, `src/features/team/Games.svelte`. VERDICT: red. REQUIREMENT: the owner's
instruction "icons over words". REASON: the same button is drawn with and without its icon. EVIDENCE: "Back" with no
icon (`game-is-broken-*`, `not-a-game-*`) and with an arrow (`check-ask-empty-*`). "Try again" with no icon
(`game-cant-be-reached-*`, `put-failed-offline-*`) and with one (`pick-a-game-cant-reach-*`). "Close" with no icon
(`send-sheet-sent-*`) and with a tick (`check-ask-sent-*`). "Take them back" with no icon (`send-sheet-sent-*`) and with
one (`waiting-sheet-yours-*`). EXPECTED: one way each, with the icon. FIX: add the icon each already has elsewhere;
only those files.

### R16. Two choices that both look ticked and both look like the main action

UNIT: `src/features/team/Clash.svelte`. VERDICT: red. REQUIREMENT: the drunk-grandma test (one main action per screen).
REASON: "Keep mine" and "Keep someone else's" both carry a tick, and the picked one is filled like a main button beside
the main "Close". EVIDENCE: `put-sheet-clash-only-ipadUpright.png`: picked fill (255, 194, 138), "Close" (238, 180,
128). All sizes. EXPECTED: one filled button; the pick shown as a choice, with the tick on the picked one only. FIX: draw
the pair with the kit's choice control; only `src/features/team/Clash.svelte`.

### R17. Two "couldn't put them in" sheets point at something the sheet does not offer

UNIT: `src/features/team/PutSheet.svelte`, `src/features/words/changes.ts`. VERDICT: red. REQUIREMENT: `visual-check`
step 2 (every error says what to do next; no dead end). REASON: the words and the buttons disagree. EVIDENCE:
`put-failed-look-only-*.png`: "keep a copy instead", and the only button is "Close". `put-failed-blocked-*.png`: the
main button is "Try again", which cannot work until the owner changes a rule, and the words "let Automata Editors past
that rule" need explaining. All sizes. EXPECTED: the button does what the words say. FIX: offer "Keep a copy" on the
first; make "Close" the main button on the second and say who to ask in plain words; only those two files.

## Notes (ideas and things to know; not gaps against a rule)

- N1. Glass, measured. A side sheet is (37, 43, 47) over the sky and (34, 30, 26) over the brown wall, where the level
  itself differs by (52, 132, 198): 6 to 10 percent of the level shows through (`check-ask-typed-ipadSideways.png`).
  That is what the kit's tokens give (72 to 80 percent tint and darkening to 35 to 45 percent), so it is not a gap
  against the kit. Whether it reads as "semi-transparent" is for the owner's eye. A lone card is (25, 25, 25) on a (30,
  30, 30) ground with nothing behind it, so it reads as solid. Lone cards are centred at every size.
- N2. The walk's N2 stays a note. Every iPad-size picture says "on this computer", because `device/size.ts` reads the
  browser's name and the container's browser is a computer's. The owner's screens page will show that word.
- N3. `pick-a-game` was pictured before it finished loading at four of five sizes: blank tiles, "grandma" where "You can
  change everything" goes, no "Signed in as". The scene should wait for the rows before it shoots.
- N4. "Try again" in the put-failed sheets is (255, 194, 138), not the main button's (238, 180, 128). Probably the
  pointer resting on it.
- N5. Off main buttons ("Save", "Send to kid") are 3.3 to 1 and nothing says why they are off.
- N6. One change is called "them", "they" and "these" ("Put them in the game", "Take them back").
- N7. Sentences start with a small letter when a name comes first ("grandma puts them in the game…", "kid gets your
  words…"), and the visitor's menu says "you can try things, not keep them".
- N8. The tip says "Someone made a change… approve it or turn it down" with two waiting, and the buttons say "Put them
  in the game" and "Don't put them in".
- N9. The bar still says "1 to check" while "Asked kid to change it" and "You didn't put kid's 1 change in" are open.
- N10. Who can change it: at ipadSideways and computer the picker sits under the name (the sketch has them on one row);
  the look-only sheet repeats its title as a small heading; "That does not look like a GitHub name." gives no next
  step; grandma and grandpa are both "G".
- N11. "That is everything it remembers." (`history-list`): "it" is not clear.
- N12. Differences from the mockups to name: the asked note has "Got it" where `world-levels-asked` has "Show me"; the
  Send sheet has no "Add a note for Mia" (`world-levels-suggest`); Who can change it has no "Take Jo off the list" line
  (`shell-people`).
- N13. Smaller words and looks: `welcome-needs-a-person` does not say why to sign in; `welcome-after-cancel` calls a
  cancelled sign-in "Problem."; `pick-a-game-cant-reach` uses plain red words where `game-cant-be-reached` uses the
  boxed strip; "Sign in" and "Sign out" share one icon; a "?" key hint shows on touch sizes; the phone menu lists "The
  six editors"; the waiting list's rows have no arrow; the check sheet's buttons are a ragged stack with the main one
  second; "The game's checks found a problem" gives no next step; a stopped put keeps an off button named "Put them in
  anyway".
- N14. The check sheet's two notes stay notes: a tooltip that never shows on touch is not asked for on touch, and "Not
  now" going to the level while loading and to the list once loaded harms nothing.

## The known items

- The walk's N2: note (N2 above). N7: red (R4). N8: red (R12). N9 (a phone's bar names the level, not the game): note;
  the cut names are R1. N6 (offline shows a red cloud only): note; in `put-failed-offline-*` the bar is blurred behind
  the sheet, so it cannot be judged here.
- Not in batch B's pictures, so not graded here: the Move card over Room 1, the German and Russian level bars, and the
  walk's N1, N3, N4, N5 and N10.
