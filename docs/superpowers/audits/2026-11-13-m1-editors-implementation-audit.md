# Implementation audit: the Editors' M1 thin thread

Written 2026-11-14. Stage 5 (Implementation audit) of cycle 1, for the build merged as pull request 4 (`50b2d16`),
read against the [spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
(AutomataFramework `main` at `874f7d5`), the [plan](../plans/2026-11-13-m1-thin-thread-editors.md), the
[plan audit](2026-11-13-m1-editors-plan-audit.md), [`progress.md`](../progress.md), `CLAUDE.md` and the code.

## The answer first

The build is close to the plan and, on the API side, careful: the door, Save, Approve and Share do what the plan and
the plan audit asked, B1 to B7 and most of S1 to S14 are applied, and nothing a visitor or a lower level sends can
write anything it should not.

It has **one blocking defect, and it is the milestone's own action**: after the level is first drawn, the picture
never changes. When a person drags the crate, the crate's invisible button moves and the file is saved correctly,
but the crate on the screen stays where it was. Every test passed because they read the buttons' `data-x`, never
the picture after a move. The CI pictures show it in all three engines.

Then ten should-fix findings (two of them deferred minors I am promoting), ten minors, and a review of the twelve
rulings and five deferred minors the build listed. Nothing here needs the Owner: there are no Owner questions.

**How the findings are applied:** stage 6 (Fixes) applies B1 and S1 to S10, and the minors it can do cheaply; where
this audit and the plan differ, this audit wins. S7 is a spec edit in AutomataFramework, which is the coordinator's
to arrange.

## Method

- Read every file under `src/`, `functions/`, `public/` and `docs/`, and the tests where a finding turned on what they
  check.
- Read the CI pictures of pull request 4 from the `ci-screens` branch (`pr-4/<engine>/`), Chromium first, then
  WebKit and Firefox for the screens B1 is about.
- Checked the spec's Editors section and M1 line, the plan's tasks and the plan audit's findings one by one against
  the code.
- No tests were run (project rule). `main`'s first CI run after the merge (run 39) was still in progress while this
  was written; the stage 4 report says pull request 4 was green in all three engines.

## Blocking

**B1. The level's picture is drawn once and never again.** `src/features/levels/Levels.svelte`:

```ts
$effect(() => {
  picture?.resize(size.w, size.h)
  picture?.show(edit.now, characters, readOnly ? marked : selected, hero)
})
```

`picture` is a plain `let`, not state, and it is still `undefined` when the effect first runs (Pixi starts
asynchronously). An optional call that short-circuits never evaluates its arguments, so on that first run the effect
reads no state at all, Svelte records no dependencies, and the effect never runs again. The only drawing is the one in
`onMount`'s `.then`. So:

- A drag, an arrow button, a key and Undo move the thing's button, and the saved file is right, but the drawn crate
  stays where it was opened. `pr-4/*/ipadUpright-level-unsaved.png` and `...-level-changed-by-someone-else.png`, in
  Chromium, WebKit and Firefox alike: the crate is drawn at 6.5, its blue ring (the button) is at 8.5.
- The selected thing's white ring (plan, Task 14) is never drawn (`...-level-crate-selected.png`).
- When the stage changes size (a notice above it, turning the iPad), the canvas element stretches its first bitmap
  while the buttons are placed with the new fit, so buttons and picture drift apart vertically
  (`...-level-changed-by-someone-else.png`: the ring hangs into the floor).

The person sees nothing happen when they drag, which fails the drunk-grandma test at the one thing M1 must show, and
the Owner's iPad check (Task 21) would fail at its second step.

*Why CI was green:* `level-canvas.browser.test.ts` only draws once per test; `levels.browser.test.ts` and the
journeys read `data-x` and `data-y`; Task 20 measures boxes, not pixels.

*Fix:* read the state before the call (or make `picture` `$state.raw`, set when Pixi is ready):

```ts
$effect(() => {
  const { w, h } = size
  const now = edit.now
  const ringed = readOnly ? marked : selected
  picture?.resize(w, h)
  picture?.show(now, characters, ringed, hero)
})
```

*Tests that would have caught it, added in the same fix:* in `levels.browser.test.ts`, after a drag two tiles right,
the canvas pixel at the crate's new centre is the crate's colour and the old centre is sky (read as
`level-canvas.browser.test.ts` reads pixels); the same after resizing the box to 1180 by 820; and a selected thing
has white at its edge. In `move-the-crate.journey.test.ts`, one pixel check at the new place after the drag, so the
milestone's journey proves what the person sees.

## Should fix

**S1. "No checks yet" is timed from the pull, not from the commit being approved.** `approve.ts` step 5 lets a change
with `none` through once `deps.now() - change.createdAt` is past two minutes. `createdAt` is when the pull was opened.
A Suggest-level person who saves a second time on a pull opened an hour ago puts a new head commit there whose checks
have not been queued yet: it reads `none`, the pull is old, and it can be approved before any check has run on it
(Review Focus 3). *Fix:* time the grace from the head commit (its committer date, `GET /repos/{o}/{n}/commits/{sha}`,
one more call only when the checks say `none`), and add the test: an old pull, a new commit, `none`, approve is
`not-ready`; three minutes later it goes in. The pretend GitHub needs a commit's date for it.

**S2. A blip while renewing the sign-in signs the person out.** `session.ts` `renewNow` forgets the tokens whenever
`swapTokens` gives `undefined`, and `swapTokens` gives `undefined` for every failure: GitHub refusing the refresh, and
also the API answering `busy` or the internet dropping. The plan wanted a blip never to throw a person out (`whoIs`
does this right on the API side). A person whose sign-in runs out while the train goes through a tunnel is sent to
Welcome and has to go through GitHub again. Their draft survives, so nothing is lost, but the screen is wrong.
*Fix:* `swapTokens` tells "refused" (`signed-out`) from "could not ask" (`busy`, `offline`); only a refusal forgets;
anything else keeps the tokens and the call answers `offline` or `busy`. Tests in `session.test.ts` and
`api.test.ts`.

**S3. The first-run strip speaks on screens it does not fit** (deferred minor 1, promoted, and wider than listed).
`App.svelte` counts every route but `games` as "in a game", so a game that can't be opened, a broken game, "not an
Automata game", "can't reach the game", the waiting list, one waiting change and Share all show "Step n of m · Pick a
level to change." `pr-4/chromium/ipadUpright-visitor-cant-open.png` reads "Step 1 of 3, pick a level to change" over
"We can't find that game"; `ipadUpright-waiting-change-as-approver.png` and `ipadUpright-share-three-people.png` say
"Pick a level to change" over an Approve button and a sharing list. The plan's Task 19 line is "told to ask the
owner, with no strip". Onboarding comes first, and a strip that contradicts the screen is worse than none. *Fix:*
the screens tell `App` whether the game opened (as `LevelScreen` already reports `onfacts`); the strip shows only on
Welcome, the list, a game that opened and its levels; the waiting screens and Share show no step (or a sentence of
their own, without a count). The journey line "someone sent a link they may not open" checks the strip is hidden.

**S4. Two Back buttons on one waiting change** (deferred minor 4, promoted). The screen's own Back and the read-only
editor's header Back sit one above the other and do the same thing (`ipadUpright-waiting-change-as-approver.png`).
A grandma asks which one. *Fix:* in `readOnly`, `Levels` shows no header at all (the screen above has the title and
the way back); `WaitingChange` stops passing `back` and `title`, or `Levels` makes them optional. The screens check
gains "at most one button named Back".

**S5. A change that is no longer waiting says the game can't be found.** If someone else approved or turned down the
change while it was open, or the person follows an old link, `/api/change` is `not-found` and `WaitingChange.svelte`
shows `cantFindGame` ("We can't find that game, or it hasn't been shared with you. Ask its owner.") with a primary
"Try again" that can only fail again. The game is fine; the change is gone. The same screen also shows `cantReach`
when the game failed to open for any other reason (broken, not a game). *Fix:* new words, for example `changeGone`
"This change isn't waiting any more. Someone may have approved it or turned it down.", with a primary Back to the
game's page; other problems follow `GameHome`'s rules. One journey: grandpa opens the change, grandma approves it in
another browser, grandpa presses Approve and is told it is gone.

**S6. `docs/teams.md` misses four things a team's Owner needs.**
- The branch rule is still written as optional ("You can ask GitHub itself..."); plan audit S12 asked for it as a
  setup step, saying what happens without it. Apply S12.
- Organisations: the Owner's answer to plan-audit Q1 (the repo's GitHub admins count as Owners) is in the code
  (`enter.ts`, `repo.isAdmin`) and documented nowhere. Say it.
