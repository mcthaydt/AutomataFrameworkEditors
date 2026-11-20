# World 16 ("the team"), cycle 1: implementation audit

Lane 2 review of draft PR #113, head commit `63622144864d03c671262f14a63c2ba2c834cbbd` (`claude/project-thread-2r8m50`),
read against the plan's Tasks 38 to 40, the builder's brief and `handoff/world/common.md`. Reviewer: a fresh session
(Sonnet 5.5, medium). Nothing was fixed here.

Audit prompt: Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative
to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or
incomplete integrations. Do your best work.

## Verdict: not ready. Six red findings.

## What ran (on 6362214)

| Check | Result |
| --- | --- |
| `pnpm lint` | clean (1 warning, 3 infos, all in files this PR does not touch) |
| `pnpm typecheck`, `pnpm knip` | clean |
| `pnpm test:node` | 99 files, 1158 tests pass |
| Journeys `notes`, `helper-and-find`, `history`, `games`, `share`, Chromium, local | 5 files, 28 tests pass |
| Screens scenes for people, history, notes, ghost, paste, find, pick-a-game, Chromium, local, all five sizes | pass (their own measuring); pictures looked at, see findings 2, 3 and 6 |
| Draft CI full run on this head, read at 01:26 UTC | `check`, `mockups`, `commit-authors`, 5 shards green; **`browsers (webkit 6/6)` red**; 12 shards still queued or running |

Not run: WebKit and Firefox locally (not installed here), and the rest of the full run (still queued when I wrote this).
The Chromium shards of the full run have not started, so a green Chromium full run is still owed.

## Brief criteria, one by one

| Criterion | Result |
| --- | --- |
| Plan's tests and journeys for Tasks 38 to 40 pass in three engines at every size in the full run | **FAIL** for now: WebKit shard 6 red (finding 1); other shards pending |
| A game's list opens a game only for rows on screen, at most two at once | PASS (`games.journey`, `pictures.test.ts`; `createPeeker` limit 2, `IntersectionObserver` per row) |
| Every new word in nine languages; no sentences in markup | PASS (`languages.test.ts` includes `team`, `games`, `helper`, `notes`; node suite green) |
| Lint, typecheck, knip, node clean; no file over 600 lines | PASS (`World.svelte` 595, `LevelPart.svelte` 600 exactly) |
| Kit glass surfaces and tokens only; icons with short labels; spoken name on every icon-only button | PASS with notes: no colours or blur of their own in the new files (`--g-*`, `--s-*`, `--dim` only); every icon-only button I found has an `aria-label` (trash, copy, add, faces, Find); no hover tooltip exists anywhere in the kit, see note A |
| Task 38: faces open "Who can change it"; non-owner sees words plus "Ask {owner}"; History ten a page with Show me and Show more; `Share.svelte` deleted | PASS in the journeys, but the sheet fails to read at narrow widths (finding 2) and the faces overlap Play (finding 3) |
| Task 39: notes pinned, read every 60 s and on coming back into view, nothing waits for "Put in game", game's own branch gets no commit | PASS (`notes.journey` asserts main commit count unchanged; notes live on `automata/notes`). A note on a gone thing keeps its spot because `at` is sent with `thing` (`LevelPart.svelte:435`). The 60-second timer itself has no test, see note B |
| Task 40: ghost with Keep and Undo, paste, Find (magnifier and Cmd K) | PASS in `helper-and-find.journey`; `ghost.test.ts`, `find.test.ts` match the plan's cases |
| Owed from PR 13: "See what changed" on the done sheet, "Show me on the level" on the waiting sheet | PASS (present in `PutSheet.svelte`, `WaitingSheet.svelte`; the `share`, `history` and `screens` journeys reach them) |

## Existing tests changed

I read every diff of an existing test. The substitutions of old words for `gamesWords` and `teamWords` and the
`/share` to `people` route are honest. One change loosens a check: finding 5. Nothing was skipped.

## Red findings

### 1. WebKit full run is red: two journeys in `open-game.journey.test.ts`

