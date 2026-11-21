# Slice 3 (World) design review, round 2

Step 3 of `visual-check` (the last look) on the fixes of round 1, by a fresh reviewer that built none of these screens
and changed nothing but this file. Model and effort: Opus 5.5, medium.

- Commit examined: Editors pull request #145, branch `claude/project-thread-c709zh`, head `2b49c2c`.
- Written: 2026-11-21 11:25 UTC.
- Judged against: round 1's audits (`2026-11-20-slice-3-design-review-round-1-a.md`, A1 to A20, and `-b.md`, R1 to
  R17), the sketches they name, and the owner's look rules (glass on every surface, icons over words, a lone panel in
  the middle, "Whole world" in the map's bar right of List, the drunk-grandma test for every word).
- Pictures: the fixer's before and after sets in `/mnt/project-files/screens/design-round-1-fixes/` (after = 394 files,
  65 scenes at five sizes plus the map, paint, settings and issue pictures), every one looked at one by one. The after
  set matches the head: the screens journey was run again here at `2b49c2c` and its pictures compared on spot checks
  (`ipadUpright-level-unsaved` is the same picture). What the after set does not cover was shot here at `2b49c2c` into
  `/mnt/project-files/screens/design-round-2/` (50 files, `r2-<scene>-<size>.png`): Play (first tip, bar, paused strip,
  strip with a thing picked, Play from here, a level that cannot play) and the "asked for a change" note, at phone
  (390x844), phone sideways (844x390), iPad upright (834x1210), iPad sideways (1210x834) and computer (1280x800), by a
  throwaway journey deleted after the shoot.
- Measured: the top bar's names (`clientWidth` against `scrollWidth` of each `.name`, and the bar's squeeze step) in
  four states at five sizes; colours and contrast from the pixels.
- Ran here at `2b49c2c` (Chromium, Node 24.22.3): the screens journey, 325 of 325 (the five `welcome-no-example` scenes
  first failed only because this container had not built `dist-plain`; built and re-run, 5 of 5), and the issue
  pictures, 4 of 4. Not run: WebKit, Firefox, a real iPad, any language but English.

## Result

Of round 1's 37 reds, 30 are fixed and 7 are not (A1 in part, A2 and R1, A10 and R14, A18 in part, R3: five faults); 2 new reds (N1, N2). The fixer's calls:
A20 holds, R7 holds, A10/R14 does not.

## Round 1, finding by finding

