# Glass and icons: implementation audit, cycle 2

Lane 2 re-audit of pull request #119, the fix diff only: **e4f61b0..d961ead** (one commit, d961ead). It is read against the
cycle 1 audit (`2026-11-20-glass-icons-1-implementation-audit.md`, three reds and five notes) and against the owner's
three notes of 2026-11-20 that the same commit carries. Reviewer: Opus 5.5, medium, the same session as cycle 1.

## Verdict

**No red left. Ready for the full run.** R1 is fixed and measured from the pixels. R2 and R3 are closed by the lead's
calls, which are now recorded in the PR body. The owner's three notes are done. Two new notes follow.

## What ran (at d961ead, fresh clone from GitHub)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors |
| `pnpm lint`, `pnpm knip` | exit 0 (the same 1 warning and 3 infos as cycle 1, in untouched files) |
| `pnpm test:node` | 1161 passed. Against 1163 at 1381e6a, four pinned word tests are gone and two glass tests are new (see below) |
| The new `glass.test.ts` run on the cycle 1 sources (e4f61b0) | "a dim blurs on a layer under what it holds" fails, and so does the dim-rule check, as they should |
| `verify` at 1280×800 and 1210×834, Chromium | welcome card, the card closed by its ✕, a crate picked, the move pad's right arrow moves it ("Keep a copy" appears) |
| Commit d961ead | author and committer McThayDT, no trailers; its parent is the cycle 1 audit commit e4f61b0 |
| PR body | last line "Requested by **McThayDT**"; names R1's fix, the calls on R2 and R3, and the changed tests |
| Draft CI on d961ead | still running when this audit was written; see the report message |

## Existing tests the fix changed (read first)

- `tests/features/words/words.test.ts`: its pinned-word table drops `moveLeft`, `moveRight`, `moveUp` and `moveDown`
  because those English-only `WORDS` entries are deleted. The pad now speaks `levels.padLeft` and the rest, which say
  the same English words ("Move left" and so on) and are in all nine languages, where the old ones were English only.
  Nothing was loosened to hide a defect. See N6.
- `tests/features/world/insets.test.ts`: the room kept for the settings panel goes from 296 to 308 and for its tab from
  44 to 52. That follows the owner's "it's hugging the edges" note, and the PR body names it.
- `tests/journeys/move-the-crate.journey.test.ts`: it finds the arrow by the pad's own words instead of the deleted
  `WORDS.moveRight`, and still checks the same thing.
- `tests/architecture/glass.test.ts`: the dim check now reads `::before`, and two tests are new (R1, N1).
- `tests/features/ui/tokens.test.ts`: the contrast check per layer now covers `--accent`, `--agent` and
  `--problem-words` (N4).

## The cycle 1 findings

| Finding | Now | Evidence |
|---|---|---|
| R1. A dim's blur cut off the sheet's own blur | **Fixed** | The dim is a `::before` under the sheet, and the holder has only `isolation: isolate`, which does not make it a backdrop root. Live at d961ead: no glass surface has an ancestor with a backdrop filter, a filter or opacity under 1, on the welcome card or in the editor. Same patches of the Welcome card as cycle 1: `(30,32,32)` and `(30,32,34)`, which matches cycle 1's "parent filter removed" control `(30,32,32)` and `(32,34,36)` and is darker than cycle 1's `(35,38,39)` and `(37,41,43)`. Across the crate behind the card, the profile is now flat at 30 (cycle 1: 35 to 38), so the crate is blurred away. Put in game side sheet, the footer patch where the panel's words showed through: standard deviation 2.3 in `after/` and 0.3 in `after-2/` (no words are readable) |
| R2. WaitingChange still white, not named | **Closed by the lead's call** | PR body, "Left as they are": WaitingChange and its four scenes, which PR 15 deletes |
| R3. Mockups not updated | **Closed by the lead's call** | PR body: the mockups are out of date by the owner's instructions, and the lead records the same in `progress.md` |
| N1. The gate misses a panel painted with `--raised` or `--ground` | Fixed | new test "no element that wears a layer paints its own background" |
| N4. Contrast covered only words and quiet text | Fixed | the accent, agent and problem words are checked on every layer; `--problem-words` is `#ff8a80` |
| N2, N3, N5 | Unchanged, as expected | the owner's direction (N2); a pre-existing bug, its own thread (N3); untouched files (N5) |

## The owner's three notes of 2026-11-20

- (a) **One-card pages centred, from one rule.** Pass. `.look.centred` in `ui.css` is used by `Screen` (glass),
  `Games` and `Language`. `safe center` keeps a tall card from being cut off. In `after-2/` the welcome, Pick a game,
  can't-open, broken, not-a-game and language cards sit in the middle both ways at phone, phone sideways, both iPads
  and the computer, which answers the owner's picture `owner-notes/1-cant-open-card-not-centred.png`.
