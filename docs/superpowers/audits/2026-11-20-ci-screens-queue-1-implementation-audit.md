# Lane 3 audit: the screens job's queue and retry (Editors #135), cycle 1

- Examined: head `b6ceda33ce6413795f3d2db8578967072990cd61` of `claude/project-thread-jsubp8` (draft #135), against its
  base `016ab6f5b81d5fe1f6ded7389d5e481918657dc5`. Plan audit (the PR body) and implementation audit.
- Approvals checked against: the owner's "yes" (2026-11-20 09:24 UTC, one-line queue fix in the `screens` job) and
  the decision card "Yes, add the retry (about 8 lines)" (09:27 UTC): main gets its own queue for the screens job and
  its push step retries from a fresh fetch, so no run is cancelled or loses a race. Builder's brief:
  `handoff/world/ci-screens-queue.md`.

## Verdict

**One red, small and bounded. Fix it, then this can merge on green.** Everything else holds: the scope is right, the
race is gone (reproduced), the prune is safe when redone, the last try fails loudly, and permissions, tokens and
triggers are unchanged.

## Red

### R1. If GitHub's API call in the new guard fails, main's pictures are skipped silently and the job goes green

- **What is wrong.** The guard reads main's head inside a test:
  `[ "$(gh api "repos/$GITHUB_REPOSITORY/commits/main" --jq .sha)" != "$GITHUB_SHA" ]`. `set -e` does not stop on a
  failed command substitution that is an argument of a command (only on one that is an assignment). So when `gh api`
  fails, the text is empty, it differs from the commit, the step prints "A newer merge will write main/." and returns
  0. No try is used, nothing is written, and the job is green. This is a new quiet failure the change adds, and it
  goes against the approved outcome ("fails loudly", no lost pictures).
- **Evidence.** The step script taken from `ci.yml` at `b6ceda3` by a YAML parser, run against a local bare repo with
  `gh api` stubbed to fail: `A newer merge will write main/.`, `exit 0`, the branch still at its seed commit. The same
  bash rule on its own: `bash -c 'set -euo pipefail; f(){ if [ "$(false; echo)" != abc ]; then echo skipped; return 0;
  fi; }; (set -e; f); echo exit $?'` prints `skipped`, `exit 0`.
- **Expected.** A failed `gh api` fails that try like any other failing command, so it is retried and, after the third
  try, fails the job with "Could not save the pictures after 3 tries."
- **Bounded fix (one line).** Read the head in an assignment of its own, so `set -e` stops the try when it fails, for
  example:
  `if [ "$LATEST" = main ]; then head="$(gh api "repos/$GITHUB_REPOSITORY/commits/main" --jq .sha)"; fi` and then
  `if [ "$LATEST" = main ] && [ "$head" != "$GITHUB_SHA" ]; then ...`. Checked here in the same harness: with the API
  failing, tries 1 to 3 fail and it ends `Could not save the pictures after 3 tries.`, `exit 1`; the older-run case
  still prints "A newer merge will write main/." with `exit 0`; the two-writer race still lands both. Optionally add a
  line to the shape test so the head is read in an assignment.

## The six questions

1. **Only the screens job and one test. Pass.** `git diff --stat 016ab6f b6ceda3`: `.github/workflows/ci.yml` and
   `tests/workflows/ci.test.ts` only (the live-state file added in `a5848dc` is removed in `b6ceda3`). Every changed
   `ci.yml` hunk is inside the `screens` job (its comment, `concurrency.group`, and the `Commit them to the ci-screens
   branch` step).
2. **24 lines, not about 8: each line is needed. Pass, with the guard named to the owner.** `git diff -w` shows 24
   changed lines: 6 are comments, 4 are a line changed in place (`group:`, the `git init` line now starting with `rm
   -rf`, `exit 0` to `return 0`, and the removed comment), and the rest is the retry and the guard. Line by line:
   - `group:` with `github.ref` and, for pushes, `github.sha`: the approved one-line fix.
   - `write_pictures() {` / `}`, `rm -rf "$RUNNER_TEMP/branch"`, `return 0` for "No new pictures.", and the loop (`for
     try`, the subshell with its status, the success exit, the retry message, the wait, `done`, the final message and
     `exit 1`): the approved retry. Each try must start from an empty folder (`rm -rf`), `return` is needed because
     `exit` inside the function would end the try's subshell the same way but reads wrongly, and the explicit status
     is needed because `set -e` does nothing inside `if` or `||`. Without that, a failing `gh pr list` would leave the
     open list empty and prune every open pull request's folder. About 12 runnable lines rather than 8; the owner's
     "about" covers it.
   - **The guard** (one line and its comment) is new behaviour beyond the literal retry, but it is needed for the
     approved outcome to be safe: with a group per commit, two main runs can now overlap, and without it the older
     one finishing last would put older pictures in `main/`, which is a run losing a race, the thing the card said
     would not happen. Keep it (with R1's fix) and name it plainly to the owner in the merge summary, as the PR body
     already does. It is not a reason to go back to the owner before merging.
3. **Two and three writers can no longer end in a rejected push or lost pictures. Pass, reproduced.** Harness: the
   step's `run:` text taken from `ci.yml` by a YAML parser (the one `${{ }}` in the commit message replaced by
   `$GITHUB_SHA`), a local bare repo seeded with `live/`, `main/`, `pr-5/`, `pr-12/` (open) and `pr-9/`, `pr-9-real/`
   (closed), `gh` stubbed, and a wrapper that holds a writer before its first push.
   - Two writers, main held 3s: base `016ab6f`: main `rejected (fetch first)`, `exit 1`, main's pictures lost. Head
     `b6ceda3`: main's try 1 refused, try 2 lands; the branch reads `screens: main (aaa)` on `screens: pr-5 (bbb)` on
     `seed`; `main/` holds main's pictures, `pr-5/` the pull request's.
   - Three writers (main held 3s, pr-5 held 1s, pr-12 at once): base: main and pr-5 both `exit 1`, only pr-12 lands.
     Head: all three `exit 0`, the branch reads `main`, `pr-5`, `pr-12`, `seed`, each folder holds its own writer's
     pictures, `live/` kept.
   - Two main runs at once for the same commit: both `exit 0`, one retried; `main/` holds one run's pictures.
   - The prune, redone on every try from the fresh tip and a fresh `gh pr list`: `pr-9/` and `pr-9-real/` are gone and
     open folders stay in every case above. With `gh pr list` failing, 3 tries fail, `exit 1`, and the branch is
     unchanged (nothing pruned).
4. **After the last try it fails loudly. Pass, except R1.** Every push refused: tries 1, 2, 3 fail, then "Could not
   save the pictures after 3 tries.", `exit 1`. The `gate` job lists `screens` among the jobs that must pass whenever
   it applies, so the run goes red.
5. **No run can be cancelled by another run's queueing; pull requests keep their behaviour. Pass.** A push's group is
   `ci-screens-refs/heads/main-<sha>`, unique to that commit, so no other run can take its waiting place. A pull
   request's group is `ci-screens-refs/pull/<n>/merge`, so only a newer run of the same pull request can replace its
   waiting screens job, and the workflow-level group (`cancel-in-progress` for pull requests) already cancels that
   older run. No group name collides with the workflow-level `ci-...` group or with any other workflow (`grep -rn
   ci-screens .github/`: only `delete-closed-pr-branch.yml`, which protects the branch by name).
6. **Permissions, tokens and triggers unchanged. Pass.** The diff touches no `on:`, `permissions:`, `env:` or `if:`
   line. The new `gh api` read uses the same `GH_TOKEN` and needs only the `contents` read the job already has.

## Plan audit (the PR body)

Sound. What was read matches the step at `016ab6f`; the reason the one-line fix alone was unsafe is right and is
reproduced above; the change is the smallest that meets the approved outcome. The acceptance criteria are observable
and match the six questions. The shape test fails on the base workflow (checked: with `016ab6f`'s `ci.yml` it fails;
at the head `vitest run tests/workflows/ci.test.ts` passes 4 of 4).

## Notes (not blocking)

- N1. The PR body says the guard "keeps today's guarantee". The shared queue ran screens jobs in the order they reached
  the job, not in commit order, so that guarantee was never strict. The guard is the stronger of the two.
- N2. Trade-off the PR already states: if the newest main run's screens job fails, `main/` keeps the previous merge's
  pictures, since the older run stands aside. On main every push takes pictures (the plan sets `pictures=true` for
  pushes), so this happens only when the newer run itself fails.
- N3. The loop also waits 15s after the third failed try before failing; the PR body says "5s and then 10s". Harmless.
- N4. The shape test does not cover the guard; R1's fix is the moment to add one line for it.
- N5. Locally, `tests/workflows/bundle.test.ts` and `docs-only.test.ts` failed only because the framework dependency
  was installed with `--ignore-scripts` here; neither reads this change.

## What did not run

The draft CI run for `b6ceda3` (run 44711727553) was still in progress at the time of this audit, so its screens job
writing `pr-135/` through the new loop is not checked here. No real two-writer race was run on GitHub; the race was run
locally on the step's exact text.

## Cycle 2 addendum: the fix range only

- Examined: `b6ceda33ce6413795f3d2db8578967072990cd61..c1caada7849f41e0ce7e699c11ead1aa8b446644`, one commit
  (`c1caada` "Fail the try when main's head cannot be read"), now the head of #135.
- **Verdict: pass at `c1caada7849f41e0ce7e699c11ead1aa8b446644`. No reds left.**

**R1 fixed.** Main's head is now read in its own assignment, `head="$(gh api "repos/$GITHUB_REPOSITORY/commits/main"
--jq .sha)"`, inside `if [ "$LATEST" = main ]`, and then compared. The same harness, run on the step text taken from
`c1caada`'s `ci.yml`:

