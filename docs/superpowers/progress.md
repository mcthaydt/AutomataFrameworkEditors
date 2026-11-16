# Progress

The tracker every stage reads first and updates last. It keeps **only open work**, one short line per task
(the Owner, 2026-11-16); finished and parked work moves to [`history.md`](history.md), which threads read only
when asked. One section per cycle; newest first.

## Task 6 and Task 7 part 1 reverted (2026-11-15)

The Owner said (2026-11-15) that the editors were built before their mockups were shown, and chose to revert what had
already merged on that path: Task 6 (pull request 28) and Task 7 part 1 (pull request 45). This pull request reverts
both merge commits and nothing else; pull request 47 (Task 7 parts 2 and 3) was closed unmerged. Tasks 1 to 5, the
framework pin and every document stay. No editor is built until the Owner approves the revised mockups. Nothing was
run; the pull request's checks are the test.

## The mockups of all five editors: the grill, one editor at a time

The Owner asked (2026-11-15) for a harsh critique of the round-three mockups (pull request 34, at `84986a8`), one
editor per round, held against how well-known iPad apps differ from their desktop versions. Round 1 of 5, the shell
and World, is written, 100%:
[`audits/2026-11-15-editor-mockups-grill-1-shell-and-world.md`](audits/2026-11-15-editor-mockups-grill-1-shell-and-world.md).
Its verdict: a tidy desktop layout at touch sizes, not yet an iPad app. 33 findings (12 High): the level covers 28%
of a sideways iPad; Delete, Duplicate, Erase and placing a thing are drawn on no screen; nothing stands in for the
keyboard's modifier keys or the mouse's precision; play in place shows no touch controls; sliders hide their numbers.
The Owner answered its three questions yes (2026-11-15): the left panel starts closed on the iPad; Play, Undo and
Redo move to the top bar; Tiles opens on the test patch. The Owner then set three more rules the same day: one
editor at a time, moving on only when the Owner is satisfied (so the shell and World are grilled again after each
round of fixes); LDtk is World's big inspiration; no auto-tiling rules at launch, and nothing may tie the editors to
2D only, since they will serve 3D later. What World takes from LDtk, with each pick checked for iPad and for 3D, is
[`audits/2026-11-15-world-what-to-take-from-ldtk.md`](audits/2026-11-15-world-what-to-take-from-ldtk.md): written,
100%; the Owner answered its three questions yes (the picks that need only drawing join this round; values and
links on things, and the world map, are drawn now and each gets a framework spec). The Owner also ruled that the
Apple Pencil gets first-class support; the shell and World are held to that in
[`audits/2026-11-15-editor-mockups-grill-1b-apple-pencil.md`](audits/2026-11-15-editor-mockups-grill-1b-apple-pencil.md):
written, 100%, 13 findings (3 High), no question open. Rounds 2 to 5 (Characters, Feel, Sound, Story) wait for the Owner. Overall:
20%. Nothing was run.

