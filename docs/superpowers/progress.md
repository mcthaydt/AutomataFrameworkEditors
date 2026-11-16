# Progress

Last updated: 2026-11-16 17:16 UTC (from `date`).

## Active milestone: the World slice (roadmap slice 3)

About two thirds built. The World editor plan has 19 pull requests; 1 to 10 are merged. The plan, its spec and its plan
audit were removed with the earlier workflow (#93) and are read from `8109888`:
`docs/superpowers/plans/2026-11-16-world-editor.md`, `docs/superpowers/specs/2026-11-16-world-editor-design.md` and
`docs/superpowers/audits/2026-11-16-world-editor-plan-audit.md`.

### Current work

- Installing the new workflow and its CI gate (this repo's setup pull request).
- Next: plan pull requests 11 and 14, side by side.

### Completed outcomes

| Plan PR | What | Editors PR |
|---|---|---|
| 1 | The WebKit sign-in journey | #78 |
| 2 | Pin 1, the rules for the new features, two test games | #79 |
| 3 | The look, the device, the kit and nine languages | #80 |
| 4 | Several files in one change (the API) | #81 |
| 5 | What a person holds (pure) | #84 |
| 6 | Level and map edits (pure) | #88 |
| 7 | The shell's frame | #86 |
| 8 | The team's files (the API) | #85 |
| 9 | Levels on screen: Pick, Place, Erase | #91 (`8109888`) |
| 10 | First run, Settings, Help, the keys | #90 |

The framework pin here is `7ff5795`.

### Remaining

| # | Pull request | Tasks | Needs |
|---|---|---|---|
| 11 | The map on screen | 29, 30 | 6, 7, 9: ready |
| 14 | Play in place | 35 | 9: ready |
| 12 | A thing's settings and Join; Paint, Show and the Pencil | 31, 32 | 9, 10, 11 |
| 13 | Putting changes in, problems in plain words, offline | 33, 34 | 4, 5, 7, 8, 9, 11 |
| 15 | Checking someone's changes; whose to keep | 36, 37 | 13, 14 |
| 16 | The team, notes, the helper's ghost and Find | 38 to 40 | 8, 12, 13 |
| 17 | Pin 2 (its own PR), then one step, slow, back 30 seconds, play from here, doors, a game with a problem | 41, 42 | 13, 14; framework F1, F2, F4, F5 |
| 18 | Drawn behind, with the hero, in front | 42a | 12, 17 |
| 19 | Every journey at every size, the four layout fixes proved, the documents and the close | 43, 44 | all |

Order: 11 and 14, then 12 and 13, then 15 and 16, then 17, then 18, then 19. 11 and 14 both add a line to
`World.svelte`, as do 12 and 13: the later one merges `main` in before it goes ready.

Not built inside plan PR 9, for later pull requests: drag-in from the tray; the Add-a-note menu rows; the Pick-several
loop; free-thumb Box erase; bring-to-front (Task 42a, PR 18); the ring handles (drawn, do nothing yet). Changed from the
plan: the Settings arrows and the pad move one tile per tap. A fix with no regression test yet: WebKit's ResizeObserver
needed a shrink-to-fit width plus a synchronous size update in `LevelPart`.

Then the rest of the slice: test the editor at iPad, phone and computer sizes (mostly PR 19); the website demo uses
World (Site, with Examples); and the design drift check.

### Blockers

None.

### Previews

- CI's pictures: the `ci-screens` branch (`main/` and `pr-<n>/`).
- The approved mockups: `docs/mockups/` (board v17, #70).

### Material decisions

- The Owner's: mockups first, World's approved (2026-11-16); the slice exit gate (2026-11-16): the slice does not close
  and Characters does not start until every World screen has had a design drift check against the approved mockups
  (fix the drift, recheck), recorded with what it covered and that the recheck passed.
- Decided in the plan's fix round without an Owner answer: locked and hidden last only for the visit ("Locked until you
  close the game"); a turn-down closes at once, keeps the branch, and Undo reopens it; "Try a change" is left out;
  unbuilt editors never say "Comes later" or "Soon"; the editor reads, never writes, tileset PNGs.
- Agent-selected, 2026-11-16: the design drift check's record goes in
  `docs/superpowers/audits/<date>-slice-3-design-review.md`, with a `Scope:` line and `Recheck: passed`, and the
  approval under "Approved screens" in `history.md`.
