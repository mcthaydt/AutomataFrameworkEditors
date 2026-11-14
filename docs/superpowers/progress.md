# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first.

## Cycle 2: the editors wear Blueprint

Spec: the "Visual direction" section of
[`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo, and Cycle 1's implementation audit for the three minors it left (M4, M5, M9).

Overall: **12%** (stage 1 is the shared spec and counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5
is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework) | the section above |
| 2. Plan | Done (pull request 10) | [`plans/2026-11-14-editors-restyle.md`](plans/2026-11-14-editors-restyle.md) |
| 3. Plan audit | Done, in review: four blocking findings, all written into the plan; one question for the Owner | [`audits/2026-11-14-editors-restyle-plan-audit.md`](audits/2026-11-14-editors-restyle-plan-audit.md) |
| 4. Execution | Not started | |
| 5. Implementation audit | Not started | |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

### Stage 3 finished (2026-11-14)

The plan audit read the plan against the spec's "Visual direction", the code on `main` and the four packages. The
plan is sound; every colour figure and file name in it was checked and holds. Nothing was run but a script that
recomputes the contrast figures.

**Four blocking findings, all fixed in the plan:** two words were used a task before they existed, which the words
test would have failed (B1); the screen's sentences would have lain over the level for good, on a phone over half of
a visitor's first level (B2); the tile grid could not be seen on the demo game's sky, at 1.07 to 1 (B3); pressing a
note did nothing a finger could see (B4). Eleven should-fix findings are in the plan too (the level could still move
under a finger when a stamp left; a waiting change lost its ring for two tasks; three tests could pass without
proving anything; and others), and eleven notes.

**Rulings the audit made** (each with its cost in the audit): the standing sentence sits in the top panel and only
what just happened floats, with "Got it" on a notice that asks nothing; the grid is a pair of strokes; a pressed note
marks the card's arrows; the stamp lies over the clear cell's corner.

**Waiting on the Owner, Q1:** should Share be on the level screen? The spec lists it among what floats over the
canvas; the plan keeps it on the game's page. Not defaulted. Tasks 1 to 6 do not depend on it; Task 7 waits.

### Stage 2 finished (2026-11-14)

The plan has nine tasks: the six colours and three fonts; icons and the shared pieces (with M4); redo and a canvas
that draws only the art; the level filling the screen with floating tools; the drawing notes; the stamps; the list
screens (with M5, kept as a ruling); the name (M9); the docs and a reading of every picture. Every task has
end-to-end journeys at iPad upright, iPad sideways and phone size in three engines.

**The Owner answered the one question (M9):** the editors are "Automata Framework editors" on screen, and the GitHub
App is "Automata Framework Editors". Whether the App already exists under another name is not known; the plan keeps
its name in one constant.

**Measured in a throwaway copy, never committed, no test run:** the four packages install and build; Vite inlines
three small font files as `data:` addresses unless `build.assetsInlineLimit` is `0`, which the header would refuse;
knip does not see the three font packages; every icon the plan names exists.

**Rulings made, for the plan audit to challenge** (the plan lists each with its cost): Share stays a row on the
game's page; the bar with the wordmark and Sign in stays above a level; the first-run strip stays above a level; Redo
is added; a waiting save is stamped "Saved by" too; the notes' switch is one tool that steps through three states;
the floating panels' tracks are fixed sizes.

**Not in the plan, and why:** the find bar and Play (neither exists until M3, so "Hide notes" there and "Play hides
the notes" wait for them); an editor switcher (one editor in M1); a light theme; the Korean, Japanese and Chinese
fonts (they join with the first translation).

## Cycle 1: the 2D first layer, the Editors' share of M1

Spec: [`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo (milestone M1, the Editors line).

Overall: **94%** (stage 1 is the shared spec and counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5
is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework, PR 1) | the spec above |
| 2. Plan | Done | [`plans/2026-11-13-m1-thin-thread-editors.md`](plans/2026-11-13-m1-thin-thread-editors.md) |
| 3. Plan audit | Done, in review | [`audits/2026-11-13-m1-editors-plan-audit.md`](audits/2026-11-13-m1-editors-plan-audit.md) |
| 4. Execution | Done: all 21 tasks, journeys green in three engines (pull request 4) | the plan, ticked |
| 5. Implementation audit | Done, in review: one blocking finding (the level's picture never redraws) | [`audits/2026-11-13-m1-editors-implementation-audit.md`](audits/2026-11-13-m1-editors-implementation-audit.md) |
| 6. Fixes | Done, in CI: B1, S1 to S10 and every minor the audit asked for (pull request 9) | the audit's "For stage 6", ticked below |
| 7. Owner review | Not started | |

### Stage 4 finished (2026-11-14)

Branch `claude/project-thread-wezbcp`, pull request 4. All 21 tasks are written and the plan's boxes are ticked.
The journeys (208 per engine) are green in Chromium and Firefox; the last WebKit failure was one Share-screen race,
fixed by waiting for the page to settle before a test reloads it. The new `commit-authors` check passes, and every
commit on the branch is McThayDT's. Task 20 (`tests/journeys/screens.journey.test.ts`) measures and pictures about 40
screens at three sizes, and CI copies the pictures to the `ci-screens` branch under `pr-4/<engine>/`.

The screens check found three real defects, all fixed: on a phone the stage shrank to a strip beside its tools; the
waiting-change screen had two top headings; the sign-up link on Welcome was under 44 px tall.

**Rulings I made:**
- Offline journey: the browser goes offline, instead of the pretend GitHub being down, because the API answers a down
  GitHub with a generic failure, not "offline". Cost if wrong: none for users; the test is a little less literal.
- A cancelled or failed sign-in returns the person to the screen they were on (a level stays on screen), instead of
  the list. Cost if wrong: a visitor lands on a level they did not open; low.
- After Approve or Turn it down the screen shows its good Notice with a Back button to the game's page, instead of
  going straight there, so the person reads the result. Cost if wrong: one extra press.
- The framework pin moved to 9109fa3 on this branch, not in its own pull request, because the repo's `main` had no
  `package.json` yet. Cost if wrong: none.
- `Levels` takes `oncopytext` and `oncopyfile` as optional props (the plan's single `oncopy`), for audit item B2's
  two buttons.
- The thing's button selects it on keyboard focus, so a keyboard-only person gets the arrow buttons.
- `VITE_DEMO_GAME` replaces `VITE_SAMPLE_GAME`; a second build, `dist-plain/`, serves the "no example game" journeys.
- Journeys of people who are not Owners open the game by its address, not from the list, because the list shows only
  games a person has opened or owns. Cost if wrong: none.
- A level shown read-only (a waiting change) has an `h2`, so a screen has one `h1`. Cost if wrong: none.
- The screens check leaves the things on the stage and the radio buttons out of the 44 px and overlap rules: a thing
  has its own 48 px floor and the arrow buttons. Cost if wrong: a very small thing could slip through.
- A drag counts from the stage's position when the finger went down, so a line above wrapping mid-drag cannot move it.
- CI stops the journeys after 15 failures and a browser job after 30 minutes, so one bad cause cannot hold the runners.
- The Firefox clipboard journey accepts either "copied" or the selected box (Firefox allows the write).

**Deferred minors:**
- The "game can't be opened" screen still shows the first-run strip (the plan says none).
- `Choice` radio groups get their group name from `Math.random`; harmless but not deterministic.
- The hide of the first-run strip is stored on the device only.
- The waiting-change screen has two Back buttons (the screen's and the level header's).
- The screens' pictures are of the window, not the whole scrolling area.

### Stage 6 finished (2026-11-14)

Branch `claude/project-thread-fyyxqk`, one pull request, with a small one in AutomataFramework for S7. Nothing was run
locally (project rule); CI is the check, and the level pictures on `ci-screens` are the thing to read afterwards: the
crate must be drawn inside its ring.

| Finding | What was done |
|---|---|
| B1 | `Levels.svelte`'s effect reads its state before the optional calls, so the picture redraws after every move, selection and resize. The canvas keeps its drawing buffer so a test can read it. Pixel checks in `levels.browser.test.ts` (after a drag, after arrows and Undo, after turning the box, the white ring) and in the move-the-crate journey (crate at the new place, sky where it was, in every engine). |
| S1 | `Repo.commitTime` (one call, only when checks say `none`); the two minutes run from the newest of the head commit and the pull. The pretend GitHub stamps each commit. Test: an old pull with a new commit is `not-ready`, with that commit three minutes old it goes in. |
| S2 | `swapTokens` answers the tokens or the problem; `renew()` says `renewed`, `refused`, `busy` or `offline`. Only `refused` forgets the sign-in; the call then answers `busy` or `offline`. Tests in `session`, `api`, and a journey (GitHub cannot be asked, then Try again). |
| S3 | The strip shows only on Welcome, the list, and a game or level that opened (or is still opening). Waiting changes, one change and Share carry no strip. `GameHome` and `LevelScreen` tell `App` whether the game opened. |
| S4 | A level shown read only has no header at all; the screens check fails a screen with two buttons named Back. |
| S5 | New words `changeGone`; a gone change (opening it or pressing Approve) says so with one Back to the game's page. A game that could not be opened follows `GameHome`'s words. |
| S6, M1, M8 | `docs/teams.md`: the branch rule as a setup step with merge commits on, organisations, own changes by level, check runs. `mergeable: null` is looked at once more (1.2 s), then `busy`. `CLAUDE.md` names everything the device may keep. A docs test reads each. |
| S7 | AutomataFramework pull request 27. |
| S8 | Both first-run checks restored (see rulings). |
| S9 | The approve tip counts waiting changes that are not yours. |
| S10 | A list that cannot be fetched says so with a primary Try again, never "add the editor". The guide hears nothing from it until it knows. |
| M2, M3, M6, M7 | One Sign in on a game a visitor cannot open; Share and the level's loading screen use the game's own name once known; a change with no level in it says `changeOther`; "saved once, and how" lives in `af.saved`, so a reload still says "You did it". |
| M4, M5, M9 | Left for the restyle, as the audit says. |
| M10 | The B1 pixel checks are the pixel check the screens check lacked. |

**Rulings I made:**
- The canvas keeps its drawing buffer (`preserveDrawingBuffer`), so a test or a screenshot can read what was drawn. Cost if wrong: a little memory on a small canvas.
- "At every step exactly one primary button, 48 px, strip on screen" is restored as: at most one primary at every step, exactly one where the next thing to press is a button (Welcome, Add the editor, Save), and the strip on screen without scrolling at every step. At the list and the game's page the next thing is a row to touch, so there is no primary button. Cost if wrong: none for users.
- `af.saved` now keeps `direct` or `suggestion` (an old `1` reads as direct), so the strip's last line is right after a reload. A returning person who saved once sees "You did it" on every screen until they hide the tips. Cost if wrong: the tips say "done" a little early.
- The Share screen and the level's loading screen use the game's own name only after it is known (Share opens the game itself; the level's loading screen uses what the game's page already learned).

### Waiting on the Owner

Nothing is waiting. The plan audit's Q1 and Q2 were answered: organisation admins count as Owners, and Edit and Owner
levels can approve their own changes. The visual direction (Blueprint, in the private notes) is not applied here yet;
no screen is restyled until the Owner says so. The accounts the real iPad check needs (Cloudflare, the GitHub App)
are in the plan's "Before starting".

### Log

- 2026-11-14: Cycle 2, Stage 3. The plan audit of the restyle plan: four blocking findings, eleven should-fix and
  eleven notes, all written into the plan; one question for the Owner (Share on the level screen). No tests run.
- 2026-11-14: Cycle 2, Stage 2. The restyle plan written: nine tasks, the Owner's answer on the name, the audit's M4,
  M5 and M9 placed. Nothing run but an install and a build in a throwaway copy.
- 2026-11-14: Stage 6. B1, S1 to S10 and the cheap minors applied, with the tests the audit asked for; S7 is AutomataFramework pull request 27. Nothing run locally.
- 2026-11-14: Stage 5. The implementation audit of pull request 4: one blocking finding, B1, the level's picture
  is drawn once and never again (the effect that redraws it records no dependencies), so a dragged crate's button moves
  but the crate on screen does not, in all three engines; the tests read only the buttons. Ten should-fix (checks timed
  from the pull, not the commit; a blip while renewing signs the person out; the first-run strip on seven screens it
  does not fit; two Back buttons; a gone change called a missing game; four gaps in `docs/teams.md`; the spec's "nobody
  approves their own"; two first-run journeys narrowed; the approve tip counting your own change; the games list
  offline), ten minors, and the build's rulings and deferred minors reviewed. No Owner questions. No tests run.
- 2026-11-13: Stage 3. The plan audit: not ready as written. Seven blocking findings: two from the Owner's answers
  the same day (visitors open only the demo game; "Keep a copy" gives the level's JSON to paste back, on the
  clipboard as well as a file), and five that would stop a task or fail on the real GitHub (the rule tests' double
  violation, the door refusing same-origin GETs, `userExists` with the App's JWT, journeys that cannot reach a
  pretend GitHub started in global setup, and the merge answers 405 and 409). Fourteen should-fix, twelve notes, two
  Owner questions. GitHub's calls were checked against GitHub's own API description, read from
  raw.githubusercontent.com; the Function bundle was measured at 181 KB (Vite) and 495 KB (esbuild), with no Rapier
  or Pixi. Execution applies the findings.
- 2026-11-13: Stage 2, added to after the first plan merged. The Owner: agents working on the code are the primary
  way a game is made, and the editors change authorable content only (the JSON files); anyone can use the editor
  freely without signing in and keep a copy, and saving or working with others needs a sign-in. The plan is now 21
  tasks: the API lets a visitor read a public game, the page asks for sign-in only when it is needed, and a new
  Task 18 adds "Try it now", "Keep a copy" and the visitor's journeys. The plan audit reads this version.
- 2026-11-13: Stage 2. The Editors' M1 plan written: 20 tasks. The Owner's decisions the same day widened M1 for this
  repo: the editors are for teams; every access level (Look, Suggest, Approve, Edit, Owner) with a Share screen;
  the editor's own GitHub App does the GitHub work through an API on Cloudflare Pages Functions, so people need
  GitHub only to sign in; levels live in `automata.access.toml` in the game's repo; onboarding is its own task.
  This pull request also adds `CLAUDE.md` and this tracker. The framework is pinned to `ec4fddd` (the commit that
  added its `prepare` script). Nothing is published to npm in M1. Not checked: the GitHub calls are written from
  memory, because the planning session's network refused GitHub's documentation; the plan audit should check them.
