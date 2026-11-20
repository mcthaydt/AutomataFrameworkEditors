# World slice handoff, for a new project

Written 2026-11-20 15:40 UTC (from `date`) by the World slice lead. The Owner stopped the slice here on 2026-11-20
15:37 UTC ("yes" to: stop now, pause the fix pull request, merge the documents with both reviews and the handoff,
close everything else) and will start a new project with an updated workflow. This file is all a fresh project needs
to carry on. Where it and a repo's `CLAUDE.md`, skills or `progress.md` differ, those win.

## In one paragraph

The World editor is built: all 19 pull requests of its plan are merged and the editor works. The slice is **not
closed**. Its end-of-slice steps stopped after the first design review round: 37 faults in how the screens look and
read are written down and not fixed. Nothing is half merged. One branch holds the unfinished start of the fixes.

## Where each repo is

| Repo | `main` | State of `main`'s checks | Notes |
|---|---|---|---|
| AutomataFramework | `2cbd6d0` (#222, `Game.levelAt`) | green (run 44713873579) | `NPM_TOKEN` is not set; needed only for an npm release |
| AutomataFrameworkEditors | see `git log` (this file's pull request is the newest merge) | see "Checks on Editors main" below | framework pin `2cbd6d0` |
| AutomataFrameworkExamples | `0d65e4e` (#82, docs) | green (run 44758842286) | framework pin `3ab6e72` |
| AutomataFrameworkSite | `b04483b` (#64, docs) | deploy green (run 44760075525); see "Checks" below for `ci` | live at https://automataframework.pages.dev, with the World demo |
| AutomataPrivate | `d59b20f` (#20) | no CI (docs only) | holds copies of the World plan, spec and plan audit: `docs/superpowers/handoffs/2026-11-17-restart/project-files/handoff/source/editors/` |

The plan, its spec and its plan audit are also readable in Editors at commit `8109888`:
`docs/superpowers/plans/2026-11-16-world-editor.md`, `docs/superpowers/specs/2026-11-16-world-editor-design.md`,
`docs/superpowers/audits/2026-11-16-world-editor-plan-audit.md`.

## What is done

- Plan pull requests 1 to 19, all merged (the table and the dated notes in `docs/superpowers/progress.md`; the last
  is #128, merge `fa3a853`, with the documents in #132).
- The glass look everywhere, icons over words, blur and dimming by layer (the Owner's, 2026-11-17).
- The website demo uses World (Site #63, Examples #81).
- The slice end, step by step:
  1. End-to-end walk of `8dccec5`: done, `docs/superpowers/audits/2026-11-20-world-e2e-walk.md`. Its reds R1 to R6
     are fixed (#128 and the check sheet). Its notes N3 to N6 and N10 are open (below).
  2. Design review round 1 at `fa3a853`: done. 416 pictures, 37 reds (34 distinct), 30 notes. Audits
     `docs/superpowers/audits/2026-11-20-slice-3-design-review-round-1-a.md` (A1 to A20, working in a level and
     playing it) and `-b.md` (R1 to R17, opening a game, the team, checking changes).

## What is left to close the slice, in order

1. **Fix round 1's reds.** One pull request, by whoever knows the screens. The unfinished start is on a branch: see
   "The paused fix work". Planned groups: (1) a screens rule "no floating card lies on another card or on the thing it
   is about", then A1 A3 A5 A9 A13 R2 R3 A19; (2) the top bar A2/R1, R4; (3) sheets at phone sideways A6 A7 R6 R11;
   (4) words and icons A11 A16 R15 R16 R17 R13 A10/R14 A12 A15 A18, and A20's size only; (5) menus and sheets A4/R12
   R9 R10 A8 A14 R7 R8 R5 A17. The builder's estimate for all of it was 9 to 12 hours plus CI. Behaviour reds get a
   journey that fails first: R5, R8, R4, R17.
   - Calls already made (agent-selected, easy to change): A20 is not a fault in its words (a real iPad already reads
     "only on this iPad"; the picture came from a desktop browser at iPad size; see `device/size.ts` and
     `words/bar.ts`); R7 follows `sketch-check-sheet.md`; A11 gets one new icon for Add and skip-back on the play bar.
   - Same fault, two ids: A2 = R1, A4 = R12, A10 = R14.
2. **Design review round 2** on the fixed screens (a fresh reviewer; the lane 2 code read where the paths call for it).
3. **Blind judge**, once, after the reviews.
4. **The screens page for the Owner's first look**: every screen by flow, at each size, with the commit. To say on
   it: dialogs measure as good as solid (6 to 10 percent shows through, as the layer-3 tokens give), and to ask if
   that is what the Owner wants from "glass everywhere". Three layout sketches the Owner has not been shown are beside
   this file: `sketch-drawn-behind-and-in-front.md`, `sketch-journeys-layout-fixes.md`, `sketch-check-sheet.md`.
5. One round on the Owner's notes, the second look, the Owner's own walk.
6. The design drift check against the approved mockups (`docs/mockups/`, board v17): the Owner's exit gate of
   2026-11-16. Its record goes in `docs/superpowers/audits/<date>-slice-3-design-review.md` with a `Scope:` line and
   `Recheck: passed`, and the approval under "Approved screens" in `history.md`.
7. Retrospective, then move the slice's finished lines from `progress.md` to `history.md` (plan Task 44 Step 2).
8. Native-speaker reads of the nine languages: planned, not done, by the Owner's decision of 2026-11-20 00:21 UTC.
   The plan is Framework #219, `docs/superpowers/specs/2026-11-20-native-speaker-reads-design.md`.

The pictures of round 1 (416 files) lived in the old project's shared folder and are not in git. They can be shot
again from `fa3a853`; the audits name each picture by flow and size. CI's own pictures are on the `ci-screens` branch
(3 of the 5 sizes).

## The paused fix work

Branch `claude/project-thread-c709zh` in Editors, head `4f0384d3` ("wip(world): design round 1, group 1 as it stands"),
cut from main `746c2ca1`: 21 files, no pull request, **not merged and not to be merged as it is**. Its live-state
file, `docs/superpowers/live/claude-project-thread-c709zh.md` on that branch, holds the plan for groups 2 to 5 and
the builder's picks.

- Done in code there: the card-over-card screens rule, and A1, A3, A5, A9, A13, A18, A19, R2, R3.
- Ran and passed at that work: lint, typecheck, knip; the Node tests (1188). The Chromium engine tests (199) and
  screens tests (325) passed before the last small edits (an import moved, one outline dropped) and were not run
  again after them.
- Not run: WebKit, Firefox, the journeys outside the changed screens, CI. No before and after pictures were shot.
- Not started: groups 2 to 5.

A fresh session can carry on from that branch, or start again from `main` with the two audits; the branch is small
enough to read first either way.

## Checks on Editors main

As of 2026-11-20 15:40 UTC:
- `fa3a853` (#128, the last code on main): green, run 44748205225, on its second attempt. The first attempt lost
  `browsers (webkit 5/6)` to the slow mirror before any test ran.
- `746c2ca` (#138, documents only): run 44755204131 ended red for the same cause: `browsers (webkit 5/6)` was
  cancelled inside `playwright install-deps webkit` after 30 minutes, before any test ran, which fails `engines
  (webkit)` and `gate`. It was not re-run, because this file's own pull request makes a newer run on main.
- `0d581fa` (#139, this file's pull request, documents only): green, run 44767346948 (added 2026-11-20 16:44 UTC). Everything
  after `fa3a853` on main is documents only.
- Site `b04483b`: the `site` run (build and deploy, 44760075525) and the `ci` run (44760075467) are both green.
- The sign-in journey failed a second time, on draft #140 (see "Flaky tests" in `history.md`).

A known cause of red runs that is not a test: GitHub's runner package mirror is slow at times, and
`playwright install-deps webkit` or `playwright install --with-deps chromium` then hangs until the job's timeout (30
minutes for browsers, 15 for mockups) before any test runs. Agent-selected: such a job has given no test result and
may be re-run (failed jobs only), each time recorded; a test that runs and fails keeps the one-re-run rule. Marking a
pull request ready, or pushing to it, cancels its running run and leaves a red "gate" on the cancelled run; the newest
run decides.

## Open items (none blocks the editor from working)

Flaky tests: each one, with its text and what is known, is under "Flaky tests" in `docs/superpowers/history.md`
(Site's own, `play.journey.ts:28` in Firefox on a font, is in Site's `history.md`). Still without a proven cause:
two in `open-game.journey.test.ts` and one in `sign-in.journey.test.ts` (a harmless extra token swap in `session.ts`
`renew()` was found on the way and is not the cause). Fixed: the approve journey (#137).

For the Owner (lane 3 or the Owner's call):
- The quick check on draft pull requests in Editors and Examples still passes with no tests (`--passWithNoTests` with
  `--changed`); changing it is a CI workflow change.
- CI shoots pictures at 3 of the 5 sizes in Editors.
- Caching the browsers' system packages in CI would end the slow-mirror reds; a CI workflow change.
- `NPM_TOKEN` in Framework before any npm release.
- Old branches left on GitHub, all merged or carried: Editors `claude/project-thread-*` (reviewers' audit branches;
  every audit is on `main`), Examples and Site `claude/project-thread-q7dy1d`. The one branch that is not merged is
  the paused fix work above.

Small faults and gaps, written down and not fixed:
- Walk notes: N3 (the number pad's + is named "More", like the three dots), N4 (Empty in the Paint tray missed one
  tap in four at phone sideways), N5 (on a phone the settings sheet hides Undo), N6 (offline shows a red cloud and no
  words), N10 (no journey turns the device).
- Round 1's 30 notes (ideas, not gaps), in the two audits.
- The loading sheet's "Not now" goes to the level; the loaded sheet's goes to the list.
- Item 7 of plan PR 19 has a test for a language change only, not for a rename or a font arriving.
- German and Russian level bars are wider than a phone.
- `pnpm lint` shows a warning and three infos in files no recent change touched.
- Six `waitForTimeout` sleeps in `tests/journeys/map.journey.test.ts` (from #96) break "wait on readiness, never on a
  sleep".
- The website demo: no word says whose colour is whose with two players; a level name over 9 letters overflows on Site.
- The keys sheet, when built, should list "Ctrl + wheel: zoom" and "+ / -: zoom" on the map.
- Not built inside the plan, by the plan's own notes: drag-in from the tray, the Add-a-note menu rows, the
  Pick-several loop, free-thumb Box erase, the ring handles (drawn, do nothing yet).

## The Owner's standing words

- The project is halted until the Owner finishes Ruken, except workflow updates, documents and finishing the World
  slice (2026-11-19). On 2026-11-20 15:37 UTC the Owner stopped the slice too, at this point.
- A new project with an updated workflow comes next (2026-11-20 15:18 UTC); the workflow is pulled fresh from the
  Owner's website. The list of toolchain and CI speed-ups the Owner raised at 13:54 UTC is not tracked here for that
  reason. A migration of tests to end-to-end tests to cut test load was never raised, planned or done.
- Look: glass, semi-transparent, on every surface, no solid panels; blur and dimming by layer; icons over words
  wherever possible (2026-11-17). A panel alone on an empty page sits in the middle, not at the top (2026-11-20).
  A pull request that adds or changes a screen starts with a layout sketch.
- "Whole world" stays in the map's top bar, right of List (2026-11-16); the mockup is out of date on that point.
- The World slice may close with the native-speaker reads planned, not done (2026-11-20).
- Identity: every commit by McThayDT, no assistant lines anywhere; merge commits only; never force-push.

## Later, not now (the Owner's backlog)

- A photo-style look for the editors (post-processing): a must-have, not scheduled. Curves are new work.
- A one-command game builder for other people (three plain questions, then a playable first slice).
- 3D: a "modern" mode and a "vintage" mode.
- The next roadmap slice after World is Characters (`docs/roadmap.md` in AutomataFramework); it does not start until
  World's design drift check has passed.
