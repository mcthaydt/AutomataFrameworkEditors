# World PR 12b (Paint, Show, Pencil): implementation audit, cycle 1 (AutomataFrameworkEditors)

**Editors #110 at ce75a38: 2 red findings; do not mark ready until both are fixed.**

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete integrations. Do your best work.

- Written: 2026-11-17 05:07 UTC (from `date`), by a fresh lane 2 review session. It changed nothing but this file.
- Brief: plan PR 12, Task 32 (AutomataPrivate `docs/superpowers/handoffs/2026-11-17-restart/project-files/handoff/source/editors/2026-11-16-world-editor.md`) and the PR's own criteria table.
- Examined commit: ce75a38 (head of `claude/project-thread-ik1on4`).

## What ran

| Check | Result |
|---|---|
| `pnpm lint` | clean (1 warning, in `tests/workflows/`, not this change) |
| `pnpm knip`, `pnpm typecheck` | clean |
| `pnpm test:node` | 93 files, 1154 tests passed |
| Chromium: `paint.browser.test.ts` | 10 of 10 passed |
| Journeys (Chromium): `paint-and-pencil`, `screens` | 281 passed, 5 failed: all five are `welcome-no-example`, which needs the plain build (`pnpm build:journeys-plain`) that I did not make. Not a defect of this change. |
| WebKit, Firefox | not run: the browsers are not installed in this container. CI runs them once the PR is ready. |
| Screenshots | 5 sizes (small phone, iPad upright, iPad sideways, computer, phone sideways), under `/mnt/project-files/screens/world-12b/` |

Task 32's items checked against the code and tests: Ground row picks Paint and fills the tray from `kindsOf`; things go faint; one drag is one undo; Box, Fill, Erase (Shift, Alt, Shift+Alt on a computer; the Hold tab on touch); press and hold picks the kind; a thing's cell is skipped with a note; an edge stroke says the way across opened, closed, wider or narrower; Show has every choice the plan lists; the pen does the tool and a finger slides the view; "Draw with a finger too" lets the finger paint; a hovering pen shows the outline. All present.

## Red findings

UNIT: `src/features/levels/Paint.svelte`, `reach()`.
VERDICT: red.
REQUIREMENT: Task 32 "one drag is one undo step" and "a thing's cell is skipped with a note"; the stroke is "the level as it was, with the stroke's cells painted".
REASON: a Box dragged out from a spot that a thing stands on, then pulled back onto only that spot, leaves the bigger box painted.
EVIDENCE: a throwaway Chromium test (not committed) put the free thumb on Box, pressed on the crate's tile (col 6, row 7), dragged to col 4, row 5, then back to the crate's tile and let go. Result: tiles differ from the original and `past` is 1. `paint()` answers `occupied` for the shrunk box, `reach` stores no level for it (only `same` is handled with `onedit(from.base)`), so the screen keeps the last bigger box. At the drop, `next` is undefined, so the stroke is closed as an undo step and `refuse(why)` shows a refusal instead of what was painted.
EXPECTED: the level goes back to how it was when the hand went down, nothing is added to the history, and the person is told the spot was left alone.
FIX: in `reach()`, treat `occupied` like `same` (`onedit(from.base)`), and make `drag`'s end add no undo step when the level equals `from.base`. Add this case to `tests/features/levels/paint.browser.test.ts` first. Files: `Paint.svelte`, that test.

UNIT: `src/features/shell/Hold.svelte` and `src/features/words/panels.ts` (`holdLabel`, `holdHow`, `holdFold`, every language).
VERDICT: red.
REQUIREMENT: the drunk-grandma test (CLAUDE.md, "plain words, nothing that needs explaining"); visual-check step 1.
REASON: the folded button just says "Hold" with an arrow. Nothing on the screen says it holds Box, Fill and Erase; the helpful sentence is only in the screen-reader label.
EVIDENCE: `phone-paint-tray.png`, `phoneSideways-paint-tray.png`: a dark pill labelled "Hold" sits over the level with nothing around it.
EXPECTED: a name that says what it is for, such as "Box, Fill, Erase" or "More ways to paint", in every language.
FIX: change the visible words only, in `words/panels.ts` (and its test if one pins them). Files: `words/panels.ts`.

