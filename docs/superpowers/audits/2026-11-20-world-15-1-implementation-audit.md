# World 15, cycle 1: implementation audit

Change: PR #118, head `ab713d9`, plan PR 15 (Tasks 36 and 37), lane 2. Read by a fresh reviewer; nothing was fixed here.
Method: `review` prompt followed; read the changed tests first; ran lint, knip, typecheck, `test:node` (94 files, 1147 tests
pass), both journey builds (`build:journeys`, `build:journeys-plain`), the approve, two-people and save-problems journeys
(40 pass, Chromium) and the screens scenes for check and clash at five sizes, then looked at the pictures.
CI on `ab713d9` at the time of writing: check, mockups, commit-authors, Chromium 1 to 6 green; WebKit 1 to 3 green, 4 to 6
running; Firefox 1 to 6 queued or running. Not yet a result for WebKit and Firefox.

## Changed or deleted tests
Read first. Nothing loosened. `words.test.ts` loses 14 pins whose rows were removed with the deleted `WaitingChange`
page (typecheck and knip are clean, so no other reader). `approve`, `share`, `screens` journeys keep the same behaviours
with the new words. `save-problems` clash tests assert the new, plan-required behaviour (ask, nothing written before an
answer). One assertion in `screens.journey.test.ts` now prints its list (`join('; ')` to `''`): same strictness.

## Acceptance, one by one
- Task 36 Check sheet, Play, Put in, Ask in words, Don't put in with Undo, author told: PASS (approve journey, new
  journeys, `check.test.ts`).
- Task 36 `WaitingChange.svelte` deleted: PASS.
- Task 37 asked only for clashes, rest goes in unasked, button lit when all answered; two windows, both choices: PASS
  (two-people journey, save-problems).
- Task 37 "both places shown on the level", `Marks.svelte` modified and names: FAIL, red 1.
- Check "over the changed level, the changes marked": FAIL at widths 501 to 899 px, red 2.
- Device keys listed in `this-repo`: FAIL, red 3.
- Design instructions: glass surfaces only through `Sheet`/kit classes (no own blur, dim or panel backgrounds found);
  every button has an icon and a label; no icon-only button added. PASS.
- Mockups the plan names (`world-levels-check`, `-ask`, `-asked`, `-turned-down`, `-turned-down-sam`): only
  `docs/mockups/world-levels-check.html` exists. Note 1.

## Red findings

UNIT: `src/features/team/Clash.svelte`, `clash.ts` (and `levels/Marks.svelte`, which the plan names and the PR did not touch).
VERDICT: red (judge: this is the owner's call, see below).
REQUIREMENT: plan Task 37 and spec: "both places shown on the level", `Marks.svelte` "both places shown, mine and theirs, named".
REASON: the clash shows two whole-level thumbnails side by side (about 254 by 120 px on iPad, 56 px high on a short
phone), not both places on the level.
EVIDENCE: `ipadUpright-level-changed-by-someone-else.png`: the clashing crate is 8 px wide in each picture, the ring's
grips are bigger than the crate, and the two pictures differ by a 7 px shift of that blob (pixel crop compared). The
journey's own fixture moves it by 1 to 2 units; a person cannot tell which place is which without hunting. On a short
phone it is smaller still (`phoneSideways-put-sheet-clash-only.png`).
EXPECTED: a person sees at once where each version puts the thing, as the plan words it, on the level itself.
FIX: either (a) draw both places on the real level behind the sheet (a named ghost for theirs, the ring for mine) via
`Marks.svelte`, or (b) keep the two small pictures but crop each to the clashing thing and its surroundings (not the
whole level). This is a choice between the plan and the sketch the owner was shown (two small pictures, as the PR body
says; the PR body does not call it a deviation from the plan). Ask the owner as a decision card; recommend (b) as it
matches the sketch and is the smaller change. Files: `Clash.svelte`, `clash.ts`, optionally `Marks.svelte`, journey scene.

UNIT: `src/features/team/Check.svelte` (the `.level` rule).
VERDICT: red.
REQUIREMENT: Task 36: "opens the sheet over the level with the changes marked"; the marks are the point of the sheet.
REASON: from 501 to 899 px wide the kit's `Sheet` is centred (the `side` and phone rules do not apply), and `.level`
only makes room at 500 px or less, so the sheet sits on the middle of the changed level.
EVIDENCE: `ipadUpright-waiting-change-as-approver.png` (834 px): the ringed crate's top is under the sheet's edge, and
in `...failed-checks.png` more so. `phoneSideways-waiting-change-as-approver.png` (844 px): the ringed crate is almost
completely hidden. Any changed thing in the middle band is fully hidden. Phone (390) and iPad sideways and computer are fine.
EXPECTED: the ringed thing is visible on every size.
FIX: in `Check.svelte` only, for 501 to 899 px: give the level the top part and set the sheet at the foot
(`.check :global(.sheet)` override with the same glass), or pick the level's area above the sheet, as the phone rule does.
Do not change `Sheet.svelte` (shared, shot on every screen). Add the scenes at ipadUpright and phoneSideways to the
screens journey's check scenes with an assertion that the ringed thing is not under the sheet.

UNIT: `.claude/skills/this-repo/SKILL.md` and `src/features/game/drafts.ts`.
VERDICT: red (small).
REQUIREMENT: `this-repo` "Nothing hidden from an agent": the device keeps only the listed keys, a new key is added to
the list in the change that adds it; "Anything else is a defect".
REASON: the change adds `af.sent:<owner>/<name>:<path>` and does not add it to the list.
EVIDENCE: `drafts.ts` `prefixOf(game, 'sent')`; `grep af.sent .claude` finds nothing.
EXPECTED: the list names `af.sent:…` (what was sent to be checked, kept until answered), as `af.draft:…` is named.
FIX: one line in `this-repo`; name that edit in the PR body (lane of the code change). That file only.

## Notes (not blocking, kept apart)
1. Mockups: four of the five named mockups are not in `docs/mockups/`; `this-repo` says no new mockups are drawn, so the
   plan line is probably out of date. Lead to confirm; nothing to build.
2. The PR body does not say that "both places on the level" became two thumbnails; say it in the body after the decision.
3. `pnpm lint` shows 1 warning and 3 infos (for example `String.raw` in `scripts/screens-touched.ts`); the file was
   edited here but the lines were not, so not counted against the change.
4. The "Put 0 changes in the game" title on the clash-only sheet reads oddly once everything is kept as theirs; the text
   below it explains, so it passes the test but could be gentler.

## Not run
WebKit and Firefox locally (CI covers them, still running); journeys other than the three named; nine-language reads
(a native reader is planned by the owner, Framework #219).
