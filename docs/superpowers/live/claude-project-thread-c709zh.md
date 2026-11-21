# Design round 1 fixes: resumed 2026-11-21 (new project), in progress

- Current task: design round 1 reds, groups 2 to 5, then journeys, pictures and one draft pull request (lane 2).
- Last commit: 4e88efd (groups 4 and 5 in code); main merged in at 2785a01.
- Next step: the screens journey and the other journeys on this head; A17 (glass corners) by picture; open the draft.
- Open decisions: none for the owner. Agent-selected: A10/R14 keep the framework's own sentence (said in the PR);
  the top bar's main button keeps its words (only the status goes to its icon); R7 follows the sketch (foot at iPad
  upright) for the check sheet only, while other side sheets stay at the side there (A13).
- Behaviour reds R4, R5, R8, R17: journeys in `approve` and `save-problems` went red on 042ce0d (code before the fix)
  and green after it.

---

## Before the pause (2026-11-20)

The owner paused the fix work on 2026-11-20 15:37 UTC; the rest moves to a new project. Nothing here is a finished
change: no pull request, no merge, no pictures. Kept on the branch on purpose for whoever picks it up.

- Branch: `claude/project-thread-c709zh`, started from main 746c2ca1 (after #128 merged as fa3a853).
- Head: see `git rev-parse --short HEAD` on the branch (the commit that adds this file).
- Findings: `/mnt/project-files/handoff/world/design-round-1-a-findings.md` (A1 to A20) and `-b-findings.md` (R1 to R17).
  Overlaps: A2=R1, A4=R12, A10=R14. Reds only; notes only if the lead says.

## Done in code (group 1)
A1 (quiet mode: key, New level and Whole world, level bar and card hidden while the problem strip or list is open),
A3, R2 (notes stack from one shared stack so cards stop lying on each other: `src/features/ui/noted.svelte.ts`,
exported through `ui.ts` as `stack` and `stacked`), R3 (author notes render inside the Events stack), A5 (helper's
ghost card moved to the top, in the stack), A9 (first-Play tip stands below the play bar), A13 (side sheets sit at
the side at iPad upright too), A19 (`placeCard` gained below-left and below-right candidates), A18 (Stay button 48 px).
A20 is not a fault as the words go: `src/features/device/size.ts` lines ~29-30 (iPad user agent or Mac with touch)
and `src/features/words/bar.ts` lines 46-48 (`onIpad`, `onPhone`, `onComputer`) choose the words by device on purpose.
Only its 11px to 13px size fix belongs in A2.

## Tests that ran on this head (Chromium only; WebKit and Firefox not run here)
- biome, typecheck, knip: clean.
- `pnpm test:node`: 1188 passed (after exporting through `ui.ts`).
- `pnpm test:engine chromium`: 199 passed (run before the last small import and Marks edits; not re-run since).
- Screens journey, all 325 cases with the new rule: passed (before the last small edits; not re-run since).
- New rule "card lying on card" in `tests/journeys/screens.journey.test.ts` went red first on A1, A3, R2 and the map
  key over the bar, then green. Journey checks first-failed: issue-pictures issue 1 (Move card covers none of rooms
  1 to 3), play journey tip below the bar.
- Not run: the other journeys after the last edits, WebKit, Firefox, any before and after pictures.

## Half done / known gaps
- A11 is not started. A12 .. A17, A6, A7, R4 to R17 are not started.
- `Marks.svelte` `.helped` two-tone edge (an `outline`) was dropped: it used a colour literal, which the tokens test
  forbids. It needs a `ui.css` token. Then it would belong to whichever red asked for it.
- A5 (card over a tag) and A13 (sheet over a tag) are not caught by the rule because `.tag` is exempt; check by picture.
- R7 and A13 interact: A13 puts side sheets at the side at iPad upright; R7 wants the check sheet at the foot there.

## Plan for groups 2 to 5 (my picks)
2. Top bar: A2/R1 (names whole, status icon-only when short, no "Levels · " on a phone, 13px line), R4.
3. Phone-sideways sheets: A6, A7, R6, R11.
4. Words and icons: A11 (name my icon picks in the body with a picture), A16, R15, R16, R17, R13, A10/R14 (where the
   sentence is the framework's own, say so and leave it), A12, A15, A18, A20-size.
5. Menus and sheets: A4/R12, R9, R10, A8, A14, R7 (follow the sketch: check sheet at the foot at iPad upright),
   R8 and R5 (behaviour faults: a journey first), A17.
Rules agreed: glass and icons on everything touched, no new sleep, no loosened check, nothing in `.github/workflows/`,
CLAUDE.md or shared skills, framework sentences and key lists not reworded, before and after pictures into
`/mnt/project-files/screens/design-round-1-fixes/`, PR stays a draft until the lane-2 review.

## Main
Main's run 44748205225 at fa3a853: attempt 2 finished `success`.
