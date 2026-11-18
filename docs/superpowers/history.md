# History

Finished milestones and their decision records, setup, rule changes, standing permissions, approved screens and lessons.

## Setup

- 2026-11-18: superpowers **7.0.2**'s `test-driven-development`, `verification-before-completion`, `executing-plans` and
  `subagent-driven-development` read against the new verification rules (AutomataFramework
  `docs/superpowers/specs/2026-11-18-verification-design.md`, section 7). Where they differ, these rules win, and the
  differences are listed in `build` under "Superpowers' testing skills". `subagent-driven-development` is not used here
  (writers are threads); if it ever is, its task reviewer does not replace the implementation audit.
- 2026-11-17 03:58 UTC: restart. The apps kit (CLAUDE.md, skills `review`, `release`, `build`, `visual-check`, `staged-path`,
  `owner-updates`, `this-repo`, the compaction hook) installed again from the Owner's rules text; superpowers still
  **7.0.2**.
- 2026-11-16: the workflow in `CLAUDE.md` and `.claude/skills/` (`review`, `release`, `visual-check`) installed
  from the Owner's rules text. Superpowers **7.0.2** (https://github.com/obra/superpowers, the version its
  `plugin.json` gives). Where its skills differ from these rules, these rules win:
  - `writing-plans` saves a separate plan in `docs/superpowers/plans/`; here the plan is part of the spec.
  - `writing-plans` and `executing-plans` offer subagent-driven development and a subagent final review; here there
    are no subagents unless the Owner says so, and the implementation audit is a fresh session (`review`).
  - `executing-plans` defers minor final-review findings; here the fix round fixes every in-scope finding.
  - `executing-plans` sets up a worktree and ledger; here a thread works on its own branch.
- Session tools (the coordinator, 2026-11-16): start a thread, message it, choose its model and effort: found. Archive: by resolving a thread (hidden, can be reopened).
- The earlier workflow's records were removed on 2026-11-16 (see "Archive" below); `git show <commit>:<path>` brings
  any of them back.

## Rule changes

- 2026-11-16, the Owner: a blind-judge round (step 4) at the end of each slice's design review in `visual-check`.
  Approved in the project thread ("add that"). Scope: this change only, made the same in all five repos, as
  AutomataFramework `docs/superpowers/specs/2026-11-16-blind-judge-design.md` describes. Later rule changes are lane 3
  as usual.
- 2026-11-16, the Owner: a slice retro at the end of every slice (`review`), the `commit-authors` check restored, and
  the first retro's rule edits. Approved in the project thread ("yes", then "lets do self improving after every slice
  actually"). Scope: this change only, made the same in all five repos, as AutomataFramework
  `docs/superpowers/specs/2026-11-16-slice-retro-design.md` describes. Later rule changes are lane 3 as usual.
- 2026-11-16, the Owner: a layout sketch in the spec instead of pixel mockups before a screen is built (`visual-check`,
  "Before the build"). Approved in the project chat on 2026-11-16 at 19:57 UTC ("yes"). Scope: this change only, made
  the same in all five repos, as AutomataFramework `docs/superpowers/specs/2026-11-16-layout-sketch-design.md`
  describes. Later rule changes are lane 3 as usual.
- 2026-11-16, the Owner: a reminder after compaction that the rules file beats the summary (a `SessionStart` hook
  with the matcher `compact`), live state in a file, a fresh session per big job and spec writing in its own session.
  Approved in the project thread at 20:28 and 20:29 UTC, and on decision cards at 20:46 UTC. Scope: this change
  only, made the same in all five repos, as AutomataFramework
  `docs/superpowers/specs/2026-11-16-compaction-hook-design.md` describes. Later rule changes are lane 3 as usual.