- `gh api` failing: tries 1 and 2 fail, then "Could not save the pictures after 3 tries.", `exit 1`, branch unchanged.
- Older main run after a newer merge: "A newer merge will write main/.", `exit 0`, nothing written.
- Two writers (main and pr-5), three writers (main, pr-5, pr-12), and two main runs: every writer `exit 0`, and
  each folder holds its own writer's pictures. `pr-9/` and `pr-9-real/` are pruned, and open folders and `live/` are
  kept.
- Every push refused: "Could not save the pictures after 3 tries.", `exit 1`, in 15s (5s and 10s waits, none after the
  last try).
- `gh pr list` failing: `exit 1` after 3 tries, nothing pruned.

**Scope still holds.** `git diff --stat 016ab6f c1caada`: `.github/workflows/ci.yml` and `tests/workflows/ci.test.ts`
only, and every `ci.yml` hunk lies between lines 298 and 368, inside the `screens` job. The fix itself changes the
guard (3 lines become 4) and puts the retry message and wait behind `if [ "$try" -lt 3 ]`. Permissions, tokens and
triggers are untouched.

**The test.** The new line in `tests/workflows/ci.test.ts` checks for the assignment. `vitest run
tests/workflows/ci.test.ts` passes 4 of 4 with `c1caada`'s files and fails 1 of 4 with `b6ceda3`'s `ci.yml`, so it
fails on its own.

**Notes N1 and N3 are addressed:** the PR body now says the old queue mostly ran in arrival order, and there is no wait
after the last try. N2 (main stays stale if the newest run's screens job fails) is unchanged, as stated in the PR. The
draft CI run at `c1caada` was not checked here.
