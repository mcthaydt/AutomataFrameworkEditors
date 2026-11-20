# World 16 ("the team"), cycle 2: implementation audit

Re-read of the fix range `6e814257..8831e914` of draft PR #113 (head `8831e914d298908f180570f00c357908041b04a1`) against the six reds
of `2026-11-20-world-16-1-implementation-audit.md`. Reviewer: a fresh session (Sonnet 5.5, medium). Nothing was fixed here.

## Verdict: five of six reds closed by what I could run; red 1 is closed in part and cannot be proved here. No new red.

Ran on the fix head: lint (the same one warning, three infos, none in this PR), typecheck, knip clean; node 99 files, 1174 tests pass;
Chromium journeys `notes`, `open-game`, `games`, `share` (37 tests) pass; screens scenes for people, world, pick-a-game (35) pass; pictures looked at.
Not run: WebKit and Firefox (not installed here). Draft CI on 8831e914 showed only `commit-authors` when I read it; no browser shard result yet.

| # | Finding | Result | Evidence |
| --- | --- | --- | --- |
| 1 | WebKit open-game journeys | **Not proved** (partly fixed) | `Games.svelte` now calls `peeker.stop()` on leaving and `pictures.ts` lets waiting rows go unopened (read: correct; a stopped peeker answers `undefined`, queued rows are resolved, `pictures.test.ts` covers it). `cut-off.ts` now matches a call's path plus its question, and its test fails without that change (read: correct for the first failure, `/api/game?owner=…&name=…` errors). The **second** failure of cycle 1 (`kid opens a link…`, error `…4800/e90feeda-… due to access control checks`) is an address with no query; the change to the tracker does not obviously touch it, and I could not find what makes that request. Only the WebKit full run can say. |
| 2 | People rows unreadable | Closed | `phone-people-three-people.png` and `computer-people-three-people.png`: names and hints in whole words, picker and bin under the name; "Can't open it" still wraps to two lines at the phone but is whole and readable. |
| 3 | Faces overlap Play | Closed | `ipadUpright-people-three-people.png`: two faces and "+2", clear of Play; computer shows four faces, clear. `topbar.browser.test.ts` and a new screens rule measure it (the rule is added, nothing loosened). Find and No internet now show their words only on the wide bar; the icon keeps its spoken name. |
| 4 | Note answer erased on failed send | Closed | `NoteCard` clears the box only from the `sent` callback; the new journey in `notes.journey.test.ts` (pretend GitHub down) passes. |
| 5 | Pins deleted | Closed | 14 pins are back as `PINNED_IN`, the 25 that left are listed in the PR body, and the body no longer says nothing was deleted. Note: `gamesEmpty` is now pinned with a curly apostrophe (the old pin had a straight one); disclosed in the PR body, and the words are the same. |
| 6 | Pick a game not centred | Accepted as the lead decided | Only the class `centred` was added to `Games.svelte`; no centring CSS was written in #113. The card is still at the top until #119's shared rule is in main; nothing to judge until then. |

## The builder's question: top-bar words 1 to 3 px outside their buttons

I did not look at `main` for this, so I cannot say whether it was there before. I saw no word outside its button in the pictures I looked at on this head
(people, ghost, find, pick-a-game, world at phone, iPad upright and computer).

## Notes (not blocking)

- Cycle 1's notes A to E stand unchanged.
- Red 1 must be decided by the WebKit full run after ready. If the second journey (`kid opens a link…`) still fails there, send me its error line.

## Cycle 3: the merge with the glass branch, head `82cf6ede550b9a8a37b1fad4838356899e24f9c9`

Reviewer: the same fresh session. Read: `git diff 42442056 27078f55 -- src tests`, the merge's own edits, the four removed pins. Nothing fixed here.

Verdict: **pass, no red.**

- **Red 1 (WebKit)**: closed. The list stops its queue on `pagehide` and `beforeunload` (`Games.svelte`), and `games.journey` has a test for it that passes here in Chromium; the lead reports the full run on 27078f55 green on all 27 checks, WebKit included, so the open-game journeys pass there. I could not run WebKit myself.
- **Merge**: lint (same one warning, three infos), typecheck, knip clean; node 1167 tests pass; screens scenes for people, history, notes, ghost, paste, find, pick-a-game and the World scene (60 tests, all five sizes) pass. Looked at the pictures at phone, iPad upright and computer: every PR 16 sheet is glass and over a dimmed, blurred level (Find the most), text reads on the glass, the ghost card and the faces sit clear of Play, "Who can change it" reads whole at all three sizes, the lone Pick a game card is centred up and down at phone and computer.
- **Spoken names and tooltips**: the bin, copy and add buttons in `People.svelte` and the faces button carry both an `aria-label` and a `title`; pins carry `title` and a name.
- **Four removed pins** (`offline`, `busy`, `saveFailed`, `blockedOwner`): the flat keys are gone from `words.ts` and nothing in `src` or `tests` uses them any more (grep). Their jobs are said by `words/changes.ts` and `words/team.ts` in reworded form (for example `Things are busy. Wait a minute…`). So removing the pins hides no defect, because there is no word left for them to pin. Note (not blocking): the reworded lines in `changes.ts` have no exact-copy pin of their own.
- Not run: WebKit and Firefox locally; the full run on this merge head is the builder's to watch after the last glass commit. After that, only the last merge needs checking.