UNIT: `src/features/team/Games.svelte` and `pictures.ts` (the lazy opens), and `tests/journeys/open-game.journey.test.ts`.
VERDICT: red.
REQUIREMENT: brief acceptance ("pass in Chromium, WebKit and Firefox at every size in the full run").
REASON: a page reload or a navigation while the games list's picture opens are still in flight is reported by WebKit as a page error, which every journey treats as a fault.
EVIDENCE: job `browsers (webkit 6/6)` (id 136004714545, run 44650420491): "a sign-in renewal whose answer comes as the page reloads is not a fault, in any browser" failed at round 1 with `page error: /127.0.0.1:4800/api/game?owner=grandma&name=not-a-game due to access control checks.` and the same for `other-game`; "kid opens a link to the game, finds it on the list afterwards, and still does after a reload" failed with one more `due to access control checks` error. Both tests passed on `main`. These are the lazy `/api/game` opens of the new list (the old list opened nothing). Passes locally in Chromium, which does not report aborted fetches.
EXPECTED: no page error in WebKit when a person leaves or reloads the games list mid-picture.
FIX: stop the unfinished opens when the page or list goes away (an `AbortController` through `peeker`/`openGame`, aborted from `drawing.destroy` and `pagehide`), or, if the browser still reports the abort, let those two journeys wait for the list's pictures (network idle) before reloading or navigating. Do not change what the two tests assert. Files: `team/Games.svelte`, `team/pictures.ts`, `game/` only if `openGame` needs a signal, or `tests/journeys/open-game.journey.test.ts` for the wait. Confirm on a WebKit run in CI; I cannot run WebKit here.

### 2. "Who can change it" cannot be read on a phone or in the computer's side panel

UNIT: `src/features/team/People.svelte` (`.person`, `.who`, the level `<select>`).
VERDICT: red.
REQUIREMENT: owner's drunk-grandma test and "readable text on glass" (`common.md` 3 and 4); the PR's own phone sketch ("(M) Mia [Check and put in v]", rows stacked).
REASON: the level picker takes most of each row, so the name and its hint wrap a few letters at a time.
EVIDENCE: pictures `phone-people-three-people.png` and `computer-people-three-people.png` (390 and 1280 wide): "grandp / a", "Sugges / ts, and / checks / other / people' / s chang / es.", "stranger" split as "stran / ger", and "Can't open it" cut at the sheet's foot in the "Anyone with the link" control at the phone. The iPad sizes (834 wide) read fine. The measuring in `screens.journey` did not catch it (the words are not cut by an ellipsis, only broken).
EXPECTED: name and hint read in whole words at 390 and in the 400-wide side sheet; the picker sits under the name (as the phone sketch shows) when the row is narrow.
FIX: let `.person` wrap, so the picker and the bin move under the name below about 480 px of sheet width (a container query on the sheet, or `flex-wrap` with a minimum width on `.who`), and let the three link choices wrap or shorten rather than cut. Files: `team/People.svelte` only.

### 3. The faces in the top bar overlap the Play button

UNIT: `src/features/shell/Faces.svelte`, `TopBar.svelte`.
VERDICT: red.
REQUIREMENT: the screens journey's own rule "none overlapping" and the touch rule (44-point hit areas that do not collide).
REASON: the avatar button is wider than the room the bar gives it.
EVIDENCE: `ipadUpright-people-three-people.png` (four faces: the last face sits on top of the Play icon; cropped and enlarged to check) and `phone-people-read-only.png` (two faces: the second face touches the Play icon). The screens measuring passed, so the overlap is not between the elements it measures, or the scene is excluded by its `only` selector.
EXPECTED: faces and Play never overlap at 390, 834 and 844 wide; with many people the faces fold to "+N" sooner on a narrow bar.
FIX: give `Faces` a maximum of the room left (show fewer faces and "+N" under about 900 px, or on a phone show one face and "+N"), and add the faces button to the measured, non-overlapping elements for the World scenes. Files: `shell/Faces.svelte`, `shell/TopBar.svelte`, `tests/journeys/screens.journey.test.ts` (to measure it, not to loosen it).

### 4. An answer to a note is erased the moment it is sent, even if sending fails

