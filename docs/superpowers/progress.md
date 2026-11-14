# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first.

## Cycle 1: the 2D first layer, the Editors' share of M1

Spec: [`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo (milestone M1, the Editors line).

Overall: **72%** (stage 1 is the shared spec and counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5
is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework, PR 1) | the spec above |
| 2. Plan | Done | [`plans/2026-11-13-m1-thin-thread-editors.md`](plans/2026-11-13-m1-thin-thread-editors.md) |
| 3. Plan audit | Done, in review | [`audits/2026-11-13-m1-editors-plan-audit.md`](audits/2026-11-13-m1-editors-plan-audit.md) |
| 4. Execution | Done: all 21 tasks, journeys green in three engines (pull request 4) | the plan, ticked |
| 5. Implementation audit | Not started | `audits/2026-11-13-m1-editors-implementation-audit.md` |
| 6. Fixes | Not started | |
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

### Waiting on the Owner

Two questions from the plan audit: Q1 (who is the Owner of a game an organisation owns) and Q2 (may an Edit or
Owner level approve their own waiting change). The steps they touch wait for the answers. The accounts the real
iPad check needs (Cloudflare, the GitHub App) are in the plan's "Before starting".

### Log

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
