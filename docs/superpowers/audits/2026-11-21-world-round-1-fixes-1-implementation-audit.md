# World design round 1 fixes: lane 2 implementation audit, cycle 1

**2b49c2c FAIL: 2 red**

Pull request #145 (draft), branch `claude/project-thread-c709zh`, head `2b49c2c` examined, against `main` at `a29a83a`
(the merge base). Lane 2: it touches `src/features/words/`. Brief: `/mnt/project-files/briefs/fix-world-reds.md`, the
reds A1 to A20 in `2026-11-20-slice-3-design-review-round-1-a.md` and R1 to R17 in `-b.md`, and the acceptance criteria
in the pull request body. Rules: `CLAUDE.md`, `review`, `build`, `this-repo` as merged on `main`. The look itself is
the design reviewer's; this audit flags only code-level look problems.

> Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the
> spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or
> incomplete integrations. Do your best work.

## What ran (Chromium, in a cloud container, Node 24.22.3)

| Check | Commit | Result |
| --- | --- | --- |
| The five behaviour journey tests for R4, R5, R8, R17 (`approve`, `save-problems`, filtered by name) | `042ce0d` (tests only, before the fix) | 5 of 5 fail, each at the new assertion: R5 "expected 'With kid, to check'"; R8 and R4 time out waiting for the level and the bar's words; R17 look-only finds no Keep a copy, blocked still offers Try again |
| The same five | `2b49c2c` | 5 of 5 pass |
| `pnpm vitest run --project chromium` (every browser test) | `2b49c2c` | **1 failed**, 198 passed: `tests/features/shell/topbar.browser.test.ts` "on a phone the part's name opens one menu…" |
| `pnpm test:node` | `2b49c2c` | 1196 of 1196 |
| `pnpm typecheck`, `pnpm lint`, `pnpm knip` | `2b49c2c` | clean (lint's one warning is `main`'s) |
| CI, newest run on the head (draft run, Chromium only; no full run exists yet) | `2b49c2c` | `browsers (chromium 1/6)` failed on the same test; shards 2 to 6 cancelled; `quick engines (chromium)` failed; `quick check`, `plan`, `commit-authors` passed. Run 44897941300 |

Not run here: the whole journey suite, the screens journey, WebKit and Firefox. The CI run that would have run them was
cancelled by the failure above.

## Red

### 1. The head breaks an existing browser test, so CI is red

UNIT: `tests/features/shell/topbar.browser.test.ts:219` (and the PR body). VERDICT: red. REQUIREMENT: the PR's own
criterion "every journey, the node tests, typecheck, lint and knip pass on the head"; `build` ("CI is the merge gate";
a changed test is named in the body). REASON: A2's fix makes an upright phone show the level's name alone
(`TopBar.svelte`, `partName` with `compact`), so the bar's part button now reads "Level 1", and the test still looks
for a button named "Levels · Level 1". EVIDENCE: CI job 136827538380, `TypeError: Cannot read properties of undefined
(reading 'click')` at line 219; reproduced here with `pnpm vitest run --project chromium
tests/features/shell/topbar.browser.test.ts` (1 failed, 15 passed). The body's "What ran" lists journeys and Node
tests but no Chromium browser-mode run, which is why it was missed. EXPECTED: every browser test passes on the head,
and CI's draft run is green. FIX: the change is the behaviour A2 asked for, so follow it in the test: on a phone, look
for the part button by the level's name ("Level 1"), and still check the one menu holds the parts, the editors and the
game menu. Name the test change and why in the body. Then run `pnpm vitest run --project chromium` whole and push.
Only `tests/features/shell/topbar.browser.test.ts` and the PR body.

### 2. A changed existing test is not named in the body

UNIT: the PR body, "Tests changed, and why". VERDICT: red (small; a body edit). REQUIREMENT: `build` and `review`: "A
pull request that changes or deletes an existing test, golden or `verify` step names each one and why in its body."
REASON: `tests/journeys/issue-pictures.journey.test.ts` changed (issue 1's test now also checks Room 1, for A19) and is
not listed. The change is a stronger check, not a weaker one. EVIDENCE: `git diff a29a83a 2b49c2c --
tests/journeys/issue-pictures.journey.test.ts`: the room list goes from `['room-2', 'room-3']` to `['room-1',
'room-2', 'room-3']` and the title changes. The body's list names `play.journey`, `approve.journey`,
`team-copy.test.ts`, `words.test.ts`, `world-play.browser.test.ts`, `docks.test.ts` and `screens.journey` only.
EXPECTED: every changed existing test named with its reason. FIX: add `issue-pictures.journey` (A19: the Move card now
must clear Room 1 too) and `topbar.browser.test.ts` (red 1) to the list. Only the PR body.

## What was checked and holds

- **Every red is addressed or its call is named.** A1 to A20 and R1 to R17 each map to a change in the diff or to a
  named call in "Calls made". Read in the code: R5 (`check.ts` now compares the change with its own `before` files,
  so the author's own game is no longer read twice; unit test added), R8, R4 (new status kind `asked` in `status.ts`,
  test added), R17 (`PutSheet.svelte` lines 189 to 192: Keep a copy on look-only, Close as the main button when
  blocked), A10 (`events.ts` `cantPlay` takes a Show me; `Events.svelte` draws it as the one main button), R13
  (`Opening.svelte`: own titles, one primary "Back to your games", the file lines as small print), R15 (Back, Try
  again, Close and Take them back carry their icons in `Opening.svelte`, `PutSheet.svelte`, `Screen.svelte`), A11
  (`stack-plus`, `skip-back`), A20 (13px).
- **R4, R5, R8, R17 have journeys that fail on the old code**, measured above, not taken from the body.
- **Scope.** All 55 changed files are under `src/features/` or `tests/`; each change traces to a red. No CI workflow,
  rules file, shared skill, `package.json` or lock file changed. Lane 2 is right.
- **Code.** No file over 600 lines; comments say why; the new stack (`ui/noted.svelte.ts`) sits in `ui`, below every
  caller, and the architecture test passes in `test:node`. Every new word is in all nine languages (`words.test.ts`
  passes). Commits are authored and committed by McThayDT with no Claude trailers. The body starts with the project
  attribution and ends with "Requested by **McThayDT**".

## Notes (not blocking; for the coordinator, not fixed here)

1. **R14 and A10's sentence: the call's reason is weaker than it reads.** The body says the sentence is the
   framework's own and changing it is framework work. The editor already has its own plain sentence for this very
   problem, with the levels' names: `src/features/words/arrange.ts:83` (`wallBody`, "Room 1 is open on its side here,
   but Room 2 has a wall of ground in the way."), used by the map's wall card. The put sheet and Play could use it for
   the wall problem without touching the framework. The call is named, as the brief allows, so it is not red here; the
   design reviewer or the coordinator may want to reopen it, since it leaves a drunk-grandma red standing.
2. The body's "What changed, by red" does not list A10's Show me (it is only in commit `4e88efd`'s message); "Calls
   made" mentions only the sentence. A reader could think A10 was left whole.
3. `ui/noted.svelte.ts` keeps the floating cards' heights in one module-level map, shared by every suite mounted on
   the page. Fine for one suite a page; worth knowing if a test or an embed ever mounts two.
4. `TopBar.svelte` `fit()` sets `squeeze` back to 0 and steps up again on every change it tracks (names, status,
   size, …), so the bar may show its full words for a frame before letting go of them again. Not seen in the pictures;
   a look for a flicker on a phone while the status changes would settle it.
5. `AuthorNote.svelte` keeps the old indentation and two empty lines where its wrapper and style were removed.