- (b) **Settings panel padding and gap.** Pass. Live at 1280×800 the panel runs from 972 to 1272 across and 64 to 792
  down: 8 px from the right and bottom edges and 8 px from the level, whose right edge is at 964. At 1210×834 it is
  902 to 1202 and 64 to 826, with the level ending at 894. The body padding is 16 px (`--space-3`). The panel, the list
  rail and Join's card wear `glass-1` or `glass-2` again.
- (c) **An even cross of move arrows.** Pass. Four buttons of 52×52 in a 3×3 grid, each with a spoken name and a
  tooltip ("Move up", "Move left", "Move right", "Move down"), from words in all nine languages.

## Notes (not blocking)

- N6. The pad's spoken names are no longer pinned by `words.test.ts`, since the pinned entries were deleted with
  `WORDS.move*`. The same English words now live in `levels.pad*`, which are not in the pinned table. A follow-up could
  pin `padLeft` and the rest if the plan wants those exact words held.
- N7. The bottom arrow sits at the panel's foot. At iPad upright, in the pulled-up settings sheet,
  `after-2/settings-where-ipadUpright.png` shows the down arrow cut in half until the sheet scrolls. At 1280×800 the
  panel body scrolls by 8 px (scroll height 681, height 673), so the arrow shows whole but the padding under it is cut.
  It works and is reachable by scrolling; it would look tidier if the whole cross showed at first sight.

## Addendum: the N6 and N7 fix, examined at efdccd0 (head 4d0e3f6)

Range read: c3fade0..efdccd0 (one commit, efdccd0). The two merges around it are clean, with no conflict changes in
`git diff-tree --cc`: c3fade0 brings main 84c7222 onto b026b9a, and 4d0e3f6 brings main 8026ccd, whose diff against its
first parent is the one `concurrency.group` line in `.github/workflows/ci.yml`, the same as main's #121. At 4d0e3f6, on
a fresh clone: typecheck 0 errors, lint and knip clean, 1162 node tests pass (one more than at d961ead: the new pad
words test). Shot and measured live: the settings panel with a crate picked at 390×844, 844×390, 834×1210, 1210×834
and 1280×800 (`/mnt/project-files/screens/glass/audit-1/c3-*-settings-4d0e3f6.png`).

- N6: **fixed.** `words.test.ts` pins "Move up", "Move left", "Move right" and "Move down" in English, and checks that
  each of the nine languages gives four different, non-empty names.
- N7: **fixed at four sizes, and a new red at phone sideways.** The arrows are now 44×44 in a pinned foot outside the
  scrolling body, and the Done or ✕ button sits 9 px from the panel's edge (it was 5). Whole, with the foot's 8 px
  padding under the down arrow: 390×844 (down arrow ends at 827, panel at 836), 834×1210 (1193 and 1202), 1210×834
  (817 and 826), 1280×800 (783 and 792). One tap on "Move up" moves the crate at every size.

### R4. On a phone held sideways, the pinned arrows leave the settings a 32 px strip

- UNIT: `src/features/shell/SettingsPanel.svelte` (`.foot`) and `src/features/world/Panels.svelte` (the `foot`
  snippet).
- VERDICT: red (introduced by efdccd0).
- REQUIREMENT: N7's own aim, that the arrows show whole where they are held and the settings stay usable; the
  drunk-grandma rule (nothing hidden that needs explaining); the five sizes CI checks.
- REASON: the pulled-up settings sheet at 844×390 is 234 px tall (148 to 382). The pinned foot of three 44 px rows takes
  most of it, so the part that scrolls is 32 px: only "WHAT IT DOES" shows, and the down arrow ends at 383, past the
  panel's 374 inner foot.
- EVIDENCE: live at 4d0e3f6, body `scrollHeight` 496 against `clientHeight` 32, and the screenshot
  `audit-1/c3-phoneSideways-settings-4d0e3f6.png`. At d961ead the same sheet's body was 179 px tall (676 against 179).
- EXPECTED: at every size a person sees some of the settings and the whole cross, or the cross scrolls with the settings
  when the sheet is short.
- FIX: pin the foot only when the panel has room, for example the side panel and a sheet taller than about 400 px, and
  let the arrows go back into the scrolling body otherwise. Add a phone-sideways case to the new screens rule, or a check
  that the scrolling part keeps a minimum height. Files: `SettingsPanel.svelte`, `Panels.svelte`, and the screens
  journey rule.

Verdict of the addendum: **fail, 1 red (R4).** Everything else in the range passes.