UNIT: `src/features/team/NoteCard.svelte` (`send()`), `Notes.svelte` (`send`).
VERDICT: red.
REQUIREMENT: plan Task 39 / `Review Focus` ("nothing is lost"); the repo's rule that a person's work is not thrown away on a failed save.
REASON: `onanswer(reply.trim()); reply = ''` clears the box before the answer is known to have gone. When the answer comes back offline, busy or failed (the sheet shows `noteOffline`/`noteBusy`/`noteFail`), what the person wrote is gone, and a second press while a send is on is ignored by `if (sending) return` after the text is already cleared.
EVIDENCE: `NoteCard.svelte` lines 29 to 33 and `Notes.svelte` `send` (it returns early when `sending`, and `then` for an answer is an empty function). `NewNote` does it right: it keeps `said` until the note is sent and closes only in `then`.
EXPECTED: the box keeps the words until the server answers ok; on a problem the words are still there with the problem line, as in `NewNote`.
FIX: clear the box from the `then` callback (the card passes a callback, or `Notes` gives `onanswer` a promise of ok), and add a node or browser test with the API answering `offline`. Files: `team/NoteCard.svelte`, `team/Notes.svelte`, one test.

### 5. Pinned copy was deleted, not moved, and the PR body says nothing was deleted

UNIT: `tests/features/words/words.test.ts`.
VERDICT: red.
REQUIREMENT: "Never loosen, skip or re-record a test"; the PR body's own line "Nothing is deleted, skipped or loosened."
REASON: 39 lines of `PINNED` English copy were removed (the old pick-a-game and share words). The ones that live on under new names (the games list's find box, empty and add lines; the copy-link and copied lines; the five access-level names and hints; the add-person, name-unknown, name-twice and name-bad lines; saved, changed, broken and unsaved) are no longer pinned exactly, and the new team, games, helper and notes words are in no pin list either. `languages.test.ts` checks that the nine languages agree, not what English says.
EVIDENCE: `git diff origin/main...HEAD -- tests/features/words/words.test.ts` (0 added, 39 removed); `grep` finds none of the new keys in `PINNED`.
EXPECTED: words that carry over are pinned under their new keys with their old English; only words that were removed with the Share page leave the list; the PR body names the pins it removed.
FIX: add the carried-over words to `PINNED` (or a pin list for the team and games areas) with their old English, delete only the keys that no longer exist, and correct the PR body. Files: `tests/features/words/words.test.ts`, the PR body.

### 6. "Pick a game" sits at the top of the page, not centred

UNIT: `src/features/team/Games.svelte` (`.games`).
VERDICT: red.
REQUIREMENT: the owner's design instruction of 2026-11-20 (project memory): standalone panels on otherwise-empty pages, "Pick a game" among them, sit centred in the middle of the page, not at the top. It is not in this PR's brief, so the builder may not have had it; the page was rewritten here, so it belongs to this change.
EVIDENCE: `computer-pick-a-game.png` (1280 by 800): the card starts 24 px from the top with a third of the page empty below it; `.games` only centres sideways.
EXPECTED: the card is centred up and down when it is shorter than the window.
FIX: `align-items: center` on `.games` with `margin: auto` so a tall list still scrolls from the top. File: `team/Games.svelte` only.

## Notes (kept apart, not blocking)

A. No hover tooltip exists for icon-only buttons anywhere in the kit (faces, bin, copy, add), only the spoken name. The brief asked for "spoken name and tooltip"; the kit has no tooltip, so I record this as a kit gap rather than a defect of this PR.
B. The 60-second timer in `Notes.svelte` and `Helper.svelte` is not tested; the journeys dispatch `visibilitychange`, and no test sets `every` short. A broken interval would pass.
C. `Helper` reads the whole game (`openGame`, with its tileset pictures) every minute for each open window. That is heavier than the notes' read; a cheaper "has the default branch moved" call would do. A follow-up, not a defect against the plan's wording ("the game is read again").
D. "Sign out" uses the `arrow-square-out` (open in another place) icon; a sign-out arrow would be clearer. The sketch said "[sign-out icon]".
E. In `phone-pick-a-game.png` no picture has loaded when the scene is shot (computer shows two); the scene does not wait for the pictures, so the phone picture of the games list shows only tiles.
F. `ghostOf` pins its Keep to the game as last read; a person who edits the same thing between the read and Keep gets `laidOver`'s merge, which is what the plan says. No defect found.

## Reading this audit

The second cycle re-reads only the fix diff, and the full run on the fixed head. Findings 1, 2, 3, 4, 5 and 6 must be green or answered before this merges.