| Red | Verdict | Evidence (after set unless `r2-`) |
| --- | --- | --- |
| A1 cards pile on the map | **not fixed** at phone sideways and phone (see A1 below); fixed at iPad and computer | `ipadSideways-problem-strip`, `ipadUpright-problem-strip`: card, map and strip apart; `phoneSideways-problem-strip`, `phone-problem-strip` |
| A2 / R1 top bar cuts names | **not fixed** at iPad upright and phone sideways (see A2 below); fixed at phone, iPad sideways, computer | measured below; `ipadUpright-waiting-change-as-approver`, `r2-bar-unsaved-ipadUpright` |
| A3 visitor's Undo under the tip | fixed | `phone-visitor-world-moved`: the note above the tip, both readable |
| A4 / R12 game menu runs off | fixed | `phone-world-game-menu`, `phoneSideways-world-game-menu`, `phoneSideways-visitor-game-menu`: rows scroll, the last row fades |
| A5 ghost unseen, card on the crate | fixed | `computer-ghost-offered`, `phoneSideways-ghost-offered`: two-tone edge, card at the top clear of crate and ghost |
| A6 settings at phone sideways | fixed | `phoneSideways-level-settings-pulled-up`: side panel, crate in sight, tools clear |
| A7 strip covers the level | fixed | `r2-play-picked-strip-phoneSideways`: the buttons fold away, hero and crates in sight (a new small red there, N2) |
| A8 Play from here strip | fixed | `r2-play-from-here-phone`: top, under the bar, two lines, clear of "Slide to walk" |
| A9 first Play tip on the bar | fixed | `r2-play-first-tip-ipadSideways`: tip under the bar; `play.journey` checks it |
| A10 / R14 file words, no way to the problem | **not fixed** in part: "Show me" added; ids remain (see below) | `r2-play-cannot-*`, `phone-problems-list`, `phone-put-sheet-stopped-by-a-problem` |
| A11 one icon, two meanings | fixed | rail "Add level" is `stack-plus`, toolbar Place `plus-circle`; play bar `skip-back`, "From the start" (`r2-play-first-tip-ipadSideways`) |
| A12 no "Drawn" label | fixed | `ipadSideways-level-thing-picked` |
| A13 note and paste sheet on the crate | fixed | `ipadUpright-note-card`: top right, crate clear |
| A14 Find not at the top | fixed | `phone-find-open` and the other four sizes |
| A15 phone settings squeezed | fixed | `phone-world-settings`: helpers full width under each control |
| A16 two peach buttons; Back says nowhere | fixed | `ipadSideways-problem-strip` "Back to the list" plain; `computer-ghost-offered` "Keep" plain |
| A17 square patch at glass corners | fixed | `ipadSideways-visitor-world` tip's bottom-left corner: before a square of (136,181,206), after a round shadow |
| A18 Stay 44 tall; unpicked tag faint | **not fixed** in part: Stay is 48 tall (`computer-level-leave-anyway`); the tag (see below) |
| A19 Move card over Room 1 | fixed | `issue-1-move-card`: pad under Room 1, clear of all three rooms |
| A20 device word at iPad size | fixed (size); the call holds | `computer-level-leave-anyway` 13px; `device/size.ts` and `words/bar.ts` say "only on this iPad" on a real iPad, so the picture's word is the desktop browser's |
| R2 tour card on the tip | fixed | `ipadUpright-first-run-tour`: the tour alone |
| R3 two notes on each other | **not fixed** (see below) | `r2-check-asked-kid-sees-*` |
| R4 bar says "Waiting for grandma" | fixed | `r2-check-asked-kid-sees-ipadUpright`: chat icon named "grandpa asked for a change"; measured at five sizes, no "Waiting" |
| R5 own change described wrongly | fixed | `phone-waiting-change-as-its-author`: "With grandma, to check", "Moved Crate 1" |
| R6 check sheet at phone sideways | fixed | `phoneSideways-waiting-change-as-approver`: buttons two by two, "Moved Crate 1" in sight |
| R7 check sheet at the side, iPad upright | fixed; the call holds | `ipadUpright-waiting-change-as-approver`: at the foot as `sketch-check-sheet.md` draws it |
| R8 "Not waiting any more" loses the level | fixed (a new red there, N1) | `computer-waiting-change-gone`, `phone-waiting-change-gone`: level drawn, count gone |
| R9 three people runs off | fixed | `computer-people-three-people`: Save in sight, rows scroll |
| R10 wrong-name error faint | fixed | `phoneSideways-people-mistyped-name`: (255,138,128) on (34,39,42), 6.61:1 |
| R11 error out of sight | fixed | same picture: the error shows above the foot |
| R13 broken game in file words | fixed | `ipadUpright-game-is-broken`, `phone-not-a-game`: plain title and words, one main button |
| R15 icons on some buttons only | fixed | Back, Try again, Close, Take them back carry their icon (`phone-game-cant-be-reached`, `phone-send-sheet-sent`) |
| R16 both clash choices ticked | fixed | `ipadUpright-put-sheet-clash-only`: one tick, one filled button (Close) |
| R17 sheets point at what they don't offer | fixed | `phone-put-failed-look-only` offers "Keep a copy"; `phone-put-failed-blocked` says who to ask, Close only |

## Reds still open

