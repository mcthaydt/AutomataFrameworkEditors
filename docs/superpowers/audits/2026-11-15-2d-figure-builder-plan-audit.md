# Plan G (the 2D figure builder): plan audit

Stage 3 of Cycle 4 (the 2D figure builder, Characters' Figures part). Audited:
[`plans/2026-11-15-2d-figure-builder.md`](../plans/2026-11-15-2d-figure-builder.md) as written in pull request 36
(`76d80e8`), against [`specs/2026-11-15-2d-figure-builder-design.md`](../specs/2026-11-15-2d-figure-builder-design.md)
(pull request 29), the code on `main` (`d853073`), the Blueprint redesign's spec, plan and zoom amendment, the
framework's spec and plan R (AutomataFramework pull requests 104 and 109), the old Studio in AutomataFrameworkFailed at
`ed8592e8`, Examples' plan D and both trackers. Its partner is the framework's
[`2026-11-15-rigged-figures-plan-audit.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/audits/2026-11-15-rigged-figures-plan-audit.md)
(findings I…, Q1, Q2). Nothing was run: every fact below is read from the files, or is said to be unchecked.

**Verdict: ready for execution once its three gates open and the fixes below are in the plan; they are, in this pull
request.** No critical finding, eight important, four minor. No Owner question is opened here. The framework audit's
Q1 is settled: the Owner moved the games' art to Lospec's DUEL palette (256 colours), and the UI keeps its own (2026-11-15). It
touches this plan only through "Add a colour" on the demo game (G-M3). No new dependency.

## The questions the coordinator asked

1. **Owner decisions.** The builder is as powerful as the old Studio and its file (Look, Move, Pose, Players and
   Play; sliders, pieces, face, colours, walk, stand, poses by hand and by joint, three views, players' colours); the
   Studio's Animate is clips, which is another part, as the Owner said (Q1), and Move only watches them. People,
   animals and free shapes (Tasks 3 to 15). New figure (Task 16). Move switches are not here (Characters' Clips and
   kinds part). **No Editors-side build before the Owner approves the mockups of all editors** is gate 1, word for
   word, and the plan adds that where the approved mockup differs, the plan is amended first: right.
2. **"The page paints the pictures at save and the API only checks their size."** Held (G-I4), with three conditions
   now in Task 2. The reason holds: the API runs in a Cloudflare Pages Function, whose time is short, and painting a
   whole sheet is the framework's slowest work, while `atlasOf` and a PNG's header are cheap. What makes it safe is
   that a picture whose pixels are not the file's fails `artProblems`, which compares bytes (`content/art.ts`), and
   `automata check` runs it: every game `automata create` makes has `"check": "automata check"` in CI. Two holes: a
   change to a file other figures use left their pictures stale (G-I3), and Examples' CI does not run `artProblems`
   yet (plan D's Task 9.1 adds it before any figure lands there; said in the ruling). And one cheap check is added:
   the picture's colour table must be the painter's, which plan R's new `pictureColours` gives without painting, so a
   picture recoloured outside its file is refused at save, not only in CI. An Edit-level save still lands before CI,
   as every content save does; the Site shows only green commits.
3. **"A behaviour file can't set which way a figure is seen."** Plan R's reading, checked there and sent to the Owner
   as its Q2. This plan shows views in the builder only; nothing here changes either way.

## Important

**G-I1. The pull requests needed parts of plan R that come later.** PR 1's Task 2 adds `list` with `listContent`, and
PR 4's Task 10 lists a game copy of a walk; both were plan R's Part 6, but PR 1 said "Parts 1 to 3". PR 2's Task 4
consumes `frameName` (plan R Task 13, Part 4) and Task 3 consumes `ANIMAL_SLIDERS` (Part 5). And plan R read as if
none of its names were public until its Task 19. **Fixed, in both plans:** plan R's writer is its Part 0, built first,
and PR 1 needs Parts 0 to 3; `frameName` is plan R's Task 5; `ANIMAL_SLIDERS` is Task 14's; plan R exports every name
as the task that makes it lands.

**G-I2. One commit of several files is new GitHub work, not "only if".** `github/repo.ts` has one writer,
`saveFile`, on GitHub's contents route: one text file a commit. A figure's save is three files at least, one a PNG.
**Fixed:** Task 2 adds `saveFiles` on the git data routes (a blob each, one tree on the head's, one commit, the ref
moved without force), with the versions compared before and a refused ref move answered `changed-elsewhere`, so
nothing is half written; the pretend GitHub serves the four routes; `repo.ts`, the pretend GitHub and a `repo` test
are in its files. **Also:** `wholeGameLoads` reads every listed file with one call each, and a save now adds a blob a
file; a Pages Function on the free plan may make 50 calls a request. A test now counts the calls for a game of 40
files and fails above 45, with the trees route as the way down if it does. Which plan the editors' Pages project is
on was not checked (no access from here); the tracker is to say.

**G-I3. A shared file's change left other figures' pictures stale.** `filesOf` sent this figure's picture only.
Change the game's own gait that two figures walk with (Task 10's ruling says the save "says which other figures use
it") and the other figure's picture is now older than its file: `automata check` fails, and on an Edit save `main` is
red. **Fixed:** `filesOf` paints the game with the work laid over it and sends every picture and atlas that differs;
the API refuses a change that alters a figure's sheet without its picture; over 24 files or 6 MB the page says so
before sending.

**G-I4. The painting ruling, held with conditions.** See question 2. **Fixed:** the colour-table check, the
repainted pictures and the note on Examples' CI are in the ruling and Task 2.

**G-I5. The editors' own rule says they write only JSON.** `CLAUDE.md`: an editor "opens, writes and exports only the
content files (JSON) a game's `automata.toml` lists". The builder writes a PNG and an atlas beside each figure (the
Owner's earlier decision that pictures are committed by the editor's save) and one `[[content]]` block in
`automata.toml` (the Owner's Q5). Both are the Owner's, but the rule a later session reads still forbids them.
**Fixed:** a Global Constraint, and Task 2 changes that line of `CLAUDE.md`; nothing else in `automata.toml` is ever
written, and only by `listContent`.

**G-I6. Places follow plan R into units.** Plan R's audit (I8) made a place's `x` and `y` units from the hips, so a
pose survives a change of height or legs. **Fixed:** `movePlace` converts the touch to units and writes those.

**G-I7. Gate 2 missed two of the redesign's tasks it builds on.** Task 4 changes `GameHome` (the redesign's Task 15,
"your games, a game's page") and every panel shows problems in place as the redesign's Task 16 does; gate 2 named only
Tasks 7 to 13, 17 and 19. **Fixed:** 15 and 16 are in gate 2.

**G-I8. A waiting figure save could never be approved.** Found by the scenes builder's audit (its E1, Editors pull
request 42) and added here, since this plan builds the save of several files first. `service/approve.ts` (step 2)
refuses a waiting change unless every path it touches is a listed content file, and `service/waiting.ts` says the
same through `here`; a figure's save always carries a picture and an atlas, and a new figure an `automata.toml`
block, so a Suggest person's figure would wait for ever. **Fixed:** Task 2 adds one `allowedPaths` in
`service/changed.ts`, which the save route, `approve.ts` and `waiting.ts` call, and which the scenes builder and Feel
reuse: listed content, a picture or atlas beside a listed figure or backdrop, and `automata.toml` only when its whole
change is `listContent`'s added blocks; the sharing file never. Approval loads the game with the head's project file
when the change writes it.

## Minor

- **G-M1.** Only the pieces had a test that every framework name shown on screen has words in nine languages. Now
  sliders, face styles, gaits, stands, the library palette's colour names, bones and places do too, so a name a later
  pin adds is red until it is translated.
- **G-M2.** The draft was keyed `af.draft:<owner>/<name>:figure:<id>`; `game/draft.ts` keys a level by its path. Now a
  figure's draft is keyed by its file's path too: one shape.
- **G-M3.** The games' art is in Lospec's DUEL palette, 256 colours (the Owner, 2026-11-15: "We can just use the duel 256
  palette from lopsec for the games, use current the palette for UI"; Lospec has no 128-colour DUEL), and Examples' CI holds the demo's pictures to
  the framework's `DUEL_COLOURS`. The library's ramps are DUEL's 32 rows (plan R Task 1), so picking any of them is fine; a colour mixed by
  hand in "Add a colour" may not be. **Fixed:** on the demo game, "Add a colour" offers the library's DUEL ramps only. Another
  game's own rule is its own; the builder offers it the same rows first. The editors' own look keeps palette No. 310.
- **G-M4.** The tracker has two "Cycle 4" sections (this one and the environment builder's). Left as they are; the
  titles keep them apart.

## Checked and fine

- The layers the plan names (`words` … `levels`, `figures`, `find`, `suite`) match `tests/architecture/rules.ts` but
  for `figures` and `find`, which Task 3 and the redesign add; `PAGE_SIDE` gains `figures`.
- `tests/fixtures/banned.ts` exists and takes the plan's new words; "frame" and "sheet" are banned on screen only, so
  the redesign's `Sheet` component and the "frame" in code are fine.
- `af.draft:…` is on `CLAUDE.md`'s list of what the device may keep, as are `af.tip.*`.
- The redesign plan's names (`Frame`, `Pill`, `Cluster`, `Switcher`, `ComingSoon`, `Sheet`, `TitleBlock`, `Tip`,
  `FindBar`, `commands.ts`, `shapeOf`, `roomFor`, `WORDS`, `loadLevelArt`) are that plan's own.
- The access levels are one per game (`access/levels.ts`), so the spec's "someone whose level lets them change every
  file it touches" is any Edit or Owner person; a Suggest person's palette change is one waiting change with the rest.
- Spec coverage is as the plan's self-review says.

## What was not checked

- The editors' Cloudflare plan and its call limit (no access to the account from here).
- How fast `paintFrame` is on an iPad; the plan's ruling is to measure at the Owner's review.
- Anything about the approved mockups: they are not made yet, and gate 1 says the plan is amended when they are.