- Own changes: Edit and Owner may approve their own waiting change (Q2); Approve may not. Say it in the table.
- Checks: the editor reads check runs (GitHub Actions makes them), not the older commit statuses (plan audit N3). Say
  that a game whose checks are commit statuses counts as having none, and is approvable two minutes after the save.

**S7. The spec still says "nobody approves their own".** AutomataFramework's spec, "Saving", has "turns it down;
nobody approves their own". The Owner's answer to plan-audit Q2 (2026-11-13) is that Edit and Owner may, and the code
does that. The spec needs "nobody below Edit approves their own". This edit is in AutomataFramework, so it is the
coordinator's to arrange; it is reported here, not made.

**S8. Two first-run journeys were narrowed without saying so.** The plan's Task 19 has "no screen a visitor can reach
has a button that does nothing or a dead end: each has a way on and a way back", which is not in
`first-run.journey.test.ts`; and "at every step there is exactly one primary button, at least 48 px tall, and the
strip is on screen without scrolling" became "at the first screens there is at most one primary button". Neither
change is in the tracker's rulings. Both checks guard onboarding, which the Owner put first. *Fix:* restore both as the
plan wrote them (S3's fix makes the dead-end check meaningful), or list each as a ruling with its reason.

**S9. "Someone made a change for you to look at" counts your own change.** `GameHome.svelte` shows `tipApprove` when
the person may approve and `waiting > 0`. An Approve-level person whose only waiting change is their own is told
someone made a change for them. *Fix:* show it when `waiting` minus their own (`mine` is there) is above zero. One
journey line.

**S10. The list of games, when it cannot be fetched, says to add the editor.** `PickGame.svelte` shows `cantReach`,
and then, with nothing remembered on the device, the no-games screen: "You don't have a game here yet" and a primary
"Add the editor to a game of mine". A person offline is sent to GitHub to set up a game they already have, and there
is no Try again. *Fix:* on a failed list, show `cantReach` with a primary `tryAgain`, and the remembered games if
there are any, never the no-games screen.

## Minor

**M1. Approve assumes the game allows merge commits.** `mergePull` sends `merge_method: 'merge'`. A repo that allows
only squash or rebase answers 405 with `mergeable: true`, which the code reads as `blocked`, and the person is told
GitHub stops the editor and the Owner must "let Automata Editors past that rule", which is not the cause. A 405 while
GitHub is still working out `mergeable` (`null`) is read the same way. *Fix (small):* `docs/teams.md` says merge
commits must be allowed; and `null` is read once more after a moment, or answered `busy`. Choosing a merge method
from the repo's settings is M3's.

**M2. A visitor who can't open a game sees two "Sign in with GitHub" buttons**, the bar's plain one and the screen's
primary one, a few centimetres apart (`ipadUpright-visitor-cant-open.png`). Hide the bar's on that screen, as Welcome
does.

**M3. A game has two names on screen.** The game's page is titled with its project name ("Crate Game"); its loading
and problem screens, the level screen's loading, and Share ("Share grandma/crate-game") use `owner/name`. Use the
project name once it is known, `owner/name` only before.

**M4. `Choice` names its radio group with `Math.random`** (deferred minor 2). Harmless, as the build said; Svelte's
`$props.id()` gives a stable one for free. Do it with the restyle.

**M5. Share is a row on the game's page, not a plain Button in its top bar** (plan, Task 17). It works, it is large,
and the screens check passes; record it as a ruling rather than change it.

**M6. A waiting change that moves nothing in a level says nothing about itself.** When `shown` is undefined (the
change touches a listed file that is not a level, or removes the level), `WaitingChange` shows no picture and no
line. M1 only saves levels, so only an agent's or a hand-made `automata/` branch gets here. Show `changeOther` in
that case.

**M7. The first run's "done" lasts only until a reload.** `savedHow` lives in the page; until the person presses
"Hide these tips", a reload after their first save puts the strip back at "Step 2 of 4". Keep "saved once" with the
guide's own key (the plan allows the first-run tips on the device).

**M8. `CLAUDE.md`'s list of what the device may keep is narrower than the code and the plan.** It says "but an unsaved
draft and the first-run tips". The device also keeps the sign-in (`af.tokens`), the games this device opened
(`af.recent`, plan Task 12) and the "has saved before" mark (`af.saved`). None is hidden state an agent needs. Widen
the sentence to name them, so a later audit does not call them defects.

**M9. The product's name on screen.** Welcome's title is "Automata Editors"; the spec now names the product
"Automata Framework" with the wordmark "automata" (2026-11-14). Not a defect of this build (it predates the decision);
the restyle should settle what the editors call themselves, and `docs/deploy.md`'s App name ("Automata Editors", which
`blockedOwner` and `teams.md` also name) with it.