- 2026-11-18, the Owner: verification. `CLAUDE.md` gets a short Verification section in place of the Tests and Lessons
  bullets, and `build` gets the full rules: run the change like a person through a new per-repo `verify` skill; journeys
  first, then property tests, then old-versus-new tests; test first, from the outside in, with superpowers' testing
  skills read under these rules; a flaky test fixed at its root in its own thread, or deleted with the reason written
  down; a change does not quietly edit its own check; lessons carry a trigger read from the diff; each retrospective
  prunes. A repo's own `verify` and `this-repo` skills take the lane of the code they describe. One edited alone is lane
  1, unless it changes what needs the owner. Asked for in the project thread ("Let's rethink how we do tests", with the
  Claude Code team's article on verification, and "We also need to evaluate how superpowers comes into the picture
  because that's tdd") and approved on decision cards on 2026-11-18 at 00:30 UTC ("Core rewrite" only; a property-test
  library and a commit verification stamp or gate declined) and at about 00:52 UTC ("Kits + 5 repos"; "Same lane as the
  code") and at about 01:52 UTC ("Lane 1, with a guard"). Scope: this change only, made the same in the two kits in
  McThayDT-Website and in RukenApp, AutomataFramework, AutomataFrameworkEditors, AutomataFrameworkExamples and
  AutomataFrameworkSite, as AutomataFramework `docs/superpowers/specs/2026-11-18-verification-design.md` describes.
  Later rule changes are lane 3 as usual.

## Standing permissions

- 2026-11-16, the Owner: the setup check, including first-time setup of these rules and the CI gate (lane 2). Scope:
  this repo's first install of this workflow. Later changes to the rules or CI are lane 3.
- 2026-11-16, the Owner: a deletion the plan called for that git can restore merges on green, with a before-and-after
  note.

## Approved screens

- 2026-11-16, the Owner: the shell and World mockups (board v17, pull request #70, `docs/mockups/`). A design
  approval: built screens are checked against it in the slice's design drift check, and are not approved by it.

## Flaky tests

- `open-game.journey.test.ts`, "when the sign-in is gone for good the person is on Welcome, told so" (Chromium). Failed once
  locally on `abe0ee7` and once in CI on `e0fd5cc` (shard `browsers (chromium 6/6)`): `locator.waitFor: Timeout 10000ms
  exceeded`, waiting for the "Automata Editors" heading. Cause, reproduced 19 times in 25 under CPU load: the journey called
  `goto` and then `reload` at once, so the first page's renewal cut off by the reload had already cleared the sign-in, and the
  second page showed the demo as a visitor. Fixed in the journey by loading the page once (0 failures in 25 under the same
  load); every assertion is unchanged.
- `settings.browser.test.ts`, "a value put back to its default leaves no key, and the settings of the Crate Game hold "How
  heavy" to halves" (Firefox). Failed once in CI on `e5d1311`, shard `browsers (firefox 1/6)`: `AssertionError: expected {
  heavy: 4 } to deeply equal { heavy: 2.5 }` (line 85), after typing "2.5" into the number pad. The same file passed in that
  shard on `6721ee1`, and nothing it reads changed between the two (only `tests/fixtures/journey.ts`). Not reproduced in 6 runs,
  12 under CPU load and 40 repeats under load, all passing. A `4` is the slider's top: one guess is that the field moved
  under the click (the click landed on the slider), but that is a guess with no evidence. Left as it is; if it fails again,
  the next step is to log where the click lands.
  Followed up on 2026-11-18 in three tries. The slider guess does not fit: Vitest's `type` only focuses the field, it never
  clicks. A `4` is "1" (the old number) followed by "2.5": "12.5", held to the top. 450 repeats of the steps under CPU load:
  no failure. The CI log has nothing more (its failure picture was not uploaded). Then 4 runs of the whole Firefox suite under
  load: one failed, in the test above it in the same file ("typing 99 …", `expected { …(2) } to match object { reach: 1 }`
  after typing "0" over the 8): "8" followed by "0" makes 80, held to 8. Shown on purpose: a blur between `clear` and `type`
  gives exactly that failure every time, because the number pad puts its number back when the field is left empty (by
  design). What took the focus away in the failing runs was not found; a test in another file stealing focus in a loop did not
  cause it (60 repeats). With that fixed, 6 more runs under load failed twice in a third test of the file, the only other
  one with the same two steps ("several things show "Not the same"…", `expected { …(2) } to match object { reach: 6 }`: "5"
  followed by "6"). So all three tests now put their words in at once and press Enter (no gap for a blur to land in), with
  every assertion unchanged; they still fail when Enter stops saving, when nothing holds a number to its limits, or when a
  default stays in the file. The gap it leaves: in these three tests the browser's own typing does not put the words in; that
  part of the number pad (fill, then Enter, held to its limit) is still checked in all three browsers by `kit.browser.test.ts`
  ("NumberPad: plus and minus stop at the limits").

## Lessons

None yet.

## Archive

- Before 2026-11-16: the earlier workflow's specs, plans, audits, tracker and history were removed in #93. They are at
  `8109888`: `git show 8109888:docs/superpowers/<path>`.
- 2026-11-16: plan PR 12 was split in two so each stays reviewable: 12a (Task 31, a thing's settings, Join, tags and Go to)
  and 12b (Task 32, Paint, Show, Pencil). An agent-selected choice by the implementer, told to the coordinator; the plan's
  tasks and acceptance are unchanged.
