# No empty suite, round 1: implementation audit (Editors #111)

- Examined: `claude/project-thread-p1kv93` at dd5fc63, against `main` at 257db66. Lane 2, one fresh review.
- Verdict: **no red findings.** Four notes, none blocking.

## What was checked, and how

| Criterion | Check | Result |
| --- | --- | --- |
| No script carries `--passWithNoTests` | `tests/workflows/package.test.ts` "no script lets a run that finds no tests pass", run on dd5fc63, then with `main`'s `package.json` swapped in | Passes on dd5fc63. Fails on `main`'s scripts: `test:engine: expected 'vitest run --passWithNoTests --project' not to match /pass-?with-?no-?tests/i` |
| Each screens shard names a real size | `tests/workflows/docs-only.test.ts` new test, run on dd5fc63, then with `screens: phone` changed to `screens: phonee` in `ci.yml` | Passes on dd5fc63. Fails on the typo: `expected [ 'ipadUpright', 'ipadSideways', …(3) ] to include 'phonee'` |
| Without the flag an empty run fails | `vitest run --project node tests/nothing-here` | exit 1 |
| A `-t` filter matching nothing passes silently (the gap the size test covers) | `vitest run --project node tests/workflows/package.test.ts -t zzz-nomatch` | exit 0, as the PR says |
| The full CI run on the head | check runs on dd5fc63 (the `package.json` change forces the full run) | `check`, all 18 `browsers` shards, `engines (chromium/webkit/firefox)`, `gate`, `screens`, `mockups`, `commit-authors`: success |

## Can any CI call of these scripts come up empty?

Every call in `.github/workflows/ci.yml` on dd5fc63:

- Shard 1, `pnpm test:engine <engine> --bail=$BAIL`: the browser projects take `*.browser.test.ts`, 21 files. Not empty; and if it were, it now fails.
- Shards 4 to 6, `pnpm test:journeys --exclude=…screens… --shard=k/3`: 16 journey files besides the screens one. Vitest 5.0.3's `calculateShardRange` spreads files evenly (16 over 3 gives 6, 5, 5), so no shard is empty; if one ever were, it now fails.
- Shards 1 to 3, `pnpm test:journeys tests/journeys/screens.journey.test.ts -t "at <size> ($SCENES)"`: the file is always found, so only the `-t` filter can come up empty, and that passes silently. The names are `at <size> <scene>: pictured, then measured` (`describe.each(Object.keys(SIZES))`, line 888). The size part is now held to `SIZES` by the new test; the scene part is held to the scene names by `tests/scripts/screens-touched.test.ts` ("every pattern names a scene that exists"), and a full run uses `.*`. A size such as `phone` cannot also match `phoneSideways`, because the pattern has a space after the size.
- No other workflow calls these scripts (`commit-authors.yml`, `delete-closed-pr-branch.yml`: none).

## Notes (not fixed here)

1. UNIT: `.github/workflows/ci.yml` `check` job, line 125. VERDICT: note. REQUIREMENT: CLAUDE.md, Tests: no `--pass-with-no-tests` or similar flag in CI. REASON: a draft's quick run still passes `--changed=origin/main --bail=1 --passWithNoTests` to `test:node`. EVIDENCE: line 125 on dd5fc63. EXPECTED: the rule holds in CI too, or the owner names the exception. FIX: a CI workflow change, lane 3, so the owner's call; the PR reports it. Removing it would fail any draft whose change reaches no Node test, so it needs a decision, not a mechanical edit.
2. UNIT: `.github/workflows/ci.yml` screens shards. VERDICT: note. REASON: `SIZES` has five sizes, CI pictures three (`phoneSideways`, `computer` never run). Already reported in the PR; out of scope.
3. UNIT: `tests/workflows/docs-only.test.ts`. VERDICT: note. REASON: the Node workflow test now imports `tests/fixtures/journey.ts`, which pulls in Playwright and the fake GitHub server only to read `SIZES`. It runs (23 tests pass in the two files) and lint and knip are green in CI; moving `SIZES` to a small module of its own would keep the Node test light. Not needed for this change.
4. Graphify's index is at 257db66 (`main`), not dd5fc63. The PR changes only `package.json` and two test files, so its answers for `tests/fixtures/journey.ts` (imported by the screens journey and 16 others, no change) still hold; the changed files were read directly.