**M10. The screens check could not see B1.** Task 20 measures boxes and overlaps and takes pictures nobody compares.
Keep it that way (the plan says so), but the B1 tests above are the pixel check it lacked; the Task 20 reading of the
pictures (one line per screen in the pull request) passed screens where the crate and its ring are apart.

## The build's rulings

| Ruling | Verdict |
|---|---|
| The offline journey takes the browser offline, not the pretend GitHub down | Agreed: it tests what a person meets. A GitHub outage is `busy`, tested in the API's own tests. |
| A cancelled or failed sign-in returns the person to the screen they were on | Agreed: a visitor's level stays on screen, which is the point of the draft. |
| After Approve or Turn it down, a good Notice with Back, instead of going straight to the game | Agreed: the person reads the result. |
| The framework pin moved to `9109fa3` on the build's branch | Agreed: there was no `package.json` on `main` to move it in. Later moves are their own pull request. |
| `Levels` takes `oncopytext` and `oncopyfile` | Agreed: plan-audit B2's two buttons. |
| Focus on a thing's button selects it | Agreed: it is how the keyboard reaches the arrows. |
| `VITE_DEMO_GAME`, and a second build in `dist-plain/` | Agreed: plan-audit B1. |
| Journeys of people who are not Owners open the game by its address | Agreed: that is how a shared person arrives. |
| A read-only level has an `h2` | Agreed, and S4 removes that header entirely. |
| The screens check leaves the stage's things and radio buttons out of the 44 px and overlap rules | Agreed: a thing has its own 48 px floor; the radio rows are 48 px tall. |
| A drag counts from the stage's position at the finger's first touch | Agreed; it is right once B1 makes the picture follow too. |
| CI stops the journeys after 15 failures and a browser job after 30 minutes | Agreed. |
| The Firefox clipboard journey takes either "Copied" or the selected box | Agreed: both are honest outcomes the screen explains. |