### A1. On a phone the fix card still lies on the rooms it speaks of
UNIT: `src/features/map/MapPart.svelte`, `src/features/map/MapFloats.svelte` (the fix card's place). VERDICT: red.
REQUIREMENT: round 1 A1, EXPECTED "the rooms it speaks of in sight"; plan rule "none overlapping".
REASON: at phone sideways the card covers Room 2, Room 3 and the problem's red mark; on an upright phone it covers the
top of all three rooms. EVIDENCE: `phoneSideways-problem-strip`: card about (316 to 834, 92 to 298) over the map's right
part; of Room 2 nothing shows, and the red mark at the meeting is under it. `phone-problem-strip`: card to y about 335,
the rooms' top edge at about 327, while 180px under the map (y 400 to 585) is empty. EXPECTED: the card in the free band,
the meeting of the two rooms and the red mark in sight. FIX: place the card by the free band (as the Move pad now is,
A19); at phone sideways, where no band fits it, let the strip's "Problem 1 of 1" open it as a sheet from the foot.
Only those two files.

### A2 / R1. The top bar still cuts the names at iPad upright and phone sideways
UNIT: `src/features/shell/TopBar.svelte`. VERDICT: red. REQUIREMENT: round 1 A2 EXPECTED "the level's name always
whole", R1 EXPECTED "at every size each word in the bar is whole"; iPad upright is the first design size.
REASON: the bar keeps the main button's words and the "1 to check" words whole and cuts the names instead; the pull
request's call (main button keeps its words longest) chose that order, and "1 to check" never gives up its words.
EVIDENCE, measured at `2b49c2c` (name width shown / needed): iPad upright with a change, "Crate Game" 75/83 and "Levels ·
Level 1" 94/104 beside a whole "Put in game" (`r2-bar-unsaved-ipadUpright`); iPad upright with a change to check, 55/83
and 70/104 beside "1 to check" in words (`r2-bar-to-check-ipadUpright`, `ipadUpright-waiting-change-as-approver` reads
"Crate …" and "Levels · …"); phone sideways with a change to check 59/83 and 75/104; phone sideways with a change 79/83
and 99/104 (`r2-bar-unsaved-phoneSideways`). `ipadUpright-problem-strip` reads "Links …" and "Levels…" beside "1
problem". Whole at phone, iPad sideways and computer in every state measured. EXPECTED: the names whole at every size.
FIX: before a name is cut, the main button and the "N to check" and "N problems" statuses keep their icon only (their
words in their spoken name and tooltip, as the quiet status already does), at iPad upright and phone sideways as on a
phone. Only `TopBar.svelte`, and the screens journey's top-bar rule so it holds every status, not only the quiet one.

### A10 / R14. Problems still name levels by their ids
UNIT: `src/features/team/ProblemStrip.svelte`, `src/features/team/Problems.svelte`, `src/features/team/PutSheet.svelte`,
`src/features/world/events.ts` (`cantPlay`). VERDICT: red. REQUIREMENT: the drunk-grandma test (no jargon); round 1 A10
and R14. REASON: the fixer's call (the sentence is the framework's, so it is left) does not hold: the same screens
already show these levels by name, so a person meets "room-2" and "Room 2" for one level side by side. EVIDENCE:
`r2-play-cannot-ipadUpright`: 'There is no level called "room-9". This game has: room-1, room-2, room-3.' above a door
tagged "To Room 9". `ipadSideways-problem-strip`: the card says "Room 1 is open on its side here, but Room 2 has a wall
of ground in the way"; the strip under it says "room-1's right edge is open at rows 5 to 7, but room-2, which touches it,
is solid there". `phone-put-sheet-stopped-by-a-problem`: the same id sentence in bold. The editors already word this
problem themselves (`words/arrange.ts` `wallBody`, with `nameOf`). EXPECTED: levels named as the map names them, in the
plain words the map card uses. FIX, either of two: (a) in the editors, where a problem is about the map's wall, show
`wallBody` with `nameOf` (the map card's sentence), and in any other framework sentence write each level id that the game
has as its name; or (b) a framework pull request that words these diagnostics with level names, then the pin moved. (a)
stays inside this pull request's files and `src/features/game/problems.ts`; (b) is the framework's and a pin move, so it
is a separate unit. Recommendation: (a).

### A18. The unpicked tag is still faint
UNIT: `src/features/levels/Marks.svelte` (the tag's colour). VERDICT: red. REQUIREMENT: round 1 A18 ("full-strength words
on the tag"); contrast on glass. REASON: the fix gave full strength only to a faint thing's tag; an unpicked thing's tag
is as faint as before. EVIDENCE: "How heavy 1" is (152,139,122) on (66,50,28), 3.70:1 at 12px, in
`computer-ghost-offered` (unchanged from round 1), `computer-waiting-change-gone` and
`ipadSideways-world-with-changes-waiting` (3.75:1); a picked tag is (237,237,237), 13.81:1
(`ipadSideways-level-thing-picked`). EXPECTED: at least 4.5:1. FIX: the unpicked tag's words at full strength (it may
stay quieter by its background or border). Only `Marks.svelte`.

### R3. Two notes still show at once when someone asked for a change, and one is not true
UNIT: `src/features/team/AuthorNote.svelte`, `src/features/world/begin.ts`. VERDICT: red. REQUIREMENT: round 1 R3
EXPECTED "one note, one Got it"; the drunk-grandma test (true words). REASON: the notes now stack instead of lying on
each other, but kid still gets two, with two "Got it", and the second says the change is waiting for approval when
grandpa has asked for a change (what R4 fixed in the bar). EVIDENCE: `r2-check-asked-kid-sees-*`, all five sizes:
"grandpa asked for a change: … Change it, then press Send to check. [Got it]" and under it "Your changes are waiting for
approval. This is your version of the game. [Got it]". At phone and phone sideways the first note's top edge is cut by
the stack (`r2-check-asked-kid-sees-phoneSideways`: its words start 8px under the level's top, its border not drawn).
EXPECTED: one note, the asked one. FIX: hold the "waiting for approval" note while the change is asked about; only those
two files.

## New reds

### N1. "Not waiting any more" lies on the tip, which still says a change is waiting
UNIT: `src/features/world/Events.svelte` (the tips' stack), `src/features/team/Check.svelte`. VERDICT: red.
REQUIREMENT: plan rule "none overlapping"; the drunk-grandma test (true words). REASON: in the gone step the level now
stays (R8), and with it the tip "Someone made a change for you to look at. Open it to approve it or turn it down." The
sheet lies on the tip's right end, and the tip asks for something that is no longer there. EVIDENCE:
`computer-waiting-change-gone`: the tip runs about x 380 to 880, the sheet starts at x 872 and the tip's words run under it
("approve it or" meets the sheet's edge); `phone-waiting-change-gone`: both show, the tip at the top saying to open a change
that is gone. EXPECTED: the tip gone once nothing is waiting, and nothing under the sheet. FIX: drop the change-waiting tip
when the count of waiting changes is 0; only those two files.

### N2. Play's folded strip runs its words into the time
UNIT: `src/features/play/PlayBar.svelte` (`.folded .strip`). VERDICT: red (small). REQUIREMENT: plan rule "no text cut
short" (words that touch read as one). EVIDENCE: `r2-play-picked-strip-phoneSideways`: "Drag back to see it again0:00",
no space between the words and the time. EXPECTED: a gap, or the words dropped in the folded row (the button says it).
FIX: in the folded row keep only the slider and the time, or give the label a gap; only `PlayBar.svelte`.

## Notes (not gaps against a criterion)

1. "Moved Crate 1 · Undo" wraps "Moved Crate / 1" on a phone (`phone-visitor-world-moved`, `phone-send-sheet-sent`).
2. "With the hero" still wraps to two lines in the 300px side panel (`ipadSideways-level-thing-picked`).
3. "Choose for me" wraps in the phone settings' choices (`phone-world-settings`).
4. The map's Move pad for Room 3 opens under Room 1, far from the room it moves (`issue-1-move-card`).
5. `game-cant-be-reached` still titles itself "grandma/crate-game".
6. "Stay" has no icon beside "Leave without saving" (`computer-level-leave-anyway`).
7. Round 1's notes not touched by this pull request stay notes (A notes 1 to 16, B notes N1 to N14); the screens page
   should still ask the owner whether the dialogs' 6 to 10 percent show-through is what "glass everywhere" means.

## The fixer's calls

- A20 (device words by device): holds. `device/size.ts` tells an iPad from a computer by touch, `words/bar.ts` has
  "only on this iPad"; the iPad-size pictures come from a desktop browser.
- R7 (check sheet at the foot on an iPad held upright; other side sheets stay at the side): holds; it is what
  `sketch-check-sheet.md` draws, and A13's sheets at the side keep the crate clear.
- A10/R14 (the framework's sentence left as it is): does not hold; see A10 / R14 above.
- The main button keeps its words longest: does not hold where it cuts the names; see A2 / R1 above.

## Verdict

2b49c2c FAIL: 7 red (A1, A2/R1, A10/R14, A18, R3, N1, N2)
