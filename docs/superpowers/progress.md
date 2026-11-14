# Progress

The tracker every stage reads first and updates last. One section per cycle; newest first.

## Cycle 1: the 2D first layer, the Editors' share of M1

Spec: [`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo (milestone M1, the Editors line).

Overall: **58%** (stage 1 is the shared spec and counts 4 points, stage 2 is 4, stage 3 is 4, stage 4 is 60, stage 5
is 10, stage 6 is 12, stage 7 is 6)

| Stage | State | Output |
|---|---|---|
| 1. Spec | Done (in AutomataFramework, PR 1) | the spec above |
| 2. Plan | Done | [`plans/2026-11-13-m1-thin-thread-editors.md`](plans/2026-11-13-m1-thin-thread-editors.md) |
| 3. Plan audit | Done, in review | [`audits/2026-11-13-m1-editors-plan-audit.md`](audits/2026-11-13-m1-editors-plan-audit.md) |
| 4. Execution | In progress: all 21 tasks written and pushed; journeys not yet green (see the handoff) | the plan, ticked as it goes |
| 5. Implementation audit | Not started | `audits/2026-11-13-m1-editors-implementation-audit.md` |
| 6. Fixes | Not started | |
| 7. Owner review | Not started | |

### Handoff at 90 minutes (2026-11-14 00:30Z), stage 4 execution

Branch `claude/project-thread-wezbcp`, pull request 4 (draft). A fresh session finishes from here.

**Green in CI:** `check` (format, lint, svelte-check, knip, build, every Node test) and the component tests in all
three engines (Chromium 38 tests). Tasks 1 to 14 were green when they landed.

**Written and pushed, never yet green: the journeys.** Tasks 15 to 19 (Save with drafts, waiting changes, Share,
Try it now and copies, the first run) and their journeys are in. The first full journey run (3a30f53) failed 80
tests in Chromium for one common reason, and the WebKit and Firefox runs for the same commit had not finished when
this was written. Read that run first:

1. `refused: script-src: eval` on nearly every journey. Cause found late: the editors' own copy of zod, in
   `src/features/access/file.ts`, tries `new Function` when its schemas are made, and the page's policy refuses it.
   The fix, `z.config({ jitless: true })` before the schemas, is in the commit that carries this handoff. The framework's
   own copy is fixed by the pin move to 9109fa3 (done; the import-order workaround was removed).
2. Drags did not register (Save stayed off). Probable cause: the page had no definite height, so the editor's stage
   was empty. 3a30f53 makes the page fill the window (`#app`, `.page`, `.content` in App.svelte; `.editor` and
   `.level` use `flex: 1`). Not yet confirmed by a green run.
3. After those two, expect smaller failures in journeys no run has reached (approve, share, visitor, first-run,
   save-problems). Fix them one kind at a time, one commit per kind, reading the log with
   `gh api repos/mcthaydt/AutomataFrameworkEditors/actions/jobs/<id>/logs`.

**Still to do:**
- Task 20: `tests/journeys/screens.journey.test.ts` (every screen at the three sizes, measured and pictured) is not
  written. `tests/features/suite/words-used.test.ts` is written and unrun. Read the pictures from the `ci-screens`
  branch and write a line per screen in the pull request.
- Task 21: `docs/deploy.md`, `docs/teams.md`, `tests/docs/docs.test.ts` and the README are written and unrun. Still to do:
  tick the plan's boxes, set this tracker to 100%, mark the pull request ready (add the assignee and reviewer),
  and send the summary with "Rulings I made" and "Deferred minors".
- The final whole-branch review (plan's executing step): one read of the full diff against the spec and the audit's
  findings B1 to B7 and S1 to S14, with fixes.

**Rulings I made (so far):**
- Offline journey: the browser goes offline, instead of the pretend GitHub being down, because the API answers a down
  GitHub with a generic failure, not "offline". Cost if wrong: none for users; the test is a little less literal.
- A cancelled or failed sign-in returns the person to the screen they were on (a level stays on screen), instead of
  the list. Cost if wrong: a visitor lands on a level they did not open; low.
- After Approve or Turn it down the screen shows its good Notice with a Back button to the game's page, instead of
  going straight there, so the person reads the result. Cost if wrong: one extra press.
- The framework pin moved to 9109fa3 on this branch, not in its own pull request, because the repo's `main` has no
  `package.json` yet. Cost if wrong: none.
- `Levels` takes `oncopytext` and `oncopyfile` as optional props (the plan's single `oncopy`), for audit item B2's
  two buttons.
- The thing's button selects it on keyboard focus, so a keyboard-only person gets the arrow buttons.
- `VITE_DEMO_GAME` replaces `VITE_SAMPLE_GAME` (audit S-note); a second build, `dist-plain/`, serves the "no example
  game" journeys (a CI step `build:journeys-plain`).

**Deferred minors:**
- The "game can't be opened" screen still shows the first-run strip (the plan says none).
- `Choice` radio groups get their group name from `Math.random`; harmless but not deterministic.
- A hide of the first-run strip is stored on the device only.

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
