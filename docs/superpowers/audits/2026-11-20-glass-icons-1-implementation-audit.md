# Glass and icons: implementation audit, cycle 1

Lane 2 implementation audit of pull request #119 ("glass everywhere, z-layer glass tokens, icons over text"), by a fresh
session that did not build it. Examined commit: **1381e6a** (branch `claude/project-thread-uww3fk`). Brief:
`/mnt/project-files/handoff/world/glass.md`. Reviewer: Opus 5.5, medium.

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec
and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete
integrations. Do your best work.

## Verdict

Not ready to merge: **3 red**, 5 notes. The token scale, the architecture gate, the icon buttons and their names are
sound; the reds are one rendering defect that undoes the z-layer scale on every dialog and side sheet, and two gaps
against the brief's "no solid panel anywhere" and mockup instructions.

## What ran (all at 1381e6a)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors |
| `pnpm lint` | exit 0 (1 warning, 3 infos, all in files this PR does not touch) |
| `pnpm knip` | exit 0 |
| `pnpm test:node` | 94 files, 1163 tests passed |
| `tests/architecture/glass.test.ts` copied onto main (bea5033) | 4 of 4 fail, as claimed |
| Draft CI on 1381e6a | every check green (quick gate, quick check, chromium 1–6/6, engines, screens, mockups, commit-authors) |
| Commit identity, 5 commits | author and committer McThayDT, no trailers |
| PR body | matches `/mnt/project-files/pr-bodies/glass-icons.md`; last line "Requested by **McThayDT**"; still a draft |
| `verify` from a fresh clone of 1381e6a, Chromium, 390×844, 834×1210, 1280×800 | language, welcome, Try it now, the welcome card closed by its ✕, Show, the game menu, Help: all worked |
| Contrast measured from pixels (mode colour of each `.glass-n` box vs each text colour in it) | lowest 6.34:1 (quiet words on a dialog), 6.35 (menu), 6.4 (welcome card); words 10.6–15.1 |
| Same with `prefers-reduced-transparency: reduce` and `prefers-contrast: more` (CDP media emulation) | every layer solid `#252525`; lowest 5.58:1 |
| Every after shot at ipadUpright, phone and computer looked at in contact sheets; zoomed where needed | see findings |

Not run: WebKit and Firefox (the full run after fixes), the journeys locally (CI ran them green on the draft), blur cost
on a real iPad (not measured, as the PR says).

Existing tests the PR says it changed (read first): `tokens.test.ts`, `screens.journey.test.ts`,
`paint-and-pencil.journey.test.ts`, five browser tests that now find icon buttons by spoken name, and
`map-arrange.browser.test.ts`. None was loosened to hide a defect: each still checks the same behaviour, the
map-arrange change narrows "no tooltip at all" to "no tooltip holds that sentence", which follows from the ⋯ button
now having a tooltip by the brief's own rule.

## Acceptance criteria

| Brief | Verdict | Evidence |
|---|---|---|
| 1. Every surface glass, all listed | **Fail** (red 2) | `team/WaitingChange.svelte` (4 screens) is still a white solid page and is not named in the PR; Share and Waiting are named, by the lead's call |
| 2. Blur and dim from one place, by layer; a test fails on a component's own | Tokens pass; **drawn result fails** (red 1) | `glass.test.ts` passes here, fails on main; but the drawn dialogs and side sheets do not get their layer's blur |
| 3. Icons over text, spoken name and tooltip, nine languages, listed | Pass | 0 icon-only buttons without a name; every new one has `title`; names come from existing nine-language words; `languageUse` now starts with the shown name in all nine |
| 4. Readable over busy and plain, measured; calmer glass on request | Pass | numbers above |
| Mockups updated where the look moves them | **Fail** (red 3) | `docs/mockups/` unchanged; PR says the app now differs from them |
| Layout sketch, before/after at five sizes, contrast in PR | Pass | in the PR body; 280 before, 337 after |
| "More ways" spoken name starts with its words | Pass | `Hold.svelte` aria-label now `holdLabel: …`; screens rule enforces it on every screen |

## Red findings

### R1. Dialogs and side sheets lose their own blur: the dim around them cuts it off

- UNIT: `src/features/ui/ui.css` (`.dim-2`, `.dim-3`) and the wrappers that hold a sheet inside a dim:
  `shell/Welcome.svelte`, `shell/Help.svelte`, `shell/Keys.svelte`, `shell/Settings.svelte`, `team/KeepCopy.svelte`,
  `team/PutSheet.svelte`, `team/WaitingSheet.svelte`, `levels/Popups.svelte` (`.center.dim-2`).
- VERDICT: red.
- REQUIREMENT: brief outcome 2, "menus and sheets more, dialogs the most"; the owner's "blurriness and dimming should be
  z layer based".
- REASON: `.dim-2` and `.dim-3` set `backdrop-filter: blur(2px|6px)`, and the `Sheet` (`glass-2`/`glass-3`) is their
  child. An element with a backdrop filter is a Backdrop Root, so the sheet's own `blur(24px|32px) brightness(…)` sees
  only what is inside the dim, not the level. What a person sees through a dialog is the level blurred 6 px; through a
  side sheet, blurred 2 px.
