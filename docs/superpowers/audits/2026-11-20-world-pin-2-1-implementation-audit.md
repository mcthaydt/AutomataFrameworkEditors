# Audit: pin 2 (Task 41), cycle 1

Examined commit: 3254f90429482387af7f0063f9dc03140f5140ca (PR #122, lane 2). No screen changes, so no pictures.

## Result: no red. Two notes.

## Checks

- **b10ffe6 is the head of AutomataFramework `main`** (`list_commits main`, newest first). Pinned in `package.json`, `onlyBuiltDependencies` and the lockfile (specifier, version, resolution, snapshot) with the same hash.
- **F1/F2 in b10ffe6:** `step()`, `setSpeed()` (1, 0.5, 0.25), `kept()`, `backTo()` and `keepSeconds` (0 to 60) are in `src/features/game/game.ts`.
- **F3:** `readGame` is in `src/features/content/load.ts` and never throws.
- **F4:** `weight` is in `src/features/content/character.ts`: it names a `number` value, needs a `dynamic` body, and the value's `least` must be more than 0.
- **F5:** `draw` (`behind`, `with-hero`, `in-front`) is in `docs/formats/changes.md`; `src/features/level/draw.ts` holds the `Draw` component.
- **Plan W part 5:** `doorTaken` is in `src/features/level/doors.ts`; `arrive` is passed through `GameOptions` (it extends `GameSimOptions`); `paintLevel` is in `src/features/content/paint-level.ts`; places are in `load.ts` (`content.places`).
- **Diff scope:** only `package.json`, `pnpm-lock.yaml`, the crate fixture and the live-state file changed. Nothing was loosened: no test, golden or config touched.
- **Fixture:** `"weight": "heavy"` is valid. The crate has a `dynamic` body (not `fixed`), so `checkWeight` accepts it. I did not run `game.test.ts` here. The PR body says `test:node` passes, and CI is green at this head: all 29 checks (plan, check, mockups, screens, engines, 18 browser pieces, gate) succeeded.

## Notes (not blocking)

1. The live-state file `docs/superpowers/live/claude-project-thread-8j24v5.md` is in the diff. CLAUDE.md says to delete it in the last commit before merge, so the builder must do that before ready.
2. The PR body says F5's "draw field" is in `level.ts` and `draw.ts`. That is fine, but the key evidence for the three values is `docs/formats/changes.md`, not `draw.ts`, whose comment lists only `behind` and `in-front`.