## The build's deferred minors

| Deferred | Verdict |
|---|---|
| The "can't be opened" screen shows the first-run strip | Promoted to S3, which is wider: seven screens. |
| `Choice` uses `Math.random` | Minor M4. |
| Hiding the first-run strip is kept on the device only | Not a defect: `CLAUDE.md` allows the first-run tips on the device. M8 tidies the wording. |
| Two Back buttons on the waiting-change screen | Promoted to S4. |
| The pictures are of the window, not the whole scrolling area | Accepted for M1: the screens check measures every element, scrolled or not. The restyle can take full-page pictures. |

## Against the spec and the plan

| Spec, M1 Editors line | Built | Verdict |
|---|---|---|
| The suite shell | Tasks 1, 2, 11, 12 | Done |
| Using it without signing in, keeping a copy | Demo game only (`DEMO_GAME`), look only, nothing written; copy as text and as a file, byte for byte `writeContent` | Done |
| GitHub sign-in and save | GitHub App sign-in through the Function; Save direct or as a suggestion by level; never over someone else's change | Done, after S2 |
| The five levels and the Share screen | `automata.access.toml`, read afresh on every call; organisation admins as Owners | Done; S6 documents it |
| Approving in the editor | Checks, whole-game load, exact head commit, own changes by level | Done, after S1 and S5 |
| The first run | A strip and two tips for visitors, Owners and people sent a link | Done, after S3, S8, S9 |
| The Levels editor moving the crate, at iPad size | The file is right; the picture is not | **Not done until B1** |
| End-to-end tests | 208 journeys per engine, three engines | Done; B1 adds the pixel check |
| Done means (Owner's iPad check) | Task 21's list | Waits on the accounts, and on B1 |

The rules that hold, checked in the code: the page calls only `/api` (`connect-src 'self'`, the request log in every
journey); the API writes only a listed level (Save refuses every other path, including `..`) and the sharing file (an
Owner only); Approve refuses a change touching anything else; the bytes are `writeContent`'s and `writeAccess`'s; the
level comes from the default branch, never the request; a visitor reaches only the demo game, at look, and writes
nothing; the installation token is scoped to the one repo and four permissions; the App is the committer; Save and
Approve load the whole game first; no answer carries a token, the secret or the key; every word is in `words.ts`, with
no banned word; one `h1` a screen.

## For stage 6

Apply B1 first (it changes what the person sees on every level screen, and the pictures after it are the ones worth
reading), then S1 to S10, then the minors that are one line each (M2, M3, M6, M7, M8). M1's doc line goes with S6.
M4, M5 and M9 can wait for the restyle. After the fixes, read the level pictures from `ci-screens` again: the crate
must be drawn inside its ring.