- EVIDENCE: (a) `computer-put-sheet-asks.png` (after): the settings panel's words "Every … for this …" and "Look" are
  readable through the Put in game sheet's footer, zoomed in `/mnt/project-files/screens/glass/audit-1/crop-ghost.png`.
  Words cannot be read through a 24 px blur. (b) Welcome card at 1280×800: removing only the parent `.dim-3`'s backdrop
  filter changes the card's empty glass from `(37,41,43)` to `(32,34,36)` (`audit-1/v4-side.png`, left as shipped,
  right without the parent's filter), so the card's own filter was not reaching the level. (c) Measured over the same
  sky, the layer-3 Welcome card's glass is `#232729` and the layer-2 note above it `#16191c`: the dialog is drawn
  lighter and more see-through than the layer below it, the reverse of the scale. `glass.test.ts` checks the tokens'
  order, not what is drawn, so it passes.
- EXPECTED: a sheet or dialog blurs and darkens the level by its own layer's tokens, and the drawn order is 1 < 2 < 3.
- FIX: keep the dim's blur off any ancestor of a glass surface: either make the dim a sibling drawn under the sheet
  (the way `TopBar`'s `.dim` button already is) or drop the dim's own backdrop filter and keep its colour. Add a check
  that fails today: a browser test that opens a dialog and a side sheet and asserts no ancestor of a `.glass-n` element
  has a computed `backdrop-filter` other than `none`. Files: `ui.css` and the wrappers listed above, plus the one new
  test.

### R2. The waiting-change pages are still a white solid page, and the PR does not name them

- UNIT: `src/features/team/WaitingChange.svelte` (scenes `waiting-change-as-approver`, `-as-its-author`,
  `-failed-checks`, `-gone`).
- VERDICT: red.
- REQUIREMENT: brief outcome 1, "No solid panel is left anywhere. … list them in the PR".
- REASON: its five `<Screen>`s have no `glass`, so a person goes from the dark editor to a white page, the jump the
  owner called jarring. The PR names only Share and Waiting as left by the lead's call.
- EVIDENCE: `src/features/team/WaitingChange.svelte:130,132,137,142,152`; `after/*-waiting-change-*.png` at every size.
- EXPECTED: either glass like the other plain pages, or named in the PR as left by the lead's call (PR 15 deletes it).
- FIX: add `glass` to those five `<Screen>`s (and check its `Notice` and buttons read on the card), or, with the lead's
  call, add it to the PR's "Left as they are" line. Files: `WaitingChange.svelte` or the PR body only.

### R3. The approved mockups still show solid panels and word buttons

- UNIT: `docs/mockups/` (the shell and World screens: toolbar, top bar, sheets).
- VERDICT: red, unless the lead rules it out of scope.
- REQUIREMENT: the brief, "Where the new look moves a mockup or a picture check, … update it with before and after
  noted in the PR, and say which moved"; `this-repo`: the approved mockups stay the reference for the shell and World
  screens.
- REASON: the PR leaves them unchanged and says the app now differs from them, so the reference later builders (PRs 15
  and 16) read contradicts the owner's instruction.
- EVIDENCE: `git diff --stat origin/main...1381e6a -- docs/mockups` is empty; PR body, "No golden moved".
- EXPECTED: the shell and World mockups show the three glass layers and the icon buttons, with the moved ones listed.
- FIX: update `docs/mockups/mockup.css` and the shell/World mockup pages' buttons and panels to the new look, list them
  with before and after in the PR; or record the lead's call to leave them in the PR body. Files: `docs/mockups/` or the
  PR body only.

## Notes (not blocking, not fixed here)

- N1. The glass gate does not catch a panel painted with an allowed fill token (`--raised`, `--ground`, `--hover`): a
  new sheet could be solid `#2a2a2a` and pass. Today those tokens are used only on buttons, inputs and small inner
  boxes (checked by grep at 1381e6a). A follow-up could name the panel-sized elements the rule watches.
- N2. On a phone or iPad the five tools are now icons only and a tooltip never shows on touch, so ⊕ Place, 🔗 Join and
  the brush/eraser are learnt only from the tour or Help. This is the owner's asked-for direction and the sketch was
  shown to them; worth one line in the owner's update. (The tiny key letters V A B E L under the iPad tools in the
  shots were already there on main.)
- N3. Pre-existing, also on main (bea5033): on a phone, the Show panel stays open when the top bar menu opens and is
  drawn over the menu, covering Help (`audit-1/v3-main-390-menu-over-show.png`, `audit-1/v2-std-390-menu.png`). Worth
  its own thread.
- N4. The PR's contrast table is a model over a flat colour and covers only `--words` and `--glass-quiet`; accent and
  problem words on glass are not in it. The pixel measurements above (lowest 6.34:1) cover the screens driven here;
  the full set is not measured.
- N5. Draft-CI note: the lint warnings are in `scripts/screens-touched.ts` and `tests/features/session/session.test.ts`,
  neither touched here.

## For the fix round

Fix R1 to R3 (R2 and R3 may each close with the lead's recorded call). A second cycle re-reads only the fix diff, re-runs
the R1 check and looks again at the dialogs and side sheets at the three sizes.