## Notes (not blocking, recorded)

1. `Show.svelte` on phone sideways (`phoneSideways-show-menu.png`): the menu is 273 px high on a 390 px screen, so "Draw with a finger too" and "I draw with my left hand" are below the fold with no sign that it scrolls. It also lies on top of the list and the tray. Consider a scroll cue or two columns there.
2. On the small phone and phone sideways the list and the Show menu can be open at the same time and overlap (`phone-show-menu.png` earlier take, `phoneSideways-show-menu.png`).
3. On phone sideways the Paint tray covers the bottom of the level, which is where the floor is (`phoneSideways-paint-tray.png`). The Place tray does the same today; the level is not made smaller to leave room.
4. "Show what it is", "How near you are" and "The frames each screen sees" are the plan's own words, but "frames" is jargon a grandma would not know. Owner's call; a plain version would be "What each screen can see".
5. Dead copy: `groundNow` ("Painting: …") is defined in all nine languages in `words/ground.ts` and used nowhere.
6. Unrelated edits in `world/World.svelte` (the `listen` handlers rewritten to `void` one-liners, and `nextPointers` now returns the same object when nothing changed in `device/pointer.ts`). Not wrong, but not part of Task 32; keep to the request.
7. `LevelPart.svelte` has four imports at column 0 (`Frames`, `Hover`, `Paint`, `tagFacts`) that Biome does not check in `.svelte`.
8. Coverage gaps against the plan's test list: no test for the light on a thing a tap would pick (`Hover` kind `pick`), and none for the Box-shrinks case above.
9. WebKit and Firefox have not run on this change; the PR criteria already say so.

## Screenshots

Taken at ce75a38, English, signed in on the links game, Room 2. Each size has: level-pick, paint-tray, paint-painted, paint-way-closed-note, show-menu, show-on, hold-open, hold-box-painted, pencil-hover, ground-in-list (a few are missing at sizes where the Hold tab or the list is not drawn at that size).

## Cycle 2: re-check of the two reds at d8a9579

Written 2026-11-17 05:33 UTC (from `date`), by the same fresh review session. Examined: d8a9579 (the fix round d8a9579, with main bfc9b72 merged in). Diff read since ce75a38: `Paint.svelte`, `words/panels.ts`, `tests/features/levels/Holder.svelte`, `paint.browser.test.ts`, the main merge (`package.json`, workflow tests, another audit file); none of the merge touches a file this audit named.

| Red | Result | Evidence |
|---|---|---|
| 1. Box pulled back onto only a thing's spot | **PASS** | `reach()` now treats `occupied` like `same` and puts the level back to how it was. New test "a Box pulled back onto only the spot a thing stands on…" passes (Chromium, 11 of 11 in `paint.browser.test.ts`): level equals the original, no step back added, "Something is already there" said. The test's `Holder` drops an unchanged step; I checked that the real page does the same (`World.svelte` `edit` goes through `inLevel`, which returns the same edits when the level did not change). |
| 2. "Hold" tab not plain words | **PASS** | The folded tab reads "More ways" in all nine languages (`words/panels.ts`); `phone-hold-open.png` and `phoneSideways-paint-tray.png` show it fits with Box, Fill and Erase under it. |

Other checks at d8a9579: `pnpm lint` clean (same single warning), `pnpm typecheck` clean, `pnpm knip` clean, `pnpm test:node` 93 files, 1156 tests passed. WebKit and Firefox still not run here.

New note: the folded button's accessible name is the long sentence ("Hold with your free thumb, or tap to keep on") while the visible word is now "More ways", so a voice-control user who says "More ways" will not match it. Make the aria-label start with the visible words. Not blocking.

Screens re-shot at d8a9579: `<device>-paint-tray.png` and `<device>-hold-open.png` for phone, ipadUpright, ipadSideways, computer, phoneSideways. The other screens did not change.
